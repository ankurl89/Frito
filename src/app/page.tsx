"use client";

import Link from "next/link";
import { useState } from "react";
import { Type, Palette, Shirt, Rocket } from "lucide-react";

// Realistic Flux-generated product + lifestyle imagery (Supabase public bucket).
const HOME_IMG = "https://pecaekbgmbuhssrwtclx.supabase.co/storage/v1/object/public/product-assets/_home";
const TPL_IMG = "https://pecaekbgmbuhssrwtclx.supabase.co/storage/v1/object/public/product-assets/_templates";

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
          <Link href="/guides" className="hover:text-zinc-900 transition-colors">Guides</Link>
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
      <h1 className="text-[clamp(2.5rem,8vw,6.5rem)] font-black leading-[0.95] sm:leading-[0.9] tracking-tight uppercase text-zinc-900 mb-6 max-w-5xl mx-auto break-words">
        Start your own<br />
        apparel brand in{" "}
        <span className="relative inline-block">
          minutes
          <span className="absolute bottom-1 left-0 w-full h-3 bg-yellow-300 -z-10 skew-x-[-2deg]" />
        </span>.
      </h1>

      <p className="text-lg sm:text-xl text-zinc-600 max-w-2xl mx-auto mb-7">
        Describe your idea — Frito&apos;s AI designs your brand, your products, and a live
        online store. We handle printing, shipping, and payments. No inventory, no upfront
        cost: <span className="font-semibold text-zinc-900">you only pay when you sell.</span>
      </p>

      {/* At-a-glance benefits */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-zinc-700 mb-9">
        {["AI builds your brand, designs & store", "Zero inventory — printed on demand", "Pay only when you sell"].map(b => (
          <span key={b} className="inline-flex items-center gap-2">
            <span className="text-violet-600 font-black">✓</span> {b}
          </span>
        ))}
      </div>

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
            { name: "OVERSIZED HOODIE", price: "₹1,899", img: `${HOME_IMG}/hero-hoodie.jpg` },
            { name: "GRAPHIC TEE", price: "₹899", img: `${HOME_IMG}/hero-tee.jpg` },
            { name: "CREWNECK SWEATSHIRT", price: "₹1,499", img: `${TPL_IMG}/sweatshirt.png` },
            { name: "CLASSIC TEE", price: "₹799", img: `${TPL_IMG}/tshirt.png` },
          ].map(p => (
            <div key={p.name} className="bg-white rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-white/80 backdrop-blur border border-zinc-200 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
              </div>
              <div className="aspect-square bg-zinc-50 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-2.5">
                <p className="text-[10px] font-black text-zinc-900 tracking-wide leading-tight">{p.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{p.price}</p>
              </div>
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
          <p className="text-7xl sm:text-8xl md:text-[7rem] font-black leading-none text-zinc-900">4,225</p>
          <p className="text-zinc-700 mt-3 max-w-xs">A new brand goes live on Frito roughly every 4 seconds. Yours could be next.</p>
          <Link href="/signup" className="mt-6 inline-flex items-center font-semibold text-zinc-900 border-2 border-zinc-900 rounded-full px-6 py-2.5 hover:bg-zinc-900 hover:text-yellow-300 transition-colors">
            Join the drop →
          </Link>
        </div>
        <div className="bg-white border-2 border-zinc-900 rounded-2xl overflow-hidden shadow-lg">
          {[
            { name: "Streetwear Hoodie Drop", location: "MUMBAI", time: "2 MIN AGO" },
            { name: "Gym Apparel Brand", location: "DELHI", time: "8 MIN AGO" },
            { name: "Anime Tee Drop", location: "BANGALORE", time: "15 MIN AGO" },
            { name: "Creator Merch Line", location: "PUNE", time: "22 MIN AGO" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 last:border-0">
              <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-base flex-shrink-0">
                {["🧥", "💪", "⛩️", "🎬"][i]}
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
    { tag: "PROMPT",    title: "Describe your idea",  desc: "Tell Frito what kind of brand you want to build. One sentence is enough.",              icon: Type,    accent: "from-violet-500 to-indigo-600", tagCls: "bg-violet-100 text-violet-700" },
    { tag: "AI BRAND",  title: "Brand kit generated", desc: "Name, logo, colours, voice, and positioning — generated and editable in seconds.",      icon: Palette, accent: "from-sky-500 to-blue-600",      tagCls: "bg-sky-100 text-sky-700" },
    { tag: "AI DESIGN", title: "Products designed",   desc: "AI puts your designs on premium apparel — tees, hoodies, and more — ready to sell.",     icon: Shirt,   accent: "from-amber-400 to-orange-600",  tagCls: "bg-amber-100 text-amber-700" },
    { tag: "LIVE",      title: "Store goes live",     desc: "Your storefront goes live and every order routes to production automatically.",          icon: Rocket,  accent: "from-emerald-500 to-green-600", tagCls: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="font-mono text-xs tracking-widest text-violet-600 mb-4">HOW IT WORKS</p>
          <h2 className="text-5xl md:text-6xl font-black leading-[1.05] text-zinc-900">
            From Idea to Revenue<br />in 30 Minutes
          </h2>
          <p className="text-zinc-500 mt-5 text-lg max-w-xl mx-auto">
            Four steps. No designers, no developers, no inventory — your AI team does the work.
          </p>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* flow line connecting the step nodes (desktop) */}
          <div className="hidden lg:block absolute top-[60px] left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-violet-300 via-amber-300 to-emerald-300" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative bg-white border border-zinc-200 rounded-3xl p-6 text-center hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className={`w-[72px] h-[72px] rounded-2xl bg-gradient-to-br ${step.accent} flex items-center justify-center text-white shadow-lg ring-4 ring-white`}>
                      <Icon size={30} strokeWidth={2} />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-zinc-900 text-white text-xs font-black flex items-center justify-center ring-2 ring-white">{i + 1}</span>
                  </div>
                </div>
                <span className={`inline-block text-[10px] font-black tracking-wider ${step.tagCls} px-2.5 py-1 rounded-full mb-3`}>{step.tag}</span>
                <h3 className="text-xl font-black text-zinc-900 mb-1.5">{step.title}</h3>
                <p className="text-zinc-500 leading-relaxed text-[15px]">{step.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold px-8 py-4 rounded-full hover:bg-violet-700 transition-colors text-base">
            Start your brand free →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── AI TEAM ── */
function AITeam() {
  const agents = [
    { name: "Maya", role: "BRAND STRATEGIST", tag: "BRAND", status: "Crafting voice for your brand…", color: "bg-violet-600", img: `${HOME_IMG}/team-maya.jpg` },
    { name: "Leo", role: "DESIGN LEAD", tag: "DESIGN", status: "Rendering product graphic v3…", color: "bg-orange-500", img: `${HOME_IMG}/team-leo.jpg` },
    { name: "Zara", role: "GROWTH AGENT", tag: "GROWTH", status: "Analysing top-selling niches…", color: "bg-green-500", img: `${HOME_IMG}/team-zara.jpg` },
    { name: "Dev", role: "FULFILLMENT OPS", tag: "OPS", status: "Routing order to production…", color: "bg-blue-500", img: `${HOME_IMG}/team-dev.jpg` },
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
              <div className="w-14 h-14 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.img} alt={a.name} className="w-full h-full object-cover" />
              </div>
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
    { name: "RŌNIN", category: "ANIME APPAREL", tag: "ANIME", img: `${HOME_IMG}/bw-anime.jpg` },
    { name: "Pulse Co.", category: "TRAINING APPAREL", tag: "FITNESS", img: `${HOME_IMG}/bw-fitness.jpg` },
    { name: "Respawn", category: "GAMING APPAREL", tag: "GAMING", img: `${HOME_IMG}/bw-gaming.jpg` },
    { name: "Northbound", category: "STARTUP MERCH", tag: "STARTUP", img: `${HOME_IMG}/bw-startup.jpg` },
    { name: "Wildroot", category: "CAUSE-BASED TEES", tag: "CAUSE", img: `${HOME_IMG}/bw-cause.jpg` },
    { name: "Kintsugi", category: "PREMIUM ANIME", tag: "ANIME", img: `${HOME_IMG}/bw-anime2.jpg` },
    { name: "Creator Co.", category: "CREATOR MERCH", tag: "MERCH", img: `${HOME_IMG}/bw-creator.jpg` },
    { name: "Futsl", category: "URBAN STREETWEAR", tag: "STREETWEAR", img: `${HOME_IMG}/bw-streetwear.jpg` },
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
            <div key={i} className="relative rounded-2xl aspect-square overflow-hidden border border-zinc-200 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.img} alt={b.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
              <div className="relative h-full flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black tracking-wider text-white border border-white/40 px-1.5 py-0.5 rounded bg-black/30 backdrop-blur">{b.tag}</span>
                  <span className="text-[10px] font-black tracking-wider border border-yellow-300/60 bg-yellow-400/90 text-zinc-900 px-1.5 py-0.5 rounded">LIVE</span>
                </div>
                <div>
                  <p className="font-black text-lg text-white">{b.name}</p>
                  <p className="text-[10px] font-mono text-white/70 tracking-wider mt-0.5">{b.category}</p>
                </div>
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
  // Mirrors the real catalog (src/lib/qikink-catalog.ts): cost = all-in
  // production cost (garment + print); sell = typical premium price; margin
  // = profit / sell. Keep in sync when the catalog changes.
  const products = [
    { category: "Apparel", name: "Oversized T-Shirt", cost: 449, sell: 999, margin: 55, img: `${TPL_IMG}/tshirt.png` },
    { category: "Apparel", name: "Classic Unisex T-Shirt", cost: 499, sell: 1199, margin: 58, img: `${TPL_IMG}/tshirt.png` },
    { category: "Apparel", name: "Hoodie", cost: 699, sell: 1799, margin: 61, img: `${TPL_IMG}/hoodie.png` },
    { category: "Apparel", name: "Sweatshirt", cost: 599, sell: 1499, margin: 60, img: `${TPL_IMG}/sweatshirt.png` },
  ];

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <p className="font-mono text-xs tracking-widest text-violet-600 mb-2">CATALOG</p>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <h2 className="text-4xl md:text-5xl font-black text-zinc-900 leading-tight">
            Four products. Priced for profit.
          </h2>
          <p className="text-zinc-500 max-w-xs">A focused premium apparel catalog. Real costs, suggested prices, and margin on every product.</p>
        </div>
        <div className="flex gap-2 mb-8 flex-wrap">
          {["Oversized Tee", "Classic Tee", "Hoodie", "Sweatshirt"].map((cat, i) => (
            <button key={cat} className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${i === 0 ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}>
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {products.map(p => (
            <div key={p.name} className="border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-zinc-50 aspect-square overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
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
  const [price, setPrice] = useState(999);
  // Blended all-in production cost across the catalog (tees→hoodies).
  const avgCost = 550;
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
              <input type="range" min={599} max={2999} step={50} value={price} onChange={e => setPrice(Number(e.target.value))}
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
      features: ["Unlimited brands", "API + Zapier access", "Dedicated print partners", "Team seats", "Advanced analytics", "Priority support"],
      cta: "Get started", highlight: false,
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
        <p className="text-center text-xs text-zinc-400 mt-6">Prices in INR, exclusive of 18% GST.</p>
      </div>
    </section>
  );
}

/* ── FAQ ── */
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "How long does it take to launch?", a: "Minutes. Describe your idea and Frito's AI builds your brand, product designs, and a live store on the spot. Refine anything before or after you go live." },
    { q: "Do I need inventory?", a: "No. Every product is printed on-demand when a customer orders. You never hold stock or pay upfront." },
    { q: "Do I need Shopify experience?", a: "No. Frito gives you a hosted storefront out of the box. Shopify export is available as an upgrade." },
    { q: "Can I use my own designs?", a: "Yes. You can upload your own artwork or let AI generate designs from your brand brief." },
    { q: "How does fulfillment work?", a: "Orders automatically route to our production network. They print, pack, and ship directly to your customer — you never touch inventory." },
    { q: "When do I get paid?", a: "Every sale's profit — your price minus production and platform fees — accrues to your earnings balance automatically. Add your bank details once in the dashboard, and your available balance is paid out to your bank account on a regular payout cycle, after a short buffer for returns." },
    { q: "Can I cancel my plan? Are subscriptions refundable?", a: "Yes — cancel anytime from your dashboard and keep access until the end of your billing period. Subscription fees are non-refundable except where required by law. Customer order refunds follow your store's refund policy." },
    { q: "Can I sell internationally?", a: "International shipping is on our roadmap. Currently we support all of India with Delhivery, Bluedart, and Xpressbees." },
    { q: "What if I get stuck?", a: "Frito is fully self-serve, but you're never on your own. Every account includes the Founder Playbook — step-by-step guides on selling, social content, and ads — right inside your dashboard, plus email support." },
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
            <a href="#how-it-works" className="inline-flex items-center justify-center border-2 border-zinc-600 text-white font-semibold px-8 py-4 rounded-full hover:border-zinc-400 transition-colors">
              See how it works →
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
      <p>© {new Date().getFullYear()} Frito AI · Launch a brand in minutes.</p>
      <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
        <Link href="/terms" className="hover:text-zinc-900 transition-colors">Terms</Link>
        <Link href="/privacy" className="hover:text-zinc-900 transition-colors">Privacy</Link>
        <Link href="/refunds" className="hover:text-zinc-900 transition-colors">Refunds</Link>
        <Link href="/shipping" className="hover:text-zinc-900 transition-colors">Shipping</Link>
        <Link href="/contact" className="hover:text-zinc-900 transition-colors">Contact</Link>
      </div>
    </footer>
  );
}
