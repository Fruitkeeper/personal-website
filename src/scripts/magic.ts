// Magic planet: open a 5-card booster of real cards from Scryfall, revealed
// one by one, rare last with a foil shimmer. Pure logic in src/lib/magic.ts.
import { REQUEST_GAP_MS, boosterQueries, parseCard, type Card } from '../lib/magic';
import { HOP_EVENT } from '../lib/toaster';

const API = 'https://api.scryfall.com';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function scryfall(path: string): Promise<Card> {
  const res = await fetch(`${API}${path}`, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Scryfall ${res.status}`);
  const card = parseCard(await res.json());
  if (!card) throw new Error('Unusable card data');
  return card;
}

function cardSlot(): { li: HTMLLIElement; reveal: (card: Card) => Promise<void>; fail: () => void } {
  const li = document.createElement('li');
  const wrap = document.createElement('span');
  wrap.className = 'card';
  const back = document.createElement('span');
  back.className = 'back';
  back.setAttribute('aria-hidden', 'true');
  wrap.append(back);
  li.append(wrap);

  return {
    li,
    async reveal(card) {
      const link = document.createElement('a');
      link.className = `face${card.foil ? ' foil' : ''}`;
      link.href = card.href;
      link.target = '_blank';
      link.rel = 'noopener';
      link.title = `${card.name} — ${card.set}`;
      const img = document.createElement('img');
      img.src = card.image;
      img.alt = `${card.name} (${card.rarity})`;
      link.append(img);
      wrap.append(link);
      // Flip only once the art is ready, so the card never flips to a blank.
      await img.decode().catch(() => {});
      wrap.classList.add('revealed');
    },
    fail() {
      back.classList.add('failed');
    },
  };
}

export function mountMagic() {
  const root = document.querySelector<HTMLElement>('[data-magic]');
  if (!root) return;
  const pack = root.querySelector<HTMLButtonElement>('[data-open-pack]')!;
  const fan = root.querySelector<HTMLOListElement>('[data-fan]')!;
  const status = root.querySelector<HTMLElement>('[data-magic-status]')!;
  const again = root.querySelector<HTMLButtonElement>('[data-open-again]')!;
  const favorite = root.dataset.favorite ?? '';
  let opening = false;

  const open = async () => {
    if (opening) return;
    opening = true;
    again.hidden = true;
    status.textContent = 'Ripping…';
    pack.classList.add('ripping');
    await sleep(450);
    pack.hidden = true;

    const paths = boosterQueries(Math.random()).map((q) => `/cards/random?q=${encodeURIComponent(q)}`);
    // Your favorite card takes the first common slot.
    if (favorite) paths[0] = `/cards/named?exact=${encodeURIComponent(favorite)}`;
    const slots = paths.map(() => cardSlot());
    fan.replaceChildren(...slots.map((s) => s.li));
    fan.hidden = false;

    let got = 0;
    let best: Card | null = null;
    for (let i = 0; i < paths.length; i++) {
      if (i > 0) await sleep(REQUEST_GAP_MS);
      try {
        const card = await scryfall(paths[i]);
        await slots[i].reveal(card);
        got++;
        if (card.foil) best = card;
      } catch (err) {
        console.warn('Booster slot failed.', err);
        slots[i].fail();
      }
    }

    if (!got) status.textContent = "Scryfall didn't answer — the pack was empty. Try again in a moment.";
    else if (best) {
      status.textContent = `${best.rarity === 'mythic' ? 'MYTHIC' : 'Rare'} pull: ${best.name}!`;
      window.dispatchEvent(new CustomEvent(HOP_EVENT));
    } else status.textContent = 'Nice pack.';
    again.hidden = false;
    opening = false;
  };

  pack.addEventListener('click', open);
  again.addEventListener('click', open);
}
