import ora from 'ora';
import chalk from 'chalk';
import type { ProcessorOptions, ProcessingResult } from '../types/index.js';
import { loadPostsWithContent } from '../parsers/posts-parser.js';
import { generateConsolidatedMarkdown } from '../generators/consolidated-export.js';

export async function processContent(options: ProcessorOptions): Promise<ProcessingResult> {
  const spinner = ora('Loading posts...').start();

  try {
    // Load posts with HTML content
    const posts = await loadPostsWithContent(options.archivePath, options.verbose);
    spinner.text = `Loaded ${posts.length} posts`;

    // Filter published posts with content
    const publishedWithContent = posts.filter(p => p.is_published && p.htmlContent);
    spinner.text = `Found ${publishedWithContent.length} published posts with content`;

    // Generate consolidated markdown
    spinner.text = 'Generating consolidated markdown...';
    const result = await generateConsolidatedMarkdown(
      posts,
      options.outputPath,
      options.verbose
    );

    const sizeMB = (result.sizeBytes / (1024 * 1024)).toFixed(2);
    spinner.succeed(chalk.green(`Content export complete!`));

    console.log(chalk.dim(`  Posts exported: ${result.postCount}`));
    console.log(chalk.dim(`  Output file: ${result.outputFile}`));
    console.log(chalk.dim(`  File size: ${sizeMB} MB`));

    return {
      success: true,
      message: `Exported ${result.postCount} posts to ${result.outputFile}`,
      stats: {
        postsExported: result.postCount,
        outputFile: result.outputFile,
        sizeBytes: result.sizeBytes
      }
    };
  } catch (error) {
    spinner.fail(chalk.red('Content export failed'));
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(chalk.red(`  Error: ${message}`));

    return {
      success: false,
      message: `Content export failed: ${message}`
    };
  }
}
