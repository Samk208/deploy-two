#!/usr/bin/env node
/**
 * Comprehensive Test Runner & Diagnostic Report Generator
 * Run: node scripts/run-diagnostics.ts
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface TestResult {
  suite: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  errors?: string[];
  warnings?: string[];
}

class DiagnosticRunner {
  private results: TestResult[] = [];
  private startTime: number = Date.now();

  async run() {
    console.log('🚀 Starting comprehensive diagnostic tests...\n');

    // Create directories
    await this.ensureDirectories();

    // Run test suites in order
    await this.runAuthTests();
    await this.runOnboardingTests();
    await this.runCheckoutTests();
    await this.runAccessibilityTests();
    await this.runDebugTests();

    // Generate report
    await this.generateReport();

    console.log('\n✅ Diagnostic tests complete!');
    console.log(`📊 Report generated at: diagnostic-report.html`);
  }

  private async ensureDirectories() {
    const dirs = [
      'test-screenshots',
      'test-failures',
      'test-results',
      'diagnostic-output',
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private async runAuthTests() {
    console.log('🔐 Running authentication & role-based routing tests...');
    
    const suites = [
      {
        name: 'Role-Based Dashboard Routing',
        path: 'tests/e2e/auth/role-based-routing.spec.ts',
      },
      {
        name: 'Session Verification',
        path: 'tests/e2e/api/session-verification.spec.ts',
      },
      {
        name: 'Middleware Auth',
        path: 'tests/e2e/middleware/auth-middleware.spec.ts',
      },
    ];

    for (const suite of suites) {
      await this.runTestSuite(suite.name, suite.path);
    }
  }

  private async runOnboardingTests() {
    console.log('\n📝 Running onboarding flow tests...');
    
    const suites = [
      {
        name: 'Complete Onboarding Flow',
        path: 'tests/e2e/onboarding/complete-flow-role-verification.spec.ts',
      },
      {
        name: 'Onboarding Access Control',
        path: 'tests/e2e/onboarding-brand-influencer-access.spec.ts',
      },
    ];

    for (const suite of suites) {
      await this.runTestSuite(suite.name, suite.path);
    }
  }

  private async runCheckoutTests() {
    console.log('\n💳 Running checkout flow tests...');
    
    const suites = [
      {
        name: 'Enhanced Checkout Flow',
        path: 'tests/e2e/checkout/checkout-flow.spec.ts',
      },
    ];

    for (const suite of suites) {
      await this.runTestSuite(suite.name, suite.path);
    }
  }

  private async runAccessibilityTests() {
    console.log('\n♿ Running accessibility tests...');
    
    const suites = [
      {
        name: 'Visual & A11y Tests',
        path: 'tests/e2e/checkout/checkout-visual-a11y.spec.ts',
      },
    ];

    for (const suite of suites) {
      await this.runTestSuite(suite.name, suite.path);
    }
  }

  private async runDebugTests() {
    console.log('\n🐛 Running debug diagnostics...');
    
    const suites = [
      {
        name: 'Middleware Debug',
        path: 'tests/debug/middleware-test.spec.ts',
        optional: true,
      },
      {
        name: 'Session Persistence Debug',
        path: 'tests/debug/session-persistence.spec.ts',
        optional: true,
      },
      {
        name: 'Onboarding Redirect Debug',
        path: 'tests/debug/onboarding-redirect.spec.ts',
        optional: true,
      },
    ];

    for (const suite of suites) {
      await this.runTestSuite(suite.name, suite.path, suite.optional);
    }
  }

  private async runTestSuite(
    name: string, 
    path: string,
    optional: boolean = false
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Check if test file exists
      const exists = await fs.access(path).then(() => true).catch(() => false);
      
      if (!exists) {
        if (optional) {
          console.log(`  ⏭️  Skipping ${name} (optional, file not found)`);
          this.results.push({
            suite: name,
            status: 'skipped',
            duration: 0,
            warnings: ['Test file not found (optional)'],
          });
          return;
        } else {
          throw new Error(`Test file not found: ${path}`);
        }
      }

      console.log(`  🧪 Running: ${name}...`);
      
      const { stdout, stderr } = await execAsync(
        `pnpm test:e2e -- ${path} --reporter=json`,
        { maxBuffer: 50 * 1024 * 1024 } // Increase to 50MB to avoid truncation
      );

      const duration = Date.now() - startTime;

      // Parse JSON output
      let testData: any | undefined;
      let parseError: any | undefined;
      try {
        testData = JSON.parse(stdout);
      } catch (err) {
        parseError = err;
      }

      // Heuristic failure detection if JSON was unparseable
      const text = `${stdout}\n${stderr}`.toLowerCase();
      const failureMarkers = [
        'error', 'failed', 'timeout', 'assertion', 'expect(', 'unhandledrejection', 'uncaught', 'ecode', 'econn', 'timeoutexceeded'
      ];
      const looksFailed = failureMarkers.some(m => text.includes(m));

      if (testData && testData.stats?.failures === 0 && !looksFailed) {
        console.log(`  ✅ ${name} passed (${duration}ms)`);
        this.results.push({
          suite: name,
          status: 'passed',
          duration,
        });
      } else {
        const errors: string[] = [];
        if (!testData && parseError) {
          errors.push(`Could not parse JSON reporter output: ${String(parseError)}`);
        }
        errors.push(...this.parseErrors(stderr));
        if (stdout && stdout.trim()) {
          errors.push('--- STDOUT ---');
          errors.push(stdout.slice(0, 20000));
        }
        if (stderr && stderr.trim()) {
          errors.push('--- STDERR ---');
          errors.push(stderr.slice(0, 20000));
        }

        console.log(`  ⚠️  ${name} had failures (${duration}ms)`);
        this.results.push({
          suite: name,
          status: 'failed',
          duration,
          errors,
        });
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.log(`  ❌ ${name} failed (${duration}ms)`);
      
      this.results.push({
        suite: name,
        status: 'failed',
        duration,
        errors: [error.message],
      });

      // Save error details
      await this.saveErrorDetails(name, error);
    }
  }

  private parseErrors(stderr: string): string[] {
    const errors: string[] = [];
    const lines = stderr.split('\n');
    
    for (const line of lines) {
      if (line.includes('Error:') || line.includes('AssertionError')) {
        errors.push(line.trim());
      }
    }
    
    return errors.length > 0 ? errors : ['Unknown error occurred'];
  }

  private async saveErrorDetails(suiteName: string, error: any) {
    const filename = `diagnostic-output/${suiteName.replace(/\s+/g, '-').toLowerCase()}-error.log`;
    await fs.writeFile(filename, `
Suite: ${suiteName}
Timestamp: ${new Date().toISOString()}
Error: ${error.message}
Stack: ${error.stack || 'N/A'}
Stdout: ${error.stdout || 'N/A'}
Stderr: ${error.stderr || 'N/A'}
    `.trim());
  }

  private async generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diagnostic Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 { color: #1a1a1a; margin-bottom: 10px; }
    .meta { color: #666; margin-bottom: 30px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .card {
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid;
    }
    .card.passed { border-color: #22c55e; background: #f0fdf4; }
    .card.failed { border-color: #ef4444; background: #fef2f2; }
    .card.skipped { border-color: #f59e0b; background: #fffbeb; }
    .card h3 { font-size: 36px; margin-bottom: 5px; }
    .card p { color: #666; font-size: 14px; }
    .results { margin-top: 30px; }
    .test-item {
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 10px;
      display: flex;
      align-items: flex-start;
      gap: 15px;
    }
    .test-item.passed { background: #f0fdf4; }
    .test-item.failed { background: #fef2f2; }
    .test-item.skipped { background: #fffbeb; }
    .status-icon {
      font-size: 24px;
      line-height: 1;
    }
    .test-details { flex: 1; }
    .test-name { font-weight: 600; margin-bottom: 5px; }
    .test-duration { color: #666; font-size: 14px; }
    .errors {
      margin-top: 10px;
      padding: 10px;
      background: white;
      border-radius: 4px;
      font-size: 14px;
      color: #dc2626;
      white-space: pre-wrap;
      font-family: 'Courier New', monospace;
    }
    .warnings {
      margin-top: 10px;
      padding: 10px;
      background: white;
      border-radius: 4px;
      font-size: 14px;
      color: #d97706;
    }
    .recommendations {
      margin-top: 40px;
      padding: 20px;
      background: #eff6ff;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }
    .recommendations h2 { color: #1e40af; margin-bottom: 15px; }
    .recommendations ul { padding-left: 20px; }
    .recommendations li { margin: 8px 0; color: #1e3a8a; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 Diagnostic Test Report</h1>
    <div class="meta">
      Generated: ${new Date().toLocaleString()} | 
      Total Duration: ${(totalDuration / 1000).toFixed(2)}s
    </div>

    <div class="summary">
      <div class="card passed">
        <h3>${passed}</h3>
        <p>Passed</p>
      </div>
      <div class="card failed">
        <h3>${failed}</h3>
        <p>Failed</p>
      </div>
      <div class="card skipped">
        <h3>${skipped}</h3>
        <p>Skipped</p>
      </div>
    </div>

    <div class="results">
      <h2>Test Results</h2>
      ${this.results.map(result => `
        <div class="test-item ${result.status}">
          <div class="status-icon">
            ${result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏭️'}
          </div>
          <div class="test-details">
            <div class="test-name">${result.suite}</div>
            <div class="test-duration">${result.duration}ms</div>
            ${result.errors && result.errors.length > 0 ? `
              <div class="errors">${result.errors.join('\n')}</div>
            ` : ''}
            ${result.warnings && result.warnings.length > 0 ? `
              <div class="warnings">${result.warnings.join('\n')}</div>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>

    ${this.generateRecommendations()}
  </div>
</body>
</html>
    `.trim();

    await fs.writeFile('diagnostic-report.html', html);
    
    // Also generate JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      totalDuration,
      summary: { passed, failed, skipped },
      results: this.results,
    };
    
    await fs.writeFile(
      'diagnostic-output/report.json',
      JSON.stringify(jsonReport, null, 2)
    );
  }

  private generateRecommendations(): string {
    const failedTests = this.results.filter(r => r.status === 'failed');
    
    if (failedTests.length === 0) {
      return `
        <div class="recommendations">
          <h2>✨ All Tests Passed!</h2>
          <p>Your application is working correctly. No issues detected.</p>
        </div>
      `;
    }

    const recommendations: string[] = [];

    // Check for auth/routing failures
    const authFailures = failedTests.filter(r => 
      r.suite.toLowerCase().includes('auth') || 
      r.suite.toLowerCase().includes('routing')
    );
    
    if (authFailures.length > 0) {
      recommendations.push(
        '<strong>Authentication/Routing Issues Detected:</strong>',
        '• Check middleware.ts for correct role-to-route mapping',
        '• Verify session callback includes user role in JWT/session',
        '• Ensure cookies are configured correctly (httpOnly, sameSite, path)',
        '• Review RLS policies to ensure they return user role'
      );
    }

    // Check for onboarding failures
    const onboardingFailures = failedTests.filter(r => 
      r.suite.toLowerCase().includes('onboarding')
    );
    
    if (onboardingFailures.length > 0) {
      recommendations.push(
        '<strong>Onboarding Issues Detected:</strong>',
        '• Verify onboarding completion handler updates user role in database',
        '• Check redirect logic after successful document upload',
        '• Ensure session is refreshed after onboarding completion',
        '• Review user.role column in database schema'
      );
    }

    // Check for checkout failures
    const checkoutFailures = failedTests.filter(r => 
      r.suite.toLowerCase().includes('checkout')
    );
    
    if (checkoutFailures.length > 0) {
      recommendations.push(
        '<strong>Checkout Issues Detected:</strong>',
        '• Review cart UI component selectors (may have CSS issues)',
        '• Check Zustand cart store state persistence',
        '• Verify Stripe integration and webhook handling',
        '• Test form validation schemas (Zod)',
        '• Ensure all form inputs have proper name/id attributes'
      );
    }

    // Check for accessibility failures
    const a11yFailures = failedTests.filter(r => 
      r.suite.toLowerCase().includes('accessibility') || 
      r.suite.toLowerCase().includes('a11y')
    );
    
    if (a11yFailures.length > 0) {
      recommendations.push(
        '<strong>Accessibility Issues Detected:</strong>',
        '• Review form labels and aria attributes',
        '• Check color contrast ratios (WCAG AA)',
        '• Ensure all interactive elements are keyboard accessible',
        '• Add alt text to images',
        '• Implement focus management in modals'
      );
    }

    return `
      <div class="recommendations">
        <h2>🔧 Recommended Actions</h2>
        <ul>
          ${recommendations.map(r => `<li>${r}</li>`).join('')}
        </ul>
        <p style="margin-top: 20px; color: #666;">
          💡 Tip: Review detailed error logs in <code>diagnostic-output/</code> directory
        </p>
      </div>
    `;
  }
}

// Run diagnostics
const runner = new DiagnosticRunner();
runner.run().catch(console.error);