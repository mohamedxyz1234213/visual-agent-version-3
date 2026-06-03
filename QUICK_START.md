# Quick Start Guide - Visual Agent 3 Whiteboard System

## What Changed?

The whiteboard system now uses a **template-based architecture** where:
- ✅ AI generates semantic `board_scenes` (not coordinates)
- ✅ Templates provide collision-free layouts
- ✅ 60+ diverse templates ensure variety
- ✅ Camera animations add dynamic flow
- ✅ No more overlapping objects

## Running the System

### 1. Start Backend
```bash
cd backend
npm install
npm start
```

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Access Application
Open http://localhost:3000

## How It Works

### For Users:
1. Upload a PDF or enter a topic
2. Select AI model and options
3. Click "Generate Lesson"
4. Watch the animated whiteboard explanation

### For the AI (Internal):
The AI now generates structured `board_scenes` instead of raw coordinates:

```javascript
{
  "parts": [
    {
      "title": "Introduction to Photosynthesis",
      "narration": "Let's explore how plants make their own food...",
      "board_scenes": [
        {
          "intent": "define",
          "goal": "introduce the concept",
          "headline": "Photosynthesis",
          "definition": "Process converting light to energy",
          "points": ["Occurs in chloroplasts", "Needs sunlight", "Produces oxygen"]
        },
        {
          "intent": "process",
          "goal": "show the steps",
          "steps": [
            {"title": "Light absorption", "detail": "Chlorophyll captures photons"},
            {"title": "Water splitting", "detail": "H2O → H+ + O2"},
            {"title": "Carbon fixation", "detail": "CO2 + H+ → glucose"}
          ]
        }
      ]
    }
  ]
}
```

## Available Template Intents

Choose the right intent for each teaching moment:

| Intent | Use For | Example |
|--------|---------|---------|
| `define` | Explaining terms/concepts | "What is recursion?" |
| `compare` | Showing differences | "Arrays vs Linked Lists" |
| `process` | Step-by-step workflows | "How HTTP works" |
| `hierarchy` | Parent-child structures | "DOM tree structure" |
| `timeline` | Chronological events | "History of JavaScript" |
| `cause` | Cause-effect chains | "Climate change effects" |
| `data` | Statistics/measurements | "Performance benchmarks" |
| `cluster` | Related concepts | "OOP principles" |
| `cycle` | Circular processes | "Water cycle" |
| `example` | Worked examples | "Solving 2x + 3 = 7" |
| `recap` | Summarizing points | "Key takeaways" |
| `formula` | Equations | "E = mc²" |
| `map` | Labeled diagrams | "Heart anatomy" |

## Template System

### How Templates Work:

1. **AI chooses intent** based on what it's teaching
2. **Scene composer selects template** from the intent pool
3. **Template fills slots** with AI-provided data
4. **Geometry is pre-validated** - no overlapping possible
5. **Camera animations** add emphasis

### Template Rotation:

The system automatically rotates through templates to ensure variety:
- Tracks which templates were used
- Avoids repeating the same template twice in a row
- Clears history after 12 templates to allow reuse
- Result: Every lesson feels unique

## Camera Animations

Templates can trigger camera movements:

```javascript
// Zoom in when entering a new board
{ type: 'camera', mode: 'enter', zoom: 1.0 }

// Focus on a key concept
{ type: 'camera', mode: 'focus', zoom: 1.18, hint: 'main formula' }

// Reset before clearing
{ type: 'camera', mode: 'reset', zoom: 1.0 }
```

## Troubleshooting

### "AI service temporarily unavailable"
- This means upstream models (Grok/Qwen) are having issues
- Wait 30-60 seconds and try again
- The system will automatically try fallback models

### Whiteboard looks empty
- Check browser console for errors
- Verify `board_scenes` are being generated (check network tab)
- Ensure templates are loading (check `templateLibrary.js`)

### Overlapping objects
- This should NOT happen with the new system
- If it does, report which template ID is causing it
- Templates have pre-validated geometry

### Animations not smooth
- Check if `camera` state is updating in Whiteboard component
- Verify CSS transitions are applied
- Clear browser cache

## Adding New Templates

Want to add your own template? Here's how:

```javascript
// In backend/src/services/whiteboard/templateLibrary.js

define({
  id: 'my_awesome_template',
  intent: 'process',  // or define, compare, etc.
  label: 'My Awesome Template',
  capacity: { steps: 4 },  // what data it expects
  
  fill(d, ctx) {
    const p = PALETTES[0];  // color scheme
    const s = [...header(ctx, p.accent)];  // title/subtitle
    
    // Add your elements (all positions are pre-calculated)
    const steps = (d.steps || []).slice(0, 4);
    steps.forEach((step, i) => {
      const y = 120 + i * 80;
      s.push(rect(100, y, 600, 70, { 
        stroke: p.accent, 
        fill: p.soft 
      }));
      s.push(txt(
        anchor(step.title, 6), 
        120, y + 40, 
        { fontSize: 14, fontWeight: '700' }
      ));
    });
    
    return s;
  }
});
```

**Key Rules:**
- Use the helper functions: `rect()`, `txt()`, `circle()`, `arrow()`, `line()`
- Keep text short with `anchor(text, maxWords)`
- Use palette colors for consistency
- Canvas is 800×500, header is y < 92, content is y 104-470
- Test with various data inputs

## Performance Tips

1. **Template count**: 60 templates is optimal (variety without bloat)
2. **Scene count**: 3-6 board_scenes per content part
3. **Animation timing**: 0.6-3.2s per element reveal
4. **Clear frequency**: Use `clear` between major concept shifts
5. **Narration length**: 150-300 words per content part

## Environment Variables

```bash
# Backend (.env)
BLAZE_API_KEY=your_api_key_here
BLAZE_BASE_URL=https://blazeai.boxu.dev/api
BLAZE_MODEL=qwen3.6-plus
BLAZE_DEEP_MODEL=qwen3.6-plus-thinking

# Optional
AI_TIMEOUT_MS=600000
AI_COOLDOWN_MS=120000
```

## Testing Your Changes

```bash
# Test a specific topic
curl -X POST http://localhost:3001/api/upload/topic \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Binary Search Algorithm",
    "lesson_intent": "teach",
    "explanation_mode": "full_lesson"
  }'

# Check template rendering
# Open browser dev tools → Network → look for lesson response
# Verify board_scenes are present in parts[]
```

## Common Issues & Fixes

### Issue: Templates look the same
**Fix:** Check template rotation in `sceneComposer.js` - the `used` Set should be clearing after 12 templates

### Issue: Text is cut off
**Fix:** Use `anchor(text, maxWords)` to truncate long text

### Issue: Camera not zooming
**Fix:** Verify `camera` scenes are in the visual_sequence and Whiteboard component has camera state

### Issue: AI generates coordinates
**Fix:** Update the AI prompt to emphasize board_scenes over visual_logic

## Next Steps

1. ✅ System is functional with 60 templates
2. ⏳ Test with various topics (math, science, history, code)
3. ⏳ Add more templates if needed (target: 100+)
4. ⏳ Refactor aiPlanner.js into smaller modules
5. ⏳ Add template preview tool
6. ⏳ Improve frontend UI

## Support

- Check `WHITEBOARD_IMPROVEMENTS.md` for detailed architecture
- Review `templateLibrary.js` for template examples
- Inspect `sceneComposer.js` for timing logic
- Debug with browser dev tools (React DevTools + Network tab)

---

**Status:** ✅ Core system complete and ready for testing
**Version:** 2.0 (Template-based architecture)
**Last Updated:** 2026-05-31
