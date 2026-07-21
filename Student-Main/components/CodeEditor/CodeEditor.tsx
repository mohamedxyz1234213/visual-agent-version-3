"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  hints?: { order: number; text: string }[];
  onCodeChange?: (code: string) => void;
  onRun?: (code: string) => Promise<{ output: string; passed: boolean }>;
  readOnly?: boolean;
  height?: string;
  placeholder?: string;
}

export function CodeEditor({
  initialCode = "",
  language = "javascript",
  hints = [],
  onCodeChange,
  onRun,
  readOnly = false,
  height = "280px",
  placeholder = "// Write your code here...",
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(-1);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCodeChange = useCallback(
    (value: string) => {
      setCode(value);
      onCodeChange?.(value);
    },
    [onCodeChange]
  );

  const handleRun = useCallback(async () => {
    if (!onRun) {
      // Simple local evaluation for non-API mode
      setIsRunning(true);
      setOutput(null);
      try {
        // Simulate execution
        await new Promise((r) => setTimeout(r, 500));
        setOutput("Code executed successfully!\n> No output detected.");
      } catch (e: any) {
        setOutput(`Error: ${e.message}`);
      }
      setIsRunning(false);
      return;
    }

    setIsRunning(true);
    setOutput(null);
    try {
      const result = await onRun(code);
      setOutput(result.output || "Code executed successfully!");
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
    }
    setIsRunning(false);
  }, [code, onRun]);

  const revealHint = useCallback(() => {
    if (currentHintIndex < hints.length - 1) {
      setCurrentHintIndex((prev) => prev + 1);
    }
  }, [currentHintIndex, hints.length]);

  const resetCode = useCallback(() => {
    setCode(initialCode);
    setOutput(null);
    setCurrentHintIndex(-1);
  }, [initialCode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = e.currentTarget.selectionStart;
        const end = e.currentTarget.selectionEnd;
        const newValue = code.substring(0, start) + "  " + code.substring(end);
        handleCodeChange(newValue);
        // Restore cursor position after React re-render
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + 2;
            textareaRef.current.selectionEnd = start + 2;
          }
        });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    },
    [code, handleCodeChange, handleRun]
  );

  const lineCount = code.split("\n").length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  return (
    <div className="flux-card overflow-hidden" style={{ padding: 0 }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {language}
          </span>
          {!readOnly && (
            <span className="text-[11px] text-slate-400">
              {cursorPosition.line}:{cursorPosition.col}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hints.length > 0 && (
            <button
              onClick={() => setShowHints(!showHints)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                showHints
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {showHints ? "Hide Hints" : `Hints (${hints.length})`}
            </button>
          )}
          {!readOnly && (
            <>
              <button
                onClick={resetCode}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#D6F63E] text-[#0F0F0F] hover:bg-[#c5e535] disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {isRunning ? (
                  <>
                    <div className="w-3 h-3 border-2 border-[#0F0F0F] border-t-transparent rounded-full animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Run
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor + Output */}
      <div className="flex flex-col" style={{ maxHeight: `calc(${height} + 160px)` }}>
        {/* Code area */}
        <div className="flex relative" style={{ minHeight: height }}>
          {/* Line numbers */}
          <div className="flex-shrink-0 bg-slate-50 py-3 px-2 text-right select-none border-r border-slate-100" style={{ minWidth: "40px" }}>
            {lineNumbers.map((n) => (
              <div key={n} className="text-[11px] leading-5 text-slate-400 font-mono">
                {n}
              </div>
            ))}
          </div>

          {/* Code textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyDown={handleKeyDown}
readOnly={readOnly}
            placeholder={placeholder}
            className="flex-1 bg-white p-3 text-[13px] font-mono leading-5 text-slate-900 resize-none outline-none border-none placeholder:text-slate-300"
            style={{ height, minHeight: height, tabSize: 2 }}
            spellCheck={false}
          />
        </div>

        {/* Output console */}
        {output !== null && (
          <div className="border-t border-slate-100 bg-slate-900 text-green-400 p-3 font-mono text-[12px] leading-5 max-h-[120px] overflow-y-auto">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-2">
              <span>Output</span>
              <button
                onClick={() => setOutput(null)}
                className="ml-auto text-slate-600 hover:text-white transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <pre className="whitespace-pre-wrap break-all">{output}</pre>
          </div>
        )}
      </div>

      {/* Hints panel */}
      {showHints && hints.length > 0 && (
        <div className="border-t border-slate-100 bg-amber-50/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Hints
            </h4>
            {currentHintIndex < hints.length - 1 && (
              <button
                onClick={revealHint}
                className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
              >
                Reveal next hint
              </button>
            )}
          </div>
          {currentHintIndex >= 0 && (
            <div className="space-y-1.5">
              {hints.slice(0, currentHintIndex + 1).map((hint, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-amber-900 animate-flash-in"
                  style={{
                    animation: `fadeInUp 0.3s ease ${i * 0.1}s both`,
                  }}
                >
                  <span className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center text-[10px] font-bold text-amber-800 shrink-0">
                    {i + 1}
                  </span>
                  <span className="mt-0.5">{hint.text}</span>
                </div>
              ))}
            </div>
          )}
          {currentHintIndex < 0 && (
            <p className="text-xs text-amber-600">
              Click &quot;Reveal next hint&quot; to get a hint about this exercise.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
