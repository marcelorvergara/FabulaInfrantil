import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="pt">
      <Head>
        {/* Preload LCP image — BackCover is ssr:false so priority prop can't inject this */}
        <link rel="preload" as="image" href="/_next/image?url=%2Fqrcode.png&w=384&q=75" />
      </Head>
      <body style={{ fontFamily: '"Courier New", Courier, monospace', backgroundColor: ' #1a1a5e' }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
