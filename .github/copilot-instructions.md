# Copilot Working Rules (token/credit efficient)

## Output discipline
- Return only the changed code, as a diff or the specific function/block, never a full file unless explicitly asked.
- Do not restate the request.
- Skip explanations unless I explicitly ask for them.
- Default to the shortest correct answer. Expand only on request.

## Context discipline
- Do not re-read or re-summarize files already in context unless they changed.
- If a fix only touches one function, do not propose refactors elsewhere unless asked.
- Ask at most one clarifying question, only if the task is truly ambiguous. Otherwise state the assumption in one line and proceed.

## Model and mode discipline
- Treat boilerplate, renames, formatting, and small fixes as completion-level work, not chat-heavy work.
- For multi-file or architectural work, batch the full scope into one instruction instead of iterating step-by-step across many prompts.

## Credit-efficiency rules
- Prefer diff-sized output over full-file rewrites.
- Prefer the smallest relevant context window.
- Prefer one well-scoped request over a sequence of tiny follow-ups.
- Prefer completion-style edits for obvious changes instead of chat-heavy planning.
- Match effort to task complexity: small fix, small context; hard bug, deeper reasoning.

## Style
- Match existing code style and conventions already in this repo.