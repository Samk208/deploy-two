import { FullConfig } from "@playwright/test";
import fs from "fs/promises";
import path from "path";
import { generateMarkdownReport } from "./helpers/report-generator";

export default async function globalTeardown(_config: FullConfig) {
  // Resolve report directory relative to the project root for portability
  const reportDir = path.join(
    process.cwd(),
    "test-results",
    "Dashboard Report"
  );

  const jsonPath = path.join(reportDir, "test-results.json");

  try {
    const jsonContent = await fs.readFile(jsonPath, "utf-8");
    const results = JSON.parse(jsonContent);

    const suites: any[] = Array.isArray(results?.suites) ? results.suites : [];
    const testResults = suites.flatMap((suite: any, sIdx: number) => {
      const suiteTitle = suite?.title || suite?.file || `suite#${sIdx}`;
      if (!Array.isArray(suite?.specs)) {
        console.warn(`Skipping suite without specs: ${suiteTitle}`);
        return [] as any[];
      }
      return suite.specs.flatMap((spec: any, pIdx: number) => {
        const specTitle = spec?.title || spec?.file || `${suiteTitle}/spec#${pIdx}`;
        if (!Array.isArray(spec?.tests) || spec.tests.length === 0) {
          console.warn(`Skipping spec without tests: ${specTitle}`);
          return [] as any[];
        }
        const firstTest = spec.tests[0];
        if (!Array.isArray(firstTest?.results) || firstTest.results.length === 0) {
          console.warn(`Skipping test without results: ${specTitle}`);
          return [] as any[];
        }
        const r = firstTest.results[0] || {};
        const atts: any[] = Array.isArray(r.attachments) ? r.attachments : [];
        const screenshot = atts.find((a: any) => a?.name === "screenshot")?.path;
        const trace = atts.find((a: any) => a?.name === "trace")?.path;
        return [{
          suite: suiteTitle,
          test: specTitle,
          status: (r.status as "passed" | "failed" | "skipped") || "skipped",
          duration: Number(r.duration) || 0,
          error: r?.error?.message,
          screenshot,
          trace,
        }];
      });
    });

    await generateMarkdownReport(testResults);
    // eslint-disable-next-line no-console
    console.log("\n✅ All reports generated successfully!");
    // eslint-disable-next-line no-console
    console.log(`📁 Location: ${reportDir}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error generating markdown report:", error);
  }
}
