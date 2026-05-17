import { useEffect, useRef, useCallback } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import type { IChartApi } from 'lightweight-charts';
import type { OHLCDataPoint } from '../../types';
import { CHART_COLORS } from '../../utils/colors';

interface CandlestickChartProps {
  data: OHLCDataPoint[];
  height?: number;
}

export function CandlestickChart({ data, height = 400 }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const disposedRef = useRef(false);

  const renderChart = useCallback(() => {
    if (!containerRef.current || data.length === 0) return;

    if (chartRef.current && !disposedRef.current) {
      try {
        chartRef.current.remove();
      } catch {
        // Chart may already be disposed
      }
      disposedRef.current = false;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#98989D',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid },
        horzLines: { color: CHART_COLORS.grid },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: CHART_COLORS.grid,
      },
      timeScale: {
        borderColor: CHART_COLORS.grid,
        timeVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: CHART_COLORS.candleUp,
      downColor: CHART_COLORS.candleDown,
      borderUpColor: CHART_COLORS.candleUp,
      borderDownColor: CHART_COLORS.candleDown,
      wickUpColor: CHART_COLORS.candleUp,
      wickDownColor: CHART_COLORS.candleDown,
    });

    const formattedData = data.map((d) => ({
      time: d.time as unknown as string,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candleSeries.setData(formattedData);
    chart.timeScale().fitContent();

    chartRef.current = chart;
  }, [data, height]);

  useEffect(() => {
    disposedRef.current = false;
    renderChart();

    const handleResize = () => {
      if (containerRef.current && chartRef.current && !disposedRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current && !disposedRef.current) {
        try {
          chartRef.current.remove();
          disposedRef.current = true;
        } catch {
          // Already disposed
        }
      }
    };
  }, [renderChart]);

  return <div ref={containerRef} className="w-full rounded-xl overflow-hidden" />;
}
