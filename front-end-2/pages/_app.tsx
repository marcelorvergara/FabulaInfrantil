import { useState, useEffect } from "react";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import Head from "next/head";
import Script from "next/script";
import CookieBanner from "../components/CookieBanner";

const CONSENT_KEY = "cookie_consent";

const schema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Fábula Infantil",
  url: "https://www.fabulainfantil.com",
};

export default function App({ Component, pageProps }: AppProps) {
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored !== null) setConsent(stored === "true");
  }, []);

  const handleConsent = (accepted: boolean) => {
    localStorage.setItem(CONSENT_KEY, String(accepted));
    setConsent(accepted);
  };

  return (
    <>
      <Head>
        <title>Fábula Infantil</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://fabulainfantil.com" />
        <meta
          name="description"
          content="Fábula Infantil é um site para crianças criarem e personalizarem suas próprias histórias com aventuras únicas e estimular a imaginação com ajuda de inteligência artificial."
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </Head>

      <Component {...pageProps} />

      <Analytics />

      {consent === true && (
        <>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=AW-1032977240"
            strategy="afterInteractive"
          />
          <Script id="google-ads-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','AW-1032977240');`}
          </Script>
        </>
      )}

      {consent === null && <CookieBanner onConsent={handleConsent} />}
    </>
  );
}
