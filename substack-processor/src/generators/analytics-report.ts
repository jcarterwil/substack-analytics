import fs from 'fs-extra';
import path from 'path';
import { format } from 'date-fns';
import type { PostAnalytics, AggregateAnalytics, MonthlyTrend } from '../types/analytics.js';
import type { SubscriberStats } from '../types/subscriber.js';

export function aggregateAnalytics(postAnalytics: PostAnalytics[]): AggregateAnalytics {
  const totalDelivered = postAnalytics.reduce((sum, p) => sum + p.delivered, 0);
  const totalOpened = postAnalytics.reduce((sum, p) => sum + p.opened, 0);
  const averageOpenRate = postAnalytics.length > 0
    ? postAnalytics.reduce((sum, p) => sum + p.openRate, 0) / postAnalytics.length
    : 0;

  // Aggregate countries
  const countriesDistribution: Record<string, number> = {};
  for (const post of postAnalytics) {
    for (const [country, count] of Object.entries(post.countries)) {
      countriesDistribution[country] = (countriesDistribution[country] || 0) + count;
    }
  }

  // Aggregate devices
  const deviceDistribution: Record<string, number> = {};
  for (const post of postAnalytics) {
    for (const [device, count] of Object.entries(post.devices)) {
      deviceDistribution[device] = (deviceDistribution[device] || 0) + count;
    }
  }

  // Aggregate clients
  const clientDistribution: Record<string, number> = {};
  for (const post of postAnalytics) {
    for (const [client, count] of Object.entries(post.clients)) {
      clientDistribution[client] = (clientDistribution[client] || 0) + count;
    }
  }

  // Top posts by opens
  const topPostsByOpens = [...postAnalytics]
    .sort((a, b) => b.uniqueOpeners - a.uniqueOpeners)
    .slice(0, 10);

  // Top posts by open rate (minimum 100 delivered)
  const topPostsByOpenRate = [...postAnalytics]
    .filter(p => p.delivered >= 100)
    .sort((a, b) => b.openRate - a.openRate)
    .slice(0, 10);

  // Monthly trends
  const monthlyData: Map<string, { posts: number; delivered: number; opened: number }> = new Map();

  for (const post of postAnalytics) {
    if (!post.date) continue;
    const month = post.date.substring(0, 7);
    const existing = monthlyData.get(month) || { posts: 0, delivered: 0, opened: 0 };
    monthlyData.set(month, {
      posts: existing.posts + 1,
      delivered: existing.delivered + post.delivered,
      opened: existing.opened + post.uniqueOpeners
    });
  }

  const monthlyTrends: MonthlyTrend[] = Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      posts: data.posts,
      delivered: data.delivered,
      opened: data.opened,
      openRate: data.delivered > 0 ? (data.opened / data.delivered) * 100 : 0
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalPosts: postAnalytics.length,
    postsWithAnalytics: postAnalytics.filter(p => p.delivered > 0).length,
    totalDelivered,
    totalOpened,
    averageOpenRate: Math.round(averageOpenRate * 100) / 100,
    topPostsByOpens,
    topPostsByOpenRate,
    countriesDistribution,
    deviceDistribution,
    clientDistribution,
    monthlyTrends
  };
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

function formatPercent(num: number): string {
  return `${num.toFixed(1)}%`;
}

export function generateAnalyticsMarkdown(
  aggregate: AggregateAnalytics,
  subscriberStats?: SubscriberStats
): string {
  let report = '# Food Is Health - Analytics Report\n\n';
  report += `**Generated:** ${format(new Date(), 'MMMM d, yyyy')}\n\n`;
  report += '---\n\n';

  // Overview
  report += '## Overview\n\n';
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Total Posts Analyzed | ${formatNumber(aggregate.totalPosts)} |\n`;
  report += `| Posts with Email Analytics | ${formatNumber(aggregate.postsWithAnalytics)} |\n`;
  report += `| Total Emails Delivered | ${formatNumber(aggregate.totalDelivered)} |\n`;
  report += `| Total Opens | ${formatNumber(aggregate.totalOpened)} |\n`;
  report += `| Average Open Rate | ${formatPercent(aggregate.averageOpenRate)} |\n`;

  if (subscriberStats) {
    report += `| Total Subscribers | ${formatNumber(subscriberStats.total)} |\n`;
    report += `| Active Subscribers | ${formatNumber(subscriberStats.active)} |\n`;
    report += `| Paid Subscribers | ${formatNumber(subscriberStats.paid)} |\n`;
  }

  report += '\n---\n\n';

  // Top Posts by Opens
  report += '## Top 10 Posts by Opens\n\n';
  report += `| # | Title | Date | Opens | Delivered | Rate |\n`;
  report += `|---|-------|------|-------|-----------|------|\n`;

  aggregate.topPostsByOpens.forEach((post, i) => {
    const dateStr = post.date ? format(new Date(post.date), 'MMM d, yyyy') : 'N/A';
    const title = post.title.length > 40 ? post.title.substring(0, 37) + '...' : post.title;
    report += `| ${i + 1} | ${title} | ${dateStr} | ${formatNumber(post.uniqueOpeners)} | ${formatNumber(post.delivered)} | ${formatPercent(post.openRate)} |\n`;
  });

  report += '\n---\n\n';

  // Top Posts by Open Rate
  report += '## Top 10 Posts by Open Rate (min. 100 delivered)\n\n';
  report += `| # | Title | Date | Rate | Opens | Delivered |\n`;
  report += `|---|-------|------|------|-------|----------|\n`;

  aggregate.topPostsByOpenRate.forEach((post, i) => {
    const dateStr = post.date ? format(new Date(post.date), 'MMM d, yyyy') : 'N/A';
    const title = post.title.length > 40 ? post.title.substring(0, 37) + '...' : post.title;
    report += `| ${i + 1} | ${title} | ${dateStr} | ${formatPercent(post.openRate)} | ${formatNumber(post.uniqueOpeners)} | ${formatNumber(post.delivered)} |\n`;
  });

  report += '\n---\n\n';

  // Geographic Distribution
  report += '## Geographic Distribution\n\n';
  const topCountries = Object.entries(aggregate.countriesDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  report += `| Country | Opens |\n`;
  report += `|---------|-------|\n`;
  topCountries.forEach(([country, count]) => {
    report += `| ${country || 'Unknown'} | ${formatNumber(count)} |\n`;
  });

  report += '\n---\n\n';

  // Monthly Trends
  report += '## Monthly Trends\n\n';
  report += `| Month | Posts | Delivered | Opens | Open Rate |\n`;
  report += `|-------|-------|-----------|-------|----------|\n`;

  aggregate.monthlyTrends.forEach(trend => {
    const monthLabel = format(new Date(trend.month + '-01'), 'MMM yyyy');
    report += `| ${monthLabel} | ${trend.posts} | ${formatNumber(trend.delivered)} | ${formatNumber(trend.opened)} | ${formatPercent(trend.openRate)} |\n`;
  });

  report += '\n---\n\n';

  // Device Distribution
  if (Object.keys(aggregate.deviceDistribution).length > 0) {
    report += '## Device Distribution\n\n';
    const topDevices = Object.entries(aggregate.deviceDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    report += `| Device | Opens |\n`;
    report += `|--------|-------|\n`;
    topDevices.forEach(([device, count]) => {
      report += `| ${device || 'Unknown'} | ${formatNumber(count)} |\n`;
    });

    report += '\n---\n\n';
  }

  // Subscriber Stats (if available)
  if (subscriberStats) {
    report += '## Subscriber Breakdown\n\n';

    report += '### By Status\n\n';
    report += `| Status | Count |\n`;
    report += `|--------|-------|\n`;
    report += `| Active | ${formatNumber(subscriberStats.active)} |\n`;
    report += `| Inactive | ${formatNumber(subscriberStats.inactive)} |\n`;
    report += `| Email Disabled | ${formatNumber(subscriberStats.emailDisabled)} |\n`;

    report += '\n### By Plan\n\n';
    report += `| Plan | Count |\n`;
    report += `|------|-------|\n`;
    Object.entries(subscriberStats.byPlan)
      .sort((a, b) => b[1] - a[1])
      .forEach(([plan, count]) => {
        report += `| ${plan} | ${formatNumber(count)} |\n`;
      });

    report += '\n### Subscriber Growth by Month\n\n';
    report += `| Month | New Subscribers |\n`;
    report += `|-------|----------------|\n`;

    const sortedMonths = Object.entries(subscriberStats.byMonth)
      .sort((a, b) => a[0].localeCompare(b[0]));

    sortedMonths.slice(-12).forEach(([month, count]) => {
      const monthLabel = format(new Date(month + '-01'), 'MMM yyyy');
      report += `| ${monthLabel} | ${formatNumber(count)} |\n`;
    });
  }

  return report;
}

export async function writeAnalyticsReport(
  aggregate: AggregateAnalytics,
  subscriberStats: SubscriberStats | undefined,
  outputPath: string
): Promise<string> {
  const report = generateAnalyticsMarkdown(aggregate, subscriberStats);

  const outputDir = path.join(outputPath, 'analytics');
  await fs.ensureDir(outputDir);

  const outputFile = path.join(outputDir, 'analytics-report.md');
  await fs.writeFile(outputFile, report, 'utf-8');

  return outputFile;
}

export async function writePerPostMetrics(
  postAnalytics: PostAnalytics[],
  outputPath: string
): Promise<string> {
  const outputDir = path.join(outputPath, 'analytics');
  await fs.ensureDir(outputDir);

  // Create CSV content
  let csv = 'post_id,title,date,type,audience,delivered,opened,unique_openers,open_rate\n';

  const sorted = [...postAnalytics].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });

  for (const post of sorted) {
    const title = post.title.replace(/"/g, '""');
    const dateStr = post.date ? format(new Date(post.date), 'yyyy-MM-dd') : '';
    csv += `"${post.postId}","${title}","${dateStr}","${post.type}","${post.audience}",${post.delivered},${post.opened},${post.uniqueOpeners},${post.openRate}\n`;
  }

  const outputFile = path.join(outputDir, 'per-post-metrics.csv');
  await fs.writeFile(outputFile, csv, 'utf-8');

  return outputFile;
}
