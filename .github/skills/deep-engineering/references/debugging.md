# Debugging Protocol
## Systematic diagnosis and resolution for any bug in any language

---

## Core Principle

**Never guess. Form hypotheses and eliminate them systematically.**

Randomly trying fixes without understanding the root cause is the most expensive debugging approach. It takes longer, introduces new bugs, and doesn't prevent recurrence.

---

## Phase 1 — Precise Problem Statement

1. State exactly what is happening (observed behavior)
2. State exactly what should happen (expected behavior)
3. State the difference as precisely as possible
4. Identify: Is this always reproducible? Under what conditions?

A bug you can't reliably reproduce is much harder to fix — first make it reproducible.

---

## Phase 2 — Reproduction

1. Find the minimal reproduction: the smallest possible input / steps that trigger the bug
2. Remove every variable that isn't necessary to trigger the bug
3. Document the exact reproduction steps (this becomes your verification test later)
4. Check: does the bug appear in a fresh environment, or only in your specific setup?

---

## Phase 3 — Root Cause Isolation

### Binary Search the Code Path
1. Identify the full code path from trigger to symptom
2. Find the midpoint
3. Verify: is the data correct at the midpoint?
   - Yes → bug is in the second half
   - No → bug is in the first half
4. Repeat until the bug is localized to a 5–10 line range

### Interrogate the Data
At the point of failure, examine:
- What is the actual value of every relevant variable?
- How did it get this value? Trace backwards.
- What was it *supposed* to be? What assumption was violated?

### Common Root Cause Categories

| Category | Signals |
|----------|---------|
| Off-by-one | Boundary conditions fail, loops iterate wrong number of times |
| Null/undefined dereference | Crash on property access, unexpected empty state |
| Async timing | Works sometimes, fails other times; race condition |
| State mutation | Bug appears after prior action; order-dependent failures |
| Type coercion | Unexpected `NaN`, `"[object Object]"`, `true`/`false` as string |
| Stale closure | JavaScript: function captures old value of variable |
| Memory aliasing | Modifying a value changes something unrelated |
| Missing error propagation | Error is swallowed silently upstream |
| Wrong function called | Similar-named functions; import resolves to wrong module |
| Environment difference | Works locally, fails in prod; env vars, config, OS |

---

## Phase 4 — Fix Design

1. State the root cause precisely — if you can't state it clearly, you don't understand it yet
2. Design the fix that addresses the root cause, not the symptom
3. Consider: does this fix affect any other code paths? (Use symbol search to verify)
4. Consider: does fixing this surface any adjacent bugs that the original bug was hiding?
5. Choose the most targeted fix — the smallest change that is genuinely correct

---

## Phase 5 — Fix Verification

1. Apply the fix
2. Verify the reproduction case from Phase 2 no longer triggers the bug
3. Verify the fix doesn't break adjacent behavior
4. Check for compile/lint errors
5. Trace the fixed code path mentally to confirm it's correct in all cases

---

## Phase 6 — Regression Prevention

1. Can this bug be prevented by a type constraint? Add it.
2. Can it be caught by a validation check at the boundary? Add it.
3. Add a comment explaining what happened if the fix is non-obvious
4. If the bug could recur, add a test case

---

## Language-Specific Debugging Heuristics

### JavaScript / TypeScript
- `console.log(typeof x, x)` — type coercion bugs hide in plain sight
- `JSON.stringify(obj, null, 2)` — deeply nested object inspection
- Check: is an async function being called without `await`?
- Check: is a closure capturing a loop variable?
- Check: is optional chaining (`?.`) hiding a real null that should be an error?

### Python
- `type(x)` and `repr(x)` over `str(x)` for debugging
- `import pdb; pdb.set_trace()` or `breakpoint()` for interactive debugging
- Check: mutable default argument?
- Check: is the exception being re-raised correctly (`raise` not `raise e`)?

### Go
- `fmt.Printf("%+v\n", struct)` for struct inspection
- Check: is an error being silently discarded with `_`?
- Check: goroutine leaked — does the goroutine have a termination condition?

### Rust
- `dbg!()` macro for quick value inspection with context
- Check: is a `?` propagating through the wrong error type?
- Check: is there a borrow still alive that prevents mutation?

### SQL
- Run `EXPLAIN ANALYZE` to understand query execution
- Check: is a NULL comparison using `= NULL` instead of `IS NULL`?
- Check: does the transaction boundary include all the operations it should?

---

## Debugging Anti-Patterns

| Anti-Pattern | Why Dangerous |
|-------------|--------------|
| Commenting out code until it works | Hides the bug, doesn't fix it |
| Adding `try/catch` around the failing line | Swallows the error — you now have a silent failure |
| Retrying the same operation | Almost never the right fix; masks a real issue |
| Copy-paste from Stack Overflow without understanding | Fixes the symptom for a different root cause |
| Changing multiple things at once | You won't know which change fixed it |
| Not reproducing the fix | "Looks right" is not verification |
