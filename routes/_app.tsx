interface PageProps {
  Component: () => unknown;
  url: URL;
}

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>YAWT - Yet Another Writing Tool</title>
        <style>
          {`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
          }
        `}
        </style>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
