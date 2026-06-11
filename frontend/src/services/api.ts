import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
});

export const stockAPI = {
  listTickers: () => api.get('/stocks'),
  getData: (ticker: string) => api.get(`/stocks/${ticker}`),
  getOHLC: (ticker: string, from?: string, to?: string) =>
    api.get(`/stocks/${ticker}/ohlc`, { params: { from, to } }),
  getIndicators: (ticker: string) => api.get(`/stocks/${ticker}/indicators`),
  getSummary: (ticker: string) => api.get(`/stocks/${ticker}/summary`),
};

export const predictionAPI = {
  getPrediction: (ticker: string, days?: number) =>
    api.get(`/predictions/${ticker}`, { params: days ? { days } : undefined }),
};

export const trainAPI = {
  train: (stock_name: string) =>
    api.post('/train', { stock_name }, { timeout: 300000 }),
};

export const modelAPI = {
  list: () => api.get('/models'),
};

export const portfolioAPI = {
  getPortfolio: () => api.get('/portfolio'),
  addStock: (data: { ticker: string; quantity: number; entry_price: number }) =>
    api.post('/portfolio', data),
  removeStock: (ticker: string) => api.delete(`/portfolio/${ticker}`),
  getSummary: () => api.get('/portfolio/summary'),
};
