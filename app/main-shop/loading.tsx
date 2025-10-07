export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="rounded-2xl border p-4 animate-pulse">
          <div className="aspect-square w-full rounded-lg bg-neutral-200" />
          <div className="mt-3 h-5 w-2/3 bg-neutral-200 rounded" />
          <div className="mt-2 h-4 w-1/3 bg-neutral-200 rounded" />
        </div>
      ))}
    </div>
  );
}
