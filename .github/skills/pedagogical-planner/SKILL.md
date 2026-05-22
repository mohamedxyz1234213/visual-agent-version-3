---
name: pedagogical-planner
description: 'Use when the lesson needs stronger teaching logic before any visuals are generated. Focuses on learning objectives, concept hierarchy, teaching order, cognitive load, and part-by-part scene goals. Triggers: pedagogical planner, teaching graph, learning flow, scene goal, concept hierarchy.'
argument-hint: 'Describe the lesson content or teaching-planning problem.'
---

# Pedagogical Planner

Plan the lesson before visualizing it.

Required outputs:
- learning objective
- teaching order
- concept hierarchy
- scene goal for each part
- example or application point
- mini recap point

Rules:
- One content part teaches one major concept.
- Prefer hook -> concept -> relationship -> example -> mini recap.
- Keep cognitive load low.
- Split large topics into short teachable parts.
- If a detail does not serve the teaching goal, exclude it.

The planner output is a teaching graph, not a layout.
