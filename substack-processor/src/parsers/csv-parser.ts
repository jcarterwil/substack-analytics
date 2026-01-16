import Papa from 'papaparse';
import fs from 'fs-extra';

export interface ParseOptions {
  header?: boolean;
  skipEmptyLines?: boolean;
  dynamicTyping?: boolean;
}

export async function parseCSV<T>(
  filePath: string,
  options: ParseOptions = {}
): Promise<T[]> {
  const content = await fs.readFile(filePath, 'utf-8');

  return new Promise((resolve, reject) => {
    Papa.parse<T>(content, {
      header: options.header ?? true,
      skipEmptyLines: options.skipEmptyLines ?? true,
      dynamicTyping: options.dynamicTyping ?? false,
      complete: (results) => {
        if (results.errors.length > 0) {
          const criticalErrors = results.errors.filter(e => e.type === 'Quotes');
          if (criticalErrors.length > 0) {
            reject(new Error(`CSV parsing errors: ${JSON.stringify(criticalErrors)}`));
            return;
          }
        }
        resolve(results.data);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
}

export async function parseCSVWithTransform<T, R>(
  filePath: string,
  transform: (row: T) => R,
  options: ParseOptions = {}
): Promise<R[]> {
  const rows = await parseCSV<T>(filePath, options);
  return rows.map(transform);
}
