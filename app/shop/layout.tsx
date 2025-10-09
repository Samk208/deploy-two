import FreezeBanner from "@/components/FreezeBanner";
import ShopFreezeBanner from "@/components/ShopFreezeBanner";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FreezeBanner />
      <ShopFreezeBanner />
      {children}
    </>
  );
}
