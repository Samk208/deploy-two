import { Suspense } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={<div>Loading...</div>}>
        {children}
      </Suspense>
    </div>
  )
}
