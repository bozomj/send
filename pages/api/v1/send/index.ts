import formidable from "formidable";
import fs from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from "next";
import { uploadFile } from "@/storage/cloudflare/r2Cliente";
import { createRouter } from "next-connect";

import filesMetadata from "@/models/filesMetadata";
import filesInfo from "@/models/files";
import database from "@/database/database";
import limiter from "@/middlewares/limiter";

const router = createRouter<NextApiRequest, NextApiResponse>();
router.post(limiter("upload"), postHandler);

export default router.handler();

// 🔥 IMPORTANTE: Usamos require para a versão 16.5.4 funcionar perfeitamente no CommonJS/Next.js
const FileType = require("file-type");

export const config = {
  api: {
    bodyParser: false,
  },
};

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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  try {
    const form = formidable({
      maxFileSize: MAX_FILE_SIZE,
      multiples: false,
    });

    const [fields, files] = await form.parse(req);

    // O React envia o mini-blob pelo campo 'chunk'
    const fileArray = files.chunk || files.file;
    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
    const fileSize = Number(fields.fileSize);

    if (fileSize > MAX_FILE_SIZE) {
      throw {
        message: "Arquivo Maior do que o Permitido",
      };
    }

    // Captura o nome original enviado pelo FormData text fields
    const originalFilename = Array.isArray(fields.filename)
      ? fields.filename[0]
      : fields.filename || file?.originalFilename || "";

    if (!file || !originalFilename) {
      return res
        .status(400)
        .json({ error: "Nenhum fragmento de arquivo enviado." });
    }

    const extension = path.extname(originalFilename).toLowerCase();

    // 1. VALIDAÇÃO NOMINAL (Se a extensão escrita é permitida)
    if (!ALLOWED_FILES[extension]) {
      if (fs.existsSync(file.filepath)) fs.unlinkSync(file.filepath);
      return res.status(400).json({ error: "Tipo de arquivo não permitido." });
    }

    // 2. LEITURA E VALIDAÇÃO DOS BYTES REAIS (A Armadilha)
    const buffer = fs.readFileSync(file.filepath);
    const realType = await FileType.fromBuffer(buffer);

    let isFileValid = false;
    const officeExtensions = [".xlsx", ".docx", ".pptx"];

    if (realType) {
      const realExtension = `.${realType.ext}`;

      if (realExtension === extension) {
        isFileValid = true; // Arquivo original íntegro
      } else if (
        realType.ext === "zip" &&
        officeExtensions.includes(extension)
      ) {
        isFileValid = true; // Excel/Word legítimos são empacotados como ZIP por padrão
      }
    } else if (extension === ".txt" || extension === ".csv") {
      // Arquivos de texto puro simples não possuem metadados complexos/magic numbers nos bytes
      isFileValid = true;
    }

    // 🔴 BLOQUEIO ABSOLUTO DA FRAUDE
    if (!isFileValid) {
      if (fs.existsSync(file.filepath)) fs.unlinkSync(file.filepath);

      return res.status(400).json({
        error: `Fraude detectada! O arquivo se diz ${extension} mas sua estrutura interna não corresponde.`,
      });
    }

    // 3. FLUXO DE SUCESSO (Gerar URL do R2)
    const expectedMimeType = ALLOWED_FILES[extension];
    const newName = renomearArquivo(originalFilename);

    //remover---apenas um teste----------------

    const clientdb = await database.getTransationClient();

    try {
      await clientdb.query("BEGIN");

      const fileResult = await filesInfo.upload(newName, clientdb);

      const _filesMetadata = {
        file_id: fileResult.id,
        ip_address:
          req.headers["x-test-ip"] ||
          req.headers["x-forwarded-for"] ||
          req.socket?.remoteAddress ||
          "127.0.0.1",
        user_agent: req.headers["user-agent"] || "Unknown Agent",
      };

      const metadataResult = await filesMetadata.upload(
        _filesMetadata,
        clientdb,
      );

      await clientdb.query("COMMIT");

      const transactionResult = {
        fileInfo: fileResult,
        metadata: metadataResult,
      };

      const uploadUrl = await uploadFile(newName, expectedMimeType);

      if (fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath);
      }

      return res
        .status(200)
        .json({ success: true, url: uploadUrl, key: newName });
    } catch (e) {
      await clientdb.query("ROLLBACK");

      return res
        .status(500)
        .json({ message: "Não foi possivel enviar o arquivo no momento." });
    } finally {
      await clientdb.end();
    }
    //---------
  } catch (error: any) {
    console.error("Erro detalhado no upload:", error);
    return res.status(500).json({
      error: "Falha interna ao processar o upload.\n" + error.message,
    });
  }
}

function renomearArquivo(nomeOriginal: string) {
  const tempo = Date.now().toString(36).slice(-3);
  const random = Math.random().toString(36).substring(2, 4);
  const idCurto = `${tempo}${random}`;

  const partes = nomeOriginal.split(".");
  const extensao = partes.pop();
  let nomeSemExtensao = partes.join(".");

  nomeSemExtensao = nomeSemExtensao
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-");

  return `${idCurto}.${nomeSemExtensao}.${extensao}`;
}
