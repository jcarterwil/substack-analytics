export * from './post.js';
export * from './subscriber.js';
export * from './analytics.js';

export interface ProcessorOptions {
  archivePath: string;
  outputPath: string;
  verbose: boolean;
}

export interface ProcessingResult {
  success: boolean;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stats?: any;
}
