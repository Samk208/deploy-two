export default function SkeletonGrid({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border p-3 animate-pulse">
          <div className="aspect-[4/3] rounded-xl bg-gray-200" />
          <div className="mt-3 h-4 w-3/4 bg-gray-200 rounded" />
          <div className="mt-2 h-4 w-1/2 bg-gray-200 rounded" />
          <div className="mt-2 h-5 w-1/3 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}
