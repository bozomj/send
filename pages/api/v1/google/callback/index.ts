import { google } from "googleapis";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const code = req.query.code;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        error: "Código de autorização não informado.",
      });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    const { tokens } = await oauth2Client.getToken(code);

    console.log("TOKENS RECEBIDOS:");
    console.log(tokens);

    return res.status(200).json({
      message: "Autorização concluída.",
      refreshToken: tokens.refresh_token,
    });
  } catch (error) {
    console.error("Erro ao obter tokens:", error);

    return res.status(500).json({
      error: "Falha ao obter autorização do Google.",
    });
  }
}
