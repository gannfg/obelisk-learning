import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// AI Assistant endpoint using Ollama
// Ollama runs locally and provides a REST API for local LLM inference

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } = {} } = await supabase.auth.getUser();

    // Allow unauthenticated for now, but log if user exists
    const userId = user?.id;

    const body = await request.json();
    const { prompt, lessonId, missionId, promptTemplateId } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    // Check quota (if user is authenticated)
    if (userId) {
      const { data: quota } = await supabase
        .from("user_quotas")
        .select("*")
        .eq("user_id", userId)
        .eq("quota_type", "ai_calls")
        .single();

      if (quota && quota.daily_used >= quota.daily_limit) {
        return NextResponse.json(
          { error: "Daily AI call limit reached" },
          { status: 429 }
        );
      }
    }

    // Ollama configuration
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "llama3";

    // Call Ollama API
    let aiResponse = "";
    let tokenUsage = { input: 0, output: 0 };

    try {
      const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: prompt,
          stream: false, // Set to true if you want streaming responses
        }),
      });

      if (!ollamaResponse.ok) {
        const errorText = await ollamaResponse.text();
        throw new Error(`Ollama API error: ${ollamaResponse.status} ${errorText}`);
      }

      const ollamaData = await ollamaResponse.json();
      aiResponse = ollamaData.response || "No response from Ollama";
      
      // Estimate token usage (rough approximation: 1 token ≈ 4 characters)
      tokenUsage = {
        input: Math.ceil(prompt.length / 4),
        output: Math.ceil(aiResponse.length / 4),
      };
    } catch (error) {
      console.error("Ollama API error:", error);
      
      // Fallback message if Ollama is not available
      aiResponse = `I apologize, but I'm unable to process your request right now. 

Error: ${error instanceof Error ? error.message : String(error)}

**Troubleshooting:**
1. Make sure Ollama is running: \`ollama serve\`
2. Check that the model is installed: \`ollama pull ${ollamaModel}\`
3. Verify OLLAMA_URL in .env.local (default: http://localhost:11434)
4. Check OLLAMA_MODEL in .env.local (default: llama3)`;
      
      // Return error response but don't fail completely
      return NextResponse.json({
        answer: aiResponse,
        response: aiResponse,
        error: "Ollama connection failed",
        success: false,
      });
    }

    // Log interaction (if user is authenticated)
    if (userId && missionId) {
      try {
        await supabase.from("ai_interactions").insert({
          user_id: userId,
          mission_id: missionId,
          prompt_template_id: promptTemplateId || null,
          user_prompt: prompt,
          ai_response: aiResponse,
          token_usage: tokenUsage,
          model_used: ollamaModel,
        });

        // Update quota
        if (userId) {
          try {
            const { error: rpcError } = await supabase.rpc("increment_quota", {
              user_id_param: userId,
              quota_type_param: "ai_calls",
              amount: 1,
            });

            // Fallback if RPC doesn't exist or fails
            if (rpcError) {
              const { data: quota } = await supabase
                .from("user_quotas")
                .select("*")
                .eq("user_id", userId)
                .eq("quota_type", "ai_calls")
                .single();

              if (quota) {
                await supabase
                  .from("user_quotas")
                  .update({ daily_used: (quota.daily_used || 0) + 1 })
                  .eq("id", quota.id);
              }
            }
          } catch (quotaError) {
            console.error("Failed to update quota:", quotaError);
            // Silently fail - quota update is not critical
          }
        }
      } catch (err) {
        console.error("Failed to log AI interaction:", err);
      }
    }

    return NextResponse.json({
      answer: aiResponse,
      response: aiResponse, // Alias
      success: true,
      model: ollamaModel,
    });
  } catch (error) {
    console.error("AI ask error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

