import { Handlers, PageProps } from "$fresh/server.ts";
import { getUser, type User } from "../utils/session.ts";

interface Data {
  user: User | null;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const user = await getUser(req);
    return ctx.render({ user });
  },
};

export default function Home({ data }: PageProps<Data>) {
  const { user } = data;

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

            {user
              ? (
                <div
                  style={{
                    background: "#d1fae5",
                    borderLeft: "4px solid #10b981",
                    padding: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <p
                    style={{
                      color: "#065f46",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <strong>Authenticated as:</strong> {user.name || user.login}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    {user.avatar_url && (
                      <img
                        src={user.avatar_url}
                        alt={user.login}
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                        }}
                      />
                    )}
                    <a
                      href="/auth/signout"
                      style={{
                        background: "#ef4444",
                        color: "white",
                        padding: "0.5rem 1rem",
                        borderRadius: "0.25rem",
                        textDecoration: "none",
                        display: "inline-block",
                      }}
                    >
                      Sign Out
                    </a>
                  </div>
                </div>
              )
              : (
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
                      marginBottom: "0.5rem",
                    }}
                  >
                    <strong>Getting Started:</strong>{" "}
                    Sign in with GitHub to access the API.
                  </p>
                  <a
                    href="/auth/signin"
                    style={{
                      background: "#3b82f6",
                      color: "white",
                      padding: "0.5rem 1rem",
                      borderRadius: "0.25rem",
                      textDecoration: "none",
                      display: "inline-block",
                      marginTop: "0.5rem",
                    }}
                  >
                    Sign in with GitHub
                  </a>
                </div>
              )}
          </div>
        </main>
      </div>
    </div>
  );
}
