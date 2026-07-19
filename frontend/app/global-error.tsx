"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#0A0C10", color: "#EEF1F5", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 24px",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Nimbus hit an unexpected error</h1>
          <p style={{ color: "#7C8492", marginTop: "0.5rem", maxWidth: 380 }}>
            Something broke at the application level. Reloading usually fixes it.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              background: "#6C8CFF",
              color: "#0A0C10",
              border: "none",
              borderRadius: "0.375rem",
              padding: "0.5rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
