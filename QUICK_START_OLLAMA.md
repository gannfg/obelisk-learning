# Quick Start: Ollama AI Assistant

Get the AI Assistant working in 3 steps:

## Step 1: Install Ollama

**Windows/macOS:**
- Download from [ollama.ai](https://ollama.ai)
- Install and launch (runs automatically)

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve
```

## Step 2: Download a Model

```bash
ollama pull llama3.2
```

This downloads a 3B parameter model that's fast and good for code explanations.

## Step 3: Test It

1. Make sure Ollama is running (check system tray/menu bar)
2. Start your Next.js app: `npm run dev`
3. Go to a mission: `/missions/[missionId]`
4. Click the **AI Assistant** tab
5. Type a question or click "Explain"

That's it! The AI Assistant is now using your local Ollama model.

## Optional Configuration

Add to `.env.local` if you want to customize:

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

## Troubleshooting

**"Ollama connection failed"**
- Make sure Ollama is running
- Test: `curl http://localhost:11434/api/tags`

**"Model not found"**
- List models: `ollama list`
- Pull the model: `ollama pull llama3.2`

See `OLLAMA_SETUP.md` for detailed troubleshooting.

