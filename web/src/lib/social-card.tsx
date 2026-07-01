import { ImageResponse } from "next/og";

export const socialCardSize = {
  width: 1200,
  height: 630,
};

export function renderSocialCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 48%, #ecfdf5 100%)",
          color: "#172033",
          fontFamily: "Arial, Helvetica, sans-serif",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              background: "#2563eb",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 42,
              fontWeight: 800,
              letterSpacing: -2,
            }}
          >
            JF
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#334155" }}>
            Job Fit &amp; Skill-Gap Analyzer
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 64, lineHeight: 1.04, fontWeight: 800, letterSpacing: -3, maxWidth: 900 }}>
            Compare your résumé with the role in front of you.
          </div>
          <div style={{ fontSize: 30, color: "#475569", fontWeight: 600 }}>
            Rule-based · Structured skill gaps · Limited public beta
          </div>
        </div>

        <div style={{ fontSize: 28, color: "#2563eb", fontWeight: 700 }}>
          jobfit.cooperrobillard.com
        </div>
      </div>
    ),
    socialCardSize,
  );
}
