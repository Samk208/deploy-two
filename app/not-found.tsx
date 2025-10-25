export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center p-8 text-center">
      <div>
        <h1 className="text-2xl font-bold">404 – Page not found</h1>
        <p className="text-gray-500 mt-2">The page you’re looking for doesn’t exist.</p>
        <a href="/" className="inline-block mt-4 text-indigo-600 underline">Go home</a>
      </div>
    </main>
  );
}
