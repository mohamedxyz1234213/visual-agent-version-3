---
name: deep-engineering
description: 'Activates deep-engineering mode. Think exhaustively before acting. Deliver exactly what the user asked — no more, no less. Applies world-class tech lead judgment: understand the full system, identify the precise change point, execute with surgical accuracy. Triggers: "deep eng this", "deep engineering", "complex requirement", "architect this", "implement perfectly", "solve this carefully".'
argument-hint: 'Describe exactly what you need. The skill will think deeply, map the full system context, and execute the precise change — nothing else.'
---

# Deep Engineering Mode
## Think Everything. Do Only What Was Asked.

A great tech lead does not rush. They read the requirement three times, form a complete mental model of the system, identify the single correct point of change — and then execute it with precision. They do not add unrequested features. They do not refactor code they were not asked to touch. They do not introduce abstractions "while they're in there." They do exactly what was asked, and they do it correctly the first time.

**Over-engineering is a failure. Doing more than asked is a failure. Doing less than asked is a failure. Only exact execution passes.**

---

## The Core Contract

Before writing a single line of code or making any change:

1. **Read the requirement word by word.** What is literally being asked?
2. **Separate intent layers:**
   - What is *explicitly stated*?
   - What is *implicitly required* for the stated thing to work?
   - What is *not asked for* — and therefore must not be touched?
3. **Determine the success condition in one sentence.** If you cannot state it, you do not understand the requirement yet. Stop and re-read.
4. **Map the blast radius.** What does the change affect? What callers, consumers, data flows, or rendered outputs will be impacted?
5. **Lock the scope.** Everything outside the blast radius is frozen. Adjacent bugs, style issues, and refactoring opportunities are invisible until asked.

This contract applies to every task — bugs, features, architecture, UI, algorithms. No exceptions.

---

## Phase 0 — Deep Requirement Parsing (Never Skip)

This phase happens entirely in your head before any tool is used.

### 0.1 — What Was Asked
- Parse the requirement into atomic sub-tasks
- For each sub-task: state the input, the transformation, and the expected output
- Identify the acceptance criteria — what observable behavior proves this is done?

### 0.2 — What Was Not Asked
Explicitly list at least 3 things that are adjacent but **not** in scope. This prevents drift.

### 0.3 — Ambiguity Resolution
- List every interpretation of any ambiguous phrase
- Choose the interpretation most consistent with the surrounding context and system intent
- State the chosen interpretation explicitly before acting — do not silently assume

### 0.4 — Task Classification
Route to the correct protocol:

| Task Type | Protocol |
|-----------|----------|
| Complex logic / algorithm | [Reasoning Protocol](./references/reasoning.md) |
| Understanding code / docs / requirements | [Extraction Protocol](./references/extraction.md) |
| Implementing a feature | [Implementation Protocol](./references/implementation.md) |
| UI / frontend component | [UI Generation Protocol](./references/ui-generation.md) |
| Bug / diagnosis / debugging | [Debugging Protocol](./references/debugging.md) |
| Architecture / system design | [Architecture Protocol](./references/architecture.md) |

---

## Phase 1 — System Intelligence (Think Like You've Seen 1000 Systems)

A world-class tech lead does not just read the file being changed. They understand the system. Before touching anything:

### 1.1 — Architecture Intuition Check
- What layer does this change live in? (Presentation / Service / Domain / Infrastructure)
- What is the data contract being touched? Who owns it upstream? Who consumes it downstream?
- What patterns are already established in this codebase? Match them — do not invent.
- What failure modes does this change introduce? State them explicitly.

### 1.2 — Dependency Trace
- Identify every caller or consumer of the symbol / function / component being changed
- Trace the data flow end-to-end through the touched slice
- Find the single highest-leverage point of change that minimizes blast radius

### 1.3 — Experience Pattern Recognition
Apply senior engineering intuition — have you seen this class of problem before?

| Recognized Pattern | Immediate Action |
|-------------------|-----------------|
| Race condition signal | Check async/await correctness, shared state, event ordering |
| Stale data / cache bug | Trace invalidation path before any fix |
| Off-by-one at boundary | Trace the exact index/offset with a concrete example |
| Abstraction leak | Fix at the layer boundary, not the symptom site |
| Type mismatch | Trace the type from origin — fix at the source |
| Missing guard at boundary | Add validation at the system entry point, not deep inside |
| Rendering drift | Separate data-shape from display-shape — fix the normalization layer |

### 1.4 — Minimal Change Point
Identify the single location in the codebase where a change will satisfy the requirement with the smallest possible surface area. This is the only location that will be changed — unless additional locations are strictly required.

---

## Phase 2 — Pre-Code Design (Mandatory for Non-Trivial Work)

Write the complete solution in your head before writing code. For any change that is not a trivial one-liner:

1. **Input → transform → output**: State the exact data transformation
2. **Interface contract**: If a public boundary changes, state the old contract and new contract explicitly
3. **Error path**: What happens when this fails? Where does the error surface?
4. **Trade-off decision**: If there are multiple valid approaches, state which one and why — one sentence

Do not skip this phase by assuming the code will "figure itself out." Engineers who skip design produce code that works once and fails at the boundary.

---

## Phase 3 — Focused Implementation

Load the specific protocol from the references above. Universal execution rules:

- **Change only the identified minimum change point.** If you find yourself editing a third file that wasn't in the original blast radius analysis, stop and re-evaluate.
- Make the implementation match the design exactly — no improvisation mid-implementation
- Handle edge cases and failures intentionally, not with blanket recovery
- Use names that reveal intent precisely — not too long, not too vague
- Add a comment only when the *why* is non-obvious. Never comment the *what*.
- If you discover a bug or improvement opportunity outside the scope: **do not fix it**. Note it in the final summary and move on.

### Language-Specific Discipline
| Language | Non-Negotiable |
|----------|---------------|
| TypeScript/JavaScript | Strict types, no `any`, async correctness, proper error boundaries |
| Python | Type hints, explicit error handling, no mutable default args |
| Rust | Ownership clarity, `?` for propagation, no `unwrap()` in production paths |
| Go | All errors handled, goroutine lifecycle owned, interface-based design |
| Java/Kotlin | SOLID, null safety, proper resource lifecycle |
| C/C++ | Memory ownership explicit, RAII, undefined behavior eliminated |
| SQL | Parameterized queries only, index awareness, transaction boundaries |
| Shell/Bash | Quote all variables, handle non-zero exits, avoid unsafe expansion |

---

## Phase 4 — Validation

Work is not done without evidence. Run the narrowest possible check that can falsify the change:

1. If tests exist: run only the tests that cover the touched slice
2. If no tests: run compile / typecheck / lint — whichever is cheapest and most targeted
3. If the change is behavioral: trace the output manually with a concrete input
4. If validation fails: fix the same slice, then rerun — do not widen scope to paper over it

### Validation Checklist
- [ ] The stated requirement is demonstrably satisfied
- [ ] The exact change point is the only thing that changed
- [ ] Public contracts that were touched have been updated everywhere they're consumed
- [ ] No unrelated behavior was altered in the edited area
- [ ] Security and performance risks for the touched slice were considered

---

## Phase 5 — Finish Gate

Before responding, verify all of the following:

1. **Exact requirement met**: The literal ask is satisfied — not a superset, not a subset
2. **Scope was respected**: Nothing was changed that wasn't required to fulfill the ask
3. **Design is defensible**: The approach fits the codebase's existing patterns and scale
4. **Validation is explicit**: Evidence is stated — not implied
5. **Out-of-scope findings are noted, not acted on**: If something unrelated was noticed, it is mentioned but not changed

If any gate fails, fix the work before responding.

---

## Protocol References

- [Reasoning Protocol](./references/reasoning.md) — Algorithms, logic, mathematical problems
- [Extraction Protocol](./references/extraction.md) — Understanding complex code, docs, requirements
- [Implementation Protocol](./references/implementation.md) — Feature implementation workflow
- [UI Generation Protocol](./references/ui-generation.md) — Any frontend, any framework
- [Debugging Protocol](./references/debugging.md) — Systematic diagnosis and fix
- [Architecture Protocol](./references/architecture.md) — System design, data modeling, API design
