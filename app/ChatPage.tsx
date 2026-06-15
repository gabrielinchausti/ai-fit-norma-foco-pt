"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import stimulusReminders from "@/prompts/stimulus_reminders.json";

const TURN_LIMIT = 5;
const POST_URL = "https://lse.eu.qualtrics.com/jfe/form/SV_5yZCFOZ9h8l3fL0";

export default function ChatPage() {
  const params = useSearchParams();

  const pid = params.get("pid") ?? "";
  const agent = params.get("agent") ?? "";
  const stimulus = params.get("stimulus") ?? "";

  const reminder =
    stimulusReminders[stimulus as keyof typeof stimulusReminders];

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content:
            "Hi, how are you? I'm John. I'm trying to better understand the arguments people use when deciding whether to buy DELIGHT, a yogurt product."
        }
      ]);
    }
  }, [messages.length]);

  const userTurns = messages.filter(m => m.role === "user").length;

  async function send() {
    if (!text.trim()) return;
    if (userTurns >= TURN_LIMIT) return;
    if (loading) return;

    const next = [...messages, { role: "user", content: text.trim() }];
    setMessages(next);
    setText("");
    setLoading(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid, agent, stimulus, messages: next })
      });

      const data = await resp.json();

      if (!resp.ok) {
        const updatedErr = [
          ...next,
          { role: "assistant", content: "Error generating response. Please try again." }
        ];
        setMessages(updatedErr);
        setLoading(false);
        return;
      }

      const reply = (data?.reply ?? "").toString();
      const updated = [...next, { role: "assistant", content: reply }];
      setMessages(updated);
      setLoading(false);

      if (updated.filter(m => m.role === "user").length >= TURN_LIMIT) {
        await finish(updated);
      }
    } catch {
      const updatedErr = [
        ...next,
        { role: "assistant", content: "Network error. Please try again." }
      ];
      setMessages(updatedErr);
      setLoading(false);
    }
  }

  async function finish(finalMessages: any[]) {
    if (loading) return;
    setLoading(true);

    let chatId = "";
    try {
      const r = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pid,
          agent,
          stimulus,
          messages: finalMessages
        })
      });
      const j = await r.json();
      chatId = j?.chat_id || "";
    } catch {
      chatId = "";
    }

    const sep = POST_URL.includes("?") ? "&" : "?";
    const target =
      POST_URL +
      sep +
      "pid=" +
      encodeURIComponent(pid) +
      "&agent=" +
      encodeURIComponent(agent) +
      "&stimulus=" +
      encodeURIComponent(stimulus) +
      (chatId ? "&chat_id=" + encodeURIComponent(chatId) : "");

    window.location.href = target;
  }

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>Conversation</h2>

      {(!pid || !agent || !stimulus) && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 8,
            border: "1px solid #f0c36d",
            background: "#fff7e6",
            fontSize: 14
          }}
        >
          Warning: missing URL parameters. pid="{pid || "(empty)"}", agent="{agent || "(empty)"}", stimulus="{stimulus || "(empty)"}"
        </div>
      )}

      {reminder && (
        <div
          style={{
            marginBottom: 16,
            padding: 14,
            borderRadius: 10,
            border: "1px solid #d7defa",
            background: "#eef2ff",
            fontSize: 14,
            lineHeight: 1.45
          }}
        >
          <p style={{ margin: "0 0 8px 0" }}>
            <b>{reminder.task_title}</b> {reminder.task}
          </p>

          <p style={{ margin: "0 0 8px 0" }}>
            <b>{reminder.reminder_title}</b> {reminder.reminder}
          </p>

          <ul style={{ margin: "0 0 8px 20px", padding: 0 }}>
            {reminder.bullets.map((b: string, i: number) => (
              <li key={i}>{b}</li>
            ))}
          </ul>

          <p style={{ margin: "0 0 8px 0" }}>{reminder.reasoning}</p>
          <p style={{ margin: 0 }}>{reminder.length_rule}</p>
        </div>
      )}

      <div
        style={{
          border: "1px solid #ddd",
          padding: 20,
          borderRadius: 10,
          minHeight: 300,
          background: "#fafafa"
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              marginBottom: 12,
              background: m.role === "user" ? "#e8f0ff" : "#f3f3f3",
              padding: "10px 12px",
              borderRadius: 8
            }}
          >
            <b>{m.role === "user" ? "You" : "John"}:</b> {m.content}
          </div>
        ))}
      </div>

      {userTurns < TURN_LIMIT ? (
        <div style={{ marginTop: 20 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            placeholder="Write your response here..."
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 14,
              resize: "none"
            }}
          />

          <button
            onClick={send}
            disabled={loading}
            style={{
              marginTop: 12,
              padding: "10px 22px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#2563eb",
              color: "white",
              fontWeight: 600,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      ) : (
        <p style={{ marginTop: 20 }}>Conversation completed. Redirecting</p>
      )}
    </main>
  );
}