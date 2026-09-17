import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest, response: NextResponse) {
  const url = request.nextUrl;

  // 1. Libera o localhost automaticamente para desenvolvimento local
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return NextResponse.next();
  }

  if (url.pathname === "/error-gateway-kfx") {
    return NextResponse.next();
  }

  // 2. Em produção, valida o token injetado pela Cloudflare
  const cloudflareToken = request.headers.get("X-Cloudflare-Proxy-Token");
  const expectedSecret = process.env.CLOUDFLARE_SECRET_TOKEN;

  // Se o token estiver errado ou se você esqueceu de cadastrar a variável na Vercel, bloqueia
  if (!expectedSecret || cloudflareToken !== expectedSecret) {
    return NextResponse.rewrite(new URL("/error-gateway-kfx", request.url), {
      status: 403,
    });
  }

  return NextResponse.next();
}

// Configuração para garantir eficiência (roda em todas as páginas, mas ignora arquivos estáticos)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
