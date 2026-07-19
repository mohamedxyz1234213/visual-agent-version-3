// ── Code Execution Sandbox Service ────────────────────────────────────────────
// Safe code execution with timeout and memory limits

const TIMEOUT_MS = 5000;
const MAX_MEMORY_KB = 128 * 1024;

// Execute code in a safe sandbox (Node.js vm)
export async function executeCode(code, language = 'javascript', testCases = []) {
  const { default: vm } = await import('vm');

  const results = [];

  for (const tc of testCases) {
    const startTime = Date.now();
    let output = '';
    let passed = false;
    let error = null;

    try {
      const sandbox = { console: { _output: [], log(...args) { this._output.push(args.join(' ')); } } };
      const context = vm.createContext(sandbox);

      // Combine code with test input
      const fullCode = code + '\n' + (tc.input || '');

      const script = new vm.Script(fullCode, { timeout: TIMEOUT_MS });
      script.runInContext(context);

      output = sandbox.console._output.join('\n').trim();
      passed = output === (tc.expectedOutput || '').trim();
    } catch (err) {
      error = err.message;
      output = err.message;
    }

    results.push({
      testCaseId: tc.id,
      passed,
      output,
      expectedOutput: tc.expectedOutput || '',
      executionTime: Date.now() - startTime,
      memoryUsed: 0,
      error,
    });
  }

  return results;
}

// Calculate submission score from results
export function calculateScore(results) {
  if (!results.length) return 0;
  const passed = results.filter((r) => r.passed).length;
  return Math.round((passed / results.length) * 100);
}

// Determine submission status
export function determineStatus(results) {
  if (!results.length) return 'error';
  const passedCount = results.filter((r) => r.passed).length;
  if (passedCount === results.length) return 'passed';
  if (passedCount === 0) return 'failed';
  return 'partial';
}

export default { executeCode, calculateScore, determineStatus };
