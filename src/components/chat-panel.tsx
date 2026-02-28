"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hey! I'm your Portland AI events assistant. Ask me about upcoming events, find meetups by topic, or get recommendations for this week.",
};

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate assistant response (no backend yet)
    setIsLoading(true);
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: getPlaceholderResponse(trimmed),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 800);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Event Assistant</h2>
        <p className="text-xs text-muted-foreground">
          Ask about Portland AI events
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-3.5 py-2.5">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about events..."
            rows={1}
            className="flex-1 resize-none rounded-xl border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="h-9 w-9 shrink-0 rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function getPlaceholderResponse(input: string): string {
  const q = input.toLowerCase();
  if (q.includes("today") || q.includes("tonight")) {
    return "Check the calendar in the center — events happening today are shown at the top under the \"Today\" section. You can also use Cmd+K to search!";
  }
  if (q.includes("ai") && (q.includes("meetup") || q.includes("event"))) {
    return "Portland has several AI meetups! AI Portland, AI Tinkerers Portland, and Portland AI Engineers all host regular events. Filter by community using the chips above the event list.";
  }
  if (q.includes("hackathon")) {
    return "Check the calendar for upcoming hackathons — you can filter by the \"Hackathon\" format using the filter chips. PDXHacks typically hosts the biggest ones.";
  }
  if (q.includes("this week") || q.includes("weekend")) {
    return "Scroll through the calendar — events are grouped by Today, Tomorrow, This Week, and Later. The map on the right shows where everything is happening.";
  }
  return "I'm a preview of the event assistant — full AI responses coming soon! For now, browse the calendar in the center or use Cmd+K to search events.";
}
