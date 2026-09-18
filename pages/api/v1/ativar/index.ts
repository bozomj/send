import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

import { r2Client } from "@/storage/cloudflare/r2Cliente";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import filesInfo from "@/models/files";
import limiter from "@/middlewares/limiter";

const router = createRouter<NextApiRequest, NextApiResponse>();
router.post(limiter("uploadActive"), postHandler);
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
