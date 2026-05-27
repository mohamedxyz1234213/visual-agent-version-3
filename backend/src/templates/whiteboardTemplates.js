// ═══════════════════════════════════════════════════════════════════════════════
// WHITEBOARD TEMPLATES - 60 Pre-built Visual Teaching Templates
// Each template is a function that accepts lesson data and returns scene arrays.
// The AI selects the best template and fills it with actual lesson content.
// ═══════════════════════════════════════════════════════════════════════════════

const COLORS = ["#2563eb","#16a34a","#d97706","#7c3aed","#be123c","#0891b2","#0f766e"];
const FILLS = ["#eff6ff","#f0fdf4","#fef3c7","#f5f3ff","#fff1f2","#ecfeff","#f0fdfa"];

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function truncate(str, max) { return (str || '').length > max ? (str || '').slice(0, max - 1) + '…' : (str || ''); }
function safeGet(arr, i, fallback = '') { return (arr && arr[i]) || fallback; }

/**
 * All 60 templates. Each has:
 * - id, name, category, description, tags
 * - generator(data) → scene[] 
 * 
 * data shape:
 * { title, concepts[], definitions[], relationships[], examples[], 
 *   summary, field, equation, tableData, graphData, steps[] }
 */
export const WHITEBOARD_TEMPLATES = [
  {
    id: 1,
    name: "concept_spotlight",
    category: "concept_introduction",
    description: "Centers one concept with radial branches showing related ideas",
    tags: ["definition","single_concept","beginner"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      // Page 1: Title + central concept
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 40), position: [400, 38], style: { fontSize: 24, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_path', d: 'M 200 55 Q 400 62 600 55', style: { fill: 'none', stroke: '#2563eb', strokeWidth: 2 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_circle', center: [400, 220], radius: 70, label: truncate(safeGet(data.concepts, 0, data.title), 18), style: { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 3 } });
      t += 7;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, data.summary), 60), position: [180, 320], width: 440, style: { bg: '#f8fafc', stroke: '#94a3b8', color: '#374151' } });
      t += 8;
      // Page 2: Radial branches
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: truncate(safeGet(data.concepts, 0, data.title), 24), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_circle', center: [400, 240], radius: 50, label: 'Core', style: { fill: '#2563eb', stroke: '#1d4ed8', strokeWidth: 2 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_arrow', from: [400, 190], to: [280, 110], label: truncate(safeGet(data.concepts, 1, ''), 14), style: { color: '#16a34a', strokeWidth: 2 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 180, y: 80, width: 160, height: 50, label: truncate(safeGet(data.concepts, 1, 'Related'), 16), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 10 } });
      t += 7;
      // Page 3: More branches + summary
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: truncate(safeGet(data.concepts, 0, data.title), 24), position: [400, 38], style: { fontSize: 20, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_arrow', from: [400, 190], to: [560, 130], label: truncate(safeGet(data.concepts, 2, ''), 14), style: { color: '#d97706', strokeWidth: 2 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 470, y: 100, width: 180, height: 50, label: truncate(safeGet(data.concepts, 2, 'Applied'), 16), style: { fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2, rx: 10 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.examples, 0, data.summary), 50), position: [150, 360], width: 500, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 2,
    name: "definition_reveal",
    category: "concept_introduction",
    description: "Progressive definition reveal with keyword emphasis and example boxes",
    tags: ["definition","vocabulary","explanation"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      // Page 1: Big keyword
      scenes.push({ time: t, type: 'draw_badge', content: truncate(data.field || 'Topic', 12), position: [50, 30], style: { bg: '#0f766e', color: '#fff', fontSize: 13 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_text', content: truncate(safeGet(data.concepts, 0, data.title), 30), position: [400, 100], style: { fontSize: 28, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_path', d: 'M 180 115 L 620 115', style: { fill: 'none', stroke: '#2563eb', strokeWidth: 3 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'Definition goes here'), 70), position: [120, 160], width: 560, style: { bg: '#eff6ff', stroke: '#2563eb', color: '#1e3a5f' } });
      t += 8;
      scenes.push({ time: t, type: 'draw_path', d: 'M 395 245 L 395 280 M 385 270 L 395 280 L 405 270', style: { fill: 'none', stroke: '#64748b', strokeWidth: 2 } });
      t += 5;
      // Page 2: Example
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Example', position: [400, 42], style: { fontSize: 20, color: '#16a34a', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_rect', x: 100, y: 80, width: 600, height: 120, label: truncate(safeGet(data.examples, 0, safeGet(data.definitions, 1, 'Concrete illustration')), 50), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 14 } });
      t += 7;
      scenes.push({ time: t, type: 'draw_badge', content: '✓', position: [680, 85], style: { bg: '#16a34a', color: '#fff', fontSize: 16 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.relationships, 0, 'This connects to the broader topic'), 55), position: [120, 260], width: 560, style: { bg: '#fef3c7', stroke: '#d97706', color: '#374151' } });
      t += 8;
      // Page 3: Summary
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Takeaway', position: [400, 42], style: { fontSize: 22, color: '#7c3aed', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_rect', x: 80, y: 80, width: 640, height: 140, label: truncate(data.summary || safeGet(data.definitions, 0, 'Summary'), 70), style: { fill: '#f5f3ff', stroke: '#7c3aed', strokeWidth: 2, rx: 16 } });
      t += 7;
      scenes.push({ time: t, type: 'draw_path', d: 'M 360 240 L 400 260 L 440 240 M 380 250 L 400 270 L 420 250', style: { fill: 'none', stroke: '#7c3aed', strokeWidth: 2 } });
      t += 6;
      return scenes;
    }
  },

  {
    id: 3,
    name: "triple_card_intro",
    category: "concept_introduction",
    description: "Three concept cards laid out horizontally with connecting arrows",
    tags: ["multiple_concepts","overview","comparison_lite"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      // Page 1: Title + 3 cards
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 40, y: 90, width: 220, height: 130, label: truncate(safeGet(data.concepts, 0, 'Concept 1'), 18), style: { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 290, y: 90, width: 220, height: 130, label: truncate(safeGet(data.concepts, 1, 'Concept 2'), 18), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 540, y: 90, width: 220, height: 130, label: truncate(safeGet(data.concepts, 2, 'Concept 3'), 18), style: { fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2, rx: 12 } });
      t += 7;
      scenes.push({ time: t, type: 'draw_arrow', from: [260, 155], to: [290, 155], label: '', style: { color: '#64748b', strokeWidth: 2 } });
      t += 4;
      // Page 2: Definitions
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_badge', content: '1', position: [50, 60], style: { bg: '#2563eb', color: '#fff', fontSize: 15 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'First concept explained'), 55), position: [80, 55], width: 650, style: { bg: '#eff6ff', stroke: '#2563eb', color: '#1e3a5f' } });
      t += 7;
      scenes.push({ time: t, type: 'draw_badge', content: '2', position: [50, 170], style: { bg: '#16a34a', color: '#fff', fontSize: 15 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 1, 'Second concept explained'), 55), position: [80, 165], width: 650, style: { bg: '#f0fdf4', stroke: '#16a34a', color: '#1e3a5f' } });
      t += 7;
      // Page 3: Connections
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'How They Connect', position: [400, 42], style: { fontSize: 20, color: '#7c3aed', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_circle', center: [200, 240], radius: 55, label: truncate(safeGet(data.concepts, 0, 'A'), 10), style: { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_arrow', from: [255, 240], to: [345, 240], label: truncate(safeGet(data.relationships, 0, 'leads to'), 12), style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_circle', center: [400, 240], radius: 55, label: truncate(safeGet(data.concepts, 1, 'B'), 10), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_arrow', from: [455, 240], to: [545, 240], label: truncate(safeGet(data.relationships, 1, 'enables'), 12), style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_circle', center: [600, 240], radius: 55, label: truncate(safeGet(data.concepts, 2, 'C'), 10), style: { fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2 } });
      t += 6;
      return scenes;
    }
  },

  {
    id: 4,
    name: "question_hook",
    category: "concept_introduction",
    description: "Starts with a provocative question then reveals the answer progressively",
    tags: ["hook","question","engagement"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      // Page 1: Big question
      scenes.push({ time: t, type: 'draw_path', d: 'M 350 30 Q 400 20 450 30 Q 460 35 450 40 Q 400 50 350 40 Q 340 35 350 30', style: { fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_text', content: '?', position: [400, 80], style: { fontSize: 48, color: '#d97706', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate('What is ' + safeGet(data.concepts, 0, data.title) + ' and why does it matter?', 55), position: [130, 140], width: 540, style: { bg: '#fff7ed', stroke: '#d97706', color: '#374151' } });
      t += 8;
      scenes.push({ time: t, type: 'draw_path', d: 'M 400 220 L 400 260', style: { fill: 'none', stroke: '#94a3b8', strokeWidth: 2 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_text', content: "Let's find out →", position: [400, 290], style: { fontSize: 16, color: '#64748b', fontWeight: 'normal', textAnchor: 'middle' } });
      t += 6;
      // Page 2: The answer
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: truncate(safeGet(data.concepts, 0, data.title), 28), position: [400, 50], style: { fontSize: 24, color: '#2563eb', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 80, y: 90, width: 640, height: 100, label: truncate(safeGet(data.definitions, 0, 'The answer revealed'), 60), style: { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2, rx: 14 } });
      t += 8;
      scenes.push({ time: t, type: 'draw_badge', content: 'KEY', position: [90, 220], style: { bg: '#be123c', color: '#fff', fontSize: 13 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.examples, 0, safeGet(data.relationships, 0, 'Real-world application')), 55), position: [130, 215], width: 560, style: { bg: '#fff1f2', stroke: '#be123c', color: '#374151' } });
      t += 8;
      // Page 3: Why it matters
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Why It Matters', position: [400, 42], style: { fontSize: 20, color: '#0f766e', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_object', object_type: 'lightbulb', position: [340, 100], size: [120, 120], label: 'Insight', annotations: [truncate(safeGet(data.relationships, 0, ''), 20)] });
      t += 7;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || safeGet(data.definitions, 1, 'This is crucial because...'), 60), position: [120, 280], width: 560, style: { bg: '#f0fdfa', stroke: '#0f766e', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 5,
    name: "layered_build",
    category: "concept_introduction",
    description: "Builds concept layer by layer from foundation to full picture",
    tags: ["progressive","foundation","build_up"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      // Page 1: Foundation layer
      scenes.push({ time: t, type: 'draw_text', content: 'Building Understanding', position: [400, 32], style: { fontSize: 18, color: '#64748b', fontWeight: 'normal', textAnchor: 'middle' } });
      t += 4;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 60], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 150, y: 380, width: 500, height: 60, label: truncate(safeGet(data.concepts, 0, 'Foundation'), 22), style: { fill: '#2563eb', stroke: '#1d4ed8', strokeWidth: 2, rx: 8 } });
      t += 7;
      scenes.push({ time: t, type: 'draw_rect', x: 180, y: 310, width: 440, height: 55, label: truncate(safeGet(data.concepts, 1, 'Layer 2'), 22), style: { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2, rx: 8 } });
      t += 7;
      scenes.push({ time: t, type: 'draw_rect', x: 210, y: 245, width: 380, height: 50, label: truncate(safeGet(data.concepts, 2, 'Layer 3'), 22), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 8 } });
      t += 7;
      // Page 2: Top layers
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 32), position: [400, 38], style: { fontSize: 20, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_rect', x: 150, y: 380, width: 500, height: 50, label: truncate(safeGet(data.concepts, 0, 'Base'), 18), style: { fill: '#dbeafe', stroke: '#2563eb', strokeWidth: 1, rx: 6 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_rect', x: 180, y: 310, width: 440, height: 50, label: truncate(safeGet(data.concepts, 1, 'Middle'), 18), style: { fill: '#d1fae5', stroke: '#16a34a', strokeWidth: 1, rx: 6 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_rect', x: 240, y: 190, width: 320, height: 55, label: truncate(safeGet(data.concepts, 3, safeGet(data.concepts, 2, 'Application')), 22), style: { fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2, rx: 8 } });
      t += 7;
      // Page 3: Full picture with callout
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Complete Picture', position: [400, 38], style: { fontSize: 20, color: '#7c3aed', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_object', object_type: 'layers', position: [300, 100], size: [200, 200], label: truncate(data.title, 14), annotations: (data.concepts || []).slice(0, 3).map(c => truncate(c, 14)) });
      t += 8;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'Together these layers form a complete understanding', 60), position: [120, 360], width: 560, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 6,
    name: "anchor_word_expand",
    category: "concept_introduction",
    description: "Starts with a single keyword that expands into full explanation",
    tags: ["keyword","expansion","focus"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(safeGet(data.concepts, 0, data.title), 20), position: [400, 200], style: { fontSize: 36, color: '#2563eb', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 8;
      scenes.push({ time: t, type: 'draw_path', d: 'M 300 220 Q 400 240 500 220', style: { fill: 'none', stroke: '#2563eb', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_text', content: truncate(safeGet(data.definitions, 0, 'What it means'), 40), position: [400, 280], style: { fontSize: 16, color: '#374151', fontWeight: 'normal', textAnchor: 'middle' } });
      t += 7;
      scenes.push({ time: t, type: 'draw_badge', content: '→', position: [400, 340], style: { bg: '#16a34a', color: '#fff', fontSize: 18 } });
      t += 5;
      // Page 2
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: truncate(safeGet(data.concepts, 0, data.title), 20), position: [400, 42], style: { fontSize: 22, color: '#2563eb', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_rect', x: 80, y: 80, width: 300, height: 80, label: truncate(safeGet(data.concepts, 1, 'Component A'), 20), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 10 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 420, y: 80, width: 300, height: 80, label: truncate(safeGet(data.concepts, 2, 'Component B'), 20), style: { fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2, rx: 10 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_arrow', from: [230, 160], to: [230, 240], label: '', style: { color: '#16a34a', strokeWidth: 2 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.examples, 0, safeGet(data.relationships, 0, 'How they work together')), 55), position: [80, 240], width: 640, style: { bg: '#eff6ff', stroke: '#2563eb', color: '#1e3a5f' } });
      t += 8;
      // Page 3
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Remember', position: [400, 42], style: { fontSize: 20, color: '#be123c', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_rect', x: 100, y: 90, width: 600, height: 120, label: truncate(data.summary || safeGet(data.definitions, 0, ''), 65), style: { fill: '#fff1f2', stroke: '#be123c', strokeWidth: 2, rx: 14 } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 7,
    name: "visual_metaphor",
    category: "concept_introduction",
    description: "Uses an object/metaphor to introduce the concept before explaining",
    tags: ["metaphor","creative","visual"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      // Page 1: Object metaphor
      scenes.push({ time: t, type: 'draw_object', object_type: 'lightbulb', position: [320, 60], size: [160, 160], label: 'Idea', annotations: [] });
      t += 7;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 32), position: [400, 280], style: { fontSize: 24, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_text', content: 'Think of it like...', position: [400, 320], style: { fontSize: 15, color: '#64748b', fontWeight: 'normal', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'A clear way to understand this concept'), 60), position: [130, 360], width: 540, style: { bg: '#fef3c7', stroke: '#d97706', color: '#374151' } });
      t += 8;
      // Page 2: Real explanation
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'In Reality', position: [400, 38], style: { fontSize: 20, color: '#2563eb', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_badge', content: truncate(safeGet(data.concepts, 0, 'Term'), 12), position: [60, 80], style: { bg: '#2563eb', color: '#fff', fontSize: 14 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_rect', x: 60, y: 110, width: 680, height: 100, label: truncate(safeGet(data.definitions, 0, 'Full definition'), 60), style: { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2, rx: 12 } });
      t += 7;
      scenes.push({ time: t, type: 'draw_arrow', from: [400, 210], to: [400, 260], label: 'means', style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_rect', x: 100, y: 270, width: 600, height: 80, label: truncate(safeGet(data.examples, 0, 'Concrete example'), 50), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 12 } });
      t += 8;
      // Page 3
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Summary', position: [400, 42], style: { fontSize: 20, color: '#0f766e', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_object', object_type: 'target', position: [320, 100], size: [160, 160], label: truncate(safeGet(data.concepts, 0, ''), 14), annotations: (data.concepts || []).slice(1, 4).map(c => truncate(c, 14)) });
      t += 8;
      return scenes;
    }
  },

  {
    id: 8,
    name: "before_after",
    category: "concept_introduction",
    description: "Shows before/after or problem/solution split view",
    tags: ["contrast","problem_solution","transformation"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      // Page 1: The problem/before
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 32], style: { fontSize: 20, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_line', from: [400, 55], to: [400, 460], style: { color: '#e2e8f0', strokeWidth: 2, dashed: true } });
      t += 4;
      scenes.push({ time: t, type: 'draw_badge', content: 'Before', position: [150, 70], style: { bg: '#be123c', color: '#fff', fontSize: 13 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_rect', x: 50, y: 100, width: 320, height: 150, label: truncate(safeGet(data.concepts, 0, 'Old way'), 25), style: { fill: '#fff1f2', stroke: '#be123c', strokeWidth: 2, rx: 10 } });
      t += 7;
      // Page 2: The solution/after
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 32], style: { fontSize: 20, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_line', from: [400, 55], to: [400, 460], style: { color: '#e2e8f0', strokeWidth: 2, dashed: true } });
      t += 3;
      scenes.push({ time: t, type: 'draw_badge', content: 'After', position: [560, 70], style: { bg: '#16a34a', color: '#fff', fontSize: 13 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_rect', x: 430, y: 100, width: 320, height: 150, label: truncate(safeGet(data.concepts, 1, safeGet(data.concepts, 0, 'New way')), 25), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 10 } });
      t += 7;
      // Page 3: The transformation
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'The Transformation', position: [400, 42], style: { fontSize: 20, color: '#7c3aed', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_arrow', from: [150, 200], to: [650, 200], label: truncate(safeGet(data.relationships, 0, 'becomes'), 14), style: { color: '#7c3aed', strokeWidth: 3 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || safeGet(data.definitions, 0, 'This change matters because...'), 60), position: [120, 260], width: 560, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 9,
    name: "story_narrative",
    category: "concept_introduction",
    description: "Introduces concept through a narrative sequence with scenes",
    tags: ["narrative","story","sequence"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      // Scene 1: Setting
      scenes.push({ time: t, type: 'draw_badge', content: 'Scene 1', position: [50, 30], style: { bg: '#0891b2', color: '#fff', fontSize: 13 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 34), position: [400, 60], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_callout', content: truncate('Imagine: ' + safeGet(data.examples, 0, safeGet(data.definitions, 0, 'a scenario where this applies')), 60), position: [100, 110], width: 600, style: { bg: '#ecfeff', stroke: '#0891b2', color: '#374151' } });
      t += 8;
      scenes.push({ time: t, type: 'draw_object', object_type: 'book', position: [320, 220], size: [160, 130], label: 'Story', annotations: [] });
      t += 7;
      // Scene 2: Rising action
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_badge', content: 'Scene 2', position: [50, 30], style: { bg: '#d97706', color: '#fff', fontSize: 13 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_text', content: 'The Key Insight', position: [400, 60], style: { fontSize: 20, color: '#d97706', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_rect', x: 80, y: 100, width: 640, height: 110, label: truncate(safeGet(data.definitions, 0, 'The main concept explained'), 55), style: { fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2, rx: 14 } });
      t += 7;
      scenes.push({ time: t, type: 'draw_arrow', from: [400, 210], to: [400, 270], label: 'therefore', style: { color: '#d97706', strokeWidth: 2 } });
      t += 5;
      // Scene 3: Resolution
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_badge', content: 'Scene 3', position: [50, 30], style: { bg: '#16a34a', color: '#fff', fontSize: 13 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_text', content: 'The Conclusion', position: [400, 60], style: { fontSize: 20, color: '#16a34a', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'So in the end, we understand that...', 60), position: [100, 110], width: 600, style: { bg: '#f0fdf4', stroke: '#16a34a', color: '#374151' } });
      t += 8;
      scenes.push({ time: t, type: 'draw_badge', content: '✓', position: [680, 110], style: { bg: '#16a34a', color: '#fff', fontSize: 18 } });
      t += 5;
      return scenes;
    }
  },

  {
    id: 10,
    name: "zoom_in_detail",
    category: "concept_introduction",
    description: "Starts with big picture then zooms into specific details",
    tags: ["overview_to_detail","zoom","progressive"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      // Page 1: Big picture
      scenes.push({ time: t, type: 'draw_text', content: 'The Big Picture', position: [400, 32], style: { fontSize: 18, color: '#64748b', fontWeight: 'normal', textAnchor: 'middle' } });
      t += 4;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 32), position: [400, 64], style: { fontSize: 24, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 200, y: 120, width: 400, height: 250, label: truncate(data.summary || safeGet(data.definitions, 0, ''), 40), style: { fill: '#f8fafc', stroke: '#94a3b8', strokeWidth: 2, rx: 16 } });
      t += 7;
      scenes.push({ time: t, type: 'draw_path', d: 'M 600 245 L 680 245 L 680 120 L 600 120', style: { fill: 'none', stroke: '#2563eb', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_text', content: 'Zoom in →', position: [720, 180], style: { fontSize: 13, color: '#2563eb', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      // Page 2: Zoomed in - detail 1
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_badge', content: 'Detail', position: [50, 30], style: { bg: '#2563eb', color: '#fff', fontSize: 13 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_text', content: truncate(safeGet(data.concepts, 0, 'First detail'), 28), position: [400, 60], style: { fontSize: 22, color: '#2563eb', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'Detailed explanation of this specific part'), 65), position: [80, 110], width: 640, style: { bg: '#eff6ff', stroke: '#2563eb', color: '#1e3a5f' } });
      t += 8;
      scenes.push({ time: t, type: 'draw_rect', x: 100, y: 240, width: 600, height: 80, label: truncate(safeGet(data.examples, 0, 'Specific example'), 50), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 10 } });
      t += 7;
      // Page 3: Zoomed in - detail 2
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_badge', content: 'Detail 2', position: [50, 30], style: { bg: '#7c3aed', color: '#fff', fontSize: 13 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_text', content: truncate(safeGet(data.concepts, 1, safeGet(data.concepts, 0, 'Second aspect')), 28), position: [400, 60], style: { fontSize: 22, color: '#7c3aed', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 1, safeGet(data.relationships, 0, 'Another layer of understanding')), 60), position: [80, 110], width: 640, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 11,
    name: "linear_pipeline",
    category: "process_flow",
    description: "Left-to-right pipeline with labeled stages",
    tags: ["sequence","pipeline","steps"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const steps = (data.steps || data.concepts || []).slice(0, 4);
      const stepW = 150, gap = 30, startX = 80;
      for (let i = 0; i < Math.min(steps.length, 4); i++) {
        const x = startX + i * (stepW + gap);
        scenes.push({ time: t, type: 'draw_rect', x, y: 120, width: stepW, height: 70, label: truncate(steps[i], 14), style: { fill: FILLS[i % 7], stroke: COLORS[i % 7], strokeWidth: 2, rx: 10 } });
        t += 6;
        if (i < steps.length - 1) {
          scenes.push({ time: t, type: 'draw_arrow', from: [x + stepW, 155], to: [x + stepW + gap, 155], label: '', style: { color: '#64748b', strokeWidth: 2 } });
          t += 3;
        }
      }
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Details', position: [400, 38], style: { fontSize: 20, color: '#7c3aed', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, data.summary || 'Each stage builds on the previous'), 60), position: [100, 80], width: 600, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 1, safeGet(data.relationships, 0, 'The flow continues through each phase')), 55), position: [100, 200], width: 600, style: { bg: '#eff6ff', stroke: '#2563eb', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 12,
    name: "vertical_waterfall",
    category: "process_flow",
    description: "Top-to-bottom waterfall showing cascading steps",
    tags: ["waterfall","sequence","procedure"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const steps = (data.steps || data.concepts || []).slice(0, 4);
      for (let i = 0; i < Math.min(steps.length, 3); i++) {
        const y = 80 + i * 110;
        scenes.push({ time: t, type: 'draw_rect', x: 150 + i * 40, y, width: 500 - i * 80, height: 70, label: truncate(steps[i], 22), style: { fill: FILLS[i % 7], stroke: COLORS[i % 7], strokeWidth: 2, rx: 10 } });
        t += 7;
        if (i < steps.length - 1) {
          scenes.push({ time: t, type: 'draw_arrow', from: [400, y + 70], to: [400, y + 110], label: '', style: { color: '#64748b', strokeWidth: 2 } });
          t += 3;
        }
      }
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Summary', position: [400, 38], style: { fontSize: 20, color: '#0f766e', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || safeGet(data.definitions, 0, 'The process flows downward'), 60), position: [100, 80], width: 600, style: { bg: '#f0fdfa', stroke: '#0f766e', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 13,
    name: "cycle_diagram",
    category: "process_flow",
    description: "Circular cycle showing repeating processes",
    tags: ["cycle","loop","repetition"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_object', object_type: 'cycle', position: [250, 100], size: [300, 300], label: truncate(safeGet(data.concepts, 0, 'Cycle'), 14), annotations: (data.concepts || []).slice(0, 4).map(c => truncate(c, 14)) });
      t += 10;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'This cycle repeats continuously'), 50), position: [80, 420], width: 640, style: { bg: '#fff7ed', stroke: '#ea580c', color: '#374151' } });
      t += 8;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Each Stage', position: [400, 38], style: { fontSize: 20, color: '#2563eb', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      const steps = (data.steps || data.concepts || []).slice(0, 3);
      for (let i = 0; i < steps.length; i++) {
        scenes.push({ time: t, type: 'draw_badge', content: String(i + 1), position: [60, 80 + i * 120], style: { bg: COLORS[i % 7], color: '#fff', fontSize: 15 } });
        t += 3;
        scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, i, steps[i]), 50), position: [90, 75 + i * 120], width: 620, style: { bg: FILLS[i % 7], stroke: COLORS[i % 7], color: '#374151' } });
        t += 6;
      }
      return scenes;
    }
  },

  {
    id: 14,
    name: "decision_tree",
    category: "process_flow",
    description: "Branching if-then decision paths",
    tags: ["decision","branching","logic"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 300, y: 70, width: 200, height: 50, label: truncate(safeGet(data.concepts, 0, 'Start'), 16), style: { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2, rx: 8 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_arrow', from: [350, 120], to: [200, 180], label: 'Yes', style: { color: '#16a34a', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_arrow', from: [450, 120], to: [600, 180], label: 'No', style: { color: '#be123c', strokeWidth: 2 } });
      t += 5;
      // Page 2
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_rect', x: 80, y: 80, width: 200, height: 50, label: truncate(safeGet(data.concepts, 1, 'Path A'), 16), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 8 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 520, y: 80, width: 200, height: 50, label: truncate(safeGet(data.concepts, 2, 'Path B'), 16), style: { fill: '#fff1f2', stroke: '#be123c', strokeWidth: 2, rx: 8 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'Each path leads to different outcomes'), 55), position: [100, 200], width: 600, style: { bg: '#fef3c7', stroke: '#d97706', color: '#374151' } });
      t += 8;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The choice depends on the conditions', 55), position: [100, 330], width: 600, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 15,
    name: "timeline_progress",
    category: "process_flow",
    description: "Horizontal timeline with milestone markers",
    tags: ["timeline","history","progress"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_line', from: [80, 200], to: [720, 200], style: { color: '#2563eb', strokeWidth: 3, dashed: false } });
      t += 5;
      const steps = (data.steps || data.concepts || []).slice(0, 4);
      for (let i = 0; i < Math.min(steps.length, 4); i++) {
        const x = 120 + i * 170;
        scenes.push({ time: t, type: 'draw_circle', center: [x, 200], radius: 12, label: '', style: { fill: COLORS[i % 7], stroke: COLORS[i % 7], strokeWidth: 2 } });
        t += 3;
        scenes.push({ time: t, type: 'draw_text', content: truncate(steps[i], 12), position: [x, 170], style: { fontSize: 13, color: '#374151', fontWeight: 'bold', textAnchor: 'middle' } });
        t += 5;
      }
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Details', position: [400, 38], style: { fontSize: 20, color: '#7c3aed', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, data.summary || 'Each milestone represents progress'), 60), position: [100, 80], width: 600, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 16,
    name: "numbered_steps",
    category: "process_flow",
    description: "Clear numbered 1-2-3-4 step progression",
    tags: ["steps","procedure","numbered"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const steps = (data.steps || data.concepts || []).slice(0, 5);
      for (let i = 0; i < Math.min(steps.length, 3); i++) {
        scenes.push({ time: t, type: 'draw_badge', content: String(i + 1), position: [60, 90 + i * 100], style: { bg: COLORS[i % 7], color: '#fff', fontSize: 16 } });
        t += 4;
        scenes.push({ time: t, type: 'draw_rect', x: 100, y: 80 + i * 100, width: 620, height: 70, label: truncate(steps[i], 40), style: { fill: FILLS[i % 7], stroke: COLORS[i % 7], strokeWidth: 2, rx: 10 } });
        t += 6;
      }
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      if (steps.length > 3) {
        for (let i = 3; i < steps.length; i++) {
          scenes.push({ time: t, type: 'draw_badge', content: String(i + 1), position: [60, 90 + (i - 3) * 100], style: { bg: COLORS[i % 7], color: '#fff', fontSize: 16 } });
          t += 4;
          scenes.push({ time: t, type: 'draw_rect', x: 100, y: 80 + (i - 3) * 100, width: 620, height: 70, label: truncate(steps[i], 40), style: { fill: FILLS[i % 7], stroke: COLORS[i % 7], strokeWidth: 2, rx: 10 } });
          t += 6;
        }
      }
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'Follow these steps in order', 55), position: [100, 350], width: 600, style: { bg: '#f8fafc', stroke: '#94a3b8', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 17,
    name: "input_output",
    category: "process_flow",
    description: "Input → Process → Output transformation view",
    tags: ["transformation","io","function"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 40, y: 140, width: 180, height: 100, label: truncate(safeGet(data.concepts, 0, 'Input'), 14), style: { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2, rx: 10 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_arrow', from: [220, 190], to: [290, 190], label: '', style: { color: '#64748b', strokeWidth: 2 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_rect', x: 290, y: 120, width: 220, height: 140, label: truncate(safeGet(data.concepts, 1, 'Process'), 16), style: { fill: '#fef3c7', stroke: '#d97706', strokeWidth: 3, rx: 14 } });
      t += 7;
      scenes.push({ time: t, type: 'draw_arrow', from: [510, 190], to: [580, 190], label: '', style: { color: '#64748b', strokeWidth: 2 } });
      t += 4;
      // Page 2
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_rect', x: 580, y: 140, width: 180, height: 100, label: truncate(safeGet(data.concepts, 2, 'Output'), 14), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 10 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'The input is transformed through the process'), 60), position: [80, 290], width: 640, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 8;
      scenes.push({ time: t, type: 'draw_object', object_type: 'gear', position: [340, 80], size: [120, 120], label: 'Transform', annotations: [] });
      t += 7;
      return scenes;
    }
  },

  {
    id: 18,
    name: "phase_gates",
    category: "process_flow",
    description: "Multi-phase process with gate checkpoints",
    tags: ["phases","gates","stages"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const phases = (data.steps || data.concepts || []).slice(0, 3);
      for (let i = 0; i < phases.length; i++) {
        const x = 80 + i * 240;
        scenes.push({ time: t, type: 'draw_rect', x, y: 100, width: 200, height: 80, label: truncate(phases[i], 18), style: { fill: FILLS[i % 7], stroke: COLORS[i % 7], strokeWidth: 2, rx: 10 } });
        t += 6;
        if (i < phases.length - 1) {
          scenes.push({ time: t, type: 'draw_line', from: [x + 200, 140], to: [x + 240, 140], style: { color: '#be123c', strokeWidth: 3, dashed: false } });
          t += 3;
          scenes.push({ time: t, type: 'draw_badge', content: '✓', position: [x + 210, 130], style: { bg: '#be123c', color: '#fff', fontSize: 12 } });
          t += 3;
        }
      }
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || safeGet(data.definitions, 0, 'Each phase must be completed before moving on'), 60), position: [100, 100], width: 600, style: { bg: '#eff6ff', stroke: '#2563eb', color: '#1e3a5f' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 19,
    name: "funnel_flow",
    category: "process_flow",
    description: "Funnel showing narrowing/filtering process",
    tags: ["funnel","filtering","narrowing"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_path', d: 'M 200 80 L 600 80 L 520 380 L 280 380 Z', style: { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2 } });
      t += 7;
      const steps = (data.steps || data.concepts || []).slice(0, 3);
      for (let i = 0; i < steps.length; i++) {
        const y = 100 + i * 90;
        scenes.push({ time: t, type: 'draw_text', content: truncate(steps[i], 20), position: [400, y + 30], style: { fontSize: 15, color: COLORS[i % 7], fontWeight: 'bold', textAnchor: 'middle' } });
        t += 6;
      }
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Result', position: [400, 42], style: { fontSize: 20, color: '#16a34a', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || safeGet(data.definitions, 0, 'After filtering through each stage'), 60), position: [100, 80], width: 600, style: { bg: '#f0fdf4', stroke: '#16a34a', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 20,
    name: "parallel_tracks",
    category: "process_flow",
    description: "Multiple parallel processes happening simultaneously",
    tags: ["parallel","concurrent","multi"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const tracks = (data.concepts || []).slice(0, 3);
      for (let i = 0; i < Math.min(tracks.length, 3); i++) {
        const y = 90 + i * 110;
        scenes.push({ time: t, type: 'draw_line', from: [80, y + 30], to: [720, y + 30], style: { color: COLORS[i % 7], strokeWidth: 2, dashed: true } });
        t += 3;
        scenes.push({ time: t, type: 'draw_rect', x: 200, y, width: 400, height: 60, label: truncate(tracks[i], 28), style: { fill: FILLS[i % 7], stroke: COLORS[i % 7], strokeWidth: 2, rx: 10 } });
        t += 6;
      }
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'How They Converge', position: [400, 42], style: { fontSize: 20, color: '#7c3aed', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || safeGet(data.relationships, 0, 'These processes happen simultaneously and converge'), 60), position: [100, 80], width: 600, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 21,
    name: "side_by_side",
    category: "comparison",
    description: "Two-column comparison with clear differentiators",
    tags: ["comparison","contrast","visual"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_line', from: [400, 60], to: [400, 450], style: { color: '#e2e8f0', strokeWidth: 2, dashed: true } });
      t += 3;
      scenes.push({ time: t, type: 'draw_badge', content: truncate(safeGet(data.concepts, 0, 'A'), 10), position: [180, 65], style: { bg: '#2563eb', color: '#fff', fontSize: 14 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_badge', content: truncate(safeGet(data.concepts, 1, 'B'), 10), position: [580, 65], style: { bg: '#16a34a', color: '#fff', fontSize: 14 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_rect', x: 50, y: 100, width: 320, height: 150, label: truncate(safeGet(data.definitions, 0, 'First item explained'), 35), style: { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2, rx: 12 } });
      t += 7;
      // Page 2
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_line', from: [400, 30], to: [400, 450], style: { color: '#e2e8f0', strokeWidth: 2, dashed: true } });
      t += 3;
      scenes.push({ time: t, type: 'draw_rect', x: 430, y: 100, width: 320, height: 150, label: truncate(safeGet(data.definitions, 1, 'Second item explained'), 35), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 12 } });
      t += 7;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.relationships, 0, 'The key difference is...'), 55), position: [100, 320], width: 600, style: { bg: '#fef3c7', stroke: '#d97706', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 22,
    name: "venn_overlap",
    category: "comparison",
    description: "Venn-style diagram showing shared and unique features",
    tags: ["comparison","contrast","visual"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 80, y: 80, width: 280, height: 100, label: truncate(safeGet(data.concepts, 0, 'Item A'), 22), style: { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 440, y: 80, width: 280, height: 100, label: truncate(safeGet(data.concepts, 1, 'Item B'), 22), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_arrow', from: [360, 130], to: [440, 130], label: truncate(safeGet(data.relationships, 0, 'vs'), 8), style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'Key difference explained'), 55), position: [100, 240], width: 600, style: { bg: '#f8fafc', stroke: '#94a3b8', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Takeaway', position: [400, 42], style: { fontSize: 20, color: '#d97706', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || safeGet(data.definitions, 1, 'Summary of comparison'), 60), position: [100, 80], width: 600, style: { bg: '#fef3c7', stroke: '#d97706', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 23,
    name: "table_compare",
    category: "comparison",
    description: "Structured table comparison of features",
    tags: ["comparison","contrast","visual"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 80, y: 80, width: 280, height: 100, label: truncate(safeGet(data.concepts, 0, 'Item A'), 22), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 440, y: 80, width: 280, height: 100, label: truncate(safeGet(data.concepts, 1, 'Item B'), 22), style: { fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_arrow', from: [360, 130], to: [440, 130], label: truncate(safeGet(data.relationships, 0, 'vs'), 8), style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'Key difference explained'), 55), position: [100, 240], width: 600, style: { bg: '#f8fafc', stroke: '#94a3b8', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Takeaway', position: [400, 42], style: { fontSize: 20, color: '#7c3aed', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || safeGet(data.definitions, 1, 'Summary of comparison'), 60), position: [100, 80], width: 600, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 24,
    name: "pros_cons",
    category: "comparison",
    description: "Pros and cons layout with green/red coding",
    tags: ["comparison","contrast","visual"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 80, y: 80, width: 280, height: 100, label: truncate(safeGet(data.concepts, 0, 'Item A'), 22), style: { fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 440, y: 80, width: 280, height: 100, label: truncate(safeGet(data.concepts, 1, 'Item B'), 22), style: { fill: '#f5f3ff', stroke: '#7c3aed', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_arrow', from: [360, 130], to: [440, 130], label: truncate(safeGet(data.relationships, 0, 'vs'), 8), style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'Key difference explained'), 55), position: [100, 240], width: 600, style: { bg: '#f8fafc', stroke: '#94a3b8', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Takeaway', position: [400, 42], style: { fontSize: 20, color: '#be123c', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || safeGet(data.definitions, 1, 'Summary of comparison'), 60), position: [100, 80], width: 600, style: { bg: '#fff1f2', stroke: '#be123c', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 25,
    name: "spectrum_scale",
    category: "comparison",
    description: "Shows concepts on a spectrum from one extreme to another",
    tags: ["comparison","contrast","visual"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 80, y: 80, width: 280, height: 100, label: truncate(safeGet(data.concepts, 0, 'Item A'), 22), style: { fill: '#f5f3ff', stroke: '#7c3aed', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 440, y: 80, width: 280, height: 100, label: truncate(safeGet(data.concepts, 1, 'Item B'), 22), style: { fill: '#fff1f2', stroke: '#be123c', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_arrow', from: [360, 130], to: [440, 130], label: truncate(safeGet(data.relationships, 0, 'vs'), 8), style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'Key difference explained'), 55), position: [100, 240], width: 600, style: { bg: '#f8fafc', stroke: '#94a3b8', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Takeaway', position: [400, 42], style: { fontSize: 20, color: '#0891b2', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || safeGet(data.definitions, 1, 'Summary of comparison'), 60), position: [100, 80], width: 600, style: { bg: '#ecfeff', stroke: '#0891b2', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 26,
    name: "versus_battle",
    category: "comparison",
    description: "Dramatic A vs B comparison",
    tags: ["comparison","contrast","analytical"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 80, y: 80, width: 280, height: 100, label: truncate(safeGet(data.concepts, 0, 'Item A'), 22), style: { fill: '#fff1f2', stroke: '#be123c', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 440, y: 80, width: 280, height: 100, label: truncate(safeGet(data.concepts, 1, 'Item B'), 22), style: { fill: '#ecfeff', stroke: '#0891b2', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_arrow', from: [360, 130], to: [440, 130], label: truncate(safeGet(data.relationships, 0, 'vs'), 8), style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'Key difference explained'), 55), position: [100, 240], width: 600, style: { bg: '#f8fafc', stroke: '#94a3b8', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Takeaway', position: [400, 42], style: { fontSize: 20, color: '#0f766e', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || safeGet(data.definitions, 1, 'Summary of comparison'), 60), position: [100, 80], width: 600, style: { bg: '#f0fdfa', stroke: '#0f766e', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 27,
    name: "feature_matrix",
    category: "comparison",
    description: "Feature checklist comparison matrix",
    tags: ["comparison","contrast","analytical"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 80, y: 80, width: 280, height: 100, label: truncate(safeGet(data.concepts, 0, 'Item A'), 22), style: { fill: '#ecfeff', stroke: '#0891b2', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 440, y: 80, width: 280, height: 100, label: truncate(safeGet(data.concepts, 1, 'Item B'), 22), style: { fill: '#f0fdfa', stroke: '#0f766e', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_arrow', from: [360, 130], to: [440, 130], label: truncate(safeGet(data.relationships, 0, 'vs'), 8), style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'Key difference explained'), 55), position: [100, 240], width: 600, style: { bg: '#f8fafc', stroke: '#94a3b8', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Takeaway', position: [400, 42], style: { fontSize: 20, color: '#2563eb', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || safeGet(data.definitions, 1, 'Summary of comparison'), 60), position: [100, 80], width: 600, style: { bg: '#eff6ff', stroke: '#2563eb', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 28,
    name: "evolution_compare",
    category: "comparison",
    description: "Shows how concept evolved from old to new",
    tags: ["comparison","contrast","analytical"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 80, y: 80, width: 280, height: 100, label: truncate(safeGet(data.concepts, 0, 'Item A'), 22), style: { fill: '#f0fdfa', stroke: '#0f766e', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 440, y: 80, width: 280, height: 100, label: truncate(safeGet(data.concepts, 1, 'Item B'), 22), style: { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_arrow', from: [360, 130], to: [440, 130], label: truncate(safeGet(data.relationships, 0, 'vs'), 8), style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'Key difference explained'), 55), position: [100, 240], width: 600, style: { bg: '#f8fafc', stroke: '#94a3b8', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Takeaway', position: [400, 42], style: { fontSize: 20, color: '#16a34a', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || safeGet(data.definitions, 1, 'Summary of comparison'), 60), position: [100, 80], width: 600, style: { bg: '#f0fdf4', stroke: '#16a34a', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 29,
    name: "multi_perspective",
    category: "comparison",
    description: "Same concept viewed from different angles",
    tags: ["comparison","contrast","analytical"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 80, y: 80, width: 280, height: 100, label: truncate(safeGet(data.concepts, 0, 'Item A'), 22), style: { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 440, y: 80, width: 280, height: 100, label: truncate(safeGet(data.concepts, 1, 'Item B'), 22), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_arrow', from: [360, 130], to: [440, 130], label: truncate(safeGet(data.relationships, 0, 'vs'), 8), style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'Key difference explained'), 55), position: [100, 240], width: 600, style: { bg: '#f8fafc', stroke: '#94a3b8', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Takeaway', position: [400, 42], style: { fontSize: 20, color: '#d97706', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || safeGet(data.definitions, 1, 'Summary of comparison'), 60), position: [100, 80], width: 600, style: { bg: '#fef3c7', stroke: '#d97706', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 30,
    name: "ranking_order",
    category: "comparison",
    description: "Ranked items from most to least important",
    tags: ["comparison","contrast","analytical"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 80, y: 80, width: 280, height: 100, label: truncate(safeGet(data.concepts, 0, 'Item A'), 22), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_rect', x: 440, y: 80, width: 280, height: 100, label: truncate(safeGet(data.concepts, 1, 'Item B'), 22), style: { fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2, rx: 12 } });
      t += 6;
      scenes.push({ time: t, type: 'draw_arrow', from: [360, 130], to: [440, 130], label: truncate(safeGet(data.relationships, 0, 'vs'), 8), style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'Key difference explained'), 55), position: [100, 240], width: 600, style: { bg: '#f8fafc', stroke: '#94a3b8', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Takeaway', position: [400, 42], style: { fontSize: 20, color: '#7c3aed', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || safeGet(data.definitions, 1, 'Summary of comparison'), 60), position: [100, 80], width: 600, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 31,
    name: "tree_structure",
    category: "hierarchy_tree",
    description: "Top-down tree with parent-child nodes",
    tags: ["hierarchy","structure","organization"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const concepts = (data.concepts || []).slice(0, 4);
      // Root node
      scenes.push({ time: t, type: 'draw_rect', x: 300, y: 70, width: 200, height: 50, label: truncate(concepts[0] || data.title, 18), style: { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2, rx: 10 } });
      t += 7;
      // Children
      for (let ci = 1; ci < Math.min(concepts.length, 4); ci++) {
        const cx = 100 + (ci - 1) * 240;
        scenes.push({ time: t, type: 'draw_arrow', from: [400, 120], to: [cx + 100, 170], label: '', style: { color: '#64748b', strokeWidth: 2 } });
        t += 3;
        scenes.push({ time: t, type: 'draw_rect', x: cx, y: 170, width: 200, height: 50, label: truncate(concepts[ci], 16), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 8 } });
        t += 6;
      }
      // Page 2: Details
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Structure Details', position: [400, 38], style: { fontSize: 20, color: '#d97706', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, data.summary || 'The hierarchy shows how components relate'), 60), position: [80, 80], width: 640, style: { bg: '#fef3c7', stroke: '#d97706', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'draw_object', object_type: 'layers', position: [300, 200], size: [200, 180], label: truncate(data.title, 14), annotations: concepts.slice(0, 3).map(c => truncate(c, 14)) });
      t += 8;
      return scenes;
    }
  },

  {
    id: 32,
    name: "nested_boxes",
    category: "hierarchy_tree",
    description: "Nested containers showing containment",
    tags: ["hierarchy","structure","organization"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const concepts = (data.concepts || []).slice(0, 4);
      // Root node
      scenes.push({ time: t, type: 'draw_rect', x: 300, y: 70, width: 200, height: 50, label: truncate(concepts[0] || data.title, 18), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 25 } });
      t += 7;
      // Children
      for (let ci = 1; ci < Math.min(concepts.length, 4); ci++) {
        const cx = 100 + (ci - 1) * 240;
        scenes.push({ time: t, type: 'draw_arrow', from: [400, 120], to: [cx + 100, 170], label: '', style: { color: '#64748b', strokeWidth: 2 } });
        t += 3;
        scenes.push({ time: t, type: 'draw_rect', x: cx, y: 170, width: 200, height: 50, label: truncate(concepts[ci], 16), style: { fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2, rx: 8 } });
        t += 6;
      }
      // Page 2: Details
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Structure Details', position: [400, 38], style: { fontSize: 20, color: '#7c3aed', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, data.summary || 'The hierarchy shows how components relate'), 60), position: [80, 80], width: 640, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'draw_object', object_type: 'network', position: [300, 200], size: [200, 180], label: truncate(data.title, 14), annotations: concepts.slice(0, 3).map(c => truncate(c, 14)) });
      t += 8;
      return scenes;
    }
  },

  {
    id: 33,
    name: "org_chart",
    category: "hierarchy_tree",
    description: "Organizational chart layout",
    tags: ["hierarchy","structure","organization"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const concepts = (data.concepts || []).slice(0, 4);
      // Root node
      scenes.push({ time: t, type: 'draw_rect', x: 300, y: 70, width: 200, height: 50, label: truncate(concepts[0] || data.title, 18), style: { fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2, rx: 10 } });
      t += 7;
      // Children
      for (let ci = 1; ci < Math.min(concepts.length, 4); ci++) {
        const cx = 100 + (ci - 1) * 240;
        scenes.push({ time: t, type: 'draw_arrow', from: [400, 120], to: [cx + 100, 170], label: '', style: { color: '#64748b', strokeWidth: 2 } });
        t += 3;
        scenes.push({ time: t, type: 'draw_rect', x: cx, y: 170, width: 200, height: 50, label: truncate(concepts[ci], 16), style: { fill: '#f5f3ff', stroke: '#7c3aed', strokeWidth: 2, rx: 8 } });
        t += 6;
      }
      // Page 2: Details
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Structure Details', position: [400, 38], style: { fontSize: 20, color: '#be123c', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, data.summary || 'The hierarchy shows how components relate'), 60), position: [80, 80], width: 640, style: { bg: '#fff1f2', stroke: '#be123c', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'draw_object', object_type: 'checklist', position: [300, 200], size: [200, 180], label: truncate(data.title, 14), annotations: concepts.slice(0, 3).map(c => truncate(c, 14)) });
      t += 8;
      return scenes;
    }
  },

  {
    id: 34,
    name: "pyramid_levels",
    category: "hierarchy_tree",
    description: "Pyramid showing importance levels",
    tags: ["hierarchy","structure","organization"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const concepts = (data.concepts || []).slice(0, 4);
      // Root node
      scenes.push({ time: t, type: 'draw_rect', x: 300, y: 70, width: 200, height: 50, label: truncate(concepts[0] || data.title, 18), style: { fill: '#f5f3ff', stroke: '#7c3aed', strokeWidth: 2, rx: 25 } });
      t += 7;
      // Children
      for (let ci = 1; ci < Math.min(concepts.length, 4); ci++) {
        const cx = 100 + (ci - 1) * 240;
        scenes.push({ time: t, type: 'draw_arrow', from: [400, 120], to: [cx + 100, 170], label: '', style: { color: '#64748b', strokeWidth: 2 } });
        t += 3;
        scenes.push({ time: t, type: 'draw_rect', x: cx, y: 170, width: 200, height: 50, label: truncate(concepts[ci], 16), style: { fill: '#fff1f2', stroke: '#be123c', strokeWidth: 2, rx: 8 } });
        t += 6;
      }
      // Page 2: Details
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Structure Details', position: [400, 38], style: { fontSize: 20, color: '#0891b2', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, data.summary || 'The hierarchy shows how components relate'), 60), position: [80, 80], width: 640, style: { bg: '#ecfeff', stroke: '#0891b2', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'draw_object', object_type: 'document', position: [300, 200], size: [200, 180], label: truncate(data.title, 14), annotations: concepts.slice(0, 3).map(c => truncate(c, 14)) });
      t += 8;
      return scenes;
    }
  },

  {
    id: 35,
    name: "mind_map",
    category: "hierarchy_tree",
    description: "Central idea with radiating branches",
    tags: ["hierarchy","structure","organization"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const concepts = (data.concepts || []).slice(0, 4);
      // Root node
      scenes.push({ time: t, type: 'draw_rect', x: 300, y: 70, width: 200, height: 50, label: truncate(concepts[0] || data.title, 18), style: { fill: '#fff1f2', stroke: '#be123c', strokeWidth: 2, rx: 10 } });
      t += 7;
      // Children
      for (let ci = 1; ci < Math.min(concepts.length, 4); ci++) {
        const cx = 100 + (ci - 1) * 240;
        scenes.push({ time: t, type: 'draw_arrow', from: [400, 120], to: [cx + 100, 170], label: '', style: { color: '#64748b', strokeWidth: 2 } });
        t += 3;
        scenes.push({ time: t, type: 'draw_rect', x: cx, y: 170, width: 200, height: 50, label: truncate(concepts[ci], 16), style: { fill: '#ecfeff', stroke: '#0891b2', strokeWidth: 2, rx: 8 } });
        t += 6;
      }
      // Page 2: Details
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Structure Details', position: [400, 38], style: { fontSize: 20, color: '#0f766e', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, data.summary || 'The hierarchy shows how components relate'), 60), position: [80, 80], width: 640, style: { bg: '#f0fdfa', stroke: '#0f766e', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'draw_object', object_type: 'gear', position: [300, 200], size: [200, 180], label: truncate(data.title, 14), annotations: concepts.slice(0, 3).map(c => truncate(c, 14)) });
      t += 8;
      return scenes;
    }
  },

  {
    id: 36,
    name: "category_groups",
    category: "hierarchy_tree",
    description: "Grouped categories with items",
    tags: ["hierarchy","structure","organization"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const concepts = (data.concepts || []).slice(0, 4);
      // Root node
      scenes.push({ time: t, type: 'draw_rect', x: 300, y: 70, width: 200, height: 50, label: truncate(concepts[0] || data.title, 18), style: { fill: '#ecfeff', stroke: '#0891b2', strokeWidth: 2, rx: 25 } });
      t += 7;
      // Children
      for (let ci = 1; ci < Math.min(concepts.length, 4); ci++) {
        const cx = 100 + (ci - 1) * 240;
        scenes.push({ time: t, type: 'draw_arrow', from: [400, 120], to: [cx + 100, 170], label: '', style: { color: '#64748b', strokeWidth: 2 } });
        t += 3;
        scenes.push({ time: t, type: 'draw_rect', x: cx, y: 170, width: 200, height: 50, label: truncate(concepts[ci], 16), style: { fill: '#f0fdfa', stroke: '#0f766e', strokeWidth: 2, rx: 8 } });
        t += 6;
      }
      // Page 2: Details
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Structure Details', position: [400, 38], style: { fontSize: 20, color: '#2563eb', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, data.summary || 'The hierarchy shows how components relate'), 60), position: [80, 80], width: 640, style: { bg: '#eff6ff', stroke: '#2563eb', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'draw_object', object_type: 'triangle', position: [300, 200], size: [200, 180], label: truncate(data.title, 14), annotations: concepts.slice(0, 3).map(c => truncate(c, 14)) });
      t += 8;
      return scenes;
    }
  },

  {
    id: 37,
    name: "containment_diagram",
    category: "hierarchy_tree",
    description: "Shows what contains what",
    tags: ["hierarchy","structure","organization"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const concepts = (data.concepts || []).slice(0, 4);
      // Root node
      scenes.push({ time: t, type: 'draw_rect', x: 300, y: 70, width: 200, height: 50, label: truncate(concepts[0] || data.title, 18), style: { fill: '#f0fdfa', stroke: '#0f766e', strokeWidth: 2, rx: 10 } });
      t += 7;
      // Children
      for (let ci = 1; ci < Math.min(concepts.length, 4); ci++) {
        const cx = 100 + (ci - 1) * 240;
        scenes.push({ time: t, type: 'draw_arrow', from: [400, 120], to: [cx + 100, 170], label: '', style: { color: '#64748b', strokeWidth: 2 } });
        t += 3;
        scenes.push({ time: t, type: 'draw_rect', x: cx, y: 170, width: 200, height: 50, label: truncate(concepts[ci], 16), style: { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2, rx: 8 } });
        t += 6;
      }
      // Page 2: Details
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Structure Details', position: [400, 38], style: { fontSize: 20, color: '#16a34a', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, data.summary || 'The hierarchy shows how components relate'), 60), position: [80, 80], width: 640, style: { bg: '#f0fdf4', stroke: '#16a34a', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'draw_object', object_type: 'compass', position: [300, 200], size: [200, 180], label: truncate(data.title, 14), annotations: concepts.slice(0, 3).map(c => truncate(c, 14)) });
      t += 8;
      return scenes;
    }
  },

  {
    id: 38,
    name: "radial_hierarchy",
    category: "hierarchy_tree",
    description: "Radial burst from center",
    tags: ["hierarchy","structure","organization"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const concepts = (data.concepts || []).slice(0, 4);
      // Root node
      scenes.push({ time: t, type: 'draw_rect', x: 300, y: 70, width: 200, height: 50, label: truncate(concepts[0] || data.title, 18), style: { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2, rx: 25 } });
      t += 7;
      // Children
      for (let ci = 1; ci < Math.min(concepts.length, 4); ci++) {
        const cx = 100 + (ci - 1) * 240;
        scenes.push({ time: t, type: 'draw_arrow', from: [400, 120], to: [cx + 100, 170], label: '', style: { color: '#64748b', strokeWidth: 2 } });
        t += 3;
        scenes.push({ time: t, type: 'draw_rect', x: cx, y: 170, width: 200, height: 50, label: truncate(concepts[ci], 16), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 8 } });
        t += 6;
      }
      // Page 2: Details
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Structure Details', position: [400, 38], style: { fontSize: 20, color: '#d97706', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, data.summary || 'The hierarchy shows how components relate'), 60), position: [80, 80], width: 640, style: { bg: '#fef3c7', stroke: '#d97706', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'draw_object', object_type: 'target', position: [300, 200], size: [200, 180], label: truncate(data.title, 14), annotations: concepts.slice(0, 3).map(c => truncate(c, 14)) });
      t += 8;
      return scenes;
    }
  },

  {
    id: 39,
    name: "indented_outline",
    category: "hierarchy_tree",
    description: "Indented text outline with connectors",
    tags: ["hierarchy","structure","organization"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const concepts = (data.concepts || []).slice(0, 4);
      // Root node
      scenes.push({ time: t, type: 'draw_rect', x: 300, y: 70, width: 200, height: 50, label: truncate(concepts[0] || data.title, 18), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 10 } });
      t += 7;
      // Children
      for (let ci = 1; ci < Math.min(concepts.length, 4); ci++) {
        const cx = 100 + (ci - 1) * 240;
        scenes.push({ time: t, type: 'draw_arrow', from: [400, 120], to: [cx + 100, 170], label: '', style: { color: '#64748b', strokeWidth: 2 } });
        t += 3;
        scenes.push({ time: t, type: 'draw_rect', x: cx, y: 170, width: 200, height: 50, label: truncate(concepts[ci], 16), style: { fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2, rx: 8 } });
        t += 6;
      }
      // Page 2: Details
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Structure Details', position: [400, 38], style: { fontSize: 20, color: '#7c3aed', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, data.summary || 'The hierarchy shows how components relate'), 60), position: [80, 80], width: 640, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'draw_object', object_type: 'book', position: [300, 200], size: [200, 180], label: truncate(data.title, 14), annotations: concepts.slice(0, 3).map(c => truncate(c, 14)) });
      t += 8;
      return scenes;
    }
  },

  {
    id: 40,
    name: "dependency_graph",
    category: "hierarchy_tree",
    description: "Dependency arrows between components",
    tags: ["hierarchy","structure","organization"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const concepts = (data.concepts || []).slice(0, 4);
      // Root node
      scenes.push({ time: t, type: 'draw_rect', x: 300, y: 70, width: 200, height: 50, label: truncate(concepts[0] || data.title, 18), style: { fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2, rx: 25 } });
      t += 7;
      // Children
      for (let ci = 1; ci < Math.min(concepts.length, 4); ci++) {
        const cx = 100 + (ci - 1) * 240;
        scenes.push({ time: t, type: 'draw_arrow', from: [400, 120], to: [cx + 100, 170], label: '', style: { color: '#64748b', strokeWidth: 2 } });
        t += 3;
        scenes.push({ time: t, type: 'draw_rect', x: cx, y: 170, width: 200, height: 50, label: truncate(concepts[ci], 16), style: { fill: '#f5f3ff', stroke: '#7c3aed', strokeWidth: 2, rx: 8 } });
        t += 6;
      }
      // Page 2: Details
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Structure Details', position: [400, 38], style: { fontSize: 20, color: '#be123c', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, data.summary || 'The hierarchy shows how components relate'), 60), position: [80, 80], width: 640, style: { bg: '#fff1f2', stroke: '#be123c', color: '#374151' } });
      t += 7;
      scenes.push({ time: t, type: 'draw_object', object_type: 'dialogue', position: [300, 200], size: [200, 180], label: truncate(data.title, 14), annotations: concepts.slice(0, 3).map(c => truncate(c, 14)) });
      t += 8;
      return scenes;
    }
  },

  {
    id: 41,
    name: "bar_chart_story",
    category: "data_visualization",
    description: "Bar chart with narrated interpretation",
    tags: ["data","chart","graph"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const graphLabels = (data.graphData && data.graphData.labels) || (data.concepts || []).slice(0, 4);
      const graphValues = (data.graphData && data.graphData.values) || [30, 65, 45, 80];
      scenes.push({ time: t, type: 'draw_graph', graph_type: 'bar', title: truncate(safeGet(data.concepts, 0, 'Data'), 18), position: [100, 80], size: [600, 280], data: { values: graphValues.slice(0, 4), labels: graphLabels.slice(0, 4).map(l => truncate(l, 10)) } });
      t += 10;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'The chart reveals key patterns'), 55), position: [100, 390], width: 600, style: { bg: '#eff6ff', stroke: '#2563eb', color: '#374151' } });
      t += 8;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Analysis', position: [400, 42], style: { fontSize: 20, color: '#16a34a', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The data supports the conclusion that...', 60), position: [100, 80], width: 600, style: { bg: '#f0fdf4', stroke: '#16a34a', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 42,
    name: "line_trend",
    category: "data_visualization",
    description: "Line chart showing trends over time",
    tags: ["data","chart","graph"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const graphLabels = (data.graphData && data.graphData.labels) || (data.concepts || []).slice(0, 4);
      const graphValues = (data.graphData && data.graphData.values) || [30, 65, 45, 80];
      scenes.push({ time: t, type: 'draw_graph', graph_type: 'line', title: truncate(safeGet(data.concepts, 0, 'Data'), 18), position: [100, 80], size: [600, 280], data: { values: graphValues.slice(0, 4), labels: graphLabels.slice(0, 4).map(l => truncate(l, 10)) } });
      t += 10;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'The chart reveals key patterns'), 55), position: [100, 390], width: 600, style: { bg: '#f0fdf4', stroke: '#16a34a', color: '#374151' } });
      t += 8;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Analysis', position: [400, 42], style: { fontSize: 20, color: '#d97706', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The data supports the conclusion that...', 60), position: [100, 80], width: 600, style: { bg: '#fef3c7', stroke: '#d97706', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 43,
    name: "coordinate_plot",
    category: "data_visualization",
    description: "Coordinate system with plotted function",
    tags: ["data","chart","math"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_coordinate_system', origin: [100, 380], size: [600, 300], x_label: truncate(safeGet(data.concepts, 0, 'X'), 12), y_label: truncate(safeGet(data.concepts, 1, 'Y'), 12), plot_points: (data.graphData && data.graphData.values ? data.graphData.values.map((v, i) => [i * 80 + 40, v * 30]) : [[60, 50], [140, 120], [220, 90], [300, 200], [380, 160]]) });
      t += 10;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'The graph shows the relationship'), 55), position: [100, 420], width: 600, style: { bg: '#eff6ff', stroke: '#2563eb', color: '#1e3a5f' } });
      t += 8;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Interpretation', position: [400, 42], style: { fontSize: 20, color: '#16a34a', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The data reveals an important pattern', 60), position: [100, 80], width: 600, style: { bg: '#f0fdf4', stroke: '#16a34a', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 44,
    name: "data_table_reveal",
    category: "data_visualization",
    description: "Table data revealed row by row",
    tags: ["data","chart","table"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const tableHeaders = (data.tableData && data.tableData.headers) || (data.concepts || []).slice(0, 3);
      const tableRows = (data.tableData && data.tableData.rows) || [(data.definitions || []).slice(0, 3), (data.examples || data.relationships || []).slice(0, 3)];
      scenes.push({ time: t, type: 'draw_table', headers: tableHeaders.map(h => truncate(h, 16)), rows: tableRows.map(r => (r || []).map(c => truncate(c, 16))), position: [80, 80], cell_width: 200, cell_height: 36 });
      t += 10;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The data shows clear patterns', 55), position: [100, 320], width: 600, style: { bg: '#fef3c7', stroke: '#d97706', color: '#374151' } });
      t += 8;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Insight', position: [400, 42], style: { fontSize: 20, color: '#7c3aed', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'From this data we can conclude...'), 60), position: [100, 80], width: 600, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 45,
    name: "pie_breakdown",
    category: "data_visualization",
    description: "Pie-chart-style breakdown of parts",
    tags: ["data","chart","graph"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const graphLabels = (data.graphData && data.graphData.labels) || (data.concepts || []).slice(0, 4);
      const graphValues = (data.graphData && data.graphData.values) || [30, 65, 45, 80];
      scenes.push({ time: t, type: 'draw_graph', graph_type: 'bar', title: truncate(safeGet(data.concepts, 0, 'Data'), 18), position: [100, 80], size: [600, 280], data: { values: graphValues.slice(0, 4), labels: graphLabels.slice(0, 4).map(l => truncate(l, 10)) } });
      t += 10;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'The chart reveals key patterns'), 55), position: [100, 390], width: 600, style: { bg: '#fff1f2', stroke: '#be123c', color: '#374151' } });
      t += 8;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Analysis', position: [400, 42], style: { fontSize: 20, color: '#0891b2', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The data supports the conclusion that...', 60), position: [100, 80], width: 600, style: { bg: '#ecfeff', stroke: '#0891b2', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 46,
    name: "scatter_analysis",
    category: "data_visualization",
    description: "Scatter plot showing correlations",
    tags: ["data","chart","math"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_coordinate_system', origin: [100, 380], size: [600, 300], x_label: truncate(safeGet(data.concepts, 0, 'X'), 12), y_label: truncate(safeGet(data.concepts, 1, 'Y'), 12), plot_points: (data.graphData && data.graphData.values ? data.graphData.values.map((v, i) => [i * 80 + 40, v * 30]) : [[60, 50], [140, 120], [220, 90], [300, 200], [380, 160]]) });
      t += 10;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'The graph shows the relationship'), 55), position: [100, 420], width: 600, style: { bg: '#eff6ff', stroke: '#2563eb', color: '#1e3a5f' } });
      t += 8;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Interpretation', position: [400, 42], style: { fontSize: 20, color: '#16a34a', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The data reveals an important pattern', 60), position: [100, 80], width: 600, style: { bg: '#f0fdf4', stroke: '#16a34a', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 47,
    name: "histogram_dist",
    category: "data_visualization",
    description: "Histogram showing distribution",
    tags: ["data","chart","table"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const tableHeaders = (data.tableData && data.tableData.headers) || (data.concepts || []).slice(0, 3);
      const tableRows = (data.tableData && data.tableData.rows) || [(data.definitions || []).slice(0, 3), (data.examples || data.relationships || []).slice(0, 3)];
      scenes.push({ time: t, type: 'draw_table', headers: tableHeaders.map(h => truncate(h, 16)), rows: tableRows.map(r => (r || []).map(c => truncate(c, 16))), position: [80, 80], cell_width: 200, cell_height: 36 });
      t += 10;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The data shows clear patterns', 55), position: [100, 320], width: 600, style: { bg: '#fef3c7', stroke: '#d97706', color: '#374151' } });
      t += 8;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Insight', position: [400, 42], style: { fontSize: 20, color: '#7c3aed', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'From this data we can conclude...'), 60), position: [100, 80], width: 600, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 48,
    name: "metric_dashboard",
    category: "data_visualization",
    description: "Dashboard-style metrics display",
    tags: ["data","chart","graph"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const graphLabels = (data.graphData && data.graphData.labels) || (data.concepts || []).slice(0, 4);
      const graphValues = (data.graphData && data.graphData.values) || [30, 65, 45, 80];
      scenes.push({ time: t, type: 'draw_graph', graph_type: 'line', title: truncate(safeGet(data.concepts, 0, 'Data'), 18), position: [100, 80], size: [600, 280], data: { values: graphValues.slice(0, 4), labels: graphLabels.slice(0, 4).map(l => truncate(l, 10)) } });
      t += 10;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'The chart reveals key patterns'), 55), position: [100, 390], width: 600, style: { bg: '#eff6ff', stroke: '#2563eb', color: '#374151' } });
      t += 8;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Analysis', position: [400, 42], style: { fontSize: 20, color: '#16a34a', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The data supports the conclusion that...', 60), position: [100, 80], width: 600, style: { bg: '#f0fdf4', stroke: '#16a34a', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 49,
    name: "growth_chart",
    category: "data_visualization",
    description: "Growth line with annotations",
    tags: ["data","chart","math"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_coordinate_system', origin: [100, 380], size: [600, 300], x_label: truncate(safeGet(data.concepts, 0, 'X'), 12), y_label: truncate(safeGet(data.concepts, 1, 'Y'), 12), plot_points: (data.graphData && data.graphData.values ? data.graphData.values.map((v, i) => [i * 80 + 40, v * 30]) : [[60, 50], [140, 120], [220, 90], [300, 200], [380, 160]]) });
      t += 10;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'The graph shows the relationship'), 55), position: [100, 420], width: 600, style: { bg: '#eff6ff', stroke: '#2563eb', color: '#1e3a5f' } });
      t += 8;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Interpretation', position: [400, 42], style: { fontSize: 20, color: '#16a34a', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The data reveals an important pattern', 60), position: [100, 80], width: 600, style: { bg: '#f0fdf4', stroke: '#16a34a', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 50,
    name: "comparison_bars",
    category: "data_visualization",
    description: "Side-by-side bar comparison",
    tags: ["data","chart","graph"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      const graphLabels = (data.graphData && data.graphData.labels) || (data.concepts || []).slice(0, 4);
      const graphValues = (data.graphData && data.graphData.values) || [30, 65, 45, 80];
      scenes.push({ time: t, type: 'draw_graph', graph_type: 'line', title: truncate(safeGet(data.concepts, 0, 'Data'), 18), position: [100, 80], size: [600, 280], data: { values: graphValues.slice(0, 4), labels: graphLabels.slice(0, 4).map(l => truncate(l, 10)) } });
      t += 10;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.definitions, 0, 'The chart reveals key patterns'), 55), position: [100, 390], width: 600, style: { bg: '#fef3c7', stroke: '#d97706', color: '#374151' } });
      t += 8;
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Analysis', position: [400, 42], style: { fontSize: 20, color: '#7c3aed', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The data supports the conclusion that...', 60), position: [100, 80], width: 600, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 51,
    name: "worked_example",
    category: "applied_teaching",
    description: "Step-by-step worked example with solution",
    tags: ["applied","practical","example"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_badge', content: 'Worked Example', position: [50, 65], style: { bg: '#2563eb', color: '#fff', fontSize: 12 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_rect', x: 60, y: 90, width: 680, height: 110, label: truncate(safeGet(data.concepts, 0, 'Main focus') + ': ' + truncate(safeGet(data.definitions, 0, ''), 35), 55), style: { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2, rx: 14 } });
      t += 8;
      scenes.push({ time: t, type: 'draw_arrow', from: [400, 200], to: [400, 250], label: 'applies to', style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.examples, 0, safeGet(data.relationships, 0, 'Practical application shown here')), 60), position: [80, 260], width: 640, style: { bg: '#f0fdf4', stroke: '#16a34a', color: '#374151' } });
      t += 8;
      // Page 2
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Learning', position: [400, 42], style: { fontSize: 20, color: '#d97706', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_object', object_type: 'checklist', position: [300, 100], size: [200, 180], label: truncate(safeGet(data.concepts, 0, ''), 14), annotations: (data.concepts || []).slice(1, 3).map(c => truncate(c, 14)) });
      t += 8;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The practical takeaway is...', 60), position: [80, 340], width: 640, style: { bg: '#fef3c7', stroke: '#d97706', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 52,
    name: "case_study",
    category: "applied_teaching",
    description: "Real case study analysis",
    tags: ["applied","practical","example"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_badge', content: 'Case Study', position: [50, 65], style: { bg: '#16a34a', color: '#fff', fontSize: 12 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_rect', x: 60, y: 90, width: 680, height: 110, label: truncate(safeGet(data.concepts, 0, 'Main focus') + ': ' + truncate(safeGet(data.definitions, 0, ''), 35), 55), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 14 } });
      t += 8;
      scenes.push({ time: t, type: 'draw_arrow', from: [400, 200], to: [400, 250], label: 'applies to', style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.examples, 0, safeGet(data.relationships, 0, 'Practical application shown here')), 60), position: [80, 260], width: 640, style: { bg: '#fef3c7', stroke: '#d97706', color: '#374151' } });
      t += 8;
      // Page 2
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Learning', position: [400, 42], style: { fontSize: 20, color: '#7c3aed', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_object', object_type: 'target', position: [300, 100], size: [200, 180], label: truncate(safeGet(data.concepts, 0, ''), 14), annotations: (data.concepts || []).slice(1, 3).map(c => truncate(c, 14)) });
      t += 8;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The practical takeaway is...', 60), position: [80, 340], width: 640, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 53,
    name: "real_world_app",
    category: "applied_teaching",
    description: "Real-world application demonstration",
    tags: ["applied","practical","example"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_badge', content: 'Real World App', position: [50, 65], style: { bg: '#d97706', color: '#fff', fontSize: 12 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_rect', x: 60, y: 90, width: 680, height: 110, label: truncate(safeGet(data.concepts, 0, 'Main focus') + ': ' + truncate(safeGet(data.definitions, 0, ''), 35), 55), style: { fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2, rx: 14 } });
      t += 8;
      scenes.push({ time: t, type: 'draw_arrow', from: [400, 200], to: [400, 250], label: 'applies to', style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.examples, 0, safeGet(data.relationships, 0, 'Practical application shown here')), 60), position: [80, 260], width: 640, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 8;
      // Page 2
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Learning', position: [400, 42], style: { fontSize: 20, color: '#be123c', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_object', object_type: 'lightbulb', position: [300, 100], size: [200, 180], label: truncate(safeGet(data.concepts, 0, ''), 14), annotations: (data.concepts || []).slice(1, 3).map(c => truncate(c, 14)) });
      t += 8;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The practical takeaway is...', 60), position: [80, 340], width: 640, style: { bg: '#fff1f2', stroke: '#be123c', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 54,
    name: "problem_solve",
    category: "applied_teaching",
    description: "Problem → Analysis → Solution flow",
    tags: ["applied","practical","example"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_badge', content: 'Problem Solve', position: [50, 65], style: { bg: '#7c3aed', color: '#fff', fontSize: 12 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_rect', x: 60, y: 90, width: 680, height: 110, label: truncate(safeGet(data.concepts, 0, 'Main focus') + ': ' + truncate(safeGet(data.definitions, 0, ''), 35), 55), style: { fill: '#f5f3ff', stroke: '#7c3aed', strokeWidth: 2, rx: 14 } });
      t += 8;
      scenes.push({ time: t, type: 'draw_arrow', from: [400, 200], to: [400, 250], label: 'applies to', style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.examples, 0, safeGet(data.relationships, 0, 'Practical application shown here')), 60), position: [80, 260], width: 640, style: { bg: '#fff1f2', stroke: '#be123c', color: '#374151' } });
      t += 8;
      // Page 2
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Learning', position: [400, 42], style: { fontSize: 20, color: '#0891b2', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_object', object_type: 'gear', position: [300, 100], size: [200, 180], label: truncate(safeGet(data.concepts, 0, ''), 14), annotations: (data.concepts || []).slice(1, 3).map(c => truncate(c, 14)) });
      t += 8;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The practical takeaway is...', 60), position: [80, 340], width: 640, style: { bg: '#ecfeff', stroke: '#0891b2', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 55,
    name: "experiment_lab",
    category: "applied_teaching",
    description: "Experiment/lab procedure layout",
    tags: ["applied","practical","example"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_badge', content: 'Experiment Lab', position: [50, 65], style: { bg: '#be123c', color: '#fff', fontSize: 12 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_rect', x: 60, y: 90, width: 680, height: 110, label: truncate(safeGet(data.concepts, 0, 'Main focus') + ': ' + truncate(safeGet(data.definitions, 0, ''), 35), 55), style: { fill: '#fff1f2', stroke: '#be123c', strokeWidth: 2, rx: 14 } });
      t += 8;
      scenes.push({ time: t, type: 'draw_arrow', from: [400, 200], to: [400, 250], label: 'applies to', style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.examples, 0, safeGet(data.relationships, 0, 'Practical application shown here')), 60), position: [80, 260], width: 640, style: { bg: '#ecfeff', stroke: '#0891b2', color: '#374151' } });
      t += 8;
      // Page 2
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Learning', position: [400, 42], style: { fontSize: 20, color: '#0f766e', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_object', object_type: 'document', position: [300, 100], size: [200, 180], label: truncate(safeGet(data.concepts, 0, ''), 14), annotations: (data.concepts || []).slice(1, 3).map(c => truncate(c, 14)) });
      t += 8;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The practical takeaway is...', 60), position: [80, 340], width: 640, style: { bg: '#f0fdfa', stroke: '#0f766e', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 56,
    name: "debate_format",
    category: "applied_teaching",
    description: "Two-sided debate/argument format",
    tags: ["applied","practical","review"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_badge', content: 'Debate Format', position: [50, 65], style: { bg: '#0891b2', color: '#fff', fontSize: 12 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_rect', x: 60, y: 90, width: 680, height: 110, label: truncate(safeGet(data.concepts, 0, 'Main focus') + ': ' + truncate(safeGet(data.definitions, 0, ''), 35), 55), style: { fill: '#ecfeff', stroke: '#0891b2', strokeWidth: 2, rx: 14 } });
      t += 8;
      scenes.push({ time: t, type: 'draw_arrow', from: [400, 200], to: [400, 250], label: 'applies to', style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.examples, 0, safeGet(data.relationships, 0, 'Practical application shown here')), 60), position: [80, 260], width: 640, style: { bg: '#f0fdfa', stroke: '#0f766e', color: '#374151' } });
      t += 8;
      // Page 2
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Learning', position: [400, 42], style: { fontSize: 20, color: '#2563eb', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_object', object_type: 'dialogue', position: [300, 100], size: [200, 180], label: truncate(safeGet(data.concepts, 0, ''), 14), annotations: (data.concepts || []).slice(1, 3).map(c => truncate(c, 14)) });
      t += 8;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The practical takeaway is...', 60), position: [80, 340], width: 640, style: { bg: '#eff6ff', stroke: '#2563eb', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 57,
    name: "checklist_verify",
    category: "applied_teaching",
    description: "Checklist verification approach",
    tags: ["applied","practical","review"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_badge', content: 'Checklist Verify', position: [50, 65], style: { bg: '#0f766e', color: '#fff', fontSize: 12 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_rect', x: 60, y: 90, width: 680, height: 110, label: truncate(safeGet(data.concepts, 0, 'Main focus') + ': ' + truncate(safeGet(data.definitions, 0, ''), 35), 55), style: { fill: '#f0fdfa', stroke: '#0f766e', strokeWidth: 2, rx: 14 } });
      t += 8;
      scenes.push({ time: t, type: 'draw_arrow', from: [400, 200], to: [400, 250], label: 'applies to', style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.examples, 0, safeGet(data.relationships, 0, 'Practical application shown here')), 60), position: [80, 260], width: 640, style: { bg: '#eff6ff', stroke: '#2563eb', color: '#374151' } });
      t += 8;
      // Page 2
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Learning', position: [400, 42], style: { fontSize: 20, color: '#16a34a', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_object', object_type: 'flask', position: [300, 100], size: [200, 180], label: truncate(safeGet(data.concepts, 0, ''), 14), annotations: (data.concepts || []).slice(1, 3).map(c => truncate(c, 14)) });
      t += 8;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The practical takeaway is...', 60), position: [80, 340], width: 640, style: { bg: '#f0fdf4', stroke: '#16a34a', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 58,
    name: "scenario_walk",
    category: "applied_teaching",
    description: "Walk through a real scenario",
    tags: ["applied","practical","review"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_badge', content: 'Scenario Walk', position: [50, 65], style: { bg: '#2563eb', color: '#fff', fontSize: 12 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_rect', x: 60, y: 90, width: 680, height: 110, label: truncate(safeGet(data.concepts, 0, 'Main focus') + ': ' + truncate(safeGet(data.definitions, 0, ''), 35), 55), style: { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2, rx: 14 } });
      t += 8;
      scenes.push({ time: t, type: 'draw_arrow', from: [400, 200], to: [400, 250], label: 'applies to', style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.examples, 0, safeGet(data.relationships, 0, 'Practical application shown here')), 60), position: [80, 260], width: 640, style: { bg: '#f0fdf4', stroke: '#16a34a', color: '#374151' } });
      t += 8;
      // Page 2
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Learning', position: [400, 42], style: { fontSize: 20, color: '#d97706', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_object', object_type: 'compass', position: [300, 100], size: [200, 180], label: truncate(safeGet(data.concepts, 0, ''), 14), annotations: (data.concepts || []).slice(1, 3).map(c => truncate(c, 14)) });
      t += 8;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The practical takeaway is...', 60), position: [80, 340], width: 640, style: { bg: '#fef3c7', stroke: '#d97706', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 59,
    name: "rule_exception",
    category: "applied_teaching",
    description: "Rule with its exceptions shown",
    tags: ["applied","practical","review"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_badge', content: 'Rule Exception', position: [50, 65], style: { bg: '#16a34a', color: '#fff', fontSize: 12 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_rect', x: 60, y: 90, width: 680, height: 110, label: truncate(safeGet(data.concepts, 0, 'Main focus') + ': ' + truncate(safeGet(data.definitions, 0, ''), 35), 55), style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 14 } });
      t += 8;
      scenes.push({ time: t, type: 'draw_arrow', from: [400, 200], to: [400, 250], label: 'applies to', style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.examples, 0, safeGet(data.relationships, 0, 'Practical application shown here')), 60), position: [80, 260], width: 640, style: { bg: '#fef3c7', stroke: '#d97706', color: '#374151' } });
      t += 8;
      // Page 2
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Learning', position: [400, 42], style: { fontSize: 20, color: '#7c3aed', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_object', object_type: 'book', position: [300, 100], size: [200, 180], label: truncate(safeGet(data.concepts, 0, ''), 14), annotations: (data.concepts || []).slice(1, 3).map(c => truncate(c, 14)) });
      t += 8;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The practical takeaway is...', 60), position: [80, 340], width: 640, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 8;
      return scenes;
    }
  },

  {
    id: 60,
    name: "teach_back",
    category: "applied_teaching",
    description: "Teach-back summary and review",
    tags: ["applied","practical","review"],
    generator: (data) => {
      const scenes = [];
      let t = 0;
      scenes.push({ time: t, type: 'draw_text', content: truncate(data.title, 36), position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
      scenes.push({ time: t, type: 'draw_badge', content: 'Teach Back', position: [50, 65], style: { bg: '#d97706', color: '#fff', fontSize: 12 } });
      t += 4;
      scenes.push({ time: t, type: 'draw_rect', x: 60, y: 90, width: 680, height: 110, label: truncate(safeGet(data.concepts, 0, 'Main focus') + ': ' + truncate(safeGet(data.definitions, 0, ''), 35), 55), style: { fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2, rx: 14 } });
      t += 8;
      scenes.push({ time: t, type: 'draw_arrow', from: [400, 200], to: [400, 250], label: 'applies to', style: { color: '#64748b', strokeWidth: 2 } });
      t += 5;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(safeGet(data.examples, 0, safeGet(data.relationships, 0, 'Practical application shown here')), 60), position: [80, 260], width: 640, style: { bg: '#f5f3ff', stroke: '#7c3aed', color: '#374151' } });
      t += 8;
      // Page 2
      scenes.push({ time: t, type: 'clear' });
      t += 3;
      scenes.push({ time: t, type: 'draw_text', content: 'Key Learning', position: [400, 42], style: { fontSize: 20, color: '#be123c', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 5;
      scenes.push({ time: t, type: 'draw_object', object_type: 'layers', position: [300, 100], size: [200, 180], label: truncate(safeGet(data.concepts, 0, ''), 14), annotations: (data.concepts || []).slice(1, 3).map(c => truncate(c, 14)) });
      t += 8;
      scenes.push({ time: t, type: 'draw_callout', content: truncate(data.summary || 'The practical takeaway is...', 60), position: [80, 340], width: 640, style: { bg: '#fff1f2', stroke: '#be123c', color: '#374151' } });
      t += 8;
      return scenes;
    }
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE SELECTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Select the best template based on content characteristics.
 * Returns a template object from WHITEBOARD_TEMPLATES.
 */
export function selectTemplate(field, concepts = [], hasEquation = false, hasTable = false, hasGraph = false, hasSteps = false, partIndex = 0) {
  // Score each template based on content match
  let bestTemplate = WHITEBOARD_TEMPLATES[0];
  let bestScore = -1;

  for (const tmpl of WHITEBOARD_TEMPLATES) {
    let score = 0;

    // Category matching
    if (hasSteps && tmpl.category === 'process_flow') score += 30;
    if (hasTable && tmpl.category === 'comparison') score += 25;
    if (hasGraph && tmpl.category === 'data_visualization') score += 35;
    if (hasEquation && tmpl.category === 'data_visualization') score += 20;
    if (!hasSteps && !hasTable && !hasGraph && !hasEquation && tmpl.category === 'concept_introduction') score += 20;

    // Field matching
    if (field === 'mathematics' && tmpl.tags.includes('math')) score += 15;
    if (field === 'history' && tmpl.tags.includes('timeline')) score += 15;
    if (field === 'programming' && (tmpl.tags.includes('steps') || tmpl.tags.includes('pipeline'))) score += 10;
    if (field === 'science' && tmpl.tags.includes('visual')) score += 10;

    // Content density matching
    if (concepts.length >= 4 && tmpl.tags.includes('multiple_concepts')) score += 10;
    if (concepts.length <= 2 && tmpl.tags.includes('single_concept')) score += 10;
    if (concepts.length >= 3 && tmpl.tags.includes('comparison')) score += 8;

    // Variety: Use partIndex to offset selection for visual diversity
    score += (tmpl.id + partIndex * 7) % 5;

    // Avoid repeating the same category for consecutive parts
    if (partIndex > 0) {
      const categoryRotation = ['concept_introduction', 'process_flow', 'comparison', 'hierarchy_tree', 'data_visualization', 'applied_teaching'];
      const preferredCategory = categoryRotation[partIndex % categoryRotation.length];
      if (tmpl.category === preferredCategory) score += 12;
    }

    if (score > bestScore) {
      bestScore = score;
      bestTemplate = tmpl;
    }
  }

  return bestTemplate;
}

/**
 * Apply a template with given data to produce a scene array.
 * @param {number} templateId - Template ID (1-60)
 * @param {Object} data - Template data
 * @returns {Array} Array of scene objects
 */
export function applyTemplate(templateId, data) {
  const template = WHITEBOARD_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    // Fallback to template 1 if not found
    return WHITEBOARD_TEMPLATES[0].generator(data);
  }
  return template.generator(data);
}

/**
 * Build template data from a lesson part's metadata.
 * Extracts concepts, definitions, etc. from the AI-generated part structure.
 */
export function buildTemplateData(part, lessonTitle, comprehension) {
  const concepts = (part.key_concepts || []).slice(0, 6).map(c => String(c || '').slice(0, 40));
  const visualLogic = Array.isArray(part.visual_logic) ? part.visual_logic : [];
  
  // Extract definitions from visual_logic content fields
  const definitions = visualLogic
    .map(v => v.content || v.relationship || '')
    .filter(Boolean)
    .slice(0, 6)
    .map(d => String(d).slice(0, 80));
  
  // Fill definitions from comprehension if needed
  if (definitions.length < concepts.length && comprehension?.key_topics) {
    for (const topic of comprehension.key_topics) {
      if (definitions.length >= concepts.length) break;
      if (topic.definition) definitions.push(String(topic.definition).slice(0, 80));
    }
  }

  const relationships = visualLogic
    .filter(v => v.relationship)
    .map(v => String(v.relationship).slice(0, 50))
    .slice(0, 4);

  const examples = visualLogic
    .filter(v => v.semantic_role === 'example' || v.type === 'example')
    .map(v => String(v.content || '').slice(0, 60))
    .slice(0, 4);

  // Extract steps from narration or visual_logic
  const steps = visualLogic
    .filter(v => v.semantic_role === 'sequence' || v.type === 'process' || v.type === 'step')
    .map(v => String(v.content || '').slice(0, 40))
    .slice(0, 6);

  return {
    title: lessonTitle || part.title || 'Topic',
    concepts: concepts.length ? concepts : [part.title || 'Main Concept'],
    definitions: definitions.length ? definitions : [part.scene_goal || part.learning_objective || ''],
    relationships,
    examples: examples.length ? examples : [part.scene_goal || ''],
    summary: (part.narration || '').slice(0, 100) || part.scene_goal || '',
    field: comprehension?.field || 'general',
    equation: null,
    tableData: null,
    graphData: null,
    steps: steps.length ? steps : null,
  };
}
