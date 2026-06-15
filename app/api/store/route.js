import { put } from "@vercel/blob";

export async function POST(req) {
  try {
    const b = await req.json();

    if (!b.pid || !b.agent || !b.stimulus || !Array.isArray(b.messages)) {
      return Response.json({ error: "invalid payload" }, { status: 400 });
    }

    const chat = {
      chat_id: crypto.randomUUID(),
      pid: b.pid,
      agent: b.agent,
      stimulus: b.stimulus,
      messages: b.messages,
      created_at: new Date().toISOString()
    };

    const fileName = `chats/${chat.chat_id}.json`;

    const blob = await put(fileName, JSON.stringify(chat), {
      access: "private",
      contentType: "application/json"
    });

    return Response.json({
      ok: true,
      chat_id: chat.chat_id,
      url: blob.url
    });
  } catch (e) {
    return Response.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}