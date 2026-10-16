// Line icons for the orbit's moons: 24×24, stroked with currentColor.
// Rocket, scale and candlestick are Lucide (ISC); the rest are drawn for this site.

export const ICONS = {
  rocket:
    '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  drone:
    '<rect x="9" y="9" width="6" height="6" rx="1.5"/><path d="M9.5 9.5 7 7m7.5 2.5L17 7m-7.5 7.5L7 17m7.5-2.5L17 17"/><ellipse cx="5.5" cy="5.5" rx="3.5" ry="1.4"/><ellipse cx="18.5" cy="5.5" rx="3.5" ry="1.4"/><ellipse cx="5.5" cy="18.5" rx="3.5" ry="1.4"/><ellipse cx="18.5" cy="18.5" rx="3.5" ry="1.4"/>',
  scale:
    '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  football:
    '<circle cx="12" cy="12" r="10"/><path d="m12 7 4.76 3.45-1.82 5.6H9.06l-1.82-5.6Z"/><path d="M12 7V2m4.76 3.45 4.75-1.55m-6.57 7.15 2.94 4.04m-8.82 0-2.94 4.04M7.24 10.45 2.49 8.9"/>',
  candles:
    '<path d="M9 5v4"/><rect width="4" height="6" x="7" y="9" rx="1"/><path d="M9 15v2"/><path d="M17 3v2"/><rect width="4" height="8" x="15" y="5" rx="1"/><path d="M17 13v3"/><path d="M3 3v18h18"/>',
  knight:
    '<path d="M6 21h12"/><path d="M7.5 21v-2.5h9V21"/><path d="M8.5 18.5c0-3.5 3.5-4.5 3.5-7.5-1.4.9-3.2 1.1-4.8.2L6.6 10l4.2-5.7L10.5 2.5l2.3 1.4c3.6.4 5.7 3.6 5.7 8v6.6"/><path d="M11.5 7.5h.01"/>',
  basketball:
    '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2v20"/><path d="M5 4.9a10 10 0 0 1 0 14.2M19 4.9a10 10 0 0 0 0 14.2"/>',
} as const;

export type IconName = keyof typeof ICONS;
