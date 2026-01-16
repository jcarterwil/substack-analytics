import fs from 'fs-extra';
import path from 'path';
import { parsePostsMetadata } from './parsers/posts-parser.js';
import { parseSubscribers, calculateSubscriberStats } from './parsers/subscriber-parser.js';
import { loadAllAnalytics } from './parsers/analytics-parser.js';
import { aggregateAnalytics } from './generators/analytics-report.js';

const archivePath = path.resolve('../archive');
const outputPath = path.resolve('../substack-dashboard/public/data');

async function exportDashboardData() {
  console.log('Exporting dashboard data...');

  await fs.ensureDir(outputPath);

  // Load posts metadata
  const postsMetadata = await parsePostsMetadata(archivePath);
  const publishedPosts = postsMetadata.filter(p => p.is_published);

  // Load subscribers
  const subscribers = await parseSubscribers(archivePath);
  const subscriberStats = calculateSubscriberStats(subscribers);

  // Load analytics
  const postAnalytics = await loadAllAnalytics(archivePath, publishedPosts, false);
  const aggregate = aggregateAnalytics(postAnalytics);

  // Export overview data
  const overview = {
    totalPosts: publishedPosts.length,
    postsWithAnalytics: aggregate.postsWithAnalytics,
    totalDelivered: aggregate.totalDelivered,
    totalOpened: aggregate.totalOpened,
    averageOpenRate: aggregate.averageOpenRate,
    subscribers: {
      total: subscriberStats.total,
      active: subscriberStats.active,
      paid: subscriberStats.paid,
      free: subscriberStats.free,
      churned: subscriberStats.churned
    }
  };

  await fs.writeJson(path.join(outputPath, 'overview.json'), overview, { spaces: 2 });
  console.log('  Exported overview.json');

  // Export monthly trends
  await fs.writeJson(path.join(outputPath, 'monthly-trends.json'), aggregate.monthlyTrends, { spaces: 2 });
  console.log('  Exported monthly-trends.json');

  // Export top posts
  const topPosts = {
    byOpens: aggregate.topPostsByOpens.map(p => ({
      title: p.title,
      date: p.date,
      opens: p.uniqueOpeners,
      delivered: p.delivered,
      openRate: p.openRate
    })),
    byOpenRate: aggregate.topPostsByOpenRate.map(p => ({
      title: p.title,
      date: p.date,
      opens: p.uniqueOpeners,
      delivered: p.delivered,
      openRate: p.openRate
    }))
  };

  await fs.writeJson(path.join(outputPath, 'top-posts.json'), topPosts, { spaces: 2 });
  console.log('  Exported top-posts.json');

  // Export geographic data
  const geoData = Object.entries(aggregate.countriesDistribution)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  await fs.writeJson(path.join(outputPath, 'geo-distribution.json'), geoData, { spaces: 2 });
  console.log('  Exported geo-distribution.json');

  // Export subscriber growth
  const subscriberGrowth = Object.entries(subscriberStats.byMonth)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  await fs.writeJson(path.join(outputPath, 'subscriber-growth.json'), subscriberGrowth, { spaces: 2 });
  console.log('  Exported subscriber-growth.json');

  // Export all post analytics for table
  const allPostsData = postAnalytics
    .map(p => ({
      title: p.title,
      date: p.date,
      type: p.type,
      audience: p.audience,
      delivered: p.delivered,
      opens: p.uniqueOpeners,
      openRate: p.openRate
    }))
    .sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });

  await fs.writeJson(path.join(outputPath, 'all-posts.json'), allPostsData, { spaces: 2 });
  console.log('  Exported all-posts.json');

  // Export subscriber stats
  await fs.writeJson(path.join(outputPath, 'subscriber-stats.json'), subscriberStats, { spaces: 2 });
  console.log('  Exported subscriber-stats.json');

  console.log('\nDashboard data export complete!');
}

exportDashboardData().catch(console.error);
