"use client";

import Link from "next/link";
import { useState } from "react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans">
      <Nav />
      <Hero />
      <LiveCounter />
      <Problem />
      <HowItWorks />
      <AITeam />
      <BrandWall />
      <Catalog />
      <RevenueCalculator />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ── NAV ── */
function Nav() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl">
      <div className="bg-white border border-zinc-200 rounded-full px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-black text-sm">F</div>
          <span className="font-black text-lg tracking-tight">FRITO<span className="text-violet-600">.</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
          <a href="#how-it-works" className="hover:text-zinc-900 transition-colors">How it works</a>
          <a href="#brand-wall" className="hover:text-zinc-900 transition-colors">Brand wall</a>
          <a href="#pricing" className="hover:text-zinc-900 transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Sign in</Link>
          <Link href="/signup" className="bg-violet-600 text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-violet-700 transition-colors">
            Start free
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ── HERO ── */
function Hero() {
  return (
    <section className="pt-36 pb-20 px-6 text-center">
      {/* Social proof pill */}
      <div className="inline-flex items-center gap-2 border border-zinc-300 rounded-full px-4 py-1.5 text-sm mb-8 bg-white">
        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        4,219 brands launched this month
      </div>

      {/* Headline */}
      <h1 className="text-[clamp(3rem,9vw,7rem)] font-black leading-[0.9] tracking-tight uppercase text-zinc-900 mb-6 max-w-5xl mx-auto">
        Launch something<br />
        people{" "}
        <em className="not-italic italic font-black">actually</em>{" "}
        <span className="relative inline-block">
          want
          <span className="absolute bottom-1 left-0 w-full h-3 bg-yellow-300 -z-10 skew-x-[-2deg]" />
        </span>.
      </h1>

      <p className="text-lg text-zinc-500 max-w-xl mx-auto mb-10">
        Type one prompt. Get a brand, products, and a live store.<br />
        Sell first. Make it real second.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
        <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold px-8 py-4 rounded-full hover:bg-violet-700 transition-colors text-base">
          Start your brand free →
        </Link>
        <a href="#brand-wall" className="inline-flex items-center justify-center gap-2 border-2 border-zinc-900 text-zinc-900 font-semibold px-8 py-4 rounded-full hover:bg-zinc-50 transition-colors text-base">
          See real brands →
        </a>
      </div>

      {/* Product showcase mockup */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Prompt terminal */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 text-left shadow-sm">
          <div className="flex items-center gap-1.5 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-xs font-mono text-zinc-400 ml-2">PROMPT</span>
          </div>
          <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100 mb-4">
            <p className="text-zinc-400 font-mono text-xs mb-1">$ frito new brand</p>
            <p className="font-semibold text-zinc-900 text-base leading-snug">"I want to launch a premium anime streetwear brand."</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-violet-600 mb-3">
            <span>✦</span> <span>3 agents working · 12s</span>
          </div>
          <div className="w-full bg-zinc-900 text-white font-semibold rounded-xl py-3 text-center text-sm flex items-center justify-center gap-2">
            <span>✦</span> Generate brand
          </div>
        </div>

        {/* Brand identity card */}
        <div className="bg-zinc-900 rounded-2xl p-5 text-left shadow-sm">
          <p className="text-zinc-400 font-mono text-xs mb-4 tracking-widest">BRAND IDENTITY</p>
          <h3 className="text-white font-black text-2xl tracking-tight mb-1">RŌNIN <span className="text-orange-400 font-mono text-sm font-normal">/wave 01/</span></h3>
          <p className="text-zinc-400 text-sm mb-4">Tokyo-night streetwear for the chronically online. Loud graphics, quiet confidence.</p>
          <p className="text-zinc-500 font-mono text-xs mb-2 tracking-widest">PALETTE</p>
          <div className="flex gap-2 mb-4">
            {["#1a1a1a", "#7c3aed", "#f97316", "#fbbf24", "#f5f5f0"].map(c => (
              <div key={c} className="w-9 h-9 rounded-full border-2 border-zinc-700" style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="space-y-1.5 font-mono text-sm">
            <p className="text-green-400">✓ logo generated</p>
            <p className="text-green-400">✓ tagline written</p>
            <p className="text-green-400">✓ 12 product designs ready</p>
            <p className="text-orange-400">→ deploying store…</p>
          </div>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: "OVERSIZED HOODIE", price: "₹1,899", emoji: "🧥" },
            { name: "GRAPHIC TEE", price: "₹899", emoji: "👕" },
            { name: "CANVAS TOTE", price: "₹599", emoji: "👜" },
            { name: "PHONE CASE", price: "₹499", emoji: "📱" },
          ].map(p => (
            <div key={p.name} className="bg-white rounded-xl p-3 border border-zinc-200 shadow-sm relative">
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-zinc-200 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
              </div>
              <div className="text-3xl mb-2 text-center">{p.emoji}</div>
              <p className="text-[10px] font-black text-zinc-900 tracking-wide leading-tight">{p.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{p.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust ticker */}
      <p className="mt-8 text-xs text-zinc-400 tracking-wider">
        · store live · your-brand.store · &nbsp; · &nbsp; no credit card · &nbsp; · &nbsp; pay only when you sell ·
      </p>
    </section>
  );
}

/* ── LIVE COUNTER ── */
function LiveCounter() {
  return (
    <section className="bg-yellow-300 py-16 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <p className="font-mono text-xs tracking-widest text-zinc-700 mb-3">· LIVE · BRANDS CREATED TODAY</p>
          <p className="text-[7rem] font-black leading-none text-zinc-900">4,225</p>
          <p className="text-zinc-700 mt-3 max-w-xs">A new brand goes live on Frito roughly every 4 seconds. Yours could be next.</p>
          <Link href="/signup" className="mt-6 inline-flex items-center font-semibold text-zinc-900 border-2 border-zinc-900 rounded-full px-6 py-2.5 hover:bg-zinc-900 hover:text-yellow-300 transition-colors">
            Join the drop →
          </Link>
        </div>
        <div className="bg-white border-2 border-zinc-900 rounded-2xl overflow-hidden shadow-lg">
          {[
            { name: "Skincare Brand", location: "MUMBAI", time: "2 MIN AGO" },
            { name: "Gym Apparel Brand", location: "DELHI", time: "8 MIN AGO" },
            { name: "Anime Tee Drop", location: "BANGALORE", time: "15 MIN AGO" },
            { name: "Home Decor Brand", location: "PUNE", time: "22 MIN AGO" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 last:border-0">
              <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-base flex-shrink-0">
                {["🧴", "💪", "⛩️", "🌿"][i]}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-zinc-900">{b.name} <span className="text-violet-600 font-semibold">created</span></p>
                <p className="text-xs text-zinc-400 font-mono">{b.location} · {b.time}</p>
              </div>
              <span className="text-[10px] font-black tracking-wider border border-yellow-400 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">LIVE</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── PROBLEM ── */
function Problem() {
  return (
    <section className="py-24 px-6 bg-[#F5F5F0]">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <p className="font-mono text-xs tracking-widest text-violet-600 mb-4">THE PROBLEM</p>
        <h2 className="text-5xl md:text-6xl font-black leading-tight text-zinc-900">
          Starting a Brand<br />Shouldn't Cost Lakhs.
        </h2>
        <p className="text-zinc-500 mt-4 text-lg">The old playbook is broken. We replaced every gatekeeper with an AI agent.</p>
      </div>
      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="font-mono text-xs tracking-widest text-zinc-400 mb-4">THE TRADITIONAL WAY</p>
          <div className="space-y-3">
            {["₹5–10L inventory upfront", "Hire designers", "Negotiate manufacturers", "Build Shopify alone", "Rent a warehouse"].map(item => (
              <div key={item} className="flex items-center gap-3 text-zinc-400 line-through">
                <span className="text-red-400 font-bold">✕</span> {item}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="font-mono text-xs tracking-widest text-zinc-400 mb-4">THE FRITO WAY</p>
          <div className="space-y-3">
            {["Zero inventory", "AI generates designs", "Automated fulfillment", "One-click store setup", "Launch in 30 minutes"].map(item => (
              <div key={item} className="flex items-center gap-3 text-white">
                <span className="text-green-400 font-bold">✓</span> {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── HOW IT WORKS ── */
function HowItWorks() {
  const steps = [
    { num: "01", title: "Describe your idea", desc: "Tell Frito what kind of brand you want to build. One sentence is enough.", tag: "PROMPT" },
    { num: "02", title: "Brand kit generated", desc: "Name, logo, colors, voice, positioning — generated and editable in seconds.", tag: "AI BRAND" },
    { num: "03", title: "Products designed", desc: "AI designs your products using your brand identity. Pick from 100+ items.", tag: "AI DESIGN" },
    { num: "04", title: "Store goes live", desc: "Your storefront is live. Orders route to production automatically.", tag: "LIVE" },
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="font-mono text-xs tracking-widest text-violet-600 mb-4">HOW IT WORKS</p>
          <h2 className="text-5xl md:text-6xl font-black leading-tight text-zinc-900">
            From Idea to Revenue<br />in 30 Minutes
          </h2>
        </div>
        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-8 items-start py-8 border-b border-zinc-100 last:border-0">
              <div className="flex-shrink-0 w-16">
                <span className="font-mono text-xs text-zinc-400">{step.num}</span>
              </div>
              <div className="flex-shrink-0 w-24">
                <span className="text-[10px] font-black tracking-wider bg-violet-100 text-violet-700 px-2 py-1 rounded">{step.tag}</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-zinc-900 mb-1">{step.title}</h3>
                <p className="text-zinc-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── AI TEAM ── */
function AITeam() {
  const agents = [
    { name: "Maya", role: "BRAND STRATEGIST", tag: "BRAND", status: "Crafting voice for your brand…", color: "bg-violet-600", emoji: "🧠" },
    { name: "Leo", role: "DESIGN LEAD", tag: "DESIGN", status: "Rendering product graphic v3…", color: "bg-orange-500", emoji: "🎨" },
    { name: "Zara", role: "GROWTH AGENT", tag: "GROWTH", status: "Analysing top-selling niches…", color: "bg-green-500", emoji: "📈" },
    { name: "Dev", role: "FULFILLMENT OPS", tag: "OPS", status: "Routing order to production…", color: "bg-blue-500", emoji: "📦" },
  ];

  return (
    <section className="bg-zinc-900 py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="font-mono text-xs tracking-widest text-zinc-500 mb-2">/ THE TEAM /</p>
        <h2 className="text-5xl md:text-6xl font-black text-white leading-tight mb-2">
          YOUR STARTUP TEAM —<br />
          <span className="text-zinc-500">WITHOUT THE STARTUP.</span>
        </h2>
        <p className="text-zinc-400 mb-12 max-w-lg">
          Six specialists running your brand 24/7. You'd pay ₹40L+ a year to hire this team. They join Frito for free.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((a, i) => (
            <div key={i} className="bg-zinc-800 border border-zinc-700 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center text-2xl flex-shrink-0">{a.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-black text-white">{a.name}</p>
                  <span className={`text-[9px] font-black tracking-wider text-white px-1.5 py-0.5 rounded ${a.color}`}>{a.tag}</span>
                </div>
                <p className="text-xs text-zinc-500 font-mono mb-2">{a.role}</p>
                <p className="text-sm text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  {a.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── BRAND WALL ── */
function BrandWall() {
  const brands = [
    { name: "RŌNIN", category: "ANIME STREETWEAR", tag: "STREETWEAR", emoji: "⛩️", bg: "bg-zinc-900", text: "text-white" },
    { name: "Pulse Co.", category: "WOMEN'S ACTIVEWEAR", tag: "FITNESS", emoji: "💪", bg: "bg-pink-50", text: "text-zinc-900" },
    { name: "Lone Print", category: "TYPOGRAPHIC POSTERS", tag: "ART", emoji: "🖼️", bg: "bg-amber-50", text: "text-zinc-900" },
    { name: "Sal&Sage", category: "CLEAN SKINCARE", tag: "BEAUTY", emoji: "🌿", bg: "bg-emerald-50", text: "text-zinc-900" },
    { name: "Slow Roast", category: "SPECIALTY COFFEE", tag: "F&B", emoji: "☕", bg: "bg-stone-100", text: "text-zinc-900" },
    { name: "Houss", category: "PETS & HOME", tag: "PETS", emoji: "🐾", bg: "bg-blue-50", text: "text-zinc-900" },
    { name: "Creator Co.", category: "CREATOR MERCH KIT", tag: "MERCH", emoji: "🎙️", bg: "bg-violet-50", text: "text-zinc-900" },
    { name: "Futsl", category: "URBAN STREETWEAR", tag: "STREETWEAR", emoji: "🛹", bg: "bg-yellow-50", text: "text-zinc-900" },
  ];

  return (
    <section id="brand-wall" className="py-24 px-6 bg-[#F5F5F0]">
      <div className="max-w-5xl mx-auto">
        <p className="font-mono text-xs tracking-widest text-zinc-500 mb-2">/ THE BRAND WALL /</p>
        <h2 className="text-5xl md:text-6xl font-black text-zinc-900 leading-tight mb-12">
          BUILT IN A WEEKEND.
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {brands.map((b, i) => (
            <div key={i} className={`${b.bg} rounded-2xl p-5 aspect-square flex flex-col justify-between border border-zinc-200`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black tracking-wider text-zinc-500 border border-zinc-300 px-1.5 py-0.5 rounded bg-white/50">{b.tag}</span>
                <span className="text-[10px] font-black tracking-wider border border-yellow-400 bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">LIVE</span>
              </div>
              <div>
                <div className="text-3xl mb-2">{b.emoji}</div>
                <p className={`font-black text-base ${b.text}`}>{b.name}</p>
                <p className="text-[10px] font-mono text-zinc-400 tracking-wider mt-0.5">{b.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CATALOG ── */
function Catalog() {
  const products = [
    { category: "Apparel", name: "Premium Cotton Tee", cost: 240, sell: 799, margin: 70, emoji: "👕" },
    { category: "Apparel", name: "Heavy Hoodie", cost: 580, sell: 1799, margin: 68, emoji: "🧥" },
    { category: "Mugs", name: "Ceramic Mug", cost: 110, sell: 449, margin: 76, emoji: "☕" },
    { category: "Accessories", name: "Canvas Tote Bag", cost: 180, sell: 599, margin: 70, emoji: "👜" },
    { category: "Accessories", name: "Phone Case", cost: 150, sell: 549, margin: 73, emoji: "📱" },
    { category: "Posters", name: "Art Print A3", cost: 80, sell: 349, margin: 77, emoji: "🖼️" },
  ];

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <p className="font-mono text-xs tracking-widest text-violet-600 mb-2">CATALOG</p>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <h2 className="text-4xl md:text-5xl font-black text-zinc-900 leading-tight">
            A catalog priced for profit.
          </h2>
          <p className="text-zinc-500 max-w-xs">Real costs. Suggested prices. Estimated margin — visible on every product.</p>
        </div>
        <div className="flex gap-2 mb-8 flex-wrap">
          {["All", "Apparel", "Mugs", "Accessories", "Posters", "Tote Bags"].map(cat => (
            <button key={cat} className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${cat === "All" ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}>
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.name} className="border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-zinc-50 p-8 flex items-center justify-center text-5xl aspect-square">
                {p.emoji}
              </div>
              <div className="p-5">
                <p className="text-xs text-zinc-400 mb-1">{p.category}</p>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-black text-zinc-900">{p.name}</p>
                  <span className="text-green-600 font-black text-sm">+{p.margin}%</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "COST", value: `₹${p.cost}`, dark: false },
                    { label: "SELL", value: `₹${p.sell}`, dark: false },
                    { label: "PROFIT", value: `₹${p.sell - p.cost}`, dark: true },
                  ].map(col => (
                    <div key={col.label} className={`rounded-lg p-2 text-center ${col.dark ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}>
                      <p className="text-[9px] font-mono tracking-wider opacity-60">{col.label}</p>
                      <p className="font-black text-sm">{col.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── REVENUE CALCULATOR ── */
function RevenueCalculator() {
  const [units, setUnits] = useState(150);
  const [price, setPrice] = useState(799);
  const avgCost = 280;
  const revenue = units * price;
  const fulfillment = units * avgCost;
  const profit = revenue - fulfillment;

  return (
    <section className="py-24 px-6 bg-[#F5F5F0]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-mono text-xs tracking-widest text-violet-600 mb-4">REVENUE CALCULATOR</p>
          <h2 className="text-4xl md:text-5xl font-black text-zinc-900">See what your<br />brand could earn.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="bg-white border border-zinc-200 rounded-2xl p-8">
            <div className="mb-8">
              <div className="flex justify-between mb-3">
                <span className="text-sm text-zinc-600">Products sold / month</span>
                <span className="font-black text-zinc-900">{units} units</span>
              </div>
              <input type="range" min={10} max={500} value={units} onChange={e => setUnits(Number(e.target.value))}
                className="w-full accent-violet-600" />
            </div>
            <div>
              <div className="flex justify-between mb-3">
                <span className="text-sm text-zinc-600">Average selling price</span>
                <span className="font-black text-zinc-900">₹{price}</span>
              </div>
              <input type="range" min={199} max={2999} step={50} value={price} onChange={e => setPrice(Number(e.target.value))}
                className="w-full accent-violet-600" />
            </div>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-8 text-white">
            <div className="space-y-4">
              <div className="flex justify-between items-end pb-4 border-b border-zinc-700">
                <span className="text-zinc-400">Revenue</span>
                <span className="font-black text-2xl">₹{revenue.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-end pb-4 border-b border-zinc-700">
                <span className="text-zinc-400">Fulfillment cost</span>
                <span className="font-bold text-zinc-300">₹{fulfillment.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-zinc-300 font-semibold">Estimated profit</span>
                <span className="font-black text-3xl text-green-400">₹{profit.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── PRICING ── */
function Pricing() {
  const plans = [
    {
      name: "Starter", price: "₹0", period: "/mo",
      desc: "For side hustlers exploring an idea.",
      features: ["1 brand", "AI brand + 10 designs/mo", "Platform-hosted store", "Pay-as-you-fulfill", "Community support"],
      cta: "Start free", highlight: false,
    },
    {
      name: "Growth", price: "₹2,499", period: "/mo",
      desc: "For creators and serious D2C brands.",
      features: ["3 brands", "Unlimited AI designs", "Custom domain + themes", "Priority fulfillment", "Growth Agent insights", "WhatsApp support"],
      cta: "Start 14-day trial", highlight: true,
    },
    {
      name: "Scale", price: "₹9,999", period: "/mo",
      desc: "For agencies and power sellers.",
      features: ["Unlimited brands", "API + Zapier access", "Dedicated print partners", "Team seats", "Custom integrations", "Dedicated success manager"],
      cta: "Talk to sales", highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-4">
          <p className="font-mono text-xs tracking-widest text-violet-600 mb-4">PRICING</p>
          <h2 className="text-4xl md:text-5xl font-black text-zinc-900">Start free. Scale when you sell.</h2>
          <p className="text-zinc-500 mt-3">No setup fees. No inventory. Cancel anytime.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          {plans.map(plan => (
            <div key={plan.name} className={`rounded-2xl p-8 flex flex-col ${plan.highlight ? "bg-zinc-900 text-white -mt-4 shadow-xl" : "border border-zinc-200"}`}>
              {plan.highlight && <p className="text-xs font-black tracking-wider text-violet-400 mb-4">Most popular</p>}
              <p className={`font-bold mb-2 ${plan.highlight ? "text-zinc-400" : "text-zinc-600"}`}>{plan.name}</p>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className={`text-sm mb-1 ${plan.highlight ? "text-zinc-400" : "text-zinc-400"}`}>{plan.period}</span>
              </div>
              <p className={`text-sm mb-6 ${plan.highlight ? "text-zinc-400" : "text-zinc-500"}`}>{plan.desc}</p>
              <div className="space-y-2 flex-1 mb-8">
                {plan.features.map(f => (
                  <div key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? "text-zinc-300" : "text-zinc-600"}`}>
                    <span className={plan.highlight ? "text-violet-400" : "text-green-500"}>✓</span> {f}
                  </div>
                ))}
              </div>
              <Link href="/signup" className={`text-center font-semibold py-3 rounded-xl transition-colors ${plan.highlight ? "bg-violet-600 text-white hover:bg-violet-700" : "border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-50"}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ── */
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "Do I need inventory?", a: "No. Every product is printed on-demand when a customer orders. You never hold stock or pay upfront." },
    { q: "Do I need Shopify experience?", a: "No. Frito gives you a hosted storefront out of the box. Shopify export is available as an upgrade." },
    { q: "Can I use my own designs?", a: "Yes. You can upload your own artwork or let AI generate designs from your brand brief." },
    { q: "How does fulfillment work?", a: "Orders automatically route to our production partners (Qikink). They print, pack, and ship directly to your customer." },
    { q: "When do I get paid?", a: "Profits are settled weekly to your bank account after deducting production and platform fees." },
    { q: "Can I sell internationally?", a: "International shipping is on our roadmap. Currently we support all of India with Delhivery, Bluedart, and Xpressbees." },
  ];

  return (
    <section className="py-24 px-6 bg-[#F5F5F0]">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-4xl font-black text-zinc-900 mb-12">Frequently asked.</h2>
        <div className="space-y-0">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-zinc-200 last:border-0">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left"
              >
                <span className="font-semibold text-zinc-900">{faq.q}</span>
                <span className="text-zinc-400 text-xl flex-shrink-0 ml-4">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && (
                <p className="text-zinc-500 pb-5 leading-relaxed">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FINAL CTA ── */
function FinalCTA() {
  return (
    <section className="py-8 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-zinc-900 rounded-3xl px-12 py-20 text-center" style={{ background: "linear-gradient(135deg, #18181b 60%, #3b0764)" }}>
          <h2 className="text-5xl md:text-6xl font-black text-white leading-tight mb-4">
            Your Brand Is One<br />Prompt Away.
          </h2>
          <p className="text-zinc-400 mb-10 text-lg">Launch your first product today. No card. No inventory. No excuses.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="inline-flex items-center justify-center bg-white text-zinc-900 font-bold px-8 py-4 rounded-full hover:bg-zinc-100 transition-colors">
              Start Building Free →
            </Link>
            <a href="mailto:hello@frito.ai" className="inline-flex items-center justify-center border-2 border-zinc-600 text-white font-semibold px-8 py-4 rounded-full hover:border-zinc-400 transition-colors">
              Book a demo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FOOTER ── */
function Footer() {
  return (
    <footer className="py-8 px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-400 max-w-5xl mx-auto">
      <p>© 2026 Frito AI · Launch a brand in minutes.</p>
      <div className="flex gap-6">
        <a href="#" className="hover:text-zinc-900 transition-colors">Privacy</a>
        <a href="#" className="hover:text-zinc-900 transition-colors">Terms</a>
        <a href="mailto:hello@frito.ai" className="hover:text-zinc-900 transition-colors">Contact</a>
      </div>
    </footer>
  );
}
