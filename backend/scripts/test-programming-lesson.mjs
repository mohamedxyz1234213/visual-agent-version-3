// Quality gate for a real generated programming lesson.
import { readFileSync } from 'node:fs';

const path = process.env.LESSON || '/tmp/lesson_full.json';
const expected = String(process.env.EXPECT || '').toLowerCase();
const lesson = JSON.parse(readFileSync(path, 'utf8'));
const content = (lesson.parts || []).filter((part) => part.part_type === 'content');
const quizzes = (lesson.parts || []).filter((part) => part.part_type !== 'content');
const failures = [];
const check = (condition, message) => {
  console.log(`  ${condition ? '✓' : '✗'} ${message}`);
  if (!condition) failures.push(message);
};
const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

console.log(`Programming lesson: ${lesson.title}`);
check(lesson.status === 'ready', 'lesson status is ready');
check(content.length >= 3, `has at least three content parts (${content.length})`);
check(new Set(content.map((part) => normalize(part.title))).size === content.length, 'content part titles are distinct');

const allScenes = content.flatMap((part) => part.scenes || []);
const drawable = allScenes.filter((scene) => !['camera', 'clear', 'draw_caption'].includes(scene.action_type));
const captions = allScenes.filter((scene) => scene.action_type === 'draw_caption');
const actions = new Set(allScenes.map((scene) => scene.action_type));
check(drawable.length >= 100, `contains at least 100 drawable scenes (${drawable.length})`);
check(content.every((part) => (part.scenes || []).some((scene) => scene.action_type === 'draw_caption')), 'every content part has canonical captions');
check(content.every((part) => (part.scenes || []).some((scene) => /^draw_(code_block|linked_list|sorting|tree_struct|flowchart|uml|big_o|network|datastream|network_packet|db_schema|state_machine|api|architecture_diagram)$/.test(scene.action_type))), 'every content part has a semantic programming visual');

const metaPattern = /\b(in the lesson flow|visual anchors? include|draw a labeled|animate traversal|begin with the concept|follow with deletion cases|conclude with complexity analysis|in (?:the )?tail panel)\b/i;
const visibleText = allScenes.flatMap((scene) => [scene.payload?.content, scene.payload?.narrationText, scene.payload?.label]).filter(Boolean);
const metaHits = visibleText.filter((text) => metaPattern.test(String(text)));
check(metaHits.length === 0, `contains no planner/meta-language in student-visible text (${metaHits.length} hits)`);

const codeScenes = allScenes.filter((scene) => scene.action_type === 'draw_code_block');
const executableCode = codeScenes.filter((scene) => {
  const payload = scene.payload || {};
  return String(payload.code || payload.source || '').includes('\n')
    && String(payload.filename || '').length > 0
    && String(payload.command || '').length > 0
    && String(payload.output || '').length > 0
    && ['passed', 'failed', 'running', 'success', 'error'].includes(String(payload.execution_status || '').toLowerCase());
});
check(codeScenes.length >= content.length, `has at least one IDE code scene per content part (${codeScenes.length})`);
check(executableCode.length >= content.length, `has at least one executable code scene per content part (${executableCode.length})`);
check(executableCode.some((scene) => Array.isArray(scene.payload?.test_results) && scene.payload.test_results.length > 0), 'at least one execution scene includes test results');

if (expected.includes('linked')) check(actions.has('draw_linked_list'), 'linked-list lesson uses the dedicated node/pointer renderer');
if (expected.includes('sort')) check(actions.has('draw_sorting'), 'sorting lesson uses the dedicated sorting renderer');
if (expected.includes('sql')) check(actions.has('draw_db_schema'), 'SQL lesson uses the dedicated schema renderer');
if (expected.includes('api') || expected.includes('rest')) check(actions.has('draw_api') || actions.has('draw_network') || actions.has('draw_architecture_diagram'), 'API lesson uses a dedicated request/architecture renderer');

const quizQuestions = quizzes.flatMap((part) => part.quiz?.questions || []);
check(quizQuestions.length >= 2, `includes at least two quiz questions (${quizQuestions.length})`);
check(quizQuestions.every((question) => String(question.question_text || '').length >= 20), 'quiz questions are substantive');

console.log(`\n${failures.length ? `❌ PROGRAMMING LESSON: FAIL (${failures.length})` : '✅ PROGRAMMING LESSON: PASS'}\n`);
process.exit(failures.length ? 1 : 0);
