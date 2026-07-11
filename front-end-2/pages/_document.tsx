import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="pt">
      <Head>
        {/* Preload LCP image — BackCover is ssr:false so priority prop can't inject this */}
        <link rel="preload" as="image" href="/_next/image?url=%2Fqrcode.png&w=384&q=75" fetchPriority="high" />
        {/* Consent Mode v2 defaults — must run before gtag.js loads, so this lives in _document (beforeInteractive) not _app */}
        <Script id="gtag-consent-default" strategy="beforeInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',true);`}
        </Script>
      </Head>
      <body style={{ fontFamily: '"Courier New", Courier, monospace', backgroundColor: ' #1a1a5e' }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
