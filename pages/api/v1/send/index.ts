import formidable from "formidable";
import fs from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from "next";
import { uploadFile } from "@/storage/cloudflare/r2Cliente";
import { createRouter } from "next-connect";
import rateLimit from "express-rate-limit";

//midleware para barrar multiplas requisiçoes
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Janela de 15 minutos
  max: 5, // Cada IP só pode pedir 5 URLs assinadas a cada 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
  //essencial pra funcionar na cloudflare
  keyGenerator: (req) => {
    // A Vercel sempre envia o IP real do cliente no topo do x-forwarded-for
    const forwardedFor = req.headers["x-forwarded-for"];
    if (forwardedFor) {
      // Pega o primeiro IP da lista (que é o do usuário real)
      return forwardedFor.split(",")[0].trim();
    }

    // Alternativas de segurança para Cloudflare ou Localhost
    return (
      req.headers["cf-connecting-ip"] ||
      req.headers["x-vercel-forwarded-for"] ||
      req.socket.remoteAddress
    );
  },
  handler: (req, res) => {
    return res.status(429).json({
      error: "Muitos uploads requisitados. Tente novamente mais tarde.",
    });
  },
});

const router = createRouter<NextApiRequest, NextApiResponse>();
router.post(uploadLimiter, postHandler);

export default router.handler();

// 🔥 IMPORTANTE: Usamos require para a versão 16.5.4 funcionar perfeitamente no CommonJS/Next.js
const FileType = require("file-type");

export const config = {
  api: {
    bodyParser: false,
  },
};

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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  try {
    const form = formidable({
      maxFileSize: MAX_FILE_SIZE,
      multiples: false,
    });

    const [fields, files] = await form.parse(req);

    // O React envia o mini-blob pelo campo 'chunk'
    const fileArray = files.chunk || files.file;
    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
    const fileSize = Number(fields.fileSize);

    if (fileSize > MAX_FILE_SIZE) {
      throw {
        message: "Arquivo Maior do que o Permitido",
      };
    }

    // Captura o nome original enviado pelo FormData text fields
    const originalFilename = Array.isArray(fields.filename)
      ? fields.filename[0]
      : fields.filename || file?.originalFilename || "";

    if (!file || !originalFilename) {
      return res
        .status(400)
        .json({ error: "Nenhum fragmento de arquivo enviado." });
    }

    const extension = path.extname(originalFilename).toLowerCase();

    // 1. VALIDAÇÃO NOMINAL (Se a extensão escrita é permitida)
    if (!ALLOWED_FILES[extension]) {
      if (fs.existsSync(file.filepath)) fs.unlinkSync(file.filepath);
      return res.status(400).json({ error: "Tipo de arquivo não permitido." });
    }

    // 2. LEITURA E VALIDAÇÃO DOS BYTES REAIS (A Armadilha)
    const buffer = fs.readFileSync(file.filepath);
    const realType = await FileType.fromBuffer(buffer);

    let isFileValid = false;
    const officeExtensions = [".xlsx", ".docx", ".pptx"];

    if (realType) {
      const realExtension = `.${realType.ext}`;

      if (realExtension === extension) {
        isFileValid = true; // Arquivo original íntegro
      } else if (
        realType.ext === "zip" &&
        officeExtensions.includes(extension)
      ) {
        isFileValid = true; // Excel/Word legítimos são empacotados como ZIP por padrão
      }
    } else if (extension === ".txt" || extension === ".csv") {
      // Arquivos de texto puro simples não possuem metadados complexos/magic numbers nos bytes
      isFileValid = true;
    }

    // 🔴 BLOQUEIO ABSOLUTO DA FRAUDE
    if (!isFileValid) {
      if (fs.existsSync(file.filepath)) fs.unlinkSync(file.filepath);
      console.log("🚨 FRAUDE DETECTADA: Upload cancelado no servidor!");
      return res.status(400).json({
        error: `Fraude detectada! O arquivo se diz ${extension} mas sua estrutura interna não corresponde.`,
      });
    }

    // 3. FLUXO DE SUCESSO (Gerar URL do R2)
    const expectedMimeType = ALLOWED_FILES[extension];
    const newName = renomearArquivo(originalFilename);

    //ccorte de manutencao------------------------------
    // const userAgent = req.headers["user-agent"] || null;
    // const ipAdress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // return res.status(403).json({
    //   success: true,
    //   file: file.filepath,
    //   name: newName,
    //   type: expectedMimeType,
    //   ip_adress: ipAdress,
    //   user_agent: userAgent,
    // });
    //ccorte de manutencao------------------------------

    const uploadUrl = await uploadFile(
      file.filepath,
      newName,
      expectedMimeType,
    );

    if (fs.existsSync(file.filepath)) {
      fs.unlinkSync(file.filepath);
    }

    return res
      .status(200)
      .json({ success: true, url: uploadUrl, key: newName });
  } catch (error: any) {
    console.error("Erro detalhado no upload:", error);
    return res.status(500).json({
      error: "Falha interna ao processar o upload.\n" + error.message,
    });
  }
}

function renomearArquivo(nomeOriginal: string) {
  const tempo = Date.now().toString(36).slice(-3);
  const random = Math.random().toString(36).substring(2, 4);
  const idCurto = `${tempo}${random}`;

  const partes = nomeOriginal.split(".");
  const extensao = partes.pop();
  let nomeSemExtensao = partes.join(".");

  nomeSemExtensao = nomeSemExtensao
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-");

  return `${idCurto}.${nomeSemExtensao}.${extensao}`;
}
