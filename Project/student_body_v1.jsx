import React, { useState, useEffect, useCallback, useRef } from "react";

// ============================================================================
// STUDENT BODY — v1 canonical artifact
// ============================================================================
// Replaces v0_skeleton.jsx. New geometry:
//   - Image fills the upper portion of the viewport
//   - Persistent dialogue strip pinned below
//   - Floating diegetic icons over the image (phone / inventory / character / map)
//   - Phone opens as an in-world device:
//       * Portrait state: occupies right ~1/3 of the image area, world dims
//       * Landscape state: rotates and fills ~95% of the image area
//   - Dialogue strip is always visible, never obscured
//   - Notification banner slides in from the top edge for phone events
//
// LLM calls: still stubbed. State persistence: window.storage. The single
// scripted scene from v0 (Mari at the coffee shop) is preserved as the
// playable bootstrap.
//
// Assets are inlined SVG. The asset registry below is the single source of
// truth - swap entries here when real Chroma exports come in.
// ============================================================================

// ============================================================================
// ASSET REGISTRY
// ============================================================================

const LOC_SVGS = {
// Location backgrounds (1280x800 viewBox, full-bleed)

  dorm_room: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800"> <defs> <linearGradient id="bg-dorm-room" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#c7d2fe"/> <stop offset="1" stop-color="#f5d0fe"/> </linearGradient> </defs> <rect width="1280" height="800" fill="url(#bg-dorm-room)"/> <rect y="520" width="1280" height="280" fill="#f8fafc"/> <rect x="90" y="130" width="460" height="340" rx="28" fill="#fff7ed"/> <rect x="90" y="470" width="460" height="40" fill="#fde68a"/> <rect x="140" y="190" width="220" height="120" rx="18" fill="#bfdbfe"/> <rect x="152" y="202" width="196" height="96" rx="14" fill="#60a5fa" opacity="0.32"/> <rect x="390" y="170" width="110" height="240" rx="20" fill="#cbd5e1"/> <rect x="414" y="196" width="60" height="52" rx="10" fill="#94a3b8"/> <rect x="414" y="262" width="60" height="52" rx="10" fill="#94a3b8"/> <rect x="414" y="328" width="60" height="52" rx="10" fill="#94a3b8"/> <rect x="580" y="150" width="610" height="400" rx="32" fill="#e2e8f0"/> <rect x="620" y="190" width="240" height="160" rx="20" fill="#f8fafc"/> <rect x="640" y="210" width="200" height="16" rx="8" fill="#cbd5e1"/> <rect x="640" y="244" width="160" height="16" rx="8" fill="#cbd5e1"/> <rect x="940" y="190" width="190" height="260" rx="24" fill="#fff7ed"/> <circle cx="1035" cy="260" r="46" fill="#fb7185" opacity="0.24"/> <rect x="610" y="540" width="630" height="40" rx="20" fill="#94a3b8" opacity="0.3"/> <rect x="0" y="580" width="1280" height="220" fill="#cbd5e1"/> <circle cx="1040" cy="680" r="54" fill="#f59e0b" opacity="0.18"/> </svg>`,
  dorm_hallway: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800"> <defs> <linearGradient id="bg-hallway" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#e2e8f0"/> <stop offset="1" stop-color="#94a3b8"/> </linearGradient> </defs> <rect width="1280" height="800" fill="url(#bg-hallway)"/> <rect y="560" width="1280" height="240" fill="#cbd5e1"/> <rect x="140" y="120" width="1000" height="520" rx="30" fill="#f8fafc"/> <rect x="170" y="170" width="170" height="420" rx="20" fill="#cbd5e1"/> <rect x="430" y="170" width="170" height="420" rx="20" fill="#e2e8f0"/> <rect x="690" y="170" width="170" height="420" rx="20" fill="#cbd5e1"/> <rect x="950" y="170" width="170" height="420" rx="20" fill="#e2e8f0"/> <rect x="198" y="230" width="114" height="270" rx="18" fill="#94a3b8"/> <rect x="458" y="230" width="114" height="270" rx="18" fill="#94a3b8"/> <rect x="718" y="230" width="114" height="270" rx="18" fill="#94a3b8"/> <rect x="978" y="230" width="114" height="270" rx="18" fill="#94a3b8"/> <path d="M170 650h940" stroke="#94a3b8" stroke-width="18" stroke-linecap="round"/> <circle cx="640" cy="220" r="34" fill="#f59e0b" opacity="0.22"/> </svg>`,
  lecture_hall: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800"> <defs> <linearGradient id="bg-lecture" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#dbeafe"/> <stop offset="1" stop-color="#93c5fd"/> </linearGradient> </defs> <rect width="1280" height="800" fill="url(#bg-lecture)"/> <rect y="560" width="1280" height="240" fill="#f8fafc"/> <rect x="140" y="120" width="1000" height="360" rx="32" fill="#ffffff"/> <rect x="190" y="170" width="900" height="180" rx="22" fill="#1e3a8a"/> <rect x="250" y="220" width="220" height="80" rx="16" fill="#60a5fa" opacity="0.65"/> <rect x="500" y="220" width="220" height="80" rx="16" fill="#38bdf8" opacity="0.65"/> <rect x="750" y="220" width="220" height="80" rx="16" fill="#22c55e" opacity="0.65"/> <rect x="540" y="520" width="200" height="100" rx="18" fill="#64748b"/> <rect x="580" y="380" width="120" height="140" rx="18" fill="#cbd5e1"/> <rect x="570" y="390" width="140" height="18" rx="9" fill="#94a3b8"/> <circle cx="640" cy="355" r="34" fill="#f2c7a3"/> <path d="M595 350c8-26 28-40 45-40s37 14 45 40v22H595z" fill="#334155"/> <path d="M500 650h280" stroke="#cbd5e1" stroke-width="18" stroke-linecap="round"/> <path d="M460 700h360" stroke="#cbd5e1" stroke-width="18" stroke-linecap="round" opacity="0.75"/> <rect x="170" y="130" width="940" height="20" rx="10" fill="#bfdbfe"/> </svg>`,
  library_main: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800"> <defs> <linearGradient id="bg-library-main" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#f8fafc"/> <stop offset="1" stop-color="#cbd5e1"/> </linearGradient> </defs> <rect width="1280" height="800" fill="url(#bg-library-main)"/> <rect y="570" width="1280" height="230" fill="#e2e8f0"/> <rect x="110" y="110" width="1060" height="120" rx="28" fill="#1e293b"/> <rect x="110" y="250" width="1060" height="300" rx="28" fill="#ffffff"/> <rect x="150" y="300" width="180" height="200" rx="18" fill="#cbd5e1"/> <rect x="370" y="300" width="180" height="200" rx="18" fill="#94a3b8"/> <rect x="590" y="300" width="180" height="200" rx="18" fill="#cbd5e1"/> <rect x="810" y="300" width="180" height="200" rx="18" fill="#94a3b8"/> <rect x="1030" y="300" width="120" height="200" rx="18" fill="#cbd5e1"/> <path d="M260 250v320" stroke="#475569" stroke-width="14"/> <path d="M480 250v320" stroke="#475569" stroke-width="14"/> <path d="M700 250v320" stroke="#475569" stroke-width="14"/> <path d="M920 250v320" stroke="#475569" stroke-width="14"/> <circle cx="640" cy="170" r="38" fill="#f59e0b" opacity="0.22"/> </svg>`,
  library_stacks: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800"> <defs> <linearGradient id="bg-library-stacks" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#dbeafe"/> <stop offset="1" stop-color="#a5b4fc"/> </linearGradient> </defs> <rect width="1280" height="800" fill="url(#bg-library-stacks)"/> <rect y="560" width="1280" height="240" fill="#f1f5f9"/> <rect x="120" y="90" width="1040" height="620" rx="28" fill="#ffffff" opacity="0.85"/> <rect x="180" y="130" width="120" height="560" rx="18" fill="#64748b"/> <rect x="340" y="130" width="120" height="560" rx="18" fill="#334155"/> <rect x="500" y="130" width="120" height="560" rx="18" fill="#64748b"/> <rect x="660" y="130" width="120" height="560" rx="18" fill="#334155"/> <rect x="820" y="130" width="120" height="560" rx="18" fill="#64748b"/> <rect x="980" y="130" width="120" height="560" rx="18" fill="#334155"/> <rect x="180" y="190" width="120" height="34" fill="#fb7185"/> <rect x="180" y="250" width="120" height="34" fill="#f59e0b"/> <rect x="180" y="310" width="120" height="34" fill="#22c55e"/> <rect x="340" y="220" width="120" height="34" fill="#38bdf8"/> <rect x="340" y="280" width="120" height="34" fill="#a855f7"/> <rect x="340" y="340" width="120" height="34" fill="#f472b6"/> <rect x="500" y="190" width="120" height="34" fill="#f59e0b"/> <rect x="500" y="250" width="120" height="34" fill="#22c55e"/> <rect x="500" y="310" width="120" height="34" fill="#38bdf8"/> <rect x="660" y="220" width="120" height="34" fill="#f472b6"/> <rect x="660" y="280" width="120" height="34" fill="#f59e0b"/> <rect x="660" y="340" width="120" height="34" fill="#22c55e"/> <rect x="820" y="190" width="120" height="34" fill="#38bdf8"/> <rect x="820" y="250" width="120" height="34" fill="#f472b6"/> <rect x="820" y="310" width="120" height="34" fill="#f59e0b"/> <rect x="980" y="220" width="120" height="34" fill="#22c55e"/> <rect x="980" y="280" width="120" height="34" fill="#38bdf8"/> <rect x="980" y="340" width="120" height="34" fill="#f472b6"/> </svg>`,
  dining_hall: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800"> <defs> <linearGradient id="bg-dining" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#fff7ed"/> <stop offset="1" stop-color="#fdba74"/> </linearGradient> </defs> <rect width="1280" height="800" fill="url(#bg-dining)"/> <rect y="570" width="1280" height="230" fill="#f8fafc"/> <rect x="100" y="160" width="1080" height="230" rx="30" fill="#ffffff"/> <rect x="130" y="110" width="240" height="70" rx="18" fill="#fb923c"/> <rect x="430" y="110" width="240" height="70" rx="18" fill="#f97316"/> <rect x="730" y="110" width="240" height="70" rx="18" fill="#fb923c"/> <rect x="250" y="250" width="780" height="120" rx="20" fill="#fee2e2"/> <circle cx="360" cy="310" r="34" fill="#f2c7a3"/> <circle cx="640" cy="310" r="34" fill="#f2c7a3"/> <circle cx="920" cy="310" r="34" fill="#f2c7a3"/> <rect x="308" y="350" width="104" height="28" rx="14" fill="#cbd5e1"/> <rect x="588" y="350" width="104" height="28" rx="14" fill="#cbd5e1"/> <rect x="868" y="350" width="104" height="28" rx="14" fill="#cbd5e1"/> <rect x="180" y="460" width="920" height="100" rx="24" fill="#e2e8f0"/> <rect x="220" y="484" width="120" height="52" rx="16" fill="#38bdf8"/> <rect x="400" y="484" width="120" height="52" rx="16" fill="#22c55e"/> <rect x="580" y="484" width="120" height="52" rx="16" fill="#f59e0b"/> <rect x="760" y="484" width="120" height="52" rx="16" fill="#ef4444"/> <rect x="940" y="484" width="120" height="52" rx="16" fill="#a855f7"/> </svg>`,
  quad: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800"> <defs> <linearGradient id="bg-quad" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#bbf7d0"/> <stop offset="1" stop-color="#86efac"/> </linearGradient> </defs> <rect width="1280" height="800" fill="url(#bg-quad)"/> <rect y="500" width="1280" height="300" fill="#16a34a"/> <rect x="80" y="150" width="300" height="260" rx="24" fill="#fff" opacity="0.88"/> <rect x="900" y="140" width="320" height="280" rx="24" fill="#fff" opacity="0.88"/> <rect x="480" y="100" width="320" height="240" rx="24" fill="#fff" opacity="0.88"/> <circle cx="640" cy="560" r="110" fill="#facc15" opacity="0.18"/> <circle cx="260" cy="590" r="38" fill="#f2c7a3"/> <circle cx="640" cy="600" r="38" fill="#f2c7a3"/> <circle cx="980" cy="590" r="38" fill="#f2c7a3"/> <path d="M220 640c10-28 28-42 40-42s30 14 40 42v40h-80z" fill="#1e293b"/> <path d="M600 650c10-28 28-42 40-42s30 14 40 42v40h-80z" fill="#1e293b"/> <path d="M940 640c10-28 28-42 40-42s30 14 40 42v40h-80z" fill="#1e293b"/> <circle cx="380" cy="230" r="80" fill="#f59e0b" opacity="0.2"/> <circle cx="940" cy="210" r="88" fill="#f59e0b" opacity="0.2"/> </svg>`,
  quad_night: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800"> <defs> <linearGradient id="bg-quad-night" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#0f172a"/> <stop offset="1" stop-color="#312e81"/> </linearGradient> </defs> <rect width="1280" height="800" fill="url(#bg-quad-night)"/> <rect y="540" width="1280" height="260" fill="#14532d"/> <circle cx="980" cy="130" r="72" fill="#f8fafc" opacity="0.9"/> <circle cx="1008" cy="120" r="72" fill="#0f172a"/> <circle cx="320" cy="160" r="4" fill="#f8fafc"/> <circle cx="410" cy="220" r="3" fill="#f8fafc"/> <circle cx="180" cy="260" r="3" fill="#f8fafc"/> <circle cx="520" cy="120" r="3" fill="#f8fafc"/> <circle cx="640" cy="220" r="3" fill="#f8fafc"/> <circle cx="820" cy="180" r="3" fill="#f8fafc"/> <path d="M240 800c70-120 146-196 236-232s176-46 258-64 164-46 246-106 150-146 188-248v650z" fill="#1e293b" opacity="0.9"/> <rect x="220" y="520" width="120" height="180" rx="18" fill="#334155"/> <rect x="960" y="500" width="160" height="210" rx="18" fill="#334155"/> <circle cx="280" cy="600" r="26" fill="#f2c7a3"/> <path d="M250 638c8-18 20-28 30-28s22 10 30 28v34h-60z" fill="#e5e7eb"/> <circle cx="1040" cy="606" r="26" fill="#f2c7a3"/> <path d="M1010 644c8-18 20-28 30-28s22 10 30 28v34h-60z" fill="#e5e7eb"/> </svg>`,
  gym: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800"> <defs> <linearGradient id="bg-gym" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#f8fafc"/> <stop offset="1" stop-color="#cbd5e1"/> </linearGradient> </defs> <rect width="1280" height="800" fill="url(#bg-gym)"/> <rect y="560" width="1280" height="240" fill="#94a3b8"/> <rect x="90" y="120" width="1100" height="360" rx="28" fill="#ffffff"/> <rect x="180" y="210" width="180" height="180" rx="90" fill="#0ea5e9" opacity="0.2"/> <circle cx="270" cy="300" r="56" fill="#f2c7a3"/> <path d="M212 290c10-40 32-64 58-64s48 24 58 64v48H212z" fill="#111827"/> <path d="M500 300h280" stroke="#64748b" stroke-width="28" stroke-linecap="round"/> <path d="M500 300h-42" stroke="#64748b" stroke-width="18" stroke-linecap="round"/> <path d="M780 300h42" stroke="#64748b" stroke-width="18" stroke-linecap="round"/> <circle cx="900" cy="280" r="64" fill="#22c55e" opacity="0.16"/> <path d="M900 240l16 34 34 16-34 16-16 34-16-34-34-16 34-16z" fill="#22c55e" opacity="0.8"/> <rect x="160" y="500" width="960" height="50" rx="25" fill="#334155" opacity="0.24"/> <rect x="240" y="140" width="800" height="30" rx="15" fill="#bfdbfe"/> </svg>`,
  student_union: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800"> <defs> <linearGradient id="bg-union" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#e9d5ff"/> <stop offset="1" stop-color="#c4b5fd"/> </linearGradient> </defs> <rect width="1280" height="800" fill="url(#bg-union)"/> <rect y="560" width="1280" height="240" fill="#f8fafc"/> <rect x="100" y="140" width="1080" height="300" rx="34" fill="#ffffff"/> <rect x="180" y="220" width="220" height="140" rx="22" fill="#a855f7" opacity="0.22"/> <rect x="530" y="190" width="220" height="170" rx="22" fill="#8b5cf6" opacity="0.24"/> <rect x="880" y="220" width="220" height="140" rx="22" fill="#a855f7" opacity="0.22"/> <path d="M640 110l44 86H596z" fill="#8b5cf6"/> <circle cx="350" cy="300" r="34" fill="#f2c7a3"/> <circle cx="640" cy="300" r="34" fill="#f2c7a3"/> <circle cx="930" cy="300" r="34" fill="#f2c7a3"/> <path d="M304 348h92" stroke="#7c3aed" stroke-width="18" stroke-linecap="round"/> <path d="M594 348h92" stroke="#7c3aed" stroke-width="18" stroke-linecap="round"/> <path d="M884 348h92" stroke="#7c3aed" stroke-width="18" stroke-linecap="round"/> <rect x="260" y="500" width="760" height="90" rx="22" fill="#ede9fe"/> <circle cx="640" cy="600" r="54" fill="#7c3aed" opacity="0.18"/> </svg>`,
  coffee_shop: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800"> <defs> <linearGradient id="bg-coffee" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#fef3c7"/> <stop offset="1" stop-color="#d97706"/> </linearGradient> </defs> <rect width="1280" height="800" fill="url(#bg-coffee)"/> <rect y="560" width="1280" height="240" fill="#f8fafc"/> <rect x="100" y="130" width="1080" height="320" rx="34" fill="#fff7ed"/> <rect x="160" y="190" width="260" height="180" rx="22" fill="#92400e" opacity="0.24"/> <rect x="470" y="180" width="340" height="200" rx="22" fill="#ffffff"/> <path d="M540 240h160v80c0 34-26 60-60 60h-40c-34 0-60-26-60-60z" fill="#a16207" opacity="0.92"/> <path d="M700 252h28c18 0 32 14 32 32s-14 32-32 32h-28" fill="none" stroke="#a16207" stroke-width="18" stroke-linecap="round"/> <path d="M580 224c-22-28-10-48 2-72" fill="none" stroke="#92400e" stroke-width="10" stroke-linecap="round"/> <path d="M628 224c-22-28-10-48 2-72" fill="none" stroke="#92400e" stroke-width="10" stroke-linecap="round"/> <path d="M676 224c-22-28-10-48 2-72" fill="none" stroke="#92400e" stroke-width="10" stroke-linecap="round"/> <rect x="870" y="180" width="240" height="220" rx="24" fill="#fde68a" opacity="0.32"/> <circle cx="280" cy="300" r="34" fill="#f2c7a3"/> <circle cx="980" cy="300" r="34" fill="#f2c7a3"/> <path d="M240 348h80" stroke="#92400e" stroke-width="18" stroke-linecap="round"/> <path d="M940 348h80" stroke="#92400e" stroke-width="18" stroke-linecap="round"/> <rect x="150" y="500" width="980" height="100" rx="24" fill="#fed7aa"/> </svg>`,
  running_trail: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800"> <defs> <linearGradient id="bg-trail" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#dcfce7"/> <stop offset="1" stop-color="#86efac"/> </linearGradient> </defs> <rect width="1280" height="800" fill="url(#bg-trail)"/> <rect y="540" width="1280" height="260" fill="#16a34a"/> <path d="M260 800c80-150 180-250 340-300s280-70 420-140 210-120 260-180v620z" fill="#f8fafc" opacity="0.9"/> <path d="M220 800c84-148 190-252 352-304s276-68 414-134 214-118 294-198" fill="none" stroke="#f97316" stroke-width="36" stroke-linecap="round"/> <path d="M220 800c84-148 190-252 352-304s276-68 414-134 214-118 294-198" fill="none" stroke="#fff7ed" stroke-width="18" stroke-dasharray="34 26" stroke-linecap="round"/> <circle cx="300" cy="240" r="70" fill="#f59e0b" opacity="0.18"/> <path d="M130 780l120-120 40 30 62-92 54 44 84-126" fill="none" stroke="#166534" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/> <circle cx="310" cy="620" r="28" fill="#f2c7a3"/> <path d="M276 660c8-22 22-34 34-34s26 12 34 34v40h-68z" fill="#1f2937"/> </svg>`,
  townie_apartment: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800"> <defs> <linearGradient id="bg-apartment" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#e0f2fe"/> <stop offset="1" stop-color="#c4b5fd"/> </linearGradient> </defs> <rect width="1280" height="800" fill="url(#bg-apartment)"/> <rect y="560" width="1280" height="240" fill="#e2e8f0"/> <rect x="120" y="120" width="1040" height="360" rx="34" fill="#ffffff"/> <rect x="180" y="180" width="220" height="220" rx="22" fill="#94a3b8"/> <rect x="450" y="160" width="260" height="260" rx="22" fill="#cbd5e1"/> <rect x="760" y="190" width="360" height="200" rx="22" fill="#f8fafc"/> <circle cx="300" cy="290" r="52" fill="#f2c7a3"/> <path d="M238 280c10-34 32-54 62-54s52 20 62 54v52H238z" fill="#3f2d20"/> <path d="M510 300c10-34 32-54 62-54s52 20 62 54v52H510z" fill="#334155"/> <path d="M824 296c10-34 32-54 62-54s52 20 62 54v52H824z" fill="#1e293b"/> <rect x="860" y="232" width="120" height="120" rx="18" fill="#fb7185" opacity="0.22"/> <rect x="196" y="500" width="884" height="88" rx="22" fill="#cbd5e1"/> <circle cx="640" cy="620" r="56" fill="#f59e0b" opacity="0.18"/> </svg>`,
  bar: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800"> <defs> <linearGradient id="bg-bar" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#4c1d95"/> <stop offset="1" stop-color="#1f2937"/> </linearGradient> </defs> <rect width="1280" height="800" fill="url(#bg-bar)"/> <rect y="560" width="1280" height="240" fill="#111827"/> <rect x="120" y="150" width="1040" height="260" rx="30" fill="#2e1065"/> <rect x="160" y="210" width="240" height="120" rx="20" fill="#f472b6" opacity="0.24"/> <rect x="470" y="190" width="340" height="160" rx="20" fill="#f59e0b" opacity="0.22"/> <rect x="880" y="210" width="240" height="120" rx="20" fill="#38bdf8" opacity="0.24"/> <circle cx="280" cy="290" r="34" fill="#f2c7a3"/> <circle cx="640" cy="290" r="34" fill="#f2c7a3"/> <circle cx="980" cy="290" r="34" fill="#f2c7a3"/> <path d="M244 348h72" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity="0.8"/> <path d="M604 348h72" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity="0.8"/> <path d="M944 348h72" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity="0.8"/> <rect x="180" y="470" width="920" height="110" rx="26" fill="#111827" opacity="0.7"/> <rect x="240" y="490" width="120" height="70" rx="18" fill="#7c3aed"/> <rect x="420" y="490" width="120" height="70" rx="18" fill="#f59e0b"/> <rect x="600" y="490" width="120" height="70" rx="18" fill="#22c55e"/> <rect x="780" y="490" width="120" height="70" rx="18" fill="#38bdf8"/> <rect x="960" y="490" width="120" height="70" rx="18" fill="#fb7185"/> </svg>`,
  bookstore: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800"> <defs> <linearGradient id="bg-bookstore" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#f8fafc"/> <stop offset="1" stop-color="#fde68a"/> </linearGradient> </defs> <rect width="1280" height="800" fill="url(#bg-bookstore)"/> <rect y="560" width="1280" height="240" fill="#e2e8f0"/> <rect x="110" y="120" width="1060" height="360" rx="32" fill="#fff7ed"/> <rect x="160" y="180" width="220" height="240" rx="20" fill="#a16207" opacity="0.22"/> <rect x="430" y="180" width="220" height="240" rx="20" fill="#b45309" opacity="0.22"/> <rect x="700" y="180" width="220" height="240" rx="20" fill="#a16207" opacity="0.22"/> <rect x="970" y="180" width="140" height="240" rx="20" fill="#b45309" opacity="0.22"/> <rect x="240" y="220" width="100" height="120" rx="12" fill="#ef4444"/> <rect x="510" y="220" width="100" height="120" rx="12" fill="#22c55e"/> <rect x="780" y="220" width="100" height="120" rx="12" fill="#3b82f6"/> <rect x="1008" y="220" width="60" height="120" rx="12" fill="#8b5cf6"/> <circle cx="300" cy="310" r="34" fill="#f2c7a3"/> <circle cx="570" cy="310" r="34" fill="#f2c7a3"/> <circle cx="840" cy="310" r="34" fill="#f2c7a3"/> <path d="M264 358h72" stroke="#a16207" stroke-width="18" stroke-linecap="round"/> <path d="M534 358h72" stroke="#a16207" stroke-width="18" stroke-linecap="round"/> <path d="M804 358h72" stroke="#a16207" stroke-width="18" stroke-linecap="round"/> </svg>`,
  park: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800"> <defs> <linearGradient id="bg-park" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#dcfce7"/> <stop offset="1" stop-color="#bef264"/> </linearGradient> </defs> <rect width="1280" height="800" fill="url(#bg-park)"/> <rect y="540" width="1280" height="260" fill="#22c55e"/> <circle cx="300" cy="220" r="90" fill="#f59e0b" opacity="0.18"/> <circle cx="980" cy="220" r="90" fill="#f59e0b" opacity="0.18"/> <path d="M220 800c40-120 104-210 186-260s160-76 244-90 170-24 250-70 150-116 180-200v620z" fill="#86efac" opacity="0.7"/> <path d="M110 800c52-136 128-232 234-286s208-80 306-96 196-30 280-78 154-120 206-210" fill="none" stroke="#16a34a" stroke-width="38" stroke-linecap="round"/> <path d="M110 800c52-136 128-232 234-286s208-80 306-96 196-30 280-78 154-120 206-210" fill="none" stroke="#f8fafc" stroke-width="16" stroke-dasharray="34 28" stroke-linecap="round"/> <circle cx="320" cy="620" r="40" fill="#f2c7a3"/> <path d="M276 668c10-24 28-38 44-38s34 14 44 38v40h-88z" fill="#1f2937"/> <circle cx="920" cy="610" r="40" fill="#f2c7a3"/> <path d="M876 658c10-24 28-38 44-38s34 14 44 38v40h-88z" fill="#1f2937"/> </svg>`,
  restaurant: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800"> <defs> <linearGradient id="bg-restaurant" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#ffedd5"/> <stop offset="1" stop-color="#fb7185"/> </linearGradient> </defs> <rect width="1280" height="800" fill="url(#bg-restaurant)"/> <rect y="560" width="1280" height="240" fill="#fff7ed"/> <rect x="100" y="120" width="1080" height="320" rx="34" fill="#ffffff"/> <rect x="140" y="160" width="200" height="240" rx="22" fill="#fb7185" opacity="0.22"/> <rect x="420" y="160" width="440" height="240" rx="22" fill="#fed7aa"/> <rect x="920" y="160" width="220" height="240" rx="22" fill="#fb7185" opacity="0.22"/> <circle cx="300" cy="290" r="34" fill="#f2c7a3"/> <circle cx="640" cy="290" r="34" fill="#f2c7a3"/> <circle cx="980" cy="290" r="34" fill="#f2c7a3"/> <path d="M264 348h72" stroke="#c2410c" stroke-width="18" stroke-linecap="round"/> <path d="M604 348h72" stroke="#c2410c" stroke-width="18" stroke-linecap="round"/> <path d="M944 348h72" stroke="#c2410c" stroke-width="18" stroke-linecap="round"/> <rect x="180" y="500" width="920" height="94" rx="24" fill="#fff7ed"/> <path d="M240 530c34-20 64-28 100-28s66 8 100 28" fill="none" stroke="#fb7185" stroke-width="14" stroke-linecap="round"/> <path d="M530 530c34-20 64-28 100-28s66 8 100 28" fill="none" stroke="#f59e0b" stroke-width="14" stroke-linecap="round"/> <path d="M820 530c34-20 64-28 100-28s66 8 100 28" fill="none" stroke="#22c55e" stroke-width="14" stroke-linecap="round"/> </svg>`,
  walking_path: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800"> <defs> <linearGradient id="bg-path" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#dcfce7"/> <stop offset="1" stop-color="#86efac"/> </linearGradient> </defs> <rect width="1280" height="800" fill="url(#bg-path)"/> <rect y="520" width="1280" height="280" fill="#16a34a"/> <path d="M180 800c74-78 158-140 250-186s184-74 276-84 180-38 262-92 152-128 212-222" fill="none" stroke="#d97706" stroke-width="56" stroke-linecap="round"/> <path d="M180 800c74-78 158-140 250-186s184-74 276-84 180-38 262-92 152-128 212-222" fill="none" stroke="#fffbeb" stroke-width="24" stroke-dasharray="40 30" stroke-linecap="round"/> <circle cx="220" cy="200" r="88" fill="#f59e0b" opacity="0.18"/> <circle cx="1040" cy="180" r="88" fill="#f59e0b" opacity="0.18"/> <circle cx="380" cy="610" r="30" fill="#f2c7a3"/> <path d="M346 648c8-22 22-34 34-34s26 12 34 34v42h-68z" fill="#1f2937"/> <circle cx="920" cy="580" r="30" fill="#f2c7a3"/> <path d="M886 618c8-22 22-34 34-34s26 12 34 34v42h-68z" fill="#1f2937"/> </svg>`,
};

const PORTRAIT_SVGS = {
// Character portraits (512x512 viewBox)

  studious: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"> <defs> <linearGradient id="bg-studious" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#2563eb"/> <stop offset="1" stop-color="#0ea5e9"/> </linearGradient> </defs> <rect width="512" height="512" rx="96" fill="url(#bg-studious)"/> <circle cx="156" cy="136" r="42" fill="#ffffff" opacity="0.12"/> <circle cx="356" cy="380" r="52" fill="#ffffff" opacity="0.12"/> <circle cx="256" cy="194" r="88" fill="#f2c7a3"/> <path d="M166 180c10-58 42-90 90-90s80 32 90 90v62H166z" fill="#1f2937"/> <path d="M188 164c8-18 24-34 68-34s60 16 68 34" fill="none" stroke="#cbd5e1" stroke-width="14" stroke-linecap="round"/> <rect x="186" y="182" width="144" height="98" rx="22" fill="#ffffff" opacity="0.94"/> <circle cx="228" cy="226" r="18" fill="none" stroke="#1f2937" stroke-width="8"/> <circle cx="284" cy="226" r="18" fill="none" stroke="#1f2937" stroke-width="8"/> <path d="M246 226h20" stroke="#1f2937" stroke-width="8" stroke-linecap="round"/> <path d="M304 226h28" stroke="#1f2937" stroke-width="8" stroke-linecap="round"/> <circle cx="224" cy="208" r="6" fill="#1f2937"/> <circle cx="280" cy="208" r="6" fill="#1f2937"/> <path d="M224 252c14 12 50 12 64 0" fill="none" stroke="#1f2937" stroke-width="8" stroke-linecap="round"/> <path d="M214 294c-24 8-42 28-52 58l-24 104h244l-24-104c-10-30-28-50-52-58-16 10-32 16-36 16s-20-6-36-16z" fill="#f8fafc"/> <path d="M188 354h136" stroke="#2563eb" stroke-width="14" stroke-linecap="round"/> <path d="M188 388h112" stroke="#2563eb" stroke-width="14" stroke-linecap="round" opacity="0.75"/> <path d="M188 422h92" stroke="#2563eb" stroke-width="14" stroke-linecap="round" opacity="0.55"/> </svg>`,
  athletic: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"> <defs> <linearGradient id="bg-athletic" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#0f766e"/> <stop offset="1" stop-color="#14b8a6"/> </linearGradient> </defs> <rect width="512" height="512" rx="96" fill="url(#bg-athletic)"/> <circle cx="160" cy="372" r="58" fill="#ffffff" opacity="0.12"/> <circle cx="360" cy="140" r="42" fill="#ffffff" opacity="0.14"/> <circle cx="256" cy="196" r="86" fill="#f2c7a3"/> <path d="M174 204c5-58 36-90 82-90s77 32 82 90v44H174z" fill="#1f2937"/> <path d="M180 176c14-24 34-38 76-38s62 14 76 38" fill="none" stroke="#22d3ee" stroke-width="16" stroke-linecap="round"/> <path d="M148 206l24-42 20 34 16-34 22 46 18-26 18 22" fill="none" stroke="#22d3ee" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/> <circle cx="226" cy="206" r="10" fill="#1f2937"/> <circle cx="286" cy="206" r="10" fill="#1f2937"/> <path d="M224 238c16 12 48 12 64 0" fill="none" stroke="#1f2937" stroke-width="10" stroke-linecap="round"/> <path d="M214 290c-24 8-44 28-56 58l-24 104h224l-24-104c-12-30-32-50-56-58-16 10-32 16-36 16s-20-6-36-16z" fill="#f8fafc"/> <path d="M182 352h148" stroke="#0f766e" stroke-width="14" stroke-linecap="round"/> <path d="M182 382h148" stroke="#0f766e" stroke-width="14" stroke-linecap="round" opacity="0.75"/> <path d="M182 412h148" stroke="#0f766e" stroke-width="14" stroke-linecap="round" opacity="0.5"/> <circle cx="384" cy="340" r="28" fill="#fff" opacity="0.14"/> <path d="M384 324l8 18 18 8-18 8-8 18-8-18-18-8 18-8z" fill="#fff" opacity="0.8"/> </svg>`,
  artistic: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"> <defs> <linearGradient id="bg-artistic" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#7c3aed"/> <stop offset="1" stop-color="#ec4899"/> </linearGradient> </defs> <rect width="512" height="512" rx="96" fill="url(#bg-artistic)"/> <circle cx="154" cy="150" r="34" fill="#fde68a" opacity="0.18"/> <circle cx="388" cy="364" r="52" fill="#ffffff" opacity="0.12"/> <circle cx="256" cy="198" r="86" fill="#f9c6a5"/> <path d="M170 182c8-52 42-82 86-82s78 30 86 82v70H170z" fill="#1f2937"/> <path d="M184 186c8-34 34-54 72-54s64 20 72 54" fill="none" stroke="#f472b6" stroke-width="18" stroke-linecap="round"/> <circle cx="226" cy="204" r="10" fill="#1f2937"/> <circle cx="286" cy="204" r="10" fill="#1f2937"/> <path d="M224 236c14 14 50 14 64 0" fill="none" stroke="#1f2937" stroke-width="10" stroke-linecap="round"/> <path d="M220 292c-26 12-44 42-44 76v54h160v-54c0-34-18-64-44-76-16 10-32 16-36 16s-20-6-36-16z" fill="#ffffff"/> <path d="M176 366c34-24 70-36 80-36s46 12 80 36" fill="none" stroke="#f472b6" stroke-width="16" stroke-linecap="round"/> <path d="M192 392l18-34 18 20 18-42 18 28 18-14 18 42" fill="none" stroke="#fde68a" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/> <circle cx="386" cy="144" r="18" fill="#fde68a"/> <circle cx="412" cy="170" r="10" fill="#fde68a"/> <circle cx="360" cy="170" r="10" fill="#fde68a"/> </svg>`,
  wildcard: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"> <defs> <linearGradient id="bg-wildcard" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#1f2937"/> <stop offset="1" stop-color="#8b5cf6"/> </linearGradient> </defs> <rect width="512" height="512" rx="96" fill="url(#bg-wildcard)"/> <circle cx="360" cy="136" r="50" fill="#ffffff" opacity="0.12"/> <circle cx="256" cy="194" r="88" fill="#f2c7a3"/> <path d="M160 182c14-52 60-86 96-86s82 34 96 86v72H160z" fill="#0f172a"/> <path d="M176 158c16-18 40-28 80-28s64 10 80 28" fill="none" stroke="#a855f7" stroke-width="14" stroke-linecap="round"/> <circle cx="228" cy="206" r="10" fill="#0f172a"/> <circle cx="284" cy="206" r="10" fill="#0f172a"/> <path d="M222 240c16-14 52-14 68 0" fill="none" stroke="#0f172a" stroke-width="10" stroke-linecap="round"/> <path d="M220 290c-26 10-44 34-54 66l-20 94h220l-20-94c-10-32-28-56-54-66-16 10-32 16-36 16s-20-6-36-16z" fill="#f8fafc"/> <path d="M338 318l18 18-18 18-18-18z" fill="#facc15"/> <path d="M322 360l16 16-16 16-16-16z" fill="#22c55e"/> <path d="M362 360l16 16-16 16-16-16z" fill="#ef4444"/> <path d="M342 390l16 16-16 16-16-16z" fill="#38bdf8"/> </svg>`,
  townie: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"> <defs> <linearGradient id="bg-townie" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#b45309"/> <stop offset="1" stop-color="#f59e0b"/> </linearGradient> </defs> <rect width="512" height="512" rx="96" fill="url(#bg-townie)"/> <circle cx="372" cy="132" r="42" fill="#ffffff" opacity="0.12"/> <circle cx="184" cy="196" r="84" fill="#f2c7a3"/> <path d="M128 188c12-58 54-92 106-92s94 34 106 92v56H128z" fill="#3f2d20"/> <path d="M150 168c18-18 48-30 106-30s88 12 106 30" fill="none" stroke="#fdba74" stroke-width="14" stroke-linecap="round"/> <circle cx="154" cy="208" r="8" fill="#3f2d20"/> <circle cx="214" cy="208" r="8" fill="#3f2d20"/> <path d="M152 242c16 10 52 10 68 0" fill="none" stroke="#3f2d20" stroke-width="8" stroke-linecap="round"/> <path d="M210 292c-24 8-42 28-52 58l-24 104h244l-24-104c-10-30-28-50-52-58-16 10-32 16-36 16s-20-6-36-16z" fill="#f8fafc"/> <path d="M172 344h72" stroke="#b45309" stroke-width="14" stroke-linecap="round"/> <path d="M310 318l22-20 22 20v42h-44z" fill="#7c2d12"/> <path d="M316 328h32v26h-32z" fill="#fff" opacity="0.9"/> </svg>`,
  roommate: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"> <defs> <linearGradient id="bg-roommate" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#0f766e"/> <stop offset="1" stop-color="#8b5cf6"/> </linearGradient> </defs> <rect width="512" height="512" rx="96" fill="url(#bg-roommate)"/> <circle cx="364" cy="140" r="44" fill="#ffffff" opacity="0.14"/> <circle cx="188" cy="188" r="76" fill="#f2c7a3"/> <circle cx="324" cy="212" r="76" fill="#f2c7a3"/> <path d="M120 182c10-44 46-70 68-70s58 26 68 70v34H120z" fill="#1f2937"/> <path d="M256 206c10-44 46-70 68-70s58 26 68 70v34H256z" fill="#1f2937"/> <circle cx="164" cy="196" r="8" fill="#1f2937"/> <circle cx="212" cy="196" r="8" fill="#1f2937"/> <circle cx="300" cy="220" r="8" fill="#1f2937"/> <circle cx="348" cy="220" r="8" fill="#1f2937"/> <path d="M160 228c12 10 36 10 48 0" fill="none" stroke="#1f2937" stroke-width="8" stroke-linecap="round"/> <path d="M296 252c12 10 36 10 48 0" fill="none" stroke="#1f2937" stroke-width="8" stroke-linecap="round"/> <path d="M132 300c-20 8-34 24-40 48l-14 76h160l-14-76c-6-24-20-40-40-48-12 8-24 12-32 12s-20-4-32-12z" fill="#f8fafc"/> <path d="M268 324c-20 8-34 24-40 48l-14 76h160l-14-76c-6-24-20-40-40-48-12 8-24 12-32 12s-20-4-32-12z" fill="#f8fafc"/> <circle cx="176" cy="344" r="18" fill="#0f766e"/> <circle cx="336" cy="368" r="18" fill="#8b5cf6"/> </svg>`,
  ra: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"> <defs> <linearGradient id="bg-ra" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#1d4ed8"/> <stop offset="1" stop-color="#0ea5e9"/> </linearGradient> </defs> <rect width="512" height="512" rx="96" fill="url(#bg-ra)"/> <circle cx="160" cy="368" r="56" fill="#ffffff" opacity="0.12"/> <circle cx="256" cy="198" r="88" fill="#f2c7a3"/> <path d="M162 188c12-56 46-86 94-86s82 30 94 86v60H162z" fill="#1f2937"/> <path d="M184 166c10-14 34-28 72-28s62 14 72 28" fill="none" stroke="#38bdf8" stroke-width="14" stroke-linecap="round"/> <rect x="184" y="180" width="144" height="120" rx="28" fill="#ffffff" opacity="0.94"/> <path d="M206 210h100" stroke="#1d4ed8" stroke-width="14" stroke-linecap="round"/> <path d="M206 240h100" stroke="#1d4ed8" stroke-width="14" stroke-linecap="round" opacity="0.75"/> <path d="M206 270h72" stroke="#1d4ed8" stroke-width="14" stroke-linecap="round" opacity="0.55"/> <circle cx="226" cy="204" r="10" fill="#1f2937"/> <circle cx="286" cy="204" r="10" fill="#1f2937"/> <path d="M224 236c14 12 50 12 64 0" fill="none" stroke="#1f2937" stroke-width="10" stroke-linecap="round"/> <path d="M208 318c-24 8-42 28-52 58l-24 104h244l-24-104c-10-30-28-50-52-58-16 10-32 16-36 16s-20-6-36-16z" fill="#f8fafc"/> <path d="M348 344h38v40h-38z" fill="#fbbf24"/> <path d="M354 350h26v28h-26z" fill="#ffffff"/> </svg>`,
  professor: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"> <defs> <linearGradient id="bg-professor" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#334155"/> <stop offset="1" stop-color="#64748b"/> </linearGradient> </defs> <rect width="512" height="512" rx="96" fill="url(#bg-professor)"/> <circle cx="156" cy="138" r="40" fill="#ffffff" opacity="0.12"/> <circle cx="356" cy="362" r="52" fill="#ffffff" opacity="0.12"/> <circle cx="256" cy="194" r="88" fill="#f2c7a3"/> <path d="M162 182c8-56 40-88 94-88s86 32 94 88v62H162z" fill="#2f2a4a"/> <path d="M172 182c12-26 38-44 84-44s72 18 84 44" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/> <rect x="192" y="176" width="128" height="92" rx="20" fill="#ffffff" opacity="0.92"/> <circle cx="232" cy="224" r="20" fill="none" stroke="#334155" stroke-width="8"/> <circle cx="280" cy="224" r="20" fill="none" stroke="#334155" stroke-width="8"/> <path d="M252 224h8" stroke="#334155" stroke-width="8" stroke-linecap="round"/> <path d="M300 224h30" stroke="#334155" stroke-width="8" stroke-linecap="round"/> <circle cx="228" cy="204" r="6" fill="#334155"/> <circle cx="276" cy="204" r="6" fill="#334155"/> <path d="M224 242c14 10 50 10 64 0" fill="none" stroke="#334155" stroke-width="8" stroke-linecap="round"/> <path d="M210 292c-24 8-42 28-52 58l-24 104h244l-24-104c-10-30-28-50-52-58-16 10-32 16-36 16s-20-6-36-16z" fill="#f8fafc"/> <path d="M256 302v118" stroke="#94a3b8" stroke-width="16" stroke-linecap="round"/> <path d="M238 320h36" stroke="#94a3b8" stroke-width="16" stroke-linecap="round"/> </svg>`,
  bully: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"> <defs> <linearGradient id="bg-bully" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#7f1d1d"/> <stop offset="1" stop-color="#ef4444"/> </linearGradient> </defs> <rect width="512" height="512" rx="96" fill="url(#bg-bully)"/> <circle cx="360" cy="374" r="60" fill="#ffffff" opacity="0.12"/> <circle cx="256" cy="198" r="88" fill="#f2c7a3"/> <path d="M164 188c14-52 58-84 92-84s78 22 92 84v70H164z" fill="#111827"/> <path d="M156 154l32 10-20 20z" fill="#111827"/> <path d="M356 154l-32 10 20 20z" fill="#111827"/> <path d="M182 194c14-12 30-16 50-12" fill="none" stroke="#111827" stroke-width="14" stroke-linecap="round"/> <path d="M330 194c-14-12-30-16-50-12" fill="none" stroke="#111827" stroke-width="14" stroke-linecap="round"/> <circle cx="228" cy="208" r="10" fill="#111827"/> <circle cx="284" cy="208" r="10" fill="#111827"/> <path d="M226 242c18-10 42-10 60 0" fill="none" stroke="#111827" stroke-width="10" stroke-linecap="round"/> <path d="M212 292c-28 12-48 36-56 70l-20 82h240l-20-82c-8-34-28-58-56-70-16 10-32 16-36 16s-20-6-36-16z" fill="#f8fafc"/> <path d="M196 364h120" stroke="#7f1d1d" stroke-width="16" stroke-linecap="round"/> <path d="M256 330l18 34 38 6-28 28 7 38-35-18-35 18 7-38-28-28 38-6z" fill="#ef4444"/> </svg>`,
};

const ICON_SVGS = {
// Phone app icons (256x256 viewBox)

  compass: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"> <defs> <linearGradient id="compass-bg" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#0f172a"/> <stop offset="1" stop-color="#0ea5a5"/> </linearGradient> </defs> <rect width="256" height="256" rx="54" fill="url(#compass-bg)"/> <circle cx="128" cy="128" r="78" fill="#fff" opacity="0.1"/> <circle cx="128" cy="128" r="60" fill="none" stroke="#fff" stroke-width="10"/> <circle cx="128" cy="128" r="10" fill="#fff"/> <path d="M128 66l16 46-16 8-16-8z" fill="#fff"/> <path d="M128 190l-16-46 16-8 16 8z" fill="#0ea5a5" opacity="0.9"/> <path d="M66 128l46-16 8 16-8 16z" fill="#fff" opacity="0.45"/> <path d="M190 128l-46 16-8-16 8-16z" fill="#fff" opacity="0.45"/> <path d="M128 48v14" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity="0.75"/> <path d="M128 194v14" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity="0.75"/> <path d="M48 128h14" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity="0.75"/> <path d="M194 128h14" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity="0.75"/> </svg>`,
  pulse: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"> <defs> <linearGradient id="pulse-bg" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#0f766e"/> <stop offset="1" stop-color="#1d4ed8"/> </linearGradient> </defs> <rect width="256" height="256" rx="54" fill="url(#pulse-bg)"/> <path d="M50 154c0-8 7-15 15-15h65l15-22 19 44 12-20h30c8 0 15 7 15 15s-7 15-15 15H161l-12 20-19-44-15 22H65c-8 0-15-7-15-15z" fill="#fff" opacity="0.96"/> <path d="M58 148h40" stroke="#0f766e" stroke-width="10" stroke-linecap="round" opacity="0.12"/> <path d="M98 132h33" stroke="#0f766e" stroke-width="10" stroke-linecap="round" opacity="0.12"/> <path d="M124 100c0-11 9-20 20-20h22c11 0 20 9 20 20v22c0 11-9 20-20 20h-22c-11 0-20-9-20-20z" fill="#fff" opacity="0.92"/> <circle cx="147" cy="111" r="8" fill="#1d4ed8" opacity="0.75"/> <circle cx="171" cy="111" r="8" fill="#0f766e" opacity="0.75"/> <circle cx="159" cy="123" r="8" fill="#1d4ed8" opacity="0.55"/> </svg>`,
  roster: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256"><defs><linearGradient id="roster-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1d4ed8"/><stop offset="1" stop-color="#22c55e"/></linearGradient></defs><rect width="256" height="256" rx="54" fill="url(#roster-bg)"/><rect x="46" y="48" width="164" height="160" rx="24" fill="#fff" opacity="0.95"/><circle cx="90" cy="92" r="18" fill="#1d4ed8" opacity="0.9"/><circle cx="90" cy="146" r="18" fill="#22c55e" opacity="0.9"/><circle cx="90" cy="188" r="18" fill="#0f172a" opacity="0.28"/><rect x="120" y="78" width="56" height="10" rx="5" fill="#0f172a" opacity="0.24"/><rect x="120" y="96" width="72" height="10" rx="5" fill="#0f172a" opacity="0.16"/><rect x="120" y="132" width="56" height="10" rx="5" fill="#0f172a" opacity="0.24"/><rect x="120" y="150" width="72" height="10" rx="5" fill="#0f172a" opacity="0.16"/><rect x="120" y="174" width="46" height="10" rx="5" fill="#0f172a" opacity="0.18"/><path d="M82 92c0 8 7 15 15 15s15-7 15-15-7-15-15-15-15 7-15 15z" fill="#fff"/><path d="M73 154c4-11 13-17 17-17s13 6 17 17" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M82 188c0 8 7 15 15 15s15-7 15-15-7-15-15-15-15 7-15 15z" fill="#fff" opacity="0.9"/></svg>`,
  self: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"> <defs> <linearGradient id="self-bg" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#581c87"/> <stop offset="1" stop-color="#0f766e"/> </linearGradient> </defs> <rect width="256" height="256" rx="54" fill="url(#self-bg)"/> <rect x="42" y="52" width="172" height="152" rx="26" fill="#fff" opacity="0.94"/> <circle cx="128" cy="108" r="30" fill="#581c87" opacity="0.92"/> <path d="M86 168c6-23 22-34 42-34s36 11 42 34" fill="#0f766e" opacity="0.88"/> <rect x="62" y="68" width="54" height="10" rx="5" fill="#0f172a" opacity="0.18"/> <rect x="142" y="68" width="46" height="10" rx="5" fill="#0f172a" opacity="0.18"/> <rect x="68" y="182" width="120" height="10" rx="5" fill="#0f172a" opacity="0.14"/> <circle cx="88" cy="184" r="8" fill="#0f766e" opacity="0.9"/> <circle cx="128" cy="184" r="8" fill="#581c87" opacity="0.9"/> <circle cx="168" cy="184" r="8" fill="#0f172a" opacity="0.22"/> </svg>`,
  buzz: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"> <defs> <linearGradient id="buzz-bg" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#2563eb"/> <stop offset="1" stop-color="#06b6d4"/> </linearGradient> </defs> <rect width="256" height="256" rx="54" fill="url(#buzz-bg)"/> <rect x="44" y="52" width="168" height="56" rx="18" fill="#fff" opacity="0.95"/> <rect x="44" y="112" width="168" height="56" rx="18" fill="#fff" opacity="0.86"/> <rect x="44" y="172" width="168" height="36" rx="18" fill="#fff" opacity="0.78"/> <rect x="58" y="66" width="28" height="28" rx="10" fill="#06b6d4" opacity="0.9"/> <rect x="92" y="65" width="80" height="10" rx="5" fill="#0f172a" opacity="0.25"/> <rect x="92" y="82" width="58" height="8" rx="4" fill="#0f172a" opacity="0.18"/> <rect x="58" y="127" width="96" height="26" rx="10" fill="#2563eb" opacity="0.14"/> <circle cx="174" cy="136" r="12" fill="#06b6d4" opacity="0.85"/> <circle cx="174" cy="196" r="8" fill="#2563eb" opacity="0.75"/> <path d="M74 185h66" stroke="#0f172a" stroke-opacity="0.16" stroke-width="10" stroke-linecap="round"/> <path d="M74 195h88" stroke="#0f172a" stroke-opacity="0.12" stroke-width="10" stroke-linecap="round"/> </svg>`,
  anthrop: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"> <defs> <linearGradient id="anthrop-bg" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#0f766e"/> <stop offset="1" stop-color="#65a30d"/> </linearGradient> </defs> <rect width="256" height="256" rx="54" fill="url(#anthrop-bg)"/> <rect x="58" y="50" width="140" height="156" rx="24" fill="#fff" opacity="0.96"/> <circle cx="128" cy="114" r="34" fill="none" stroke="#0f766e" stroke-width="10" opacity="0.9"/> <path d="M128 92l8 14-8 8-8-8z" fill="#65a30d" opacity="0.9"/> <path d="M92 160l10 10 18-18" fill="none" stroke="#0f766e" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/> <path d="M92 184l10 10 18-18" fill="none" stroke="#0f766e" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/> <rect x="88" y="62" width="26" height="8" rx="4" fill="#0f172a" opacity="0.15"/> <rect x="126" y="62" width="34" height="8" rx="4" fill="#0f172a" opacity="0.15"/> <rect x="88" y="200" width="80" height="8" rx="4" fill="#0f172a" opacity="0.12"/> </svg>`,
  spark: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"> <defs> <linearGradient id="spark-bg" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#ff4d6d"/> <stop offset="1" stop-color="#ff9f1c"/> </linearGradient> </defs> <rect width="256" height="256" rx="54" fill="url(#spark-bg)"/> <circle cx="60" cy="64" r="22" fill="#ffffff" opacity="0.14"/> <circle cx="196" cy="194" r="34" fill="#ffffff" opacity="0.12"/> <path d="M77 101c0-11 9-20 20-20h42c11 0 20 9 20 20v19c0 11-9 20-20 20h-9l-12 12v-12H97c-11 0-20-9-20-20z" fill="#fff" opacity="0.95"/> <path d="M87 111c0-5 4-9 9-9h35c5 0 9 4 9 9v12c0 5-4 9-9 9h-7v10l-10-10H96c-5 0-9-4-9-9z" fill="#ff8fa3" opacity="0.65"/> <path d="M161 84c2 5 4 7 9 9-5 2-7 4-9 9-2-5-4-7-9-9 5-2 7-4 9-9z" fill="#fff"/> <path d="M176 140c2 7 6 11 13 13-7 2-11 6-13 13-2-7-6-11-13-13 7-2 11-6 13-13z" fill="#fff" opacity="0.9"/> <path d="M122 147c12 0 22-10 22-22 0-8-5-15-12-19-4-2-8-3-10-3s-6 1-10 3c-7 4-12 11-12 19 0 12 10 22 22 22z" fill="#fff"/> <path d="M122 108c2 3 4 5 4 9 0 4-2 8-5 11-4-2-7-5-9-9 1-6 5-9 10-11z" fill="#ff8fa3"/> </svg>`,
  margin: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"> <defs> <linearGradient id="margin-bg" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#7c2d12"/> <stop offset="1" stop-color="#f59e0b"/> </linearGradient> </defs> <rect width="256" height="256" rx="54" fill="url(#margin-bg)"/> <path d="M70 48h90l26 26v134c0 10-8 18-18 18H70c-10 0-18-8-18-18V66c0-10 8-18 18-18z" fill="#fff" opacity="0.96"/> <path d="M160 48v26h26z" fill="#f59e0b" opacity="0.32"/> <rect x="86" y="96" width="86" height="8" rx="4" fill="#7c2d12" opacity="0.22"/> <rect x="86" y="118" width="74" height="8" rx="4" fill="#7c2d12" opacity="0.18"/> <rect x="86" y="140" width="58" height="8" rx="4" fill="#7c2d12" opacity="0.18"/> <path d="M76 84h20" stroke="#f59e0b" stroke-width="8" stroke-linecap="round"/> <path d="M76 104h20" stroke="#f59e0b" stroke-width="8" stroke-linecap="round" opacity="0.72"/> <path d="M76 124h20" stroke="#f59e0b" stroke-width="8" stroke-linecap="round" opacity="0.48"/> <path d="M154 172l18-18 8 8-18 18-13 3z" fill="#7c2d12" opacity="0.9"/> <path d="M169 148l10 10" stroke="#fff" stroke-width="6" stroke-linecap="round"/> </svg>`,
  lens: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"> <defs> <linearGradient id="lens-bg" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#312e81"/> <stop offset="1" stop-color="#06b6d4"/> </linearGradient> </defs> <rect width="256" height="256" rx="54" fill="url(#lens-bg)"/> <rect x="46" y="64" width="164" height="128" rx="26" fill="#fff" opacity="0.12"/> <circle cx="128" cy="128" r="60" fill="none" stroke="#fff" stroke-width="16"/> <circle cx="128" cy="128" r="34" fill="#fff" opacity="0.95"/> <path d="M128 70l16 22-16 10-16-10z" fill="#06b6d4" opacity="0.8"/> <path d="M180 128l-22 16-10-16 10-16z" fill="#06b6d4" opacity="0.8"/> <path d="M128 186l-16-22 16-10 16 10z" fill="#06b6d4" opacity="0.8"/> <path d="M76 128l22-16 10 16-10 16z" fill="#06b6d4" opacity="0.8"/> <circle cx="128" cy="128" r="12" fill="#312e81" opacity="0.82"/> </svg>`,
  wake: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"> <defs> <linearGradient id="wake-bg" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#0f172a"/> <stop offset="1" stop-color="#3b82f6"/> </linearGradient> </defs> <rect width="256" height="256" rx="54" fill="url(#wake-bg)"/> <circle cx="128" cy="136" r="60" fill="#fff" opacity="0.95"/> <path d="M94 78l-18-14 6-8 18 14z" fill="#fff" opacity="0.9"/> <path d="M162 78l18-14 6 8-18 14z" fill="#fff" opacity="0.9"/> <path d="M128 106v34l22 14" fill="none" stroke="#0f172a" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/> <circle cx="128" cy="136" r="8" fill="#0f172a"/> <path d="M60 214c10-12 22-18 34-18" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity="0.55"/> <path d="M162 196c12 0 24 6 34 18" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity="0.55"/> <path d="M128 58v18" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity="0.7"/> <path d="M128 196v18" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity="0.7"/> </svg>`,
  beacon: `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"> <defs> <linearGradient id="beacon-bg" x1="0" y1="0" x2="1" y2="1"> <stop offset="0" stop-color="#0f172a"/> <stop offset="1" stop-color="#14b8a6"/> </linearGradient> </defs> <rect width="256" height="256" rx="54" fill="url(#beacon-bg)"/> <rect x="46" y="54" width="164" height="136" rx="22" fill="#fff" opacity="0.95"/> <rect x="46" y="54" width="164" height="24" rx="22" fill="#e2e8f0"/> <circle cx="66" cy="66" r="5" fill="#94a3b8"/> <circle cx="82" cy="66" r="5" fill="#94a3b8"/> <circle cx="98" cy="66" r="5" fill="#94a3b8"/> <circle cx="128" cy="132" r="42" fill="#14b8a6" opacity="0.18"/> <circle cx="128" cy="132" r="28" fill="none" stroke="#0f172a" stroke-width="10" opacity="0.9"/> <path d="M128 104l8 20-8 8-8-8z" fill="#0f172a" opacity="0.9"/> <path d="M164 96l26-26" stroke="#14b8a6" stroke-width="10" stroke-linecap="round"/> <path d="M176 84l18-18" stroke="#14b8a6" stroke-width="8" stroke-linecap="round" opacity="0.55"/> <rect x="70" y="186" width="116" height="10" rx="5" fill="#0f172a" opacity="0.14"/> </svg>`,
};

// ============================================================================
// PALETTE
// ============================================================================

const PAL = {
  bg: "#0f0d0a",          // page bg behind the game frame
  ink: "#f0ebdc",         // primary text on dialogue
  inkDim: "#a89878",      // secondary text
  inkSoft: "#7a6e58",     // tertiary
  dialogueBg: "rgba(20,18,16,0.94)",
  dialogueBorder: "rgba(212,196,168,0.18)",
  iconBg: "rgba(20,18,16,0.55)",
  iconBgActive: "rgba(20,18,16,0.85)",
  iconBorder: "rgba(212,196,168,0.30)",
  iconBorderActive: "rgba(212,196,168,0.65)",
  accent: "#c8a165",      // warm tan accent
  accentDim: "#8b6f3d",
  phoneBezel: "#0a0a0a",
  phoneBezelEdge: "#2a2620",
  phoneScreen: "#f0ebdc",
  phoneScreenDark: "#1a1814",
  banner: "rgba(40,34,28,0.96)",
  bannerBorder: "rgba(200,161,101,0.4)",
};

// ============================================================================
// STATIC GAME DATA
// ============================================================================

const LOCATIONS = {
  // Campus
  dorm_room:        { label: "Dorm Room",        cat: "campus" },
  dorm_hallway:     { label: "Dorm Hallway",     cat: "campus" },
  lecture_hall:     { label: "Lecture Hall",     cat: "campus" },
  library_main:     { label: "Library",          cat: "campus" },
  library_stacks:   { label: "Upper Stacks",     cat: "campus" },
  dining_hall:      { label: "Dining Hall",      cat: "campus" },
  quad:             { label: "The Quad",         cat: "campus" },
  quad_night:       { label: "Quad (Night)",     cat: "campus" },
  gym:              { label: "Gym",              cat: "campus" },
  student_union:    { label: "Student Union",    cat: "campus" },
  // Town
  coffee_shop:      { label: "Coffee Shop",      cat: "town" },
  bar:              { label: "The Bar",          cat: "town" },
  bookstore:        { label: "Bookstore",        cat: "town" },
  restaurant:       { label: "Restaurant",       cat: "town" },
  townie_apartment: { label: "Apartment",        cat: "town" },
  // Outdoor
  running_trail:    { label: "Running Trail",    cat: "outdoor" },
  park:             { label: "Park",             cat: "outdoor" },
  walking_path:     { label: "Walking Path",     cat: "outdoor" },
};

const LOCATION_DESCRIPTIONS = {
  dorm_room: "A small first-year dorm room, half-unpacked and always a little too warm.",
  dorm_hallway: "A fluorescent dorm corridor with laundry smell, scuffed doors, and passing voices.",
  lecture_hall: "Tiered seats, a projector glow, and the formal hush of a class about to begin.",
  library_main: "High ceilings, soft light, long tables, and the low murmur of people trying to be productive.",
  library_stacks: "Narrow upper-floor stacks where footsteps go quiet and chance encounters feel private.",
  dining_hall: "Long tables, tray noise, rotating food stations, and little pockets of social weather.",
  quad: "The central campus green, crossed by students between buildings and small clusters killing time.",
  quad_night: "The same green under lamplight, quieter and more exposed, with a different crowd lingering.",
  gym: "A bright fitness center with rubber floors, machine rhythm, and the smell of work being done.",
  student_union: "Campus's social hub: club flyers, coffee, lounge chairs, and people waiting for plans to form.",
  coffee_shop: "A warm independent shop off campus, all old wood, espresso hiss, and regulars with routines.",
  bar: "A dim town bar that gets loud on weekends and tests how much campus life spills past campus.",
  bookstore: "A small town bookstore with course texts up front and stranger, better shelves in back.",
  restaurant: "A sit-down town restaurant that feels expensive compared to dining hall math.",
  townie_apartment: "Off-campus housing with hand-me-down furniture and the feeling of other people's lives.",
  running_trail: "A creekside mixed-use path, good for exercise, avoidance, and thinking too much.",
  park: "A public green space where campus thins into town and nobody quite belongs to either.",
  walking_path: "A connector path between destinations, more transitional mood than place.",
};

const STARTER_NPCS = {
  studious: {
    id: "studious",
    name: "Mari",
    portraitKey: "studious",
    archetype: "Studious",
    role: "Coffee shop barista and campus-adjacent regular",
    defaultLocation: "coffee_shop",
    schema: {
      ageBand: "adult peer",
      publicFace: "Capable, dryly warm, observant from behind the counter.",
      voice: "Quick, understated, lightly teasing when comfortable; concise when busy.",
      wants: ["To be treated like a person, not a campus landmark", "To keep her work life from swallowing her private life"],
      whatLands: ["Specific curiosity", "Patience", "Remembering small details without making a show of it"],
      whatFallsFlat: ["Performative charm", "Assuming access because she is friendly at work", "Pushing when she is busy"],
      boundaries: ["Work is still work", "Private disclosures must be earned slowly"],
    },
    currentMood: "Focused on the counter rhythm; professionally warm, curious around new faces.",
    lastSeenDisposition: "Not yet met.",
  },
  roommate: {
    id: "roommate",
    name: "Marcus",
    portraitKey: "roommate",
    archetype: "Roommate",
    role: "Player's roommate and old high-school friend",
    defaultLocation: "dorm_room",
    schema: {
      ageBand: "adult peer",
      publicFace: "Easygoing, socially fluent, usually more prepared than he admits.",
      voice: "Casual and direct; jokes when things get tense, but notices more than he says.",
      wants: ["A good first semester", "To keep the room feeling livable", "To help without turning into a parent"],
      whatLands: ["Honesty", "Shared history", "Being included instead of managed"],
      whatFallsFlat: ["Needless secrecy", "Taking his steadiness for granted", "Making him clean up social fallout"],
      boundaries: ["He has his own campus life", "Friendship does not mean unlimited emotional labor"],
    },
    currentMood: "Loose, friendly, slightly ahead of the player on settling in.",
    lastSeenDisposition: "Familiar and friendly.",
  },
};

const APPS = [
  { id: "compass", label: "Compass", role: "Navigation",  layout: "landscape", impl: true  },
  { id: "pulse",   label: "Pulse",   role: "Messages",    layout: "portrait",  impl: false },
  { id: "roster",  label: "Roster",  role: "Contacts",    layout: "portrait",  impl: true  },
  { id: "self",    label: "Self",    role: "Stats",       layout: "portrait",  impl: true  },
  { id: "buzz",    label: "Buzz",    role: "Campus feed", layout: "landscape", impl: false },
  { id: "anthrop", label: "Anthrop", role: "Assistant",   layout: "landscape", impl: false },
  { id: "spark",   label: "Spark",   role: "Dating",      layout: "landscape", impl: false },
  { id: "margin",  label: "Margin",  role: "Notes",       layout: "portrait",  impl: false },
  { id: "lens",    label: "Lens",    role: "Camera",      layout: "landscape", impl: false },
  { id: "wake",    label: "Wake",    role: "Alarm",       layout: "portrait",  impl: false },
  { id: "beacon",  label: "Beacon",  role: "Browser",     layout: "landscape", impl: false },
];

const APP_BY_ID = Object.fromEntries(APPS.map(a => [a.id, a]));

// ============================================================================
// STATE
// ============================================================================

function makeFreshState() {
  return {
    version: 1,
    day: 1,
    timeSlot: 1, // 0=morning, 1=midday, 2=afternoon, 3=evening, 4=night
    location: "dorm_room",
    introSeen: false,
    metMari: false,
    player: {
      name: "You",
      stats:    { knowledge: 30, athletics: 25, charm: 35, sensitivity: 40, grit: 30 },
      resources:{ energy: 80, money: 50 },
    },
    npcsKnown: [], // list of portrait keys the player has met
    eventLog: [],
  };
}

const TIME_LABELS = ["Morning", "Midday", "Afternoon", "Evening", "Night"];
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const NARRATOR_EVENT_LIMIT = 10;

function advanceTime(state, n = 1) {
  let day = state.day;
  let slot = state.timeSlot + n;
  while (slot >= TIME_LABELS.length) { slot -= TIME_LABELS.length; day += 1; }
  return { ...state, day, timeSlot: slot };
}

function appendEvent(state, text, witnesses = []) {
  const event = { day: state.day, slot: state.timeSlot, text };
  if (witnesses.length) event.witnesses = witnesses;
  return { ...state, eventLog: [...state.eventLog, event] };
}

// Scene-context assembler helpers. These accept today's lightweight prototype
// state and the richer generated-world shape expected by the narrator loop.
function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null || value === "") return [];
  return [value];
}

function uniqueCompact(values) {
  return [...new Set(asArray(values).filter(Boolean))];
}

function getLocationKey(state) {
  return state?.location || state?.currentLocation || state?.current_location || "unknown_location";
}

function getNpcDirectory(state) {
  const directory = { ...STARTER_NPCS };
  const sources = [
    state?.world?.npcs,
    state?.world?.characters,
    state?.npcs,
    state?.npcDirectory,
    state?.characters,
  ];

  for (const source of sources) {
    if (Array.isArray(source)) {
      for (const npc of source) {
        if (!npc || typeof npc !== "object") continue;
        const id = npc.id || npc.key || npc.portraitKey || npc.name;
        if (!id) continue;
        directory[id] = {
          ...(directory[id] || {}),
          ...npc,
          id,
          schema: { ...(directory[id]?.schema || {}), ...(npc.schema || {}) },
        };
      }
    } else if (source && typeof source === "object") {
      for (const [fallbackId, npc] of Object.entries(source)) {
        if (!npc || typeof npc !== "object") continue;
        const id = npc.id || npc.key || fallbackId;
        directory[id] = {
          ...(directory[id] || {}),
          ...npc,
          id,
          schema: { ...(directory[id]?.schema || {}), ...(npc.schema || {}) },
        };
      }
    }
  }

  return directory;
}

function getExplicitPresentNpcs(state, directory) {
  const explicit =
    state?.presentNpcIds ||
    state?.npcsPresent ||
    state?.presentNpcs ||
    state?.scene?.presentNpcIds ||
    state?.scene?.npcsPresent ||
    state?.currentScene?.presentNpcIds ||
    state?.currentScene?.npcsPresent;

  if (!Array.isArray(explicit)) return null;
  return explicit.map(npc => {
    if (typeof npc === "string") return directory[npc] || { id: npc, name: npc, schema: {} };
    const id = npc?.id || npc?.key || npc?.portraitKey || npc?.name;
    if (!id) return null;
    return {
      ...(directory[id] || {}),
      ...npc,
      id,
      schema: { ...(directory[id]?.schema || {}), ...(npc.schema || {}) },
    };
  }).filter(Boolean);
}

function getPresentNpcs(state, directory) {
  const locationKey = getLocationKey(state);
  const explicitNpcs = getExplicitPresentNpcs(state, directory);

  if (explicitNpcs) return explicitNpcs;

  const locatedNpcs = Object.values(directory).filter(npc => (
    npc.currentLocation === locationKey || npc.location === locationKey
  ));
  if (locatedNpcs.length) return locatedNpcs;

  if (locationKey === "coffee_shop") return [directory.studious];
  if (locationKey === "dorm_room" && state?.introSeen) return [directory.roommate];
  return [];
}

function getRelationshipForNpc(state, npc) {
  const relationships =
    state?.player?.relationships ||
    state?.relationships ||
    state?.npcRelationships ||
    state?.relationshipByNpc ||
    {};
  const record = relationships[npc.id] || relationships[npc.portraitKey] || relationships[npc.name];

  if (record && typeof record === "object") {
    return {
      score: record.score ?? record.value ?? record.affinity ?? "unknown",
      status: record.status || record.summary || record.label || "recorded",
      traits: uniqueCompact(record.traits || record.flags || record.tags),
      lastSeenDisposition: record.lastSeenDisposition || record.last_seen_disposition || record.disposition,
    };
  }

  if (typeof record === "number" || typeof record === "string") {
    return {
      score: record,
      status: "recorded",
      traits: [],
      lastSeenDisposition: npc.lastSeenDisposition,
    };
  }

  return {
    score: 0,
    status: "no relationship record yet",
    traits: [],
    lastSeenDisposition: npc.lastSeenDisposition || "No prior disposition recorded.",
  };
}

function formatPlayerStats(state) {
  const stats = state?.player?.stats || state?.playerStats || state?.stats || {};
  const orderedStats = [
    ["charm", "Charm"],
    ["sensitivity", "Sensitivity"],
    ["knowledge", "Knowledge"],
    ["athletics", "Athletics"],
    ["grit", "Grit"],
  ];
  return orderedStats.map(([key, label]) => `${label}: ${stats[key] ?? "unknown"}`).join(", ");
}

function formatPlayerTraits(state) {
  const traits = uniqueCompact(state?.player?.traits || state?.playerTraits || state?.traits);
  return traits.length ? traits.join(", ") : "none recorded yet";
}

function getNpcMood(state, npc) {
  const moods = state?.npcMoods || state?.moodsByNpc || state?.moods || {};
  return moods[npc.id] || moods[npc.portraitKey] || moods[npc.name] || npc.currentMood || npc.mood || "Unspecified; use established schema and recent witnessed events.";
}

function stripNpcSchemaNoise(npc) {
  const omitted = new Set([
    "currentMood",
    "mood",
    "lastSeenDisposition",
    "currentLocation",
    "location",
    "defaultLocation",
    "portraitSvg",
    "portrait",
    "image",
    "imageUrl",
  ]);
  const schema = npc.schema && Object.keys(npc.schema).length ? npc.schema : npc;
  return Object.fromEntries(Object.entries(schema).filter(([key]) => !omitted.has(key)));
}

function normalizeWitnessIds(event) {
  return uniqueCompact(
    event?.witnesses ||
    event?.witnessedBy ||
    event?.witness_ids ||
    event?.witnessIds ||
    event?.npcWitnesses ||
    []
  ).map(witness => (
    typeof witness === "string" ? witness : (witness?.id || witness?.key || witness?.name)
  )).filter(Boolean);
}

function eventText(event) {
  if (!event) return "";
  return event.text || event.summary || event.event_summary || event.label || event.kind || "";
}

function eventMatchesPresentWitness(event, presentNpcs) {
  if (!presentNpcs.length) return false;

  const presentAliases = new Set(
    presentNpcs.flatMap(npc => [npc.id, npc.portraitKey, npc.name])
      .filter(Boolean)
      .map(value => String(value).toLowerCase())
  );
  const witnesses = normalizeWitnessIds(event).map(value => String(value).toLowerCase());

  if (witnesses.some(value => value === "all" || value === "present")) return true;
  if (witnesses.length) return witnesses.some(value => presentAliases.has(value));

  const lowerText = eventText(event).toLowerCase();
  return [...presentAliases].some(alias => alias && lowerText.includes(alias));
}

function formatEventForNarrator(event) {
  const day = event.day ?? event.semesterDay ?? event.dayNumber;
  const week = event.week ?? (typeof day === "number" ? Math.floor((day - 1) / 7) + 1 : undefined);
  const dayName = typeof day === "number" ? DAY_LABELS[(day - 1) % DAY_LABELS.length] : event.dayName;
  const rawSlot = event.slot ?? event.timeSlot;
  const slot = typeof rawSlot === "number" ? (TIME_LABELS[rawSlot] || `Slot ${rawSlot}`) : rawSlot;
  const when = [
    week ? `Week ${week}` : null,
    dayName || (day ? `Day ${day}` : null),
    slot,
  ].filter(Boolean).join(", ");
  const witnesses = normalizeWitnessIds(event);
  const witnessText = witnesses.length ? ` (witnesses: ${witnesses.join(", ")})` : "";
  return `- ${when ? `${when}: ` : ""}${eventText(event)}${witnessText}`;
}

function buildNarratorContext(state, action) {
  const day = state?.day || state?.semesterDay || 1;
  const week = state?.week || Math.floor((day - 1) / 7) + 1;
  const dayName = state?.dayName || DAY_LABELS[(day - 1) % DAY_LABELS.length];
  const rawTimeSlot = state?.timeSlot ?? state?.slot ?? 0;
  const timeSlot = typeof rawTimeSlot === "number" ? (TIME_LABELS[rawTimeSlot] || `Slot ${rawTimeSlot}`) : rawTimeSlot;
  const locationKey = getLocationKey(state);
  const location = LOCATIONS[locationKey] || { label: locationKey };
  const locationDescription = LOCATION_DESCRIPTIONS[locationKey] || "No static description recorded yet.";
  const npcDirectory = getNpcDirectory(state);
  const presentNpcs = getPresentNpcs(state, npcDirectory).filter(Boolean);
  const actionText = typeof action === "string"
    ? action.trim()
    : (action?.label || action?.text || action?.description || "");

  const relationships = presentNpcs.map(npc => {
    const relationship = getRelationshipForNpc(state, npc);
    return {
      npcId: npc.id,
      name: npc.name || npc.id,
      score: relationship.score,
      status: relationship.status,
      traits: relationship.traits,
      lastSeenDisposition: relationship.lastSeenDisposition || npc.lastSeenDisposition || "No prior disposition recorded.",
    };
  });

  const npcPayload = presentNpcs.map(npc => {
    const relationship = getRelationshipForNpc(state, npc);
    return {
      id: npc.id,
      name: npc.name || npc.id,
      archetype: npc.archetype,
      role: npc.role,
      portraitKey: npc.portraitKey,
      schema: stripNpcSchemaNoise(npc),
      currentMood: getNpcMood(state, npc),
      lastSeenDisposition: relationship.lastSeenDisposition || npc.lastSeenDisposition || "No prior disposition recorded.",
      relationshipToPlayer: {
        score: relationship.score,
        status: relationship.status,
        traits: relationship.traits,
      },
    };
  });

  const relevantEvents = asArray(state?.eventLog)
    .slice()
    .reverse()
    .filter(event => eventMatchesPresentWitness(event, presentNpcs))
    .slice(0, NARRATOR_EVENT_LIMIT)
    .reverse();

  const recentEventText = relevantEvents.length
    ? relevantEvents.map(formatEventForNarrator).join("\n")
    : (presentNpcs.length
      ? "- none recorded that were witnessed by the present NPCs"
      : "- none included; no NPCs are currently present");

  return [
    "# Scene",
    `Week ${week}, ${dayName} (semester day ${day}), ${timeSlot}`,
    `Location: ${location.label || locationKey} [${locationKey}] - ${locationDescription}`,
    `Player action: ${actionText || "[arrived at location]"}`,
    "",
    "# Player State",
    `Stats: ${formatPlayerStats(state)}`,
    `Traits: ${formatPlayerTraits(state)}`,
    `Relationships with present NPCs: ${relationships.length ? JSON.stringify(relationships, null, 2) : "none; no NPCs present"}`,
    "",
    "# NPCs Present",
    npcPayload.length ? JSON.stringify(npcPayload, null, 2) : "[]",
    "",
    `# Recent Relevant Event Log (filtered to events witnessed by present NPCs, max ${NARRATOR_EVENT_LIMIT})`,
    recentEventText,
  ].join("\n");
}

function choiceIdFromLabel(label) {
  return String(label || "choice")
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "choice";
}

function parseNarratorChoiceLine(line, index) {
  const cleaned = line.trim().replace(/^\d+[\).]\s*/, "");
  if (!cleaned) return null;

  if (cleaned.includes("|")) {
    const [label, id] = cleaned.split("|").map(part => part.trim());
    if (!label) return null;
    return { id: id || choiceIdFromLabel(label), label };
  }

  return { id: choiceIdFromLabel(cleaned) || `choice_${index + 1}`, label: cleaned };
}

function parseNarratorResponse(text) {
  const rawText = String(text || "").trim();
  const stateMatch = rawText.match(/\[STATE\]\s*([\s\S]*?)(?:\[\/STATE\]|$)/);
  let statePatch = null;
  let stateParseError = null;

  if (stateMatch) {
    try {
      statePatch = JSON.parse(stateMatch[1].trim());
    } catch (error) {
      stateParseError = error;
    }
  }

  const choicesMatch = rawText.match(/\[CHOICES\]\s*([\s\S]*?)(?:\[\/CHOICES\]|\[OPEN\]|\[STATE\]|$)/);
  const choices = choicesMatch
    ? choicesMatch[1]
      .split("\n")
      .map((line, index) => parseNarratorChoiceLine(line, index))
      .filter(Boolean)
    : [];

  const narration = rawText.split(/\[CHOICES\]|\[OPEN\]|\[STATE\]/)[0].trim();

  return {
    narration,
    choices,
    open: /\[OPEN\]/.test(rawText),
    statePatch,
    stateParseError,
  };
}

function clampStat(value) {
  return Math.max(0, Math.min(100, value));
}

function applyStatChanges(state, changes) {
  if (!changes || typeof changes !== "object") return state;

  const currentStats = state.player?.stats || state.playerStats || {};
  const nextStats = { ...currentStats };
  let changed = false;

  for (const [stat, delta] of Object.entries(changes)) {
    const key = stat.toLowerCase();
    if (!(key in nextStats) || typeof delta !== "number") continue;
    nextStats[key] = clampStat(nextStats[key] + delta);
    changed = true;
  }

  if (!changed) return state;

  const next = { ...state };
  if (next.player) next.player = { ...next.player, stats: nextStats };
  if (next.playerStats) next.playerStats = nextStats;
  return next;
}

function applyResourceChanges(state, changes) {
  if (!changes || typeof changes !== "object" || !state.player?.resources) return state;

  const resources = { ...state.player.resources };
  let changed = false;

  for (const [resource, delta] of Object.entries(changes)) {
    if (!(resource in resources) || typeof delta !== "number") continue;
    const cap = resource === "energy" ? 100 : Number.MAX_SAFE_INTEGER;
    resources[resource] = Math.max(0, Math.min(cap, resources[resource] + delta));
    changed = true;
  }

  if (!changed) return state;
  return { ...state, player: { ...state.player, resources } };
}

function applyTraitChanges(state, changes) {
  if (!changes || typeof changes !== "object") return state;

  const currentTraits = uniqueCompact(state.player?.traits || state.playerTraits || state.traits);
  const remove = new Set(uniqueCompact(changes.remove).map(trait => String(trait).toLowerCase()));
  const add = uniqueCompact(changes.add);
  const traits = uniqueCompact([
    ...currentTraits.filter(trait => !remove.has(String(trait).toLowerCase())),
    ...add,
  ]);

  const next = { ...state };
  if (next.player) next.player = { ...next.player, traits };
  if (next.playerTraits) next.playerTraits = traits;
  if (next.traits) next.traits = traits;
  return next;
}

function applyRelationshipChanges(state, changes) {
  if (!changes || typeof changes !== "object") return state;

  const relationships = { ...(state.player?.relationships || state.relationships || {}) };

  for (const [npcId, change] of Object.entries(changes)) {
    const current = relationships[npcId];
    const record = current && typeof current === "object"
      ? { ...current }
      : { score: typeof current === "number" ? current : 0 };

    if (typeof change === "number") {
      record.score = (typeof record.score === "number" ? record.score : 0) + change;
    } else if (change && typeof change === "object") {
      Object.assign(record, change);
      if (typeof change.delta === "number") {
        record.score = (typeof record.score === "number" ? record.score : 0) + change.delta;
        delete record.delta;
      }
    }

    relationships[npcId] = record;
  }

  const next = { ...state };
  if (next.relationships) next.relationships = relationships;
  if (next.player) next.player = { ...next.player, relationships };
  return next;
}

function applyKnownNpcChanges(state, newNpcs) {
  if (!Array.isArray(newNpcs) || !newNpcs.length) return state;

  const npcDirectory = { ...(state.npcDirectory || {}) };
  const known = [...(state.npcsKnown || [])];

  for (const npc of newNpcs) {
    if (!npc || typeof npc !== "object") continue;
    const id = npc.id || npc.key || npc.portraitKey || npc.name;
    if (!id) continue;
    npcDirectory[id] = { ...(npcDirectory[id] || {}), ...npc, id };
    const knownKey = npc.portraitKey || id;
    if (!known.includes(knownKey)) known.push(knownKey);
  }

  return { ...state, npcDirectory, npcsKnown: known };
}

function applyNarratorStatePatch(state, patch) {
  if (!patch || typeof patch !== "object") return state;

  let next = state;
  next = applyStatChanges(next, patch.stat_changes || patch.statDeltas);
  next = applyResourceChanges(next, patch.resource_changes || patch.resourceDeltas);
  next = applyTraitChanges(next, patch.trait_changes);
  next = applyRelationshipChanges(next, patch.relationship_changes);
  next = applyKnownNpcChanges(next, patch.new_npcs || patch.newNpcs);

  if (patch.npc_mood_changes && typeof patch.npc_mood_changes === "object") {
    next = { ...next, npcMoods: { ...(next.npcMoods || {}), ...patch.npc_mood_changes } };
  }

  if (patch.flags && typeof patch.flags === "object") {
    next = { ...next, ...patch.flags };
  }

  return next;
}

async function requestNarratorScene(state, action, systemPrompt) {
  if (typeof window === "undefined" || !window.claude?.complete || !systemPrompt) return null;

  const raw = await window.claude.complete({
    system: systemPrompt,
    messages: [{ role: "user", content: buildNarratorContext(state, action) }],
  });
  const text = typeof raw === "string" ? raw : (raw?.content ?? "");
  return parseNarratorResponse(text);
}

// ============================================================================
// PERSISTENCE
// ============================================================================

const STORAGE_KEY = "student-body:v1:state";

async function loadState() {
  try {
    if (typeof window === "undefined" || !window.storage) return null;
    const r = await window.storage.get(STORAGE_KEY);
    if (!r) return null;
    return JSON.parse(r.value);
  } catch { return null; }
}

async function saveState(state) {
  try {
    if (typeof window === "undefined" || !window.storage) return;
    await window.storage.set(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

async function clearState() {
  try {
    if (typeof window === "undefined" || !window.storage) return;
    await window.storage.delete(STORAGE_KEY);
  } catch {}
}

// ============================================================================
// SCRIPTED SCENE — coffee shop intro (preserved from v0 skeleton)
// ============================================================================
//
// The narrator harness is where prompt iteration happens. This scripted scene
// exists so the playable artifact has something to do without LLM calls.
// Replace this whole module when the live narration loop comes online.

function getScriptedScene(state) {
  const { location, day, timeSlot, metMari, introSeen } = state;

  if (location === "dorm_room" && !introSeen) {
    return {
      narration: "First morning. The boxes you didn't unpack last night are still where you left them. Your roommate Marcus is gone — there's a note on the fridge in handwriting that's somehow already familiar: \"coffee shop down the street is good. back by noon.\" The room is too quiet.",
      choices: [
        { id: "go_coffee",  label: "Head to the coffee shop",   tag: "intro_complete" },
        { id: "unpack",     label: "Stay in and unpack",         tag: "intro_complete" },
        { id: "explore",    label: "Walk the campus a bit",      tag: "intro_complete" },
      ],
    };
  }

  if (location === "coffee_shop" && !metMari) {
    return {
      narration: "The bell above the door chimes. The shop smells like good coffee and old wood. Behind the counter, a barista with copper hair glances up — sees you, registers \"new face,\" and gives you a half-smile that's mostly professional with a little curiosity underneath. \"What can I get you?\"",
      choices: [
        { id: "order_drip",   label: "\"Just a drip coffee, please.\"", tag: "met_mari" },
        { id: "order_fancy",  label: "\"What do you recommend?\"",       tag: "met_mari" },
        { id: "look_around",  label: "Stall — look at the menu board",   tag: "met_mari_quiet" },
      ],
    };
  }

  if (location === "coffee_shop" && metMari) {
    return {
      narration: "The shop is quieter this time. Mari spots you, gives a small nod from behind the espresso machine. The same booth by the window is open.",
      choices: [
        { id: "sit_window",   label: "Take the window booth" },
        { id: "chat_counter", label: "Lean on the counter and chat" },
        { id: "leave",        label: "Just grab something to go" },
      ],
    };
  }

  // Generic placeholder
  const loc = LOCATIONS[location];
  const partOfDay = TIME_LABELS[timeSlot].toLowerCase();
  return {
    narration: `${loc?.label || "Here"}. ${partOfDay}, day ${day}. (Scripted scene not yet written for this location — narrator will pick this up later.)`,
    choices: [
      { id: "wait",  label: "Spend some time here" },
      { id: "leave", label: "Move on" },
    ],
  };
}

// ============================================================================
// SVG DISPLAY HELPER
// ============================================================================

function InlineSvg({ svg, style, className, onClick }) {
  return (
    <div
      style={{ width: "100%", height: "100%", ...style }}
      className={className}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// ============================================================================
// SCENE VIEW — the main image area + dialogue strip
// ============================================================================

function SceneImage({ locationKey }) {
  const svg = LOC_SVGS[locationKey];
  return (
    <div style={{
      position: "absolute", inset: 0, overflow: "hidden",
      background: "#1a1814",
    }}>
      {svg ? (
        <InlineSvg svg={svg} style={{ width: "100%", height: "100%" }} />
      ) : (
        <div style={{
          width: "100%", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#5a5040", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14,
        }}>
          ({locationKey})
        </div>
      )}
    </div>
  );
}

// Inline outline icons for the floating UI stack. Designed to read at ~20px
// like the Tabler outline set (1.5–2px stroke, simple geometric forms).
const UI_ICONS = {
  phone: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <line x1="11" y1="17" x2="13" y2="17" />
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 11a3 3 0 0 1 3 -3h8a3 3 0 0 1 3 3v8a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z" />
      <path d="M9 11v-3a3 3 0 0 1 6 0v3" />
      <path d="M9 14h6" />
    </svg>
  ),
  you: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  ),
  map: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6l6 -2l6 2l6 -2v14l-6 2l-6 -2l-6 2z" />
      <line x1="9" y1="4" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="20" />
    </svg>
  ),
};

function FloatingIcons({ phoneOpen, onTogglePhone }) {
  const items = [
    { id: "phone", label: "Phone",     icon: UI_ICONS.phone },
    { id: "bag",   label: "Inventory", icon: UI_ICONS.bag },
    { id: "you",   label: "Self",      icon: UI_ICONS.you },
    { id: "map",   label: "Map",       icon: UI_ICONS.map },
  ];
  return (
    <div style={{
      position: "absolute", top: 16, right: 16, zIndex: 30,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      {items.map(it => {
        const isPhone = it.id === "phone";
        const active = isPhone && phoneOpen;
        return (
          <button
            key={it.id}
            onClick={isPhone ? onTogglePhone : undefined}
            disabled={!isPhone}
            title={it.label}
            style={{
              width: 40, height: 40,
              background: active ? PAL.iconBgActive : PAL.iconBg,
              border: `1px solid ${active ? PAL.iconBorderActive : PAL.iconBorder}`,
              borderRadius: 8, color: PAL.ink,
              cursor: isPhone ? "pointer" : "default",
              padding: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: isPhone ? 1 : 0.55,
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              transition: "background 0.18s, border-color 0.18s",
            }}
          >
            {it.icon}
          </button>
        );
      })}
    </div>
  );
}

function HeaderBar({ state, onNewGame }) {
  return (
    <div style={{
      position: "absolute", top: 16, left: 16, zIndex: 30,
      display: "flex", alignItems: "center", gap: 10,
      padding: "6px 12px",
      background: PAL.iconBg, border: `1px solid ${PAL.iconBorder}`,
      borderRadius: 8, color: PAL.ink, fontSize: 12,
      fontFamily: "Georgia, serif", letterSpacing: 0.3,
      backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
    }}>
      <span style={{ color: PAL.accent }}>Day {state.day}</span>
      <span style={{ color: PAL.inkSoft }}>·</span>
      <span style={{ color: PAL.inkDim }}>{TIME_LABELS[state.timeSlot]}</span>
      <span style={{ color: PAL.inkSoft }}>·</span>
      <span style={{ color: PAL.inkDim }}>{LOCATIONS[state.location]?.label || state.location}</span>
      <button
        onClick={onNewGame}
        style={{
          marginLeft: 8, padding: "2px 8px",
          background: "transparent", border: `1px solid ${PAL.iconBorder}`,
          borderRadius: 4, color: PAL.inkSoft, cursor: "pointer", fontSize: 10,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        ↻
      </button>
    </div>
  );
}

function DialogueStrip({ scene, onChoice, dimmed }) {
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 0,
      height: "26%", minHeight: 180,
      background: PAL.dialogueBg,
      borderTop: `1px solid ${PAL.dialogueBorder}`,
      padding: "20px 28px 18px",
      display: "flex", flexDirection: "column",
      gap: 12, color: PAL.ink,
      fontFamily: "Georgia, 'Times New Roman', serif",
      opacity: dimmed ? 0.55 : 1,
      transition: "opacity 0.2s",
      zIndex: 10,
      boxSizing: "border-box",
    }}>
      <div style={{
        flex: 1, fontSize: 15, lineHeight: 1.55,
        overflow: "auto",
      }}>
        {scene.narration}
      </div>
      {scene.choices && scene.choices.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {scene.choices.map(c => (
            <button
              key={c.id}
              onClick={() => onChoice(c)}
              style={{
                padding: "8px 14px", fontSize: 13,
                background: "rgba(200,161,101,0.08)",
                border: `1px solid ${PAL.iconBorder}`,
                borderRadius: 6, color: PAL.ink,
                fontFamily: "Georgia, serif",
                cursor: "pointer",
                transition: "background 0.12s, border-color 0.12s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(200,161,101,0.18)";
                e.currentTarget.style.borderColor = PAL.iconBorderActive;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(200,161,101,0.08)";
                e.currentTarget.style.borderColor = PAL.iconBorder;
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PHONE — diegetic device with portrait/landscape states
// ============================================================================

function PhoneFrame({ orientation, children, onClose }) {
  // Portrait: 9:19 aspect, fits in right column of image area.
  // Landscape: 19:9 aspect, fits centered.
  // We bound by BOTH dimensions of the image area so the phone never
  // overflows. The image area's height is 74vh (100vh - 26% dialogue).
  // We use a CSS calc trick: width is min(width-bound, height-bound-by-aspect).
  const isPortrait = orientation === "portrait";

  // For portrait: height is the limiting factor on wide-short windows.
  //   width <= 30% of parent
  //   height <= 88% of parent  →  width <= 88% × (9/19) of parent height
  // For landscape: width is usually the limiter.
  //   width <= 92% of parent
  //   height <= 88% of parent  →  width <= 88% × (19/9) of parent height
  const portraitStyle = {
    position: "absolute", zIndex: 25,
    right: "5%", top: "50%", transform: "translateY(-50%)",
    width: "min(30%, calc(88% * 9 / 19), 280px)",
    height: "min(88%, calc(30% * 19 / 9), calc(280px * 19 / 9))",
    maxHeight: "88%",
  };

  const landscapeStyle = {
    position: "absolute", zIndex: 25,
    left: "50%", top: "50%", transform: "translate(-50%, -50%)",
    width: "min(92%, calc(88% * 19 / 9), 880px)",
    height: "min(88%, calc(92% * 9 / 19), calc(880px * 9 / 19))",
    maxHeight: "88%",
  };

  return (
    <div style={isPortrait ? portraitStyle : landscapeStyle}>
      {/* Bezel */}
      <div style={{
        position: "absolute", inset: 0,
        background: PAL.phoneBezel,
        borderRadius: isPortrait ? "10% / 5%" : "5% / 10%",
        boxShadow: "0 14px 48px rgba(0,0,0,0.55), 0 0 0 1.5px rgba(40,34,28,1), inset 0 0 0 1px rgba(80,70,55,0.4)",
        padding: isPortrait ? "3% 3%" : "3% 3%",
        boxSizing: "border-box",
      }}>
        {/* Screen */}
        <div style={{
          position: "absolute",
          inset: isPortrait ? "3%" : "3%",
          background: PAL.phoneScreen,
          borderRadius: isPortrait ? "7% / 3.5%" : "3.5% / 7%",
          overflow: "hidden",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.4)",
        }}>
          {children}
        </div>
        {/* Notch / speaker — top center for portrait, left edge for landscape */}
        {isPortrait ? (
          <div style={{
            position: "absolute", top: "1.5%", left: "50%",
            transform: "translateX(-50%)",
            width: "30%", height: "1.6%",
            background: "#1a1814",
            borderRadius: "0 0 999px 999px",
            zIndex: 2,
          }} />
        ) : (
          <div style={{
            position: "absolute", left: "1.5%", top: "50%",
            transform: "translateY(-50%)",
            height: "30%", width: "0.9%",
            background: "#1a1814",
            borderRadius: "999px 0 0 999px",
            zIndex: 2,
          }} />
        )}
      </div>
      {/* Close affordance — sits outside the bezel */}
      <button
        onClick={onClose}
        title="Put the phone away"
        style={{
          position: "absolute",
          ...(isPortrait
            ? { top: -14, right: -14 }
            : { top: -14, right: -14 }),
          width: 30, height: 30,
          background: PAL.iconBgActive, color: PAL.ink,
          border: `1px solid ${PAL.iconBorderActive}`,
          borderRadius: "50%", cursor: "pointer",
          fontSize: 14, lineHeight: 1, padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 26,
        }}
      >
        ×
      </button>
    </div>
  );
}

function PhoneStatusBar({ state }) {
  const time = `${TIME_LABELS[state.timeSlot]}`;
  return (
    <div style={{
      padding: "10px 18px 6px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      fontSize: 11, color: "#3a3530",
      fontFamily: "system-ui, sans-serif", fontWeight: 500,
      letterSpacing: 0.4,
    }}>
      <span>{time}</span>
      <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 9 }}>•••</span>
        <span style={{
          display: "inline-block",
          width: 18, height: 9,
          border: "1.2px solid #3a3530",
          borderRadius: 2, position: "relative",
        }}>
          <span style={{
            position: "absolute", inset: "1px",
            background: "#3a3530", width: "70%",
            borderRadius: 1,
          }} />
        </span>
      </span>
    </div>
  );
}

function PhoneHomeScreen({ state, onOpenApp }) {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "linear-gradient(180deg, #f0ebdc 0%, #e8dfc8 100%)",
      display: "flex", flexDirection: "column",
      fontFamily: "system-ui, sans-serif",
    }}>
      <PhoneStatusBar state={state} />
      <div style={{
        flex: 1, padding: "12px 16px 24px",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "10px 12px",
        alignContent: "start",
      }}>
        {APPS.map(app => (
          <button
            key={app.id}
            onClick={() => onOpenApp(app.id)}
            style={{
              padding: 0, background: "transparent", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}
          >
            <div style={{
              width: "100%", aspectRatio: "1 / 1",
              borderRadius: "22%", overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
            }}>
              {ICON_SVGS[app.id] ? (
                <InlineSvg svg={ICON_SVGS[app.id]} />
              ) : (
                <div style={{
                  width: "100%", height: "100%",
                  background: "#cbb892",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: "#3a3530",
                }}>?</div>
              )}
            </div>
            <span style={{
              fontSize: 9, color: "#3a3530",
              fontFamily: "system-ui, sans-serif", fontWeight: 500,
              letterSpacing: 0.2,
            }}>{app.label}</span>
          </button>
        ))}
      </div>
      {/* Home indicator */}
      <div style={{
        height: 18, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: "32%", height: 3,
          background: "#3a3530", opacity: 0.45,
          borderRadius: 2,
        }} />
      </div>
    </div>
  );
}

// ============================================================================
// APP VIEWS
// ============================================================================

function AppShell({ title, onBack, children, dark }) {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: dark ? "#1a1814" : "#f0ebdc",
      color: dark ? "#f0ebdc" : "#3a3530",
      display: "flex", flexDirection: "column",
      fontFamily: "system-ui, sans-serif",
    }}>
      {/* Status bar with back */}
      <div style={{
        padding: "10px 14px 8px",
        display: "flex", alignItems: "center", gap: 8,
        borderBottom: `1px solid ${dark ? "rgba(240,235,220,0.1)" : "rgba(58,53,48,0.08)"}`,
      }}>
        <button
          onClick={onBack}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            padding: 4, fontSize: 16, lineHeight: 1,
            color: dark ? "#f0ebdc" : "#3a3530",
          }}
        >
          ‹
        </button>
        <span style={{
          fontSize: 12, fontWeight: 600, letterSpacing: 0.3,
          color: dark ? "#f0ebdc" : "#3a3530",
        }}>{title}</span>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 14 }}>
        {children}
      </div>
    </div>
  );
}

function CompassApp({ state, onBack, onNavigate }) {
  // Landscape map view
  const groups = [
    { label: "Campus", cat: "campus" },
    { label: "Town",    cat: "town" },
    { label: "Outdoor", cat: "outdoor" },
  ];
  const here = state.location;

  return (
    <AppShell title="Compass" onBack={onBack} dark>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14,
        height: "100%",
      }}>
        {groups.map(g => {
          const locs = Object.entries(LOCATIONS).filter(([_, v]) => v.cat === g.cat);
          return (
            <div key={g.cat} style={{
              border: "1px solid rgba(240,235,220,0.12)",
              borderRadius: 8, padding: "10px 12px",
              display: "flex", flexDirection: "column", gap: 6,
              minHeight: 0,
            }}>
              <div style={{
                fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
                color: "#c8a165", fontWeight: 600, marginBottom: 4,
              }}>{g.label}</div>
              <div style={{
                display: "flex", flexDirection: "column", gap: 4,
                overflow: "auto",
              }}>
                {locs.map(([key, v]) => {
                  const isHere = key === here;
                  return (
                    <button
                      key={key}
                      onClick={() => !isHere && onNavigate(key)}
                      disabled={isHere}
                      style={{
                        textAlign: "left",
                        padding: "8px 10px",
                        background: isHere ? "rgba(200,161,101,0.18)" : "transparent",
                        border: `1px solid ${isHere ? "rgba(200,161,101,0.4)" : "rgba(240,235,220,0.08)"}`,
                        borderRadius: 6,
                        color: isHere ? "#c8a165" : "#f0ebdc",
                        cursor: isHere ? "default" : "pointer",
                        fontSize: 12, fontFamily: "system-ui, sans-serif",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}
                    >
                      <span>{v.label}</span>
                      {isHere && <span style={{ fontSize: 9, opacity: 0.7 }}>here</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

function RosterApp({ state, onBack }) {
  const known = state.npcsKnown;
  return (
    <AppShell title="Roster" onBack={onBack}>
      {known.length === 0 ? (
        <div style={{
          padding: "40px 20px", textAlign: "center",
          color: "#7a6e58", fontStyle: "italic", fontSize: 13,
        }}>
          You haven't met anyone worth saving yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {known.map(key => (
            <div key={key} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px",
              background: "rgba(58,53,48,0.04)",
              border: "1px solid rgba(58,53,48,0.08)",
              borderRadius: 8,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                overflow: "hidden", flexShrink: 0,
                border: "1px solid rgba(58,53,48,0.18)",
              }}>
                {PORTRAIT_SVGS[key] ? <InlineSvg svg={PORTRAIT_SVGS[key]} /> : null}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{key === "studious" ? "Mari" : key}</div>
                <div style={{ fontSize: 11, color: "#7a6e58" }}>
                  {key === "studious" ? "Coffee shop barista" : "—"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function SelfApp({ state, onBack }) {
  const { stats, resources } = state.player;
  const StatRow = ({ label, value, max = 100 }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 11, color: "#3a3530", marginBottom: 3,
      }}>
        <span>{label}</span><span style={{ color: "#7a6e58" }}>{value}</span>
      </div>
      <div style={{
        height: 5, background: "rgba(58,53,48,0.1)",
        borderRadius: 3, overflow: "hidden",
      }}>
        <div style={{
          width: `${(value / max) * 100}%`, height: "100%",
          background: "#c8a165", borderRadius: 3,
        }} />
      </div>
    </div>
  );
  return (
    <AppShell title="Self" onBack={onBack}>
      <div style={{ marginBottom: 18 }}>
        <div style={{
          fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
          color: "#8b6f3d", fontWeight: 600, marginBottom: 8,
        }}>Stats</div>
        <StatRow label="Knowledge"   value={stats.knowledge} />
        <StatRow label="Athletics"   value={stats.athletics} />
        <StatRow label="Charm"       value={stats.charm} />
        <StatRow label="Sensitivity" value={stats.sensitivity} />
        <StatRow label="Grit"        value={stats.grit} />
      </div>
      <div>
        <div style={{
          fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
          color: "#8b6f3d", fontWeight: 600, marginBottom: 8,
        }}>Resources</div>
        <StatRow label="Energy" value={resources.energy} />
        <div style={{
          fontSize: 12, marginTop: 6,
          display: "flex", justifyContent: "space-between",
        }}>
          <span>Money</span><span style={{ color: "#7a6e58" }}>${resources.money}</span>
        </div>
      </div>
    </AppShell>
  );
}

function StubApp({ app, onBack }) {
  return (
    <AppShell title={app.label} onBack={onBack}>
      <div style={{
        height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 8,
        textAlign: "center", padding: 20,
      }}>
        <div style={{
          fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
          color: "#8b6f3d", fontWeight: 600,
        }}>{app.role}</div>
        <div style={{ fontSize: 13, color: "#7a6e58", fontStyle: "italic" }}>
          Not yet implemented.
        </div>
      </div>
    </AppShell>
  );
}

// ============================================================================
// NOTIFICATION BANNER — slides in from top of image area
// ============================================================================

function NotificationBanner({ notif, onDismiss, onTap }) {
  if (!notif) return null;
  return (
    <div
      onClick={onTap}
      style={{
        position: "absolute", top: 16, left: "50%",
        transform: "translateX(-50%)", zIndex: 40,
        background: PAL.banner,
        border: `1px solid ${PAL.bannerBorder}`,
        borderRadius: 10, padding: "10px 16px",
        color: PAL.ink, fontFamily: "system-ui, sans-serif",
        fontSize: 12, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 10,
        maxWidth: "60%",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        animation: "sb-banner-in 0.32s ease-out",
      }}
    >
      <span style={{ color: PAL.accent, fontSize: 14 }}>▢</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, marginBottom: 1 }}>{notif.app}</div>
        <div style={{ color: PAL.inkDim, fontSize: 11 }}>{notif.body}</div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDismiss(); }}
        style={{
          background: "transparent", border: "none", color: PAL.inkSoft,
          cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1,
        }}
      >×</button>
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

export default function StudentBody() {
  const [state, setState] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Phone state: { open: bool, view: 'home' | 'app:<id>', orientation: 'portrait'|'landscape' }
  const [phone, setPhone] = useState({ open: false, view: "home", orientation: "portrait" });
  const [notif, setNotif] = useState(null);
  const notifTimerRef = useRef(null);

  // Boot
  useEffect(() => {
    (async () => {
      const saved = await loadState();
      setState(saved || makeFreshState());
      setLoaded(true);
    })();
  }, []);

  // Persist
  useEffect(() => {
    if (loaded && state) saveState(state);
  }, [state, loaded]);

  // Cleanup notif timer
  useEffect(() => () => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
  }, []);

  const showNotif = useCallback((notif, ttl = 5500) => {
    setNotif(notif);
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => setNotif(null), ttl);
  }, []);

  const handleNewGame = useCallback(async () => {
    if (!confirm("Start a new game? Current progress will be lost.")) return;
    await clearState();
    setState(makeFreshState());
    setPhone({ open: false, view: "home", orientation: "portrait" });
    setNotif(null);
  }, []);

  const togglePhone = useCallback(() => {
    setPhone(p => ({
      ...p,
      open: !p.open,
      view: !p.open ? "home" : p.view,
      orientation: !p.open ? "portrait" : p.orientation,
    }));
  }, []);

  const openApp = useCallback((appId) => {
    const app = APP_BY_ID[appId];
    setPhone(p => ({
      ...p,
      view: `app:${appId}`,
      orientation: app.layout,
    }));
  }, []);

  const backToHome = useCallback(() => {
    setPhone(p => ({ ...p, view: "home", orientation: "portrait" }));
  }, []);

  const handleNavigate = useCallback((locationKey) => {
    setState(s => {
      let next = appendEvent(s, `Walked to ${LOCATIONS[locationKey]?.label}`);
      next = advanceTime(next, 1);
      return { ...next, location: locationKey };
    });
    setPhone({ open: false, view: "home", orientation: "portrait" });
  }, []);

  const handleChoice = useCallback((choice) => {
    setState(s => {
      let next = appendEvent(s, `Chose: ${choice.label}`);
      next = advanceTime(next, 1);
      // Tag-based effects
      if (choice.tag === "intro_complete") next = { ...next, introSeen: true };
      if (choice.tag === "met_mari" || choice.tag === "met_mari_quiet") {
        next = {
          ...next, metMari: true,
          npcsKnown: next.npcsKnown.includes("studious") ? next.npcsKnown : [...next.npcsKnown, "studious"],
        };
        // Trigger a notification banner the next "tick" - simulate Sienna texting later
        setTimeout(() => {
          showNotif({ app: "Pulse", body: "Mari saved your number." });
        }, 1500);
      }
      // Move to coffee shop on intro choice
      if (choice.id === "go_coffee") next = { ...next, location: "coffee_shop" };
      // Energy
      if (choice.id === "rest" || choice.id === "wait") {
        next = { ...next, player: {
          ...next.player,
          resources: { ...next.player.resources, energy: Math.min(100, next.player.resources.energy + 8) },
        }};
      }
      return next;
    });
  }, [showNotif]);

  if (!loaded || !state) {
    return (
      <div style={{
        background: PAL.bg, color: PAL.ink, minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Georgia, serif", fontStyle: "italic",
      }}>
        Loading...
      </div>
    );
  }

  const scene = getScriptedScene(state);
  const phoneIsOpen = phone.open;
  const isLandscape = phone.orientation === "landscape";

  // Phone-app content router
  let phoneContent = null;
  if (phone.view === "home") {
    phoneContent = <PhoneHomeScreen state={state} onOpenApp={openApp} />;
  } else if (phone.view.startsWith("app:")) {
    const appId = phone.view.slice(4);
    const app = APP_BY_ID[appId];
    if (!app) phoneContent = <PhoneHomeScreen state={state} onOpenApp={openApp} />;
    else if (appId === "compass") phoneContent = <CompassApp state={state} onBack={backToHome} onNavigate={handleNavigate} />;
    else if (appId === "roster")  phoneContent = <RosterApp  state={state} onBack={backToHome} />;
    else if (appId === "self")    phoneContent = <SelfApp    state={state} onBack={backToHome} />;
    else                          phoneContent = <StubApp    app={app}     onBack={backToHome} />;
  }

  return (
    <>
      {/* Global keyframes */}
      <style>{`
        @keyframes sb-banner-in {
          from { opacity: 0; transform: translate(-50%, -12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes sb-phone-in-portrait {
          from { opacity: 0; transform: translate(40%, -50%); }
          to   { opacity: 1; transform: translate(0, -50%); }
        }
        @keyframes sb-phone-in-landscape {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.92); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>

      <div style={{
        background: PAL.bg, color: PAL.ink,
        minHeight: "100vh", height: "100vh",
        fontFamily: "Georgia, 'Times New Roman', serif",
        overflow: "hidden",
      }}>
        {/* The game window — single canvas, image area + dialogue strip stacked */}
        <div style={{
          position: "relative", width: "100%", height: "100%",
          maxWidth: 1400, margin: "0 auto",
        }}>
          {/* Image area (top 74%) */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: "26%",
            minHeight: 0,
            overflow: "hidden",
          }}>
            <SceneImage locationKey={state.location} />

            {/* World dim overlay when phone is open */}
            {phoneIsOpen && (
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(8,6,4,0.55)",
                zIndex: 20,
                transition: "opacity 0.2s",
              }} />
            )}

            <HeaderBar state={state} onNewGame={handleNewGame} />
            <FloatingIcons phoneOpen={phoneIsOpen} onTogglePhone={togglePhone} />

            {/* Notification banner */}
            <NotificationBanner
              notif={notif}
              onDismiss={() => setNotif(null)}
              onTap={() => {
                setNotif(null);
                setPhone({ open: true, view: "home", orientation: "portrait" });
              }}
            />

            {/* Phone */}
            {phoneIsOpen && (
              <div
                key={phone.orientation /* re-key on orientation flip to retrigger animation */}
                style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  animation: isLandscape
                    ? "sb-phone-in-landscape 0.34s ease-out"
                    : "sb-phone-in-portrait 0.28s ease-out",
                }}
              >
                <div style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}>
                  <PhoneFrame orientation={phone.orientation} onClose={togglePhone}>
                    {phoneContent}
                  </PhoneFrame>
                </div>
              </div>
            )}
          </div>

          {/* Dialogue strip (bottom 26%) — always visible */}
          <DialogueStrip
            scene={scene}
            onChoice={handleChoice}
            dimmed={false /* never dimmed; world narration continues regardless of phone */}
          />
        </div>
      </div>
    </>
  );
}
