import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import Papa from 'papaparse';
import type { ProcessorOptions, ProcessingResult } from '../types/index.js';
import type { Subscriber, SubscriberStats } from '../types/subscriber.js';
import {
  parseSubscribers,
  segmentSubscribers,
  calculateSubscriberStats
} from '../parsers/subscriber-parser.js';

async function writeSubscriberCSV(
  subscribers: Subscriber[],
  filePath: string
): Promise<void> {
  const csv = Papa.unparse(subscribers.map(s => ({
    email: s.email,
    active_subscription: s.active_subscription,
    expiry: s.expiry || '',
    plan: s.plan,
    email_disabled: s.email_disabled,
    created_at: s.created_at,
    first_payment_at: s.first_payment_at || ''
  })));

  await fs.writeFile(filePath, csv, 'utf-8');
}

async function writeSubscriberJSON(
  subscribers: Subscriber[],
  filePath: string
): Promise<void> {
  await fs.writeJson(filePath, subscribers, { spaces: 2 });
}

export async function processSubscribers(options: ProcessorOptions): Promise<ProcessingResult> {
  const spinner = ora('Loading subscribers...').start();

  try {
    // Load and parse subscribers
    const subscribers = await parseSubscribers(options.archivePath);
    spinner.text = `Loaded ${subscribers.length} subscribers`;

    // Segment subscribers
    const segments = segmentSubscribers(subscribers);
    const stats = calculateSubscriberStats(subscribers);

    // Create output directory
    const outputDir = path.join(options.outputPath, 'subscribers');
    await fs.ensureDir(outputDir);

    spinner.text = 'Writing subscriber exports...';

    // Write all subscribers
    await writeSubscriberCSV(segments.all, path.join(outputDir, 'all-subscribers.csv'));
    await writeSubscriberJSON(segments.all, path.join(outputDir, 'all-subscribers.json'));

    // Write active subscribers
    await writeSubscriberCSV(segments.active, path.join(outputDir, 'active-subscribers.csv'));

    // Write paid subscribers
    await writeSubscriberCSV(segments.paid, path.join(outputDir, 'paid-subscribers.csv'));

    // Write free subscribers
    await writeSubscriberCSV(segments.free, path.join(outputDir, 'free-subscribers.csv'));

    // Write churned subscribers
    await writeSubscriberCSV(segments.churned, path.join(outputDir, 'churned-subscribers.csv'));

    // Write summary statistics
    const summary: SubscriberStats & { segments: Record<string, number> } = {
      ...stats,
      segments: {
        all: segments.all.length,
        active: segments.active.length,
        paid: segments.paid.length,
        free: segments.free.length,
        churned: segments.churned.length
      }
    };
    await fs.writeJson(path.join(outputDir, 'summary.json'), summary, { spaces: 2 });

    spinner.succeed(chalk.green('Subscriber export complete!'));

    console.log(chalk.dim(`  Total subscribers: ${stats.total}`));
    console.log(chalk.dim(`  Active: ${stats.active} | Paid: ${stats.paid} | Free: ${stats.free}`));
    console.log(chalk.dim(`  Churned: ${stats.churned} | Email disabled: ${stats.emailDisabled}`));
    console.log(chalk.dim(`  Output directory: ${outputDir}`));

    return {
      success: true,
      message: `Exported ${stats.total} subscribers to ${outputDir}`,
      stats: summary
    };
  } catch (error) {
    spinner.fail(chalk.red('Subscriber export failed'));
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(chalk.red(`  Error: ${message}`));

    return {
      success: false,
      message: `Subscriber export failed: ${message}`
    };
  }
}
