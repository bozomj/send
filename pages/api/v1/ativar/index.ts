import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { r2Client } from "@/storage/cloudflare/r2Cliente";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
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
export async function upLimiter(req: any, res: any, next: any) {
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
router.post(upLimiter, postHandler);
export default router.handler();

async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  const { fileKey } = req.body;

  const ativado = await filesInfo.get(fileKey);

  if (ativado != null && ativado.status === "ativo") {
    return res
      .status(409)
      .json({ message: "arquivo já está ativado", ativado });
  }

  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET,
        Key: fileKey,
      }),
    );

    const ativado = await filesInfo.ativar(fileKey);

    if (ativado?.status === "ativo") {
      return res.status(200).json({
        message: "Arquivo validado e ativado com sucesso!",
        file: ativado,
      });
    }
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.status === 404) {
      return res.status(400).json({
        message:
          "Não foi possível ativar. O arquivo físico não existe no servidor de armazenamento.",
      });
    }

    return res
      .status(500)
      .json({ message: "Erro interno no servidor ao ativar o arquivo." });
  }
}
