// Pure helpers for blog posts. Kept free of `astro:content` imports so they
// can be unit tested in isolation.

export type PostLike = {
  data: { pubDate: Date; draft?: boolean };
};

/** Drafts are visible in dev only. */
export function isVisible(post: PostLike, isProd: boolean): boolean {
  return !(isProd && post.data.draft);
}

/** Newest first. Returns a new array; does not mutate the input. */
export function sortNewestFirst<T extends PostLike>(posts: readonly T[]): T[] {
  return [...posts].sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/** Visible posts, newest first. */
export function preparePosts<T extends PostLike>(posts: readonly T[], isProd: boolean): T[] {
  return sortNewestFirst(posts.filter((p) => isVisible(p, isProd)));
}

const WORDS_PER_MINUTE = 220;

/** Estimated minutes to read, never less than 1. Ignores fenced code blocks. */
export function readingTime(markdown: string | undefined): number {
  if (!markdown) return 1;
  const prose = markdown.replace(/```[\s\S]*?```/g, ' ');
  const words = prose.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  // Frontmatter dates parse as UTC midnight; formatting in the local zone
  // would show the previous day for anyone west of UTC.
  timeZone: 'UTC',
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

/** Machine-readable YYYY-MM-DD for <time datetime>. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
