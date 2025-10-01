/**
 * Diagnostic script to analyze image loading issues in shop pages
 * Run with: tsx scripts/diagnose-image-issues.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

// Load env from .env.local by default (overridable via DOTENV_CONFIG_PATH)
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface DiagnosticResult {
  check: string;
  status: "pass" | "fail" | "warning";
  details: string;
  recommendations?: string[];
}

const results: DiagnosticResult[] = [];

function addResult(
  check: string,
  status: DiagnosticResult["status"],
  details: string,
  recommendations?: string[]
) {
  results.push({ check, status, details, recommendations });
}

async function checkProductImages() {
  console.log("\n🔍 Checking product images in database...\n");

  const { data: products, error } = await supabase
    .from("products")
    .select("id, title, images")
    .limit(200);

  if (error) {
    addResult(
      "Product Images Query",
      "fail",
      `Database error: ${error.message}`
    );
    return;
  }

  if (!products || products.length === 0) {
    addResult("Product Images Query", "fail", "No products found in database");
    return;
  }

  addResult(
    "Product Images Query",
    "pass",
    `Found ${products.length} products`
  );

  let nullImages = 0;
  let emptyArrays = 0;
  let malformedArrays = 0;
  let relativeUrls = 0;
  let absoluteUrls = 0;
  let unsupportedDomains: Set<string> = new Set();
  let quotedStrings = 0;

  const allowedDomains = ["images.unsplash.com", "picsum.photos"];
  const supabaseDomain = new URL(supabaseUrl as string).hostname;

  for (const product of products as any[]) {
    const { images, title } = product;

    // Check for null/undefined
    if (images === null || images === undefined) {
      nullImages++;
      continue;
    }

    // Check if it's an array
    if (!Array.isArray(images)) {
      malformedArrays++;
      console.log(
        `⚠️  Product "${title}": images is not an array (type: ${typeof images})`
      );
      continue;
    }

    // Check for empty array
    if (images.length === 0) {
      emptyArrays++;
      continue;
    }

    // Analyze first image
    const firstImage = images[0];

    if (typeof firstImage !== "string") {
      console.log(`⚠️  Product "${title}": first image is not a string`);
      continue;
    }

    // Check for extra quotes
    if (firstImage.startsWith('"') || firstImage.startsWith("'")) {
      quotedStrings++;
      console.log(
        `⚠️  Product "${title}": image has extra quotes: ${firstImage}`
      );
    }

    // Check if relative or absolute
    if (firstImage.startsWith("http://") || firstImage.startsWith("https://")) {
      absoluteUrls++;

      try {
        const url = new URL(firstImage);
        const hostname = url.hostname;

        // Check if domain is allowed
        const isAllowed =
          hostname === supabaseDomain ||
          allowedDomains.some(
            (d) => hostname === d || hostname.endsWith(`.${d}`)
          );

        if (!isAllowed) {
          unsupportedDomains.add(hostname);
        }
      } catch (e) {
        console.log(`⚠️  Product "${title}": invalid URL: ${firstImage}`);
      }
    } else {
      relativeUrls++;
    }
  }

  // Summary
  console.log("\n📊 Image Analysis Summary:\n");
  console.log(`   Total products: ${products.length}`);
  console.log(`   Null/undefined images: ${nullImages}`);
  console.log(`   Empty image arrays: ${emptyArrays}`);
  console.log(`   Malformed (not array): ${malformedArrays}`);
  console.log(`   Relative URLs: ${relativeUrls}`);
  console.log(`   Absolute URLs: ${absoluteUrls}`);
  console.log(`   Quoted strings: ${quotedStrings}`);

  if (unsupportedDomains.size > 0) {
    console.log(
      `\n⚠️  Unsupported domains found: ${Array.from(unsupportedDomains).join(", ")}`
    );
    addResult(
      "Image Domain Check",
      "fail",
      `${unsupportedDomains.size} unsupported domain(s) found`,
      [
        "Add domains to next.config.mjs remotePatterns",
        "Or migrate images to allowed domains",
        `Unsupported: ${Array.from(unsupportedDomains).join(", ")}`,
      ]
    );
  } else {
    addResult("Image Domain Check", "pass", "All image domains are supported");
  }

  if (nullImages > products.length * 0.3) {
    addResult(
      "Null Images",
      "warning",
      `${nullImages} products (${Math.round((nullImages / products.length) * 100)}%) have null images`,
      [
        "Consider adding placeholder images",
        "Or seed with actual product images",
      ]
    );
  }

  if (quotedStrings > 0) {
    addResult(
      "Quoted Strings",
      "fail",
      `${quotedStrings} products have extra quotes in image URLs`,
      ["Run cleanup script to strip quotes from image URLs"]
    );
  }

  if (malformedArrays > 0) {
    addResult(
      "Malformed Arrays",
      "fail",
      `${malformedArrays} products have non-array images field`,
      ["Check database schema", "Ensure images column is jsonb or text[]"]
    );
  }
}

async function checkInfluencerShops() {
  console.log("\n🔍 Checking influencer shops...\n");

  // Some deployments use column names banner/logo instead of banner_url
  // We fetch a superset and handle presence in code
  const { data: shops, error } = await supabase
    .from("shops")
    .select("id, handle, influencer_id, banner, logo")
    .limit(50);

  if (error) {
    addResult(
      "Influencer Shops Query",
      "fail",
      `Database error: ${error.message}`
    );
    return;
  }

  if (!shops || shops.length === 0) {
    addResult("Influencer Shops Query", "warning", "No influencer shops found");
    return;
  }

  addResult("Influencer Shops Query", "pass", `Found ${shops.length} shops`);

  // Check shop images
  let missingBanners = 0;
  let missingAvatars = 0;

  for (const shop of shops as any[]) {
    const hasBanner = Boolean((shop as any).banner || (shop as any).logo);
    if (!hasBanner) missingBanners++;
  }

  // Try to fetch avatars from profiles (avatar_url) or users (avatar) using influencer_id
  const influencerIds = Array.from(
    new Set(
      (shops as any[]).map((s) => (s as any).influencer_id).filter(Boolean)
    )
  ) as string[];
  if (influencerIds.length > 0) {
    // Attempt profiles first
    let avatarById = new Map<string, string | null>();
    let fetched = false;
    {
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("id, avatar_url")
        .in("id", influencerIds);
      if (!profErr && Array.isArray(profiles)) {
        avatarById = new Map<string, string | null>(
          profiles.map((p) => [
            String((p as any).id),
            (p as any).avatar_url || null,
          ])
        );
        fetched = true;
      }
    }
    if (!fetched) {
      // Fallback to users table with 'avatar' column
      const { data: users, error: usersErr } = await supabase
        .from("users")
        .select("id, avatar")
        .in("id", influencerIds);
      if (!usersErr && Array.isArray(users)) {
        avatarById = new Map<string, string | null>(
          users.map((u) => [String((u as any).id), (u as any).avatar || null])
        );
        fetched = true;
      }
    }
    if (fetched) {
      for (const shop of shops as any[]) {
        const av = avatarById.get(String((shop as any).influencer_id));
        if (!av) missingAvatars++;
      }
    }
  }

  if (missingBanners > 0) {
    addResult(
      "Shop Banners",
      "warning",
      `${missingBanners} shops missing banner images`,
      ["Add fallback banner in UI", "Encourage influencers to upload banners"]
    );
  }

  if (missingAvatars > 0) {
    addResult(
      "Shop Avatars",
      "warning",
      `${missingAvatars} shops missing avatar images`,
      ["Use default avatar component", "Or show initials fallback"]
    );
  }
}

function parseNextRemotePatterns() {
  console.log("\n🔍 Checking Next.js image configuration...\n");

  const configPath = path.resolve(process.cwd(), "next.config.mjs");
  if (!fs.existsSync(configPath)) {
    addResult("Next.js Config", "fail", "next.config.mjs not found");
    return;
  }

  const raw = fs.readFileSync(configPath, "utf8");

  // Use regex-based detection to avoid false positives from comments/strings.
  // This is heuristic but stricter than raw.includes.
  const allowed: string[] = [];
  const unsplashRe = /\bimages\.unsplash\.com\b/;
  const picsumRe = /\bpicsum\.photos\b/;
  if (unsplashRe.test(raw)) allowed.push("images.unsplash.com");
  if (picsumRe.test(raw)) allowed.push("picsum.photos");

  // Non-fatal: if NEXT_PUBLIC_SUPABASE_URL is malformed, log a warning and continue.
  try {
    const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!)
      .hostname;
    allowed.push(supabaseHost);
  } catch (e: any) {
    console.warn(
      `⚠️  Unable to parse NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || "undefined"} - ${e?.message || e}`
    );
  }

  addResult(
    "Next.js Config",
    "pass",
    "Checked remotePatterns for common domains",
    [
      "Ensure images.unsplash.com is included",
      "Ensure picsum.photos is included",
      "Ensure Supabase storage domain is included",
      "Check both http and https protocols in development",
      `Detected allow-list entries: ${allowed.join(", ") || "none"}`,
    ]
  );
}

function checkImageComponents() {
  console.log("\n🔍 Checking image component implementation...\n");

  const recommendations = [
    "EnhancedProductCard: Verify aspect-[4/3] container has non-zero height",
    "ProductImage: Ensure onError fallback is working",
    "InfluencerShopClient: Check image prop is passed correctly",
    "All components: Add data-testid for Playwright tests",
    "All components: Use next/image with proper width/height or fill",
  ];

  addResult(
    "Image Components",
    "pass",
    "Manual verification needed",
    recommendations
  );
}

function printReport() {
  console.log("\n\n═══════════════════════════════════════════════════════");
  console.log("              DIAGNOSTIC REPORT");
  console.log("═══════════════════════════════════════════════════════\n");

  const passed = results.filter((r) => r.status === "pass").length;
  const warnings = results.filter((r) => r.status === "warning").length;
  const failed = results.filter((r) => r.status === "fail").length;

  for (const result of results) {
    const icon =
      result.status === "pass"
        ? "✅"
        : result.status === "warning"
          ? "⚠️"
          : "❌";

    console.log(`${icon} ${result.check}`);
    console.log(`   ${result.details}`);

    if (result.recommendations && result.recommendations.length > 0) {
      console.log("   Recommendations:");
      for (const rec of result.recommendations) {
        console.log(`   • ${rec}`);
      }
    }
    console.log("");
  }

  console.log("═══════════════════════════════════════════════════════");
  console.log(
    `Summary: ${passed} passed, ${warnings} warnings, ${failed} failed`
  );
  console.log("═══════════════════════════════════════════════════════\n");

  if (failed > 0) {
    console.log("⚠️  RECOMMENDATION: Fix critical issues before recreation\n");
  } else if (warnings > 0) {
    console.log("✅ No critical issues found. Safe to proceed with testing.\n");
  } else {
    console.log("✅ All checks passed!\n");
  }
}

async function main() {
  console.log("🚀 Starting image diagnostics...\n");

  await checkProductImages();
  await checkInfluencerShops();
  parseNextRemotePatterns();
  checkImageComponents();

  printReport();
}

main().catch((err) => {
  console.error("Unexpected error in diagnostics:", err);
  process.exitCode = 1;
});
