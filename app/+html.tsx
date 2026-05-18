import { ScrollViewStyleReset } from 'expo-router/html';

const APP_BACKGROUND = '#0D0D0F';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="theme-color" content={APP_BACKGROUND} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Wandr" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: webNativeStyles }} />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
.wandr-leaflet-root, .wandr-leaflet-root .leaflet-container {
  width: 100%;
  height: 100%;
  min-height: 320px;
}
.leaflet-container { background: #1c1c22; }
`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

const webNativeStyles = `
html {
  height: 100%;
  height: -webkit-fill-available;
  background-color: ${APP_BACKGROUND};
}
body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  min-height: 100dvh;
  min-height: -webkit-fill-available;
  background-color: ${APP_BACKGROUND};
  overscroll-behavior: none;
}
#root {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  min-height: 100%;
  min-height: 100dvh;
  min-height: -webkit-fill-available;
  background-color: ${APP_BACKGROUND};
}
button, a, [role="button"], input, textarea, select {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
input, textarea, select {
  font-size: 16px;
}
`;
