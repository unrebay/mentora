import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* M */}
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontWeight: 800,
            fontSize: 110,
            color: "#0a0a14",
            lineHeight: 1,
            letterSpacing: "-2px",
          }}
        >
          M
        </span>
        {/* e — brand blue italic */}
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            fontSize: 110,
            color: "#4561E8",
            fontStyle: "italic",
            lineHeight: 1,
            marginLeft: "-5px",
          }}
        >
          e
        </span>
      </div>
    ),
    { ...size }
  );
}
