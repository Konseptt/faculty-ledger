import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";
import { LogoMarkSvg, logoMarkColors } from "@/lib/logoMark";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: logoMarkColors.paper,
          color: logoMarkColors.ink,
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          <LogoMarkSvg size={72} color={logoMarkColors.ink} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "52px", fontWeight: 700, lineHeight: 1.05 }}>
              {siteConfig.name}
            </span>
            <span
              style={{
                fontSize: "22px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: logoMarkColors.inkSoft,
                marginTop: "8px",
              }}
            >
              {siteConfig.tagline}
            </span>
          </div>
        </div>
        <p style={{ fontSize: "28px", lineHeight: 1.45, maxWidth: "900px", margin: 0 }}>
          {siteConfig.description}
        </p>
      </div>
    ),
    { ...size },
  );
}
