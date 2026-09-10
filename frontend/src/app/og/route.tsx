import { ImageResponse } from "next/og"

export const dynamic = "force-static"

const NAVY = "#0b2a5b"
const BLUE = "#1e4f9a"
const LIGHT_BLUE = "#7ec8f8"

// URL estável (/og) para servir de fallback no metadata das páginas: o
// opengraph-image por arquivo ganha hash no build e não dá para referenciá-lo
// de dentro do generateMetadata.
export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 100%)`,
        padding: 72,
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            width: 120,
            height: 12,
            borderRadius: 6,
            background: LIGHT_BLUE,
          }}
        />
        <div style={{ display: "flex", fontSize: 104, fontWeight: 700 }}>
          Senador Canedo Hoje
        </div>
        <div style={{ display: "flex", fontSize: 44, color: LIGHT_BLUE }}>
          Notícias em tempo real
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 32,
          color: "rgba(255, 255, 255, 0.75)",
        }}
      >
        Política · Economia · Esportes · Cultura
      </div>
    </div>,
    { width: 1200, height: 630 }
  )
}
