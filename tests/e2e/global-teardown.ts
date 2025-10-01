import { FullConfig } from "@playwright/test";
import fs from "fs/promises";
import path from "path";
import { generateMarkdownReport } from "./helpers/report-generator";

export default async function globalTeardown(_config: FullConfig) {
  const reportDir = path.join(
    "C:",
    "Users",
    "Lenovo",
    "Desktop",
    "Workspce",
    "vo-onelink-google",
    "test-results",
    "Dashboard Report"
  );

  const jsonPath = path.join(reportDir, "test-results.json");

  try {
    const jsonContent = await fs.readFile(jsonPath, "utf-8");
    const results = JSON.parse(jsonContent);

    const testResults = (results.suites || []).flatMap((suite: any) =>
      (suite.specs || []).map((spec: any) => {
        const r = spec.tests?.[0]?.results?.[0] || {};
        return {
          suite: suite.title || spec.file || "suite",
          test: spec.title || "test",
          status: (r.status as "passed" | "failed" | "skipped") || "skipped",
          duration: Number(r.duration) || 0,
          error: r.error?.message,
          screenshot: r.attachments?.find((a: any) => a.name === "screenshot")
            ?.path,
          trace: r.attachments?.find((a: any) => a.name === "trace")?.path,
        };
      })
    );

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
