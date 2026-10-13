import type { Project } from '../config/site';

const DEFAULT_ACCENT: [string, string] = ['#7c5cff', '#22d3ee'];

export function featuredProjects(all: readonly Project[]): Project[] {
  return all.filter((p) => p.featured);
}

export function accentOf(project: Project): [string, string] {
  return project.accent ?? DEFAULT_ACCENT;
}

/** True for absolute http(s) links, which should open in a new tab. */
export function isExternal(href: string | undefined): boolean {
  return !!href && /^https?:\/\//i.test(href);
}
