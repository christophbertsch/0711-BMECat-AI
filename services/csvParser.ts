
import { ParsedCsvRow, ParsedStructureRow } from '../types';

/**
 * Detects the most likely separator (comma or semicolon) in a CSV header line.
 * This is crucial for handling different CSV dialects, especially German CSVs
 * which often use semicolons.
 * @param headerLine The first line of the CSV file.
 * @returns The detected separator (',' or ';'). Defaults to ','.
 */
function detectSeparator(headerLine: string): ',' | ';' {
  if (!headerLine) return ',';
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;

  // Prefer semicolon if it's used and more frequent than comma.
  if (semicolonCount > 0 && semicolonCount > commaCount) {
    return ';';
  }
  return ',';
}

const parseLine = (line: string, separator: ',' | ';'): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === separator && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result.map(v => v.replace(/^"|"$/g, '').trim());
};

export function parseCsv(csvText: string): { headers: string[]; data: ParsedCsvRow[] } {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 1 || !lines[0].trim()) {
    return { headers: [], data: [] };
  }
  
  const separator = detectSeparator(lines[0]);
  const headers = parseLine(lines[0], separator);
  const data: ParsedCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    const values = parseLine(lines[i], separator);
    
    // Skip rows that don't match the header column count for robustness.
    if(values.length !== headers.length) {
        console.warn(`Skipping malformed CSV row ${i+1}: has ${values.length} columns, expected ${headers.length}.`);
        continue;
    }

    const row: ParsedCsvRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }

  return { headers, data };
}

export function parseStructureCsv(csvText: string): { data: ParsedStructureRow[] } {
    const { headers, data } = parseCsv(csvText);

    const requiredHeaders = ['GROUP_ID', 'GROUP_NAME', 'PARENT_ID'];
    for(const requiredHeader of requiredHeaders) {
        if(!headers.includes(requiredHeader)) {
            throw new Error(`Erforderliche Spalte "${requiredHeader}" nicht in der Struktur-CSV gefunden.`);
        }
    }

    const structuredData = data.map(row => ({
        GROUP_ID: row['GROUP_ID'],
        GROUP_NAME: row['GROUP_NAME'],
        PARENT_ID: row['PARENT_ID']
    }));

    return { data: structuredData };
}
