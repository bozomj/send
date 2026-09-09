import { downloadFile, getFileStream } from "@/storage/cloudflare/r2Cliente";
import rateLimit from "express-rate-limit";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

//midleware para barrar multiplas requisiçoes
export const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Janela de 15 minutos
  max: 5, // Cada IP só pode pedir 5 URLs assinadas a cada 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      error: "Muitos uploads requisitados. Tente novamente mais tarde.",
    });
  },
});

const router = createRouter<NextApiRequest, NextApiResponse>();
router.get(downloadLimiter, getHandler);
export default router.handler();

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
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

    // return res.status(403).json({ message: "Em manutenção" });

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
