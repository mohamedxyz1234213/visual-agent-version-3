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
  onLanguageChange?: (language: string) => void;
  showLanguageSelector?: boolean;
  supportedLanguages?: { id: string; label: string }[];
}

const DEFAULT_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
];

function getFileExtension(lang: string): string {
  const map: Record<string, string> = {
    javascript: 'js', typescript: 'ts', python: 'py',
    java: 'java', cpp: 'cpp', go: 'go', rust: 'rs',
  };
  return map[lang] || 'js';
}

function TabIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-5-7z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}

function PlayIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function CloseIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CopyIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
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
  onLanguageChange,
  showLanguageSelector = false,
  supportedLanguages = DEFAULT_LANGUAGES,
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(-1);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activePanel, setActivePanel] = useState<"output" | "terminal" | "problems">("output");
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleCodeChange = useCallback(
    (value: string) => {
      setCode(value);
      onCodeChange?.(value);
    },
    [onCodeChange]
  );

  const handleRun = useCallback(async () => {
    if (!onRun) {
      setIsRunning(true);
      setOutput(null);
      setActivePanel("output");
      try {
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
    setActivePanel("output");
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

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    });
  }, [code]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = e.currentTarget.selectionStart;
        const end = e.currentTarget.selectionEnd;
        const newValue = code.substring(0, start) + "  " + code.substring(end);
        handleCodeChange(newValue);
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
      // Track cursor position
      const ta = e.currentTarget;
      setTimeout(() => {
        const text = ta.value.substring(0, ta.selectionStart);
        const lines = text.split("\n");
        setCursorPosition({ line: lines.length, col: lines[lines.length - 1].length + 1 });
      }, 0);
    },
    [code, handleCodeChange, handleRun]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const lineCount = code.split("\n").length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#3c3c3c] bg-[#1e1e1e] shadow-2xl" style={{ fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace" }}>
      {/* ── TITLE BAR ── */}
      <div className="flex items-center justify-between h-9 bg-[#323233] px-4 select-none border-b border-[#3c3c3c]">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 bg-[#2d2d2d] rounded-t px-3 py-1.5 border-t border-[#3c3c3c] border-x border-x-[#3c3c3c]">
            <TabIcon className="w-3 h-3 text-[#519aba]" />
            <span className="text-[12px] text-[#cccccc] font-medium">{`file.${getFileExtension(selectedLanguage)}`}</span>
            <button className="opacity-40 hover:opacity-100 transition-opacity">
              <CloseIcon className="w-3 h-3 text-[#cccccc]" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Hints button */}
          {hints.length > 0 && (
            <button
              onClick={() => setShowHints(!showHints)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                showHints ? "bg-[#d2a100] text-[#1e1e1e]" : "text-[#969696] hover:text-[#cccccc]"
              }`}
            >
              💡 Hints
            </button>
          )}
          {/* Copy button */}
          <button onClick={handleCopy} className="p-1 rounded text-[#969696] hover:text-[#cccccc] hover:bg-[#3c3c3c] transition-all" title="Copy code">
            {copyFeedback ? <CheckIcon className="w-3.5 h-3.5 text-[#4ec9b0]" /> : <CopyIcon className="w-3.5 h-3.5" />}
          </button>
          {/* Language selector */}
          {showLanguageSelector && !readOnly && (
            <div className="relative" ref={langDropdownRef}>
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-[#969696] hover:text-[#cccccc] hover:bg-[#3c3c3c] transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
                {supportedLanguages.find((l) => l.id === selectedLanguage)?.label || selectedLanguage}
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showLangDropdown ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {showLangDropdown && (
                <div className="absolute top-full right-0 mt-1 w-40 bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-2xl z-50 py-1 overflow-hidden">
                  {supportedLanguages.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setSelectedLanguage(lang.id);
                        setShowLangDropdown(false);
                        onLanguageChange?.(lang.id);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors flex items-center gap-2 ${
                        lang.id === selectedLanguage ? 'text-white bg-[#094771]' : 'text-[#cccccc] hover:bg-[#2a2d2e]'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Reset button */}
          {!readOnly && (
            <button
              onClick={resetCode}
              className="px-2 py-0.5 rounded text-[11px] text-[#969696] hover:text-[#cccccc] hover:bg-[#3c3c3c] transition-all"
            >
              ↺ Reset
            </button>
          )}
        </div>
      </div>

      {/* ── EDITOR AREA ── */}
      <div className="flex relative" style={{ minHeight: height, maxHeight: `calc(${height} + 80px)` }}>
        {/* Gutter with line numbers */}
        <div className="shrink-0 bg-[#1e1e1e] pt-3 pb-3 overflow-hidden select-none border-r border-[#252526]" style={{ width: "52px" }}>
          {lineNumbers.map((n) => (
            <div
              key={n}
              className={`text-right pr-3 text-[12px] leading-5 font-mono ${n === cursorPosition.line ? 'text-[#cccccc]' : 'text-[#858585]'}`}
              style={{ width: "52px" }}
            >
              {n}
            </div>
          ))}
        </div>

        {/* Code editor */}
        <div className="flex-1 relative overflow-hidden">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={(e) => {
              const ta = e.currentTarget;
              const text = ta.value.substring(0, ta.selectionStart);
              const lines = text.split("\n");
              setCursorPosition({ line: lines.length, col: lines[lines.length - 1].length + 1 });
            }}
            onClick={(e) => {
              const ta = e.currentTarget;
              const text = ta.value.substring(0, ta.selectionStart);
              const lines = text.split("\n");
              setCursorPosition({ line: lines.length, col: lines[lines.length - 1].length + 1 });
            }}
            readOnly={readOnly}
            placeholder={placeholder}
            className="absolute inset-0 bg-transparent text-[13px] font-mono leading-5 text-[#d4d4d4] resize-none outline-none border-none placeholder:text-[#5a5a5a] caret-[#aeafad]"
            style={{
              padding: "12px 12px 12px 16px",
              tabSize: 2,
              MozTabSize: 2,
              lineHeight: "20px",
              minHeight: height,
              whiteSpace: "pre",
              overflowWrap: "normal",
              overflowX: "auto",
              overflowY: "auto",
            }}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>

        {/* Minimap (simulated) */}
        <div className="shrink-0 bg-[#252526] w-[60px] border-l border-[#3c3c3c] hidden md:block overflow-hidden pt-3">
          {code.split("\n").slice(0, 80).map((line, i) => (
            <div key={i} className="flex items-center" style={{ height: "3px", marginBottom: "1px" }}>
              <div
                className="rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(10, line.replace(/\s/g, '').length * 4))}%`,
                  height: "3px",
                  backgroundColor: cursorPosition.line === i + 1 ? "#D6F63E" : "#4a4a4a",
                  opacity: cursorPosition.line === i + 1 ? 0.6 : 1,
                  marginLeft: "4px",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── OUTPUT / TERMINAL PANEL ── */}
      {output !== null && (
        <div className="bg-[#1e1e1e] border-t border-[#3c3c3c]">
          {/* Panel tabs */}
          <div className="flex items-center bg-[#252526] border-b border-[#3c3c3c]">
            {(["output", "problems", "terminal"] as const).map((panel) => (
              <button
                key={panel}
                onClick={() => setActivePanel(panel)}
                className={`px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors ${
                  activePanel === panel
                    ? "text-white border-b-2 border-b-[#D6F63E] bg-[#1e1e1e]"
                    : "text-[#969696] hover:text-[#cccccc]"
                }`}
              >
                {panel === "output" ? "OUTPUT" : panel === "problems" ? "PROBLEMS" : "TERMINAL"}
              </button>
            ))}
            <div className="flex-1" />
            <button onClick={() => setOutput(null)} className="px-2 py-1 text-[#969696] hover:text-[#cccccc] transition-colors">
              <CloseIcon className="w-3 h-3" />
            </button>
          </div>

          {/* Panel content */}
          <div className="max-h-[140px] overflow-y-auto p-3 bg-[#1e1e1e]">
            {activePanel === "output" && (
              <pre className="text-[13px] font-mono leading-5 whitespace-pre-wrap break-all text-[#cccccc] m-0">
                {output}
              </pre>
            )}
            {activePanel === "terminal" && (
              <div className="text-[13px] font-mono leading-5 text-[#cccccc]">
                <span className="text-[#4ec9b0]">$</span> node <span className="text-[#dcdcaa]">file.{getFileExtension(selectedLanguage)}</span>
              </div>
            )}
            {activePanel === "problems" && (
              <div className="text-[13px] font-mono leading-5 text-[#4ec9b0]">
                ✓ No problems detected
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STATUS BAR ── */}
      <div className="flex items-center justify-between h-[22px] px-3 bg-[#007acc] text-[12px] text-white select-none">
        <div className="flex items-center gap-4">
          {showLanguageSelector && (
            <span className="opacity-90 hover:opacity-100 cursor-default">
              {supportedLanguages.find((l) => l.id === selectedLanguage)?.label?.toUpperCase() || selectedLanguage.toUpperCase()}
            </span>
          )}
          <span className="opacity-70">⏎ {getFileExtension(selectedLanguage).toUpperCase()}</span>
          {!readOnly && (
            <span className="opacity-70">Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!readOnly && (
            <>
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-[#ffffff22] hover:bg-[#ffffff33] disabled:opacity-50 transition-all"
              >
                {isRunning ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-3 h-3" />
                    Run
                  </>
                )}
              </button>
              <span className="opacity-70 text-[11px]">{isRunning ? '…' : `⏎ Ctrl+Enter`}</span>
            </>
          )}
          <span className="opacity-70 text-[11px]">UTF-8</span>
          <span className="opacity-70 text-[11px]">Spaces: 2</span>
        </div>
      </div>

      {/* ── HINTS PANEL ── */}
      {showHints && hints.length > 0 && (
        <div className="border-t border-[#3c3c3c] bg-[#252526] p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-bold text-[#d2a100] uppercase tracking-wider">
              💡 Hints
            </h4>
            {currentHintIndex < hints.length - 1 && (
              <button
                onClick={revealHint}
                className="text-[11px] font-semibold text-[#d2a100] hover:text-[#e6b800] transition-colors"
              >
                Reveal next hint →
              </button>
            )}
          </div>
          {currentHintIndex >= 0 && (
            <div className="space-y-1.5">
              {hints.slice(0, currentHintIndex + 1).map((hint, i) => (
                <div key={i} className="flex items-start gap-2 text-[12px] text-[#d4d4d4]">
                  <span className="w-5 h-5 rounded-full bg-[#d2a100] flex items-center justify-center text-[10px] font-bold text-[#1e1e1e] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="mt-0.5">{hint.text}</span>
                </div>
              ))}
            </div>
          )}
          {currentHintIndex < 0 && (
            <p className="text-[12px] text-[#969696]">
              Click &quot;Reveal next hint&quot; to get a hint about this exercise.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
