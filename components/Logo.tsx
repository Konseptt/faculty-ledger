import { LogoMarkSvg } from "@/lib/logoMark";

interface LogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
}

export function Logo({ size = 40, className = "", showWordmark = false }: LogoProps) {
  return (
    <span className={`site-logo ${className}`.trim()} aria-hidden={showWordmark ? undefined : true}>
      <LogoMarkSvg size={size} className="site-logo-mark" />
      {showWordmark && (
        <span className="site-logo-wordmark">
          <span className="site-logo-title">The Faculty Ledger</span>
          <span className="site-logo-tag">Course research desk</span>
        </span>
      )}
    </span>
  );
}
