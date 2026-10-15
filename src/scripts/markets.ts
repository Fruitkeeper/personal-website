// Markets widget: fetches prices from CoinGecko, renders the panel, recolors
// the widget, and broadcasts the toaster's mood. Pure logic in src/lib/markets.ts.
import {
  formatChange,
  formatPrice,
  isFresh,
  marketMood,
  moodColor,
  moodLabel,
  parseMarkets,
  sparklinePath,
  type Coin,
} from '../lib/markets';
import { MOOD_EVENT } from '../lib/toaster';

const API = 'https://api.coingecko.com/api/v3/coins/markets';
const CACHE_KEY = 'markets:v1';
const CACHE_TTL_MS = 5 * 60 * 1000;
const REFRESH_MS = 3 * 60 * 1000;
const SPARK_W = 120;
const SPARK_H = 28;
const SVG_NS = 'http://www.w3.org/2000/svg';

type Cached = { at: number; coins: Coin[] };

// localStorage can be unavailable or throw (private mode, blocked storage);
// the cache is an optimization, so failures are ignored.
function readCache(key: string): Cached | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? 'null');
    return parsed && Array.isArray(parsed.coins) ? parsed : null;
  } catch {
    return null;
  }
}
function writeCache(key: string, coins: Coin[]) {
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), coins }));
  } catch {
    /* ignore */
  }
}

async function fetchCoins(ids: string[]): Promise<Coin[]> {
  const url = `${API}?vs_currency=usd&ids=${encodeURIComponent(ids.join(','))}&sparkline=true&price_change_percentage=24h`;
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const coins = parseMarkets(await res.json());
  if (!coins.length) throw new Error('CoinGecko returned no usable data');
  // Keep the configured order.
  return ids.map((id) => coins.find((c) => c.id === id)).filter((c): c is Coin => !!c);
}

function coinRow(coin: Coin): HTMLLIElement {
  const li = document.createElement('li');
  const dir = coin.change24h >= 0 ? 'up' : 'down';

  const label = document.createElement('span');
  const sym = document.createElement('span');
  sym.className = 'sym';
  sym.textContent = coin.symbol;
  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = coin.name;
  label.append(sym, name);

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${SPARK_W} ${SPARK_H}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add(dir);
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', sparklinePath(coin.sparkline, SPARK_W, SPARK_H));
  path.setAttribute('stroke', 'currentColor');
  svg.append(path);

  const nums = document.createElement('span');
  nums.className = 'nums';
  nums.textContent = formatPrice(coin.price);
  const change = document.createElement('span');
  change.className = `change ${dir}`;
  change.textContent = formatChange(coin.change24h);
  nums.append(change);

  li.append(label, svg, nums);
  li.setAttribute('aria-label', `${coin.name}: ${formatPrice(coin.price)}, ${formatChange(coin.change24h)} in 24 hours`);
  return li;
}

function message(list: HTMLElement, text: string, className: string) {
  const li = document.createElement('li');
  li.className = className;
  li.textContent = text;
  list.replaceChildren(li);
}

export function mountMarkets() {
  const panel = document.querySelector<HTMLElement>('[data-markets]');
  if (!panel) return;
  const ids = (panel.dataset.coins ?? '').split(',').filter(Boolean);
  const list = panel.querySelector<HTMLElement>('[data-coin-list]')!;
  const label = panel.querySelector<HTMLElement>('[data-mood-label]')!;
  const avg = panel.querySelector<HTMLElement>('[data-mood-change]')!;
  // The markets moon and its panel both take the mood color.
  const tinted = document.querySelectorAll<HTMLElement>('[data-widget-kind="markets"]');
  const cacheKey = `${CACHE_KEY}:${ids.join(',')}`;

  const show = (coins: Coin[]) => {
    const mood = marketMood(coins);
    list.replaceChildren(...coins.map(coinRow));
    label.textContent = moodLabel(mood);
    const avgChange = coins.reduce((s, c) => s + c.change24h, 0) / coins.length;
    avg.textContent = `(${formatChange(avgChange)} avg, 24h)`;
    for (const el of tinted) el.style.setProperty('--widget', moodColor(mood));
    document.documentElement.dataset.mood = mood.toFixed(3);
    window.dispatchEvent(new CustomEvent(MOOD_EVENT, { detail: { mood } }));
  };

  const load = async () => {
    const cached = readCache(cacheKey);
    if (cached && isFresh(cached.at, Date.now(), CACHE_TTL_MS)) return show(cached.coins);
    try {
      const coins = await fetchCoins(ids);
      writeCache(cacheKey, coins);
      show(coins);
    } catch (err) {
      console.warn('Markets unavailable.', err);
      // Stale data beats nothing; otherwise leave the toaster in his usual mood.
      if (cached?.coins.length) show(cached.coins);
      else {
        message(list, 'Markets are unreachable right now. The toaster is sad anyway.', 'error');
        label.textContent = 'his usual sad self';
      }
    }
  };

  load();
  let timer = window.setInterval(load, REFRESH_MS);
  document.addEventListener('visibilitychange', () => {
    clearInterval(timer);
    if (!document.hidden) {
      load();
      timer = window.setInterval(load, REFRESH_MS);
    }
  });
}
