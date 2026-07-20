import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getPlant } from '@/data/plants'

export interface CardPickerProps {
  levelId: string
  open: boolean
  onClose: () => void
  onConfirm: (cards: string[]) => void
  plantIds: string[]
  slots: number
  plantName?: (id: string) => string
}

export function CardPicker({
  levelId,
  open,
  onClose,
  onConfirm,
  plantIds,
  slots,
}: CardPickerProps) {
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= slots) return prev
      return [...prev, id]
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" data-testid="card-picker">
        <DialogHeader>
          <DialogTitle>
            战前选卡 · {levelId}（{selected.length}/{slots}）
          </DialogTitle>
        </DialogHeader>
        <div className="grid max-h-64 grid-cols-3 gap-2 overflow-auto">
          {plantIds.map((id) => {
            const def = getPlant(id)
            const on = selected.includes(id)
            return (
              <button
                key={id}
                type="button"
                data-testid={`pick-${id}`}
                onClick={() => toggle(id)}
                className={`rounded border p-2 text-left text-xs ${
                  on ? 'border-lime-400 bg-lime-800' : 'border-emerald-700'
                }`}
              >
                <div className="font-medium">{def.name}</div>
                <div>☀{def.sunCost}</div>
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            disabled={selected.length === 0}
            onClick={() => onConfirm(selected)}
            data-testid="card-picker-confirm"
          >
            出战
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
