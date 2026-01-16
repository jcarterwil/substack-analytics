import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { processContent } from './processors/content-processor.js';
import { processSubscribers } from './processors/subscriber-processor.js';
import { processAnalytics } from './processors/analytics-processor.js';
import type { ProcessorOptions } from './types/index.js';

const program = new Command();

program
  .name('substack-processor')
  .description('Process Substack archive for content export, subscriber analysis, and analytics')
  .version('1.0.0');

async function validateArchivePath(archivePath: string): Promise<string> {
  const resolvedPath = path.resolve(archivePath);

  if (!await fs.pathExists(resolvedPath)) {
    throw new Error(`Archive path does not exist: ${resolvedPath}`);
  }

  const postsCSV = path.join(resolvedPath, 'posts.csv');
  if (!await fs.pathExists(postsCSV)) {
    throw new Error(`posts.csv not found in archive path. Is this a valid Substack export?`);
  }

  return resolvedPath;
}

async function getOutputPath(outputOption: string | undefined, archivePath: string): Promise<string> {
  if (outputOption) {
    const outputPath = path.resolve(outputOption);
    await fs.ensureDir(outputPath);
    return outputPath;
  }

  // Default: create output folder next to archive
  const outputPath = path.join(path.dirname(archivePath), 'output');
  await fs.ensureDir(outputPath);
  return outputPath;
}

// Full processing command
program
  .command('process')
  .description('Run all processing: content, subscribers, and analytics')
  .argument('<archive>', 'Path to Substack archive folder')
  .option('-o, --output <path>', 'Output directory (default: ./output)')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (archiveArg: string, opts: { output?: string; verbose: boolean }) => {
    console.log(chalk.bold('\n📚 Substack Archive Processor\n'));

    try {
      const archivePath = await validateArchivePath(archiveArg);
      const outputPath = await getOutputPath(opts.output, archivePath);

      console.log(chalk.dim(`Archive: ${archivePath}`));
      console.log(chalk.dim(`Output: ${outputPath}\n`));

      const options: ProcessorOptions = {
        archivePath,
        outputPath,
        verbose: opts.verbose
      };

      // Process content
      console.log(chalk.blue('\n1. Content Export'));
      const contentResult = await processContent(options);

      // Process subscribers
      console.log(chalk.blue('\n2. Subscriber Export'));
      const subscriberResult = await processSubscribers(options);

      // Process analytics
      console.log(chalk.blue('\n3. Analytics'));
      const analyticsResult = await processAnalytics(options);

      // Summary
      console.log(chalk.bold('\n✅ Processing Complete!\n'));

      if (!contentResult.success || !subscriberResult.success || !analyticsResult.success) {
        console.log(chalk.yellow('Some tasks had errors. Check output above for details.'));
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red(`\n❌ Error: ${message}\n`));
      process.exit(1);
    }
  });

// Content-only command
program
  .command('content')
  .description('Export posts to consolidated markdown')
  .argument('<archive>', 'Path to Substack archive folder')
  .option('-o, --output <path>', 'Output directory')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (archiveArg: string, opts: { output?: string; verbose: boolean }) => {
    console.log(chalk.bold('\n📝 Content Export\n'));

    try {
      const archivePath = await validateArchivePath(archiveArg);
      const outputPath = await getOutputPath(opts.output, archivePath);

      const options: ProcessorOptions = {
        archivePath,
        outputPath,
        verbose: opts.verbose
      };

      const result = await processContent(options);

      if (!result.success) {
        process.exit(1);
      }

      console.log(chalk.bold('\n✅ Content export complete!\n'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red(`\n❌ Error: ${message}\n`));
      process.exit(1);
    }
  });

// Subscribers-only command
program
  .command('subscribers')
  .description('Export subscriber lists and statistics')
  .argument('<archive>', 'Path to Substack archive folder')
  .option('-o, --output <path>', 'Output directory')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (archiveArg: string, opts: { output?: string; verbose: boolean }) => {
    console.log(chalk.bold('\n👥 Subscriber Export\n'));

    try {
      const archivePath = await validateArchivePath(archiveArg);
      const outputPath = await getOutputPath(opts.output, archivePath);

      const options: ProcessorOptions = {
        archivePath,
        outputPath,
        verbose: opts.verbose
      };

      const result = await processSubscribers(options);

      if (!result.success) {
        process.exit(1);
      }

      console.log(chalk.bold('\n✅ Subscriber export complete!\n'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red(`\n❌ Error: ${message}\n`));
      process.exit(1);
    }
  });

// Analytics-only command
program
  .command('analytics')
  .description('Generate analytics reports')
  .argument('<archive>', 'Path to Substack archive folder')
  .option('-o, --output <path>', 'Output directory')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (archiveArg: string, opts: { output?: string; verbose: boolean }) => {
    console.log(chalk.bold('\n📊 Analytics Processing\n'));

    try {
      const archivePath = await validateArchivePath(archiveArg);
      const outputPath = await getOutputPath(opts.output, archivePath);

      const options: ProcessorOptions = {
        archivePath,
        outputPath,
        verbose: opts.verbose
      };

      const result = await processAnalytics(options);

      if (!result.success) {
        process.exit(1);
      }

      console.log(chalk.bold('\n✅ Analytics processing complete!\n'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red(`\n❌ Error: ${message}\n`));
      process.exit(1);
    }
  });

export { program };
