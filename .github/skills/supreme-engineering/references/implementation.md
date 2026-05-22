# Implementation Protocol
## Universal feature implementation workflow — any language, any framework

---

## Pre-Implementation Gate

Do NOT write code until all of these are true:
- [ ] You can state what the feature does in one sentence
- [ ] You know every file that will change
- [ ] You know the public interface (inputs and outputs) for every new component
- [ ] You know the data model (types, schemas, shapes)
- [ ] You have read the code you will be modifying

---

## Implementation Order (Always Follow This)

```
1. TYPES / SCHEMAS / CONTRACTS
   Define the shape of all data first.
   In TypeScript: interfaces, types, enums
   In Python: dataclasses, Pydantic models, TypedDicts
   In Go: structs, interfaces
   In Rust: structs, enums, traits
   In SQL: table schemas, constraints

2. PURE LOGIC / BUSINESS RULES
   Implement the core logic with no framework dependencies.
   This should be testable in isolation.
   No I/O, no HTTP, no DB, no UI — pure computation.

3. DATA ACCESS / STORAGE LAYER
   Implement reads and writes to databases, files, or external services.
   Encapsulate behind interfaces/repositories so the business logic doesn't know the storage mechanism.

4. API / SERVICE LAYER
   Wire business logic to external interfaces (HTTP handlers, RPC, event handlers).
   Input validation lives here — reject at the boundary before touching business logic.

5. STATE MANAGEMENT (if applicable)
   UI state, application state, caches.

6. UI COMPONENTS (if applicable)
   See UI Generation Protocol.

7. INTEGRATION
   Wire all layers together.
   Test the end-to-end path manually or with integration tests.

8. ERROR HARDENING
   Go back through every layer and handle every failure path.
   What happens when the DB is down? Network times out? Input is malformed?

9. EDGE CASE PASS
   Add the inputs that the happy-path implementation doesn't handle:
   empty collections, null values, duplicate entries, concurrent writes.
```

---

## Code Quality Standards

### Naming
- Variables and functions: reveal intent, not mechanism (`getUsersWithExpiredSubscriptions`, not `getUsersFlag2`)
- Booleans: state the condition (`isLoading`, `hasError`, `canEdit`) — never negative names (`notReady`, `notEmpty`)
- Functions: verb-noun (`processPayment`, `validateEmail`, `buildQuery`)
- Classes/types: noun (`UserRepository`, `PaymentProcessor`, `OrderStatus`)

### Function Design
- One responsibility per function
- If a function needs a comment to explain what it does, it needs a better name or needs to be split
- Maximum 3 levels of nesting — extract branches into named functions
- Maximum ~30 lines — if longer, ask if it's doing too much

### Error Handling
- Errors must be handled at the appropriate level — not swallowed, not re-thrown blindly
- User-facing errors: clear, actionable, not technical
- System-facing errors: include context (what failed, with what input, in what context)
- Never `catch (e) {}` — at minimum, log

### Comments
- Comment *why*, never *what*
- If the code is complex enough to need a *what* comment, simplify the code first
- Document: non-obvious algorithm choices, workarounds for external bugs, security decisions, performance trade-offs

---

## Language-Specific Checklists

### TypeScript
- [ ] No `any` without explicit justification
- [ ] Async functions always `await` or return the promise
- [ ] Discriminated unions instead of boolean flags for state
- [ ] Proper error typing (not just `catch (e: any)`)
- [ ] No `!` non-null assertions without guaranteed safety

### Python
- [ ] Type hints on all function signatures
- [ ] No mutable default arguments (`def f(items=[])` → `def f(items=None)`)
- [ ] Context managers for resources (`with open(...)`)
- [ ] Generator expressions for large data
- [ ] `__all__` defined in public modules

### Go
- [ ] All errors returned and handled (not `_`)
- [ ] Goroutines have clearly owned lifecycles
- [ ] No shared mutable state without a mutex or channel
- [ ] Interfaces defined at the point of use, not the point of implementation

### Rust
- [ ] No `unwrap()` or `expect()` in production paths (use `?` or proper handling)
- [ ] No unnecessary clones — understand ownership first
- [ ] Lifetimes explicit when necessary, inferred when possible
- [ ] `enum` for error types in library code

### SQL
- [ ] No dynamic string concatenation for queries (parameterized only)
- [ ] Every query has an index plan
- [ ] Transactions wrap multi-step operations
- [ ] No SELECT * in production code

---

## Change Safety Protocol

Before modifying existing code:
1. Find all usages of the symbol you're changing
2. Understand the contract callers depend on
3. If changing the contract: update all callers before changing the implementation
4. If adding a new overload: keep the old interface working

After modifying:
1. Check for compile/lint errors
2. Trace the changed code path end-to-end
3. Verify adjacent tests still pass
4. Check that the change doesn't affect any implicit behavior callers might depend on
