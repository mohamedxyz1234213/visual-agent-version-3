const base = 'http://localhost:8000/api/v1';

const topics = [
  {
    name: 'Strategic Leadership',
    text: 'Teach strategic leadership to a general audience. Explain what it is, how leaders set direction, align people, allocate resources, and adapt when conditions change. Include practical examples and relationships between the ideas.'
  },
  {
    name: 'How a Central Processing Unit Works',
    text: 'Teach how a central processing unit works. Explain instruction cycles, control unit, arithmetic logic unit, registers, cache, and how data moves through the CPU in a clear teaching sequence.'
  },
  {
    name: 'Photosynthesis',
    text: 'Teach photosynthesis clearly for students. Explain chloroplasts, sunlight, water, carbon dioxide, glucose, oxygen, and how each part contributes to the process in order.'
  }
];

async function request(path, init) {
  const res = await fetch(base + path, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text}`);
  return JSON.parse(text);
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForLesson(id) {
  for (let i = 0; i < 240; i += 1) {
    const status = await request(`/upload/status/${id}`);
    if (status.status === 'ready') return status;
    if (status.status === 'error') throw new Error(`Lesson ${id} failed: ${status.error_message || 'unknown error'}`);
    await wait(2000);
  }
  throw new Error(`Timed out waiting for ${id}`);
}

function summarizeScene(scene) {
  return {
    type: scene.action_type,
    position: scene.payload?.position || null,
    x: scene.payload?.x ?? null,
    y: scene.payload?.y ?? null,
    width: scene.payload?.width ?? null,
    height: scene.payload?.height ?? null,
    content: scene.payload?.content || scene.payload?.label || scene.payload?.object_type || null,
  };
}

function inspectLesson(lesson) {
  const issues = [];
  const summary = [];

  lesson.parts.forEach((part, index) => {
    const seq = Array.isArray(part.visual_sequence) ? part.visual_sequence : [];
    const subtitleOverlaps = seq.filter((scene) => (
      scene.action_type === 'draw_text'
      && Array.isArray(scene.payload?.position)
      && scene.payload.position[0] === 400
      && scene.payload.position[1] === 68
    ));
    if (subtitleOverlaps.length) {
      issues.push(`part ${index + 1}: found legacy subtitle scene at y=68`);
    }

    const legacyBadges = seq.filter((scene) => (
      scene.action_type === 'draw_badge'
      && (scene.payload?.content === 'Framework view' || scene.payload?.content === 'Story path')
    ));
    if (legacyBadges.length) {
      issues.push(`part ${index + 1}: found legacy board badge content`);
    }

    const topBadges = seq.filter((scene) => (
      scene.action_type === 'draw_badge'
      && Array.isArray(scene.payload?.position)
      && scene.payload.position[1] <= 14
    )).map((scene) => scene.payload.content);

    const teachingCards = seq.filter((scene) => scene.action_type === 'draw_rect')
      .map((scene) => scene.payload?.label)
      .filter(Boolean)
      .slice(0, 6);

    const callouts = seq.filter((scene) => scene.action_type === 'draw_callout')
      .map((scene) => ({
        y: scene.payload?.position?.[1],
        width: scene.payload?.width,
        content: scene.payload?.content,
      }))
      .slice(0, 3);

    summary.push({
      part: index + 1,
      title: part.title,
      sceneCount: seq.length,
      topBadges,
      sampleRects: teachingCards,
      callouts,
      firstScenes: seq.slice(0, 10).map(summarizeScene),
    });
  });

  return { issues, summary };
}

const output = [];

for (const topic of topics) {
  const created = await request('/explain/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: topic.text,
      explanation_mode: 'full_lesson',
      ai_provider: 'blaze',
      analysis_model: 'qwen3.6-plus-thinking',
      lesson_intent: 'teach'
    }),
  });

  await waitForLesson(created.id);
  const lesson = await request(`/lessons/${created.id}`);
  output.push({
    topic: topic.name,
    lessonId: created.id,
    title: lesson.title,
    ...inspectLesson(lesson),
  });
}

console.log(JSON.stringify(output, null, 2));
