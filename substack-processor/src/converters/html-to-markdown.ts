import TurndownService from 'turndown';
import { addSubstackRules } from './substack-rules.js';

let turndownInstance: TurndownService | null = null;

export function getTurndownService(): TurndownService {
  if (!turndownInstance) {
    turndownInstance = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined'
    });

    // Add Substack-specific rules
    addSubstackRules(turndownInstance);

    // Keep certain elements as-is
    turndownInstance.keep(['sup', 'sub']);

    // Remove script and style tags
    turndownInstance.remove(['script', 'style', 'noscript']);
  }

  return turndownInstance;
}

export function htmlToMarkdown(html: string): string {
  const turndown = getTurndownService();
  let markdown = turndown.turndown(html);

  // Post-processing cleanup
  markdown = cleanupMarkdown(markdown);

  return markdown;
}

function cleanupMarkdown(markdown: string): string {
  let result = markdown;

  // Remove excessive newlines (more than 2)
  result = result.replace(/\n{4,}/g, '\n\n\n');

  // Remove trailing whitespace from lines
  result = result.replace(/[ \t]+$/gm, '');

  // Fix broken links that might have extra spaces
  result = result.replace(/\[ +/g, '[');
  result = result.replace(/ +\]/g, ']');

  // Remove empty links
  result = result.replace(/\[\]\([^)]*\)/g, '');

  // Clean up any leftover HTML entities
  result = result.replace(/&nbsp;/g, ' ');
  result = result.replace(/&amp;/g, '&');
  result = result.replace(/&lt;/g, '<');
  result = result.replace(/&gt;/g, '>');
  result = result.replace(/&quot;/g, '"');
  result = result.replace(/&#39;/g, "'");

  // Remove any remaining data-* attributes that leaked through
  result = result.replace(/data-[a-z-]+="[^"]*"/g, '');

  // Trim the final result
  result = result.trim();

  return result;
}

export function convertPostToMarkdown(
  html: string,
  title: string,
  date: string | null,
  type: string,
  audience: string,
  subtitle?: string
): string {
  const content = htmlToMarkdown(html);

  const dateStr = date
    ? new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Unknown date';

  const audienceLabel = audience === 'everyone' ? 'Everyone' :
                        audience === 'only_paid' ? 'Paid subscribers' :
                        audience === 'only_free' ? 'Free subscribers' : audience;

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  let header = `# ${title || 'Untitled'}\n`;
  header += `**Date:** ${dateStr}\n`;
  header += `**Type:** ${typeLabel}\n`;
  header += `**Audience:** ${audienceLabel}\n`;

  if (subtitle) {
    header += `\n*${subtitle}*\n`;
  }

  header += '\n---\n\n';

  return header + content;
}
