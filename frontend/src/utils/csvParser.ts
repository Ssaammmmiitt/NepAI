import type { OHLCDataPoint } from '../types';

export interface RawCSVRow {
  published_date: string;
  open: string;
  high: string;
  low: string;
  close: string;
  per_change: string;
  traded_quantity: string;
  traded_amount: string;
  status: string;
}

export function parseCSV(text: string): RawCSVRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  const rows: RawCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx]?.trim() || '';
    });

    rows.push(row as unknown as RawCSVRow);
  }

  return rows;
}

export function csvToOHLC(rows: RawCSVRow[]): OHLCDataPoint[] {
  return rows
    .filter((row) => row.per_change !== 'nan' && row.per_change !== '')
    .map((row) => ({
      time: row.published_date,
      open: parseFloat(row.open) || 0,
      high: parseFloat(row.high) || 0,
      low: parseFloat(row.low) || 0,
      close: parseFloat(row.close) || 0,
      volume: parseInt(row.traded_quantity, 10) || 0,
      per_change: parseFloat(row.per_change) || 0,
    }))
    .filter((d) => d.time && d.open > 0);
}

export async function fetchTickerCSV(ticker: string): Promise<OHLCDataPoint[]> {
  const response = await fetch(`/data/${ticker}.csv`);
  if (!response.ok) {
    throw new Error(`Failed to load CSV for ${ticker}`);
  }
  const text = await response.text();
  const rows = parseCSV(text);
  return csvToOHLC(rows);
}

export async function fetchAllTickers(): Promise<string[]> {
  const response = await fetch('/data/tickers.json');
  if (!response.ok) {
    throw new Error('Failed to load tickers list');
  }
  const data = await response.json();
  return data.tickers;
}
