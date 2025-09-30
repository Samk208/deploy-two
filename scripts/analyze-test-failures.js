const fs = require('fs');
const path = require('path');

class TestFailureAnalyzer {
  constructor() {
    this.resultsFile = process.env.RESULTS_FILE || 'test-results/results.json';
    this.outputDir = process.env.OUTPUT_DIR || 'test-results';
    this.patterns = {
      timeout: /Test timeout of \d+ms exceeded/,
      connectionRefused: /net::ERR_CONNECTION_REFUSED/,
      elementNotFound: /locator.*not found/,
      authenticationFailed: /should allow.*to (log in|sign in)/,
      missingTestId: /data-testid="[^"]*".*not found/,
      pageError: /page\.(goto|click|fill).*failed/
    };
  }

  async analyzeFailures() {
    const results = JSON.parse(fs.readFileSync(this.resultsFile, 'utf8'));
    const failures = this.extractFailures(results);
    
    console.log('🔍 AUTOMATED TEST FAILURE ANALYSIS');
    console.log('='.repeat(50));
    
    this.categorizeFailures(failures);
    this.generateActionPlan(failures);
    this.outputDetailedReport(failures);
  }

  extractFailures(results) {
    const failures = [];
    
    results.suites?.forEach(suite => {
      suite.tests?.forEach(test => {
        test.results?.forEach(result => {
          if (result.status === 'failed') {
            failures.push({
              title: test.title,
              file: suite.title,
              error: result.error?.message || '',
              duration: result.duration,
              timeout: result.timeout
            });
          }
        });
      });
    });
    
    return failures;
  }

  categorizeFailures(failures) {
    const categories = {
      'Authentication Issues': [],
      'Connection/Server Issues': [],
      'Missing UI Elements': [],
      'Timeout Issues': [],
      'Other': []
    };

    failures.forEach(failure => {
      if (this.patterns.connectionRefused.test(failure.error)) {
        categories['Connection/Server Issues'].push(failure);
      } else if (this.patterns.authenticationFailed.test(failure.title)) {
        categories['Authentication Issues'].push(failure);
      } else if (this.patterns.missingTestId.test(failure.error) || 
                 this.patterns.elementNotFound.test(failure.error)) {
        categories['Missing UI Elements'].push(failure);
      } else if (this.patterns.timeout.test(failure.error)) {
        categories['Timeout Issues'].push(failure);
      } else {
        categories['Other'].push(failure);
      }
    });

    console.log('\n📊 FAILURE CATEGORIES:');
    Object.entries(categories).forEach(([category, tests]) => {
      if (tests.length > 0) {
        console.log(`\n${category}: ${tests.length} tests`);
        tests.forEach(test => {
          console.log(`  - ${test.title} (${test.file})`);
        });
      }
    });

    return categories;
  }

  generateActionPlan(failures) {
    console.log('\n🛠️  RECOMMENDED ACTION PLAN:');
    console.log('-'.repeat(40));
    
    const authFailures = failures.filter(f => 
      this.patterns.authenticationFailed.test(f.title)
    ).length;
    
    const missingElements = failures.filter(f => 
      this.patterns.missingTestId.test(f.error)
    ).length;
    
    const timeouts = failures.filter(f => 
      this.patterns.timeout.test(f.error)
    ).length;

    console.log('Priority 1: Authentication Setup');
    console.log(`  • ${authFailures} tests failing due to auth issues`);
    console.log('  • Action: Implement loginAsAdmin() in test setup');
    
    console.log('\nPriority 2: Missing Test IDs');
    console.log(`  • ${missingElements} tests can\'t find UI elements`);
    console.log('  • Action: Add data-testid attributes to components');
    
    console.log('\nPriority 3: Timeout Issues');
    console.log(`  • ${timeouts} tests timing out`);
    console.log('  • Action: Increase timeouts or fix slow operations');
  }

  outputDetailedReport(failures) {
    const report = {
      summary: {
        total: failures.length,
        avgDuration: failures.reduce((sum, f) => sum + f.duration, 0) / (failures.length || 1)
      },
      topErrors: this.getTopErrors(failures),
      slowestTests: [...failures].sort((a, b) => b.duration - a.duration).slice(0, 5)
    };

    fs.mkdirSync(this.outputDir, { recursive: true });
    const jsonPath = path.join(this.outputDir, 'test-analysis-report.json');
    const mdPath = path.join(this.outputDir, 'test-analysis-report.md');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    const md = [
      '# Test Analysis Report',
      '',
      `- **Total failures**: ${report.summary.total}`,
      `- **Avg failed test duration (ms)**: ${Math.round(report.summary.avgDuration)}`,
      '',
      '## Top Errors',
      ...(report.topErrors.length ? report.topErrors.map(e => `- **[${e.count}]** ${e.error}`) : ['- None']),
      '',
      '## Slowest Failed Tests',
      ...(report.slowestTests.length ? report.slowestTests.map(t => `- **${t.duration}ms** ${t.title} (${t.file})`) : ['- None']),
      ''
    ].join('\n');
    fs.writeFileSync(mdPath, md);

    console.log(`\n📝 Detailed reports saved to:\n- ${jsonPath}\n- ${mdPath}`);
  }

  getTopErrors(failures) {
    const errorCounts = {};
    failures.forEach(failure => {
      const errorKey = (failure.error || '').split('\n')[0].substring(0, 100);
      errorCounts[errorKey] = (errorCounts[errorKey] || 0) + 1;
    });
    
    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
  }
}

// Run the analyzer
if (require.main === module) {
  const analyzer = new TestFailureAnalyzer();
  analyzer.analyzeFailures().catch(console.error);
}

module.exports = TestFailureAnalyzer;
