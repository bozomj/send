import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest, response: NextResponse) {
  const url = request.nextUrl;

  // 1. Libera o localhost automaticamente para desenvolvimento local
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return NextResponse.next();
  }

  // 🌟 NOVA EXCEÇÃO: Libera a rota de download do Rate Limit/R2 automaticamente
  // Assim o navegador consegue acessar o link sem que o middleware barre
  if (url.pathname.startsWith("/api/v1/download")) {
    return NextResponse.next();
  }

  // 2. Em produção, valida o token injetado pela Cloudflare
  const cloudflareToken = request.headers.get("X-Cloudflare-Proxy-Token");
  const expectedSecret = process.env.CLOUDFLARE_SECRET_TOKEN;

  // Se o token estiver errado ou se você esqueceu de cadastrar a variável na Vercel, bloqueia
  if (!expectedSecret || cloudflareToken !== expectedSecret) {
    return new NextResponse(
      "Acesso negado. Acesse através do domínio oficial.",
      {
        status: 403,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  }

  return NextResponse.next();
}

// Configuração para garantir eficiência (roda em todas as páginas, mas ignora arquivos estáticos)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
