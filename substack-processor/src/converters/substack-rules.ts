import TurndownService from 'turndown';

export function addSubstackRules(turndown: TurndownService): void {
  // Remove Substack UI elements (buttons, restack icons, expand icons)
  turndown.addRule('removeSubstackUI', {
    filter: (node) => {
      if (node.nodeType !== 1) return false;
      const element = node as Element;

      // Remove button containers and SVG icons
      if (element.tagName === 'BUTTON') return true;
      if (element.tagName === 'SVG') return true;
      if (element.classList?.contains('image-link-expand')) return true;
      if (element.classList?.contains('button-wrapper')) return true;

      return false;
    },
    replacement: () => ''
  });

  // Handle Substack image containers
  turndown.addRule('substackImages', {
    filter: (node) => {
      if (node.nodeType !== 1) return false;
      const element = node as Element;
      return element.classList?.contains('captioned-image-container') || false;
    },
    replacement: (content, node) => {
      const element = node as Element;
      const img = element.querySelector('img');
      if (!img) return '';

      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || 'Image';

      // Clean up Substack CDN URLs to get the original
      const cleanSrc = src.includes('substack-post-media') ? src : src;

      return `\n\n![${alt}](${cleanSrc})\n\n`;
    }
  });

  // Handle pullquotes
  turndown.addRule('pullquotes', {
    filter: (node) => {
      if (node.nodeType !== 1) return false;
      const element = node as Element;
      return element.classList?.contains('pullquote') || false;
    },
    replacement: (content) => {
      return `\n\n> **${content.trim()}**\n\n`;
    }
  });

  // Handle mentions (convert to plain text)
  turndown.addRule('mentions', {
    filter: (node) => {
      if (node.nodeType !== 1) return false;
      const element = node as Element;
      return element.classList?.contains('mention-wrap') || false;
    },
    replacement: (content, node) => {
      const element = node as Element;
      const dataAttrs = element.getAttribute('data-attrs');
      if (dataAttrs) {
        try {
          const attrs = JSON.parse(dataAttrs);
          return attrs.name || content;
        } catch {
          return content;
        }
      }
      return content;
    }
  });

  // Handle podcast embeds
  turndown.addRule('podcastEmbed', {
    filter: (node) => {
      if (node.nodeType !== 1) return false;
      const element = node as Element;
      return element.classList?.contains('audio-embed') ||
             element.getAttribute('data-component-name') === 'AudioEmbed' || false;
    },
    replacement: () => '\n\n*[Podcast episode embedded]*\n\n'
  });

  // Handle video embeds
  turndown.addRule('videoEmbed', {
    filter: (node) => {
      if (node.nodeType !== 1) return false;
      const element = node as Element;
      return element.classList?.contains('video-container') ||
             element.tagName === 'IFRAME' || false;
    },
    replacement: (content, node) => {
      const element = node as Element;
      const src = element.getAttribute('src') || '';
      if (src.includes('youtube') || src.includes('youtu.be')) {
        return `\n\n*[YouTube video: ${src}]*\n\n`;
      }
      return '\n\n*[Video embedded]*\n\n';
    }
  });

  // Handle Twitter/X embeds
  turndown.addRule('twitterEmbed', {
    filter: (node) => {
      if (node.nodeType !== 1) return false;
      const element = node as Element;
      return element.classList?.contains('tweet') ||
             element.getAttribute('data-component-name')?.includes('Tweet') || false;
    },
    replacement: () => '\n\n*[Tweet embedded]*\n\n'
  });

  // Clean up empty paragraphs with just <br>
  turndown.addRule('emptyBreaks', {
    filter: (node) => {
      if (node.nodeType !== 1) return false;
      const element = node as Element;
      return element.tagName === 'P' &&
             element.innerHTML.trim() === '<br>' || false;
    },
    replacement: () => '\n'
  });

  // Handle subscribe buttons
  turndown.addRule('subscribeButton', {
    filter: (node) => {
      if (node.nodeType !== 1) return false;
      const element = node as Element;
      const isButton = element.classList?.contains('button') || false;
      const href = element.getAttribute('href') || '';
      return isButton && href.includes('subscribe');
    },
    replacement: () => ''
  });
}
