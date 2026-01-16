import path from 'path';
import { glob } from 'glob';
import { parseCSV } from './csv-parser.js';
import type { Subscriber, SubscriberSegment, SubscriberStats } from '../types/subscriber.js';

interface RawSubscriberRow {
  email: string;
  active_subscription: string;
  expiry: string;
  plan: string;
  email_disabled: string;
  created_at: string;
  first_payment_at: string;
}

export async function parseSubscribers(archivePath: string): Promise<Subscriber[]> {
  const pattern = 'email_list.*.csv';
  const files = await glob(pattern, { cwd: archivePath });

  if (files.length === 0) {
    throw new Error('No subscriber email list found in archive');
  }

  const subscriberPath = path.join(archivePath, files[0]);
  const rows = await parseCSV<RawSubscriberRow>(subscriberPath);

  return rows.map(row => ({
    email: row.email,
    active_subscription: row.active_subscription === 'true',
    expiry: row.expiry || null,
    plan: row.plan || 'other',
    email_disabled: row.email_disabled === 'true',
    created_at: row.created_at,
    first_payment_at: row.first_payment_at || null
  }));
}

export function segmentSubscribers(subscribers: Subscriber[]): SubscriberSegment {
  const isPaid = (s: Subscriber) =>
    s.first_payment_at !== null && ['yearly', 'monthly', 'founding'].includes(s.plan);

  const isActive = (s: Subscriber) => s.active_subscription && !s.email_disabled;

  const isChurned = (s: Subscriber) =>
    isPaid(s) && !s.active_subscription;

  return {
    all: subscribers,
    active: subscribers.filter(isActive),
    paid: subscribers.filter(s => isPaid(s) && isActive(s)),
    free: subscribers.filter(s => !isPaid(s) && isActive(s)),
    churned: subscribers.filter(isChurned)
  };
}

export function calculateSubscriberStats(subscribers: Subscriber[]): SubscriberStats {
  const segments = segmentSubscribers(subscribers);

  const byPlan: Record<string, number> = {};
  const byMonth: Record<string, number> = {};

  for (const sub of subscribers) {
    byPlan[sub.plan] = (byPlan[sub.plan] || 0) + 1;

    if (sub.created_at) {
      const month = sub.created_at.substring(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    }
  }

  return {
    total: subscribers.length,
    active: segments.active.length,
    inactive: subscribers.length - segments.active.length,
    paid: segments.paid.length,
    free: segments.free.length,
    churned: segments.churned.length,
    emailDisabled: subscribers.filter(s => s.email_disabled).length,
    byPlan,
    byMonth
  };
}
