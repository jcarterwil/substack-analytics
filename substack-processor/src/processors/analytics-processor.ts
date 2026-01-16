import ora from 'ora';
import chalk from 'chalk';
import type { ProcessorOptions, ProcessingResult } from '../types/index.js';
import { parsePostsMetadata } from '../parsers/posts-parser.js';
import { parseSubscribers, calculateSubscriberStats } from '../parsers/subscriber-parser.js';
import { loadAllAnalytics } from '../parsers/analytics-parser.js';
import {
  aggregateAnalytics,
  writeAnalyticsReport,
  writePerPostMetrics
} from '../generators/analytics-report.js';

export async function processAnalytics(options: ProcessorOptions): Promise<ProcessingResult> {
  const spinner = ora('Loading post metadata...').start();

  try {
    // Load post metadata
    const postsMetadata = await parsePostsMetadata(options.archivePath);
    const publishedPosts = postsMetadata.filter(p => p.is_published);
    spinner.text = `Found ${publishedPosts.length} published posts`;

    // Load subscriber stats
    spinner.text = 'Loading subscriber data...';
    let subscriberStats;
    try {
      const subscribers = await parseSubscribers(options.archivePath);
      subscriberStats = calculateSubscriberStats(subscribers);
    } catch {
      if (options.verbose) {
        console.log(chalk.dim('  No subscriber data found, continuing without it'));
      }
    }

    // Load analytics for all posts
    spinner.text = 'Loading email analytics...';
    const postAnalytics = await loadAllAnalytics(
      options.archivePath,
      publishedPosts,
      options.verbose
    );
    spinner.text = `Loaded analytics for ${postAnalytics.length} posts`;

    // Aggregate analytics
    spinner.text = 'Aggregating analytics...';
    const aggregate = aggregateAnalytics(postAnalytics);

    // Write reports
    spinner.text = 'Generating reports...';
    const reportFile = await writeAnalyticsReport(
      aggregate,
      subscriberStats,
      options.outputPath
    );

    const metricsFile = await writePerPostMetrics(postAnalytics, options.outputPath);

    spinner.succeed(chalk.green('Analytics processing complete!'));

    console.log(chalk.dim(`  Posts analyzed: ${aggregate.totalPosts}`));
    console.log(chalk.dim(`  Posts with email data: ${aggregate.postsWithAnalytics}`));
    console.log(chalk.dim(`  Total emails delivered: ${aggregate.totalDelivered.toLocaleString()}`));
    console.log(chalk.dim(`  Average open rate: ${aggregate.averageOpenRate.toFixed(1)}%`));
    console.log(chalk.dim(`  Report: ${reportFile}`));
    console.log(chalk.dim(`  Metrics: ${metricsFile}`));

    return {
      success: true,
      message: `Generated analytics for ${aggregate.totalPosts} posts`,
      stats: {
        postsAnalyzed: aggregate.totalPosts,
        postsWithAnalytics: aggregate.postsWithAnalytics,
        totalDelivered: aggregate.totalDelivered,
        totalOpened: aggregate.totalOpened,
        averageOpenRate: aggregate.averageOpenRate,
        reportFile,
        metricsFile
      }
    };
  } catch (error) {
    spinner.fail(chalk.red('Analytics processing failed'));
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(chalk.red(`  Error: ${message}`));

    return {
      success: false,
      message: `Analytics processing failed: ${message}`
    };
  }
}
