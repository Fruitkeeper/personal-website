// Pure logic for the Markets widget (scripts/markets.ts): parsing CoinGecko's
// /coins/markets response, the toaster's mood, sparklines and formatting.

export type Coin = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  /** 24h change in percent, e.g. -2.4. */
  change24h: number;
  /** Hourly prices over 7 days, oldest first. May be empty. */
  sparkline: number[];
};

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Defensive parse: drops malformed entries rather than trusting the API shape. */
export function parseMarkets(json: unknown): Coin[] {
  if (!Array.isArray(json)) return [];
  const coins: Coin[] = [];
  for (const raw of json) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    if (typeof r.id !== 'string' || typeof r.symbol !== 'string' || !isNum(r.current_price)) continue;
    const spark = (r.sparkline_in_7d as { price?: unknown } | undefined)?.price;
    coins.push({
      id: r.id,
      symbol: r.symbol.toUpperCase(),
      name: typeof r.name === 'string' ? r.name : r.id,
      price: r.current_price,
      change24h: isNum(r.price_change_percentage_24h) ? r.price_change_percentage_24h : 0,
      sparkline: Array.isArray(spark) ? spark.filter(isNum) : [],
    });
  }
  return coins;
}

/** 24h move (in %) at which the toaster is fully happy or fully devastated. */
export const FULL_MOOD_CHANGE = 5;

/** Toaster mood in [-1, 1] from the average 24h change of the tracked coins. 0 with no data. */
export function marketMood(coins: Pick<Coin, 'change24h'>[]): number {
  if (!coins.length) return 0;
  const avg = coins.reduce((s, c) => s + c.change24h, 0) / coins.length;
  return Math.max(-1, Math.min(1, avg / FULL_MOOD_CHANGE));
}

export function moodLabel(mood: number): string {
  if (mood >= 0.4) return 'thrilled';
  if (mood >= 0.1) return 'hopeful';
  if (mood > -0.1) return 'meh';
  if (mood > -0.4) return 'sad';
  return 'devastated';
}

/** Widget color for a mood: green up, red down, slate when flat. */
export function moodColor(mood: number): string {
  if (mood >= 0.1) return '#34d399';
  if (mood <= -0.1) return '#f87171';
  return '#94a3b8';
}

/**
 * SVG path ("M x y L …") for a sparkline in a width × height box, y flipped
 * so higher prices are higher. Flat series draw a centered line; fewer than
 * two points draw nothing.
 */
export function sparklinePath(values: number[], width: number, height: number): string {
  const pts = values.filter(Number.isFinite);
  if (pts.length < 2 || !(width > 0) || !(height > 0)) return '';
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min;
  return pts
    .map((v, i) => {
      const x = (i / (pts.length - 1)) * width;
      const y = span === 0 ? height / 2 : height - ((v - min) / span) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

export function formatPrice(price: number): string {
  const digits = price < 1 ? 4 : price < 100 ? 2 : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(price);
}

export function formatChange(change: number): string {
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';
  return `${sign}${Math.abs(change).toFixed(2)}%`;
}

/** Cached data is fresh for `ttlMs`. Clock skew (a future timestamp) counts as stale. */
export function isFresh(savedAt: number, now: number, ttlMs: number): boolean {
  return Number.isFinite(savedAt) && savedAt <= now && now - savedAt < ttlMs;
}
