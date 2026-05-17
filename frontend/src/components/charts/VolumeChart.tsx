import { useEffect, useRef, useCallback } from 'react';
import { createChart, ColorType, HistogramSeries } from 'lightweight-charts';
import type { IChartApi } from 'lightweight-charts';
import type { OHLCDataPoint } from '../../types';
import { CHART_COLORS } from '../../utils/colors';

interface VolumeChartProps {
  data: OHLCDataPoint[];
  height?: number;
}

export function VolumeChart({ data, height = 120 }: VolumeChartProps) {
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
        fontSize: 11,
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid },
        horzLines: { color: CHART_COLORS.grid },
      },
      rightPriceScale: {
        visible: false,
        borderColor: CHART_COLORS.grid,
      },
      timeScale: {
        visible: false,
        borderColor: CHART_COLORS.grid,
      },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceLineVisible: false,
    });

    const formattedData = data.map((d) => ({
      time: d.time as unknown as string,
      value: d.volume,
      color: d.close >= d.open ? CHART_COLORS.candleUp : CHART_COLORS.candleDown,
    }));

    volumeSeries.setData(formattedData);
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

  return <div ref={containerRef} className="w-full rounded-xl overflow-hidden border-t border-border-color" />;
}
