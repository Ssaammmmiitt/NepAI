import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Prediction } from '@/types'
import { formatDateTime } from '@/utils/formatters'

interface ModelHealthCardProps {
  prediction: Prediction | null
  className?: string
}

export function ModelHealthCard({ prediction, className = '' }: ModelHealthCardProps) {
  if (!prediction?.model_available) return null

  const accuracy = prediction.model_accuracy

  return (
    <Card
      title="Model Health"
      className={`!p-4 h-fit self-start [&>div:first-child]:mb-2 ${className}`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-dt-meta">Accuracy</span>
          <span className="font-mono text-sm font-semibold text-dt-accent-bright">
            {(accuracy * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-dt-meta">Status</span>
          <Badge variant={prediction.stale ? 'warning' : 'positive'}>
            {prediction.stale ? 'Stale' : 'Fresh'}
          </Badge>
        </div>
        {prediction.trained_on ? (
          <div className="flex items-center justify-between gap-4">
            <span className="shrink-0 text-xs text-dt-meta">Trained</span>
            <span className="text-right text-xs text-dt-meta">
              {formatDateTime(prediction.trained_on)}
            </span>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
