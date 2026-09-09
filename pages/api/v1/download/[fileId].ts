import { downloadFile, getFileStream } from "@/storage/cloudflare/r2Cliente";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
});

// middleware para barrar múltiplas requisições
export async function downloadLimiter(req: any, res: any, next: any) {
  const forwardedFor = req.headers["x-forwarded-for"];

  const ip =
    req.headers["cf-connecting-ip"] ||
    (forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : req.socket.remoteAddress || "unknown");

  const { success } = await ratelimit.limit(`upload:${ip}`);

  if (!success) {
    return res.status(429).json({
      error: "Muitos Downloads requisitados. Tente novamente mais tarde.",
    });
  }

  return next();
}

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
