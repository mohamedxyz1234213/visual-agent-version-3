// -----------------------------------------------------------------------------
// SVG Shape Library - Pre-built scientific diagrams and educational shapes
// -----------------------------------------------------------------------------
// Provides reusable, high-quality SVG shapes for templates to use.
// All shapes are designed to be clear, educational, and visually appealing.
// -----------------------------------------------------------------------------

/**
 * Generate a DNA double helix
 */
export function dnaHelix(x, y, width, height) {
  const segments = [];
  const turns = 3;
  const pointsPerTurn = 12;

  for (let i = 0; i <= turns * pointsPerTurn; i++) {
    const t = i / pointsPerTurn;
    const yPos = y + (height * i) / (turns * pointsPerTurn);
    const xOffset = Math.sin(t * Math.PI * 2) * (width / 4);

    // Left strand
    segments.push({
      type: 'draw_circle',
      center: [x + width / 2 - xOffset, yPos],
      radius: 4,
      style: { fill: '#2563eb', stroke: '#2563eb' }
    });

    // Right strand
    segments.push({
      type: 'draw_circle',
      center: [x + width / 2 + xOffset, yPos],
      radius: 4,
      style: { fill: '#dc2626', stroke: '#dc2626' }
    });

    // Base pairs (every 3rd point)
    if (i % 3 === 0) {
      segments.push({
        type: 'draw_line',
        from: [x + width / 2 - xOffset, yPos],
        to: [x + width / 2 + xOffset, yPos],
        style: { color: '#94a3b8', strokeWidth: 1.5 }
      });
    }
  }

  return segments;
}

/**
 * Generate a neuron with dendrites and axon
 */
export function neuron(x, y, size) {
  const segments = [];
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const bodyRadius = size / 6;

  // Cell body
  segments.push({
    type: 'draw_circle',
    center: [centerX, centerY],
    radius: bodyRadius,
    style: { fill: '#fef3c7', stroke: '#f59e0b', strokeWidth: 2 }
  });

  // Nucleus
  segments.push({
    type: 'draw_circle',
    center: [centerX, centerY],
    radius: bodyRadius / 2,
    style: { fill: '#fbbf24', stroke: '#f59e0b', strokeWidth: 1 }
  });

  // Dendrites (input branches)
  const dendrites = 5;
  for (let i = 0; i < dendrites; i++) {
    const angle = (Math.PI * 1.5 + (Math.PI / dendrites) * i) - Math.PI / 2;
    const length = size / 3;
    const endX = centerX + Math.cos(angle) * length;
    const endY = centerY + Math.sin(angle) * length;

    segments.push({
      type: 'draw_path',
      d: `M ${centerX + Math.cos(angle) * bodyRadius} ${centerY + Math.sin(angle) * bodyRadius} Q ${centerX + Math.cos(angle) * length * 0.6} ${centerY + Math.sin(angle) * length * 0.6} ${endX} ${endY}`,
      style: { stroke: '#f59e0b', strokeWidth: 2, fill: 'none' }
    });
  }

  // Axon (output)
  const axonLength = size / 2;
  segments.push({
    type: 'draw_line',
    from: [centerX, centerY + bodyRadius],
    to: [centerX, centerY + bodyRadius + axonLength],
    style: { color: '#f59e0b', strokeWidth: 3 }
  });

  // Axon terminals
  const terminals = 3;
  for (let i = 0; i < terminals; i++) {
    const termX = centerX + (i - 1) * 15;
    const termY = centerY + bodyRadius + axonLength;
    segments.push({
      type: 'draw_circle',
      center: [termX, termY],
      radius: 5,
      style: { fill: '#f59e0b', stroke: '#f59e0b' }
    });
  }

  return segments;
}

/**
 * Generate an atom with electron shells
 */
export function atom(x, y, size, electrons = [2, 8, 4]) {
  const segments = [];
  const centerX = x + size / 2;
  const centerY = y + size / 2;

  // Nucleus
  segments.push({
    type: 'draw_circle',
    center: [centerX, centerY],
    radius: size / 10,
    style: { fill: '#dc2626', stroke: '#991b1b', strokeWidth: 2 }
  });

  // Electron shells
  electrons.forEach((count, shellIndex) => {
    const radius = (size / 4) * (shellIndex + 1);

    // Shell orbit
    segments.push({
      type: 'draw_circle',
      center: [centerX, centerY],
      radius: radius,
      style: { fill: 'none', stroke: '#cbd5e1', strokeWidth: 1, dashed: true }
    });

    // Electrons
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count;
      const ex = centerX + Math.cos(angle) * radius;
      const ey = centerY + Math.sin(angle) * radius;

      segments.push({
        type: 'draw_circle',
        center: [ex, ey],
        radius: 6,
        style: { fill: '#2563eb', stroke: '#1e40af', strokeWidth: 1.5 }
      });
    }
  });

  return segments;
}

/**
 * Generate a plant cell with organelles
 */
export function plantCell(x, y, width, height) {
  const segments = [];

  // Cell wall
  segments.push({
    type: 'draw_rect',
    x, y, width, height,
    style: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 3, rx: 8 }
  });

  // Cell membrane (inside wall)
  segments.push({
    type: 'draw_rect',
    x: x + 8, y: y + 8, width: width - 16, height: height - 16,
    style: { fill: 'none', stroke: '#4ade80', strokeWidth: 1.5, rx: 6, dashed: true }
  });

  // Nucleus
  const nucleusX = x + width * 0.3;
  const nucleusY = y + height * 0.3;
  segments.push({
    type: 'draw_circle',
    center: [nucleusX, nucleusY],
    radius: width / 8,
    style: { fill: '#dbeafe', stroke: '#2563eb', strokeWidth: 2 }
  });

  // Nucleolus
  segments.push({
    type: 'draw_circle',
    center: [nucleusX, nucleusY],
    radius: width / 16,
    style: { fill: '#3b82f6', stroke: '#1e40af', strokeWidth: 1 }
  });

  // Chloroplasts
  const chloroplasts = [
    [x + width * 0.7, y + height * 0.25],
    [x + width * 0.65, y + height * 0.6],
    [x + width * 0.25, y + height * 0.7]
  ];

  chloroplasts.forEach(([cx, cy]) => {
    segments.push({
      type: 'draw_path',
      d: `M ${cx - 15} ${cy} Q ${cx - 15} ${cy - 10} ${cx} ${cy - 10} Q ${cx + 15} ${cy - 10} ${cx + 15} ${cy} Q ${cx + 15} ${cy + 10} ${cx} ${cy + 10} Q ${cx - 15} ${cy + 10} ${cx - 15} ${cy}`,
      style: { fill: '#86efac', stroke: '#16a34a', strokeWidth: 1.5 }
    });
  });

  // Vacuole (large central)
  segments.push({
    type: 'draw_circle',
    center: [x + width * 0.6, y + height * 0.5],
    radius: width / 6,
    style: { fill: '#e0f2fe', stroke: '#0ea5e9', strokeWidth: 1.5, dashed: true }
  });

  // Mitochondria
  segments.push({
    type: 'draw_path',
    d: `M ${x + width * 0.35} ${y + height * 0.65} Q ${x + width * 0.35} ${y + height * 0.55} ${x + width * 0.45} ${y + height * 0.55} Q ${x + width * 0.55} ${y + height * 0.55} ${x + width * 0.55} ${y + height * 0.65} Q ${x + width * 0.55} ${y + height * 0.75} ${x + width * 0.45} ${y + height * 0.75} Q ${x + width * 0.35} ${y + height * 0.75} ${x + width * 0.35} ${y + height * 0.65}`,
    style: { fill: '#fef3c7', stroke: '#f59e0b', strokeWidth: 1.5 }
  });

  return segments;
}

/**
 * Generate a sine wave
 */
export function sineWave(x, y, width, height, cycles = 2) {
  const points = [];
  const steps = 50;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = x + t * width;
    const py = y + height / 2 + Math.sin(t * cycles * Math.PI * 2) * (height / 3);
    points.push(`${i === 0 ? 'M' : 'L'} ${px} ${py}`);
  }

  return [{
    type: 'draw_path',
    d: points.join(' '),
    style: { stroke: '#2563eb', strokeWidth: 2.5, fill: 'none' }
  }];
}

/**
 * Generate a gear/cog
 */
export function gear(x, y, size, teeth = 12) {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const outerRadius = size / 2;
  const innerRadius = outerRadius * 0.7;
  const toothHeight = outerRadius * 0.2;

  const points = [];

  for (let i = 0; i < teeth; i++) {
    const angle1 = (2 * Math.PI * i) / teeth;
    const angle2 = (2 * Math.PI * (i + 0.4)) / teeth;
    const angle3 = (2 * Math.PI * (i + 0.6)) / teeth;
    const angle4 = (2 * Math.PI * (i + 1)) / teeth;

    // Inner arc
    points.push(`${i === 0 ? 'M' : 'L'} ${centerX + Math.cos(angle1) * innerRadius} ${centerY + Math.sin(angle1) * innerRadius}`);

    // Tooth
    points.push(`L ${centerX + Math.cos(angle2) * innerRadius} ${centerY + Math.sin(angle2) * innerRadius}`);
    points.push(`L ${centerX + Math.cos(angle2) * (innerRadius + toothHeight)} ${centerY + Math.sin(angle2) * (innerRadius + toothHeight)}`);
    points.push(`L ${centerX + Math.cos(angle3) * (innerRadius + toothHeight)} ${centerY + Math.sin(angle3) * (innerRadius + toothHeight)}`);
    points.push(`L ${centerX + Math.cos(angle3) * innerRadius} ${centerY + Math.sin(angle3) * innerRadius}`);
  }

  points.push('Z');

  return [
    {
      type: 'draw_path',
      d: points.join(' '),
      style: { fill: '#cbd5e1', stroke: '#475569', strokeWidth: 2 }
    },
    {
      type: 'draw_circle',
      center: [centerX, centerY],
      radius: innerRadius * 0.3,
      style: { fill: '#ffffff', stroke: '#475569', strokeWidth: 2 }
    }
  ];
}

/**
 * Generate a battery icon
 */
export function battery(x, y, width, height, charge = 75) {
  const segments = [];

  // Battery body
  segments.push({
    type: 'draw_rect',
    x, y, width: width * 0.85, height,
    style: { fill: '#ffffff', stroke: '#475569', strokeWidth: 2, rx: 4 }
  });

  // Battery terminal
  segments.push({
    type: 'draw_rect',
    x: x + width * 0.85, y: y + height * 0.3, width: width * 0.15, height: height * 0.4,
    style: { fill: '#475569', stroke: '#475569', strokeWidth: 2, rx: 2 }
  });

  // Charge level
  const chargeWidth = (width * 0.85 - 8) * (charge / 100);
  const chargeColor = charge > 50 ? '#16a34a' : charge > 20 ? '#f59e0b' : '#dc2626';

  segments.push({
    type: 'draw_rect',
    x: x + 4, y: y + 4, width: chargeWidth, height: height - 8,
    style: { fill: chargeColor, stroke: 'none', rx: 2 }
  });

  return segments;
}

/**
 * Generate a magnet
 */
export function magnet(x, y, width, height) {
  const segments = [];
  const poleWidth = width * 0.4;

  // North pole (red)
  segments.push({
    type: 'draw_rect',
    x, y, width: poleWidth, height,
    style: { fill: '#fecaca', stroke: '#dc2626', strokeWidth: 2, rx: 4 }
  });

  segments.push({
    type: 'draw_text',
    content: 'N',
    position: [x + poleWidth / 2, y + height / 2 + 6],
    style: { fontSize: 20, fontWeight: '800', color: '#dc2626', textAnchor: 'middle' }
  });

  // South pole (blue)
  segments.push({
    type: 'draw_rect',
    x: x + width - poleWidth, y, width: poleWidth, height,
    style: { fill: '#bfdbfe', stroke: '#2563eb', strokeWidth: 2, rx: 4 }
  });

  segments.push({
    type: 'draw_text',
    content: 'S',
    position: [x + width - poleWidth / 2, y + height / 2 + 6],
    style: { fontSize: 20, fontWeight: '800', color: '#2563eb', textAnchor: 'middle' }
  });

  // Middle section
  segments.push({
    type: 'draw_rect',
    x: x + poleWidth, y, width: width - poleWidth * 2, height,
    style: { fill: '#e5e7eb', stroke: '#6b7280', strokeWidth: 2 }
  });

  return segments;
}

/**
 * Generate magnetic field lines
 */
export function magneticFieldLines(x, y, width, height) {
  const segments = [];
  const lines = 5;

  for (let i = 0; i < lines; i++) {
    const yOffset = (height / (lines + 1)) * (i + 1);
    const curve = 30 + i * 10;

    segments.push({
      type: 'draw_path',
      d: `M ${x} ${y + yOffset} Q ${x + width / 2} ${y + yOffset - curve} ${x + width} ${y + yOffset}`,
      markerEnd: 'arr-blue',
      style: { stroke: '#2563eb', strokeWidth: 1.5, fill: 'none', dashed: true }
    });
  }

  return segments;
}

export const SVG_SHAPES = {
  dnaHelix,
  neuron,
  atom,
  plantCell,
  sineWave,
  gear,
  battery,
  magnet,
  magneticFieldLines
};
