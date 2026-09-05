import { google } from "googleapis";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from "next";

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
    // 2. VARIÁVEIS DE AMBIENTE
    // ==========================================

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const folderId = process.env.ID_PASTA_COMPARTILHADA;

    if (!clientId) {
      throw new Error("GOOGLE_CLIENT_ID não configurado.");
    }

    if (!clientSecret) {
      throw new Error("GOOGLE_CLIENT_SECRET não configurado.");
    }

    if (!refreshToken) {
      throw new Error("GOOGLE_REFRESH_TOKEN não configurado.");
    }

    if (!folderId) {
      throw new Error("ID_PASTA_COMPARTILHADA não configurado.");
    }

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
    // 7. AUTENTICAÇÃO GOOGLE
    // ==========================================

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      process.env.GOOGLE_REDIRECT_URI,
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // ==========================================
    // 8. CLIENTE GOOGLE DRIVE
    // ==========================================

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    // ==========================================
    // 9. METADADOS
    // ==========================================

    const fileMetadata = {
      name: originalFilename || "arquivo_upload",
      parents: [folderId],
    };

    // ==========================================
    // 10. CONTEÚDO
    // ==========================================

    const media = {
      mimeType: expectedMimeType,
      body: fs.createReadStream(file.filepath),
    };

    // ==========================================
    // 11. UPLOAD
    // ==========================================

    const driveFile = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id,name,mimeType,size",
    });

    const fileId = driveFile.data.id;

    if (!fileId) {
      throw new Error("Google Drive não retornou o ID do arquivo.");
    }

    // ==========================================
    // 12. TORNA O ARQUIVO ACESSÍVEL
    // ==========================================

    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    // ==========================================
    // 13. LINK DO SEU SISTEMA
    // ==========================================

    // Por enquanto usamos o fileId.
    // Depois podemos trocar por um token aleatório
    // salvo no banco.

    const downloadLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/download/${fileId}`;

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

    const publicLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

    return res.status(200).json({
      success: true,
      fileId,
      fileName: driveFile.data.name,
      mimeType: driveFile.data.mimeType,
      link: publicLink,
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
