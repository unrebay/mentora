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
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontWeight: 800,
            fontSize: 108,
            color: "#000000",
            letterSpacing: "-3px",
            lineHeight: 1,
          }}
        >
          M
        </span>
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            fontSize: 108,
            color: "#4561E8",
            fontStyle: "italic",
            marginLeft: "-6px",
            lineHeight: 1,
          }}
        >
          e
        </span>
      </div>
    ),
    { ...size }
  );
}
