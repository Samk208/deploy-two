import FreezeBanner from "@/components/FreezeBanner";
import ShopFreezeBanner from "@/components/ShopFreezeBanner";

export default function InfluencerShopLayout({
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
