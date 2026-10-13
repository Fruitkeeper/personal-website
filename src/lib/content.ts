import { getCollection } from 'astro:content';
import { preparePosts } from './posts';

/** Every page that lists posts goes through here so draft handling stays consistent. */
export async function getPosts() {
  return preparePosts(await getCollection('blog'), import.meta.env.PROD);
}
