import Head from "next/head";
import Script from "next/script";

export default function Home() {
  return (
    <>
      <Head>
        <title>IDOL Shooter</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <h1>IDOL Shooter 💖🎶</h1>
      </div>

      <canvas
        id="gameCanvas"
        width="480"
        height="640"
        style={{ display: "block", margin: "0 auto", background: "#000" }}
      ></canvas>

      {/* ゲームスクリプト読み込み */}
      <Script src="/game.js" strategy="afterInteractive" />
    </>
  );
}
