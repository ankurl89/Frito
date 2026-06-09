"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrandDNA, ChatMessage } from "@/lib/types";
import toast from "react-hot-toast";
import { Send } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [brandDraft, setBrandDraft] = useState<Partial<BrandDNA> | null>(null);
  const [savingBrand, setSavingBrand] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialised = useRef(false);

  // Guard against React Strict Mode double-invocation in dev — otherwise we get two greetings.
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    sendToAI([]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendToAI(history: ChatMessage[]) {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (data.type === "brand_complete") {
        setBrandDraft(data.brand);
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `Here's **${data.brand.name}**. Take a look — you can launch it as-is, or we can keep iterating.`,
        }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || loading || brandDraft) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    await sendToAI(newMessages);
  }

  async function saveBrand() {
    if (!brandDraft) return;
    setSavingBrand(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...brandDraft, status: "active" }),
      });
      const brand = await res.json();
      if (brand.error) throw new Error(brand.error);

      // Fire-and-forget: logo + full Brand Book.
      fetch("/api/ai/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName: brandDraft.name, logoPrompt: brandDraft.logo_prompt, palette: brandDraft.palette }),
      }).then(r => r.json()).then(({ url }) => {
        if (url) fetch(`/api/brands/${brand.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logo_url: url }) });
      });

      // Background: generate the full Brand Book — takes 15-45s.
      fetch("/api/ai/brand-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: brand.id }),
      }).catch(err => console.warn("Brand book generation kicked off but errored:", err));

      toast.success("Brand launched! 🎉");
      router.push(`/dashboard/${brand.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save brand");
      setSavingBrand(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      {/* Top bar */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <span className="font-black text-white tracking-tight text-xl">FRITO<span className="text-violet-500">.</span></span>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="font-mono text-[11px] tracking-widest text-zinc-400">AI CO-FOUNDER · ACTIVE</span>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 max-w-2xl mx-auto w-full">
        {messages.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-black text-xl">F</span>
            </div>
            <p className="font-mono text-xs tracking-widest text-zinc-400">/ YOUR AI CO-FOUNDER /</p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                  <span className="text-white font-black text-xs">F</span>
                </div>
              )}
              <div className={`max-w-sm rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-zinc-900 text-white rounded-br-sm"
                  : "bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm shadow-sm"
              }`}>
                {msg.content.split("**").map((part, j) =>
                  j % 2 === 1 ? <strong key={j} className="font-black">{part}</strong> : part
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                <span className="text-white font-black text-xs">F</span>
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="typing-dot w-2 h-2 rounded-full bg-zinc-400" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-zinc-400" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-zinc-400" />
                </div>
              </div>
            </div>
          )}

          {brandDraft && <BrandPreviewCard brand={brandDraft} onConfirm={saveBrand} saving={savingBrand} />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      {!brandDraft && (
        <div className="bg-white border-t border-zinc-200 p-4">
          <form onSubmit={handleSend} className="max-w-2xl mx-auto flex gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Tell me about your brand idea…"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-zinc-50 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-white hover:bg-violet-600 transition-colors disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function BrandPreviewCard({ brand, onConfirm, saving }: {
  brand: Partial<BrandDNA>;
  onConfirm: () => void;
  saving: boolean;
}) {
  const palette = brand.palette as Record<string, string> | undefined;
  return (
    <div className="chat-message mt-2">
      <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
        {/* Color bar */}
        <div className="h-1.5 flex">
          {palette && Object.values(palette).slice(0, 5).map((color, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: color as string }} />
          ))}
        </div>

        <div className="p-6">
          <p className="font-mono text-[10px] tracking-widest text-zinc-500 mb-3">BRAND IDENTITY</p>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">{brand.name}</h2>
              <p className="text-zinc-400 mt-1 italic text-sm">"{brand.tagline}"</p>
            </div>
            <span className="font-mono text-[9px] tracking-wider border border-zinc-600 text-zinc-400 px-2 py-0.5 rounded uppercase">{brand.price_tier}</span>
          </div>

          <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{brand.story}</p>

          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="font-mono text-[9px] tracking-widest text-zinc-500 mb-1">NICHE</p>
              <p className="text-zinc-300 font-medium">{brand.niche}</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="font-mono text-[9px] tracking-widest text-zinc-500 mb-1">AUDIENCE</p>
              <p className="text-zinc-300 font-medium">{brand.target_audience}</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="font-mono text-[9px] tracking-widest text-zinc-500 mb-1">VOICE</p>
              <p className="text-zinc-300 font-medium">{brand.voice_tone}</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="font-mono text-[9px] tracking-widest text-zinc-500 mb-1">PALETTE</p>
              <div className="flex gap-1.5 mt-1">
                {palette && Object.values(palette).slice(0, 5).map((color, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border border-zinc-600" style={{ backgroundColor: color as string }} />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-5">
            {brand.brand_values?.map((v, i) => (
              <span key={i} className="font-mono text-[10px] tracking-wider border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded">{v}</span>
            ))}
          </div>

          {/* Status checklist */}
          <div className="space-y-1 mb-5">
            {["logo generated", "tagline written", "palette defined", "voice set"].map((item, i) => (
              <p key={i} className="font-mono text-xs text-green-400">✓ {item}</p>
            ))}
          </div>

          <button
            onClick={onConfirm}
            disabled={saving}
            className="w-full bg-violet-600 text-white font-bold py-3.5 rounded-xl hover:bg-violet-500 transition-colors disabled:opacity-50"
          >
            {saving ? "Launching brand…" : "Launch this brand →"}
          </button>
          <p className="font-mono text-[10px] text-zinc-500 text-center mt-2 tracking-wider">LOGO GENERATES IN BACKGROUND</p>
        </div>
      </div>
    </div>
  );
}
