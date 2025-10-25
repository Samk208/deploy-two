'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen grid place-items-center p-8 text-center">
      <div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-gray-500 mt-2">An unexpected error occurred.</p>
        {error?.digest && (
          <p className="text-xs text-gray-400 mt-2">Error ID: {error.digest}</p>
        )}
        <button
          onClick={() => reset()}
          className="inline-block mt-4 px-4 py-2 rounded bg-indigo-600 text-white"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
