import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import Head from "next/head";

const schema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Fabula Infantil",
  url: "https://www.fabulainfantil.com",
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Fabula Infantil</title>
        <link rel="canonical" href="https://fabulainfantil.com" />
        <meta
          name="description"
          content="Fabula Infantil é um site para crianças criarem e personalizarem suas próprias histórias com aventuras únicas e estimular a imaginação com ajuda de inteligência artificial."
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </Head>
      <Component {...pageProps} />

      <Analytics />
    </>
  );
}
