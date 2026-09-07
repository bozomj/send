import formidable from "formidable";
import fs from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from "next";
import { uploadFile } from "@/storage/cloudflare/r2Cliente";

// Desativa o body parser padrão do Next.js
// para permitir upload via multipart/form-data.
export const config = {
  api: {
    bodyParser: false,
  },
};

// ==========================================
// TIPOS DE ARQUIVO PERMITIDOS
// ==========================================

const ALLOWED_FILES: Record<string, string> = {
  ".pdf": "application/pdf",

  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  ".txt": "text/plain",

  ".odt": "application/vnd.oasis.opendocument.text",

  ".zip": "application/zip",
  ".rar": "application/x-rar-compressed",
  ".7z": "application/x-7z-compressed",
  ".tar": "application/x-tar",
  ".gz": "application/gzip",
};

// ==========================================
// TAMANHO MÁXIMO
// ==========================================

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // ==========================================
  // 1. MÉTODO HTTP
  // ==========================================

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido. Use POST.",
    });
  }

  try {
    // ==========================================
    // 3. LÊ O ARQUIVO
    // ==========================================

    const form = formidable({
      maxFileSize: MAX_FILE_SIZE,
      multiples: false,
    });

    const [fields, files] = await form.parse(req);

    const fileArray = files.file;

    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

    if (!file) {
      return res.status(400).json({
        error: "Nenhum arquivo enviado.",
      });
    }

    // ==========================================
    // 4. VALIDA TAMANHO
    // ==========================================

    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        error: "O arquivo não pode ter mais de 50 MB.",
      });
    }

    // ==========================================
    // 5. VALIDA EXTENSÃO
    // ==========================================

    const originalFilename = file.originalFilename || "";

    const extension = path.extname(originalFilename).toLowerCase();

    if (!ALLOWED_FILES[extension]) {
      return res.status(400).json({
        error: "Tipo de arquivo não permitido.",
      });
    }

    // ==========================================
    // 6. VALIDA MIME TYPE
    // ==========================================

    const expectedMimeType = ALLOWED_FILES[extension];

    if (file.mimetype !== expectedMimeType) {
      return res.status(400).json({
        error: "O tipo do arquivo não corresponde à extensão.",
      });
    }

    // ==========================================
    // 9. METADADOS
    // ==========================================

    const fileMetadata = {
      name: originalFilename || "arquivo_upload",
    };

    // ==========================================
    // 10. CONTEÚDO
    // ==========================================
    const ext = file.mimetype.split("/")[1];

    const filenameWithExt = `${file.newFilename}.${ext}`;

    const newName = renomearArquivo(file.originalFilename || "");
    console.log(ext, newName);

    await uploadFile(file.filepath, newName, file.mimetype);

    // ==========================================
    // 14. LIMPA O ARQUIVO TEMPORÁRIO
    // ==========================================

    try {
      fs.unlinkSync(file.filepath);
    } catch (error) {
      console.warn("Não foi possível remover o arquivo temporário:", error);
    }

    // ==========================================
    // 15. RESPOSTA
    // ==========================================

    return res.status(200).json({
      success: true,
      file: file,
    });
  } catch (error) {
    console.error("Erro detalhado no upload:", error);

    // Erro específico do limite do Formidable
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("maxfilesize")
    ) {
      return res.status(400).json({
        error: "O arquivo não pode ter mais de 50 MB.",
      });
    }

    return res.status(500).json({
      error: "Falha interna ao processar o upload.",
    });
  }
}

function renomearArquivo(nomeOriginal: string) {
  // 1. Gera o ID de 5 dígitos (3 do tempo atual + 2 aleatórios)
  const tempo = Date.now().toString(36).slice(-3);
  const random = Math.random().toString(36).substring(2, 4);
  const idCurto = `${tempo}${random}`;

  // 2. Separa o nome da extensão
  const partes = nomeOriginal.split(".");
  const extensao = partes.pop(); // Pega a extensão (ex: png, jpg)

  // Rejunta o resto caso o arquivo tenha múltiplos pontos (ex: foto.v2.png)
  let nomeSemExtensao = partes.join(".");

  // 3. Limpa o nome (troca espaços por traços e remove caracteres especiais)
  nomeSemExtensao = nomeSemExtensao
    .normalize("NFD") // Remove acentos
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-") // Deixa apenas letras, números, - e _
    .replace(/-+/g, "-"); // Evita traços duplicados

  // 4. Retorna no formato exato: id.nome.extensao
  return `${idCurto}.${nomeSemExtensao}.${extensao}`;
}
