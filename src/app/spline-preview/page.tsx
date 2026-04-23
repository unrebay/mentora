/**
 * /spline-preview — public test page (no auth required).
 * Shows Spline UI scenes to evaluate before integrating into the main app.
 */
export const metadata = { title: "Spline UI Preview — Mentora", robots: { index: false, follow: false } };

const SCENES = [
  {
    id: "icons",
    title: "3D Icons (streak, XP, messages, subscription, pills)",
    url: "https://my.spline.design/ecc6e410-2236-4e58-908c-6d3a4e61ba53/",
    designUrl: "https://app.spline.design/ui/ecc6e410-2236-4e58-908c-6d3a4e61ba53",
    desc: "Иконки для стрика, ментов, сообщений, подписки и пиллов",
  },
  {
    id: "toggles",
    title: "3D Toggle switches",
    url: "https://my.spline.design/3fa62de3-7d19-4b69-ba63-0d3273d01ab8/",
    designUrl: "https://app.spline.design/ui/3fa62de3-7d19-4b69-ba63-0d3273d01ab8",
    desc: "Тумблеры для переключения тем, настроек и т.д.",
  },
];

export default function SplinePreviewPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#08080f", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>
            Mentora · Spline UI эксперимент
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
            3D UI компоненты
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", marginTop: 8, fontSize: 14 }}>
            Тестовая страница — не требует входа. Оцени как выглядят сцены.
            Если понравится — интегрируем в основные страницы.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {SCENES.map((scene) => (
            <div key={scene.id} style={{
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{scene.title}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 3 }}>{scene.desc}</div>
                </div>
                <a
                  href={scene.designUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12, fontWeight: 600, padding: "6px 14px",
                    borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.6)", textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Открыть в Spline →
                </a>
              </div>

              {/* Spline iframe */}
              <div style={{ position: "relative", width: "100%", height: 480, marginTop: 16 }}>
                <iframe
                  src={scene.url}
                  frameBorder="0"
                  title={scene.title}
                  allow="autoplay"
                  style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                />
              </div>

              {/* Notes */}
              <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                  Scene URL: <code style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{scene.url}</code>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, padding: "20px 24px", borderRadius: 14, background: "rgba(69,97,232,0.08)", border: "1px solid rgba(69,97,232,0.2)" }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#6B8FFF", marginBottom: 8 }}>Следующий шаг</div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            Если сцены выглядят хорошо, нужно будет найти embed-URL для отдельных элементов
            (стрик-иконка, тумблер) и интегрировать их вместо текущих SVG-иконок в шапке
            и на карточках. Либо — использовать Spline Code Export для React-компонентов.
          </p>
        </div>
      </div>
    </div>
  );
}
