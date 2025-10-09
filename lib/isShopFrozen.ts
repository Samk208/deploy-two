/**
 * Helper function to check if shop writes are frozen
 * Uses the client-side environment variable for UI components
 */
export const isShopFrozen = (): boolean => {
  return (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_SHOPS_FREEZE === "true"
  );
};
