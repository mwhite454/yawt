import type { PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
  return (
    <html data-theme="nord">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>YAWT - Yet Another Writing Tool</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="bg-base-200">
        <Component />
      </body>
    </html>
  );
}
