"use client";
/**
 * SVG Whiteboard — full animated rendering engine.
 *
 * Supports: draw_text, draw_rect, draw_circle, draw_arrow, draw_path,
 *           draw_badge, draw_callout, draw_line, show_equation,
 *           draw_graph (bar/line), highlight, underline, clear.
 *
 * Every element uses entrance animations. Text is word-wrapped.
 * Arrows draw themselves with a stroke-dasharray animation.
 */

import React, { useEffect, useRef, useState } from "react";
import type { StoryboardScene } from "@/lib/types";

// ─── Payload shapes ────────────────────────────────────────────────────────────

interface TextStyle {
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAnchor?: "start" | "middle" | "end";
  // Set by the backend layout pass so text wraps/truncates to fit its container
  // box exactly (prevents the wrapped-text overflow that caused overlap).
  maxWidth?: number;
  maxLines?: number;
}

interface DrawTextP    { content: string; position: [number, number]; style?: TextStyle; }
interface DrawRectP    { x: number; y: number; width: number; height: number; label?: string; style?: { fill?: string; stroke?: string; strokeWidth?: number; rx?: number; flat?: boolean; }; }
interface DrawCircleP  { center: [number, number]; radius: number; label?: string; style?: { fill?: string; stroke?: string; strokeWidth?: number; }; }
interface DrawArrowP   { from: [number, number]; to: [number, number]; label?: string; style?: { color?: string; strokeWidth?: number; dashed?: boolean; }; }
interface DrawPathP    { d: string; markerEnd?: string; style?: { fill?: string; stroke?: string; strokeWidth?: number; dashed?: boolean; }; }
interface DrawBadgeP   { content: string; position: [number, number]; style?: { bg?: string; color?: string; fontSize?: number; }; }
interface DrawCalloutP { content: string; position: [number, number]; width?: number; style?: { bg?: string; stroke?: string; color?: string; }; }
interface DrawLineP    { from: [number, number]; to: [number, number]; style?: { color?: string; strokeWidth?: number; dashed?: boolean; }; }
interface ShowEquationP{ latex: string; position: [number, number]; style?: TextStyle; }
interface DrawCoordinateSystemP {
  origin?: [number, number];
  size?: [number, number];
  x_label?: string;
  y_label?: string;
  plot_points?: [number, number][];
}
interface DrawPhysicsShapeP {
  shape_type: "spring" | "pendulum" | "inclined_plane" | "pulley" | "free_body" | "wave" | "box_on_surface" | "bottle";
  position?: [number, number];
  size?: [number, number];
  label?: string;
  annotations?: string[];
}
interface DrawObjectP {
  object_type:
    // rich figures (heavy panel)
    | "cell" | "network" | "blockchain" | "cycle" | "gear" | "document" | "checklist" | "triangle" | "leaf" | "flask" | "lightbulb" | "target" | "book" | "dialogue" | "layers" | "compass"
    // bare line-art icons (clean colored ring, no panel) — for flow diagrams
    | "person" | "users" | "database" | "server" | "cloud" | "folder" | "shield" | "lock" | "key" | "check" | "cross" | "brain" | "money" | "building" | "globe" | "envelope" | "chip" | "flag" | "star" | "warning" | "gauge" | "rocket" | "handshake" | "chart_up" | "pencil_edit" | "cog_icon" | "clock" | "search";
  position?: [number, number];
  size?: [number, number];
  label?: string;
  annotations?: string[];
  accent?: string;
}
interface DrawTableP {
  headers: string[];
  rows: string[][];
  position?: [number, number];
  cell_width?: number;
  cell_height?: number;
}

interface DrawGraphP {
  graph_type?: "bar" | "line";
  title?: string;
  position?: [number, number];
  size?: [number, number];
  data?: { values: number[]; labels?: string[] };
}

// ─── Component ─────────────────────────────────────────────────────────────────

// Draw-first animations — elements are written/drawn, never pasted in via fade.
const ENTRANCE_ANIMATIONS = [
  "wb-write-on", "wb-teach", "wb-write", "wb-draw",
];
const SHAPE_ANIMATIONS = [
  "wb-draw", "wb-write-on", "wb-scale",
];
const LABEL_ANIMATIONS = [
  "wb-write-on", "wb-teach", "wb-write",
];

function pickAnimation(id: string, pool: string[]): string {
  // Deterministic but varied selection based on element ID hash
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return pool[Math.abs(hash) % pool.length];
}

export interface WhiteboardProps {
  scenes: StoryboardScene[];
  elapsed: number;
  width?: number;
  height?: number;
  zoom?: number;
}

interface RenderedEl { id: string; jsx: React.ReactNode; }

interface CameraState {
  zoom: number;
  offsetX: number;
  offsetY: number;
  transition: string;
}

export default function Whiteboard({
  scenes,
  elapsed,
  width = 800,
  height = 500,
  zoom = 1,
}: WhiteboardProps) {
  const [visible, setVisible] = useState<RenderedEl[]>([]);
  const [camera, setCamera] = useState<CameraState>({ zoom: 1, offsetX: 0, offsetY: 0, transition: 'none' });
  // The teacher's spoken line for the current beat, written along the bottom band
  // (there is no audio — captions ARE the narration the student reads).
  const [caption, setCaption] = useState<{ text: string; index: number; total: number } | null>(null);
  const renderedIds = useRef<Set<string>>(new Set());
  const prevElapsed = useRef<number>(-1);

  // Reset when the scene list changes (new lesson part loaded)
  useEffect(() => {
    setVisible([]);
    setCaption(null);
    setCamera({ zoom: 1, offsetX: 0, offsetY: 0, transition: 'none' });
    renderedIds.current.clear();
    prevElapsed.current = -1;
  }, [scenes]);

  useEffect(() => {
    if (Math.abs(elapsed - prevElapsed.current) < 0.05) return;
    prevElapsed.current = elapsed;

    // Handle camera animations
    const cameraScenes = scenes.filter((s) => s.action_type === "camera" && s.time_offset <= elapsed);
    if (cameraScenes.length > 0) {
      const latestCamera = cameraScenes[cameraScenes.length - 1];
      const payload = latestCamera.payload as any;
      const mode = payload?.mode || 'reset';
      const targetZoom = Number(payload?.zoom) || 1;

      if (mode === 'enter') {
        setCamera({ zoom: targetZoom, offsetX: 0, offsetY: 0, transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' });
      } else if (mode === 'focus') {
        // Zoom in slightly for emphasis
        setCamera({ zoom: targetZoom * 1.15, offsetX: 0, offsetY: 0, transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' });
      } else if (mode === 'reset') {
        setCamera({ zoom: 1, offsetX: 0, offsetY: 0, transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' });
      }
    }

    // Find the last clear that has fired up to this point
    const lastClearTime = scenes
      .filter((s) => s.action_type === "clear" && s.time_offset <= elapsed)
      .reduce((max, s) => Math.max(max, s.time_offset), -1);

    // Caption track: show the LATEST caption for this beat (after the last clear,
    // at/under elapsed). Captions replace each other — they never stack.
    let latestCaption: { text: string; index: number; total: number } | null = null;
    for (const scene of scenes) {
      if (scene.action_type !== "draw_caption") continue;
      if (scene.time_offset > elapsed || scene.time_offset <= lastClearTime) continue;
      const p = scene.payload as any;
      latestCaption = { text: String(p?.content ?? ""), index: Number(p?.index ?? 0), total: Number(p?.total ?? 1) };
    }
    setCaption(latestCaption);

    // Collect all non-clear scenes that should be visible:
    // after the last clear AND at or before current elapsed
    const shouldBeVisible: RenderedEl[] = [];
    const newIds = new Set<string>();

    for (const scene of scenes) {
      if (scene.action_type === "clear" || scene.action_type === "camera" || scene.action_type === "draw_caption") continue;
      if (scene.time_offset > elapsed) continue;
      if (scene.time_offset <= lastClearTime) continue;

      newIds.add(scene.id);

      // Only render if not already rendered
      if (!renderedIds.current.has(scene.id)) {
        const jsx = renderScene(scene);
        if (jsx) shouldBeVisible.push({ id: scene.id, jsx });
      }
    }

    // Update rendered tracking
    renderedIds.current = newIds;

    if (shouldBeVisible.length > 0) {
      setVisible((prev) => {
        // Keep previously visible elements that are still valid (after last clear, before elapsed)
        const kept = prev.filter((el) => newIds.has(el.id));
        // Add newly appeared elements
        const existingIds = new Set(kept.map((el) => el.id));
        const newEls = shouldBeVisible.filter((el) => !existingIds.has(el.id));
        return [...kept, ...newEls];
      });
    } else if (lastClearTime >= 0) {
      // A clear happened and nothing new to show yet — wipe the board
      const anyVisibleAfterClear = scenes.some(
        (s) => s.action_type !== "clear" && s.time_offset > lastClearTime && s.time_offset <= elapsed
      );
      if (!anyVisibleAfterClear) {
        setVisible([]);
      }
    }
  }, [elapsed, scenes]);

  return (
    <div
      className="relative overflow-hidden rounded-[28px] border border-slate-300 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_28px_80px_rgba(15,23,42,0.12)]"
      style={{ width: width * zoom, height: height * zoom }}
    >
      <div className="pointer-events-none absolute -left-10 top-6 h-28 w-28 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-36 w-36 rounded-full bg-emerald-200/25 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 wb-board-grain" />
      <div className="pointer-events-none absolute inset-0 wb-board-sheen" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0))]" />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width * zoom}
        height={height * zoom}
        className="absolute inset-0"
        style={{
          fontFamily: "var(--font-sans)",
          willChange: "transform",
          transform: `scale(${camera.zoom}) translate(${camera.offsetX}px, ${camera.offsetY}px)`,
          transition: camera.transition,
          transformOrigin: 'center center'
        }}
      >
        <defs>
          {/* Canvas clip — nothing escapes the board boundary */}
          <clipPath id="wb-clip">
            <rect x="0" y="0" width={width} height={height} />
          </clipPath>

          {/* Grid pattern */}
          <pattern id="wb-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1" />
          </pattern>

          {/* Arrow markers */}
          {[
            { id: "arr-default", color: "#1a1a1a" },
            { id: "arr-blue",    color: "#2563eb" },
            { id: "arr-green",   color: "#16a34a" },
            { id: "arr-red",     color: "#dc2626" },
            { id: "arr-purple",  color: "#7c3aed" },
            { id: "arr-gray",    color: "#64748b" },
            { id: "arr-orange",  color: "#ea580c" },
          ].map(({ id, color }) => (
            <marker key={id} id={id} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill={color} />
            </marker>
          ))}

          {/* Drop shadow for callouts */}
          <filter id="wb-shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="1" dy="2" stdDeviation="3" floodOpacity="0.12" />
          </filter>

          <filter id="wb-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#93c5fd" floodOpacity="0.24" />
          </filter>

          <linearGradient id="wb-panel-fill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Background grid */}
        <rect width={width} height={height} fill="url(#wb-grid)" />

        {/* All elements clipped to canvas bounds */}
        <g clipPath="url(#wb-clip)">
          {visible.map((el) => (
            <React.Fragment key={el.id}>{el.jsx}</React.Fragment>
          ))}
        </g>
      </svg>

      {/* Narration caption band — the teacher's spoken line, written for the
          student to read (no audio). Sits outside the SVG zoom so it never
          scales or drifts; replaces itself per beat. */}
      {caption && caption.text ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-3">
          <div
            key={`${caption.text}-${caption.index}`}
            className="wb-caption max-w-[92%] rounded-2xl border border-slate-200/70 bg-white/92 px-5 py-2.5 text-center shadow-[0_10px_30px_-12px_rgba(15,23,42,0.35)] backdrop-blur"
          >
            <p className="text-[15px] font-medium leading-snug tracking-[-0.01em] text-slate-700">
              {caption.text}
            </p>
            {caption.total > 1 ? (
              <div className="mt-1.5 flex justify-center gap-1">
                {Array.from({ length: Math.min(caption.total, 8) }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 w-4 rounded-full transition-colors ${i <= caption.index ? "bg-blue-500" : "bg-slate-200"}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Scene dispatcher ──────────────────────────────────────────────────────────

function renderScene(scene: StoryboardScene): React.ReactNode {
  const p = scene.payload as Record<string, unknown>;
  switch (scene.action_type) {
    case "draw_text":     return <DrawText    id={scene.id} p={p as unknown as DrawTextP}    />;
    case "draw_rect":     return <DrawRect    id={scene.id} p={p as unknown as DrawRectP}    />;
    case "draw_circle":   return <DrawCircle  id={scene.id} p={p as unknown as DrawCircleP}  />;
    case "draw_arrow":    return <DrawArrow   id={scene.id} p={p as unknown as DrawArrowP}   />;
    case "draw_path":     return <DrawPath    id={scene.id} p={p as unknown as DrawPathP}    />;
    case "draw_badge":    return <DrawBadge   id={scene.id} p={p as unknown as DrawBadgeP}   />;
    case "draw_callout":  return <DrawCallout id={scene.id} p={p as unknown as DrawCalloutP} />;
    case "draw_line":     return <DrawLine    id={scene.id} p={p as unknown as DrawLineP}    />;
    case "show_equation": return <ShowEquation id={scene.id} p={p as unknown as ShowEquationP}/>;
    case "draw_graph":    return <DrawGraph   id={scene.id} p={p as unknown as DrawGraphP}   />;
    case "draw_coordinate_system": return <DrawCoordinateSystem id={scene.id} p={p as unknown as DrawCoordinateSystemP} />;
    case "draw_physics_shape":     return <DrawPhysicsShape     id={scene.id} p={p as unknown as DrawPhysicsShapeP}     />;
    case "draw_object":            return <DrawObject           id={scene.id} p={p as unknown as DrawObjectP}           />;
    case "draw_table":             return <DrawTable             id={scene.id} p={p as unknown as DrawTableP}             />;
    case "draw_highlight":         return <DrawHighlight         id={scene.id} p={p as unknown as DrawHighlightP}         />;
    default:              return null;
  }
}

// ─── Helper: word-wrap text into <tspan> rows ──────────────────────────────────

function buildWrappedLines(
  text: string,
  maxWidth: number,
  fontSize: number,
  maxLines?: number,
) {
  const charsPerLine = Math.max(10, Math.floor(maxWidth / (fontSize * 0.55)));
  const words = String(text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length > charsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }

  if (current) lines.push(current);

  if (maxLines && lines.length > maxLines) {
    const visible = lines.slice(0, maxLines);
    const lastIndex = visible.length - 1;
    const trimmed = visible[lastIndex].slice(0, Math.max(0, charsPerLine - 3)).trim();
    visible[lastIndex] = `${trimmed}...`;
    return { lines: visible, lineHeight: fontSize * 1.35 };
  }

  return { lines, lineHeight: fontSize * 1.35 };
}

function estimateTextWidth(text: string, fontSize: number) {
  return Math.max(0, text.length) * fontSize * 0.58;
}

function wrapText(
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  color: string,
  fontWeight: string,
  textAnchor: "start" | "middle" | "end",
  maxLines?: number,
  animClass: string = "wb-appear",
) {
  const { lines, lineHeight } = buildWrappedLines(text, maxWidth, fontSize, maxLines);

  return (
    <text
      x={x}
      y={y}
      fontSize={fontSize}
      fill={color}
      fontWeight={fontWeight}
      textAnchor={textAnchor}
      className={animClass}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function renderLabelCapsule(
  id: string,
  label: string,
  centerX: number,
  topY: number,
  maxWidth: number,
  accent: string,
) {
  const fontSize = 14;
  const { lines, lineHeight } = buildWrappedLines(label, Math.max(80, maxWidth - 28), fontSize, 2);
  const longestLine = lines.reduce((longest, line) => (line.length > longest.length ? line : longest), "");
  const boxWidth = Math.min(maxWidth, Math.max(112, estimateTextWidth(longestLine, fontSize) + 30));
  const boxHeight = Math.max(34, 16 + lines.length * lineHeight);
  const boxX = centerX - boxWidth / 2;
  const boxY = Math.max(10, topY);

  return (
    <g key={id} className="wb-scale">
      <ellipse
        cx={centerX}
        cy={boxY + boxHeight / 2}
        rx={Math.max(42, boxWidth / 2 + 8)}
        ry={Math.max(18, boxHeight / 2 + 4)}
        fill={accent}
        fillOpacity={0.14}
        filter="url(#wb-glow)"
        className="wb-halo"
      />
      <rect
        x={boxX}
        y={boxY}
        width={boxWidth}
        height={boxHeight}
        rx={16}
        fill="url(#wb-panel-fill)"
        fillOpacity={0.98}
        stroke={accent}
        strokeOpacity={0.22}
        strokeWidth={1.4}
        filter="url(#wb-shadow)"
      />
      <rect x={boxX + 12} y={boxY + 8} width={Math.max(34, boxWidth - 24)} height={4} rx={2} fill={accent} fillOpacity={0.18} />
      <rect x={boxX + 12} y={boxY + 10} width={10} height={10} rx={5} fill={accent} fillOpacity={0.88} />
      <text x={centerX} y={boxY + 18} textAnchor="middle" fontSize={fontSize} fill="#0f172a" fontWeight="700">
        {lines.map((line, index) => (
          <tspan key={index} x={centerX} dy={index === 0 ? 0 : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
      <line x1={boxX + 18} y1={boxY + boxHeight - 10} x2={boxX + boxWidth - 18} y2={boxY + boxHeight - 10} stroke={accent} strokeOpacity={0.16} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function renderAnnotationCards(
  idPrefix: string,
  annotations: string[],
  x: number,
  y: number,
  width: number,
  accent: string,
) {
  const cardWidth = Math.max(148, width);
  const cardX = Math.max(14, Math.min(x, 800 - cardWidth - 14));
  const items: React.ReactNode[] = [];
  let offsetY = 0;

  annotations.slice(0, 3).forEach((annotation, index) => {
    const fontSize = 11;
    const { lines, lineHeight } = buildWrappedLines(annotation, cardWidth - 36, fontSize, 2);
    const cardHeight = Math.max(28, 12 + lines.length * lineHeight);
    const cardY = y + offsetY;
    offsetY += cardHeight + 8;

    items.push(
      <g key={`${idPrefix}-${index}`} className="wb-slide-r" style={{ animationDelay: `${index * 0.12}s` }}>
        <rect
          x={cardX}
          y={cardY}
          width={cardWidth}
          height={cardHeight}
          rx={14}
          fill="url(#wb-panel-fill)"
          fillOpacity={0.97}
          stroke={accent}
          strokeOpacity={0.18}
          strokeWidth={1.25}
          filter="url(#wb-shadow)"
        />
        <rect x={cardX + 10} y={cardY + 9} width={4} height={Math.max(10, cardHeight - 18)} rx={2} fill={accent} fillOpacity={0.8} />
        <circle cx={cardX + 22} cy={cardY + 15} r={4.5} fill={accent} fillOpacity={0.9} />
        <line x1={cardX + 34} y1={cardY + 14} x2={cardX + cardWidth - 18} y2={cardY + 14} stroke={accent} strokeOpacity={0.18} strokeWidth={2} strokeLinecap="round" />
        <text x={cardX + 34} y={cardY + 18} fontSize={fontSize} fill="#334155" fontWeight="600">
          {lines.map((line, lineIndex) => (
            <tspan key={lineIndex} x={cardX + 34} dy={lineIndex === 0 ? 0 : lineHeight}>
              {line}
            </tspan>
          ))}
        </text>
      </g>,
    );
  });

  return items;
}

function getPhysicsAccent(shapeType: DrawPhysicsShapeP["shape_type"]) {
  switch (shapeType) {
    case "spring":
    case "inclined_plane":
      return "#f59e0b";
    case "pendulum":
    case "box_on_surface":
      return "#2563eb";
    case "wave":
      return "#7c3aed";
    case "free_body":
      return "#16a34a";
    case "bottle":
      return "#0284c7";
    default:
      return "#475569";
  }
}

// Bare line-art icons render inside a clean colored ring (like a flow diagram),
// NOT inside the heavy figure panel. This set drives that branch in DrawObject.
const BARE_ICONS = new Set<DrawObjectP["object_type"]>([
  "person", "users", "database", "server", "cloud", "folder", "shield", "lock",
  "key", "check", "cross", "brain", "money", "building", "globe", "envelope",
  "chip", "flag", "star", "warning", "gauge", "rocket", "handshake", "chart_up",
  "pencil_edit", "cog_icon", "clock", "search",
]);

const BARE_ICON_ACCENT: Partial<Record<DrawObjectP["object_type"], string>> = {
  person: "#2563eb", users: "#65a30d", database: "#0891b2", server: "#475569",
  cloud: "#0284c7", folder: "#d97706", shield: "#7c3aed", lock: "#475569",
  key: "#ca8a04", check: "#16a34a", cross: "#dc2626", brain: "#db2777",
  money: "#16a34a", building: "#7c3aed", globe: "#0891b2", envelope: "#2563eb",
  chip: "#0f766e", flag: "#dc2626", star: "#ca8a04", warning: "#ea580c",
  gauge: "#0284c7", rocket: "#7c3aed", handshake: "#0ea5e9", chart_up: "#2563eb",
  pencil_edit: "#ea580c", cog_icon: "#475569", clock: "#0891b2", search: "#2563eb",
};

// Returns line-art icon JSX centered at (cx,cy), drawn to fit a ring of radius r.
// Every shape is stroke-based round-cap line art so it reads as hand-drawn.
function bareIcon(type: DrawObjectP["object_type"], cx: number, cy: number, r: number, color: string): React.ReactNode {
  const sw = Math.max(2.2, r * 0.075);
  const u = r * 0.6; // icon half-extent inside the ring
  const common = { fill: "none", stroke: color, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (type) {
    case "person":
      return (
        <g {...common}>
          <circle cx={cx} cy={cy - u * 0.45} r={u * 0.42} />
          <path d={`M ${cx - u * 0.72} ${cy + u * 0.85} Q ${cx} ${cy - u * 0.05} ${cx + u * 0.72} ${cy + u * 0.85}`} />
        </g>
      );
    case "users":
      return (
        <g {...common}>
          <circle cx={cx - u * 0.5} cy={cy - u * 0.3} r={u * 0.32} />
          <circle cx={cx + u * 0.5} cy={cy - u * 0.3} r={u * 0.32} />
          <circle cx={cx} cy={cy - u * 0.5} r={u * 0.34} />
          <path d={`M ${cx - u} ${cy + u * 0.75} Q ${cx} ${cy + u * 0.05} ${cx + u} ${cy + u * 0.75}`} />
        </g>
      );
    case "database":
      return (
        <g {...common}>
          <ellipse cx={cx} cy={cy - u * 0.7} rx={u * 0.78} ry={u * 0.28} />
          <path d={`M ${cx - u * 0.78} ${cy - u * 0.7} L ${cx - u * 0.78} ${cy + u * 0.55}`} />
          <path d={`M ${cx + u * 0.78} ${cy - u * 0.7} L ${cx + u * 0.78} ${cy + u * 0.55}`} />
          <path d={`M ${cx - u * 0.78} ${cy + u * 0.55} A ${u * 0.78} ${u * 0.28} 0 0 0 ${cx + u * 0.78} ${cy + u * 0.55}`} />
          <path d={`M ${cx - u * 0.78} ${cy - u * 0.1} A ${u * 0.78} ${u * 0.28} 0 0 0 ${cx + u * 0.78} ${cy - u * 0.1}`} />
        </g>
      );
    case "server":
      return (
        <g {...common}>
          <rect x={cx - u * 0.8} y={cy - u * 0.78} width={u * 1.6} height={u * 0.66} rx={u * 0.12} />
          <rect x={cx - u * 0.8} y={cy + u * 0.12} width={u * 1.6} height={u * 0.66} rx={u * 0.12} />
          <circle cx={cx - u * 0.5} cy={cy - u * 0.45} r={sw * 0.5} fill={color} />
          <circle cx={cx - u * 0.5} cy={cy + u * 0.45} r={sw * 0.5} fill={color} />
        </g>
      );
    case "cloud":
      return (
        <g {...common}>
          <path d={`M ${cx - u * 0.7} ${cy + u * 0.45} A ${u * 0.42} ${u * 0.42} 0 0 1 ${cx - u * 0.55} ${cy - u * 0.35} A ${u * 0.5} ${u * 0.5} 0 0 1 ${cx + u * 0.45} ${cy - u * 0.25} A ${u * 0.4} ${u * 0.4} 0 0 1 ${cx + u * 0.7} ${cy + u * 0.45} Z`} />
        </g>
      );
    case "folder":
      return (
        <g {...common}>
          <path d={`M ${cx - u * 0.85} ${cy - u * 0.55} L ${cx - u * 0.2} ${cy - u * 0.55} L ${cx - u * 0.02} ${cy - u * 0.3} L ${cx + u * 0.85} ${cy - u * 0.3} L ${cx + u * 0.85} ${cy + u * 0.6} L ${cx - u * 0.85} ${cy + u * 0.6} Z`} />
        </g>
      );
    case "shield":
      return (
        <g {...common}>
          <path d={`M ${cx} ${cy - u * 0.85} L ${cx + u * 0.72} ${cy - u * 0.5} L ${cx + u * 0.72} ${cy + u * 0.15} Q ${cx + u * 0.72} ${cy + u * 0.75} ${cx} ${cy + u * 0.9} Q ${cx - u * 0.72} ${cy + u * 0.75} ${cx - u * 0.72} ${cy + u * 0.15} L ${cx - u * 0.72} ${cy - u * 0.5} Z`} />
          <path d={`M ${cx - u * 0.3} ${cy + u * 0.02} L ${cx - u * 0.05} ${cy + u * 0.3} L ${cx + u * 0.38} ${cy - u * 0.32}`} />
        </g>
      );
    case "lock":
      return (
        <g {...common}>
          <rect x={cx - u * 0.62} y={cy - u * 0.1} width={u * 1.24} height={u * 0.95} rx={u * 0.14} />
          <path d={`M ${cx - u * 0.4} ${cy - u * 0.1} L ${cx - u * 0.4} ${cy - u * 0.5} A ${u * 0.4} ${u * 0.4} 0 0 1 ${cx + u * 0.4} ${cy - u * 0.5} L ${cx + u * 0.4} ${cy - u * 0.1}`} />
          <circle cx={cx} cy={cy + u * 0.32} r={sw * 0.7} fill={color} />
        </g>
      );
    case "key":
      return (
        <g {...common}>
          <circle cx={cx - u * 0.45} cy={cy - u * 0.3} r={u * 0.38} />
          <path d={`M ${cx - u * 0.18} ${cy - u * 0.03} L ${cx + u * 0.75} ${cy + u * 0.6}`} />
          <path d={`M ${cx + u * 0.45} ${cy + u * 0.3} L ${cx + u * 0.62} ${cy + u * 0.12}`} />
          <path d={`M ${cx + u * 0.62} ${cy + u * 0.48} L ${cx + u * 0.78} ${cy + u * 0.32}`} />
        </g>
      );
    case "check":
      return <path {...common} d={`M ${cx - u * 0.55} ${cy} L ${cx - u * 0.12} ${cy + u * 0.45} L ${cx + u * 0.62} ${cy - u * 0.45}`} strokeWidth={sw * 1.2} />;
    case "cross":
      return (
        <g {...common} strokeWidth={sw * 1.2}>
          <path d={`M ${cx - u * 0.5} ${cy - u * 0.5} L ${cx + u * 0.5} ${cy + u * 0.5}`} />
          <path d={`M ${cx + u * 0.5} ${cy - u * 0.5} L ${cx - u * 0.5} ${cy + u * 0.5}`} />
        </g>
      );
    case "brain":
      return (
        <g {...common}>
          <path d={`M ${cx} ${cy - u * 0.7} Q ${cx - u * 0.8} ${cy - u * 0.7} ${cx - u * 0.65} ${cy} Q ${cx - u * 0.85} ${cy + u * 0.55} ${cx} ${cy + u * 0.7}`} />
          <path d={`M ${cx} ${cy - u * 0.7} Q ${cx + u * 0.8} ${cy - u * 0.7} ${cx + u * 0.65} ${cy} Q ${cx + u * 0.85} ${cy + u * 0.55} ${cx} ${cy + u * 0.7}`} />
          <path d={`M ${cx} ${cy - u * 0.7} L ${cx} ${cy + u * 0.7}`} strokeWidth={sw * 0.7} />
          <path d={`M ${cx - u * 0.35} ${cy - u * 0.15} Q ${cx - u * 0.1} ${cy} ${cx - u * 0.35} ${cy + u * 0.2}`} strokeWidth={sw * 0.6} />
        </g>
      );
    case "money":
      return (
        <g {...common}>
          <circle cx={cx} cy={cy} r={u * 0.82} />
          <path d={`M ${cx + u * 0.28} ${cy - u * 0.32} Q ${cx - u * 0.32} ${cy - u * 0.45} ${cx - u * 0.32} ${cy - u * 0.08} Q ${cx - u * 0.32} ${cy + u * 0.12} ${cx + u * 0.28} ${cy + u * 0.12} Q ${cx + u * 0.32} ${cy + u * 0.32} ${cx - u * 0.3} ${cy + u * 0.34}`} strokeWidth={sw * 0.85} />
          <path d={`M ${cx} ${cy - u * 0.6} L ${cx} ${cy + u * 0.6}`} strokeWidth={sw * 0.7} />
        </g>
      );
    case "building":
      return (
        <g {...common}>
          <rect x={cx - u * 0.7} y={cy - u * 0.8} width={u * 0.78} height={u * 1.6} />
          <rect x={cx + u * 0.1} y={cy - u * 0.35} width={u * 0.62} height={u * 1.15} />
          {[-0.5, -0.1, 0.3].map((ry, i) => (
            <g key={i}>
              <line x1={cx - u * 0.55} y1={cy + ry * u} x2={cx - u * 0.32} y2={cy + ry * u} strokeWidth={sw * 0.7} />
              <line x1={cx - u * 0.18} y1={cy + ry * u} x2={cx - u * 0.02} y2={cy + ry * u} strokeWidth={sw * 0.7} />
            </g>
          ))}
        </g>
      );
    case "globe":
      return (
        <g {...common}>
          <circle cx={cx} cy={cy} r={u * 0.82} />
          <ellipse cx={cx} cy={cy} rx={u * 0.34} ry={u * 0.82} />
          <line x1={cx - u * 0.82} y1={cy} x2={cx + u * 0.82} y2={cy} strokeWidth={sw * 0.8} />
          <path d={`M ${cx - u * 0.7} ${cy - u * 0.42} Q ${cx} ${cy - u * 0.2} ${cx + u * 0.7} ${cy - u * 0.42}`} strokeWidth={sw * 0.7} />
          <path d={`M ${cx - u * 0.7} ${cy + u * 0.42} Q ${cx} ${cy + u * 0.2} ${cx + u * 0.7} ${cy + u * 0.42}`} strokeWidth={sw * 0.7} />
        </g>
      );
    case "envelope":
      return (
        <g {...common}>
          <rect x={cx - u * 0.85} y={cy - u * 0.6} width={u * 1.7} height={u * 1.2} rx={u * 0.08} />
          <path d={`M ${cx - u * 0.85} ${cy - u * 0.55} L ${cx} ${cy + u * 0.18} L ${cx + u * 0.85} ${cy - u * 0.55}`} />
        </g>
      );
    case "chip":
      return (
        <g {...common}>
          <rect x={cx - u * 0.55} y={cy - u * 0.55} width={u * 1.1} height={u * 1.1} rx={u * 0.1} />
          <rect x={cx - u * 0.25} y={cy - u * 0.25} width={u * 0.5} height={u * 0.5} rx={u * 0.05} />
          {[-0.3, 0, 0.3].map((o, i) => (
            <g key={i} strokeWidth={sw * 0.8}>
              <line x1={cx + o * u} y1={cy - u * 0.85} x2={cx + o * u} y2={cy - u * 0.55} />
              <line x1={cx + o * u} y1={cy + u * 0.55} x2={cx + o * u} y2={cy + u * 0.85} />
              <line x1={cx - u * 0.85} y1={cy + o * u} x2={cx - u * 0.55} y2={cy + o * u} />
              <line x1={cx + u * 0.55} y1={cy + o * u} x2={cx + u * 0.85} y2={cy + o * u} />
            </g>
          ))}
        </g>
      );
    case "flag":
      return (
        <g {...common}>
          <line x1={cx - u * 0.55} y1={cy - u * 0.8} x2={cx - u * 0.55} y2={cy + u * 0.85} />
          <path d={`M ${cx - u * 0.55} ${cy - u * 0.8} L ${cx + u * 0.7} ${cy - u * 0.55} L ${cx + u * 0.2} ${cy - u * 0.2} L ${cx + u * 0.7} ${cy + u * 0.12} L ${cx - u * 0.55} ${cy - u * 0.1} Z`} />
        </g>
      );
    case "star":
      return (
        <path {...common} d={(() => {
          let d = "";
          for (let i = 0; i < 10; i++) {
            const ang = (Math.PI / 5) * i - Math.PI / 2;
            const rad = i % 2 === 0 ? u * 0.85 : u * 0.36;
            d += `${i === 0 ? "M" : "L"} ${cx + Math.cos(ang) * rad} ${cy + Math.sin(ang) * rad} `;
          }
          return d + "Z";
        })()} />
      );
    case "warning":
      return (
        <g {...common}>
          <path d={`M ${cx} ${cy - u * 0.8} L ${cx + u * 0.85} ${cy + u * 0.7} L ${cx - u * 0.85} ${cy + u * 0.7} Z`} />
          <line x1={cx} y1={cy - u * 0.25} x2={cx} y2={cy + u * 0.25} strokeWidth={sw * 1.1} />
          <circle cx={cx} cy={cy + u * 0.52} r={sw * 0.6} fill={color} />
        </g>
      );
    case "gauge":
      return (
        <g {...common}>
          <path d={`M ${cx - u * 0.8} ${cy + u * 0.35} A ${u * 0.8} ${u * 0.8} 0 0 1 ${cx + u * 0.8} ${cy + u * 0.35}`} />
          <line x1={cx} y1={cy + u * 0.35} x2={cx + u * 0.5} y2={cy - u * 0.3} strokeWidth={sw * 1.1} />
          <circle cx={cx} cy={cy + u * 0.35} r={sw * 0.8} fill={color} />
        </g>
      );
    case "rocket":
      return (
        <g {...common}>
          <path d={`M ${cx} ${cy - u * 0.85} Q ${cx + u * 0.45} ${cy - u * 0.2} ${cx + u * 0.3} ${cy + u * 0.5} L ${cx - u * 0.3} ${cy + u * 0.5} Q ${cx - u * 0.45} ${cy - u * 0.2} ${cx} ${cy - u * 0.85} Z`} />
          <circle cx={cx} cy={cy - u * 0.2} r={u * 0.18} />
          <path d={`M ${cx - u * 0.3} ${cy + u * 0.5} L ${cx - u * 0.6} ${cy + u * 0.8} L ${cx - u * 0.18} ${cy + u * 0.55}`} />
          <path d={`M ${cx + u * 0.3} ${cy + u * 0.5} L ${cx + u * 0.6} ${cy + u * 0.8} L ${cx + u * 0.18} ${cy + u * 0.55}`} />
        </g>
      );
    case "handshake":
      return (
        <g {...common}>
          <path d={`M ${cx - u * 0.85} ${cy - u * 0.15} L ${cx - u * 0.35} ${cy - u * 0.15} L ${cx} ${cy + u * 0.15} L ${cx + u * 0.35} ${cy - u * 0.15} L ${cx + u * 0.85} ${cy - u * 0.15}`} />
          <path d={`M ${cx - u * 0.35} ${cy - u * 0.15} L ${cx - u * 0.05} ${cy + u * 0.45} Q ${cx + u * 0.1} ${cy + u * 0.55} ${cx + u * 0.2} ${cy + u * 0.4}`} strokeWidth={sw * 0.85} />
          <path d={`M ${cx - u * 0.85} ${cy + u * 0.45} L ${cx - u * 0.45} ${cy + u * 0.45}`} strokeWidth={sw * 0.85} />
          <path d={`M ${cx + u * 0.85} ${cy + u * 0.45} L ${cx + u * 0.45} ${cy + u * 0.45}`} strokeWidth={sw * 0.85} />
        </g>
      );
    case "chart_up":
      return (
        <g {...common}>
          <line x1={cx - u * 0.7} y1={cy + u * 0.7} x2={cx - u * 0.7} y2={cy - u * 0.5} strokeWidth={sw * 0.8} />
          <line x1={cx - u * 0.7} y1={cy + u * 0.7} x2={cx + u * 0.8} y2={cy + u * 0.7} strokeWidth={sw * 0.8} />
          <rect x={cx - u * 0.45} y={cy + u * 0.2} width={u * 0.28} height={u * 0.5} />
          <rect x={cx - u * 0.02} y={cy - u * 0.05} width={u * 0.28} height={u * 0.75} />
          <rect x={cx + u * 0.4} y={cy - u * 0.35} width={u * 0.28} height={u * 1.05} />
          <path d={`M ${cx - u * 0.4} ${cy} L ${cx + u * 0.1} ${cy - u * 0.4} L ${cx + u * 0.55} ${cy - u * 0.7}`} strokeWidth={sw * 0.9} />
          <path d={`M ${cx + u * 0.25} ${cy - u * 0.72} L ${cx + u * 0.6} ${cy - u * 0.72} L ${cx + u * 0.6} ${cy - u * 0.4}`} strokeWidth={sw * 0.8} />
        </g>
      );
    case "pencil_edit":
      return (
        <g {...common}>
          <path d={`M ${cx - u * 0.75} ${cy - u * 0.7} L ${cx + u * 0.2} ${cy - u * 0.7} L ${cx + u * 0.2} ${cy + u * 0.7} L ${cx - u * 0.75} ${cy + u * 0.7} Z`} />
          <line x1={cx - u * 0.5} y1={cy - u * 0.35} x2={cx - u * 0.05} y2={cy - u * 0.35} strokeWidth={sw * 0.7} />
          <line x1={cx - u * 0.5} y1={cy - u * 0.05} x2={cx - u * 0.05} y2={cy - u * 0.05} strokeWidth={sw * 0.7} />
          <path d={`M ${cx + u * 0.15} ${cy + u * 0.55} L ${cx + u * 0.6} ${cy - u * 0.05} L ${cx + u * 0.82} ${cy + u * 0.15} L ${cx + u * 0.38} ${cy + u * 0.78} Z`} />
          <path d={`M ${cx + u * 0.15} ${cy + u * 0.55} L ${cx + u * 0.1} ${cy + u * 0.82} L ${cx + u * 0.38} ${cy + u * 0.78}`} strokeWidth={sw * 0.8} />
        </g>
      );
    case "clock":
      return (
        <g {...common}>
          <circle cx={cx} cy={cy} r={u * 0.82} />
          <line x1={cx} y1={cy} x2={cx} y2={cy - u * 0.5} strokeWidth={sw * 0.9} />
          <line x1={cx} y1={cy} x2={cx + u * 0.4} y2={cy + u * 0.18} strokeWidth={sw * 0.9} />
        </g>
      );
    case "search":
      return (
        <g {...common}>
          <circle cx={cx - u * 0.18} cy={cy - u * 0.18} r={u * 0.55} />
          <line x1={cx + u * 0.25} y1={cy + u * 0.25} x2={cx + u * 0.75} y2={cy + u * 0.75} strokeWidth={sw * 1.1} />
        </g>
      );
    case "cog_icon":
    default:
      return (
        <g {...common}>
          <circle cx={cx} cy={cy} r={u * 0.42} />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (Math.PI * 2 * i) / 8;
            return <line key={i} x1={cx + Math.cos(a) * u * 0.58} y1={cy + Math.sin(a) * u * 0.58} x2={cx + Math.cos(a) * u * 0.85} y2={cy + Math.sin(a) * u * 0.85} />;
          })}
        </g>
      );
  }
}

function getObjectAccent(objectType: DrawObjectP["object_type"]) {
  const bare = BARE_ICON_ACCENT[objectType];
  if (bare) return bare;
  switch (objectType) {
    case "cell":
    case "triangle":
    case "target":
      return "#2563eb";
    case "network":
    case "checklist":
    case "leaf":
      return "#0f766e";
    case "blockchain":
    case "lightbulb":
      return "#7c3aed";
    case "document":
    case "flask":
      return "#0284c7";
    case "cycle":
      return "#ea580c";
    default:
      return "#dc2626";
  }
}

// ─── Renderers ─────────────────────────────────────────────────────────────────

function DrawText({ id, p }: { id: string; p: DrawTextP }) {
  const [x, y] = p.position ?? [100, 100];
  const s = p.style ?? {};
  const fontSize   = s.fontSize   ?? 22;
  const color      = s.color      ?? "#1a1a1a";
  const fontWeight = s.fontWeight ?? "normal";
  const textAnchor = s.textAnchor ?? "start";
  const titleLike = textAnchor === "middle" && y <= 90;
  const subtitleLike = textAnchor === "middle" && y > 90 && y <= 130;
  const displayFontSize = titleLike ? Math.min(fontSize, 26) : subtitleLike ? Math.min(fontSize, 15) : fontSize;
  const content = String(p.content ?? "");
  // Prefer the explicit fit the backend layout pass assigned (so text wraps to
  // exactly the width/height of its container and never spills); fall back to
  // the anchor-based heuristic only when none was provided.
  const maxWidth = typeof s.maxWidth === "number"
    ? s.maxWidth
    : textAnchor === "middle" ? (titleLike ? 560 : subtitleLike ? 540 : 680) : 720 - x;
  const maxLines = typeof s.maxLines === "number"
    ? s.maxLines
    : titleLike ? 2 : subtitleLike ? 2 : textAnchor === "middle" ? 3 : 4;
  const underlineWidth = titleLike || subtitleLike
    ? Math.min(maxWidth - 24, Math.max(140, estimateTextWidth(content, displayFontSize) + 22))
    : 0;
  const underlineY = y + (titleLike ? displayFontSize * 1.4 : displayFontSize * 1.2);

  return (
    <g key={id} className={pickAnimation(id, ENTRANCE_ANIMATIONS)}>
      {titleLike ? (
        <ellipse cx={x} cy={y + 10} rx={underlineWidth * 0.42} ry={displayFontSize * 0.9} fill={color} fillOpacity={0.08} filter="url(#wb-glow)" className="wb-halo" />
      ) : null}
      {wrapText(content, x, y, maxWidth, displayFontSize, color, fontWeight, textAnchor, maxLines, "wb-write-on")}
      {titleLike ? (
        <g>
          <path
            d={`M ${x - underlineWidth / 2} ${underlineY} Q ${x} ${underlineY + 10} ${x + underlineWidth / 2} ${underlineY}`}
            fill="none"
            stroke={color}
            strokeOpacity={0.24}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={underlineWidth}
            strokeDashoffset={underlineWidth}
            style={{ animation: "wbDrawLine 1s ease forwards", ["--path-len" as string]: underlineWidth }}
          />
          <circle cx={x - underlineWidth / 2 + 10} cy={underlineY} r={3.5} fill={color} fillOpacity={0.42} className="wb-breathe" />
          <circle cx={x + underlineWidth / 2 - 10} cy={underlineY} r={3.5} fill={color} fillOpacity={0.28} className="wb-breathe" style={{ animationDelay: "0.14s" }} />
        </g>
      ) : subtitleLike ? (
        <line
          x1={x - underlineWidth / 2}
          y1={underlineY}
          x2={x + underlineWidth / 2}
          y2={underlineY}
          stroke={color}
          strokeOpacity={0.18}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeDasharray={underlineWidth}
          strokeDashoffset={underlineWidth}
          style={{ animation: "wbDrawLine 0.8s ease forwards", ["--path-len" as string]: underlineWidth }}
        />
      ) : null}
    </g>
  );
}

function DrawRect({ id, p }: { id: string; p: DrawRectP }) {
  const s = p.style ?? {};
  const x = p.x ?? 100;
  const y = p.y ?? 100;
  const w = p.width  ?? 150;
  const h = p.height ?? 60;
  const rx = s.rx ?? 6;
  const accent = s.stroke ?? "#1a1a1a";
  const fill = s.fill === undefined ? "#ffffff" : s.fill;

  // FLAT clean node (architecture-diagram look): just a solid rounded box with a
  // soft shadow — no halo, no inner highlight strip, no accent rail. Title and
  // subtitle are drawn as separate text fragments on top by the template.
  if (s.flat) {
    return (
      <g key={id} className={pickAnimation(id, SHAPE_ANIMATIONS)}>
        <rect
          x={x} y={y} width={w} height={h}
          fill={fill}
          stroke={s.stroke ?? "none"}
          strokeWidth={s.strokeWidth ?? 0}
          rx={rx}
          filter="url(#wb-shadow)"
        />
        {p.label && wrapText(p.label, x + w / 2, y + h / 2 - 4, w - 16, Math.min(15, h * 0.32), "#ffffff", "700", "middle", 2)}
      </g>
    );
  }

  return (
    <g key={id} className={pickAnimation(id, SHAPE_ANIMATIONS)}>
      <ellipse cx={x + w / 2} cy={y + h / 2} rx={Math.max(28, w / 2 + 10)} ry={Math.max(18, h / 2 + 6)} fill={accent} fillOpacity={0.08} filter="url(#wb-glow)" className="wb-halo" />
      <rect
        x={x} y={y} width={w} height={h}
        fill={fill}
        fillOpacity={s.fill === undefined ? 0.9 : undefined}
        stroke={accent}
        strokeWidth={s.strokeWidth ?? 2}
        rx={rx}
        filter="url(#wb-shadow)"
      />
      <rect x={x + 10} y={y + 10} width={4} height={Math.max(0, h - 20)} rx={2} fill={accent} fillOpacity={0.58} />
      <rect
        x={x + 2}
        y={y + 2}
        width={Math.max(0, w - 4)}
        height={Math.max(0, Math.min(18, h * 0.26))}
        rx={Math.max(4, rx - 2)}
        fill="#ffffff"
        fillOpacity={0.14}
      />
      <line x1={x + 18} y1={y + h - 12} x2={x + w - 18} y2={y + h - 12} stroke={accent} strokeOpacity={0.18} strokeWidth={2} strokeLinecap="round" />
      {p.label && wrapText(
        p.label,
        x + w / 2,
        y + h / 2 - 6,
        w - 12,
        Math.min(15, h * 0.32),
        "#1a1a1a",
        "bold",
        "middle",
        Math.max(2, Math.floor((h - 16) / (Math.min(15, h * 0.32) * 1.35))),
      )}
    </g>
  );
}

function DrawCircle({ id, p }: { id: string; p: DrawCircleP }) {
  const [cx, cy] = p.center ?? [200, 200];
  const r  = p.radius ?? 40;
  const s  = p.style  ?? {};
  const label = String(p.label ?? "");
  const fontSize = Math.min(14, Math.max(11, r * 0.38));
  const maxWidth = Math.max(44, r * 1.45);
  const charsPerLine = Math.max(6, Math.floor(maxWidth / (fontSize * 0.54)));
  const words = label.split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > charsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  if (lines.length > 3) {
    lines.length = 3;
    lines[2] = `${lines[2].slice(0, Math.max(0, charsPerLine - 3)).trim()}...`;
  }
  const lineHeight = fontSize * 1.1;
  const startY = cy - ((Math.max(lines.length, 1) - 1) * lineHeight) / 2;
  return (
    <g key={id} className={pickAnimation(id, SHAPE_ANIMATIONS)}>
      <circle
        cx={cx} cy={cy} r={r}
        fill={s.fill ?? "none"}
        stroke={s.stroke ?? "#1a1a1a"}
        strokeWidth={s.strokeWidth ?? 2}
      />
      {p.label && (
        <text x={cx} y={startY} textAnchor="middle"
          fontSize={fontSize} fill="#1a1a1a" fontWeight="bold">
          {lines.map((line, index) => (
            <tspan key={index} x={cx} dy={index === 0 ? 0 : lineHeight}>
              {line}
            </tspan>
          ))}
        </text>
      )}
    </g>
  );
}

function DrawArrow({ id, p }: { id: string; p: DrawArrowP }) {
  const [x1, y1] = p.from ?? [0, 0];
  const [x2, y2] = p.to   ?? [100, 0];
  const s     = p.style ?? {};
  const color = s.color ?? "#1a1a1a";
  const sw    = s.strokeWidth ?? 2;

  const markerMap: Record<string, string> = {
    "#2563eb": "arr-blue",
    "#16a34a": "arr-green",
    "#dc2626": "arr-red",
    "#7c3aed": "arr-purple",
    "#64748b": "arr-gray",
    "#ea580c": "arr-orange",
  };
  const markerId = markerMap[color] ?? "arr-default";
  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  // Dashed connector (architecture-diagram link): a thin dashed line that fades
  // in — the self-draw dashoffset trick can't coexist with a dash pattern.
  if (s.dashed) {
    return (
      <g key={id} className="wb-appear">
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={color}
          strokeWidth={sw}
          markerEnd={`url(#${markerId})`}
          strokeDasharray="6 5"
          strokeLinecap="round"
        />
        {p.label && (
          <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} fontSize={12} fill={color} textAnchor="middle">{p.label}</text>
        )}
      </g>
    );
  }

  return (
    <g key={id}>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth={sw}
        markerEnd={`url(#${markerId})`}
        strokeDasharray={length}
        strokeDashoffset={length}
        strokeLinecap="round"
        style={{
          animation: `wbDrawLine 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
          ["--path-len" as string]: length,
        }}
      />
      {p.label && (
        <text
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2 - 8}
          fontSize={13}
          fill={color}
          textAnchor="middle"
          className="wb-appear"
        >
          {p.label}
        </text>
      )}
    </g>
  );
}

function DrawPath({ id, p }: { id: string; p: DrawPathP }) {
  const pathRef = useRef<SVGPathElement>(null);
  const [dashLen, setDashLen] = useState(3000);
  const [drawn, setDrawn] = useState(false);

  const s = p.style ?? {};
  const fill   = s.fill   ?? "none";
  const stroke = s.stroke ?? "#1a1a1a";
  const isLine = fill === "none";

  useEffect(() => {
    if (!isLine || !pathRef.current) return;
    let len = 3000;
    try {
      const l = pathRef.current.getTotalLength();
      if (l > 0) len = l + 4;
    } catch { /* fallback to default */ }
    setDashLen(len);
    setDrawn(false);
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setDrawn(true))
    );
    return () => cancelAnimationFrame(raf);
  }, [p.d, isLine]);

  if (!isLine) {
    return (
      <path
        key={id}
        d={p.d ?? ""}
        fill={fill}
        stroke={stroke}
        strokeWidth={s.strokeWidth ?? 2}
        strokeLinejoin="round"
        strokeLinecap="round"
        className="wb-appear"
      />
    );
  }

  return (
    <path
      ref={pathRef}
      key={id}
      d={p.d ?? ""}
      fill="none"
      stroke={stroke}
      strokeWidth={s.strokeWidth ?? 2}
      strokeLinejoin="round"
      strokeLinecap="round"
      strokeDasharray={s.dashed ? "7 4" : dashLen}
      strokeDashoffset={s.dashed ? 0 : (drawn ? 0 : dashLen)}
      markerEnd={p.markerEnd ? `url(#${p.markerEnd})` : undefined}
      style={s.dashed ? undefined : { transition: "stroke-dashoffset 1.1s ease" }}
    />
  );
}

function DrawBadge({ id, p }: { id: string; p: DrawBadgeP }) {
  const [x, y] = p.position ?? [100, 100];
  const s      = p.style ?? {};
  const bg     = s.bg     ?? "#2563eb";
  const color  = s.color  ?? "#ffffff";
  const fs     = s.fontSize ?? 15;
  const text   = String(p.content ?? "");
  const displayText = text.length > 42 ? `${text.slice(0, 39)}...` : text;
  const padX   = 12;
  const padY   = 6;
  const estW   = Math.max(60, displayText.length * fs * 0.62 + padX * 2);
  const h      = fs + padY * 2;

  return (
    <g key={id} className={pickAnimation(id, LABEL_ANIMATIONS)}>
      <ellipse cx={x + estW / 2} cy={y + h / 2} rx={estW / 2 + 10} ry={h / 2 + 6} fill={bg} fillOpacity={0.18} filter="url(#wb-glow)" className="wb-halo" />
      <rect x={x} y={y} width={estW} height={h} rx={h / 2} fill={bg} filter="url(#wb-shadow)" />
      <circle cx={x + 13} cy={y + h / 2} r={4.2} fill="#ffffff" fillOpacity={0.82} />
      <rect x={x + 2} y={y + 2} width={estW - 4} height={Math.max(0, h / 2 - 3)} rx={Math.max(6, h / 2 - 4)} fill="#ffffff" fillOpacity={0.12} />
      <text
        x={x + estW / 2 + 5}
        y={y + h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fs}
        fontWeight="bold"
        fill={color}
        letterSpacing="0.5"
      >
        {displayText}
      </text>
    </g>
  );
}

function DrawCallout({ id, p }: { id: string; p: DrawCalloutP }) {
  const [x, y] = p.position ?? [100, 100];
  const w      = p.width ?? 260;
  const s      = p.style ?? {};
  const bg     = s.bg     ?? "#fef9c3";
  const stroke = s.stroke ?? "#fbbf24";
  const color  = s.color  ?? "#78350f";
  const text   = String(p.content ?? "");
  const fs     = 16;
  const padX   = 14;
  const padY   = 12;
  const tailH  = 14;
  const innerW = w - padX * 2;
  const charsPerLine = Math.max(10, Math.floor(innerW / (fs * 0.58)));
  const words  = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const t = cur ? `${cur} ${word}` : word;
    if (t.length > charsPerLine && cur) { lines.push(cur); cur = word; }
    else cur = t;
  }
  if (cur) lines.push(cur);
  // Cap lines so the callout box never overflows the 500px canvas height
  const availableH = Math.max(60, 490 - y);
  const MAX_CALLOUT_LINES = Math.min(5, Math.max(1, Math.floor((availableH - padY * 2) / (fs * 1.4))));
  if (lines.length > MAX_CALLOUT_LINES) {
    lines.length = MAX_CALLOUT_LINES;
    lines[MAX_CALLOUT_LINES - 1] = lines[MAX_CALLOUT_LINES - 1].slice(0, charsPerLine - 3).trim() + '...';
  }
  const boxH = padY * 2 + lines.length * (fs * 1.4);
  const headerRuleWidth = Math.min(w - 56, Math.max(92, w * 0.44));

  return (
    <g key={id} className={pickAnimation(id, LABEL_ANIMATIONS)}>
      <ellipse cx={x + w / 2} cy={y + boxH / 2} rx={Math.max(40, w / 2 + 8)} ry={Math.max(22, boxH / 2 + 4)} fill={stroke} fillOpacity={0.1} filter="url(#wb-glow)" className="wb-halo" />
      {/* Box */}
      <rect x={x} y={y} width={w} height={boxH} rx={12} fill={bg} stroke={stroke} strokeWidth={1.6} filter="url(#wb-shadow)" />
      <rect x={x + 10} y={y + 10} width={4} height={Math.max(10, boxH - 20)} rx={2} fill={stroke} fillOpacity={0.72} />
      <circle cx={x + 22} cy={y + 16} r={4.6} fill={stroke} fillOpacity={0.82} />
      <line x1={x + 34} y1={y + 16} x2={x + 34 + headerRuleWidth} y2={y + 16} stroke={stroke} strokeOpacity={0.2} strokeWidth={2.2} strokeLinecap="round" />
      {/* Tail triangle pointing down-left */}
      <polygon
        points={`${x + 20},${y + boxH} ${x + 36},${y + boxH} ${x + 22},${y + boxH + tailH}`}
        fill={bg}
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* Text lines */}
      {lines.map((line, i) => (
        <text
          key={i}
          x={x + padX}
          y={y + padY + (i + 1) * fs * 1.4 - fs * 0.2}
          fontSize={fs}
          fill={color}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function DrawLine({ id, p }: { id: string; p: DrawLineP }) {
  const [x1, y1] = p.from ?? [0, 0];
  const [x2, y2] = p.to   ?? [100, 0];
  const s = p.style ?? {};
  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  return (
    <line
      key={id}
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={s.color ?? "#94a3b8"}
      strokeWidth={s.strokeWidth ?? 1.5}
      strokeDasharray={s.dashed ? "6 4" : `${length}`}
      strokeDashoffset={s.dashed ? 0 : length}
      strokeLinecap="round"
      style={s.dashed ? { animation: "fadeInUp 0.3s ease forwards" } : { animation: "wbDrawLine 0.5s ease forwards" }}
    />
  );
}

function ShowEquation({ id, p }: { id: string; p: ShowEquationP }) {
  const [x, y] = p.position ?? [400, 250];
  const s = p.style ?? {};
  const fs    = s.fontSize ?? 26;
  const color = s.color    ?? "#7c3aed";
  const text  = String(p.latex ?? "");

  // Render equation with a pill background
  const estW = Math.max(80, text.length * fs * 0.62 + 24);
  const h    = fs + 20;

  return (
    <g key={id} className="wb-expand">
      <ellipse cx={x} cy={y} rx={estW / 2 + 14} ry={h / 2 + 8} fill={color} fillOpacity={0.12} filter="url(#wb-glow)" className="wb-halo" />
      <rect x={x - estW / 2 - 2} y={y - h / 2} width={estW + 4} height={h}
        rx={6} fill="#f5f3ff" stroke={color} strokeWidth={1.5} />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
        fontSize={fs} fill={color} fontStyle="italic" fontWeight="bold">
        {text}
      </text>
    </g>
  );
}

function DrawGraph({ id, p }: { id: string; p: DrawGraphP }) {
  const [ox, oy] = p.position ?? [80, 80];
  const [w,  h ] = p.size     ?? [300, 200];
  const values   = p.data?.values ?? [];
  const labels   = p.data?.labels ?? values.map((_, i) => String(i + 1));
  const maxVal   = Math.max(...values, 1);
  const panelX = ox - 18;
  const panelY = oy - 28;
  const panelW = w + 36;
  const panelH = h + 54;

  if (!values.length) return null;

  if (p.graph_type === "bar" || !p.graph_type) {
    const barW = Math.max(8, (w - 20) / (values.length || 1) - 6);
    const colors = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316"];
    return (
      <g key={id} className="wb-scale">
        <ellipse cx={ox + w / 2} cy={oy + h / 2} rx={w / 2 + 26} ry={h / 2 + 18} fill="#93c5fd" fillOpacity={0.1} filter="url(#wb-glow)" className="wb-halo" />
        <rect x={panelX} y={panelY} width={panelW} height={panelH} rx={22} fill="url(#wb-panel-fill)" stroke="#cbd5e1" strokeWidth={1.4} filter="url(#wb-shadow)" />
        <rect x={panelX + 12} y={panelY + 10} width={Math.max(24, panelW - 24)} height={6} rx={3} fill="#60a5fa" fillOpacity={0.14} />
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line key={ratio} x1={ox} y1={oy + h - h * ratio} x2={ox + w} y2={oy + h - h * ratio} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="6 6" />
        ))}
        <line x1={ox} y1={oy} x2={ox} y2={oy + h} stroke="#475569" strokeWidth={1.5} />
        <line x1={ox} y1={oy + h} x2={ox + w} y2={oy + h} stroke="#475569" strokeWidth={1.5} />
        {p.title && (
          <text x={ox + w / 2} y={oy - 12} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#1e3a5f">
            {p.title}
          </text>
        )}
        {values.map((v, i) => {
          const barH = (v / maxVal) * (h - 20);
          const bx   = ox + 10 + i * (barW + 6);
          const by   = oy + h - barH;
          const col  = colors[i % colors.length];
          return (
            <g key={i}>
              <ellipse cx={bx + barW / 2} cy={by + barH / 2} rx={Math.max(8, barW * 0.8)} ry={Math.max(12, barH / 2 + 8)} fill={col} fillOpacity={0.12} filter="url(#wb-glow)" className="wb-halo" />
              <rect x={bx} y={by} width={barW} height={barH} fill={col} opacity={0.85} rx={3}
                style={{ animation: `wbBarGrow 0.5s ${i * 0.08}s ease both` }}
              />
              <rect x={bx + 2} y={by + 2} width={Math.max(0, barW - 4)} height={Math.max(0, Math.min(14, barH * 0.24))} fill="#ffffff" fillOpacity={0.18} rx={3} />
              <text x={bx + barW / 2} y={oy + h + 15} textAnchor="middle" fontSize={11} fill="#475569">{labels[i]}</text>
              <text x={bx + barW / 2} y={by - 4}       textAnchor="middle" fontSize={11} fill={col}>{v}</text>
            </g>
          );
        })}
      </g>
    );
  }

  if (p.graph_type === "line") {
    const pointPairs = values.map((v, i) => {
      const px = ox + 10 + (i / Math.max(values.length - 1, 1)) * (w - 20);
      const py = oy + h - (v / maxVal) * (h - 20);
      return [px, py] as const;
    });
    const plotPath = pointPairs.length
      ? `M ${pointPairs.map(([px, py]) => `${px} ${py}`).join(" L ")}`
      : "";
    const areaPath = pointPairs.length
      ? `${plotPath} L ${ox + w - 10} ${oy + h} L ${ox + 10} ${oy + h} Z`
      : "";
    const pathLength = Math.max(420, Math.round(w + h + pointPairs.length * 18));

    return (
      <g key={id} className="wb-scale">
        <ellipse cx={ox + w / 2} cy={oy + h / 2} rx={w / 2 + 28} ry={h / 2 + 18} fill="#93c5fd" fillOpacity={0.1} filter="url(#wb-glow)" className="wb-halo" />
        <rect x={panelX} y={panelY} width={panelW} height={panelH} rx={22} fill="url(#wb-panel-fill)" stroke="#cbd5e1" strokeWidth={1.4} filter="url(#wb-shadow)" />
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line key={ratio} x1={ox} y1={oy + h - h * ratio} x2={ox + w} y2={oy + h - h * ratio} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="6 6" />
        ))}
        <line x1={ox} y1={oy} x2={ox} y2={oy + h} stroke="#475569" strokeWidth={1.5} />
        <line x1={ox} y1={oy + h} x2={ox + w} y2={oy + h} stroke="#475569" strokeWidth={1.5} />
        {p.title && (
          <text x={ox + w / 2} y={oy - 12} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#1e3a5f">
            {p.title}
          </text>
        )}
        {areaPath ? <path d={areaPath} fill="#bfdbfe" fillOpacity={0.22} /> : null}
        {plotPath ? (
          <path
            d={plotPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2.8}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={pathLength}
            strokeDashoffset={pathLength}
            style={{ animation: "wbDrawLine 1.15s ease forwards", ["--path-len" as string]: pathLength }}
          />
        ) : null}
        {pointPairs.map(([px, py], i) => {
          return (
            <g key={i}>
              <circle cx={px} cy={py} r={8} fill="#60a5fa" fillOpacity={0.16} filter="url(#wb-glow)" className="wb-halo" style={{ animationDelay: `${i * 0.1}s` }} />
              <circle cx={px} cy={py} r={4} fill="#3b82f6" />
              <text x={px} y={oy + h + 15} textAnchor="middle" fontSize={11} fill="#475569">{labels[i]}</text>
            </g>
          );
        })}
      </g>
    );
  }

  return null;
}

// ─── DrawCoordinateSystem ─────────────────────────────────────────────────────

function DrawCoordinateSystem({ id, p }: { id: string; p: DrawCoordinateSystemP }) {
  const [ox, oy] = p.origin ?? [100, 350];
  const [w,  h ] = p.size   ?? [300, 240];
  const xLabel = p.x_label ?? "x";
  const yLabel = p.y_label ?? "y";
  const pts    = p.plot_points ?? [];

  const tickCount = 5;
  const tickLen   = 6;
  const dx = w / tickCount;
  const dy = h / tickCount;

  // Scale plot_points to canvas: assumes x ∈ [-tickCount,tickCount], y same
  const scaleX = (v: number) => ox + (v / tickCount) * (w / 2);
  const scaleY = (v: number) => oy - (v / tickCount) * (h / 2);

  const polyline = pts.length > 1
    ? pts.map(([x, y]) => `${scaleX(x)},${scaleY(y)}`).join(" ")
    : "";
  const plotPath = polyline ? `M ${polyline.replace(/,/g, " ").replace(/\s+/g, " ").trim().replace(/ /g, (match, index, source) => ((index / 2) % 2 === 0 ? " " : " L "))}` : "";
  const pathLength = Math.max(420, Math.round(w + h + pts.length * 18));
  const panelX = ox - 24;
  const panelY = oy - h - 28;
  const panelW = w + 42;
  const panelH = h + 48;

  return (
    <g key={id} className="wb-scale">
      <ellipse cx={ox + w / 2 - 10} cy={oy - h / 2 + 10} rx={w / 2 + 34} ry={h / 2 + 24} fill="#93c5fd" fillOpacity={0.1} filter="url(#wb-glow)" className="wb-halo" />
      <rect x={panelX} y={panelY} width={panelW} height={panelH} rx={24} fill="url(#wb-panel-fill)" stroke="#cbd5e1" strokeWidth={1.4} filter="url(#wb-shadow)" />
      {Array.from({ length: tickCount * 2 + 1 }, (_, index) => index - tickCount).map((value) => (
        <line key={`gx${value}`} x1={scaleX(value)} y1={oy - h} x2={scaleX(value)} y2={oy} stroke="#dbeafe" strokeWidth={value === 0 ? 0 : 1} strokeDasharray="5 7" />
      ))}
      {Array.from({ length: tickCount * 2 + 1 }, (_, index) => index - tickCount).map((value) => (
        <line key={`gy${value}`} x1={ox} y1={scaleY(value)} x2={ox + w} y2={scaleY(value)} stroke="#dbeafe" strokeWidth={value === 0 ? 0 : 1} strokeDasharray="5 7" />
      ))}
      {/* Y axis */}
      <line x1={ox} y1={oy - h} x2={ox} y2={oy + 10} stroke="#475569" strokeWidth={1.8} markerEnd="url(#arr-gray)" />
      {/* X axis */}
      <line x1={ox - 10} y1={oy} x2={ox + w} y2={oy} stroke="#475569" strokeWidth={1.8} markerEnd="url(#arr-gray)" />
      {/* Axis labels */}
      <text x={ox + w + 8} y={oy + 4} fontSize={14} fill="#475569" fontStyle="italic">{xLabel}</text>
      <text x={ox - 6} y={oy - h - 8} fontSize={14} fill="#475569" fontStyle="italic" textAnchor="middle">{yLabel}</text>
      {/* X ticks */}
      {Array.from({ length: tickCount }, (_, i) => i + 1).map((i) => (
        <g key={`xt${i}`}>
          <line x1={ox + i * dx} y1={oy - tickLen} x2={ox + i * dx} y2={oy + tickLen} stroke="#94a3b8" strokeWidth={1} />
          <text x={ox + i * dx} y={oy + 18} textAnchor="middle" fontSize={11} fill="#94a3b8">{i}</text>
        </g>
      ))}
      {/* Y ticks */}
      {Array.from({ length: tickCount }, (_, i) => i + 1).map((i) => (
        <g key={`yt${i}`}>
          <line x1={ox - tickLen} y1={oy - i * dy} x2={ox + tickLen} y2={oy - i * dy} stroke="#94a3b8" strokeWidth={1} />
          <text x={ox - 12} y={oy - i * dy + 4} textAnchor="end" fontSize={11} fill="#94a3b8">{i}</text>
        </g>
      ))}
      {/* Plot curve */}
      {plotPath && (
        <path
          d={plotPath}
          fill="none"
          stroke="#2563eb"
          strokeWidth={2.8}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength}
          style={{ animation: "wbDrawLine 1.2s ease forwards", ["--path-len" as string]: pathLength }}
        />
      )}
      {/* Plot points */}
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={scaleX(x)} cy={scaleY(y)} r={8} fill="#60a5fa" fillOpacity={0.16} filter="url(#wb-glow)" className="wb-halo" style={{ animationDelay: `${i * 0.1}s` }} />
          <circle cx={scaleX(x)} cy={scaleY(y)} r={4} fill="#2563eb" />
        </g>
      ))}
    </g>
  );
}

// ─── DrawPhysicsShape ─────────────────────────────────────────────────────────

function DrawPhysicsShape({ id, p }: { id: string; p: DrawPhysicsShapeP }) {
  // Use wb-expand for a revealing entrance instead of generic scale
  const [px, py] = p.position ?? [200, 200];
  const [pw, ph] = p.size ?? [120, 100];
  const label = p.label ?? "";
  const annotations = p.annotations ?? [];
  const ac = "#475569"; // annotation color
  const accent = getPhysicsAccent(p.shape_type);
  const labelTop = py < 170 ? Math.max(16, py - 46) : py - 44;
  const annotationWidth = 160;
  const annotationX = px + pw + 12 > 800 - annotationWidth - 14 ? px - annotationWidth - 12 : px + pw + 12;
  const annotationY = py < 170 ? py + 8 : py + 12;

  let shape: React.ReactNode = null;

  switch (p.shape_type) {
    case "spring": {
      const segments = 8;
      const coilW = pw * 0.4;
      const dy = ph / (segments * 2);
      let d = `M ${px} ${py}`;
      for (let i = 0; i < segments; i++) {
        const sign = i % 2 === 0 ? 1 : -1;
        d += ` L ${px + sign * coilW} ${py + (i * 2 + 1) * dy}`;
        d += ` L ${px} ${py + (i * 2 + 2) * dy}`;
      }
      shape = <path d={d} fill="none" stroke="#f59e0b" strokeWidth={2.5} strokeLinecap="round" />;
      break;
    }
    case "pendulum": {
      const pivotX = px + pw / 2;
      const pivotY = py;
      const bobX = px + pw * 0.75;
      const bobY = py + ph;
      shape = (
        <g>
          <line x1={pivotX - 15} y1={pivotY} x2={pivotX + 15} y2={pivotY} stroke={ac} strokeWidth={3} />
          <line x1={pivotX} y1={pivotY} x2={bobX} y2={bobY} stroke={ac} strokeWidth={1.8} />
          <circle cx={bobX} cy={bobY} r={14} fill="#3b82f6" stroke="#1d4ed8" strokeWidth={2} />
        </g>
      );
      break;
    }
    case "inclined_plane": {
      shape = (
        <g>
          <polygon points={`${px},${py + ph} ${px + pw},${py + ph} ${px + pw},${py}`}
            fill="#e2e8f0" stroke={ac} strokeWidth={2} />
          <rect x={px + pw - 30} y={py + 4} width={22} height={22} fill="#3b82f6" stroke="#1d4ed8" strokeWidth={1.5} rx={2} />
        </g>
      );
      break;
    }
    case "free_body": {
      const cx = px + pw / 2;
      const cy = py + ph / 2;
      shape = (
        <g>
          <rect x={cx - 22} y={cy - 22} width={44} height={44} fill="#dbeafe" stroke="#3b82f6" strokeWidth={2} rx={4} />
          {/* Up: Normal force */}
          <line x1={cx} y1={cy - 22} x2={cx} y2={cy - 65} stroke="#16a34a" strokeWidth={2.2} markerEnd="url(#arr-green)" />
          <text x={cx + 6} y={cy - 45} fontSize={12} fill="#16a34a">N</text>
          {/* Down: gravity */}
          <line x1={cx} y1={cy + 22} x2={cx} y2={cy + 65} stroke="#dc2626" strokeWidth={2.2} markerEnd="url(#arr-red)" />
          <text x={cx + 6} y={cy + 52} fontSize={12} fill="#dc2626">mg</text>
          {/* Right: applied */}
          <line x1={cx + 22} y1={cy} x2={cx + 65} y2={cy} stroke="#2563eb" strokeWidth={2.2} markerEnd="url(#arr-blue)" />
          <text x={cx + 44} y={cy - 6} fontSize={12} fill="#2563eb">F</text>
        </g>
      );
      break;
    }
    case "wave": {
      const waveW = pw;
      const amp   = ph / 4;
      const periods = 3;
      let d = `M ${px} ${py + ph / 2}`;
      for (let i = 0; i <= waveW; i += 4) {
        const y = py + ph / 2 - amp * Math.sin((i / waveW) * Math.PI * 2 * periods);
        d += ` L ${px + i} ${y}`;
      }
      shape = <path d={d} fill="none" stroke="#7c3aed" strokeWidth={2.5} strokeLinecap="round" />;
      break;
    }
    case "bottle": {
      const neckW = pw * 0.28;
      const bodyW = pw * 0.58;
      const left = px + (pw - bodyW) / 2;
      const neckLeft = px + (pw - neckW) / 2;
      const bodyTop = py + ph * 0.24;
      shape = (
        <g>
          <path
            d={`M ${neckLeft} ${py + 6} L ${neckLeft} ${bodyTop} Q ${neckLeft} ${bodyTop + 6} ${left} ${bodyTop + 18} L ${left} ${py + ph - 12} Q ${left} ${py + ph} ${left + 12} ${py + ph} L ${left + bodyW - 12} ${py + ph} Q ${left + bodyW} ${py + ph} ${left + bodyW} ${py + ph - 12} L ${left + bodyW} ${bodyTop + 18} Q ${neckLeft + neckW} ${bodyTop + 6} ${neckLeft + neckW} ${bodyTop} L ${neckLeft + neckW} ${py + 6}`}
            fill="#e0f2fe"
            stroke="#0284c7"
            strokeWidth={2.2}
            strokeLinejoin="round"
          />
          <path d={`M ${neckLeft} ${py + 22} L ${neckLeft + neckW} ${py + 22}`} stroke="#0284c7" strokeWidth={2.2} strokeLinecap="round" />
        </g>
      );
      break;
    }
    case "box_on_surface":
    default: {
      shape = (
        <g>
          <rect x={px} y={py + ph - 28} width={pw} height={6} fill="#94a3b8" rx={2} />
          <rect x={px + pw / 2 - 20} y={py + ph - 28 - 36} width={40} height={36} fill="#dbeafe" stroke="#3b82f6" strokeWidth={2} rx={3} />
        </g>
      );
    }
  }

  return (
    <g key={id} className="wb-expand">
      <ellipse cx={px + pw / 2} cy={py + ph / 2} rx={pw * 0.44} ry={ph * 0.36} fill={accent} fillOpacity={0.12} filter="url(#wb-glow)" className="wb-halo" />
      <rect x={px + 6} y={py + 10} width={Math.max(0, pw - 12)} height={Math.max(0, ph - 20)} rx={24} fill="url(#wb-panel-fill)" fillOpacity={0.92} stroke={accent} strokeOpacity={0.18} strokeWidth={1.4} filter="url(#wb-shadow)" />
      <rect x={px + 18} y={py + 18} width={Math.max(18, pw - 36)} height={8} rx={4} fill="#ffffff" fillOpacity={0.2} />
      <g className="wb-figure-build"><g className="wb-drift">{shape}</g></g>
      {label ? renderLabelCapsule(`${id}-label`, label, px + pw / 2, labelTop, Math.max(140, Math.min(pw + 28, 240)), accent) : null}
      {renderAnnotationCards(`${id}-annotation`, annotations, annotationX, annotationY, annotationWidth, accent)}
    </g>
  );
}

function DrawObject({ id, p }: { id: string; p: DrawObjectP }) {
  const [px, py] = p.position ?? [140, 120];
  const [pw, ph] = p.size ?? [220, 180];
  const label = p.label ?? "";
  const annotations = p.annotations ?? [];
  const accent = p.accent || getObjectAccent(p.object_type);
  const labelTop = py < 170 ? Math.max(16, py - 46) : py - 44;
  const annotationWidth = 160;
  const annotationX = px + pw + 12 > 800 - annotationWidth - 14 ? px - annotationWidth - 12 : px + pw + 12;
  const annotationY = py < 170 ? py + 8 : py + 12;

  // ── Bare line-art icon: clean colored ring, no heavy panel (flow-diagram look) ──
  if (BARE_ICONS.has(p.object_type)) {
    const cx = px + pw / 2;
    const cy = py + ph / 2;
    const R = Math.max(24, Math.min(pw, ph) / 2 - 4);
    const circ = 2 * Math.PI * R;
    return (
      <g key={id} className="wb-pop">
        <circle cx={cx} cy={cy} r={R + 7} fill={accent} fillOpacity={0.06} className="wb-halo" />
        <circle cx={cx} cy={cy} r={R} fill="#ffffff" />
        <circle
          cx={cx} cy={cy} r={R}
          fill="none" stroke={accent} strokeWidth={3.4} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ}
          style={{ animation: "wbDrawLine 0.85s cubic-bezier(0.4,0,0.2,1) forwards", ["--path-len" as string]: circ }}
        />
        <g className="wb-figure-build">{bareIcon(p.object_type, cx, cy, R, accent)}</g>
        {label ? renderLabelCapsule(`${id}-label`, label, cx, cy + R + 22, Math.max(120, Math.min(pw + 40, 220)), accent) : null}
      </g>
    );
  }

  let objectShape: React.ReactNode = null;

  switch (p.object_type) {
    case "cell": {
      const cx = px + pw / 2;
      const cy = py + ph / 2;
      const rx = pw * 0.36;
      const ry = ph * 0.36;
      objectShape = (
        <g>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#dbeafe" stroke="#2563eb" strokeWidth={2.5} />
          <ellipse cx={cx} cy={cy} rx={pw * 0.16} ry={ph * 0.16} fill="#bfdbfe" stroke="#1d4ed8" strokeWidth={2} />
          <path d={`M ${cx - 20} ${cy - 18} L ${cx + 18} ${cy + 18}`} stroke="#7c3aed" strokeWidth={3} strokeLinecap="round" />
          <path d={`M ${cx + 18} ${cy - 18} L ${cx - 20} ${cy + 18}`} stroke="#7c3aed" strokeWidth={3} strokeLinecap="round" />
          <line x1={px + 18} y1={cy - 50} x2={cx - 26} y2={cy - 12} stroke="#16a34a" strokeWidth={2} />
          <line x1={px + pw - 18} y1={cy + 50} x2={cx + 26} y2={cy + 12} stroke="#16a34a" strokeWidth={2} />
        </g>
      );
      break;
    }
    case "network": {
      const nodes = [
        { x: px + 28, y: py + 40 },
        { x: px + pw - 34, y: py + 34 },
        { x: px + 40, y: py + ph - 30 },
        { x: px + pw - 42, y: py + ph - 36 },
        { x: px + pw / 2, y: py + ph / 2 },
      ];
      objectShape = (
        <g>
          {[[0, 4], [1, 4], [2, 4], [3, 4], [0, 2], [1, 3]].map(([a, b], index) => (
            <line
              key={index}
              x1={nodes[a].x}
              y1={nodes[a].y}
              x2={nodes[b].x}
              y2={nodes[b].y}
              stroke="#0f766e"
              strokeWidth={2}
            />
          ))}
          {nodes.map((node, index) => (
            <circle key={index} cx={node.x} cy={node.y} r={index === 4 ? 15 : 11} fill={index === 4 ? "#99f6e4" : "#ccfbf1"} stroke="#0f766e" strokeWidth={2} />
          ))}
        </g>
      );
      break;
    }
    case "blockchain": {
      const blockW = pw * 0.28;
      const blockH = ph * 0.2;
      const blocks = [
        { x: px + 24, y: py + 34 },
        { x: px + pw * 0.36, y: py + ph * 0.34 },
        { x: px + pw * 0.63, y: py + ph * 0.18 },
      ];
      objectShape = (
        <g>
          {blocks.map((block, index) => (
            <g key={index}>
              <rect x={block.x} y={block.y} width={blockW} height={blockH} fill="#e0e7ff" stroke="#4f46e5" strokeWidth={2} rx={8} />
              <rect x={block.x + 12} y={block.y + 12} width={blockW - 24} height={8} fill="#c7d2fe" rx={4} />
            </g>
          ))}
          <line x1={blocks[0].x + blockW} y1={blocks[0].y + blockH / 2} x2={blocks[1].x} y2={blocks[1].y + blockH / 2} stroke="#4f46e5" strokeWidth={2.5} />
          <line x1={blocks[1].x + blockW} y1={blocks[1].y + blockH / 2} x2={blocks[2].x} y2={blocks[2].y + blockH / 2} stroke="#4f46e5" strokeWidth={2.5} />
          <circle cx={blocks[1].x - 9} cy={blocks[1].y + blockH / 2} r={8} fill="#eef2ff" stroke="#4f46e5" strokeWidth={2} />
          <circle cx={blocks[1].x + blockW + 9} cy={blocks[1].y + blockH / 2} r={8} fill="#eef2ff" stroke="#4f46e5" strokeWidth={2} />
        </g>
      );
      break;
    }
    case "cycle": {
      const cx = px + pw / 2;
      const cy = py + ph / 2;
      objectShape = (
        <g>
          <path d={`M ${cx - 70} ${cy + 10} A 80 80 0 0 1 ${cx} ${cy - 75}`} fill="none" stroke="#2563eb" strokeWidth={3} markerEnd="url(#arr-blue)" />
          <path d={`M ${cx + 10} ${cy - 72} A 80 80 0 0 1 ${cx + 72} ${cy + 18}`} fill="none" stroke="#16a34a" strokeWidth={3} markerEnd="url(#arr-green)" />
          <path d={`M ${cx + 62} ${cy + 32} A 80 80 0 0 1 ${cx - 62} ${cy + 46}`} fill="none" stroke="#ea580c" strokeWidth={3} markerEnd="url(#arr-orange)" />
          <circle cx={cx} cy={cy} r={24} fill="#ffffff" stroke="#94a3b8" strokeWidth={2} />
        </g>
      );
      break;
    }
    case "document": {
      const left = px + 34;
      const top = py + 18;
      const docW = pw * 0.56;
      const docH = ph * 0.72;
      objectShape = (
        <g>
          <path
            d={`M ${left} ${top} L ${left + docW - 26} ${top} L ${left + docW} ${top + 24} L ${left + docW} ${top + docH} L ${left} ${top + docH} Z`}
            fill="#f8fafc"
            stroke="#2563eb"
            strokeWidth={2.2}
            strokeLinejoin="round"
          />
          <path d={`M ${left + docW - 26} ${top} L ${left + docW - 26} ${top + 24} L ${left + docW} ${top + 24}`} fill="#dbeafe" stroke="#2563eb" strokeWidth={2.2} strokeLinejoin="round" />
          {Array.from({ length: 5 }, (_, index) => (
            <line key={index} x1={left + 18} y1={top + 26 + index * 22} x2={left + docW - 18} y2={top + 26 + index * 22} stroke="#93c5fd" strokeWidth={3} strokeLinecap="round" />
          ))}
          <circle cx={left + docW + 36} cy={top + 34} r={18} fill="#dcfce7" stroke="#16a34a" strokeWidth={2} />
          <path d={`M ${left + docW + 28} ${top + 34} l6 6 l10 -12`} fill="none" stroke="#16a34a" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
      break;
    }
    case "book": {
      const left = px + 26;
      const top = py + 24;
      const bookW = pw * 0.68;
      const bookH = ph * 0.68;
      objectShape = (
        <g>
          <path d={`M ${left + bookW / 2} ${top + 6} C ${left + bookW / 2 - 28} ${top - 6}, ${left + 26} ${top + 2}, ${left + 18} ${top + 34} L ${left + 18} ${top + bookH} C ${left + 48} ${top + bookH - 14}, ${left + bookW / 2 - 20} ${top + bookH - 10}, ${left + bookW / 2} ${top + bookH} Z`} fill="#eff6ff" stroke="#2563eb" strokeWidth={2.2} strokeLinejoin="round" />
          <path d={`M ${left + bookW / 2} ${top + 6} C ${left + bookW / 2 + 28} ${top - 6}, ${left + bookW - 26} ${top + 2}, ${left + bookW - 18} ${top + 34} L ${left + bookW - 18} ${top + bookH} C ${left + bookW - 48} ${top + bookH - 14}, ${left + bookW / 2 + 20} ${top + bookH - 10}, ${left + bookW / 2} ${top + bookH} Z`} fill="#dbeafe" stroke="#2563eb" strokeWidth={2.2} strokeLinejoin="round" />
          <line x1={left + bookW / 2} y1={top + 8} x2={left + bookW / 2} y2={top + bookH - 4} stroke="#1d4ed8" strokeWidth={2} />
          {Array.from({ length: 4 }, (_, index) => (
            <line key={index} x1={left + 36} y1={top + 28 + index * 20} x2={left + bookW - 36} y2={top + 28 + index * 20} stroke="#93c5fd" strokeWidth={3} strokeLinecap="round" />
          ))}
        </g>
      );
      break;
    }
    case "checklist": {
      const cardX = px + 30;
      const cardY = py + 18;
      const cardW = pw * 0.62;
      const cardH = ph * 0.74;
      objectShape = (
        <g>
          <rect x={cardX} y={cardY} width={cardW} height={cardH} rx={18} fill="#f8fafc" stroke="#0f766e" strokeWidth={2.2} />
          <rect x={cardX + cardW * 0.32} y={cardY - 10} width={cardW * 0.36} height={18} rx={9} fill="#ccfbf1" stroke="#0f766e" strokeWidth={1.8} />
          {Array.from({ length: 4 }, (_, index) => (
            <g key={index}>
              <rect x={cardX + 18} y={cardY + 22 + index * 32} width={14} height={14} rx={4} fill="#ecfeff" stroke="#0f766e" strokeWidth={1.8} />
              <path d={`M ${cardX + 22} ${cardY + 30 + index * 32} l5 5 l9 -10`} fill="none" stroke="#16a34a" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
              <line x1={cardX + 44} y1={cardY + 29 + index * 32} x2={cardX + cardW - 18} y2={cardY + 29 + index * 32} stroke="#99f6e4" strokeWidth={4} strokeLinecap="round" />
            </g>
          ))}
        </g>
      );
      break;
    }
    case "dialogue": {
      const bubbleW = pw * 0.52;
      const bubbleH = ph * 0.3;
      const leftX = px + 18;
      const rightX = px + pw - bubbleW - 18;
      const topY = py + 38;
      const bottomY = py + ph * 0.46;
      objectShape = (
        <g>
          <g className="wb-sway">
            <rect x={leftX} y={topY} width={bubbleW} height={bubbleH} rx={20} fill="#eff6ff" stroke="#2563eb" strokeWidth={2.2} />
            <path d={`M ${leftX + 36} ${topY + bubbleH} l-10 18 l24 -14`} fill="#eff6ff" stroke="#2563eb" strokeWidth={2.2} strokeLinejoin="round" />
            <circle cx={leftX + 34} cy={topY + bubbleH / 2} r={4} fill="#60a5fa" />
            <circle cx={leftX + 52} cy={topY + bubbleH / 2} r={4} fill="#60a5fa" />
            <circle cx={leftX + 70} cy={topY + bubbleH / 2} r={4} fill="#60a5fa" />
          </g>
          <g className="wb-sway" style={{ animationDelay: '0.25s' }}>
            <rect x={rightX} y={bottomY} width={bubbleW} height={bubbleH} rx={20} fill="#ecfdf5" stroke="#16a34a" strokeWidth={2.2} />
            <path d={`M ${rightX + bubbleW - 34} ${bottomY + bubbleH} l10 18 l-24 -14`} fill="#ecfdf5" stroke="#16a34a" strokeWidth={2.2} strokeLinejoin="round" />
            <line x1={rightX + 28} y1={bottomY + 24} x2={rightX + bubbleW - 28} y2={bottomY + 24} stroke="#6ee7b7" strokeWidth={4} strokeLinecap="round" />
            <line x1={rightX + 28} y1={bottomY + 42} x2={rightX + bubbleW - 54} y2={bottomY + 42} stroke="#6ee7b7" strokeWidth={4} strokeLinecap="round" />
          </g>
        </g>
      );
      break;
    }
    case "triangle": {
      const left = px + 36;
      const bottom = py + ph - 20;
      const base = pw * 0.6;
      const height = ph * 0.58;
      objectShape = (
        <g>
          <path d={`M ${left} ${bottom} L ${left + base} ${bottom} L ${left + base} ${bottom - height} Z`} fill="#eff6ff" stroke="#2563eb" strokeWidth={2.5} strokeLinejoin="round" />
          <path d={`M ${left + base - 26} ${bottom} L ${left + base - 26} ${bottom - 26} L ${left + base} ${bottom - 26}`} fill="none" stroke="#2563eb" strokeWidth={2} />
          <path d={`M ${left + 32} ${bottom - 2} A 28 28 0 0 1 ${left + 56} ${bottom - 22}`} fill="none" stroke="#7c3aed" strokeWidth={2} />
          <text x={left + base / 2} y={bottom + 24} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#2563eb">adjacent</text>
          <text x={left + base + 22} y={bottom - height / 2} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#0f766e">opposite</text>
          <text x={left + base / 2 + 16} y={bottom - height / 2 - 16} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#7c3aed">hypotenuse</text>
        </g>
      );
      break;
    }
    case "layers": {
      const layerRects = [
        { x: px + 34, y: py + 34, width: pw - 68, height: 34, fill: '#eff6ff', stroke: '#2563eb' },
        { x: px + 48, y: py + 82, width: pw - 96, height: 34, fill: '#f0fdf4', stroke: '#16a34a' },
        { x: px + 62, y: py + 130, width: pw - 124, height: 34, fill: '#fef3c7', stroke: '#d97706' },
      ];
      objectShape = (
        <g>
          {layerRects.map((layer, index) => (
            <g key={index} className="wb-breathe" style={{ animationDelay: `${index * 0.2}s` }}>
              <rect x={layer.x} y={layer.y} width={layer.width} height={layer.height} rx={12} fill={layer.fill} stroke={layer.stroke} strokeWidth={2.2} />
              <rect x={layer.x + 12} y={layer.y + 8} width={Math.max(18, layer.width - 48)} height={8} rx={4} fill="#ffffff" fillOpacity={0.28} />
            </g>
          ))}
          <path d={`M ${px + pw / 2} ${py + 26} L ${px + pw / 2} ${py + ph - 10}`} stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" />
        </g>
      );
      break;
    }
    case "leaf": {
      const cx = px + pw / 2;
      const cy = py + ph / 2 + 6;
      objectShape = (
        <g>
          <path d={`M ${cx} ${py + 24} C ${px + pw - 12} ${py + 40}, ${px + pw - 6} ${py + ph - 24}, ${cx} ${py + ph - 10} C ${px + 10} ${py + ph - 24}, ${px + 20} ${py + 42}, ${cx} ${py + 24} Z`} fill="#dcfce7" stroke="#16a34a" strokeWidth={2.6} />
          <path d={`M ${cx} ${py + 30} L ${cx} ${py + ph - 18}`} stroke="#15803d" strokeWidth={2.6} strokeLinecap="round" />
          <path d={`M ${cx} ${cy - 12} L ${cx + 38} ${cy - 38}`} stroke="#15803d" strokeWidth={1.8} strokeLinecap="round" />
          <path d={`M ${cx} ${cy + 8} L ${cx + 42} ${cy - 4}`} stroke="#15803d" strokeWidth={1.8} strokeLinecap="round" />
          <path d={`M ${cx} ${cy - 8} L ${cx - 40} ${cy - 34}`} stroke="#15803d" strokeWidth={1.8} strokeLinecap="round" />
          <path d={`M ${cx} ${cy + 14} L ${cx - 44} ${cy + 2}`} stroke="#15803d" strokeWidth={1.8} strokeLinecap="round" />
          <circle cx={px + pw - 36} cy={py + 26} r={14} fill="#fef08a" stroke="#eab308" strokeWidth={2} />
        </g>
      );
      break;
    }
    case "compass": {
      const cx = px + pw / 2;
      const cy = py + ph / 2;
      objectShape = (
        <g>
          <circle cx={cx} cy={cy} r={58} fill="#f8fafc" stroke="#0f766e" strokeWidth={2.4} />
          <circle cx={cx} cy={cy} r={42} fill="#ecfeff" stroke="#0891b2" strokeWidth={2} />
          <path className="wb-sway" d={`M ${cx} ${cy - 40} L ${cx + 14} ${cy + 8} L ${cx} ${cy + 2} L ${cx - 14} ${cy + 8} Z`} fill="#ef4444" stroke="#b91c1c" strokeWidth={1.8} strokeLinejoin="round" style={{ transformOrigin: `${cx}px ${cy}px` }} />
          <path className="wb-sway" d={`M ${cx} ${cy + 40} L ${cx + 12} ${cy - 4} L ${cx} ${cy + 4} L ${cx - 12} ${cy - 4} Z`} fill="#3b82f6" stroke="#1d4ed8" strokeWidth={1.8} strokeLinejoin="round" style={{ transformOrigin: `${cx}px ${cy}px`, animationDelay: '0.15s' }} />
          <text x={cx} y={cy - 54} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#0f766e">N</text>
          <text x={cx + 54} y={cy + 4} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#0f766e">E</text>
          <text x={cx} y={cy + 62} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#0f766e">S</text>
          <text x={cx - 54} y={cy + 4} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#0f766e">W</text>
        </g>
      );
      break;
    }
    case "flask": {
      const cx = px + pw / 2;
      const top = py + 20;
      const bodyBottom = py + ph - 12;
      objectShape = (
        <g>
          <path
            d={`M ${cx - 18} ${top} L ${cx - 10} ${top + 44} L ${px + 36} ${bodyBottom} Q ${px + 34} ${bodyBottom + 4} ${px + 44} ${bodyBottom + 4} L ${px + pw - 44} ${bodyBottom + 4} Q ${px + pw - 34} ${bodyBottom + 4} ${px + pw - 36} ${bodyBottom} L ${cx + 10} ${top + 44} L ${cx + 18} ${top}`}
            fill="#eff6ff"
            stroke="#0284c7"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <path d={`M ${px + 52} ${py + ph - 58} L ${px + pw - 52} ${py + ph - 58} L ${px + pw - 62} ${bodyBottom - 8} L ${px + 62} ${bodyBottom - 8} Z`} fill="#93c5fd" opacity="0.8" />
          <circle cx={px + pw - 72} cy={py + ph - 80} r={6} fill="#38bdf8" />
          <circle cx={px + pw - 94} cy={py + ph - 100} r={4} fill="#7dd3fc" />
        </g>
      );
      break;
    }
    case "lightbulb": {
      const cx = px + pw / 2;
      const cy = py + ph / 2 - 6;
      objectShape = (
        <g>
          <circle cx={cx} cy={cy} r={44} fill="#fef3c7" stroke="#f59e0b" strokeWidth={2.5} />
          <rect x={cx - 20} y={cy + 34} width={40} height={18} rx={8} fill="#fde68a" stroke="#f59e0b" strokeWidth={2} />
          <rect x={cx - 16} y={cy + 52} width={32} height={12} rx={6} fill="#fcd34d" stroke="#f59e0b" strokeWidth={1.8} />
          {Array.from({ length: 6 }, (_, index) => {
            const angle = (Math.PI * 2 * index) / 6;
            const x1 = cx + Math.cos(angle) * 58;
            const y1 = cy + Math.sin(angle) * 58;
            const x2 = cx + Math.cos(angle) * 76;
            const y2 = cy + Math.sin(angle) * 76;
            return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f59e0b" strokeWidth={3} strokeLinecap="round" />;
          })}
        </g>
      );
      break;
    }
    case "target": {
      const cx = px + pw / 2;
      const cy = py + ph / 2;
      objectShape = (
        <g>
          <circle cx={cx} cy={cy} r={56} fill="#fee2e2" stroke="#dc2626" strokeWidth={2.5} />
          <circle cx={cx} cy={cy} r={38} fill="#ffffff" stroke="#dc2626" strokeWidth={2.5} />
          <circle cx={cx} cy={cy} r={20} fill="#fecaca" stroke="#dc2626" strokeWidth={2.5} />
          <path d={`M ${cx + 54} ${cy - 34} L ${cx + 8} ${cy + 2}`} fill="none" stroke="#2563eb" strokeWidth={3} strokeLinecap="round" />
          <path d={`M ${cx + 48} ${cy - 38} L ${cx + 66} ${cy - 42} L ${cx + 60} ${cy - 24} Z`} fill="#2563eb" />
        </g>
      );
      break;
    }
    case "gear":
    default: {
      const cx = px + pw / 2;
      const cy = py + ph / 2;
      const toothCount = 8;
      const toothLength = 18;
      objectShape = (
        <g>
          {Array.from({ length: toothCount }, (_, index) => {
            const angle = (Math.PI * 2 * index) / toothCount;
            const tx = cx + Math.cos(angle) * 58;
            const ty = cy + Math.sin(angle) * 58;
            return (
              <rect
                key={index}
                x={tx - 8}
                y={ty - toothLength / 2}
                width={16}
                height={toothLength}
                rx={4}
                fill="#fee2e2"
                stroke="#dc2626"
                strokeWidth={1.5}
                transform={`rotate(${(angle * 180) / Math.PI} ${tx} ${ty})`}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={52} fill="#fef2f2" stroke="#dc2626" strokeWidth={2.5} />
          <circle cx={cx} cy={cy} r={20} fill="#ffffff" stroke="#dc2626" strokeWidth={2} />
        </g>
      );
    }
  }

  return (
    <g key={id} className="wb-bounce">
      <ellipse cx={px + pw / 2} cy={py + ph / 2} rx={pw * 0.44} ry={ph * 0.36} fill={accent} fillOpacity={0.12} filter="url(#wb-glow)" className="wb-halo" />
      <rect x={px + 6} y={py + 10} width={Math.max(0, pw - 12)} height={Math.max(0, ph - 20)} rx={26} fill="url(#wb-panel-fill)" fillOpacity={0.94} stroke={accent} strokeOpacity={0.18} strokeWidth={1.4} filter="url(#wb-shadow)" />
      <rect x={px + 18} y={py + 18} width={Math.max(24, pw - 36)} height={8} rx={4} fill="#ffffff" fillOpacity={0.2} />
      <circle cx={px + 22} cy={py + 24} r={4} fill={accent} fillOpacity={0.18} className="wb-breathe" />
      <circle cx={px + pw - 24} cy={py + ph - 24} r={5} fill={accent} fillOpacity={0.16} className="wb-breathe" style={{ animationDelay: "0.14s" }} />
      <g className="wb-figure-build"><g className="wb-drift">{objectShape}</g></g>
      {label ? renderLabelCapsule(`${id}-label`, label, px + pw / 2, labelTop, Math.max(150, Math.min(pw + 28, 248)), accent) : null}
      {renderAnnotationCards(`${id}-annotation`, annotations, annotationX, annotationY, annotationWidth, accent)}
    </g>
  );
}

// ─── DrawTable ────────────────────────────────────────────────────────────────

function DrawTable({ id, p }: { id: string; p: DrawTableP }) {
  const [ox, oy] = p.position ?? [60, 100];
  const cellW    = p.cell_width  ?? 120;
  const cellH    = p.cell_height ?? 32;
  const headers  = p.headers ?? [];
  const rows     = p.rows    ?? [];

  const totalW = headers.length * cellW;
  const totalH = (rows.length + 1) * cellH;

  return (
    <g key={id} className="wb-slide-r">
      <ellipse cx={ox + totalW / 2} cy={oy + totalH / 2} rx={totalW / 2 + 20} ry={totalH / 2 + 14} fill="#93c5fd" fillOpacity={0.08} filter="url(#wb-glow)" className="wb-halo" />
      <rect x={ox - 10} y={oy - 12} width={totalW + 20} height={totalH + 24} rx={20} fill="url(#wb-panel-fill)" stroke="#cbd5e1" strokeWidth={1.4} filter="url(#wb-shadow)" />
      <rect x={ox + 12} y={oy - 2} width={Math.max(24, totalW - 24)} height={6} rx={3} fill="#60a5fa" fillOpacity={0.14} />
      {/* Header row */}
      {headers.map((h, ci) => (
        <g key={`h${ci}`}>
          <rect x={ox + ci * cellW} y={oy} width={cellW} height={cellH}
            fill="#1e3a5f" stroke="#fff" strokeWidth={1} />
          {wrapText(
            h,
            ox + ci * cellW + cellW / 2,
            oy + 13,
            cellW - 14,
            11,
            "#fff",
            "bold",
            "middle",
            2,
          )}
        </g>
      ))}
      {/* Data rows */}
      {rows.map((row, ri) => (
        row.map((cell, ci) => (
          <g key={`r${ri}c${ci}`}>
            <rect x={ox + ci * cellW} y={oy + (ri + 1) * cellH} width={cellW} height={cellH}
              fill={ri % 2 === 0 ? "#f8fafc" : "#f1f5f9"} stroke="#e2e8f0" strokeWidth={1} />
            {wrapText(
              cell,
              ox + ci * cellW + cellW / 2,
              oy + (ri + 1) * cellH + 11,
              cellW - 16,
              10,
              "#334155",
              "500",
              "middle",
              3,
            )}
          </g>
        ))
      ))}
      {/* Outer border */}
      <rect x={ox} y={oy} width={totalW} height={totalH}
        fill="none" stroke="#94a3b8" strokeWidth={1.5} />
    </g>
  );
}

// ─── DrawHighlight ─────────────────────────────────────────────────────────────
// A semi-transparent colored overlay used to spotlight an area of the board.
// Useful for drawing attention to key terms, zones, or background groupings.

interface DrawHighlightP {
  position: [number, number];
  width: number;
  height: number;
  color?: string;
  opacity?: number;
  rx?: number;
  label?: string;
}

function DrawHighlight({ id, p }: { id: string; p: DrawHighlightP }) {
  const [x, y] = p.position ?? [30, 80];
  const w      = p.width    ?? 200;
  const h      = p.height   ?? 60;
  const color  = p.color    ?? "#fbbf24";
  const op     = Math.min(0.55, p.opacity ?? 0.28);
  const rx     = p.rx       ?? 10;
  const label  = p.label;

  return (
    <g key={id} className="wb-highlight">
      <rect
        x={x} y={y} width={w} height={h} rx={rx}
        fill={color} fillOpacity={op}
        stroke={color} strokeWidth={1.5} strokeOpacity={0.6}
      />
      {label && (
        <text
          x={x + 10} y={y + 16}
          fontSize={11}
          fontWeight="600"
          fill={color}
          fillOpacity={0.9}
          style={{ textTransform: "uppercase", letterSpacing: "0.08em" } as React.CSSProperties}
        >
          {label}
        </text>
      )}
    </g>
  );
}
