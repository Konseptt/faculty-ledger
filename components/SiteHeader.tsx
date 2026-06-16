"use client";

import Link from "next/link";
import { themeCopy } from "@/lib/copy";
import { siteConfig } from "@/lib/site";
import { Logo } from "./Logo";

interface SiteHeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function SiteHeader({ isDarkMode, onToggleTheme }: SiteHeaderProps) {
  const theme = isDarkMode ? themeCopy.dark : themeCopy.light;

  return (
    <header className="site-header">
      <div className="site-header-bar">
        <Link href="/" className="site-brand" aria-label={`${siteConfig.name} home page`}>
          <Logo size={44} showWordmark />
        </Link>
        <h1 className="visually-hidden">{siteConfig.name}</h1>
        <div className="site-header-actions">
          <button
            type="button"
            className="text-link theme-link"
            onClick={onToggleTheme}
            aria-label={theme.button}
            title={theme.hint}
          >
            {theme.button}
          </button>
        </div>
      </div>
    </header>
  );
}
