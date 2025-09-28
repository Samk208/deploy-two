"use client"

import React from "react"

type Color = { name: string; hex: string }

export function BrandSwatch({ colors }: { colors?: Color[] }) {
  const [vars, setVars] = React.useState<Color[]>(colors || [])

  React.useEffect(() => {
    if (colors && colors.length) return
    const names = [
      "--brand-700", "--brand-600", "--brand-500", "--brand-400", "--brand-300",
      "--accent-500", "--accent-400",
      "--text-900", "--text-700", "--bg-soft",
      "--background", "--foreground"
    ]
    const cs = getComputedStyle(document.documentElement)
    const out: Color[] = names.map(n => ({ name: n.replace(/^--/, ""), hex: cs.getPropertyValue(n).trim() }))
      .filter(c => c.hex)
    setVars(out)
  }, [colors])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {(vars.length ? vars : (colors || [])).map((c) => (
        <div key={c.name} className="rounded-lg overflow-hidden border">
          <div className="h-16" style={{ backgroundColor: c.hex }} />
          <div className="p-3 text-sm flex items-center justify-between">
            <span className="font-medium">{c.name}</span>
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">{c.hex.toUpperCase()}</code>
          </div>
        </div>
      ))}
    </div>
  )
}
