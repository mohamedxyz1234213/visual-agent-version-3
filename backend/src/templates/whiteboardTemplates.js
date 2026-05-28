/**
 * Whiteboard Template System
 * 60 templates organized into 6 categories (10 each) for AI-powered whiteboard lessons.
 * Canvas: 800x480px, 30px margins
 * Colors: #2563eb, #16a34a, #d97706, #7c3aed, #be123c, #0891b2, #0f766e
 */



const COLORS = ["#2563eb","#16a34a","#d97706","#7c3aed","#be123c","#0891b2","#0f766e"];

const WHITEBOARD_TEMPLATES = [
  {
    id: 1,
    name: 'Classic Definition Board',
    category: 'concept_introduction',
    description: 'Title at top, definition in center box, examples below',
    tags: ["definition","examples","clean"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 50, text: data.title, font: '32px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_line', x1: 100, y1: 80, x2: 700, y2: 80, color: '#2563eb', width: 2 });
      scenes.push({ time: 18, type: 'draw_rect', x: 150, y: 110, w: 500, h: 80, color: '#16a34a', fill: 'rgba(22,163,106,0.1)', radius: 8 });
      scenes.push({ time: 24, type: 'draw_text', x: 400, y: 150, text: data.definitions[0], font: '20px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 30, type: 'clear' });
      scenes.push({ time: 36, type: 'draw_text', x: 400, y: 50, text: data.title, font: '28px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 42, type: 'draw_text', x: 60, y: 110, text: "Examples:", font: '22px bold', color: '#7c3aed' });
      scenes.push({ time: 48, type: 'draw_badge', x: 80, y: 150, text: data.concepts[0], color: '#2563eb' });
      scenes.push({ time: 54, type: 'draw_badge', x: 80, y: 200, text: data.concepts[1], color: '#16a34a' });
      scenes.push({ time: 60, type: 'draw_badge', x: 80, y: 250, text: data.concepts[2], color: '#7c3aed' });
      scenes.push({ time: 66, type: 'clear' });
      scenes.push({ time: 72, type: 'draw_text', x: 400, y: 100, text: data.title, font: '28px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 78, type: 'draw_callout', x: 150, y: 160, w: 500, text: data.summary, color: '#be123c' });
      scenes.push({ time: 84, type: 'draw_path', d: 'M 350 400 Q 400 360 450 400 Q 400 440 350 400', color: '#d97706', fill: '#d97706' });
      scenes.push({ time: 90, type: 'draw_text', x: 400, y: 450, text: "Key Takeaway", font: '16px', color: '#0891b2', align: 'center' });
      return scenes;
    }
  },
  {
    id: 2,
    name: 'Radial Concept Map',
    category: 'concept_introduction',
    description: 'Central concept with radiating connections to sub-concepts',
    tags: ["radial","connections","visual"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_circle', cx: 400, cy: 240, r: 50, color: '#2563eb', fill: 'rgba(37,99,235,0.15)' });
      scenes.push({ time: 12, type: 'draw_text', x: 400, y: 245, text: data.title, font: '18px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 18, type: 'draw_arrow', x1: 400, y1: 190, x2: 250, y2: 100, color: '#16a34a' });
      scenes.push({ time: 24, type: 'draw_text', x: 220, y: 90, text: data.concepts[0], font: '16px', color: '#16a34a' });
      scenes.push({ time: 30, type: 'draw_arrow', x1: 400, y1: 190, x2: 550, y2: 100, color: '#d97706' });
      scenes.push({ time: 36, type: 'draw_text', x: 560, y: 90, text: data.concepts[1], font: '16px', color: '#d97706' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 400, y1: 290, x2: 250, y2: 380, color: '#7c3aed' });
      scenes.push({ time: 48, type: 'draw_text', x: 220, y: 390, text: data.concepts[2], font: '16px', color: '#7c3aed' });
      scenes.push({ time: 54, type: 'draw_arrow', x1: 400, y1: 290, x2: 550, y2: 380, color: '#be123c' });
      scenes.push({ time: 60, type: 'draw_text', x: 560, y: 390, text: data.concepts[3] || data.concepts[0], font: '16px', color: '#be123c' });
      scenes.push({ time: 66, type: 'clear' });
      scenes.push({ time: 72, type: 'draw_text', x: 400, y: 50, text: "Summary", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 78, type: 'draw_rect', x: 100, y: 80, w: 600, h: 120, color: '#0891b2', fill: 'rgba(8,145,178,0.08)', radius: 12 });
      scenes.push({ time: 84, type: 'draw_text', x: 400, y: 140, text: data.summary, font: '18px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 90, type: 'draw_path', d: 'M 300 430 C 350 410 450 410 500 430 L 500 450 C 450 430 350 430 300 450 Z', color: '#2563eb', fill: 'rgba(37,99,235,0.1)' });
      return scenes;
    }
  },
  {
    id: 3,
    name: 'Progressive Reveal',
    category: 'concept_introduction',
    description: 'Concepts revealed one by one with connecting arrows',
    tags: ["sequential","arrows","buildup"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '30px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 50, y: 80, w: 200, h: 60, color: '#16a34a', fill: 'rgba(22,163,106,0.1)', radius: 6 });
      scenes.push({ time: 18, type: 'draw_text', x: 150, y: 115, text: data.concepts[0], font: '16px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 250, y1: 110, x2: 310, y2: 110, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_rect', x: 310, y: 80, w: 200, h: 60, color: '#d97706', fill: 'rgba(217,119,6,0.1)', radius: 6 });
      scenes.push({ time: 36, type: 'draw_text', x: 410, y: 115, text: data.concepts[1], font: '16px', color: '#d97706', align: 'center' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 510, y1: 110, x2: 570, y2: 110, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_rect', x: 570, y: 80, w: 200, h: 60, color: '#7c3aed', fill: 'rgba(124,58,237,0.1)', radius: 6 });
      scenes.push({ time: 54, type: 'draw_text', x: 670, y: 115, text: data.concepts[2], font: '16px', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 60, type: 'clear' });
      scenes.push({ time: 66, type: 'draw_text', x: 400, y: 50, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 72, type: 'draw_callout', x: 100, y: 100, w: 600, text: data.definitions[0], color: '#be123c' });
      scenes.push({ time: 78, type: 'draw_text', x: 400, y: 250, text: data.relationships[0] || "connects to", font: '18px', color: '#0891b2', align: 'center' });
      scenes.push({ time: 84, type: 'draw_rect', x: 200, y: 300, w: 400, h: 80, color: '#0f766e', fill: 'rgba(15,118,110,0.1)', radius: 10 });
      scenes.push({ time: 90, type: 'draw_text', x: 400, y: 340, text: data.summary, font: '16px', color: '#0f766e', align: 'center' });
      return scenes;
    }
  },
  {
    id: 4,
    name: 'Layered Knowledge',
    category: 'concept_introduction',
    description: 'Stacked layers showing concept depth from basic to advanced',
    tags: ["layers","depth","progression"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 35, text: data.title, font: '28px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 100, y: 60, w: 600, h: 70, color: '#0f766e', fill: 'rgba(15,118,110,0.08)', radius: 4 });
      scenes.push({ time: 18, type: 'draw_text', x: 400, y: 100, text: data.concepts[0], font: '18px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 24, type: 'draw_rect', x: 150, y: 150, w: 500, h: 70, color: '#16a34a', fill: 'rgba(22,163,106,0.08)', radius: 4 });
      scenes.push({ time: 30, type: 'draw_text', x: 400, y: 190, text: data.concepts[1], font: '18px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 36, type: 'draw_rect', x: 200, y: 240, w: 400, h: 70, color: '#d97706', fill: 'rgba(217,119,6,0.08)', radius: 4 });
      scenes.push({ time: 42, type: 'draw_text', x: 400, y: 280, text: data.concepts[2], font: '18px', color: '#d97706', align: 'center' });
      scenes.push({ time: 48, type: 'draw_rect', x: 250, y: 330, w: 300, h: 70, color: '#7c3aed', fill: 'rgba(124,58,237,0.12)', radius: 4 });
      scenes.push({ time: 54, type: 'draw_text', x: 400, y: 370, text: "Advanced", font: '18px bold', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 60, type: 'clear' });
      scenes.push({ time: 66, type: 'draw_text', x: 400, y: 60, text: "Key Insight", font: '26px bold', color: '#be123c', align: 'center' });
      scenes.push({ time: 72, type: 'draw_callout', x: 120, y: 100, w: 560, text: data.summary, color: '#2563eb' });
      scenes.push({ time: 78, type: 'draw_arrow', x1: 400, y1: 220, x2: 400, y2: 300, color: '#16a34a' });
      scenes.push({ time: 84, type: 'draw_badge', x: 300, y: 320, text: "Foundation → Application", color: '#0891b2' });
      scenes.push({ time: 90, type: 'draw_path', d: 'M 200 420 L 400 390 L 600 420 L 400 450 Z', color: '#d97706', fill: 'rgba(217,119,6,0.1)' });
      return scenes;
    }
  },
  {
    id: 5,
    name: 'Question-Answer Flow',
    category: 'concept_introduction',
    description: 'Opens with question, builds to answer through visual steps',
    tags: ["question","answer","flow"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 60, text: "?", font: '60px bold', color: '#be123c', align: 'center' });
      scenes.push({ time: 12, type: 'draw_text', x: 400, y: 120, text: data.title, font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 18, type: 'draw_rect', x: 150, y: 150, w: 500, h: 60, color: '#0891b2', fill: 'rgba(8,145,178,0.08)', radius: 8 });
      scenes.push({ time: 24, type: 'draw_text', x: 400, y: 185, text: data.concepts[0], font: '18px', color: '#0891b2', align: 'center' });
      scenes.push({ time: 30, type: 'draw_arrow', x1: 400, y1: 210, x2: 400, y2: 250, color: '#2563eb' });
      scenes.push({ time: 36, type: 'draw_rect', x: 150, y: 260, w: 500, h: 60, color: '#16a34a', fill: 'rgba(22,163,106,0.08)', radius: 8 });
      scenes.push({ time: 42, type: 'draw_text', x: 400, y: 295, text: data.definitions[0], font: '18px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 48, type: 'draw_arrow', x1: 400, y1: 320, x2: 400, y2: 360, color: '#2563eb' });
      scenes.push({ time: 54, type: 'draw_rect', x: 150, y: 370, w: 500, h: 60, color: '#d97706', fill: 'rgba(217,119,6,0.08)', radius: 8 });
      scenes.push({ time: 60, type: 'draw_text', x: 400, y: 405, text: data.concepts[1], font: '18px', color: '#d97706', align: 'center' });
      scenes.push({ time: 66, type: 'clear' });
      scenes.push({ time: 72, type: 'draw_text', x: 400, y: 60, text: "Answer", font: '28px bold', color: '#16a34a', align: 'center' });
      scenes.push({ time: 78, type: 'draw_line', x1: 200, y1: 85, x2: 600, y2: 85, color: '#16a34a', width: 2 });
      scenes.push({ time: 84, type: 'draw_callout', x: 100, y: 120, w: 600, text: data.summary, color: '#7c3aed' });
      scenes.push({ time: 90, type: 'draw_badge', x: 300, y: 300, text: data.concepts[2], color: '#0f766e' });
      return scenes;
    }
  },
  {
    id: 6,
    name: 'Visual Metaphor Board',
    category: 'concept_introduction',
    description: 'Uses shapes and paths as metaphors for abstract concepts',
    tags: ["metaphor","shapes","abstract"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '28px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_path', d: 'M 100 200 C 200 100 300 300 400 200 C 500 100 600 300 700 200', color: '#d97706', fill: 'none' });
      scenes.push({ time: 18, type: 'draw_circle', cx: 200, cy: 180, r: 30, color: '#16a34a', fill: 'rgba(22,163,106,0.15)' });
      scenes.push({ time: 24, type: 'draw_text', x: 200, y: 185, text: data.concepts[0], font: '14px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 30, type: 'draw_circle', cx: 400, cy: 200, r: 35, color: '#7c3aed', fill: 'rgba(124,58,237,0.15)' });
      scenes.push({ time: 36, type: 'draw_text', x: 400, y: 205, text: data.concepts[1], font: '14px', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 42, type: 'draw_circle', cx: 600, cy: 180, r: 30, color: '#be123c', fill: 'rgba(190,18,60,0.15)' });
      scenes.push({ time: 48, type: 'draw_text', x: 600, y: 185, text: data.concepts[2], font: '14px', color: '#be123c', align: 'center' });
      scenes.push({ time: 54, type: 'clear' });
      scenes.push({ time: 60, type: 'draw_text', x: 400, y: 60, text: "The Big Picture", font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 66, type: 'draw_path', d: 'M 150 150 L 650 150 L 650 380 L 150 380 Z', color: '#0891b2', fill: 'rgba(8,145,178,0.05)' });
      scenes.push({ time: 72, type: 'draw_text', x: 400, y: 200, text: data.definitions[0], font: '18px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 78, type: 'draw_arrow', x1: 300, y1: 250, x2: 500, y2: 250, color: '#d97706' });
      scenes.push({ time: 84, type: 'draw_text', x: 400, y: 300, text: data.summary, font: '16px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 90, type: 'draw_badge', x: 300, y: 400, text: "Think of it as...", color: '#7c3aed' });
      return scenes;
    }
  },
  {
    id: 7,
    name: 'Spotlight Focus',
    category: 'concept_introduction',
    description: 'Single concept highlighted with surrounding context dimmed',
    tags: ["focus","highlight","minimal"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_rect', x: 30, y: 30, w: 740, h: 420, color: '#e5e7eb', fill: 'rgba(229,231,235,0.3)', radius: 16 });
      scenes.push({ time: 12, type: 'draw_circle', cx: 400, cy: 240, r: 100, color: '#2563eb', fill: 'rgba(37,99,235,0.08)' });
      scenes.push({ time: 18, type: 'draw_text', x: 400, y: 230, text: data.title, font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_text', x: 400, y: 260, text: data.definitions[0], font: '15px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 30, type: 'draw_text', x: 120, y: 100, text: data.concepts[0], font: '14px', color: '#9ca3af' });
      scenes.push({ time: 36, type: 'draw_text', x: 620, y: 100, text: data.concepts[1], font: '14px', color: '#9ca3af' });
      scenes.push({ time: 42, type: 'draw_text', x: 120, y: 400, text: data.concepts[2], font: '14px', color: '#9ca3af' });
      scenes.push({ time: 48, type: 'clear' });
      scenes.push({ time: 54, type: 'draw_text', x: 400, y: 50, text: data.title, font: '28px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 60, type: 'draw_rect', x: 80, y: 90, w: 640, h: 100, color: '#16a34a', fill: 'rgba(22,163,106,0.06)', radius: 10 });
      scenes.push({ time: 66, type: 'draw_text', x: 400, y: 130, text: data.summary, font: '18px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 72, type: 'draw_badge', x: 200, y: 250, text: data.concepts[0], color: '#d97706' });
      scenes.push({ time: 78, type: 'draw_badge', x: 400, y: 250, text: data.concepts[1], color: '#7c3aed' });
      scenes.push({ time: 84, type: 'draw_badge', x: 600, y: 250, text: data.concepts[2], color: '#be123c' });
      scenes.push({ time: 90, type: 'draw_text', x: 400, y: 400, text: "Focus on what matters", font: '16px italic', color: '#0891b2', align: 'center' });
      return scenes;
    }
  },
  {
    id: 8,
    name: 'Building Blocks',
    category: 'concept_introduction',
    description: 'Concepts shown as stacking blocks building understanding',
    tags: ["blocks","stack","foundation"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 200, y: 380, w: 400, h: 60, color: '#0f766e', fill: 'rgba(15,118,110,0.15)', radius: 4 });
      scenes.push({ time: 18, type: 'draw_text', x: 400, y: 415, text: data.concepts[0], font: '16px bold', color: '#0f766e', align: 'center' });
      scenes.push({ time: 24, type: 'draw_rect', x: 230, y: 310, w: 340, h: 60, color: '#16a34a', fill: 'rgba(22,163,106,0.15)', radius: 4 });
      scenes.push({ time: 30, type: 'draw_text', x: 400, y: 345, text: data.concepts[1], font: '16px bold', color: '#16a34a', align: 'center' });
      scenes.push({ time: 36, type: 'draw_rect', x: 260, y: 240, w: 280, h: 60, color: '#d97706', fill: 'rgba(217,119,6,0.15)', radius: 4 });
      scenes.push({ time: 42, type: 'draw_text', x: 400, y: 275, text: data.concepts[2], font: '16px bold', color: '#d97706', align: 'center' });
      scenes.push({ time: 48, type: 'clear' });
      scenes.push({ time: 54, type: 'draw_text', x: 400, y: 50, text: "Built Understanding", font: '26px bold', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 60, type: 'draw_path', d: 'M 200 100 L 600 100 L 550 200 L 250 200 Z', color: '#2563eb', fill: 'rgba(37,99,235,0.08)' });
      scenes.push({ time: 66, type: 'draw_text', x: 400, y: 155, text: data.definitions[0], font: '16px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 72, type: 'draw_arrow', x1: 400, y1: 210, x2: 400, y2: 270, color: '#be123c' });
      scenes.push({ time: 78, type: 'draw_callout', x: 150, y: 280, w: 500, text: data.summary, color: '#be123c' });
      scenes.push({ time: 84, type: 'draw_badge', x: 300, y: 420, text: "Foundation Complete", color: '#16a34a' });
      scenes.push({ time: 90, type: 'draw_path', d: 'M 350 380 L 400 360 L 450 380 L 400 400 Z', color: '#d97706', fill: '#d97706' });
      return scenes;
    }
  },
  {
    id: 9,
    name: 'Timeline Introduction',
    category: 'concept_introduction',
    description: 'Concept introduced along a horizontal timeline',
    tags: ["timeline","chronological","history"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_line', x1: 80, y1: 240, x2: 720, y2: 240, color: '#2563eb', width: 3 });
      scenes.push({ time: 18, type: 'draw_circle', cx: 180, cy: 240, r: 8, color: '#16a34a', fill: '#16a34a' });
      scenes.push({ time: 24, type: 'draw_text', x: 180, y: 210, text: data.concepts[0], font: '14px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 30, type: 'draw_circle', cx: 400, cy: 240, r: 8, color: '#d97706', fill: '#d97706' });
      scenes.push({ time: 36, type: 'draw_text', x: 400, y: 210, text: data.concepts[1], font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 42, type: 'draw_circle', cx: 620, cy: 240, r: 8, color: '#7c3aed', fill: '#7c3aed' });
      scenes.push({ time: 48, type: 'draw_text', x: 620, y: 210, text: data.concepts[2], font: '14px', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 54, type: 'draw_text', x: 180, y: 280, text: data.definitions[0] || "", font: '12px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 60, type: 'clear' });
      scenes.push({ time: 66, type: 'draw_text', x: 400, y: 50, text: "Evolution of ", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 72, type: 'draw_text', x: 400, y: 85, text: data.title, font: '22px', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 78, type: 'draw_rect', x: 100, y: 120, w: 600, h: 200, color: '#0891b2', fill: 'rgba(8,145,178,0.05)', radius: 12 });
      scenes.push({ time: 84, type: 'draw_text', x: 400, y: 220, text: data.summary, font: '18px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 90, type: 'draw_path', d: 'M 100 380 Q 250 350 400 380 Q 550 410 700 380', color: '#d97706', fill: 'none' });
      return scenes;
    }
  },
  {
    id: 10,
    name: 'Dual Panel Intro',
    category: 'concept_introduction',
    description: 'Split board with concept on left, visualization on right',
    tags: ["split","dual","visual-text"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 35, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_line', x1: 400, y1: 60, x2: 400, y2: 450, color: '#d1d5db', width: 1 });
      scenes.push({ time: 18, type: 'draw_text', x: 200, y: 80, text: "Concept", font: '18px bold', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 24, type: 'draw_text', x: 600, y: 80, text: "Visual", font: '18px bold', color: '#16a34a', align: 'center' });
      scenes.push({ time: 30, type: 'draw_text', x: 200, y: 130, text: data.concepts[0], font: '16px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 36, type: 'draw_circle', cx: 600, cy: 150, r: 40, color: '#16a34a', fill: 'rgba(22,163,106,0.12)' });
      scenes.push({ time: 42, type: 'draw_text', x: 200, y: 200, text: data.concepts[1], font: '16px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 48, type: 'draw_rect', x: 530, y: 210, w: 140, h: 50, color: '#d97706', fill: 'rgba(217,119,6,0.12)', radius: 8 });
      scenes.push({ time: 54, type: 'draw_text', x: 200, y: 270, text: data.concepts[2], font: '16px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 60, type: 'draw_path', d: 'M 560 310 L 600 290 L 640 310 L 620 340 L 580 340 Z', color: '#be123c', fill: 'rgba(190,18,60,0.12)' });
      scenes.push({ time: 66, type: 'clear' });
      scenes.push({ time: 72, type: 'draw_text', x: 400, y: 60, text: data.title, font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 78, type: 'draw_callout', x: 100, y: 100, w: 600, text: data.summary, color: '#0891b2' });
      scenes.push({ time: 84, type: 'draw_badge', x: 250, y: 300, text: data.concepts[0], color: '#16a34a' });
      scenes.push({ time: 90, type: 'draw_badge', x: 450, y: 300, text: data.concepts[1], color: '#d97706' });
      return scenes;
    }
  },
  {
    id: 11,
    name: 'Linear Pipeline',
    category: 'process_flow',
    description: 'Left-to-right step sequence with arrows',
    tags: ["linear","pipeline","arrows"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 40, y: 200, w: 140, h: 60, color: '#16a34a', fill: 'rgba(22,163,106,0.1)', radius: 6 });
      scenes.push({ time: 18, type: 'draw_text', x: 110, y: 235, text: data.steps[0] || data.concepts[0], font: '14px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 180, y1: 230, x2: 230, y2: 230, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_rect', x: 230, y: 200, w: 140, h: 60, color: '#d97706', fill: 'rgba(217,119,6,0.1)', radius: 6 });
      scenes.push({ time: 36, type: 'draw_text', x: 300, y: 235, text: data.steps[1] || data.concepts[1], font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 370, y1: 230, x2: 420, y2: 230, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_rect', x: 420, y: 200, w: 140, h: 60, color: '#7c3aed', fill: 'rgba(124,58,237,0.1)', radius: 6 });
      scenes.push({ time: 54, type: 'draw_text', x: 490, y: 235, text: data.steps[2] || data.concepts[2], font: '14px', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 60, type: 'draw_arrow', x1: 560, y1: 230, x2: 610, y2: 230, color: '#2563eb' });
      scenes.push({ time: 66, type: 'draw_rect', x: 610, y: 200, w: 140, h: 60, color: '#be123c', fill: 'rgba(190,18,60,0.1)', radius: 6 });
      scenes.push({ time: 72, type: 'draw_text', x: 680, y: 235, text: data.steps[3] || "Result", font: '14px', color: '#be123c', align: 'center' });
      scenes.push({ time: 78, type: 'clear' });
      scenes.push({ time: 84, type: 'draw_text', x: 400, y: 100, text: "Process Complete", font: '24px bold', color: '#16a34a', align: 'center' });
      scenes.push({ time: 90, type: 'draw_callout', x: 150, y: 150, w: 500, text: data.summary, color: '#2563eb' });
      return scenes;
    }
  },
  {
    id: 12,
    name: 'Circular Cycle',
    category: 'process_flow',
    description: 'Steps arranged in a circular cycle with curved arrows',
    tags: ["cycle","circular","continuous"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 35, text: data.title, font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_circle', cx: 400, cy: 260, r: 120, color: '#e5e7eb', fill: 'none' });
      scenes.push({ time: 18, type: 'draw_badge', x: 360, y: 120, text: data.concepts[0], color: '#16a34a' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 500, y1: 150, x2: 530, y2: 220, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_badge', x: 490, y: 280, text: data.concepts[1], color: '#d97706' });
      scenes.push({ time: 36, type: 'draw_arrow', x1: 520, y1: 320, x2: 450, y2: 380, color: '#2563eb' });
      scenes.push({ time: 42, type: 'draw_badge', x: 340, y: 370, text: data.concepts[2], color: '#7c3aed' });
      scenes.push({ time: 48, type: 'draw_arrow', x1: 300, y1: 360, x2: 270, y2: 280, color: '#2563eb' });
      scenes.push({ time: 54, type: 'draw_text', x: 400, y: 265, text: "Cycle", font: '16px bold', color: '#0891b2', align: 'center' });
      scenes.push({ time: 60, type: 'clear' });
      scenes.push({ time: 66, type: 'draw_text', x: 400, y: 80, text: data.title, font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 72, type: 'draw_rect', x: 100, y: 120, w: 600, h: 100, color: '#be123c', fill: 'rgba(190,18,60,0.05)', radius: 10 });
      scenes.push({ time: 78, type: 'draw_text', x: 400, y: 170, text: data.summary, font: '16px', color: '#be123c', align: 'center' });
      scenes.push({ time: 84, type: 'draw_path', d: 'M 300 300 C 350 280 450 280 500 300 C 450 320 350 320 300 300', color: '#0f766e', fill: 'rgba(15,118,110,0.1)' });
      scenes.push({ time: 90, type: 'draw_text', x: 400, y: 380, text: "Continuous improvement", font: '14px italic', color: '#0f766e', align: 'center' });
      return scenes;
    }
  },
  {
    id: 13,
    name: 'Waterfall Steps',
    category: 'process_flow',
    description: 'Cascading steps flowing downward like a waterfall',
    tags: ["waterfall","cascade","vertical"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 100, y: 100, w: 300, h: 60, color: '#2563eb', fill: 'rgba(37,99,235,0.1)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 250, y: 135, text: data.steps[0] || data.concepts[0] || "Step 1", font: '15px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 250, y1: 160, x2: 250, y2: 190, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_rect', x: 100, y: 190, w: 300, h: 60, color: '#16a34a', fill: 'rgba(57,109,205,0.1)', radius: 8 });
      scenes.push({ time: 36, type: 'draw_text', x: 250, y: 225, text: data.steps[1] || data.concepts[1] || "Step 2", font: '15px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 250, y1: 250, x2: 250, y2: 280, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_rect', x: 100, y: 280, w: 300, h: 60, color: '#d97706', fill: 'rgba(77,119,175,0.1)', radius: 8 });
      scenes.push({ time: 54, type: 'draw_text', x: 250, y: 315, text: data.steps[2] || data.concepts[2] || "Step 3", font: '15px', color: '#d97706', align: 'center' });
      scenes.push({ time: 60, type: 'clear' });
      scenes.push({ time: 66, type: 'draw_text', x: 400, y: 100, text: data.title, font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 72, type: 'draw_callout', x: 100, y: 150, w: 600, text: data.summary, color: '#d97706' });
      scenes.push({ time: 78, type: 'draw_badge', x: 300, y: 350, text: "Complete", color: '#16a34a' });
      scenes.push({ time: 84, type: 'draw_path', d: 'M 240 400 L 420 380 L 560 400', color: '#d97706', fill: 'none' });
      return scenes;
    }
  },
  {
    id: 14,
    name: 'Branching Decision',
    category: 'process_flow',
    description: 'Process with decision points and branches',
    tags: ["decision","branch","conditional"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 100, y: 100, w: 300, h: 60, color: '#2563eb', fill: 'rgba(37,99,235,0.1)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 250, y: 135, text: data.steps[0] || data.concepts[0] || "Step 1", font: '15px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 250, y1: 160, x2: 550, y2: 190, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_rect', x: 400, y: 190, w: 300, h: 60, color: '#16a34a', fill: 'rgba(57,109,205,0.1)', radius: 8 });
      scenes.push({ time: 36, type: 'draw_text', x: 550, y: 225, text: data.steps[1] || data.concepts[1] || "Step 2", font: '15px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 550, y1: 250, x2: 250, y2: 280, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_rect', x: 100, y: 280, w: 300, h: 60, color: '#d97706', fill: 'rgba(77,119,175,0.1)', radius: 8 });
      scenes.push({ time: 54, type: 'draw_text', x: 250, y: 315, text: data.steps[2] || data.concepts[2] || "Step 3", font: '15px', color: '#d97706', align: 'center' });
      scenes.push({ time: 60, type: 'draw_arrow', x1: 250, y1: 340, x2: 550, y2: 370, color: '#2563eb' });
      scenes.push({ time: 66, type: 'draw_rect', x: 400, y: 370, w: 300, h: 60, color: '#7c3aed', fill: 'rgba(97,129,145,0.1)', radius: 8 });
      scenes.push({ time: 72, type: 'draw_text', x: 550, y: 405, text: data.steps[3] || data.concepts[3] || "Step 4", font: '15px', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 78, type: 'clear' });
      scenes.push({ time: 84, type: 'draw_text', x: 400, y: 100, text: data.title, font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 90, type: 'draw_callout', x: 100, y: 150, w: 600, text: data.summary, color: '#7c3aed' });
      scenes.push({ time: 96, type: 'draw_badge', x: 300, y: 350, text: "Complete", color: '#16a34a' });
      scenes.push({ time: 102, type: 'draw_path', d: 'M 260 400 L 430 380 L 540 400', color: '#7c3aed', fill: 'none' });
      return scenes;
    }
  },
  {
    id: 15,
    name: 'Funnel Process',
    category: 'process_flow',
    description: 'Wide input narrowing through stages to output',
    tags: ["funnel","narrowing","stages"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 100, y: 100, w: 300, h: 60, color: '#2563eb', fill: 'rgba(37,99,235,0.1)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 250, y: 135, text: data.steps[0] || data.concepts[0] || "Step 1", font: '15px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 250, y1: 160, x2: 250, y2: 190, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_rect', x: 100, y: 190, w: 300, h: 60, color: '#16a34a', fill: 'rgba(57,109,205,0.1)', radius: 8 });
      scenes.push({ time: 36, type: 'draw_text', x: 250, y: 225, text: data.steps[1] || data.concepts[1] || "Step 2", font: '15px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 250, y1: 250, x2: 250, y2: 280, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_rect', x: 100, y: 280, w: 300, h: 60, color: '#d97706', fill: 'rgba(77,119,175,0.1)', radius: 8 });
      scenes.push({ time: 54, type: 'draw_text', x: 250, y: 315, text: data.steps[2] || data.concepts[2] || "Step 3", font: '15px', color: '#d97706', align: 'center' });
      scenes.push({ time: 60, type: 'clear' });
      scenes.push({ time: 66, type: 'draw_text', x: 400, y: 100, text: data.title, font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 72, type: 'draw_callout', x: 100, y: 150, w: 600, text: data.summary, color: '#be123c' });
      scenes.push({ time: 78, type: 'draw_badge', x: 300, y: 350, text: "Complete", color: '#16a34a' });
      scenes.push({ time: 84, type: 'draw_path', d: 'M 280 400 L 440 380 L 520 400', color: '#be123c', fill: 'none' });
      return scenes;
    }
  },
  {
    id: 16,
    name: 'Parallel Tracks',
    category: 'process_flow',
    description: 'Multiple parallel processes converging at end',
    tags: ["parallel","tracks","merge"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 100, y: 100, w: 300, h: 60, color: '#2563eb', fill: 'rgba(37,99,235,0.1)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 250, y: 135, text: data.steps[0] || data.concepts[0] || "Step 1", font: '15px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 250, y1: 160, x2: 550, y2: 190, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_rect', x: 400, y: 190, w: 300, h: 60, color: '#16a34a', fill: 'rgba(57,109,205,0.1)', radius: 8 });
      scenes.push({ time: 36, type: 'draw_text', x: 550, y: 225, text: data.steps[1] || data.concepts[1] || "Step 2", font: '15px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 550, y1: 250, x2: 250, y2: 280, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_rect', x: 100, y: 280, w: 300, h: 60, color: '#d97706', fill: 'rgba(77,119,175,0.1)', radius: 8 });
      scenes.push({ time: 54, type: 'draw_text', x: 250, y: 315, text: data.steps[2] || data.concepts[2] || "Step 3", font: '15px', color: '#d97706', align: 'center' });
      scenes.push({ time: 60, type: 'draw_arrow', x1: 250, y1: 340, x2: 550, y2: 370, color: '#2563eb' });
      scenes.push({ time: 66, type: 'draw_rect', x: 400, y: 370, w: 300, h: 60, color: '#7c3aed', fill: 'rgba(97,129,145,0.1)', radius: 8 });
      scenes.push({ time: 72, type: 'draw_text', x: 550, y: 405, text: data.steps[3] || data.concepts[3] || "Step 4", font: '15px', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 78, type: 'clear' });
      scenes.push({ time: 84, type: 'draw_text', x: 400, y: 100, text: data.title, font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 90, type: 'draw_callout', x: 100, y: 150, w: 600, text: data.summary, color: '#0891b2' });
      scenes.push({ time: 96, type: 'draw_badge', x: 300, y: 350, text: "Complete", color: '#16a34a' });
      scenes.push({ time: 102, type: 'draw_path', d: 'M 300 400 L 450 380 L 500 400', color: '#0891b2', fill: 'none' });
      return scenes;
    }
  },
  {
    id: 17,
    name: 'Zigzag Path',
    category: 'process_flow',
    description: 'Steps alternating left-right in zigzag pattern',
    tags: ["zigzag","alternating","path"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 100, y: 100, w: 300, h: 60, color: '#2563eb', fill: 'rgba(37,99,235,0.1)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 250, y: 135, text: data.steps[0] || data.concepts[0] || "Step 1", font: '15px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 250, y1: 160, x2: 250, y2: 190, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_rect', x: 100, y: 190, w: 300, h: 60, color: '#16a34a', fill: 'rgba(57,109,205,0.1)', radius: 8 });
      scenes.push({ time: 36, type: 'draw_text', x: 250, y: 225, text: data.steps[1] || data.concepts[1] || "Step 2", font: '15px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 250, y1: 250, x2: 250, y2: 280, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_rect', x: 100, y: 280, w: 300, h: 60, color: '#d97706', fill: 'rgba(77,119,175,0.1)', radius: 8 });
      scenes.push({ time: 54, type: 'draw_text', x: 250, y: 315, text: data.steps[2] || data.concepts[2] || "Step 3", font: '15px', color: '#d97706', align: 'center' });
      scenes.push({ time: 60, type: 'clear' });
      scenes.push({ time: 66, type: 'draw_text', x: 400, y: 100, text: data.title, font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 72, type: 'draw_callout', x: 100, y: 150, w: 600, text: data.summary, color: '#0f766e' });
      scenes.push({ time: 78, type: 'draw_badge', x: 300, y: 350, text: "Complete", color: '#16a34a' });
      scenes.push({ time: 84, type: 'draw_path', d: 'M 320 400 L 460 380 L 480 400', color: '#0f766e', fill: 'none' });
      return scenes;
    }
  },
  {
    id: 18,
    name: 'Milestone Markers',
    category: 'process_flow',
    description: 'Process shown with milestone markers along a path',
    tags: ["milestones","markers","progress"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 100, y: 100, w: 300, h: 60, color: '#2563eb', fill: 'rgba(37,99,235,0.1)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 250, y: 135, text: data.steps[0] || data.concepts[0] || "Step 1", font: '15px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 250, y1: 160, x2: 550, y2: 190, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_rect', x: 400, y: 190, w: 300, h: 60, color: '#16a34a', fill: 'rgba(57,109,205,0.1)', radius: 8 });
      scenes.push({ time: 36, type: 'draw_text', x: 550, y: 225, text: data.steps[1] || data.concepts[1] || "Step 2", font: '15px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 550, y1: 250, x2: 250, y2: 280, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_rect', x: 100, y: 280, w: 300, h: 60, color: '#d97706', fill: 'rgba(77,119,175,0.1)', radius: 8 });
      scenes.push({ time: 54, type: 'draw_text', x: 250, y: 315, text: data.steps[2] || data.concepts[2] || "Step 3", font: '15px', color: '#d97706', align: 'center' });
      scenes.push({ time: 60, type: 'draw_arrow', x1: 250, y1: 340, x2: 550, y2: 370, color: '#2563eb' });
      scenes.push({ time: 66, type: 'draw_rect', x: 400, y: 370, w: 300, h: 60, color: '#7c3aed', fill: 'rgba(97,129,145,0.1)', radius: 8 });
      scenes.push({ time: 72, type: 'draw_text', x: 550, y: 405, text: data.steps[3] || data.concepts[3] || "Step 4", font: '15px', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 78, type: 'clear' });
      scenes.push({ time: 84, type: 'draw_text', x: 400, y: 100, text: data.title, font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 90, type: 'draw_callout', x: 100, y: 150, w: 600, text: data.summary, color: '#2563eb' });
      scenes.push({ time: 96, type: 'draw_badge', x: 300, y: 350, text: "Complete", color: '#16a34a' });
      scenes.push({ time: 102, type: 'draw_path', d: 'M 340 400 L 470 380 L 460 400', color: '#2563eb', fill: 'none' });
      return scenes;
    }
  },
  {
    id: 19,
    name: 'Accordion Steps',
    category: 'process_flow',
    description: 'Expanding sections revealing detail at each step',
    tags: ["accordion","expand","detail"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 100, y: 100, w: 300, h: 60, color: '#2563eb', fill: 'rgba(37,99,235,0.1)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 250, y: 135, text: data.steps[0] || data.concepts[0] || "Step 1", font: '15px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 250, y1: 160, x2: 250, y2: 190, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_rect', x: 100, y: 190, w: 300, h: 60, color: '#16a34a', fill: 'rgba(57,109,205,0.1)', radius: 8 });
      scenes.push({ time: 36, type: 'draw_text', x: 250, y: 225, text: data.steps[1] || data.concepts[1] || "Step 2", font: '15px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 250, y1: 250, x2: 250, y2: 280, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_rect', x: 100, y: 280, w: 300, h: 60, color: '#d97706', fill: 'rgba(77,119,175,0.1)', radius: 8 });
      scenes.push({ time: 54, type: 'draw_text', x: 250, y: 315, text: data.steps[2] || data.concepts[2] || "Step 3", font: '15px', color: '#d97706', align: 'center' });
      scenes.push({ time: 60, type: 'clear' });
      scenes.push({ time: 66, type: 'draw_text', x: 400, y: 100, text: data.title, font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 72, type: 'draw_callout', x: 100, y: 150, w: 600, text: data.summary, color: '#16a34a' });
      scenes.push({ time: 78, type: 'draw_badge', x: 300, y: 350, text: "Complete", color: '#16a34a' });
      scenes.push({ time: 84, type: 'draw_path', d: 'M 360 400 L 480 380 L 440 400', color: '#16a34a', fill: 'none' });
      return scenes;
    }
  },
  {
    id: 20,
    name: 'River Flow',
    category: 'process_flow',
    description: 'Organic flowing path with steps as waypoints',
    tags: ["organic","flow","natural"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 100, y: 100, w: 300, h: 60, color: '#2563eb', fill: 'rgba(37,99,235,0.1)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 250, y: 135, text: data.steps[0] || data.concepts[0] || "Step 1", font: '15px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 250, y1: 160, x2: 550, y2: 190, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_rect', x: 400, y: 190, w: 300, h: 60, color: '#16a34a', fill: 'rgba(57,109,205,0.1)', radius: 8 });
      scenes.push({ time: 36, type: 'draw_text', x: 550, y: 225, text: data.steps[1] || data.concepts[1] || "Step 2", font: '15px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 550, y1: 250, x2: 250, y2: 280, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_rect', x: 100, y: 280, w: 300, h: 60, color: '#d97706', fill: 'rgba(77,119,175,0.1)', radius: 8 });
      scenes.push({ time: 54, type: 'draw_text', x: 250, y: 315, text: data.steps[2] || data.concepts[2] || "Step 3", font: '15px', color: '#d97706', align: 'center' });
      scenes.push({ time: 60, type: 'draw_arrow', x1: 250, y1: 340, x2: 550, y2: 370, color: '#2563eb' });
      scenes.push({ time: 66, type: 'draw_rect', x: 400, y: 370, w: 300, h: 60, color: '#7c3aed', fill: 'rgba(97,129,145,0.1)', radius: 8 });
      scenes.push({ time: 72, type: 'draw_text', x: 550, y: 405, text: data.steps[3] || data.concepts[3] || "Step 4", font: '15px', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 78, type: 'clear' });
      scenes.push({ time: 84, type: 'draw_text', x: 400, y: 100, text: data.title, font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 90, type: 'draw_callout', x: 100, y: 150, w: 600, text: data.summary, color: '#d97706' });
      scenes.push({ time: 96, type: 'draw_badge', x: 300, y: 350, text: "Complete", color: '#16a34a' });
      scenes.push({ time: 102, type: 'draw_path', d: 'M 380 400 L 490 380 L 420 400', color: '#d97706', fill: 'none' });
      return scenes;
    }
  },
  {
    id: 21,
    name: 'Side-by-Side Columns',
    category: 'comparison',
    description: 'Two columns comparing features directly',
    tags: ["columns","direct","features"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_line', x1: 400, y1: 70, x2: 400, y2: 440, color: '#d1d5db', width: 2 });
      scenes.push({ time: 18, type: 'draw_text', x: 200, y: 90, text: data.concepts[0], font: '20px bold', color: '#16a34a', align: 'center' });
      scenes.push({ time: 24, type: 'draw_text', x: 600, y: 90, text: data.concepts[1], font: '20px bold', color: '#be123c', align: 'center' });
      scenes.push({ time: 30, type: 'draw_rect', x: 50, y: 120, w: 300, h: 50, color: '#16a34a', fill: 'rgba(22,163,106,0.08)', radius: 6 });
      scenes.push({ time: 36, type: 'draw_text', x: 200, y: 150, text: data.definitions[0] || "Feature A", font: '14px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 42, type: 'draw_rect', x: 450, y: 120, w: 300, h: 50, color: '#be123c', fill: 'rgba(190,18,60,0.08)', radius: 6 });
      scenes.push({ time: 48, type: 'draw_text', x: 600, y: 150, text: data.definitions[1] || "Feature B", font: '14px', color: '#be123c', align: 'center' });
      scenes.push({ time: 54, type: 'draw_rect', x: 50, y: 190, w: 300, h: 50, color: '#16a34a', fill: 'rgba(22,163,106,0.08)', radius: 6 });
      scenes.push({ time: 60, type: 'draw_rect', x: 450, y: 190, w: 300, h: 50, color: '#be123c', fill: 'rgba(190,18,60,0.08)', radius: 6 });
      scenes.push({ time: 66, type: 'clear' });
      scenes.push({ time: 72, type: 'draw_text', x: 400, y: 80, text: "Conclusion", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 78, type: 'draw_callout', x: 100, y: 120, w: 600, text: data.summary, color: '#7c3aed' });
      scenes.push({ time: 84, type: 'draw_badge', x: 250, y: 300, text: data.concepts[0], color: '#16a34a' });
      scenes.push({ time: 90, type: 'draw_badge', x: 450, y: 300, text: data.concepts[1], color: '#be123c' });
      return scenes;
    }
  },
  {
    id: 22,
    name: 'Venn Overlap',
    category: 'comparison',
    description: 'Overlapping circles showing shared and unique traits',
    tags: ["venn","overlap","shared"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 50, y: 80, w: 320, h: 150, color: '#16a34a', fill: 'rgba(22,163,106,0.06)', radius: 10 });
      scenes.push({ time: 18, type: 'draw_text', x: 210, y: 110, text: data.concepts[0], font: '18px bold', color: '#16a34a', align: 'center' });
      scenes.push({ time: 24, type: 'draw_text', x: 210, y: 160, text: data.definitions[0] || "", font: '14px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 30, type: 'draw_rect', x: 430, y: 80, w: 320, h: 150, color: '#7c3aed', fill: 'rgba(180,28,80,0.06)', radius: 10 });
      scenes.push({ time: 36, type: 'draw_text', x: 590, y: 110, text: data.concepts[1], font: '18px bold', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 42, type: 'draw_text', x: 590, y: 160, text: data.definitions[1] || "", font: '14px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 48, type: 'draw_circle', cx: 320, cy: 330, r: 80, color: '#16a34a', fill: 'rgba(22,163,106,0.1)' });
      scenes.push({ time: 54, type: 'draw_circle', cx: 480, cy: 330, r: 80, color: '#be123c', fill: 'rgba(190,18,60,0.1)' });
      scenes.push({ time: 60, type: 'draw_text', x: 400, y: 335, text: "Shared", font: '14px bold', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 66, type: 'clear' });
      scenes.push({ time: 72, type: 'draw_text', x: 400, y: 80, text: "Summary", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 78, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#16a34a' });
      scenes.push({ time: 84, type: 'draw_path', d: 'M 170 350 Q 400 325 630 350', color: '#16a34a', fill: 'none' });
      return scenes;
    }
  },
  {
    id: 23,
    name: 'Contrast Table',
    category: 'comparison',
    description: 'Structured table with headers comparing attributes',
    tags: ["table","structured","attributes"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_table', x: 100, y: 80, headers: ["data.concepts[0]","data.concepts[1]"], rows: [["data.definitions[0]","data.definitions[1]"]], color: '#2563eb' });
      scenes.push({ time: 18, type: 'draw_rect', x: 430, y: 80, w: 320, h: 150, color: '#be123c', fill: 'rgba(170,38,100,0.06)', radius: 10 });
      scenes.push({ time: 24, type: 'draw_text', x: 590, y: 110, text: data.concepts[1], font: '18px bold', color: '#be123c', align: 'center' });
      scenes.push({ time: 30, type: 'draw_text', x: 590, y: 160, text: data.definitions[1] || "", font: '14px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 36, type: 'draw_arrow', x1: 200, y1: 260, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 600, y1: 260, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_text', x: 400, y: 330, text: data.relationships[0] || "relates to", font: '16px', color: '#0891b2', align: 'center' });
      scenes.push({ time: 54, type: 'clear' });
      scenes.push({ time: 60, type: 'draw_text', x: 400, y: 80, text: "Summary", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 66, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#d97706' });
      scenes.push({ time: 72, type: 'draw_path', d: 'M 190 350 Q 400 330 610 350', color: '#d97706', fill: 'none' });
      return scenes;
    }
  },
  {
    id: 24,
    name: 'Spectrum Scale',
    category: 'comparison',
    description: 'Items placed on a continuous spectrum/scale',
    tags: ["spectrum","scale","continuous"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 50, y: 80, w: 320, h: 150, color: '#16a34a', fill: 'rgba(22,163,106,0.06)', radius: 10 });
      scenes.push({ time: 18, type: 'draw_text', x: 210, y: 110, text: data.concepts[0], font: '18px bold', color: '#16a34a', align: 'center' });
      scenes.push({ time: 24, type: 'draw_text', x: 210, y: 160, text: data.definitions[0] || "", font: '14px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 30, type: 'draw_rect', x: 430, y: 80, w: 320, h: 150, color: '#0891b2', fill: 'rgba(160,48,120,0.06)', radius: 10 });
      scenes.push({ time: 36, type: 'draw_text', x: 590, y: 110, text: data.concepts[1], font: '18px bold', color: '#0891b2', align: 'center' });
      scenes.push({ time: 42, type: 'draw_text', x: 590, y: 160, text: data.definitions[1] || "", font: '14px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 48, type: 'draw_arrow', x1: 200, y1: 260, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 54, type: 'draw_arrow', x1: 600, y1: 260, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 60, type: 'draw_text', x: 400, y: 330, text: data.relationships[0] || "relates to", font: '16px', color: '#0891b2', align: 'center' });
      scenes.push({ time: 66, type: 'clear' });
      scenes.push({ time: 72, type: 'draw_text', x: 400, y: 80, text: "Summary", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 78, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#7c3aed' });
      scenes.push({ time: 84, type: 'draw_path', d: 'M 210 350 Q 400 335 590 350', color: '#7c3aed', fill: 'none' });
      return scenes;
    }
  },
  {
    id: 25,
    name: 'Before-After Split',
    category: 'comparison',
    description: 'Left shows before state, right shows after',
    tags: ["before-after","transformation","split"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 50, y: 80, w: 320, h: 150, color: '#16a34a', fill: 'rgba(22,163,106,0.06)', radius: 10 });
      scenes.push({ time: 18, type: 'draw_text', x: 210, y: 110, text: data.concepts[0], font: '18px bold', color: '#16a34a', align: 'center' });
      scenes.push({ time: 24, type: 'draw_text', x: 210, y: 160, text: data.definitions[0] || "", font: '14px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 30, type: 'draw_rect', x: 430, y: 80, w: 320, h: 150, color: '#0f766e', fill: 'rgba(150,58,140,0.06)', radius: 10 });
      scenes.push({ time: 36, type: 'draw_text', x: 590, y: 110, text: data.concepts[1], font: '18px bold', color: '#0f766e', align: 'center' });
      scenes.push({ time: 42, type: 'draw_text', x: 590, y: 160, text: data.definitions[1] || "", font: '14px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 48, type: 'draw_arrow', x1: 200, y1: 260, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 54, type: 'draw_arrow', x1: 600, y1: 260, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 60, type: 'draw_text', x: 400, y: 330, text: data.relationships[0] || "relates to", font: '16px', color: '#0891b2', align: 'center' });
      scenes.push({ time: 66, type: 'clear' });
      scenes.push({ time: 72, type: 'draw_text', x: 400, y: 80, text: "Summary", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 78, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#be123c' });
      scenes.push({ time: 84, type: 'draw_path', d: 'M 230 350 Q 400 340 570 350', color: '#be123c', fill: 'none' });
      return scenes;
    }
  },
  {
    id: 26,
    name: 'Pros-Cons Board',
    category: 'comparison',
    description: 'Divided board with advantages and disadvantages',
    tags: ["pros-cons","advantages","balanced"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 50, y: 80, w: 320, h: 150, color: '#16a34a', fill: 'rgba(22,163,106,0.06)', radius: 10 });
      scenes.push({ time: 18, type: 'draw_text', x: 210, y: 110, text: data.concepts[0], font: '18px bold', color: '#16a34a', align: 'center' });
      scenes.push({ time: 24, type: 'draw_text', x: 210, y: 160, text: data.definitions[0] || "", font: '14px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 30, type: 'draw_rect', x: 430, y: 80, w: 320, h: 150, color: '#d97706', fill: 'rgba(140,68,160,0.06)', radius: 10 });
      scenes.push({ time: 36, type: 'draw_text', x: 590, y: 110, text: data.concepts[1], font: '18px bold', color: '#d97706', align: 'center' });
      scenes.push({ time: 42, type: 'draw_text', x: 590, y: 160, text: data.definitions[1] || "", font: '14px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 48, type: 'draw_arrow', x1: 200, y1: 260, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 54, type: 'draw_arrow', x1: 600, y1: 260, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 60, type: 'draw_text', x: 400, y: 330, text: data.relationships[0] || "relates to", font: '16px', color: '#0891b2', align: 'center' });
      scenes.push({ time: 66, type: 'clear' });
      scenes.push({ time: 72, type: 'draw_text', x: 400, y: 80, text: "Summary", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 78, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#0891b2' });
      scenes.push({ time: 84, type: 'draw_path', d: 'M 250 350 Q 400 345 550 350', color: '#0891b2', fill: 'none' });
      return scenes;
    }
  },
  {
    id: 27,
    name: 'Matrix Grid',
    category: 'comparison',
    description: 'Two-axis grid positioning items by two criteria',
    tags: ["matrix","grid","two-axis"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 50, y: 80, w: 320, h: 150, color: '#16a34a', fill: 'rgba(22,163,106,0.06)', radius: 10 });
      scenes.push({ time: 18, type: 'draw_text', x: 210, y: 110, text: data.concepts[0], font: '18px bold', color: '#16a34a', align: 'center' });
      scenes.push({ time: 24, type: 'draw_text', x: 210, y: 160, text: data.definitions[0] || "", font: '14px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 30, type: 'draw_rect', x: 430, y: 80, w: 320, h: 150, color: '#7c3aed', fill: 'rgba(130,78,180,0.06)', radius: 10 });
      scenes.push({ time: 36, type: 'draw_text', x: 590, y: 110, text: data.concepts[1], font: '18px bold', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 42, type: 'draw_text', x: 590, y: 160, text: data.definitions[1] || "", font: '14px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 48, type: 'draw_arrow', x1: 200, y1: 260, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 54, type: 'draw_arrow', x1: 600, y1: 260, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 60, type: 'draw_text', x: 400, y: 330, text: data.relationships[0] || "relates to", font: '16px', color: '#0891b2', align: 'center' });
      scenes.push({ time: 66, type: 'clear' });
      scenes.push({ time: 72, type: 'draw_text', x: 400, y: 80, text: "Summary", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 78, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#0f766e' });
      scenes.push({ time: 84, type: 'draw_path', d: 'M 270 350 Q 400 350 530 350', color: '#0f766e', fill: 'none' });
      return scenes;
    }
  },
  {
    id: 28,
    name: 'Stacked Bars',
    category: 'comparison',
    description: 'Horizontal bars comparing quantities visually',
    tags: ["bars","quantities","visual"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 50, y: 80, w: 320, h: 150, color: '#16a34a', fill: 'rgba(22,163,106,0.06)', radius: 10 });
      scenes.push({ time: 18, type: 'draw_text', x: 210, y: 110, text: data.concepts[0], font: '18px bold', color: '#16a34a', align: 'center' });
      scenes.push({ time: 24, type: 'draw_text', x: 210, y: 160, text: data.definitions[0] || "", font: '14px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 30, type: 'draw_rect', x: 430, y: 80, w: 320, h: 150, color: '#be123c', fill: 'rgba(120,88,200,0.06)', radius: 10 });
      scenes.push({ time: 36, type: 'draw_text', x: 590, y: 110, text: data.concepts[1], font: '18px bold', color: '#be123c', align: 'center' });
      scenes.push({ time: 42, type: 'draw_text', x: 590, y: 160, text: data.definitions[1] || "", font: '14px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 48, type: 'draw_arrow', x1: 200, y1: 260, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 54, type: 'draw_arrow', x1: 600, y1: 260, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 60, type: 'draw_text', x: 400, y: 330, text: data.relationships[0] || "relates to", font: '16px', color: '#0891b2', align: 'center' });
      scenes.push({ time: 66, type: 'clear' });
      scenes.push({ time: 72, type: 'draw_text', x: 400, y: 80, text: "Summary", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 78, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#2563eb' });
      scenes.push({ time: 84, type: 'draw_path', d: 'M 290 350 Q 400 355 510 350', color: '#2563eb', fill: 'none' });
      return scenes;
    }
  },
  {
    id: 29,
    name: 'Feature Checklist',
    category: 'comparison',
    description: 'Checklist format showing which features each option has',
    tags: ["checklist","features","binary"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 50, y: 80, w: 320, h: 150, color: '#16a34a', fill: 'rgba(22,163,106,0.06)', radius: 10 });
      scenes.push({ time: 18, type: 'draw_text', x: 210, y: 110, text: data.concepts[0], font: '18px bold', color: '#16a34a', align: 'center' });
      scenes.push({ time: 24, type: 'draw_text', x: 210, y: 160, text: data.definitions[0] || "", font: '14px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 30, type: 'draw_rect', x: 430, y: 80, w: 320, h: 150, color: '#0891b2', fill: 'rgba(110,98,220,0.06)', radius: 10 });
      scenes.push({ time: 36, type: 'draw_text', x: 590, y: 110, text: data.concepts[1], font: '18px bold', color: '#0891b2', align: 'center' });
      scenes.push({ time: 42, type: 'draw_text', x: 590, y: 160, text: data.definitions[1] || "", font: '14px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 48, type: 'draw_arrow', x1: 200, y1: 260, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 54, type: 'draw_arrow', x1: 600, y1: 260, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 60, type: 'draw_text', x: 400, y: 330, text: data.relationships[0] || "relates to", font: '16px', color: '#0891b2', align: 'center' });
      scenes.push({ time: 66, type: 'clear' });
      scenes.push({ time: 72, type: 'draw_text', x: 400, y: 80, text: "Summary", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 78, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#16a34a' });
      scenes.push({ time: 84, type: 'draw_path', d: 'M 310 350 Q 400 360 490 350', color: '#16a34a', fill: 'none' });
      return scenes;
    }
  },
  {
    id: 30,
    name: 'Opposing Arrows',
    category: 'comparison',
    description: 'Two sides with arrows pointing toward center tension',
    tags: ["arrows","tension","opposing"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 50, y: 80, w: 320, h: 150, color: '#16a34a', fill: 'rgba(22,163,106,0.06)', radius: 10 });
      scenes.push({ time: 18, type: 'draw_text', x: 210, y: 110, text: data.concepts[0], font: '18px bold', color: '#16a34a', align: 'center' });
      scenes.push({ time: 24, type: 'draw_text', x: 210, y: 160, text: data.definitions[0] || "", font: '14px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 30, type: 'draw_rect', x: 430, y: 80, w: 320, h: 150, color: '#0f766e', fill: 'rgba(100,108,240,0.06)', radius: 10 });
      scenes.push({ time: 36, type: 'draw_text', x: 590, y: 110, text: data.concepts[1], font: '18px bold', color: '#0f766e', align: 'center' });
      scenes.push({ time: 42, type: 'draw_text', x: 590, y: 160, text: data.definitions[1] || "", font: '14px', color: '#0f766e', align: 'center' });
      scenes.push({ time: 48, type: 'draw_arrow', x1: 200, y1: 260, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 54, type: 'draw_arrow', x1: 600, y1: 260, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 60, type: 'draw_text', x: 400, y: 330, text: data.relationships[0] || "relates to", font: '16px', color: '#0891b2', align: 'center' });
      scenes.push({ time: 66, type: 'clear' });
      scenes.push({ time: 72, type: 'draw_text', x: 400, y: 80, text: "Summary", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 78, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#d97706' });
      scenes.push({ time: 84, type: 'draw_path', d: 'M 330 350 Q 400 365 470 350', color: '#d97706', fill: 'none' });
      return scenes;
    }
  },
  {
    id: 31,
    name: 'Top-Down Tree',
    category: 'hierarchy_tree',
    description: 'Classic org chart flowing top to bottom',
    tags: ["tree","top-down","org-chart"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 320, y: 70, w: 160, h: 50, color: '#2563eb', fill: 'rgba(37,99,235,0.1)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 400, y: 100, text: data.concepts[0], font: '15px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_line', x1: 400, y1: 120, x2: 250, y2: 170, color: '#2563eb', width: 1 });
      scenes.push({ time: 30, type: 'draw_line', x1: 400, y1: 120, x2: 550, y2: 170, color: '#2563eb', width: 1 });
      scenes.push({ time: 36, type: 'draw_rect', x: 170, y: 170, w: 160, h: 45, color: '#16a34a', fill: 'rgba(22,163,106,0.1)', radius: 6 });
      scenes.push({ time: 42, type: 'draw_text', x: 250, y: 197, text: data.concepts[1], font: '14px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 48, type: 'draw_rect', x: 470, y: 170, w: 160, h: 45, color: '#d97706', fill: 'rgba(217,119,6,0.1)', radius: 6 });
      scenes.push({ time: 54, type: 'draw_text', x: 550, y: 197, text: data.concepts[2], font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 60, type: 'draw_line', x1: 250, y1: 215, x2: 180, y2: 270, color: '#16a34a', width: 1 });
      scenes.push({ time: 66, type: 'draw_line', x1: 250, y1: 215, x2: 320, y2: 270, color: '#16a34a', width: 1 });
      scenes.push({ time: 72, type: 'draw_badge', x: 130, y: 280, text: "Leaf 1", color: '#7c3aed' });
      scenes.push({ time: 78, type: 'draw_badge', x: 280, y: 280, text: "Leaf 2", color: '#be123c' });
      scenes.push({ time: 84, type: 'clear' });
      scenes.push({ time: 90, type: 'draw_text', x: 400, y: 80, text: data.title, font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 96, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#2563eb' });
      scenes.push({ time: 102, type: 'draw_badge', x: 350, y: 350, text: "Structure Matters", color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 32,
    name: 'Nested Boxes',
    category: 'hierarchy_tree',
    description: 'Boxes within boxes showing containment',
    tags: ["nested","containment","boxes"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 50, y: 80, w: 700, h: 90, color: '#2563eb', fill: 'rgba(37,99,235,0.05)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 400, y: 120, text: data.concepts[0] || "Node", font: '14px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_rect', x: 90, y: 200, w: 620, h: 90, color: '#16a34a', fill: 'rgba(87,119,235,0.05)', radius: 10 });
      scenes.push({ time: 30, type: 'draw_text', x: 400, y: 240, text: data.concepts[1] || "Node", font: '14px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 36, type: 'draw_rect', x: 90, y: 200, w: 620, h: 90, color: '#16a34a', fill: 'rgba(87,119,235,0.05)', radius: 10 });
      scenes.push({ time: 42, type: 'draw_text', x: 400, y: 240, text: data.concepts[2] || "Node", font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 48, type: 'draw_rect', x: 130, y: 320, w: 540, h: 90, color: '#d97706', fill: 'rgba(137,139,235,0.05)', radius: 12 });
      scenes.push({ time: 54, type: 'draw_text', x: 400, y: 360, text: data.concepts[2] || "Node", font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 60, type: 'draw_rect', x: 130, y: 320, w: 540, h: 90, color: '#d97706', fill: 'rgba(137,139,235,0.05)', radius: 12 });
      scenes.push({ time: 66, type: 'draw_text', x: 400, y: 360, text: data.concepts[3] || "Node", font: '14px', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 72, type: 'draw_rect', x: 130, y: 320, w: 540, h: 90, color: '#d97706', fill: 'rgba(137,139,235,0.05)', radius: 12 });
      scenes.push({ time: 78, type: 'draw_text', x: 400, y: 360, text: data.concepts[4] || "Node", font: '14px', color: '#be123c', align: 'center' });
      scenes.push({ time: 84, type: 'clear' });
      scenes.push({ time: 90, type: 'draw_text', x: 400, y: 80, text: data.title, font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 96, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#16a34a' });
      scenes.push({ time: 102, type: 'draw_badge', x: 350, y: 350, text: "Structure Matters", color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 33,
    name: 'Pyramid Layers',
    category: 'hierarchy_tree',
    description: 'Triangular layers from broad base to narrow top',
    tags: ["pyramid","layers","triangular"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 100, y: 80, w: 600, h: 70, color: '#2563eb', fill: 'rgba(37,99,235,0.08)', radius: 4 });
      scenes.push({ time: 18, type: 'draw_text', x: 400, y: 120, text: data.concepts[0] || "Node", font: '14px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_rect', x: 175, y: 180, w: 450, h: 70, color: '#16a34a', fill: 'rgba(87,119,235,0.08)', radius: 4 });
      scenes.push({ time: 30, type: 'draw_text', x: 400, y: 240, text: data.concepts[1] || "Node", font: '14px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 36, type: 'draw_rect', x: 175, y: 180, w: 450, h: 70, color: '#16a34a', fill: 'rgba(87,119,235,0.08)', radius: 4 });
      scenes.push({ time: 42, type: 'draw_text', x: 400, y: 240, text: data.concepts[2] || "Node", font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 48, type: 'draw_rect', x: 250, y: 280, w: 300, h: 70, color: '#d97706', fill: 'rgba(137,139,235,0.08)', radius: 4 });
      scenes.push({ time: 54, type: 'draw_text', x: 400, y: 360, text: data.concepts[2] || "Node", font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 60, type: 'draw_rect', x: 250, y: 280, w: 300, h: 70, color: '#d97706', fill: 'rgba(137,139,235,0.08)', radius: 4 });
      scenes.push({ time: 66, type: 'draw_text', x: 400, y: 360, text: data.concepts[3] || "Node", font: '14px', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 72, type: 'draw_rect', x: 250, y: 280, w: 300, h: 70, color: '#d97706', fill: 'rgba(137,139,235,0.08)', radius: 4 });
      scenes.push({ time: 78, type: 'draw_text', x: 400, y: 360, text: data.concepts[4] || "Node", font: '14px', color: '#be123c', align: 'center' });
      scenes.push({ time: 84, type: 'clear' });
      scenes.push({ time: 90, type: 'draw_text', x: 400, y: 80, text: data.title, font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 96, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#d97706' });
      scenes.push({ time: 102, type: 'draw_badge', x: 350, y: 350, text: "Structure Matters", color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 34,
    name: 'Mind Map Spread',
    category: 'hierarchy_tree',
    description: 'Central node with spreading branches',
    tags: ["mind-map","branches","spread"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 50, y: 80, w: 680, h: 50, color: '#2563eb', fill: 'rgba(37,99,235,0.05)', radius: 6 });
      scenes.push({ time: 18, type: 'draw_text', x: 390, y: 110, text: data.concepts[0] || "Node", font: '14px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 390, y1: 130, x2: 390, y2: 200, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_rect', x: 50, y: 200, w: 330, h: 50, color: '#16a34a', fill: 'rgba(37,99,235,0.06)', radius: 6 });
      scenes.push({ time: 36, type: 'draw_text', x: 215, y: 230, text: data.concepts[1] || "Node", font: '14px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 215, y1: 250, x2: 215, y2: 320, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_rect', x: 400, y: 200, w: 330, h: 50, color: '#d97706', fill: 'rgba(37,99,235,0.06)', radius: 6 });
      scenes.push({ time: 54, type: 'draw_text', x: 565, y: 230, text: data.concepts[2] || "Node", font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 60, type: 'draw_arrow', x1: 565, y1: 250, x2: 565, y2: 320, color: '#2563eb' });
      scenes.push({ time: 66, type: 'draw_rect', x: 50, y: 320, w: 213.33333333333334, h: 50, color: '#d97706', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 72, type: 'draw_text', x: 156.66666666666669, y: 350, text: data.concepts[2] || "Node", font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 78, type: 'draw_rect', x: 283.33333333333337, y: 320, w: 213.33333333333334, h: 50, color: '#7c3aed', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 84, type: 'draw_text', x: 390.00000000000006, y: 350, text: data.concepts[3] || "Node", font: '14px', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 90, type: 'draw_rect', x: 516.6666666666667, y: 320, w: 213.33333333333334, h: 50, color: '#be123c', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 96, type: 'draw_text', x: 623.3333333333334, y: 350, text: data.concepts[4] || "Node", font: '14px', color: '#be123c', align: 'center' });
      scenes.push({ time: 102, type: 'clear' });
      scenes.push({ time: 108, type: 'draw_text', x: 400, y: 80, text: data.title, font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 114, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#7c3aed' });
      scenes.push({ time: 120, type: 'draw_badge', x: 350, y: 350, text: "Structure Matters", color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 35,
    name: 'Indented List Tree',
    category: 'hierarchy_tree',
    description: 'Indented text showing hierarchy levels',
    tags: ["indented","text","levels"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 50, y: 80, w: 680, h: 50, color: '#2563eb', fill: 'rgba(37,99,235,0.05)', radius: 6 });
      scenes.push({ time: 18, type: 'draw_text', x: 390, y: 110, text: data.concepts[0] || "Node", font: '14px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 390, y1: 130, x2: 390, y2: 200, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_rect', x: 50, y: 200, w: 330, h: 50, color: '#16a34a', fill: 'rgba(37,99,235,0.06)', radius: 6 });
      scenes.push({ time: 36, type: 'draw_text', x: 215, y: 230, text: data.concepts[1] || "Node", font: '14px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 215, y1: 250, x2: 215, y2: 320, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_rect', x: 400, y: 200, w: 330, h: 50, color: '#d97706', fill: 'rgba(37,99,235,0.06)', radius: 6 });
      scenes.push({ time: 54, type: 'draw_text', x: 565, y: 230, text: data.concepts[2] || "Node", font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 60, type: 'draw_arrow', x1: 565, y1: 250, x2: 565, y2: 320, color: '#2563eb' });
      scenes.push({ time: 66, type: 'draw_rect', x: 50, y: 320, w: 213.33333333333334, h: 50, color: '#d97706', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 72, type: 'draw_text', x: 156.66666666666669, y: 350, text: data.concepts[2] || "Node", font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 78, type: 'draw_rect', x: 283.33333333333337, y: 320, w: 213.33333333333334, h: 50, color: '#7c3aed', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 84, type: 'draw_text', x: 390.00000000000006, y: 350, text: data.concepts[3] || "Node", font: '14px', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 90, type: 'draw_rect', x: 516.6666666666667, y: 320, w: 213.33333333333334, h: 50, color: '#be123c', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 96, type: 'draw_text', x: 623.3333333333334, y: 350, text: data.concepts[4] || "Node", font: '14px', color: '#be123c', align: 'center' });
      scenes.push({ time: 102, type: 'clear' });
      scenes.push({ time: 108, type: 'draw_text', x: 400, y: 80, text: data.title, font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 114, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#be123c' });
      scenes.push({ time: 120, type: 'draw_badge', x: 350, y: 350, text: "Structure Matters", color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 36,
    name: 'Concentric Rings',
    category: 'hierarchy_tree',
    description: 'Rings from center outward showing levels',
    tags: ["concentric","rings","outward"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 50, y: 80, w: 680, h: 50, color: '#2563eb', fill: 'rgba(37,99,235,0.05)', radius: 6 });
      scenes.push({ time: 18, type: 'draw_text', x: 390, y: 110, text: data.concepts[0] || "Node", font: '14px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 390, y1: 130, x2: 390, y2: 200, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_rect', x: 50, y: 200, w: 330, h: 50, color: '#16a34a', fill: 'rgba(37,99,235,0.06)', radius: 6 });
      scenes.push({ time: 36, type: 'draw_text', x: 215, y: 230, text: data.concepts[1] || "Node", font: '14px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 215, y1: 250, x2: 215, y2: 320, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_rect', x: 400, y: 200, w: 330, h: 50, color: '#d97706', fill: 'rgba(37,99,235,0.06)', radius: 6 });
      scenes.push({ time: 54, type: 'draw_text', x: 565, y: 230, text: data.concepts[2] || "Node", font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 60, type: 'draw_arrow', x1: 565, y1: 250, x2: 565, y2: 320, color: '#2563eb' });
      scenes.push({ time: 66, type: 'draw_rect', x: 50, y: 320, w: 213.33333333333334, h: 50, color: '#d97706', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 72, type: 'draw_text', x: 156.66666666666669, y: 350, text: data.concepts[2] || "Node", font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 78, type: 'draw_rect', x: 283.33333333333337, y: 320, w: 213.33333333333334, h: 50, color: '#7c3aed', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 84, type: 'draw_text', x: 390.00000000000006, y: 350, text: data.concepts[3] || "Node", font: '14px', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 90, type: 'draw_rect', x: 516.6666666666667, y: 320, w: 213.33333333333334, h: 50, color: '#be123c', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 96, type: 'draw_text', x: 623.3333333333334, y: 350, text: data.concepts[4] || "Node", font: '14px', color: '#be123c', align: 'center' });
      scenes.push({ time: 102, type: 'clear' });
      scenes.push({ time: 108, type: 'draw_text', x: 400, y: 80, text: data.title, font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 114, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#0891b2' });
      scenes.push({ time: 120, type: 'draw_badge', x: 350, y: 350, text: "Structure Matters", color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 37,
    name: 'Bracket Groups',
    category: 'hierarchy_tree',
    description: 'Curly brackets grouping items into categories',
    tags: ["brackets","grouping","categories"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 50, y: 80, w: 680, h: 50, color: '#2563eb', fill: 'rgba(37,99,235,0.05)', radius: 6 });
      scenes.push({ time: 18, type: 'draw_text', x: 390, y: 110, text: data.concepts[0] || "Node", font: '14px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 390, y1: 130, x2: 390, y2: 200, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_rect', x: 50, y: 200, w: 330, h: 50, color: '#16a34a', fill: 'rgba(37,99,235,0.06)', radius: 6 });
      scenes.push({ time: 36, type: 'draw_text', x: 215, y: 230, text: data.concepts[1] || "Node", font: '14px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 215, y1: 250, x2: 215, y2: 320, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_rect', x: 400, y: 200, w: 330, h: 50, color: '#d97706', fill: 'rgba(37,99,235,0.06)', radius: 6 });
      scenes.push({ time: 54, type: 'draw_text', x: 565, y: 230, text: data.concepts[2] || "Node", font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 60, type: 'draw_arrow', x1: 565, y1: 250, x2: 565, y2: 320, color: '#2563eb' });
      scenes.push({ time: 66, type: 'draw_rect', x: 50, y: 320, w: 213.33333333333334, h: 50, color: '#d97706', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 72, type: 'draw_text', x: 156.66666666666669, y: 350, text: data.concepts[2] || "Node", font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 78, type: 'draw_rect', x: 283.33333333333337, y: 320, w: 213.33333333333334, h: 50, color: '#7c3aed', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 84, type: 'draw_text', x: 390.00000000000006, y: 350, text: data.concepts[3] || "Node", font: '14px', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 90, type: 'draw_rect', x: 516.6666666666667, y: 320, w: 213.33333333333334, h: 50, color: '#be123c', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 96, type: 'draw_text', x: 623.3333333333334, y: 350, text: data.concepts[4] || "Node", font: '14px', color: '#be123c', align: 'center' });
      scenes.push({ time: 102, type: 'clear' });
      scenes.push({ time: 108, type: 'draw_text', x: 400, y: 80, text: data.title, font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 114, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#0f766e' });
      scenes.push({ time: 120, type: 'draw_badge', x: 350, y: 350, text: "Structure Matters", color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 38,
    name: 'Sunburst Sectors',
    category: 'hierarchy_tree',
    description: 'Pie-like sectors with subdivisions',
    tags: ["sunburst","sectors","subdivisions"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 50, y: 80, w: 680, h: 50, color: '#2563eb', fill: 'rgba(37,99,235,0.05)', radius: 6 });
      scenes.push({ time: 18, type: 'draw_text', x: 390, y: 110, text: data.concepts[0] || "Node", font: '14px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 390, y1: 130, x2: 390, y2: 200, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_rect', x: 50, y: 200, w: 330, h: 50, color: '#16a34a', fill: 'rgba(37,99,235,0.06)', radius: 6 });
      scenes.push({ time: 36, type: 'draw_text', x: 215, y: 230, text: data.concepts[1] || "Node", font: '14px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 215, y1: 250, x2: 215, y2: 320, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_rect', x: 400, y: 200, w: 330, h: 50, color: '#d97706', fill: 'rgba(37,99,235,0.06)', radius: 6 });
      scenes.push({ time: 54, type: 'draw_text', x: 565, y: 230, text: data.concepts[2] || "Node", font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 60, type: 'draw_arrow', x1: 565, y1: 250, x2: 565, y2: 320, color: '#2563eb' });
      scenes.push({ time: 66, type: 'draw_rect', x: 50, y: 320, w: 213.33333333333334, h: 50, color: '#d97706', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 72, type: 'draw_text', x: 156.66666666666669, y: 350, text: data.concepts[2] || "Node", font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 78, type: 'draw_rect', x: 283.33333333333337, y: 320, w: 213.33333333333334, h: 50, color: '#7c3aed', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 84, type: 'draw_text', x: 390.00000000000006, y: 350, text: data.concepts[3] || "Node", font: '14px', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 90, type: 'draw_rect', x: 516.6666666666667, y: 320, w: 213.33333333333334, h: 50, color: '#be123c', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 96, type: 'draw_text', x: 623.3333333333334, y: 350, text: data.concepts[4] || "Node", font: '14px', color: '#be123c', align: 'center' });
      scenes.push({ time: 102, type: 'clear' });
      scenes.push({ time: 108, type: 'draw_text', x: 400, y: 80, text: data.title, font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 114, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#2563eb' });
      scenes.push({ time: 120, type: 'draw_badge', x: 350, y: 350, text: "Structure Matters", color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 39,
    name: 'Staircase Levels',
    category: 'hierarchy_tree',
    description: 'Ascending stairs showing hierarchy levels',
    tags: ["staircase","ascending","levels"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 50, y: 80, w: 680, h: 50, color: '#2563eb', fill: 'rgba(37,99,235,0.05)', radius: 6 });
      scenes.push({ time: 18, type: 'draw_text', x: 390, y: 110, text: data.concepts[0] || "Node", font: '14px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 390, y1: 130, x2: 390, y2: 200, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_rect', x: 50, y: 200, w: 330, h: 50, color: '#16a34a', fill: 'rgba(37,99,235,0.06)', radius: 6 });
      scenes.push({ time: 36, type: 'draw_text', x: 215, y: 230, text: data.concepts[1] || "Node", font: '14px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 215, y1: 250, x2: 215, y2: 320, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_rect', x: 400, y: 200, w: 330, h: 50, color: '#d97706', fill: 'rgba(37,99,235,0.06)', radius: 6 });
      scenes.push({ time: 54, type: 'draw_text', x: 565, y: 230, text: data.concepts[2] || "Node", font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 60, type: 'draw_arrow', x1: 565, y1: 250, x2: 565, y2: 320, color: '#2563eb' });
      scenes.push({ time: 66, type: 'draw_rect', x: 50, y: 320, w: 213.33333333333334, h: 50, color: '#d97706', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 72, type: 'draw_text', x: 156.66666666666669, y: 350, text: data.concepts[2] || "Node", font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 78, type: 'draw_rect', x: 283.33333333333337, y: 320, w: 213.33333333333334, h: 50, color: '#7c3aed', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 84, type: 'draw_text', x: 390.00000000000006, y: 350, text: data.concepts[3] || "Node", font: '14px', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 90, type: 'draw_rect', x: 516.6666666666667, y: 320, w: 213.33333333333334, h: 50, color: '#be123c', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 96, type: 'draw_text', x: 623.3333333333334, y: 350, text: data.concepts[4] || "Node", font: '14px', color: '#be123c', align: 'center' });
      scenes.push({ time: 102, type: 'clear' });
      scenes.push({ time: 108, type: 'draw_text', x: 400, y: 80, text: data.title, font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 114, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#16a34a' });
      scenes.push({ time: 120, type: 'draw_badge', x: 350, y: 350, text: "Structure Matters", color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 40,
    name: 'Network Clusters',
    category: 'hierarchy_tree',
    description: 'Clustered nodes with inter-cluster connections',
    tags: ["network","clusters","connections"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 50, y: 80, w: 680, h: 50, color: '#2563eb', fill: 'rgba(37,99,235,0.05)', radius: 6 });
      scenes.push({ time: 18, type: 'draw_text', x: 390, y: 110, text: data.concepts[0] || "Node", font: '14px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 390, y1: 130, x2: 390, y2: 200, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_rect', x: 50, y: 200, w: 330, h: 50, color: '#16a34a', fill: 'rgba(37,99,235,0.06)', radius: 6 });
      scenes.push({ time: 36, type: 'draw_text', x: 215, y: 230, text: data.concepts[1] || "Node", font: '14px', color: '#16a34a', align: 'center' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 215, y1: 250, x2: 215, y2: 320, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_rect', x: 400, y: 200, w: 330, h: 50, color: '#d97706', fill: 'rgba(37,99,235,0.06)', radius: 6 });
      scenes.push({ time: 54, type: 'draw_text', x: 565, y: 230, text: data.concepts[2] || "Node", font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 60, type: 'draw_arrow', x1: 565, y1: 250, x2: 565, y2: 320, color: '#2563eb' });
      scenes.push({ time: 66, type: 'draw_rect', x: 50, y: 320, w: 213.33333333333334, h: 50, color: '#d97706', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 72, type: 'draw_text', x: 156.66666666666669, y: 350, text: data.concepts[2] || "Node", font: '14px', color: '#d97706', align: 'center' });
      scenes.push({ time: 78, type: 'draw_rect', x: 283.33333333333337, y: 320, w: 213.33333333333334, h: 50, color: '#7c3aed', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 84, type: 'draw_text', x: 390.00000000000006, y: 350, text: data.concepts[3] || "Node", font: '14px', color: '#7c3aed', align: 'center' });
      scenes.push({ time: 90, type: 'draw_rect', x: 516.6666666666667, y: 320, w: 213.33333333333334, h: 50, color: '#be123c', fill: 'rgba(37,99,235,0.07)', radius: 6 });
      scenes.push({ time: 96, type: 'draw_text', x: 623.3333333333334, y: 350, text: data.concepts[4] || "Node", font: '14px', color: '#be123c', align: 'center' });
      scenes.push({ time: 102, type: 'clear' });
      scenes.push({ time: 108, type: 'draw_text', x: 400, y: 80, text: data.title, font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 114, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#d97706' });
      scenes.push({ time: 120, type: 'draw_badge', x: 350, y: 350, text: "Structure Matters", color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 41,
    name: 'Bar Chart Classic',
    category: 'data_visualization',
    description: 'Vertical bars on labeled x-axis',
    tags: ["bar-chart","vertical","labeled"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_line', x1: 100, y1: 400, x2: 700, y2: 400, color: '#2563eb', width: 2 });
      scenes.push({ time: 18, type: 'draw_line', x1: 100, y1: 80, x2: 100, y2: 400, color: '#2563eb', width: 2 });
      scenes.push({ time: 24, type: 'draw_rect', x: 150, y: 200, w: 80, h: 200, color: '#16a34a', fill: 'rgba(22,163,106,0.6)', radius: 4 });
      scenes.push({ time: 30, type: 'draw_text', x: 190, y: 420, text: data.concepts[0], font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 36, type: 'draw_rect', x: 300, y: 150, w: 80, h: 250, color: '#d97706', fill: 'rgba(217,119,6,0.6)', radius: 4 });
      scenes.push({ time: 42, type: 'draw_text', x: 340, y: 420, text: data.concepts[1], font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 48, type: 'draw_rect', x: 450, y: 250, w: 80, h: 150, color: '#7c3aed', fill: 'rgba(124,58,237,0.6)', radius: 4 });
      scenes.push({ time: 54, type: 'draw_text', x: 490, y: 420, text: data.concepts[2], font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 60, type: 'draw_rect', x: 600, y: 120, w: 80, h: 280, color: '#be123c', fill: 'rgba(190,18,60,0.6)', radius: 4 });
      scenes.push({ time: 66, type: 'clear' });
      scenes.push({ time: 72, type: 'draw_text', x: 400, y: 80, text: "Data Insights", font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 78, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#2563eb' });
      scenes.push({ time: 84, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 42,
    name: 'Line Graph Trend',
    category: 'data_visualization',
    description: 'Connected points showing trend over time',
    tags: ["line-graph","trend","time"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_line', x1: 80, y1: 400, x2: 720, y2: 400, color: '#2563eb', width: 2 });
      scenes.push({ time: 18, type: 'draw_line', x1: 80, y1: 80, x2: 80, y2: 400, color: '#2563eb', width: 2 });
      scenes.push({ time: 24, type: 'draw_path', d: 'M 120 350 L 250 280 L 380 200 L 510 240 L 640 150', color: '#16a34a', fill: 'none' });
      scenes.push({ time: 30, type: 'draw_circle', cx: 120, cy: 350, r: 5, color: '#16a34a', fill: '#16a34a' });
      scenes.push({ time: 36, type: 'draw_circle', cx: 250, cy: 280, r: 5, color: '#16a34a', fill: '#16a34a' });
      scenes.push({ time: 42, type: 'draw_circle', cx: 380, cy: 200, r: 5, color: '#16a34a', fill: '#16a34a' });
      scenes.push({ time: 48, type: 'draw_circle', cx: 510, cy: 240, r: 5, color: '#16a34a', fill: '#16a34a' });
      scenes.push({ time: 54, type: 'draw_circle', cx: 640, cy: 150, r: 5, color: '#16a34a', fill: '#16a34a' });
      scenes.push({ time: 60, type: 'draw_text', x: 400, y: 430, text: data.concepts[0], font: '14px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 66, type: 'clear' });
      scenes.push({ time: 72, type: 'draw_text', x: 400, y: 80, text: "Data Insights", font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 78, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#16a34a' });
      scenes.push({ time: 84, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 43,
    name: 'Coordinate System',
    category: 'data_visualization',
    description: 'XY axes with plotted points and labels',
    tags: ["coordinates","axes","points"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_coordinate_system', x: 100, y: 400, w: 600, h: 320, xLabel: "X Axis", yLabel: "Y Axis", color: '#2563eb' });
      scenes.push({ time: 18, type: 'draw_circle', cx: 200, cy: 300, r: 6, color: '#16a34a', fill: '#16a34a' });
      scenes.push({ time: 24, type: 'draw_circle', cx: 350, cy: 200, r: 6, color: '#16a34a', fill: '#16a34a' });
      scenes.push({ time: 30, type: 'draw_circle', cx: 500, cy: 150, r: 6, color: '#16a34a', fill: '#16a34a' });
      scenes.push({ time: 36, type: 'draw_line', x1: 200, y1: 300, x2: 350, y2: 200, color: '#d97706', width: 2 });
      scenes.push({ time: 42, type: 'draw_line', x1: 350, y1: 200, x2: 500, y2: 150, color: '#d97706', width: 2 });
      scenes.push({ time: 48, type: 'draw_text', x: 400, y: 440, text: data.concepts[0], font: '14px', color: '#0891b2', align: 'center' });
      scenes.push({ time: 54, type: 'clear' });
      scenes.push({ time: 60, type: 'draw_text', x: 400, y: 80, text: "Data Insights", font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 66, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#d97706' });
      scenes.push({ time: 72, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 44,
    name: 'Pie Segments',
    category: 'data_visualization',
    description: 'Circle divided into proportional segments',
    tags: ["pie","proportional","segments"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_line', x1: 100, y1: 400, x2: 700, y2: 400, color: '#2563eb', width: 2 });
      scenes.push({ time: 18, type: 'draw_line', x1: 100, y1: 80, x2: 100, y2: 400, color: '#2563eb', width: 2 });
      scenes.push({ time: 24, type: 'draw_circle', cx: 400, cy: 250, r: 120, color: '#2563eb', fill: 'rgba(37,99,235,0.15)' });
      scenes.push({ time: 30, type: 'draw_text', x: 180, y: 420, text: data.concepts[0] || "Item 1", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 36, type: 'draw_circle', cx: 400, cy: 250, r: 110, color: '#16a34a', fill: 'rgba(77,129,185,0.15)' });
      scenes.push({ time: 42, type: 'draw_text', x: 330, y: 420, text: data.concepts[1] || "Item 2", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 48, type: 'draw_circle', cx: 400, cy: 250, r: 100, color: '#d97706', fill: 'rgba(117,159,135,0.15)' });
      scenes.push({ time: 54, type: 'draw_text', x: 480, y: 420, text: data.concepts[2] || "Item 3", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 60, type: 'draw_circle', cx: 400, cy: 250, r: 90, color: '#7c3aed', fill: 'rgba(157,189,85,0.15)' });
      scenes.push({ time: 66, type: 'draw_text', x: 630, y: 420, text: data.concepts[3] || "Item 4", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 72, type: 'clear' });
      scenes.push({ time: 78, type: 'draw_text', x: 400, y: 80, text: "Data Insights", font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 84, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#7c3aed' });
      scenes.push({ time: 90, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 45,
    name: 'Scatter Plot',
    category: 'data_visualization',
    description: 'Points distributed across a 2D plane',
    tags: ["scatter","distribution","2D"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_line', x1: 100, y1: 400, x2: 700, y2: 400, color: '#2563eb', width: 2 });
      scenes.push({ time: 18, type: 'draw_line', x1: 100, y1: 80, x2: 100, y2: 400, color: '#2563eb', width: 2 });
      scenes.push({ time: 24, type: 'draw_rect', x: 150, y: 240, w: 60, h: 160, color: '#2563eb', fill: 'rgba(37,99,235,0.5)', radius: 3 });
      scenes.push({ time: 30, type: 'draw_text', x: 180, y: 420, text: data.concepts[0] || "Item 1", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 36, type: 'draw_rect', x: 300, y: 190, w: 60, h: 210, color: '#16a34a', fill: 'rgba(77,129,185,0.5)', radius: 3 });
      scenes.push({ time: 42, type: 'draw_text', x: 330, y: 420, text: data.concepts[1] || "Item 2", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 48, type: 'draw_rect', x: 450, y: 140, w: 60, h: 260, color: '#d97706', fill: 'rgba(117,159,135,0.5)', radius: 3 });
      scenes.push({ time: 54, type: 'draw_text', x: 480, y: 420, text: data.concepts[2] || "Item 3", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 60, type: 'draw_rect', x: 600, y: 90, w: 60, h: 310, color: '#7c3aed', fill: 'rgba(157,189,85,0.5)', radius: 3 });
      scenes.push({ time: 66, type: 'draw_text', x: 630, y: 420, text: data.concepts[3] || "Item 4", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 72, type: 'clear' });
      scenes.push({ time: 78, type: 'draw_text', x: 400, y: 80, text: "Data Insights", font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 84, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#be123c' });
      scenes.push({ time: 90, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 46,
    name: 'Area Fill Graph',
    category: 'data_visualization',
    description: 'Line graph with filled area below',
    tags: ["area","filled","cumulative"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_line', x1: 100, y1: 400, x2: 700, y2: 400, color: '#2563eb', width: 2 });
      scenes.push({ time: 18, type: 'draw_line', x1: 100, y1: 80, x2: 100, y2: 400, color: '#2563eb', width: 2 });
      scenes.push({ time: 24, type: 'draw_rect', x: 150, y: 220, w: 60, h: 180, color: '#2563eb', fill: 'rgba(37,99,235,0.5)', radius: 3 });
      scenes.push({ time: 30, type: 'draw_text', x: 180, y: 420, text: data.concepts[0] || "Item 1", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 36, type: 'draw_rect', x: 300, y: 170, w: 60, h: 230, color: '#16a34a', fill: 'rgba(77,129,185,0.5)', radius: 3 });
      scenes.push({ time: 42, type: 'draw_text', x: 330, y: 420, text: data.concepts[1] || "Item 2", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 48, type: 'draw_rect', x: 450, y: 120, w: 60, h: 280, color: '#d97706', fill: 'rgba(117,159,135,0.5)', radius: 3 });
      scenes.push({ time: 54, type: 'draw_text', x: 480, y: 420, text: data.concepts[2] || "Item 3", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 60, type: 'draw_rect', x: 600, y: 320, w: 60, h: 80, color: '#7c3aed', fill: 'rgba(157,189,85,0.5)', radius: 3 });
      scenes.push({ time: 66, type: 'draw_text', x: 630, y: 420, text: data.concepts[3] || "Item 4", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 72, type: 'clear' });
      scenes.push({ time: 78, type: 'draw_text', x: 400, y: 80, text: "Data Insights", font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 84, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#0891b2' });
      scenes.push({ time: 90, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 47,
    name: 'Gauge Meter',
    category: 'data_visualization',
    description: 'Semi-circular gauge showing a value range',
    tags: ["gauge","meter","range"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_line', x1: 100, y1: 400, x2: 700, y2: 400, color: '#2563eb', width: 2 });
      scenes.push({ time: 18, type: 'draw_line', x1: 100, y1: 80, x2: 100, y2: 400, color: '#2563eb', width: 2 });
      scenes.push({ time: 24, type: 'draw_rect', x: 150, y: 200, w: 60, h: 200, color: '#2563eb', fill: 'rgba(37,99,235,0.5)', radius: 3 });
      scenes.push({ time: 30, type: 'draw_text', x: 180, y: 420, text: data.concepts[0] || "Item 1", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 36, type: 'draw_rect', x: 300, y: 150, w: 60, h: 250, color: '#16a34a', fill: 'rgba(77,129,185,0.5)', radius: 3 });
      scenes.push({ time: 42, type: 'draw_text', x: 330, y: 420, text: data.concepts[1] || "Item 2", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 48, type: 'draw_rect', x: 450, y: 100, w: 60, h: 300, color: '#d97706', fill: 'rgba(117,159,135,0.5)', radius: 3 });
      scenes.push({ time: 54, type: 'draw_text', x: 480, y: 420, text: data.concepts[2] || "Item 3", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 60, type: 'draw_rect', x: 600, y: 300, w: 60, h: 100, color: '#7c3aed', fill: 'rgba(157,189,85,0.5)', radius: 3 });
      scenes.push({ time: 66, type: 'draw_text', x: 630, y: 420, text: data.concepts[3] || "Item 4", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 72, type: 'clear' });
      scenes.push({ time: 78, type: 'draw_text', x: 400, y: 80, text: "Data Insights", font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 84, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#0f766e' });
      scenes.push({ time: 90, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 48,
    name: 'Histogram Bins',
    category: 'data_visualization',
    description: 'Frequency distribution with bin ranges',
    tags: ["histogram","frequency","bins"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_line', x1: 100, y1: 400, x2: 700, y2: 400, color: '#2563eb', width: 2 });
      scenes.push({ time: 18, type: 'draw_line', x1: 100, y1: 80, x2: 100, y2: 400, color: '#2563eb', width: 2 });
      scenes.push({ time: 24, type: 'draw_rect', x: 150, y: 180, w: 60, h: 220, color: '#2563eb', fill: 'rgba(37,99,235,0.5)', radius: 3 });
      scenes.push({ time: 30, type: 'draw_text', x: 180, y: 420, text: data.concepts[0] || "Item 1", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 36, type: 'draw_rect', x: 300, y: 130, w: 60, h: 270, color: '#16a34a', fill: 'rgba(77,129,185,0.5)', radius: 3 });
      scenes.push({ time: 42, type: 'draw_text', x: 330, y: 420, text: data.concepts[1] || "Item 2", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 48, type: 'draw_rect', x: 450, y: 80, w: 60, h: 320, color: '#d97706', fill: 'rgba(117,159,135,0.5)', radius: 3 });
      scenes.push({ time: 54, type: 'draw_text', x: 480, y: 420, text: data.concepts[2] || "Item 3", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 60, type: 'draw_rect', x: 600, y: 280, w: 60, h: 120, color: '#7c3aed', fill: 'rgba(157,189,85,0.5)', radius: 3 });
      scenes.push({ time: 66, type: 'draw_text', x: 630, y: 420, text: data.concepts[3] || "Item 4", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 72, type: 'clear' });
      scenes.push({ time: 78, type: 'draw_text', x: 400, y: 80, text: "Data Insights", font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 84, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#2563eb' });
      scenes.push({ time: 90, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 49,
    name: 'Bubble Chart',
    category: 'data_visualization',
    description: 'Circles of varying size showing three dimensions',
    tags: ["bubble","three-dimensional","size"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_line', x1: 100, y1: 400, x2: 700, y2: 400, color: '#2563eb', width: 2 });
      scenes.push({ time: 18, type: 'draw_line', x1: 100, y1: 80, x2: 100, y2: 400, color: '#2563eb', width: 2 });
      scenes.push({ time: 24, type: 'draw_circle', cx: 150, cy: 250, r: 20, color: '#2563eb', fill: 'rgba(37,99,235,0.3)' });
      scenes.push({ time: 30, type: 'draw_text', x: 180, y: 420, text: data.concepts[0] || "Item 1", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 36, type: 'draw_circle', cx: 300, cy: 220, r: 35, color: '#16a34a', fill: 'rgba(77,129,185,0.3)' });
      scenes.push({ time: 42, type: 'draw_text', x: 330, y: 420, text: data.concepts[1] || "Item 2", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 48, type: 'draw_circle', cx: 450, cy: 190, r: 50, color: '#d97706', fill: 'rgba(117,159,135,0.3)' });
      scenes.push({ time: 54, type: 'draw_text', x: 480, y: 420, text: data.concepts[2] || "Item 3", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 60, type: 'draw_circle', cx: 600, cy: 160, r: 65, color: '#7c3aed', fill: 'rgba(157,189,85,0.3)' });
      scenes.push({ time: 66, type: 'draw_text', x: 630, y: 420, text: data.concepts[3] || "Item 4", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 72, type: 'clear' });
      scenes.push({ time: 78, type: 'draw_text', x: 400, y: 80, text: "Data Insights", font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 84, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#16a34a' });
      scenes.push({ time: 90, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 50,
    name: 'Number Highlight',
    category: 'data_visualization',
    description: 'Large numbers with context labels and trend arrows',
    tags: ["numbers","highlight","trend"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_line', x1: 100, y1: 400, x2: 700, y2: 400, color: '#2563eb', width: 2 });
      scenes.push({ time: 18, type: 'draw_line', x1: 100, y1: 80, x2: 100, y2: 400, color: '#2563eb', width: 2 });
      scenes.push({ time: 24, type: 'draw_rect', x: 150, y: 140, w: 60, h: 260, color: '#2563eb', fill: 'rgba(37,99,235,0.5)', radius: 3 });
      scenes.push({ time: 30, type: 'draw_text', x: 180, y: 420, text: data.concepts[0] || "Item 1", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 36, type: 'draw_rect', x: 300, y: 90, w: 60, h: 310, color: '#16a34a', fill: 'rgba(77,129,185,0.5)', radius: 3 });
      scenes.push({ time: 42, type: 'draw_text', x: 330, y: 420, text: data.concepts[1] || "Item 2", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 48, type: 'draw_rect', x: 450, y: 290, w: 60, h: 110, color: '#d97706', fill: 'rgba(117,159,135,0.5)', radius: 3 });
      scenes.push({ time: 54, type: 'draw_text', x: 480, y: 420, text: data.concepts[2] || "Item 3", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 60, type: 'draw_rect', x: 600, y: 240, w: 60, h: 160, color: '#7c3aed', fill: 'rgba(157,189,85,0.5)', radius: 3 });
      scenes.push({ time: 66, type: 'draw_text', x: 630, y: 420, text: data.concepts[3] || "Item 4", font: '12px', color: '#2563eb', align: 'center' });
      scenes.push({ time: 72, type: 'clear' });
      scenes.push({ time: 78, type: 'draw_text', x: 400, y: 80, text: "Data Insights", font: '22px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 84, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#d97706' });
      scenes.push({ time: 90, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 51,
    name: 'Problem-Solution Board',
    category: 'applied_teaching',
    description: 'Problem stated, then solution built step by step',
    tags: ["problem","solution","steps"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 50, y: 70, w: 700, h: 70, color: '#be123c', fill: 'rgba(190,18,60,0.08)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 80, y: 95, text: "Problem:", font: '18px bold', color: '#be123c' });
      scenes.push({ time: 24, type: 'draw_text', x: 80, y: 125, text: data.concepts[0], font: '16px', color: '#0f766e' });
      scenes.push({ time: 30, type: 'draw_arrow', x1: 400, y1: 140, x2: 400, y2: 170, color: '#2563eb' });
      scenes.push({ time: 36, type: 'draw_rect', x: 50, y: 180, w: 700, h: 70, color: '#16a34a', fill: 'rgba(22,163,106,0.08)', radius: 8 });
      scenes.push({ time: 42, type: 'draw_text', x: 80, y: 205, text: "Solution:", font: '18px bold', color: '#16a34a' });
      scenes.push({ time: 48, type: 'draw_text', x: 80, y: 235, text: data.concepts[1], font: '16px', color: '#0f766e' });
      scenes.push({ time: 54, type: 'draw_arrow', x1: 400, y1: 250, x2: 400, y2: 280, color: '#2563eb' });
      scenes.push({ time: 60, type: 'draw_rect', x: 50, y: 290, w: 700, h: 70, color: '#d97706', fill: 'rgba(217,119,6,0.08)', radius: 8 });
      scenes.push({ time: 66, type: 'draw_text', x: 80, y: 315, text: "Result:", font: '18px bold', color: '#d97706' });
      scenes.push({ time: 72, type: 'draw_text', x: 80, y: 345, text: data.concepts[2], font: '16px', color: '#0f766e' });
      scenes.push({ time: 78, type: 'clear' });
      scenes.push({ time: 84, type: 'draw_text', x: 400, y: 80, text: "Takeaway", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 90, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#2563eb' });
      scenes.push({ time: 96, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 52,
    name: 'Case Study Layout',
    category: 'applied_teaching',
    description: 'Real-world scenario with analysis annotations',
    tags: ["case-study","scenario","analysis"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 60, y: 80, w: 680, h: 80, color: '#2563eb', fill: 'rgba(37,99,235,0.04)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 100, y: 110, text: "Analyze:", font: '16px bold', color: '#2563eb' });
      scenes.push({ time: 24, type: 'draw_text', x: 100, y: 135, text: data.steps[0] || data.concepts[0], font: '15px', color: '#0f766e' });
      scenes.push({ time: 30, type: 'draw_arrow', x1: 400, y1: 160, x2: 400, y2: 190, color: '#2563eb' });
      scenes.push({ time: 36, type: 'draw_rect', x: 60, y: 190, w: 680, h: 80, color: '#16a34a', fill: 'rgba(37,99,235,0.05)', radius: 8 });
      scenes.push({ time: 42, type: 'draw_text', x: 100, y: 220, text: "Analyze:", font: '16px bold', color: '#16a34a' });
      scenes.push({ time: 48, type: 'draw_text', x: 100, y: 245, text: data.steps[1] || data.concepts[1], font: '15px', color: '#0f766e' });
      scenes.push({ time: 54, type: 'draw_arrow', x1: 400, y1: 270, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 60, type: 'draw_rect', x: 60, y: 300, w: 680, h: 80, color: '#d97706', fill: 'rgba(37,99,235,0.06)', radius: 8 });
      scenes.push({ time: 66, type: 'draw_text', x: 100, y: 330, text: "Analyze:", font: '16px bold', color: '#d97706' });
      scenes.push({ time: 72, type: 'draw_text', x: 100, y: 355, text: data.steps[2] || data.concepts[2], font: '15px', color: '#0f766e' });
      scenes.push({ time: 78, type: 'clear' });
      scenes.push({ time: 84, type: 'draw_text', x: 400, y: 80, text: "Takeaway", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 90, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#16a34a' });
      scenes.push({ time: 96, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 53,
    name: 'Worked Example',
    category: 'applied_teaching',
    description: 'Step-by-step worked mathematical/logical example',
    tags: ["worked","example","math"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_text', x: 80, y: 90, text: "Step 1:", font: '16px bold', color: '#16a34a' });
      scenes.push({ time: 18, type: 'show_equation', x: 200, y: 90, text: data.equation || data.concepts[0], color: '#2563eb' });
      scenes.push({ time: 24, type: 'draw_arrow', x1: 400, y1: 120, x2: 400, y2: 150, color: '#2563eb' });
      scenes.push({ time: 30, type: 'draw_text', x: 80, y: 170, text: "Step 2:", font: '16px bold', color: '#d97706' });
      scenes.push({ time: 36, type: 'draw_text', x: 200, y: 170, text: data.steps[1] || data.concepts[1], font: '16px', color: '#0f766e' });
      scenes.push({ time: 42, type: 'draw_arrow', x1: 400, y1: 200, x2: 400, y2: 230, color: '#2563eb' });
      scenes.push({ time: 48, type: 'draw_text', x: 80, y: 250, text: "Step 3:", font: '16px bold', color: '#7c3aed' });
      scenes.push({ time: 54, type: 'draw_text', x: 200, y: 250, text: data.steps[2] || data.concepts[2], font: '16px', color: '#0f766e' });
      scenes.push({ time: 60, type: 'draw_rect', x: 100, y: 300, w: 600, h: 60, color: '#16a34a', fill: 'rgba(22,163,106,0.1)', radius: 8 });
      scenes.push({ time: 66, type: 'draw_text', x: 400, y: 335, text: "Answer: " + (data.summary || ""), font: '18px bold', color: '#16a34a', align: 'center' });
      scenes.push({ time: 72, type: 'clear' });
      scenes.push({ time: 78, type: 'draw_text', x: 400, y: 80, text: "Takeaway", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 84, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#d97706' });
      scenes.push({ time: 90, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 54,
    name: 'Experiment Setup',
    category: 'applied_teaching',
    description: 'Visual showing experimental setup and results',
    tags: ["experiment","setup","results"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 60, y: 80, w: 680, h: 80, color: '#2563eb', fill: 'rgba(37,99,235,0.04)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 100, y: 110, text: "Experiment:", font: '16px bold', color: '#2563eb' });
      scenes.push({ time: 24, type: 'draw_text', x: 100, y: 135, text: data.steps[0] || data.concepts[0], font: '15px', color: '#0f766e' });
      scenes.push({ time: 30, type: 'draw_arrow', x1: 400, y1: 160, x2: 400, y2: 190, color: '#2563eb' });
      scenes.push({ time: 36, type: 'draw_rect', x: 60, y: 190, w: 680, h: 80, color: '#16a34a', fill: 'rgba(37,99,235,0.05)', radius: 8 });
      scenes.push({ time: 42, type: 'draw_text', x: 100, y: 220, text: "Experiment:", font: '16px bold', color: '#16a34a' });
      scenes.push({ time: 48, type: 'draw_text', x: 100, y: 245, text: data.steps[1] || data.concepts[1], font: '15px', color: '#0f766e' });
      scenes.push({ time: 54, type: 'draw_arrow', x1: 400, y1: 270, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 60, type: 'draw_rect', x: 60, y: 300, w: 680, h: 80, color: '#d97706', fill: 'rgba(37,99,235,0.06)', radius: 8 });
      scenes.push({ time: 66, type: 'draw_text', x: 100, y: 330, text: "Experiment:", font: '16px bold', color: '#d97706' });
      scenes.push({ time: 72, type: 'draw_text', x: 100, y: 355, text: data.steps[2] || data.concepts[2], font: '15px', color: '#0f766e' });
      scenes.push({ time: 78, type: 'clear' });
      scenes.push({ time: 84, type: 'draw_text', x: 400, y: 80, text: "Takeaway", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 90, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#7c3aed' });
      scenes.push({ time: 96, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 55,
    name: 'Recipe Format',
    category: 'applied_teaching',
    description: 'Ingredients/inputs listed, then procedure, then output',
    tags: ["recipe","inputs","procedure"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 60, y: 80, w: 680, h: 80, color: '#2563eb', fill: 'rgba(37,99,235,0.04)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 100, y: 110, text: "Setup:", font: '16px bold', color: '#2563eb' });
      scenes.push({ time: 24, type: 'draw_text', x: 100, y: 135, text: data.steps[0] || data.concepts[0], font: '15px', color: '#0f766e' });
      scenes.push({ time: 30, type: 'draw_arrow', x1: 400, y1: 160, x2: 400, y2: 190, color: '#2563eb' });
      scenes.push({ time: 36, type: 'draw_rect', x: 60, y: 190, w: 680, h: 80, color: '#16a34a', fill: 'rgba(37,99,235,0.05)', radius: 8 });
      scenes.push({ time: 42, type: 'draw_text', x: 100, y: 220, text: "Setup:", font: '16px bold', color: '#16a34a' });
      scenes.push({ time: 48, type: 'draw_text', x: 100, y: 245, text: data.steps[1] || data.concepts[1], font: '15px', color: '#0f766e' });
      scenes.push({ time: 54, type: 'draw_arrow', x1: 400, y1: 270, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 60, type: 'draw_rect', x: 60, y: 300, w: 680, h: 80, color: '#d97706', fill: 'rgba(37,99,235,0.06)', radius: 8 });
      scenes.push({ time: 66, type: 'draw_text', x: 100, y: 330, text: "Setup:", font: '16px bold', color: '#d97706' });
      scenes.push({ time: 72, type: 'draw_text', x: 100, y: 355, text: data.steps[2] || data.concepts[2], font: '15px', color: '#0f766e' });
      scenes.push({ time: 78, type: 'clear' });
      scenes.push({ time: 84, type: 'draw_text', x: 400, y: 80, text: "Takeaway", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 90, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#be123c' });
      scenes.push({ time: 96, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 56,
    name: 'Debug Walkthrough',
    category: 'applied_teaching',
    description: 'Finding and fixing an error step by step',
    tags: ["debug","error","fix"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 60, y: 80, w: 680, h: 80, color: '#2563eb', fill: 'rgba(37,99,235,0.04)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 100, y: 110, text: "Debug:", font: '16px bold', color: '#2563eb' });
      scenes.push({ time: 24, type: 'draw_text', x: 100, y: 135, text: data.steps[0] || data.concepts[0], font: '15px', color: '#0f766e' });
      scenes.push({ time: 30, type: 'draw_arrow', x1: 400, y1: 160, x2: 400, y2: 190, color: '#2563eb' });
      scenes.push({ time: 36, type: 'draw_rect', x: 60, y: 190, w: 680, h: 80, color: '#16a34a', fill: 'rgba(37,99,235,0.05)', radius: 8 });
      scenes.push({ time: 42, type: 'draw_text', x: 100, y: 220, text: "Debug:", font: '16px bold', color: '#16a34a' });
      scenes.push({ time: 48, type: 'draw_text', x: 100, y: 245, text: data.steps[1] || data.concepts[1], font: '15px', color: '#0f766e' });
      scenes.push({ time: 54, type: 'draw_arrow', x1: 400, y1: 270, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 60, type: 'draw_rect', x: 60, y: 300, w: 680, h: 80, color: '#d97706', fill: 'rgba(37,99,235,0.06)', radius: 8 });
      scenes.push({ time: 66, type: 'draw_text', x: 100, y: 330, text: "Debug:", font: '16px bold', color: '#d97706' });
      scenes.push({ time: 72, type: 'draw_text', x: 100, y: 355, text: data.steps[2] || data.concepts[2], font: '15px', color: '#0f766e' });
      scenes.push({ time: 78, type: 'clear' });
      scenes.push({ time: 84, type: 'draw_text', x: 400, y: 80, text: "Takeaway", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 90, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#0891b2' });
      scenes.push({ time: 96, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 57,
    name: 'Real-World Map',
    category: 'applied_teaching',
    description: 'Concept mapped to real-world application visually',
    tags: ["real-world","mapping","application"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 60, y: 80, w: 680, h: 80, color: '#2563eb', fill: 'rgba(37,99,235,0.04)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 100, y: 110, text: "Map:", font: '16px bold', color: '#2563eb' });
      scenes.push({ time: 24, type: 'draw_text', x: 100, y: 135, text: data.steps[0] || data.concepts[0], font: '15px', color: '#0f766e' });
      scenes.push({ time: 30, type: 'draw_arrow', x1: 400, y1: 160, x2: 400, y2: 190, color: '#2563eb' });
      scenes.push({ time: 36, type: 'draw_rect', x: 60, y: 190, w: 680, h: 80, color: '#16a34a', fill: 'rgba(37,99,235,0.05)', radius: 8 });
      scenes.push({ time: 42, type: 'draw_text', x: 100, y: 220, text: "Map:", font: '16px bold', color: '#16a34a' });
      scenes.push({ time: 48, type: 'draw_text', x: 100, y: 245, text: data.steps[1] || data.concepts[1], font: '15px', color: '#0f766e' });
      scenes.push({ time: 54, type: 'draw_arrow', x1: 400, y1: 270, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 60, type: 'draw_rect', x: 60, y: 300, w: 680, h: 80, color: '#d97706', fill: 'rgba(37,99,235,0.06)', radius: 8 });
      scenes.push({ time: 66, type: 'draw_text', x: 100, y: 330, text: "Map:", font: '16px bold', color: '#d97706' });
      scenes.push({ time: 72, type: 'draw_text', x: 100, y: 355, text: data.steps[2] || data.concepts[2], font: '15px', color: '#0f766e' });
      scenes.push({ time: 78, type: 'clear' });
      scenes.push({ time: 84, type: 'draw_text', x: 400, y: 80, text: "Takeaway", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 90, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#0f766e' });
      scenes.push({ time: 96, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 58,
    name: 'Quiz Review',
    category: 'applied_teaching',
    description: 'Question posed, wrong answers eliminated, correct shown',
    tags: ["quiz","elimination","review"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 60, y: 80, w: 680, h: 80, color: '#2563eb', fill: 'rgba(37,99,235,0.04)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 100, y: 110, text: "Question:", font: '16px bold', color: '#2563eb' });
      scenes.push({ time: 24, type: 'draw_text', x: 100, y: 135, text: data.steps[0] || data.concepts[0], font: '15px', color: '#0f766e' });
      scenes.push({ time: 30, type: 'draw_arrow', x1: 400, y1: 160, x2: 400, y2: 190, color: '#2563eb' });
      scenes.push({ time: 36, type: 'draw_rect', x: 60, y: 190, w: 680, h: 80, color: '#16a34a', fill: 'rgba(37,99,235,0.05)', radius: 8 });
      scenes.push({ time: 42, type: 'draw_text', x: 100, y: 220, text: "Question:", font: '16px bold', color: '#16a34a' });
      scenes.push({ time: 48, type: 'draw_text', x: 100, y: 245, text: data.steps[1] || data.concepts[1], font: '15px', color: '#0f766e' });
      scenes.push({ time: 54, type: 'draw_arrow', x1: 400, y1: 270, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 60, type: 'draw_rect', x: 60, y: 300, w: 680, h: 80, color: '#d97706', fill: 'rgba(37,99,235,0.06)', radius: 8 });
      scenes.push({ time: 66, type: 'draw_text', x: 100, y: 330, text: "Question:", font: '16px bold', color: '#d97706' });
      scenes.push({ time: 72, type: 'draw_text', x: 100, y: 355, text: data.steps[2] || data.concepts[2], font: '15px', color: '#0f766e' });
      scenes.push({ time: 78, type: 'clear' });
      scenes.push({ time: 84, type: 'draw_text', x: 400, y: 80, text: "Takeaway", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 90, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#2563eb' });
      scenes.push({ time: 96, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 59,
    name: 'Summary Recap',
    category: 'applied_teaching',
    description: 'Key points from lesson gathered into final summary',
    tags: ["summary","recap","key-points"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 60, y: 80, w: 680, h: 80, color: '#2563eb', fill: 'rgba(37,99,235,0.04)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 100, y: 110, text: "Summarize:", font: '16px bold', color: '#2563eb' });
      scenes.push({ time: 24, type: 'draw_text', x: 100, y: 135, text: data.steps[0] || data.concepts[0], font: '15px', color: '#0f766e' });
      scenes.push({ time: 30, type: 'draw_arrow', x1: 400, y1: 160, x2: 400, y2: 190, color: '#2563eb' });
      scenes.push({ time: 36, type: 'draw_rect', x: 60, y: 190, w: 680, h: 80, color: '#16a34a', fill: 'rgba(37,99,235,0.05)', radius: 8 });
      scenes.push({ time: 42, type: 'draw_text', x: 100, y: 220, text: "Summarize:", font: '16px bold', color: '#16a34a' });
      scenes.push({ time: 48, type: 'draw_text', x: 100, y: 245, text: data.steps[1] || data.concepts[1], font: '15px', color: '#0f766e' });
      scenes.push({ time: 54, type: 'draw_arrow', x1: 400, y1: 270, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 60, type: 'draw_rect', x: 60, y: 300, w: 680, h: 80, color: '#d97706', fill: 'rgba(37,99,235,0.06)', radius: 8 });
      scenes.push({ time: 66, type: 'draw_text', x: 100, y: 330, text: "Summarize:", font: '16px bold', color: '#d97706' });
      scenes.push({ time: 72, type: 'draw_text', x: 100, y: 355, text: data.steps[2] || data.concepts[2], font: '15px', color: '#0f766e' });
      scenes.push({ time: 78, type: 'clear' });
      scenes.push({ time: 84, type: 'draw_text', x: 400, y: 80, text: "Takeaway", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 90, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#16a34a' });
      scenes.push({ time: 96, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
  {
    id: 60,
    name: 'Connection Bridge',
    category: 'applied_teaching',
    description: 'Bridges two concepts showing how they relate',
    tags: ["bridge","connection","relate"],
    generator: (data) => {
      const scenes = [];
      scenes.push({ time: 6, type: 'draw_text', x: 400, y: 40, text: data.title, font: '26px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 12, type: 'draw_rect', x: 60, y: 80, w: 680, h: 80, color: '#2563eb', fill: 'rgba(37,99,235,0.04)', radius: 8 });
      scenes.push({ time: 18, type: 'draw_text', x: 100, y: 110, text: "Connect:", font: '16px bold', color: '#2563eb' });
      scenes.push({ time: 24, type: 'draw_text', x: 100, y: 135, text: data.steps[0] || data.concepts[0], font: '15px', color: '#0f766e' });
      scenes.push({ time: 30, type: 'draw_arrow', x1: 400, y1: 160, x2: 400, y2: 190, color: '#2563eb' });
      scenes.push({ time: 36, type: 'draw_rect', x: 60, y: 190, w: 680, h: 80, color: '#16a34a', fill: 'rgba(37,99,235,0.05)', radius: 8 });
      scenes.push({ time: 42, type: 'draw_text', x: 100, y: 220, text: "Connect:", font: '16px bold', color: '#16a34a' });
      scenes.push({ time: 48, type: 'draw_text', x: 100, y: 245, text: data.steps[1] || data.concepts[1], font: '15px', color: '#0f766e' });
      scenes.push({ time: 54, type: 'draw_arrow', x1: 400, y1: 270, x2: 400, y2: 300, color: '#2563eb' });
      scenes.push({ time: 60, type: 'draw_rect', x: 60, y: 300, w: 680, h: 80, color: '#d97706', fill: 'rgba(37,99,235,0.06)', radius: 8 });
      scenes.push({ time: 66, type: 'draw_text', x: 100, y: 330, text: "Connect:", font: '16px bold', color: '#d97706' });
      scenes.push({ time: 72, type: 'draw_text', x: 100, y: 355, text: data.steps[2] || data.concepts[2], font: '15px', color: '#0f766e' });
      scenes.push({ time: 78, type: 'clear' });
      scenes.push({ time: 84, type: 'draw_text', x: 400, y: 80, text: "Takeaway", font: '24px bold', color: '#2563eb', align: 'center' });
      scenes.push({ time: 90, type: 'draw_callout', x: 100, y: 130, w: 600, text: data.summary, color: '#d97706' });
      scenes.push({ time: 96, type: 'draw_badge', x: 350, y: 350, text: data.concepts[0], color: '#16a34a' });
      return scenes;
    }
  },
];

/**
 * Build template data from a lesson part, extracting concepts, definitions,
 * steps, and other elements needed by the template generators.
 * @param {object} part - Lesson part object with key_concepts, narration, title, etc.
 * @param {string} lessonTitle - Overall lesson title
 * @param {object|null} comprehension - AI comprehension result with extracted info
 * @returns {object} Data object ready for template generators
 */
function buildTemplateData(part, lessonTitle, comprehension) {
  const concepts = (part.key_concepts || []).slice(0, 6);
  // Ensure at least 3 concepts for templates that reference data.concepts[0..2]
  while (concepts.length < 3) {
    concepts.push(concepts[0] || lessonTitle || 'Key Idea');
  }

  const narration = part.narration || '';
  // Extract sentences as potential definitions
  const sentences = narration.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  const definitions = sentences.slice(0, 3);
  while (definitions.length < 3) {
    definitions.push(definitions[0] || `${concepts[0]} is a fundamental concept`);
  }

  // Extract steps from visual_logic or narration
  let steps = [];
  if (part.visual_logic) {
    steps = part.visual_logic
      .filter(v => v.semantic_role === 'sequence' || v.type === 'process' || v.type === 'step')
      .map(v => v.content || v.label || '')
      .filter(Boolean);
  }
  if (steps.length === 0) {
    steps = concepts.map((c, i) => `Step ${i + 1}: ${c}`);
  }
  while (steps.length < 4) {
    steps.push(steps[steps.length - 1] || `Step ${steps.length + 1}`);
  }

  // Extract relationships
  const relationships = [];
  if (part.visual_logic) {
    for (const v of part.visual_logic) {
      if (v.relationship) {
        relationships.push({ from: v.content || concepts[0], to: concepts[1] || '', type: v.relationship });
      }
    }
  }
  if (relationships.length === 0) {
    relationships.push({ from: concepts[0], to: concepts[1], type: 'relates to' });
  }

  // Extract equation if present
  let equation = '';
  if (part.visual_logic) {
    const eqEntry = part.visual_logic.find(v => v.type === 'equation' || v.semantic_role === 'equation');
    if (eqEntry) equation = eqEntry.content || '';
  }

  // Build summary
  const summary = sentences.length > 0
    ? sentences.slice(0, 2).join('. ') + '.'
    : `${lessonTitle}: ${concepts.slice(0, 3).join(', ')}`;

  return {
    title: part.title || lessonTitle || 'Key Concepts',
    concepts,
    definitions,
    steps,
    relationships,
    equation,
    summary: summary.slice(0, 200),
  };
}

/**
 * Select the best template based on content characteristics.
 * @param {string} field - Subject field (e.g., 'math', 'science', 'history')
 * @param {Array} concepts - List of concepts to teach
 * @param {boolean} hasEquation - Whether content includes equations
 * @param {boolean} hasTable - Whether content includes tabular data
 * @param {boolean} hasGraph - Whether content includes graph data
 * @param {boolean} hasSteps - Whether content includes sequential steps
 * @param {number} [contentIndex=0] - Index of content part for variety
 * @returns {object} Selected template
 */
function selectTemplate(field, concepts, hasEquation, hasTable, hasGraph, hasSteps, contentIndex = 0) {
  let candidates = [];

  if (hasSteps) {
    candidates = WHITEBOARD_TEMPLATES.filter(t => t.category === 'process_flow');
  } else if (hasTable) {
    candidates = WHITEBOARD_TEMPLATES.filter(t => t.category === 'comparison');
  } else if (hasGraph || hasEquation) {
    candidates = WHITEBOARD_TEMPLATES.filter(t => t.category === 'data_visualization');
  } else if (concepts && concepts.length > 4) {
    candidates = WHITEBOARD_TEMPLATES.filter(t => t.category === 'hierarchy_tree');
  } else if (concepts && concepts.length <= 3) {
    candidates = WHITEBOARD_TEMPLATES.filter(t => t.category === 'concept_introduction');
  } else {
    candidates = WHITEBOARD_TEMPLATES.filter(t => t.category === 'applied_teaching');
  }

  // Pick based on field hash + contentIndex for variety across parts
  const hash = (field || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const index = (hash + (contentIndex || 0)) % candidates.length;
  return candidates[index];
}

/**
 * Apply a template by ID with provided data.
 * @param {number|string} templateId - Template ID (1-60)
 * @param {object} data - Data object with title, concepts, definitions, etc.
 * @returns {Array} Array of scene objects
 */
function applyTemplate(templateId, data) {
  const id = typeof templateId === 'string' ? parseInt(templateId, 10) : templateId;
  const template = WHITEBOARD_TEMPLATES.find(t => t.id === id);
  if (!template) {
    throw new Error(`Template with id ${id} not found. Valid range: 1-60.`);
  }
  return template.generator(data);
}

export {
  WHITEBOARD_TEMPLATES,
  selectTemplate,
  applyTemplate,
  buildTemplateData,
  COLORS
};
