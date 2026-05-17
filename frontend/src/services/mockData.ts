import type { OHLCDataPoint, StockTicker, IndicatorData, Prediction } from '../types';
import { fetchTickerCSV, fetchAllTickers } from '../utils/csvParser';

const TICKER_NAMES: Record<string, string> = {
  NABIL: 'Nabil Bank',
  NMB: 'NMB Bank',
  SBL: 'Siddhartha Bank',
  NBL: 'Nepal Bank',
  EBL: 'Everest Bank',
  ADBL: 'Agricultural Development Bank',
  GBIME: 'Global IME Bank',
  SANIMA: 'Sanima Bank',
  NCCB: 'NCC Bank',
  MEGA: 'Mega Bank',
  KBL: 'Kumari Bank',
  LBL: 'Lumbini Bank',
  MBL: 'Machhapuchhre Bank',
  HBL: 'Himalayan Bank',
  CZBIL: 'Civil Bank',
  SBI: 'Nepal SBI Bank',
  NABBC: 'Narayani Development Bank',
  CCBL: 'Century Commercial Bank',
  JOSHI: 'Joshi Hydropower',
  CHDC: 'Chilime Hydropower',
  BPCL: 'Bhugol Power',
  AHPC: 'Arun Hydropower',
  HPPL: 'Himal Power',
  SHPC: 'Sanima Hydropower',
  NHPC: 'National Hydro',
  MEN: 'Mountain Energy',
  UPPER: 'Upper Tamakoshi',
  NIFRA: 'Nepal Infrastructure',
  HDHPC: 'Himal Dolakha Hydro',
  GBBL: 'Garima Bank',
  GFCL: 'Goodwill Finance',
  GLICL: 'General Life Insurance',
  NLICL: 'Nepal Life Insurance',
  LICN: 'Life Insurance Corp',
  SLICL: 'Surya Life Insurance',
  MLBL: 'Mahalaxmi Bank',
  CORBL: 'Corporate Development Bank',
  CFCL: 'Citizens Finance',
  ICFC: 'ICFC Finance',
  MFIL: 'Multipurpose Finance',
  SFCL: 'Samriddhi Finance',
  GFIL: 'Goodwill Finance',
  KFIL: 'Kamana Finance',
  NFD: 'NFD Finance',
  OFIL: 'Orient Finance',
  PFIL: 'Premier Finance',
  RFIL: 'Rastriya Finance',
  TFL: 'Tower Finance',
  UFL: 'United Finance',
  VFIL: 'Vision Finance',
  WFI: 'World Finance',
  YFL: 'Yak & Yeti Finance',
  ZFL: 'Zenith Finance',
  NLG: 'Nepal Life Insurance',
  RBB: 'Rastriya Banijya Bank',
  NIDC: 'NIDC Development Bank',
  NMF: 'Nepal Mutual Fund',
  NFC: 'Nepal Finance',
  BOKL: 'Bank of Kathmandu',
  EBLDP: 'Everest Development Bank',
  BFC: 'Best Finance',
  TRH: 'Trishuli Hydropower',
  UMRH: 'Upper Madi Hydropower',
  RURU: 'Ru Ru Hydropower',
  SADBL: 'Siddhartha Development Bank',
  RHPL: 'Ridi Hydropower',
  RADHI: 'Radhi Hydropower',
  PPCL: 'Panchakanya Power',
  OHL: 'Oriental Hydropower',
  NYADI: 'Nyadi Hydropower',
  NHDL: 'Nepal Hydro Development',
  NFS: 'Nepal Finance',
  MPFL: 'Mountain Power Finance',
  KKHC: 'Kalinchowk Hydropower',
  KPCL: 'Kabeli Power',
  HURJA: 'Himal Urja',
  GUFL: 'Gurkhas Finance',
  GMFIL: 'Ganapati Microfinance',
  GLH: 'Ghalemdi Hydropower',
  EDL: 'Eastern Hydropower',
  DORDI: 'Dordi Khola Hydropower',
  DHPL: 'Dibyashwori Hydropower',
  CIT: 'Citizen Investment Trust',
  CGH: 'Chandragiri Hydropower',
  AKPL: 'Arun Kabeli Power',
  AKJCL: 'Arun Jaidevi Cement',
};

const SECTOR_MAP: Record<string, string> = {
  NABIL: 'Commercial Bank', NMB: 'Commercial Bank', SBL: 'Commercial Bank', NBL: 'Commercial Bank',
  EBL: 'Commercial Bank', ADBL: 'Commercial Bank', GBIME: 'Commercial Bank', SANIMA: 'Commercial Bank',
  NCCB: 'Commercial Bank', MEGA: 'Commercial Bank', KBL: 'Commercial Bank', LBL: 'Commercial Bank',
  MBL: 'Commercial Bank', HBL: 'Commercial Bank', CZBIL: 'Commercial Bank', SBI: 'Commercial Bank',
  NABBC: 'Commercial Bank', CCBL: 'Commercial Bank', RBB: 'Commercial Bank', BOKL: 'Commercial Bank',
  SADBL: 'Development Bank', NIDC: 'Development Bank', JOSHI: 'Hydropower', CHDC: 'Hydropower',
  BPCL: 'Hydropower', AHPC: 'Hydropower', HPPL: 'Hydropower', SHPC: 'Hydropower', NHPC: 'Hydropower',
  MEN: 'Hydropower', UPPER: 'Hydropower', NIFRA: 'Hydropower', HDHPC: 'Hydropower', TRH: 'Hydropower',
  UMRH: 'Hydropower', RURU: 'Hydropower', RHPL: 'Hydropower', RADHI: 'Hydropower', PPCL: 'Hydropower',
  OHL: 'Hydropower', NYADI: 'Hydropower', NHDL: 'Hydropower', KPCL: 'Hydropower', HURJA: 'Hydropower',
  GLH: 'Hydropower', CGH: 'Hydropower', AKPL: 'Hydropower', DORDI: 'Hydropower', DHPL: 'Hydropower',
  EDL: 'Hydropower', CFCL: 'Finance', ICFC: 'Finance', MFIL: 'Finance', SFCL: 'Finance',
  GFIL: 'Finance', KFIL: 'Finance', NFD: 'Finance', OFIL: 'Finance', PFIL: 'Finance',
  RFIL: 'Finance', TFL: 'Finance', UFL: 'Finance', VFIL: 'Finance', WFI: 'Finance',
  YFL: 'Finance', ZFL: 'Finance', NFC: 'Finance', BFC: 'Finance', NFS: 'Finance',
  MPFL: 'Finance', GFCL: 'Finance', GLICL: 'Life Insurance', NLICL: 'Life Insurance',
  LICN: 'Life Insurance', SLICL: 'Life Insurance', NLG: 'Life Insurance',
  GBBL: 'Development Bank', CORBL: 'Development Bank', CIT: 'Other', MLBL: 'Microfinance',
  GMFIL: 'Microfinance', GUFL: 'Microfinance',
};

export function getTickerName(ticker: string): string {
  return TICKER_NAMES[ticker] || ticker;
}

export function getSector(ticker: string): string {
  return SECTOR_MAP[ticker] || 'Other';
}

let tickersMetaCache: StockTicker[] | null = null;

export async function getTickers(): Promise<StockTicker[]> {
  if (tickersMetaCache) return tickersMetaCache;

  const allTickers = await fetchAllTickers();

  const metaPromises = allTickers.map(async (ticker) => {
    try {
      const data = await fetchTickerCSV(ticker);
      if (data.length === 0) return null;
      const latest = data[data.length - 1];
      const prev = data.length > 1 ? data[data.length - 2] : null;
      const change = prev && prev.close > 0
        ? Math.round(((latest.close - prev.close) / prev.close) * 10000) / 100
        : 0;
      return {
        ticker,
        name: getTickerName(ticker),
        sector: getSector(ticker),
        latest_close: latest.close,
        change,
        volume: latest.volume,
      };
    } catch {
      return {
        ticker,
        name: getTickerName(ticker),
        sector: getSector(ticker),
        latest_close: 0,
        change: 0,
        volume: 0,
      };
    }
  });

  const metas = (await Promise.all(metaPromises)).filter(Boolean) as StockTicker[];
  tickersMetaCache = metas;
  return tickersMetaCache;
}

export async function getOHLC(ticker: string, from?: string, to?: string): Promise<OHLCDataPoint[]> {
  const data = await fetchTickerCSV(ticker);

  let filtered = data;
  if (from) {
    filtered = filtered.filter((d) => d.time >= from);
  }
  if (to) {
    filtered = filtered.filter((d) => d.time <= to);
  }

  return filtered.slice(-365);
}

export interface MarketOverview {
  totalStocks: number;
  gainers: number;
  losers: number;
  unchanged: number;
  totalVolume: number;
  topGainers: StockTicker[];
  topLosers: StockTicker[];
  sectorBreakdown: Record<string, number>;
}

export async function getMarketOverview(): Promise<MarketOverview> {
  const tickers = await getTickers();

  const gainers = tickers.filter((t) => t.change > 0);
  const losers = tickers.filter((t) => t.change < 0);
  const unchanged = tickers.filter((t) => t.change === 0);
  const totalVolume = tickers.reduce((sum, t) => sum + (t.volume || 0), 0);

  const topGainers = [...gainers].sort((a, b) => b.change - a.change).slice(0, 5);
  const topLosers = [...losers].sort((a, b) => a.change - b.change).slice(0, 5);

  const sectorBreakdown: Record<string, number> = {};
  tickers.forEach((t) => {
    sectorBreakdown[t.sector] = (sectorBreakdown[t.sector] || 0) + 1;
  });

  return {
    totalStocks: tickers.length,
    gainers: gainers.length,
    losers: losers.length,
    unchanged: unchanged.length,
    totalVolume,
    topGainers,
    topLosers,
    sectorBreakdown,
  };
}

export function generateMockIndicators(ohlcData: OHLCDataPoint[]): IndicatorData {
  const rsi = ohlcData.map((d) => ({
    time: d.time,
    value: Math.round((30 + Math.random() * 40) * 100) / 100,
  }));

  const macdLine = ohlcData.map((d) => ({
    time: d.time,
    value: Math.round((Math.random() - 0.5) * 10 * 100) / 100,
  }));

  const signal = ohlcData.map((d) => ({
    time: d.time,
    value: Math.round((Math.random() - 0.5) * 8 * 100) / 100,
  }));

  const histogram = ohlcData.map((d, i) => ({
    time: d.time,
    value: Math.round((macdLine[i].value - signal[i].value) * 100) / 100,
  }));

  const bollinger = ohlcData.map((d) => ({
    time: d.time,
    upper: Math.round((d.close + d.close * 0.05) * 100) / 100,
    middle: d.close,
    lower: Math.round((d.close - d.close * 0.05) * 100) / 100,
  }));

  const ema12Values: { time: string; value: number }[] = [];
  ohlcData.forEach((d, i) => {
    const prev = i === 0 ? d.close : ema12Values[i - 1].value;
    ema12Values.push({
      time: d.time,
      value: Math.round((d.close * 0.15 + prev * 0.85) * 100) / 100,
    });
  });

  const ema26Values: { time: string; value: number }[] = [];
  ohlcData.forEach((d, i) => {
    const prev = i === 0 ? d.close : ema26Values[i - 1].value;
    ema26Values.push({
      time: d.time,
      value: Math.round((d.close * 0.075 + prev * 0.925) * 100) / 100,
    });
  });

  return {
    rsi,
    macd: { macd: macdLine, signal, histogram },
    bollinger: {
      upper: bollinger.map((b) => ({ time: b.time, value: b.upper })),
      middle: bollinger.map((b) => ({ time: b.time, value: b.middle })),
      lower: bollinger.map((b) => ({ time: b.time, value: b.lower })),
    },
    ema: { ema12: ema12Values, ema26: ema26Values },
  };
}

export function generateMockPrediction(ticker: string, ohlcData: OHLCDataPoint[]): Prediction {
  const latest = ohlcData[ohlcData.length - 1];
  const price = latest?.close || 500;

  const nextDayPrice = Math.round((price * (1 + (Math.random() - 0.48) * 0.03)) * 100) / 100;
  const nextWeekPrice = Math.round((price * (1 + (Math.random() - 0.45) * 0.08)) * 100) / 100;

  return {
    ticker,
    next_day: {
      price: nextDayPrice,
      confidence_low: Math.round(nextDayPrice * 0.97 * 100) / 100,
      confidence_high: Math.round(nextDayPrice * 1.03 * 100) / 100,
    },
    next_week: {
      price: nextWeekPrice,
      confidence_low: Math.round(nextWeekPrice * 0.94 * 100) / 100,
      confidence_high: Math.round(nextWeekPrice * 1.06 * 100) / 100,
    },
    model_accuracy: Math.round((0.75 + Math.random() * 0.2) * 100) / 100,
    generated_at: new Date().toISOString(),
  };
}

export function generatePredictionPoints(ohlcData: OHLCDataPoint[]): { time: string; value: number; confidence_low: number; confidence_high: number }[] {
  if (ohlcData.length === 0) return [];

  const lastDate = new Date(ohlcData[ohlcData.length - 1].time);
  const lastPrice = ohlcData[ohlcData.length - 1].close;

  const points = [];
  for (let i = 1; i <= 14; i++) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i);
    const trend = (Math.random() - 0.45) * 0.02;
    const value = Math.round(lastPrice * Math.pow(1 + trend, i) * 100) / 100;
    points.push({
      time: date.toISOString().split('T')[0],
      value,
      confidence_low: Math.round(value * 0.96 * 100) / 100,
      confidence_high: Math.round(value * 1.04 * 100) / 100,
    });
  }

  return points;
}
