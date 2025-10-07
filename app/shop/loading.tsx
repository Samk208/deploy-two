import SkeletonGrid from "@/components/shop/SkeletonGrid";

export default function Loading() {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold mb-4">Shop</h1>
      <SkeletonGrid />
    </div>
  );
}
