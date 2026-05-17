import { useEffect, useRef, useCallback } from 'react';
import { createChart, ColorType, LineSeries } from 'lightweight-charts';
import type { IChartApi } from 'lightweight-charts';
import { CHART_COLORS } from '../../utils/colors';
import './PredictionLine.css';

interface PredictionPoint {
  time: string;
  value: number;
  confidence_low: number;
  confidence_high: number;
}

interface PredictionLineProps {
  data: PredictionPoint[];
  height?: number;
}

export function PredictionLine({ data, height = 400 }: PredictionLineProps) {
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
      rightPriceScale: {
        borderColor: CHART_COLORS.grid,
      },
      timeScale: {
        borderColor: CHART_COLORS.grid,
      },
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: CHART_COLORS.prediction,
      lineWidth: 2,
      lineStyle: 2,
      crosshairMarkerRadius: 4,
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineColor: CHART_COLORS.prediction,
    });

    lineSeries.setData(
      data.map((d) => ({ time: d.time as unknown as string, value: d.value }))
    );

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

  return <div ref={containerRef} className="prediction-line-chart" />;
}
