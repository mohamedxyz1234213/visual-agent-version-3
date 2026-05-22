# Reasoning Protocol
## For algorithms, logic, mathematics, and complex decision-making

---

## Step 1 — Problem Formalization

Before attempting any solution:

1. **State the problem formally**: Inputs, outputs, constraints, and invariants in precise terms
2. **Identify the problem class**: Is this a search problem? Optimization? Graph traversal? Dynamic programming? Parsing? Constraint satisfaction?
3. **Establish ground truth**: What is an obviously correct answer for a trivial case? Use this to validate your approach later

---

## Step 2 — First Principles Decomposition

1. Break the problem into the smallest independent sub-problems
2. Solve each sub-problem in isolation before composing the solution
3. Identify which sub-problems are solved by known algorithms — use established solutions, don't reinvent
4. Identify the *binding constraint*: Is the bottleneck time complexity? Space? Correctness? Edge cases?

---

## Step 3 — Algorithm Design

### Candidate Generation
For each candidate algorithm:
- State the approach in plain English before writing any code
- Derive time complexity: O(?) and explain why
- Derive space complexity: O(?) and explain why
- List the edge cases it must handle
- List what breaks it

### Selection Criteria
| Priority | What to Optimize |
|----------|-----------------|
| 1 | Correctness — wrong fast is still wrong |
| 2 | Clarity — maintainable is better than clever |
| 3 | Performance — only after correctness and clarity |

### Complexity Targets
| Input size | Max acceptable complexity |
|-----------|--------------------------|
| n ≤ 20 | O(2ⁿ) fine |
| n ≤ 1,000 | O(n²) fine |
| n ≤ 100,000 | O(n log n) required |
| n ≤ 10,000,000 | O(n) required |

---

## Step 4 — Logical Verification

### Pre-implementation proof
1. State the loop invariant (for iterative algorithms) or base/recursive case (for recursive)
2. Prove termination: does every recursive branch reduce the problem size?
3. Prove correctness for the trivial case first
4. Extend the proof to the general case

### Mental simulation
Trace through the algorithm with:
- A minimal valid input
- An empty or zero input
- A single-element input
- A two-element input (catches off-by-one better than large inputs)
- A maximum-size or max-value input
- An input with duplicates
- An input that is already solved

---

## Step 5 — Implementation

1. Write the algorithm exactly as designed — no improvisation mid-implementation
2. Use descriptive variable names that map directly to the problem domain
3. Extract helper functions for every reusable or complex sub-step
4. Comment at decision points: *why* this branch exists, *why* this index offset is correct

---

## Step 6 — Post-implementation Verification

1. Run the algorithm against all test cases from Step 4
2. Check for off-by-one errors at every loop boundary
3. Verify the algorithm handles the boundary between "last valid" and "first invalid" inputs
4. Check that the algorithm terminates in all paths (no infinite loops)
5. Profile against the complexity target if performance matters

---

## Common Logic Traps

| Trap | Prevention |
|------|-----------|
| Off-by-one | Use inclusive/exclusive interval notation consistently |
| Integer overflow | Check max values; use appropriate numeric types |
| Floating point comparison | Never use `==` for floats; use epsilon comparison |
| Mutable default arguments | Recognize language-specific pitfalls (Python `[]` default) |
| Aliasing bugs | Defensive copy when passing mutable structures |
| Wrong base case | Verify the trivial case first |
| Missing edge case | Always check: empty, single, duplicate, max, min |
