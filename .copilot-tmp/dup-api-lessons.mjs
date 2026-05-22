const ids = [
  '6a0a11d3f19e63598ac5abf4',
  '6a0a11eaf19e63598ac5ad9d',
  '6a0a1200f19e63598ac5af3a',
  '6a0a1217f19e63598ac5b0df',
  '6a0a122af19e63598ac5b276',
];

function splitSentences(text) {
  return String(text || '')
    .split(/(?<=[.!?])\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

for (const id of ids) {
  const response = await fetch(`http://localhost:8000/api/v1/lessons/${id}`);
  const lesson = await response.json();
  const narration = lesson.parts
    .filter((part) => part.part_type === 'content')
    .map((part) => part.narration || '')
    .join(' ');

  const sentences = splitSentences(narration);
  const seen = new Set();
  let duplicateSentences = 0;

  for (const sentence of sentences) {
    const key = sentence
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!key) continue;
    if (seen.has(key)) {
      duplicateSentences += 1;
    }
    seen.add(key);
  }

  console.log(JSON.stringify({
    id,
    title: lesson.title,
    sentenceCount: sentences.length,
    duplicateSentences,
  }, null, 2));
}
