import { downloadFile, getFileStream } from "@/storage/cloudflare/r2Cliente";
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

    const fileUrl = Array.isArray(fileId) ? fileId[0] : fileId;

    return res.status(403).json({ message: "Em manutenção" });

    if (fileUrl) {
      const download = await downloadFile(fileUrl);
      return res.redirect(302, download);
    }

    throw { message: "erro com o download" };
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
