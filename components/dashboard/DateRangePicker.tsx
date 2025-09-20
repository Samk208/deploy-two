"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format, subDays, startOfMonth } from "date-fns"

interface DateRange {
  from: Date
  to: Date
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const presets = [
  { label: "Today", getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: "7D", getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: "30D", getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: "MTD", getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
]

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({})

  const handlePresetClick = (preset: (typeof presets)[0]) => {
    const range = preset.getValue()
    onChange(range)
    setIsOpen(false)
  }

  const handleCustomRangeSelect = () => {
    if (customRange.from && customRange.to) {
      onChange({ from: customRange.from, to: customRange.to })
      setIsOpen(false)
    }
  }

  const getActivePreset = () => {
    return presets.find((preset) => {
      const range = preset.getValue()
      return (
        format(range.from, "yyyy-MM-dd") === format(value.from, "yyyy-MM-dd") &&
        format(range.to, "yyyy-MM-dd") === format(value.to, "yyyy-MM-dd")
      )
    })
  }

  const activePreset = getActivePreset()

  return (
    <div className="flex items-center gap-2">
      {/* Preset buttons */}
      <div className="flex gap-1">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant={activePreset?.label === preset.label ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetClick(preset)}
            className="text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Custom date picker */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs bg-transparent">
            <CalendarIcon className="h-3 w-3 mr-1" />
            Custom
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <div className="space-y-4">
            <div className="text-sm font-medium">Select custom date range</div>
            <div className="flex gap-4">
              <div>
                <div className="text-xs text-gray-600 mb-2">From</div>
                <Calendar
                  mode="single"
                  selected={customRange.from}
                  onSelect={(date) => setCustomRange((prev) => ({ ...prev, from: date }))}
                  className="rounded-md border"
                />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-2">To</div>
                <Calendar
                  mode="single"
                  selected={customRange.to}
                  onSelect={(date) => setCustomRange((prev) => ({ ...prev, to: date }))}
                  className="rounded-md border"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCustomRangeSelect} disabled={!customRange.from || !customRange.to}>
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Current range display */}
      <div className="text-sm text-gray-600 ml-2">
        {format(value.from, "MMM d")} - {format(value.to, "MMM d, yyyy")}
      </div>
    </div>
  )
}
