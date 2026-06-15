import { NextResponse } from "next/server";
import { buildJoaoPrompt } from "@/lib/buildPrompt";

const MODEL = "gpt-5.2";
const TEMP = 0.2;
const MAX_TOKENS = 300;

export async function POST(req) {
  try {
    const { pid, agent, messages } = await req.json();

    // mínimo indispensable
    if (!pid || !agent || !messages) {
      return NextResponse.json({ error: "Missing pid/agent/messages" }, { status: 400 });
    }

    const systemPrompt = buildJoaoPrompt(agent);

    const input = [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        input,
        temperature: TEMP,
        max_output_tokens: MAX_TOKENS,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return NextResponse.json(
        {
          error: data?.error?.message || "OpenAI request failed",
          status: resp.status,
          raw: data,
        },
        { status: resp.status }
      );
    }

    const reply =
      (data.output_text && String(data.output_text).trim()) ||
      (Array.isArray(data.output)
        ? data.output
            .flatMap(o => o.content || [])
            .filter(c => c.type === "output_text" && c.text)
            .map(c => c.text)
            .join("\n")
            .trim()
        : "") ||
      "";

    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}