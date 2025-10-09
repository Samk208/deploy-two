import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    CORE_FREEZE: process.env.CORE_FREEZE ?? null,
    SHOPS_FREEZE: process.env.SHOPS_FREEZE ?? null,
    NEXT_PUBLIC_CORE_FREEZE: process.env.NEXT_PUBLIC_CORE_FREEZE ?? null,
    NEXT_PUBLIC_SHOPS_FREEZE: process.env.NEXT_PUBLIC_SHOPS_FREEZE ?? null,
    NODE_ENV: process.env.NODE_ENV ?? null,
  });
}
