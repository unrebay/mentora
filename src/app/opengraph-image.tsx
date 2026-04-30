import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "linear-gradient(135deg, #0a0e1a 0%, #0d1530 60%, #0a0e1a 100%)",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        <div style={{
          position: "absolute", top: -60, left: -60,
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(69,97,232,0.25) 0%, transparent 70%)",
          display: "flex",
        }} />

        <div style={{ display: "flex", alignItems: "baseline", marginBottom: 40 }}>
          <span style={{ fontSize: 80, fontWeight: 800, color: "#ffffff", letterSpacing: "-2px", lineHeight: 1 }}>M</span>
          <span style={{ fontSize: 80, fontWeight: 700, color: "#4561E8", fontStyle: "italic", marginLeft: "-4px", lineHeight: 1 }}>e</span>
          <span style={{ fontSize: 32, fontWeight: 500, color: "#8899cc", marginLeft: 6, letterSpacing: "0.5px" }}>ntora</span>
        </div>

        <div style={{ fontSize: 52, fontWeight: 800, color: "#ffffff", lineHeight: 1.15, marginBottom: 20, display: "flex", flexWrap: "wrap" }}>
          Новый вид образования — 17 наук
        </div>

        <div style={{ fontSize: 28, color: "#6b82c4", lineHeight: 1.4, marginBottom: 48, display: "flex" }}>
          История · Математика · Физика · Английский · и ещё
        </div>

        <div style={{ display: "flex", gap: 48, marginTop: "auto" }}>
          {[["17", "наук"], ["20", "сообщений в день"], ["24/7", "доступен"]].map(([val, label]) => (
            <div key={val} style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 40, fontWeight: 800, color: "#4561E8", lineHeight: 1 }}>{val}</span>
              <span style={{ fontSize: 18, color: "#6b82c4", marginTop: 4 }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{
          position: "absolute", bottom: 40, right: 80,
          fontSize: 22, color: "#3d5099", display: "flex",
        }}>
          mentora.su
        </div>

        <div style={{
          position: "absolute", right: 80, top: 80,
          width: 340, height: 400,
          background: "rgba(18,28,60,0.9)",
          borderRadius: 16,
          border: "1px solid rgba(69,97,232,0.3)",
          padding: "20px 24px",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{ fontSize: 16, color: "#4561E8", marginBottom: 4, display: "flex" }}>● История России</div>
          {[
            [true,  "Расскажи про"],
            [true,  "Куликовскую битву"],
            [false, "В 1380 году Дмитрий"],
            [false, "Донской разбил войско"],
            [false, "на реке Дон..."],
            [true,  "Почему это важно?"],
            [false, "Первая победа Руси,"],
            [false, "путь к освобождению"],
          ].map(([isUser, text], i) => (
            <div key={i} style={{
              alignSelf: isUser ? "flex-end" : "flex-start",
              background: isUser ? "rgba(69,97,232,0.3)" : "rgba(30,45,90,0.8)",
              border: `1px solid ${isUser ? "rgba(69,97,232,0.5)" : "rgba(50,70,130,0.5)"}`,
              borderRadius: 8, padding: "6px 12px",
              fontSize: 15, color: isUser ? "#aab8ef" : "#8899cc",
              maxWidth: 260, display: "flex",
            }}>
              {text as string}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
