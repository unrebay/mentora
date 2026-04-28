import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        }}
      >
        {/* M */}
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontWeight: 800,
            fontSize: 19,
            color: "#0a0a14",
            lineHeight: 1,
            letterSpacing: "-0.5px",
          }}
        >
          M
        </span>
        {/* e — brand blue italic */}
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            fontSize: 19,
            color: "#4561E8",
            fontStyle: "italic",
            lineHeight: 1,
            marginLeft: "-1px",
          }}
        >
          e
        </span>
      </div>
    ),
    { ...size }
  );
}
