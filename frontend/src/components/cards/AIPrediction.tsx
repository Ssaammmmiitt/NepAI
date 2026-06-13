import { useState } from 'react'
import { Brain, RefreshCw, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { trainAPI } from '@/services/api'
import { getApiErrorMessage, getApiErrorStatus } from '@/utils/apiError'
import type { Prediction, PredictionDay } from '@/types'
import {
  daysSince,
  formatCurrency,
  formatDateTime,
  formatPercent,
  predictionLabel,
} from '@/utils/formatters'

interface AIPredictionProps {
  ticker: string
  prediction: Prediction | null
  loading?: boolean
  onRetrainComplete?: () => void
}

function PredictionRow({ p }: { p: PredictionDay }) {
  return (
    <li className="flex items-center justify-between gap-3 border border-dt-border bg-dt-bg px-3 py-2">
      <div className="min-w-0">
        <p className="font-mono text-sm font-medium text-dt-text">{predictionLabel(p.day)}</p>
        <p className="truncate text-xs text-dt-meta">{p.date}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm font-medium tabular-nums text-dt-text">
          {formatCurrency(p.price)}
        </p>
        <p
          className={`font-mono text-xs font-medium tabular-nums ${
            p.change_pct >= 0 ? 'text-dt-accent-bright' : 'text-dt-negative'
          }`}
        >
          {formatPercent(p.change_pct)}
        </p>
      </div>
    </li>
  )
}

function PredictionColumns({ items }: { items: PredictionDay[] }) {
  const left = items.slice(0, 3)
  const right = items.slice(3)

  if (right.length === 0) {
    return (
      <ul className="flex flex-col gap-1.5">
        {left.map((p) => (
          <PredictionRow key={p.day} p={p} />
        ))}
      </ul>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <ul className="flex flex-col gap-1.5">
        {left.map((p) => (
          <PredictionRow key={p.day} p={p} />
        ))}
      </ul>
      <ul className="flex flex-col gap-1.5">
        {right.map((p) => (
          <PredictionRow key={p.day} p={p} />
        ))}
      </ul>
    </div>
  )
}

interface TrainErrorBannerProps {
  message: string
  isInsufficientData: boolean
  ticker: string
}

function TrainErrorBanner({ message, isInsufficientData, ticker }: TrainErrorBannerProps) {
  return (
    <div className="flex flex-col gap-3 border border-dt-negative bg-dt-negative/5 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-dt-negative"
          strokeWidth={1.5}
        />
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-dt-negative">
            {isInsufficientData ? 'Insufficient Training Data' : 'Training Failed'}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-dt-text">{message}</p>
          {isInsufficientData ? (
            <p className="mt-2 text-[10px] leading-relaxed text-dt-meta">
              At least 500 rows of historical data are required to train a model for{' '}
              <span className="font-mono font-medium">{ticker}</span>. This stock does not have
              enough trading history yet.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function AIPrediction({ ticker, prediction, loading, onRetrainComplete }: AIPredictionProps) {
  const [training, setTraining] = useState(false)
  const [trainError, setTrainError] = useState('')
  const [trainErrorStatus, setTrainErrorStatus] = useState<number | null>(null)

  const handleTrain = async () => {
    setTraining(true)
    setTrainError('')
    setTrainErrorStatus(null)
    try {
      await trainAPI.train(ticker)
      onRetrainComplete?.()
    } catch (err) {
      setTrainError(getApiErrorMessage(err, 'Training failed. Please try again.'))
      setTrainErrorStatus(getApiErrorStatus(err))
    } finally {
      setTraining(false)
    }
  }

  if (loading) {
    return (
      <Card className="flex min-h-[8rem] flex-1 items-center justify-center">
        <Spinner />
      </Card>
    )
  }

  if (!prediction?.model_available) {
    return (
      <Card className="flex-1">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center border border-dt-border bg-dt-bg">
            <Brain className="h-6 w-6 text-dt-meta" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-mono text-sm font-medium text-dt-text">No trained model</p>
            <p className="mt-1 text-xs text-dt-meta">Train an LSTM model for {ticker}</p>
          </div>
          <Button
            onClick={handleTrain}
            loading={training}
            disabled={trainErrorStatus === 400}
          >
            Train Model
          </Button>
          {trainError ? (
            <div className="w-full">
              <TrainErrorBanner
                message={trainError}
                isInsufficientData={trainErrorStatus === 400}
                ticker={ticker}
              />
            </div>
          ) : null}
        </div>
      </Card>
    )
  }

  const staleDays = prediction.trained_on ? daysSince(prediction.trained_on) : 0

  return (
    <Card
      title="AI Prediction"
      className="min-w-0 flex-1"
      action={
        prediction.stale ? (
          <Badge variant="warning">{staleDays}d old</Badge>
        ) : (
          <Badge variant="positive">Fresh</Badge>
        )
      }
    >
      {prediction.trained_on ? (
        <p className="mb-3 text-xs text-dt-meta">Trained: {formatDateTime(prediction.trained_on)}</p>
      ) : null}

      <PredictionColumns items={prediction.predictions} />

      {prediction.stale ? (
        <Button variant="secondary" className="mt-4 w-full sm:w-auto" onClick={handleTrain} loading={training}>
          <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
          {training ? 'Training...' : 'Retrain Model'}
        </Button>
      ) : null}

      {trainError ? (
        <div className="mt-4">
          <TrainErrorBanner
            message={trainError}
            isInsufficientData={trainErrorStatus === 400}
            ticker={ticker}
          />
        </div>
      ) : null}
    </Card>
  )
}
