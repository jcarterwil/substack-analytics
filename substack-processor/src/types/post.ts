export interface PostMetadata {
  post_id: string;
  post_date: string | null;
  is_published: boolean;
  email_sent_at: string | null;
  inbox_sent_at: string | null;
  type: 'newsletter' | 'podcast' | 'thread' | 'video' | string;
  audience: 'everyone' | 'only_paid' | 'only_free' | string;
  title: string;
  subtitle: string;
  podcast_url: string;
  slug?: string;
  htmlPath?: string;
  htmlContent?: string;
  markdownContent?: string;
}

export interface PostWithContent extends PostMetadata {
  htmlContent: string;
  markdownContent?: string;
}

export interface ParsedPostId {
  id: string;
  slug?: string;
}
