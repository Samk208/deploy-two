export default function FreezeBanner() {
  if (process.env.NEXT_PUBLIC_CORE_FREEZE !== "true") return null;
  return (
    <div className="w-full bg-amber-100 text-amber-900 px-4 py-2 text-sm text-center">
      Read-only maintenance mode: dashboard & onboarding writes are temporarily disabled.
    </div>
  );
}
