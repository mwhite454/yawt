export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        padding: "4rem 1rem",
      }}
    >
      <div
        style={{
          maxWidth: "56rem",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            textAlign: "center",
            marginBottom: "3rem",
          }}
        >
          <h1
            style={{
              fontSize: "3rem",
              fontWeight: "bold",
              color: "#111827",
              marginBottom: "1rem",
            }}
          >
            YAWT
          </h1>
          <p
            style={{
              fontSize: "1.25rem",
              color: "#6b7280",
            }}
          >
            Yet Another Writing Tool
          </p>
        </header>

        <main
          style={{
            background: "white",
            borderRadius: "0.5rem",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            padding: "2rem",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "1rem",
              }}
            >
              Welcome to YAWT
            </h2>
            <p
              style={{
                color: "#6b7280",
                marginBottom: "1.5rem",
              }}
            >
              A modern writing tool built with Deno and Fresh framework.
            </p>
            <div
              style={{
                background: "#eff6ff",
                borderLeft: "4px solid #3b82f6",
                padding: "1rem",
              }}
            >
              <p
                style={{
                  color: "#1e40af",
                }}
              >
                <strong>Getting Started:</strong>{" "}
                This is a Fresh project built with Deno {Deno.version.deno}.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
