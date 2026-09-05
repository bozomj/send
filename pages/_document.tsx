import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="pt-br">
      <Head>
        {/* Outras tags globais como fontes ou favicon alternativo */}
      </Head>
      <body className="antialiased">
        <Main />
        <div id="portal-root"></div>

        <NextScript />
      </body>
    </Html>
  );
}
