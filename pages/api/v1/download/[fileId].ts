import { downloadFile, getFileStream } from "@/storage/cloudflare/r2Cliente";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import filesInfo from "@/models/files";
import limiter from "@/middlewares/limiter";

export const config = {
  api: {
    externalResolver: true, // Avisa o Next.js que esta rota pode gerenciar redirecionamentos ou fluxos assíncronos longos
  },
};

const router = createRouter<NextApiRequest, NextApiResponse>();
router.get(limiter("download"), getHandler);
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
