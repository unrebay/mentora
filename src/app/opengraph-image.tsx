import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Mentora — AI-ментор по истории";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(34, 197, 94, 0.15)",
            border: "1px solid rgba(34, 197, 94, 0.4)",
            borderRadius: "100px",
            padding: "8px 18px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#22c55e",
            }}
          />
          <span style={{ color: "#86efac", fontSize: "18px", fontWeight: 600 }}>
            Уже доступно · История России и мира
          </span>
        </div>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
          <span style={{ fontSize: "56px", fontWeight: 800, color: "#ffffff" }}>
            M
          </span>
          <span style={{ fontSize: "56px", fontWeight: 800, color: "#4f6ef7" }}>
            entora
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "32px" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <span style={{ fontSize: "52px", fontWeight: 800, color: "#ffffff" }}>
              Забудь про
            </span>
            <span
              style={{
                fontSize: "52px",
                fontWeight: 800,
                color: "#94a3b8",
                textDecoration: "line-through",
              }}
            >
              скучные
            </span>
          </div>
          <span style={{ fontSize: "52px", fontWeight: 800, color: "#ffffff" }}>
            учебники.
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "52px", fontWeight: 800, color: "#ffffff" }}>
              Учись в
            </span>
            <span
              style={{
                fontSize: "52px",
                fontWeight: 800,
                color: "#4f6ef7",
                fontStyle: "italic",
              }}
            >
              диалоге.
            </span>
          </div>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: "24px",
            color: "#94a3b8",
            margin: 0,
            maxWidth: "640px",
            lineHeight: 1.5,
          }}
        >
          AI-ментор, который знает твой уровень и объясняет историю как умный друг
        </p>

        {/* Bottom stats */}
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            right: "80px",
            display: "flex",
            gap: "40px",
          }}
        >
          {[
            { value: "8+", label: "предметов" },
            { value: "90%", label: "точность AI" },
            { value: "24/7", label: "доступен" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "32px", fontWeight: 800, color: "#ffffff" }}>
                {stat.value}
              </span>
              <span style={{ fontSize: "16px", color: "#64748b" }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
