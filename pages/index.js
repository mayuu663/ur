import Head from 'next/head';
import Script from 'next/script';

export default function Home() {
  return (
    <>
      <Head>
        <title>IDOL Shooter</title>
      </Head>
      <canvas id="gameCanvas" width="480" height="640"></canvas>
      <Script src="/game.js" strategy="afterInteractive" />
    </>
  );
}
