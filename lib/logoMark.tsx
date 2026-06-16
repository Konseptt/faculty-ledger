export const LOGO_MARK_VIEWBOX = "0 0 48 48";

interface LogoMarkSvgProps {
  size?: number;
  color?: string;
  className?: string;
}

export function LogoMarkSvg({ size = 48, color = "currentColor", className }: LogoMarkSvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={LOGO_MARK_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 14h40" stroke={color} strokeWidth="2" />
      <path
        d="M14 22h20M14 28h14M14 34h18"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="M24 6v36" stroke={color} strokeWidth="1.5" strokeDasharray="2 3" />
    </svg>
  );
}

/** Colors aligned with editorial OKLCH paper/ink tokens in globals.css */
export const logoMarkColors = {
  paper: "#f2ebe0",
  ink: "#2a241f",
  inkSoft: "#5c5348",
} as const;
