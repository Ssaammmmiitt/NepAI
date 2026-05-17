import { useEffect, useRef } from 'react';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { LineSeries } from 'lightweight-charts';
import type { IndicatorData } from '../../types';
import { CHART_COLORS } from '../../utils/colors';

interface IndicatorOverlayProps {
  indicators: IndicatorData | null;
  chart: IChartApi | null;
  visibleIndicators: string[];
}

export function IndicatorOverlay({ indicators, chart, visibleIndicators }: IndicatorOverlayProps) {
  const seriesRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());

  useEffect(() => {
    if (!chart || !indicators) return;

    seriesRef.current.forEach((s) => {
      chart.removeSeries(s);
    });
    seriesRef.current.clear();

    if (visibleIndicators.includes('bollinger') && indicators.bollinger) {
      const upper = chart.addSeries(LineSeries, {
        color: CHART_COLORS.bollinger,
        lineWidth: 1,
        crosshairMarkerRadius: 0,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      const middle = chart.addSeries(LineSeries, {
        color: CHART_COLORS.bollinger,
        lineWidth: 1,
        lineStyle: 2,
        crosshairMarkerRadius: 0,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      const lower = chart.addSeries(LineSeries, {
        color: CHART_COLORS.bollinger,
        lineWidth: 1,
        crosshairMarkerRadius: 0,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      upper.setData(indicators.bollinger.upper.map((d) => ({ time: d.time as unknown as string, value: d.value })));
      middle.setData(indicators.bollinger.middle.map((d) => ({ time: d.time as unknown as string, value: d.value })));
      lower.setData(indicators.bollinger.lower.map((d) => ({ time: d.time as unknown as string, value: d.value })));
      seriesRef.current.set('bb-upper', upper);
      seriesRef.current.set('bb-middle', middle);
      seriesRef.current.set('bb-lower', lower);
    }

    if (visibleIndicators.includes('ema') && indicators.ema) {
      const ema12 = chart.addSeries(LineSeries, {
        color: CHART_COLORS.ema,
        lineWidth: 1,
        crosshairMarkerRadius: 0,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      const ema26 = chart.addSeries(LineSeries, {
        color: '#0891b2',
        lineWidth: 1,
        crosshairMarkerRadius: 0,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      ema12.setData(indicators.ema.ema12.map((d) => ({ time: d.time as unknown as string, value: d.value })));
      ema26.setData(indicators.ema.ema26.map((d) => ({ time: d.time as unknown as string, value: d.value })));
      seriesRef.current.set('ema-12', ema12);
      seriesRef.current.set('ema-26', ema26);
    }
  }, [chart, indicators, visibleIndicators]);

  return null;
}
