export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic, dependency-free SVG monogram returned as a base64 data URI.
export function initialsAvatarDataUri(fullName: string, color: string): string {
  const text = initials(fullName);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">
<rect width="200" height="240" fill="${color}" opacity="0.18"/>
<circle cx="100" cy="110" r="64" fill="${color}" opacity="0.30"/>
<text x="100" y="128" font-family="Georgia, serif" font-size="64" font-weight="600"
 fill="${color}" text-anchor="middle">${text}</text>
</svg>`;
  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

