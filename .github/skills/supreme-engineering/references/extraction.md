# Extraction & Understanding Protocol
## For understanding complex code, documents, requirements, and ambiguous inputs

---

## When to Use
- Reading an unfamiliar or complex codebase
- Analyzing ambiguous or contradictory requirements
- Understanding a large document, spec, or design
- Extracting the true intent from vague instructions
- Reverse-engineering what existing code does

---

## Step 1 — Surface Mapping

Get the lay of the land before diving into details:

1. **Identify the boundaries**: What is in scope? What is out of scope?
2. **Find the entry points**: Where does execution start? Where does data enter?
3. **Find the exit points**: Where does data leave? What are the outputs or side effects?
4. **Identify major components**: Group the code/document into logical sections

For code: read module/file names, class names, function names — these reveal intent before you read a single line of implementation.

---

## Step 2 — Intent Extraction

For each component identified:

1. **State what it does** in one sentence — if you can't, read more
2. **State why it exists** — what problem does it solve? What would break without it?
3. **State what it assumes** — what preconditions must be true for it to work correctly?

### Requirement Disambiguation
When requirements are ambiguous:
1. List every possible interpretation
2. For each interpretation, state the implication for implementation
3. Identify which interpretation is most consistent with the surrounding context
4. Flag remaining ambiguity explicitly — do not silently pick one

---

## Step 3 — Data Flow Tracing

1. Pick a single piece of data (a user ID, a request, a file)
2. Trace it from origin to final destination through every transformation
3. Document every mutation, validation, and format change
4. Identify where data could be lost, corrupted, or misinterpreted

---

## Step 4 — Dependency Mapping

1. For each component, list what it depends on (imports, function calls, global state)
2. Identify hidden dependencies: environment variables, singletons, shared mutable state
3. Find circular dependencies — these indicate design problems
4. Identify the most central / most-depended-upon components (these are highest-risk to change)

---

## Step 5 — Behavior Characterization

1. What does the component do in the normal case?
2. What does it do when inputs are invalid?
3. What does it do when dependencies fail?
4. What does it do under concurrent access?
5. Are there any known bugs or workarounds embedded in the logic?

---

## Step 6 — Synthesis

After extraction, produce a clear mental model:

1. **Summary**: One paragraph that any engineer could use to understand the component without reading it
2. **Invariants**: The properties that must always be true
3. **Risks**: The parts most likely to break or most dangerous to change
4. **Gaps**: What is undocumented, unclear, or missing

---

## Extraction Heuristics

| Signal | Meaning |
|--------|---------|
| Long function with many branches | Accumulated complexity — extract sub-functions to understand each branch |
| Comments that explain *what* the code does | The code is not self-explanatory — read more carefully |
| Comments that explain *why* | Valuable — preserve and trust these |
| Try/catch that swallows exceptions | Hidden failure modes — trace what can throw |
| Magic numbers (42, 1000, 86400) | Domain knowledge encoded without naming — understand the domain |
| `TODO` / `FIXME` / `HACK` | Known technical debt — note these as risks |
| Deeply nested conditionals | Complex state — draw the state machine |
| Duplicate code | Shared logic not yet abstracted — identify the pattern |
