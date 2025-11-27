# Ollama Setup Guide

This guide will help you set up Ollama for the AI Assistant feature in Obelisk Learning.

## What is Ollama?

Ollama is a tool that lets you run large language models (LLMs) locally on your computer. This means:
- ✅ **No API costs** - Run models for free
- ✅ **Privacy** - Your code and prompts stay on your machine
- ✅ **No internet required** - Works offline after setup
- ✅ **Fast** - No network latency

## Installation

### Windows

1. Download the installer from [ollama.ai](https://ollama.ai)
2. Run the installer
3. Ollama will start automatically and appear in your system tray

### macOS

1. Download from [ollama.ai](https://ollama.ai)
2. Open the downloaded file and drag Ollama to Applications
3. Launch Ollama from Applications (it will run in your menu bar)

### Linux

```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve
```

## Verify Installation

Open a terminal and run:

```bash
ollama --version
```

You should see the version number.

## Download a Model

Ollama needs a model to run. Popular options:

### For Code/Development (Recommended)
```bash
# Llama 3.2 (3B parameters, fast, good for code)
ollama pull llama3.2

# CodeLlama (specialized for code)
ollama pull codellama

# Phi-3 (small, fast, good for explanations)
ollama pull phi3
```

### For General Use
```bash
# Llama 3 (8B parameters, balanced)
ollama pull llama3

# Mistral (7B parameters, good quality)
ollama pull mistral
```

**Note**: Larger models are more capable but slower. For the learning platform, `llama3.2` or `codellama` are good choices.

## Test Ollama

Test that Ollama is working:

```bash
ollama run llama3.2
```

Type a question and press Enter. You should get a response. Type `/bye` to exit.

## Configure Obelisk Learning

1. **Add to `.env.local`** (optional, these are the defaults):
   ```env
   # Ollama Configuration
   OLLAMA_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.2
   ```

2. **Start your Next.js dev server:**
   ```bash
   npm run dev
   ```

3. **Make sure Ollama is running:**
   - Windows/macOS: Check system tray/menu bar for Ollama icon
   - Linux: Run `ollama serve` in a terminal

## Using the AI Assistant

1. Navigate to a mission: `/missions/[missionId]`
2. Open the **AI Assistant** tab in the right panel
3. Type your question or use the "Explain" button
4. The AI will respond using your local Ollama model

## Troubleshooting

### "Ollama connection failed"

**Problem**: Ollama is not running or not accessible.

**Solutions**:
1. Make sure Ollama is running:
   - Windows/macOS: Check system tray/menu bar
   - Linux: Run `ollama serve` in a terminal
2. Check the URL in `.env.local` matches your Ollama server
3. Test manually: `curl http://localhost:11434/api/tags` should return a list of models

### "Model not found"

**Problem**: The model specified in `OLLAMA_MODEL` is not installed.

**Solutions**:
1. List installed models: `ollama list`
2. Pull the model: `ollama pull llama3.2` (or your chosen model)
3. Update `OLLAMA_MODEL` in `.env.local` to match an installed model

### Slow Responses

**Problem**: The model is too large or your computer is slow.

**Solutions**:
1. Use a smaller model:
   - `phi3` (3.8B) - Very fast
   - `llama3.2` (3B) - Fast
   - `mistral` (7B) - Medium
2. Close other applications to free up RAM
3. Consider using a GPU if available (Ollama will use it automatically)

### Model Not Responding

**Problem**: The model might be stuck or the request timed out.

**Solutions**:
1. Check Ollama logs (if running in terminal)
2. Restart Ollama
3. Try a different model
4. Check available RAM (models need several GB)

## Advanced Configuration

### Remote Ollama Server

If Ollama is running on another machine:

```env
OLLAMA_URL=http://192.168.1.100:11434
```

### Multiple Models

You can switch models by changing `OLLAMA_MODEL`:

```env
# For code explanations
OLLAMA_MODEL=codellama

# For general questions
OLLAMA_MODEL=llama3.2
```

### Streaming Responses (Future)

The current implementation uses non-streaming responses. To enable streaming (faster perceived response time), you would need to update the API route to handle streaming.

## Recommended Models for Learning Platform

| Model | Size | Speed | Best For |
|-------|------|-------|----------|
| `phi3` | 3.8B | ⚡⚡⚡ | Quick explanations |
| `llama3.2` | 3B | ⚡⚡⚡ | Balanced, good for code |
| `codellama` | 7B | ⚡⚡ | Code-specific tasks |
| `llama3` | 8B | ⚡⚡ | General purpose |
| `mistral` | 7B | ⚡⚡ | High quality responses |

**Recommendation**: Start with `llama3.2` - it's fast, capable, and good for both code and explanations.

## Next Steps

1. ✅ Install Ollama
2. ✅ Pull a model (`ollama pull llama3.2`)
3. ✅ Add Ollama config to `.env.local` (optional)
4. ✅ Start Ollama (should auto-start on Windows/macOS)
5. ✅ Test the AI Assistant in a mission

Enjoy your local AI assistant! 🚀

