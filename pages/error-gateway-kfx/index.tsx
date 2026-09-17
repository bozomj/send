import { GetServerSidePropsContext } from "next";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Ícone de Cadeado / Alerta */}
        <div className="flex justify-center">
          <div className="bg-red-50 p-4 rounded-full text-red-500 shadow-sm border border-red-100">
            <svg
              xmlns="http://w3.org"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>
        </div>

        {/* Título e Texto descritivo */}
        <div className="space-y-2">
          <h1 className="text-6xl font-extrabold text-slate-900 tracking-tight">
            403
          </h1>
          <h2 className="text-xl font-semibold text-slate-700">
            Acesso Não Autorizado
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            O acesso direto a este servidor não é permitido. Por favor, utilize
            o domínio oficial.
          </p>
        </div>

        {/* Linha Divisória sutil */}
        <div className="border-t border-slate-200 w-16 mx-auto"></div>

        {/* Botão de Ação */}
        <div>
          <a
            href={`https://bzmjsend.com.br`}
            className="inline-flex items-center cursor-pointer justify-center px-5 py-2.5 text-sm font-medium text-white bg-lime-700 hover:bg-lime-800 rounded-lg shadowtransition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
          >
            Acessar via Domínio Oficial
          </a>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req } = context;
  const headers = req.headers;
  const cloudflareToken = headers["X-Cloudflare-Proxy-Token"];

  // 2. Verifica se está rodando em ambiente local (localhost)
  const host = headers.host || "";
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");

  if (cloudflareToken || false) {
    return {
      redirect: {
        destination: "/",
        permanent: false, // Redirecionamento temporário (302)
      },
    };
  }

  return {
    props: {},
  };
}
