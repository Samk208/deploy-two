export const isFrozen =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_CORE_FREEZE === "true";
