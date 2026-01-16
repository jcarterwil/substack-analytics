import path from 'path';
import fs from 'fs-extra';
import { glob } from 'glob';
import { parseCSV } from './csv-parser.js';
import type { PostMetadata, ParsedPostId } from '../types/post.js';

interface RawPostRow {
  post_id: string;
  post_date: string;
  is_published: string;
  email_sent_at: string;
  inbox_sent_at: string;
  type: string;
  audience: string;
  title: string;
  subtitle: string;
  podcast_url: string;
}

export function parsePostId(postIdField: string): ParsedPostId {
  const parts = postIdField.split('.');
  const id = parts[0];
  const slug = parts.slice(1).join('.') || undefined;
  return { id, slug };
}

export async function parsePostsMetadata(archivePath: string): Promise<PostMetadata[]> {
  const postsPath = path.join(archivePath, 'posts.csv');
  const rows = await parseCSV<RawPostRow>(postsPath);

  return rows.map(row => {
    const { id, slug } = parsePostId(row.post_id);
    return {
      post_id: id,
      slug,
      post_date: row.post_date || null,
      is_published: row.is_published === 'true',
      email_sent_at: row.email_sent_at || null,
      inbox_sent_at: row.inbox_sent_at || null,
      type: row.type || 'newsletter',
      audience: row.audience || 'everyone',
      title: row.title || '',
      subtitle: row.subtitle || '',
      podcast_url: row.podcast_url || ''
    };
  });
}

export async function findHtmlFiles(archivePath: string): Promise<Map<string, string>> {
  const postsDir = path.join(archivePath, 'posts');
  const htmlFiles = await glob('*.html', { cwd: postsDir });

  const htmlMap = new Map<string, string>();

  for (const file of htmlFiles) {
    const { id } = parsePostId(file.replace('.html', ''));
    htmlMap.set(id, path.join(postsDir, file));
  }

  return htmlMap;
}

export async function loadPostsWithContent(
  archivePath: string,
  verbose = false
): Promise<PostMetadata[]> {
  const metadata = await parsePostsMetadata(archivePath);
  const htmlMap = await findHtmlFiles(archivePath);

  const posts: PostMetadata[] = [];
  let matched = 0;
  let unmatched = 0;

  for (const post of metadata) {
    const htmlPath = htmlMap.get(post.post_id);

    if (htmlPath) {
      const htmlContent = await fs.readFile(htmlPath, 'utf-8');
      posts.push({
        ...post,
        htmlPath,
        htmlContent
      });
      matched++;
    } else {
      posts.push(post);
      unmatched++;
    }
  }

  if (verbose) {
    console.log(`  Posts with HTML: ${matched}`);
    console.log(`  Posts without HTML: ${unmatched}`);
  }

  return posts;
}

export async function getPublishedPosts(archivePath: string): Promise<PostMetadata[]> {
  const posts = await loadPostsWithContent(archivePath);
  return posts
    .filter(p => p.is_published && p.htmlContent)
    .sort((a, b) => {
      const dateA = a.post_date ? new Date(a.post_date).getTime() : 0;
      const dateB = b.post_date ? new Date(b.post_date).getTime() : 0;
      return dateB - dateA;
    });
}
