---
name: spatial-layout
description: 'Use when whiteboard scenes overlap, crowd, or feel unreadable. Enforces semantic-role layout, spacing, grouping, and density limits. Triggers: spatial layout, no overlap, layout engine, board spacing, collision avoidance.'
argument-hint: 'Describe the layout failure or scene density problem.'
---

# Spatial Layout

The AI does not place coordinates.
The layout engine places coordinates.

AI responsibilities:
- identify semantic role
- identify relationship
- identify importance
- identify grouping

Layout responsibilities:
- spacing
- collision avoidance
- alignment
- margin rules
- grouping
- density limits

Constraints:
- one core idea per scene
- two to four supporting visuals
- no overlap
- no unreadable stacks of text
- keep relation lines meaningful and minimal
