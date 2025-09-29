# AI Service Setup Guide

## 🚀 Quick Start (No Setup Required)

The app works **out of the box** with our **Local AI Service** - no API keys, no setup, completely free!

### Local AI Features:
- ✅ **Resume parsing and skill extraction**
- ✅ **Personalized question generation** 
- ✅ **Experience level detection**
- ✅ **Resume summarization**
- ✅ **Works offline**
- ✅ **Zero cost**

## 🔧 Optional: Cloud AI Integration

Want even smarter AI? You can optionally integrate with cloud providers:

### 1. **OpenAI (Recommended for quality)**
```bash
# Add to .env.local
VITE_OPENAI_API_KEY=sk-your-api-key-here
```
- **Cost**: ~$0.002 per interview (very cheap)
- **Quality**: Excellent
- **Speed**: Fast

### 2. **Groq (Recommended for speed)**
```bash
# Add to .env.local  
VITE_GROQ_API_KEY=gsk_your-api-key-here
```
- **Cost**: ~$0.0001 per interview (cheapest)
- **Quality**: Very good
- **Speed**: Ultra fast

### 3. **Anthropic Claude**
```bash
# Add to .env.local
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here  
```
- **Cost**: ~$0.001 per interview
- **Quality**: Excellent for reasoning
- **Speed**: Good

### 4. **Ollama (Local LLM)**
```bash
# Install Ollama locally
brew install ollama
ollama serve
ollama pull llama2
```
- **Cost**: Free (uses your hardware)
- **Quality**: Good
- **Speed**: Depends on hardware

## 🎯 How to Switch AI Providers

### Option 1: Environment Variables (Recommended)
```typescript
// The app automatically detects available API keys
// Priority: OpenAI > Groq > Anthropic > Ollama > Local
```

### Option 2: Programmatic Switch
```typescript
import { aiService } from './services/enhancedAIService';

// Switch to different provider
aiService.switchProvider('groq');  // or 'openai', 'anthropic', 'ollama'

// Check if provider is available
const isAvailable = await aiService.isAvailable();
```

## 📊 Cost Comparison

| Provider | Cost/Interview | Setup | Quality | Speed |
|----------|---------------|--------|---------|--------|
| **Local** | **$0** | ✅ None | Good | Fast |
| **Groq** | ~$0.0001 | API Key | Very Good | Ultra Fast |
| **OpenAI** | ~$0.002 | API Key | Excellent | Fast |
| **Anthropic** | ~$0.001 | API Key | Excellent | Good |
| **Ollama** | $0 | Install | Good | Medium |

## 🔄 Automatic Fallback

The service automatically falls back to Local AI if:
- ❌ No API key provided
- ❌ Network issues  
- ❌ Rate limits exceeded
- ❌ Service unavailable

**Your app will always work!** 

## 🛠 Implementation Example

```typescript
// services/aiService.ts - Already implemented!
import { EnhancedAIService } from './enhancedAIService';

// Create service instance (starts with Local AI)
const aiService = new EnhancedAIService();

// Generate questions (automatically uses best available provider)
const result = await aiService.generateQuestions(resumeText, contactInfo);

console.log(`Generated ${result.questions.length} questions`);
console.log(`Using provider: ${aiService.getConfig().provider}`);
```

## 🎭 Testing Different Providers

```bash
# Test with Local AI (default)
npm run dev

# Test with OpenAI
echo "VITE_OPENAI_API_KEY=your-key" > .env.local
npm run dev

# Test with Groq (fastest)  
echo "VITE_GROQ_API_KEY=your-key" > .env.local
npm run dev
```

## ⚡ My Recommendation

1. **Start with Local AI** - Works great, no setup
2. **Add Groq API key** - Ultra fast, extremely cheap
3. **Keep Local as fallback** - Always works

This gives you the best of both worlds: reliability + performance!