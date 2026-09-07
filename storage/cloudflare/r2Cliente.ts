import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import fs from "fs";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUDFLARE_ACCESS_SECRET_KEY!,
  },
});

export async function uploadFile(filePath: string, key: string, type: string) {
  const fileStream = fs.createReadStream(filePath);

  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: type,
      CacheControl: "public, max-age=2592000, s-maxage=2592000",
    }),
  );
}

export async function deleteFile(key: string) {
  try {
    const deleted = await r2Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
        Key: key,
      }),
    );

    if (deleted.$metadata.httpStatusCode !== 204)
      throw {
        message: "Falha ao deletar no Storage",
        status: deleted.$metadata.httpStatusCode,
      };

    return { ok: true, status: deleted.$metadata.httpStatusCode };
  } catch (error) {
    const err = error as { status: string };
    throw {
      message: "Erro ao deletar arquivo",
      imagem: key,
      cause: err,
    };
  }
}

export async function getFileStream(key: string) {
  const result = await r2Client.send(
    new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      Key: key,
    }),
  );
  return result.Body;
}
