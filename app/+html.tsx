import { ScrollViewStyleReset } from "expo-router/html";
import { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <title>SachinIndia — Shop Electronics, Fashion, Sports & More</title>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        <meta
          name="description"
          content="Shop the best deals on Electronics, Fashion, Sports, Home & more at SachinIndia. Free shipping on orders above ₹500. New arrivals daily."
        />
        <meta
          name="keywords"
          content="online shopping, electronics, fashion, sports, home, deals, SachinIndia"
        />
        <meta name="author" content="SachinIndia" />
        <meta name="robots" content="index, follow" />

        <meta property="og:title" content="SachinIndia — Best Online Shopping Deals" />
        <meta
          property="og:description"
          content="Shop Electronics, Fashion, Sports & more. Great prices, fast delivery."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.sachindia.online" />
        <meta property="og:image" content="https://www.sachindia.online/og-image.png" />
        <meta property="og:site_name" content="SachinIndia" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SachinIndia — Online Shopping" />
        <meta
          name="twitter:description"
          content="Best deals on Electronics, Fashion, Sports & more."
        />

        <meta name="theme-color" content="#0066CC" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SachinIndia" />

        <link rel="icon" href="/favicon.ico?v=20260420" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico?v=20260420" />
        <link rel="apple-touch-icon" href="/favicon.ico?v=20260420" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />

        <ScrollViewStyleReset />
        <style>{`
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(0,102,204,0.2); border-radius: 99px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(0,102,204,0.4); }
          * { scrollbar-width: thin; scrollbar-color: rgba(0,102,204,0.2) transparent; }
          body { overflow: hidden; }
          html, body, #root { max-width: 100%; overflow-x: hidden; }
          #root { display: flex; height: 100%; }
          html, body { height: 100%; }
          #expo-splash {
            position: fixed;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: white;
            z-index: 9999;
            transition: opacity 0.3s ease;
          }
          #expo-splash.hidden {
            opacity: 0;
            pointer-events: none;
          }
          .splash-logo {
            width: 72px;
            height: 72px;
            background: #0066CC;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: 900;
            color: white;
            margin-bottom: 20px;
            font-family: -apple-system, sans-serif;
          }
          .splash-title {
            font-size: 22px;
            font-weight: 800;
            color: #0D1B2A;
            font-family: -apple-system, sans-serif;
            letter-spacing: 0;
          }
          .splash-sub {
            font-size: 13px;
            color: #6B7280;
            margin-top: 6px;
            font-family: -apple-system, sans-serif;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .splash-spinner {
            width: 28px;
            height: 28px;
            border: 3px solid rgba(0,102,204,0.15);
            border-top-color: #0066CC;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-top: 24px;
          }
        `}</style>
      </head>
      <body>
        <div id="expo-splash">
          <div className="splash-logo">S</div>
          <div className="splash-title">SachinIndia</div>
          <div className="splash-sub">Loading your store...</div>
          <div className="splash-spinner" />
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__hideSplash = function() {
                var el = document.getElementById('expo-splash');
                if (el) {
                  el.classList.add('hidden');
                  setTimeout(function() { el.remove(); }, 350);
                }
              };
              setTimeout(window.__hideSplash, 4000);
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
