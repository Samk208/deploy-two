import { NextResponse } from 'next/server';
import { warnIfLocalhostInPreview } from '@/lib/safety/deployGuard';

export const dynamic = 'force-dynamic';

export async function GET() {
  warnIfLocalhostInPreview();
  const freeze = {
    core: process.env.CORE_FREEZE === 'true',
    shops: process.env.SHOPS_FREEZE === 'true',
    dryRunOnboarding: process.env.DRY_RUN_ONBOARDING === 'true',
    pubCore: process.env.NEXT_PUBLIC_CORE_FREEZE === 'true',
    pubShops: process.env.NEXT_PUBLIC_SHOPS_FREEZE === 'true',
    pubDryRun: process.env.NEXT_PUBLIC_DRY_RUN_ONBOARDING === 'true',
  };

  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    env: process.env.NETLIFY ? 'netlify' : process.env.VERCEL ? 'vercel' : 'local',
    freeze,
  });
}
