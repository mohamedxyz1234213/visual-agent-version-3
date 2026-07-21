// ── Code Execution Sandbox Service ────────────────────────────────────────────
// Multi-language code execution with timeout and memory limits
// Supports: JavaScript (vm), Python (subprocess), Java (compile+run), C++ (compile+run)

import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import os from 'os';
import crypto from 'crypto';

const TIMEOUT_MS = 8000;
const MAX_OUTPUT_CHARS = 5000;
const BASE_TMP = path.join(os.tmpdir(), 'code-sandbox');

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateRunId() {
  return crypto.randomBytes(8).toString('hex');
}

async function createRunDir() {
  const dir = path.join(BASE_TMP, generateRunId());
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function cleanupDir(dir) {
  fs.rm(dir, { recursive: true, force: true }).catch(() => {});
}

function trimOutput(str, max = MAX_OUTPUT_CHARS) {
  if (!str) return '';
  if (str.length > max) return str.slice(0, max) + '\n... [output truncated]';
  return str;
}

function getToolHint(cmd) {
  const hints = {
    javac: 'Java compiler (javac) is not available. Install JDK (https://jdk.java.net/) and ensure javac is in your PATH.',
    java: 'Java runtime (java) is not available. Install JDK (https://jdk.java.net/) and ensure java is in your PATH.',
    'g++': 'C++ compiler (g++) is not available. Install GCC (https://gcc.gnu.org/install/) and ensure g++ is in your PATH.',
    python3: 'Python 3 is not available. Install Python (https://www.python.org/downloads/) and ensure python3 is in your PATH.',
    python: 'Python is not available. Install Python (https://www.python.org/downloads/) and ensure python is in your PATH.',
  };
  return hints[cmd] || `Required tool "${cmd}" is not available. Please install it and ensure it is in your PATH.`;
}

async function runCommand(cmd, args, input = null, timeoutMs = TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: input !== null ? ['pipe', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe'],
      timeout: timeoutMs,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    if (input !== null) {
      child.stdin.write(input);
      child.stdin.end();
    }

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Execution timed out'));
    }, timeoutMs + 1000);

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      resolve({ stdout: stdout.trimEnd(), stderr: stderr.trimEnd(), exitCode });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      if (err.code === 'ENOENT') {
        reject(new Error(getToolHint(cmd)));
      } else {
        reject(err);
      }
    });
  });
}

// ── Language-specific runners ─────────────────────────────────────────────────

async function runJavaScript(code, testInput, timeoutMs) {
  const { default: vm } = await import('vm');

  const sandbox = {
    console: {
      _output: [],
      log(...args) { this._output.push(args.map(String).join(' ')); },
      error(...args) { this._output.push('[ERROR] ' + args.map(String).join(' ')); },
      warn(...args) { this._output.push('[WARN] ' + args.map(String).join(' ')); },
    },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    Math: Math,
    JSON: JSON,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    Date: Date,
    RegExp: RegExp,
    Map: Map,
    Set: Set,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
  };

  const context = vm.createContext(sandbox);
  const fullCode = code + '\n' + (testInput || '');
  const script = new vm.Script(fullCode, { timeout: timeoutMs });
  script.runInContext(context);

  return sandbox.console._output.join('\n').trim();
}

async function runPython(code, testInput, timeoutMs) {
  const fullCode = code + '\n' + (testInput || '');
  // Try python3 first, fall back to python on any spawn failure
  let result;
  try {
    result = await runCommand('python3', ['-c', fullCode], null, timeoutMs);
  } catch {
    // python3 not found or failed to spawn — try python
    result = await runCommand('python', ['-c', fullCode], null, timeoutMs);
  }
  const { stdout, stderr, exitCode } = result;
  if (stderr && !stdout) throw new Error(stderr);
  return (stdout + (stderr ? '\n[stderr]\n' + stderr : '')).trim();
}

async function runJava(code, testInput, timeoutMs) {
  const runDir = await createRunDir();
  const className = 'Main';
  const javaFile = path.join(runDir, `${className}.java`);
  const fullCode = code + '\n' + (testInput || '');

  try {
    // Write Java source
    await fs.writeFile(javaFile, fullCode, 'utf-8');

    // Compile
    const { stderr: compileErr, exitCode: compileExit } = await runCommand(
      'javac', [javaFile], null, timeoutMs
    );
    if (compileExit !== 0) {
      throw new Error('Compilation error:\n' + (compileErr || 'Unknown error'));
    }

    // Run
    const { stdout, stderr } = await runCommand(
      'java', ['-cp', runDir, className], null, timeoutMs
    );
    return (stdout + (stderr ? '\n[stderr]\n' + stderr : '')).trim();
  } finally {
    cleanupDir(runDir);
  }
}

async function runCpp(code, testInput, timeoutMs) {
  const runDir = await createRunDir();
  const cppFile = path.join(runDir, 'main.cpp');
  const binaryFile = path.join(runDir, 'main_out');
  const fullCode = code + '\n' + (testInput || '');

  try {
    // Write C++ source
    await fs.writeFile(cppFile, fullCode, 'utf-8');

    // Compile
    const { stderr: compileErr, exitCode: compileExit } = await runCommand(
      'g++', [cppFile, '-o', binaryFile, '-std=c++17', '-O2'], null, timeoutMs
    );
    if (compileExit !== 0) {
      throw new Error('Compilation error:\n' + (compileErr || 'Unknown error'));
    }

    // Run
    const { stdout, stderr } = await runCommand(binaryFile, [], null, timeoutMs);
    return (stdout + (stderr ? '\n[stderr]\n' + stderr : '')).trim();
  } finally {
    cleanupDir(runDir);
  }
}

// ── Main execution dispatcher ────────────────────────────────────────────────

export async function executeCode(code, language = 'javascript', testCases = []) {
  const results = [];
  const timeoutPerCase = TIMEOUT_MS;

  for (const tc of testCases) {
    const startTime = Date.now();
    let output = '';
    let passed = false;
    let error = null;

    try {
      const execFn = {
        javascript: runJavaScript,
        js: runJavaScript,
        python: runPython,
        py: runPython,
        java: runJava,
        cpp: runCpp,
        'c++': runCpp,
      }[language.toLowerCase()];

      if (!execFn) {
        throw new Error(`Unsupported language: ${language}. Supported: javascript, python, java, cpp`);
      }

      output = await execFn(code, tc.input || '', timeoutPerCase);
      passed = output === (tc.expectedOutput || '').trim();
    } catch (err) {
      error = err.message;
      output = 'Error: ' + err.message;
    }

    results.push({
      testCaseId: tc.id,
      passed,
      output: trimOutput(output),
      expectedOutput: tc.expectedOutput || '',
      executionTime: Date.now() - startTime,
      memoryUsed: 0,
      error,
    });
  }

  return results;
}

// ── Stats helpers ─────────────────────────────────────────────────────────────

export function calculateScore(results) {
  if (!results.length) return 0;
  const passed = results.filter((r) => r.passed).length;
  return Math.round((passed / results.length) * 100);
}

export function determineStatus(results) {
  if (!results.length) return 'error';
  const passedCount = results.filter((r) => r.passed).length;
  if (passedCount === results.length) return 'passed';
  if (passedCount === 0) return 'failed';
  return 'partial';
}

export default { executeCode, calculateScore, determineStatus };
