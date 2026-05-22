# Complexity Scoring Algorithm

## Overview

The visual-agentTeacher system uses an intelligent complexity scoring algorithm to automatically analyze educational content and adjust the teaching approach accordingly. This ensures simple topics get concise explanations while complex topics receive comprehensive, detailed instruction.

## How It Works

### Scoring Scale: 1-10

- **1-3**: Simple, straightforward content
- **4-6**: Medium complexity, requires moderate explanation
- **7-10**: Complex, technical content needing extensive coverage

### Five-Factor Analysis

The algorithm analyzes text content using five weighted factors:

#### 1. Technical Term Density (30% weight)
**What it detects**: Capitalized multi-word phrases (e.g., "Machine Learning", "Quantum Computing")

```javascript
// Counts: "Neural Networks", "Deep Learning", "Artificial Intelligence"
const technicalTerms = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g)
```

**Impact**: +0 to +2.5 points based on density per 100 words

#### 2. Sentence Complexity (20% weight)
**What it measures**: Average sentence length in words

```javascript
const avgSentenceLength = totalWords / sentenceCount
```

**Impact**:
- > 25 words/sentence: +1.5 points
- > 20 words/sentence: +1.0 points
- > 15 words/sentence: +0.5 points
- ≤ 15 words/sentence: +0 points

#### 3. Concept Density (25% weight)
**What it measures**: Number of unique key concepts per 100 words

```javascript
const concepts = extractKeyConcepts(text, [], 10)
const conceptDensity = concepts.length / (wordCount / 100)
```

**Impact**: +0 to +2.0 points based on density

#### 4. Equations & Formulas (15% weight)
**What it detects**: Mathematical content and algorithms

```javascript
// Detects: equation, formula, calculate, compute, algorithm
// Also detects: mathematical symbols like =, +, -, *, /, ^, ()
const hasEquations = /\b(?:equation|formula|calculate)\b/i.test(text) ||
                     /[=+\-*/^(){}[\]].*[=+\-*/^(){}[\]]/.test(text)
```

**Impact**: +1.5 points if detected

#### 5. Diagrams & Visualizations (10% weight)
**What it detects**: References to visual content

```javascript
// Detects: diagram, graph, chart, figure, visualization, plot
const hasDiagrams = /\b(?:diagram|graph|chart|figure)\b/i.test(text)
```

**Impact**: +1.0 point if detected

## Scoring Examples

### Example 1: Simple Story (Score: 2.5)
```
Text: "Once upon a time, there was a cat. The cat liked to play.
       It ran in the garden. The sun was shining."

Technical terms: 0 → +0 points
Avg sentence length: 7 words → +0 points
Concept density: Low → +0.5 points
Equations: None → +0 points
Diagrams: None → +0 points

Base score: 3.0
Final score: 2.5 (clamped to minimum)
```

### Example 2: Technical Tutorial (Score: 6.2)
```
Text: "Machine Learning algorithms use Neural Networks to process data.
       The algorithm computes gradients through backpropagation, which
       involves calculating partial derivatives at each layer. A diagram
       shows how data flows through the network architecture."

Technical terms: 3 (ML, Neural Networks, algorithm) → +1.2 points
Avg sentence length: 18 words → +0.5 points
Concept density: Medium-high → +1.5 points
Equations: "calculate", "compute" → +1.5 points
Diagrams: "diagram" mentioned → +1.0 points

Base score: 3.0
Additions: +5.7
Final score: 6.2
```

### Example 3: Advanced Research (Score: 9.5)
```
Text: "The Schrödinger Equation describes quantum wave functions using
       partial differential equations. The formula iℏ∂ψ/∂t = Ĥψ represents
       the time-dependent Schrödinger Equation, where Ĥ is the Hamiltonian
       operator. Complex conjugate probability densities are calculated via
       |ψ|² integration. Phase space diagrams illustrate quantum state evolution
       through multidimensional parameter spaces."

Technical terms: 5+ → +2.5 points
Avg sentence length: 28 words → +1.5 points
Concept density: Very high → +2.0 points
Equations: Multiple mathematical expressions → +1.5 points
Diagrams: "diagrams" + "graphs" implied → +1.0 points

Base score: 3.0
Additions: +8.5
Final score: 9.5
```

## Impact on Lesson Generation

### Duration Mapping

Complexity directly affects content duration:

```javascript
function mapComplexityToDuration(score, baseDuration = 120) {
  if (score <= 3) {
    // Simple: 0.7-1.0x multiplier
    // Range: 84-120 seconds
    return baseDuration * (0.7 + (score - 1) * 0.15)
  } else if (score <= 6) {
    // Medium: 1.0-1.5x multiplier
    // Range: 120-180 seconds
    return baseDuration * (1.0 + (score - 3) * 0.167)
  } else {
    // Complex: 1.5-2.5x multiplier
    // Range: 180-300 seconds
    return baseDuration * (1.5 + (score - 6) * 0.25)
  }
}
```

### Visual Scene Count

Complexity determines how many visual elements are drawn:

| Complexity | Scene Count | Visual Detail |
|------------|-------------|---------------|
| 1-3 (Simple) | 15-25 | Basic diagrams, key concepts |
| 4-6 (Medium) | 25-40 | Multiple views, relationships |
| 7-10 (Complex) | 40-80 | Equations, graphs, detailed breakdowns |

### Narration Style

Complexity affects narration approach:

**Simple (1-3)**:
```
"Let's start drawing on our whiteboard. This concept is straightforward..."
```

**Medium (4-6)**:
```
"Now we're drawing a process diagram showing how these elements connect.
The diagrams we're creating show multiple perspectives..."
```

**Complex (7-10)**:
```
"Because this is a complex topic, we're adding extra visual elements—
equations, detailed graphs, and additional connecting arrows. Each element
we draw helps break down the complexity into manageable pieces..."
```

## Monitoring & Debugging

The system logs complexity scores during processing:

```javascript
console.log(`[aiPlanner] Lesson complexity: ${lessonComplexity}/10 for "${lessonTitle}"`)
console.log(`[aiPlanner] Generating ~${targetSceneCount} visual scenes for complexity ${complexity}/10`)
```

Look for these logs to understand how content is being classified.

## Tuning the Algorithm

### Adjusting Factor Weights

To emphasize different aspects, modify the weights in `calculateComplexityScore()`:

```javascript
// Current weights:
// Technical terms: 30% (0.3 multiplier, max +2.5)
// Sentence complexity: 20% (tiered system)
// Concept density: 25% (0.25 multiplier, max +2.0)
// Equations: 15% (fixed +1.5 if detected)
// Diagrams: 10% (fixed +1.0 if detected)
```

### Adjusting Duration Ranges

To change timing, modify `mapComplexityToDuration()`:

```javascript
// Current ranges:
// Simple: 84-120s
// Medium: 120-180s
// Complex: 180-300s

// To extend complex content even further:
const factor = 1.5 + (clampedScore - 6) * 0.35  // Increases max to ~350s
```

### Adjusting Scene Count

To change visual detail, modify `generateStructuredVisuals()`:

```javascript
// Current multipliers:
const complexityMultiplier = complexity >= 7 ? 2.5 : complexity >= 4 ? 1.5 : 1.0

// To add even more detail:
const complexityMultiplier = complexity >= 7 ? 3.0 : complexity >= 4 ? 2.0 : 1.2
```

## Best Practices

1. **Monitor logs**: Check complexity scores during processing
2. **Validate results**: Review generated lessons for appropriateness
3. **Adjust thresholds**: Fine-tune based on your content type
4. **Test edge cases**: Try extremely simple and extremely complex documents
5. **Collect feedback**: Users' experience indicates if complexity mapping is accurate

## Future Enhancements

Potential improvements to the complexity scoring:

- [ ] Machine learning-based scoring using trained models
- [ ] User feedback integration to refine scores
- [ ] Domain-specific complexity models (math vs history vs programming)
- [ ] Readability metrics (Flesch-Kincaid, etc.)
- [ ] Citation and reference analysis
- [ ] Code block detection and analysis
