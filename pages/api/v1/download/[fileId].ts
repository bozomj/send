import { google } from "googleapis";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // ==========================================
  // 1. ACEITA SOMENTE GET
  // ==========================================

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Método não permitido. Use GET.",
    });
  }

  try {
    // ==========================================
    // 2. PEGA O FILE ID
    // ==========================================

    const { fileId } = req.query;

    if (!fileId || Array.isArray(fileId)) {
      return res.status(400).json({
        error: "ID do arquivo inválido.",
      });
    }

    // ==========================================
    // 3. VARIÁVEIS DE AMBIENTE
    // ==========================================

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId) {
      throw new Error("GOOGLE_CLIENT_ID não configurado.");
    }

    if (!clientSecret) {
      throw new Error("GOOGLE_CLIENT_SECRET não configurado.");
    }
    if (!refreshToken) {
      throw new Error("GOOGLE_REFRESH_TOKEN não configurado.");
    }

    // ==========================================
    // 4. AUTENTICAÇÃO GOOGLE
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
    // 5. CLIENTE GOOGLE DRIVE
    // ==========================================

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    // ==========================================
    // 6. PEGA INFORMAÇÕES DO ARQUIVO
    // ==========================================

    const fileInfo = await drive.files.get({
      fileId,
      fields: "id,name,mimeType,size",
    });

    const fileName = fileInfo.data.name || "arquivo";
    const mimeType = fileInfo.data.mimeType || "application/octet-stream";

    // ==========================================
    // 7. CONFIGURA RESPOSTA
    // ==========================================

    res.setHeader("Content-Type", mimeType);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`,
    );

    // ==========================================
    // 8. BAIXA O ARQUIVO DO GOOGLE DRIVE
    // ==========================================

    const response = await drive.files.get(
      {
        fileId,
        alt: "media",
      },
      {
        responseType: "stream",
      },
    );

    // ==========================================
    // 9. ENVIA O ARQUIVO PARA O USUÁRIO
    // ==========================================

    response.data.pipe(res);
  } catch (error: any) {
    console.error("Erro no download:", error);

    // Arquivo não encontrado
    if (error?.code === 404) {
      return res.status(404).json({
        error: "Arquivo não encontrado.",
      });
    }

    return res.status(500).json({
      error: "Falha ao realizar o download.",
    });
  }
}
