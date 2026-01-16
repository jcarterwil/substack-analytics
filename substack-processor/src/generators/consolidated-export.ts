import fs from 'fs-extra';
import path from 'path';
import { format } from 'date-fns';
import type { PostMetadata } from '../types/post.js';
import { convertPostToMarkdown } from '../converters/html-to-markdown.js';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

function generateTableOfContents(posts: PostMetadata[]): string {
  let toc = '## Table of Contents\n\n';

  posts.forEach((post, index) => {
    const title = post.title || 'Untitled';
    const slug = generateSlug(title);
    const dateStr = post.post_date
      ? format(new Date(post.post_date), 'MMM d, yyyy')
      : 'Unknown date';

    toc += `${index + 1}. [${title}](#${slug}) - ${dateStr}\n`;
  });

  return toc;
}

export async function generateConsolidatedMarkdown(
  posts: PostMetadata[],
  outputPath: string,
  verbose = false
): Promise<{ postCount: number; outputFile: string; sizeBytes: number }> {
  // Filter to only published posts with content
  const publishedPosts = posts
    .filter(p => p.is_published && p.htmlContent)
    .sort((a, b) => {
      const dateA = a.post_date ? new Date(a.post_date).getTime() : 0;
      const dateB = b.post_date ? new Date(b.post_date).getTime() : 0;
      return dateB - dateA;
    });

  if (verbose) {
    console.log(`  Processing ${publishedPosts.length} published posts...`);
  }

  // Build the consolidated document
  let document = '# Food Is Health - Complete Archive\n\n';
  document += `**Generated:** ${format(new Date(), 'MMMM d, yyyy')}\n`;
  document += `**Total Posts:** ${publishedPosts.length}\n\n`;
  document += '---\n\n';

  // Add table of contents
  document += generateTableOfContents(publishedPosts);
  document += '\n---\n\n';

  // Add each post
  for (let i = 0; i < publishedPosts.length; i++) {
    const post = publishedPosts[i];

    if (verbose && (i + 1) % 50 === 0) {
      console.log(`    Processed ${i + 1}/${publishedPosts.length} posts...`);
    }

    const postMarkdown = convertPostToMarkdown(
      post.htmlContent!,
      post.title,
      post.post_date,
      post.type,
      post.audience,
      post.subtitle
    );

    document += postMarkdown;
    document += '\n\n---\n\n';
  }

  // Write to file
  const outputDir = path.join(outputPath, 'content');
  await fs.ensureDir(outputDir);

  const outputFile = path.join(outputDir, 'all-posts.md');
  await fs.writeFile(outputFile, document, 'utf-8');

  const stats = await fs.stat(outputFile);

  return {
    postCount: publishedPosts.length,
    outputFile,
    sizeBytes: stats.size
  };
}

export async function generateIndividualPosts(
  posts: PostMetadata[],
  outputPath: string,
  verbose = false
): Promise<{ postCount: number; outputDir: string }> {
  const publishedPosts = posts
    .filter(p => p.is_published && p.htmlContent)
    .sort((a, b) => {
      const dateA = a.post_date ? new Date(a.post_date).getTime() : 0;
      const dateB = b.post_date ? new Date(b.post_date).getTime() : 0;
      return dateB - dateA;
    });

  const outputDir = path.join(outputPath, 'content', 'individual');
  await fs.ensureDir(outputDir);

  for (const post of publishedPosts) {
    const postMarkdown = convertPostToMarkdown(
      post.htmlContent!,
      post.title,
      post.post_date,
      post.type,
      post.audience,
      post.subtitle
    );

    const datePrefix = post.post_date
      ? format(new Date(post.post_date), 'yyyy-MM-dd')
      : 'unknown';

    const slug = post.slug || generateSlug(post.title || 'untitled');
    const filename = `${datePrefix}-${slug}.md`;

    await fs.writeFile(path.join(outputDir, filename), postMarkdown, 'utf-8');
  }

  if (verbose) {
    console.log(`  Generated ${publishedPosts.length} individual post files`);
  }

  return {
    postCount: publishedPosts.length,
    outputDir
  };
}
