# Engineering Playbook

Concrete tactics. Load when a task touches one of these areas.

## Debugging a mysterious behavior

1. **Get a reliable reproduction.** Intermittent? Find the trigger. Reduce it to
   the smallest input that still shows the bug.
2. **Read the actual values, don't infer them.** Add logging/instrumentation at
   the boundary between "works" and "broken". Print the data shape, not just a
   message. Binary-search the pipeline: confirm the value is correct at point A,
   wrong at point B, then narrow between them.
3. **Question your assumptions explicitly.** Write down what you *believe* is
   true ("this array is non-empty here") then verify each one. The bug lives in
   a false assumption.
4. **Diff working vs broken.** Two inputs, one works one doesn't — diff their
   data/trace. A direct call vs a pipelined call diverging reveals a transform
   in between (this is how the empty-board bug was caught: a helper pre-filled
   slots so a truthy `[]` defeated every `a || b` fallback).
5. **Fix the mechanism, then prove with the original repro.**

## Refactoring / deleting safely

- **Reachability before deletion.** To remove dead code, prove it's unreachable:
  build the call graph from the live entry points and take the transitive
  closure; anything outside it is dead. Grep each name to 0 references before
  cutting. Keep functions shared with the live path.
- **Snapshot first** (copy or commit) so you can revert a large mechanical edit.
- **One behavior-preserving move at a time**, syntax-check + test after each.
  Extract-module, rename, and delete are separate commits in spirit.
- **Splice large ranges with a script + guards** (assert the first/last line
  matches before writing) rather than hand-editing hundreds of lines.

## Performance work

- Measure first with a representative workload. Find the actual hot path
  (profile or time it) — never optimize on suspicion.
- Fix the biggest contributor first; re-measure; stop when it's good enough for
  the requirement, not infinitely.
- Watch for accidental O(n²) (nested scans, repeated work in loops), unbounded
  caches, sync work on a hot loop, and re-render storms in UI.

## Testing strategy

- A test should fail for exactly one reason and name it. Prefer asserting on
  observable behavior/outputs over internal calls.
- For fuzzy/quality problems, write a **measurement gate** (counts, percentiles,
  invariants) and a **stress sweep** across many inputs — not just one happy case.
- Cover the failure path, not just success: what happens on empty input, on the
  fallback branch, when the upstream service errors.
- Keep tests runnable with one command; make their output a clear PASS/FAIL.

## Large / legacy codebases

- Map before you touch: entry points, the public API other modules import, where
  the data is transformed. Delegate broad search; keep the conclusion.
- Watch for **two systems doing the same job** (a new clean path + an old
  fallback). Confirm which actually runs in production before "fixing" either.
- Match the file's existing style. Don't introduce a new pattern for one change.

## Working method

- Maintain a visible todo list for multi-step work; keep exactly one item in
  progress; mark done only when verified.
- When blocked on a genuine decision the user owns (not a default you can pick),
  ask with concrete options. Otherwise choose the sensible default and note it.
- Commit/push only when asked; branch off the default branch first.
