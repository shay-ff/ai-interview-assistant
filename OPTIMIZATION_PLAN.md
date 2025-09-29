# Interview Flow Optimization Plan

## Current Issues Identified

### 1. Timer Logic Problem
- Timer starts immediately after introduction 
- Should only start when actual technical questions begin
- Introduction phase shouldn't be timed

### 2. API Optimization for Groq
- Currently: Generate questions → Ask → Process each answer individually
- Optimized: Generate questions → Collect all answers → Batch process at end

## Proposed Solution

### Phase 1: Question Generation (Groq Call #1)
```
Interview Start → Generate ALL questions upfront → Store in Redux
```

### Phase 2: Answer Collection (No API calls)
```
Ask Question 1 → Collect Answer → Store locally
Ask Question 2 → Collect Answer → Store locally  
...
Ask Question N → Collect Answer → Store locally
```

### Phase 3: Batch Processing (Groq Call #2)
```
All answers collected → Single API call to evaluate ALL answers → Generate final report
```

## Implementation Strategy

### 1. Update Interview Flow
- Introduction phase: No timer, no API calls
- Technical questions: Timer only for these questions
- Answer collection: Store locally, no individual processing
- Final evaluation: Single batch API call

### 2. Timer Improvements
- `isIntroduction: boolean` flag to distinguish phases
- Timer only activates when `isIntroduction = false`
- Different question types: "introduction" vs "technical"

### 3. API Batching
- Collect all Q&A pairs in Redux
- Single `evaluateInterviewBatch()` call at end
- Return comprehensive analysis in one response

## Benefits
- ✅ Reduced API calls (N+1 → 2 calls total)
- ✅ Better Groq rate limiting compliance  
- ✅ Faster user experience
- ✅ More accurate evaluations (context of all answers)
- ✅ Proper timer behavior

## Files to Update
1. `ChatInterface.tsx` - Main interview flow logic
2. `interviewSlice.ts` - Question types and batching
3. `enhancedAIService.ts` - Batch evaluation method
4. `Timer.tsx` - Introduction vs technical phase detection