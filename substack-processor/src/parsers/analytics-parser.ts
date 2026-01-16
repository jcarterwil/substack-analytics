import path from 'path';
import { glob } from 'glob';
import { parseCSV } from './csv-parser.js';
import type { OpenRecord, DeliverRecord, PostAnalytics } from '../types/analytics.js';

interface RawOpenRow {
  post_id: string;
  timestamp: string;
  email: string;
  post_type: string;
  post_audience: string;
  active_subscription: string;
  country: string;
  city: string;
  region: string;
  device_type: string;
  client_os: string;
  client_type: string;
  user_agent: string;
}

interface RawDeliverRow {
  post_id: string;
  timestamp: string;
  email: string;
  post_type: string;
  post_audience: string;
  active_subscription: string;
}

export async function parseOpensForPost(filePath: string): Promise<OpenRecord[]> {
  const rows = await parseCSV<RawOpenRow>(filePath);

  return rows.map(row => ({
    post_id: row.post_id,
    timestamp: row.timestamp,
    email: row.email,
    post_type: row.post_type,
    post_audience: row.post_audience,
    active_subscription: row.active_subscription === 'true',
    country: row.country || '',
    city: row.city || '',
    region: row.region || '',
    device_type: row.device_type || '',
    client_os: row.client_os || '',
    client_type: row.client_type || '',
    user_agent: row.user_agent || ''
  }));
}

export async function parseDeliversForPost(filePath: string): Promise<DeliverRecord[]> {
  const rows = await parseCSV<RawDeliverRow>(filePath);

  return rows.map(row => ({
    post_id: row.post_id,
    timestamp: row.timestamp,
    email: row.email,
    post_type: row.post_type,
    post_audience: row.post_audience,
    active_subscription: row.active_subscription === 'true'
  }));
}

export async function findAnalyticsFiles(archivePath: string): Promise<{
  opens: Map<string, string>;
  delivers: Map<string, string>;
}> {
  const postsDir = path.join(archivePath, 'posts');

  const opensFiles = await glob('*.opens.csv', { cwd: postsDir });
  const deliversFiles = await glob('*.delivers.csv', { cwd: postsDir });

  const opens = new Map<string, string>();
  const delivers = new Map<string, string>();

  for (const file of opensFiles) {
    const postId = file.replace('.opens.csv', '');
    opens.set(postId, path.join(postsDir, file));
  }

  for (const file of deliversFiles) {
    const postId = file.replace('.delivers.csv', '');
    delivers.set(postId, path.join(postsDir, file));
  }

  return { opens, delivers };
}

export async function loadPostAnalytics(
  postId: string,
  opensPath: string | undefined,
  deliversPath: string | undefined,
  title: string,
  date: string | null,
  type: string,
  audience: string
): Promise<PostAnalytics> {
  let opens: OpenRecord[] = [];
  let delivers: DeliverRecord[] = [];

  if (opensPath) {
    opens = await parseOpensForPost(opensPath);
  }

  if (deliversPath) {
    delivers = await parseDeliversForPost(deliversPath);
  }

  const uniqueOpeners = new Set(opens.map(o => o.email)).size;
  const openRate = delivers.length > 0 ? (uniqueOpeners / delivers.length) * 100 : 0;

  const countries: Record<string, number> = {};
  const devices: Record<string, number> = {};
  const clients: Record<string, number> = {};

  for (const open of opens) {
    if (open.country) {
      countries[open.country] = (countries[open.country] || 0) + 1;
    }
    if (open.device_type) {
      devices[open.device_type] = (devices[open.device_type] || 0) + 1;
    }
    if (open.client_type) {
      clients[open.client_type] = (clients[open.client_type] || 0) + 1;
    }
  }

  return {
    postId,
    title,
    date,
    type,
    audience,
    delivered: delivers.length,
    opened: opens.length,
    openRate: Math.round(openRate * 100) / 100,
    uniqueOpeners,
    countries,
    devices,
    clients
  };
}

export async function loadAllAnalytics(
  archivePath: string,
  postsMetadata: Array<{ post_id: string; title: string; post_date: string | null; type: string; audience: string }>,
  verbose = false
): Promise<PostAnalytics[]> {
  const { opens, delivers } = await findAnalyticsFiles(archivePath);

  if (verbose) {
    console.log(`  Found ${opens.size} opens files`);
    console.log(`  Found ${delivers.size} delivers files`);
  }

  const analytics: PostAnalytics[] = [];

  for (const post of postsMetadata) {
    const opensPath = opens.get(post.post_id);
    const deliversPath = delivers.get(post.post_id);

    if (opensPath || deliversPath) {
      const postAnalytics = await loadPostAnalytics(
        post.post_id,
        opensPath,
        deliversPath,
        post.title,
        post.post_date,
        post.type,
        post.audience
      );
      analytics.push(postAnalytics);
    }
  }

  return analytics;
}
