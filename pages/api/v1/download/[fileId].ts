import { downloadFile, getFileStream } from "@/storage/cloudflare/r2Cliente";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import filesInfo from "@/models/files";

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
  const { fileId } = req.query;

  const fileUrl = Array.isArray(fileId) ? fileId[0] : fileId;

  if (fileUrl) {
    const fileExist = await filesInfo.get(fileUrl);

    if (fileExist == null) {
      return res
        .status(403)
        .json({ message: "Arquivo não encontrado na origem ou invalido" });
    }

    try {
      const download = await downloadFile(fileUrl);
      console.error("Url de download:::", download);
      return res.redirect(302, download);
    } catch (e) {
      console.error("Erro ao gerar link de download:", e);
      return res.status(500).json({ message: "Erro ao processar download." });
    }
  }
}
