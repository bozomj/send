import Head from "next/head";
import "./globals.css";

import type { AppProps } from "next/app";
import MainLayout from "./layouts/MainLayout";

// Configuração do Font Awesome para Next.js
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>
      <MainLayout>
        <>
          <header className="border-b text-slate-700 border-gray-300 p-2">
            <a href="/">Inicio</a>
          </header>
          <Component {...pageProps} />
        </>
      </MainLayout>
    </div>
  );
}
