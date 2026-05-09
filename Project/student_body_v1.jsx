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
  { id: "pulse",   label: "Pulse",   role: "Messages",    layout: "portrait",  impl: true  },
  { id: "roster",  label: "Roster",  role: "Contacts",    layout: "portrait",  impl: true  },
  { id: "self",    label: "Self",    role: "Stats",       layout: "portrait",  impl: true  },
  { id: "buzz",    label: "Buzz",    role: "Campus feed", layout: "landscape", impl: true  },
  { id: "anthrop", label: "Anthrop", role: "Assistant",   layout: "landscape", impl: true  },
  { id: "spark",   label: "Spark",   role: "Dating",      layout: "landscape", impl: false },
  { id: "margin",  label: "Margin",  role: "Notes",       layout: "portrait",  impl: true  },
  { id: "lens",    label: "Lens",    role: "Camera",      layout: "landscape", impl: false },
  { id: "wake",    label: "Wake",    role: "Alarm",       layout: "portrait",  impl: true  },
  { id: "beacon",  label: "Beacon",  role: "Browser",     layout: "landscape", impl: false },
];

const APP_BY_ID = Object.fromEntries(APPS.map(a => [a.id, a]));

// ============================================================================
// STATE
// ============================================================================

function makeFreshState() {
  return {
    version: 2,
    timeScale: "quarter-hour",
    day: 1,
    timeSlot: timeChunk(8), // 15-minute chunk index; 8:00 AM
    location: "dorm_room",
    introSeen: false,
    metMari: false,
    player: {
      name: "You",
      stats:    { knowledge: 30, athletics: 25, charm: 35, sensitivity: 40, grit: 30 },
      resources:{ energy: 80, money: 50 },
      inventory: {},
      traits: [],
      relationships: {},
    },
    npcsKnown: [], // list of portrait keys the player has met
    messages: [],
    pendingMessages: [],
    notes: [],
    buzzPosts: [],
    bulletinBoards: {},
    commitments: [],
    missedBlocks: [],
    eventLog: [],
    activityHistory: { activities: {} },
    wake: { alarmSlot: timeChunk(7, 30), lastSleep: null },
  };
}

function normalizeState(state) {
  const fresh = makeFreshState();
  if (!state || typeof state !== "object") return fresh;

  const player = state.player || {};
  const legacyTimeScale = state.timeScale !== "quarter-hour" && (state.version || 1) < 2;
  return {
    ...fresh,
    ...state,
    version: 2,
    timeScale: "quarter-hour",
    timeSlot: normalizeTimeSlot(state.timeSlot, legacyTimeScale),
    player: {
      ...fresh.player,
      ...player,
      stats: { ...fresh.player.stats, ...(player.stats || {}) },
      resources: { ...fresh.player.resources, ...(player.resources || {}) },
      inventory: normalizeInventory(player.inventory || state.inventory || {}),
      traits: Array.isArray(player.traits) ? player.traits : [],
      relationships: normalizeRelationshipMap(player.relationships || {}),
    },
    npcsKnown: Array.isArray(state.npcsKnown) ? state.npcsKnown : [],
    messages: migrateTimedRecords(state.messages, legacyTimeScale),
    pendingMessages: migratePendingMessages(state.pendingMessages, legacyTimeScale),
    notes: migrateTimedRecords(state.notes, legacyTimeScale),
    buzzPosts: migrateTimedRecords(state.buzzPosts, legacyTimeScale),
    bulletinBoards: state.bulletinBoards && typeof state.bulletinBoards === "object" ? state.bulletinBoards : {},
    commitments: migrateTimedRecords(state.commitments, legacyTimeScale),
    missedBlocks: migrateTimedRecords(state.missedBlocks, legacyTimeScale),
    eventLog: migrateTimedRecords(state.eventLog, legacyTimeScale),
    activityHistory: normalizeActivityHistory(state.activityHistory),
    wake: {
      ...fresh.wake,
      ...(state.wake || {}),
      alarmSlot: normalizeTimeSlot(state.wake?.alarmSlot ?? fresh.wake.alarmSlot, legacyTimeScale),
    },
  };
}

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const NARRATOR_EVENT_LIMIT = 10;
const SEMESTER_WEEKS = 16;
const TIME_CHUNK_MINUTES = 15;
const CHUNKS_PER_DAY = 24 * 60 / TIME_CHUNK_MINUTES;
const LEGACY_SLOT_TO_CHUNK = [timeChunk(8), timeChunk(12), timeChunk(15), timeChunk(18), timeChunk(22)];
const DEFAULT_ACTION_CHUNKS = 4; // one hour

const PLAYER_WEEKLY_SCHEDULE = [
  { id: "first_year_seminar", title: "First-Year Seminar", kind: "class", location: "lecture_hall", days: [0, 2], start: timeChunk(9), end: timeChunk(10, 15), required: true },
  { id: "intro_psych", title: "Intro Psych", kind: "class", location: "lecture_hall", days: [1, 3], start: timeChunk(9, 30), end: timeChunk(10, 45), required: true },
  { id: "writing_lab", title: "Writing Lab", kind: "class", location: "lecture_hall", days: [4], start: timeChunk(11), end: timeChunk(12, 15), required: true },
  { id: "advising_checkin", title: "Advising Check-in", kind: "campus", location: "student_union", days: [0], start: timeChunk(13), end: timeChunk(13, 30), required: false },
];

const SEMESTER_CALENDAR_EVENTS = [
  { id: "orientation_mixer", title: "Orientation Mixer", kind: "event", location: "student_union", week: 1, dayIndex: 0, start: timeChunk(18), end: timeChunk(20) },
  { id: "club_fair", title: "Club Fair", kind: "event", location: "quad", week: 1, dayIndex: 2, start: timeChunk(15), end: timeChunk(17) },
  { id: "first_library_workshop", title: "Library Research Workshop", kind: "event", location: "library_main", week: 1, dayIndex: 3, start: timeChunk(15, 30), end: timeChunk(16, 30) },
  { id: "first_midterm", title: "First Midterm", kind: "exam", location: "lecture_hall", week: 8, dayIndex: 2, start: timeChunk(9), end: timeChunk(10, 30) },
  { id: "finals_week_begins", title: "Finals Week Begins", kind: "exam", location: "lecture_hall", week: 16, dayIndex: 0, start: timeChunk(9), end: timeChunk(10, 30) },
];

const NPC_WEEKLY_SCHEDULES = {
  studious: [
    { days: [0, 1, 2, 3, 4, 5], start: timeChunk(7), end: timeChunk(14), location: "coffee_shop", note: "on shift" },
    { days: [1, 3], start: timeChunk(18), end: timeChunk(20), location: "library_main", note: "community college coursework" },
    { days: [2], start: timeChunk(21), end: timeChunk(22, 30), location: "library_stacks", note: "late research hour" },
    { days: [6], start: timeChunk(8), end: timeChunk(9), location: "running_trail", note: "quiet morning run" },
    { days: [5], start: timeChunk(17), end: timeChunk(18), location: "bookstore", note: "browsing after work" },
  ],
  roommate: [
    { days: [0, 2, 4], start: timeChunk(9), end: timeChunk(10, 15), location: "lecture_hall", note: "morning class" },
    { days: [0, 1, 2, 3, 4], start: timeChunk(12), end: timeChunk(13, 30), location: "student_union", note: "between classes" },
    { days: [1, 3], start: timeChunk(15), end: timeChunk(16, 30), location: "gym", note: "workout" },
    { days: [2], start: timeChunk(18), end: timeChunk(20), location: "library_main", note: "study group" },
    { days: [5], start: timeChunk(15), end: timeChunk(16, 30), location: "quad", note: "pickup plans" },
    { days: [0, 1, 2, 3, 4, 5, 6], start: timeChunk(21), end: timeChunk(24), location: "dorm_room", note: "back in the room" },
  ],
};

function timeChunk(hour, minute = 0) {
  if (hour >= 24) return CHUNKS_PER_DAY;
  const totalMinutes = Math.max(0, Math.min((24 * 60) - TIME_CHUNK_MINUTES, (hour * 60) + minute));
  return Math.floor(totalMinutes / TIME_CHUNK_MINUTES);
}

function normalizeTimeSlot(slot, legacyScale = false) {
  const raw = typeof slot === "number" ? slot : Number(slot);
  if (!Number.isFinite(raw)) return timeChunk(8);
  if (legacyScale && raw >= 0 && raw < LEGACY_SLOT_TO_CHUNK.length) return LEGACY_SLOT_TO_CHUNK[raw];
  return Math.max(0, Math.min(CHUNKS_PER_DAY - 1, Math.round(raw)));
}

function migrateTimedRecords(records, legacyScale) {
  if (!Array.isArray(records)) return [];
  return records.map(record => {
    if (!record || typeof record !== "object" || typeof record.slot !== "number") return record;
    return { ...record, slot: normalizeTimeSlot(record.slot, legacyScale) };
  });
}

function migratePendingMessages(records, legacyScale) {
  if (!Array.isArray(records)) return [];
  return records.map(record => {
    if (!record || typeof record !== "object") return record;
    return {
      ...record,
      slot: typeof record.slot === "number" ? normalizeTimeSlot(record.slot, legacyScale) : record.slot,
      dueSlot: normalizeTimeSlot(record.dueSlot ?? record.slot ?? timeChunk(8), legacyScale),
    };
  });
}

function absoluteMoment(day = 1, slot = 0) {
  const safeDay = Math.max(1, Math.floor(Number(day) || 1));
  return ((safeDay - 1) * CHUNKS_PER_DAY) + normalizeTimeSlot(slot);
}

function addChunksToMoment(day = 1, slot = 0, chunks = 0) {
  const absolute = absoluteMoment(day, slot) + Math.round(Number(chunks) || 0);
  const bounded = Math.max(0, absolute);
  return {
    day: Math.floor(bounded / CHUNKS_PER_DAY) + 1,
    slot: bounded % CHUNKS_PER_DAY,
  };
}

function formatClockTime(slot = 0) {
  const safeSlot = Math.max(0, Math.min(CHUNKS_PER_DAY, Math.round(Number(slot) || 0)));
  const totalMinutes = safeSlot * TIME_CHUNK_MINUTES;
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function getDaypartLabel(slot = 0) {
  const totalMinutes = normalizeTimeSlot(slot) * TIME_CHUNK_MINUTES;
  if (totalMinutes < 5 * 60) return "Late Night";
  if (totalMinutes < 12 * 60) return "Morning";
  if (totalMinutes < 17 * 60) return "Afternoon";
  if (totalMinutes < 21 * 60) return "Evening";
  return "Night";
}

function formatTimeOfDay(slot = 0) {
  return `${formatClockTime(slot)} (${getDaypartLabel(slot)})`;
}

function formatDuration(chunks = 0) {
  const minutes = Math.max(0, Math.round(chunks * TIME_CHUNK_MINUTES));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function advanceTime(state, n = DEFAULT_ACTION_CHUNKS) {
  let day = state.day;
  let slot = normalizeTimeSlot(state.timeSlot) + n;
  while (slot >= CHUNKS_PER_DAY) { slot -= CHUNKS_PER_DAY; day += 1; }
  while (slot < 0) { slot += CHUNKS_PER_DAY; day -= 1; }
  return { ...state, day, timeSlot: slot };
}

function appendEvent(state, text, witnesses = []) {
  const event = { day: state.day, slot: state.timeSlot, text };
  if (witnesses.length) event.witnesses = witnesses;
  return { ...state, eventLog: [...state.eventLog, event] };
}

function getWeekNumber(day = 1) {
  return Math.max(1, Math.min(SEMESTER_WEEKS, Math.floor((day - 1) / DAY_LABELS.length) + 1));
}

function getDayIndex(day = 1) {
  return ((day - 1) % DAY_LABELS.length + DAY_LABELS.length) % DAY_LABELS.length;
}

function getCalendarMoment(state, overrides = {}) {
  const day = overrides.day ?? state?.day ?? 1;
  const slot = normalizeTimeSlot(overrides.slot ?? state?.timeSlot ?? timeChunk(8));
  return {
    day,
    slot,
    week: getWeekNumber(day),
    dayIndex: getDayIndex(day),
    dayName: DAY_LABELS[getDayIndex(day)],
    slotLabel: formatTimeOfDay(slot),
  };
}

function scheduleMatchesMoment(entry, moment) {
  if (!entry) return false;
  if (entry.days && !entry.days.includes(moment.dayIndex)) return false;
  if (entry.slots && !entry.slots.includes(moment.slot)) return false;
  if (typeof entry.start === "number" && moment.slot < entry.start) return false;
  if (typeof entry.end === "number" && moment.slot >= entry.end) return false;
  if (entry.week && entry.week !== moment.week) return false;
  if (entry.weeks && !entry.weeks.includes(moment.week)) return false;
  if (entry.fromWeek && moment.week < entry.fromWeek) return false;
  if (entry.untilWeek && moment.week > entry.untilWeek) return false;
  return true;
}

function expandWeeklyScheduleForDay(entries, state, day = state.day) {
  const dayMoment = getCalendarMoment(state, { day, slot: 0 });
  return entries.flatMap(entry => {
    if (entry.days && !entry.days.includes(dayMoment.dayIndex)) return [];
    if (entry.week && entry.week !== dayMoment.week) return [];
    if (entry.weeks && !entry.weeks.includes(dayMoment.week)) return [];
    if (entry.fromWeek && dayMoment.week < entry.fromWeek) return [];
    if (entry.untilWeek && dayMoment.week > entry.untilWeek) return [];
    const slots = entry.slots || [entry.start ?? entry.slot ?? 0];
    return slots.map(slot => ({
      ...entry,
      day,
      week: dayMoment.week,
      dayIndex: dayMoment.dayIndex,
      slot: normalizeTimeSlot(slot),
      end: typeof entry.end === "number" ? entry.end : normalizeTimeSlot(slot) + 1,
    }));
  });
}

function getFixedCalendarItemsForDay(state, day = state.day) {
  const dayMoment = getCalendarMoment(state, { day, slot: 0 });
  return SEMESTER_CALENDAR_EVENTS
    .filter(item => item.week === dayMoment.week && item.dayIndex === dayMoment.dayIndex)
    .map(item => ({ ...item, day, slot: normalizeTimeSlot(item.start ?? item.slot ?? 0), end: item.end ?? normalizeTimeSlot(item.start ?? item.slot ?? 0) + 1 }));
}

function getTodayCalendarItems(state, day = state.day) {
  return [
    ...expandWeeklyScheduleForDay(PLAYER_WEEKLY_SCHEDULE, state, day),
    ...getFixedCalendarItemsForDay(state, day),
  ].sort((a, b) => a.slot - b.slot || String(a.title).localeCompare(String(b.title)));
}

function getCurrentCalendarItems(state) {
  const moment = getCalendarMoment(state);
  return getTodayCalendarItems(state, moment.day).filter(item => moment.slot >= item.slot && moment.slot < (item.end ?? item.slot + 1));
}

function getCalendarItemsAtLocation(state, locationKey, slot = state.timeSlot, day = state.day) {
  const currentSlot = normalizeTimeSlot(slot);
  return getTodayCalendarItems(state, day).filter(item => (
    item.location === locationKey &&
    currentSlot >= item.slot &&
    currentSlot < (item.end ?? item.slot + 1)
  ));
}

function getUpcomingCalendarItems(state, limit = 5) {
  const items = [];
  for (let offset = 0; offset < 7 && items.length < limit; offset += 1) {
    const day = state.day + offset;
    const startSlot = offset === 0 ? normalizeTimeSlot(state.timeSlot) : 0;
    const dayItems = getTodayCalendarItems(state, day).filter(item => (item.end ?? item.slot + 1) > startSlot);
    items.push(...dayItems.map(item => ({ ...item, day })));
  }
  return items
    .sort((a, b) => (a.day - b.day) || (a.slot - b.slot))
    .slice(0, limit);
}

function getNpcScheduleMatches(state, npc, locationKey = null) {
  if (!npc) return [];
  const moment = getCalendarMoment(state);
  const npcId = npc.id || npc.portraitKey || npc.name;
  const schedule = state?.npcSchedules?.[npcId] || NPC_WEEKLY_SCHEDULES[npcId] || [];
  return schedule.filter(entry => (
    scheduleMatchesMoment(entry, moment) &&
    (!locationKey || entry.location === locationKey)
  ));
}

function getNpcPresenceAtLocation(state, locationKey, directory = getNpcDirectory(state)) {
  return Object.values(directory)
    .map(npc => {
      const match = getNpcScheduleMatches(state, npc, locationKey)[0];
      return match ? { ...npc, currentLocation: locationKey, scheduleNote: match.note, scheduleEntry: match } : null;
    })
    .filter(Boolean);
}

function describeScheduleItem(item) {
  const place = LOCATIONS[item.location]?.label || item.location;
  const end = typeof item.end === "number" ? `-${formatClockTime(item.end)}` : "";
  return `${formatClockTime(item.slot)}${end}: ${item.title} at ${place}`;
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

  const scheduledNpcs = getNpcPresenceAtLocation(state, locationKey, directory);
  if (scheduledNpcs.length) return scheduledNpcs;

  const locatedNpcs = Object.values(directory).filter(npc => (
    npc.currentLocation === locationKey || npc.location === locationKey
  ));
  if (locatedNpcs.length) return locatedNpcs;

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
  const normalized = normalizeRelationshipRecord(record, npc);
  const level = getRelationshipLevel(normalized.score);
  return {
    ...normalized,
    level: normalized.level || level.id,
    levelLabel: level.label,
    levelDescription: level.description,
    traits: normalized.flags,
    flags: normalized.flags,
    recentMoments: normalized.recentMoments,
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
  const slot = typeof rawSlot === "number" ? formatTimeOfDay(rawSlot) : rawSlot;
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
  const timeSlot = typeof rawTimeSlot === "number" ? formatTimeOfDay(rawTimeSlot) : rawTimeSlot;
  const locationKey = getLocationKey(state);
  const location = LOCATIONS[locationKey] || { label: locationKey };
  const locationDescription = LOCATION_DESCRIPTIONS[locationKey] || "No static description recorded yet.";
  const npcDirectory = getNpcDirectory(state);
  const presentNpcs = getPresentNpcs(state, npcDirectory).filter(Boolean);
  const currentCalendarItems = getCurrentCalendarItems(state);
  const currentCalendarText = currentCalendarItems.length
    ? currentCalendarItems.map(describeScheduleItem).join("; ")
    : "Free block; no required calendar item in this slot.";
  const actionText = typeof action === "string"
    ? action.trim()
    : (action?.label || action?.text || action?.description || "");

  const relationships = presentNpcs.map(npc => {
    const relationship = getRelationshipForNpc(state, npc);
    return {
      npcId: npc.id,
      name: npc.name || npc.id,
      score: relationship.score,
      level: relationship.levelLabel || relationship.level,
      status: relationship.status,
      flags: relationship.flags || relationship.traits,
      recentMoments: relationship.recentMoments,
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
      scheduleNote: npc.scheduleNote || null,
      lastSeenDisposition: relationship.lastSeenDisposition || npc.lastSeenDisposition || "No prior disposition recorded.",
      relationshipToPlayer: {
        score: relationship.score,
        level: relationship.levelLabel || relationship.level,
        status: relationship.status,
        flags: relationship.flags || relationship.traits,
        recentMoments: relationship.recentMoments,
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
    `Calendar: ${currentCalendarText}`,
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
    const record = normalizeRelationshipRecord(relationships[npcId], { id: npcId });

    if (typeof change === "number") {
      record.score += change;
    } else if (change && typeof change === "object") {
      Object.assign(record, change);
      if (typeof change.delta === "number") {
        record.score += change.delta;
        delete record.delta;
      }
    }

    relationships[npcId] = normalizeRelationshipRecord(record, { id: npcId });
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
// DETERMINISTIC GAMEPLAY LOOP
// ============================================================================
//
// These helpers keep the prototype playable without binding the artifact to a
// specific LLM provider. When the live narrator is active, the same state shape
// and event log remain useful as its grounding context.

const MESSAGE_TEMPLATES = {
  check_in: "Hey. Still alive over there?",
  ask_about_day: "How's your day going?",
  invite_coffee: "Want to grab coffee sometime this week?",
};

const PULSE_REPLY_TEMPLATES = {
  studious: {
    check_in: "Still alive. Extremely caffeinated. You surviving first-week gravity?",
    ask_about_day: "Busy, but not tragic. The morning crowd was a lot. How's campus treating you?",
    invite_coffee: "Maybe. If you mean an actual coffee and not hovering at my counter while I work.",
  },
  roommate: {
    check_in: "Alive. Room still standing. I count that as a win.",
    ask_about_day: "Class, food, pretending to know where buildings are. Standard heroic journey.",
    invite_coffee: "Yeah, sure. Text me when you're heading that way.",
  },
  default: {
    check_in: "Still here. What's up?",
    ask_about_day: "A lot, honestly. How's yours?",
    invite_coffee: "Maybe. Send me a time and we'll see.",
  },
};

const BUZZ_FEED_ITEMS = [
  "Open mic sign-ups are live at the Student Union desk.",
  "Intramural teams are still short two runners.",
  "The library extended weekend hours for first-year advising.",
  "Someone posted a lost keyring notice near the dining hall.",
  "The bookstore is discounting used lab notebooks this week.",
  "A philosophy club flyer asks if a sandwich can be lonely.",
];

const LOCATION_HOURS = {
  dorm_room: { alwaysOpen: true },
  dorm_hallway: { alwaysOpen: true },
  walking_path: { alwaysOpen: true },
  quad: { open: timeChunk(6), close: timeChunk(22) },
  quad_night: { open: timeChunk(20), close: timeChunk(24) },
  library_main: { open: timeChunk(7), close: timeChunk(23) },
  library_stacks: { open: timeChunk(8), close: timeChunk(22) },
  lecture_hall: { open: timeChunk(7), close: timeChunk(18) },
  dining_hall: { open: timeChunk(7), close: timeChunk(21) },
  gym: { open: timeChunk(6), close: timeChunk(22) },
  student_union: { open: timeChunk(7), close: timeChunk(23) },
  coffee_shop: { open: timeChunk(7), close: timeChunk(20) },
  bar: { open: timeChunk(18), close: timeChunk(2) },
  bookstore: { open: timeChunk(9), close: timeChunk(19) },
  restaurant: { open: timeChunk(11), close: timeChunk(22) },
  townie_apartment: { open: timeChunk(9), close: timeChunk(23) },
  running_trail: { open: timeChunk(5), close: timeChunk(21) },
  park: { open: timeChunk(6), close: timeChunk(22) },
};

const BULLETIN_TEMPLATES = [
  { id: "open_mic", title: "Open mic sign-ups", body: "Student Union lounge, three-song limit, no experience required.", location: "student_union", dayOffset: 0, slot: timeChunk(19), kind: "social" },
  { id: "pickup_ball", title: "Pickup basketball", body: "Half-court games at the gym. Bring water and a flexible ego.", location: "gym", dayOffset: 1, slot: timeChunk(16), kind: "fitness" },
  { id: "research_workshop", title: "Research workshop", body: "Librarians are showing first-years how not to drown in databases.", location: "library_main", dayOffset: 2, slot: timeChunk(15, 30), kind: "study" },
  { id: "poetry_wall", title: "Poetry wall", body: "Anonymous lines going up outside the upper stacks all week.", location: "library_stacks", dayOffset: 1, slot: timeChunk(18), kind: "creative" },
  { id: "coffee_tasting", title: "Coffee tasting night", body: "A cheap way to learn why people argue about beans.", location: "coffee_shop", dayOffset: 3, slot: timeChunk(18, 30), kind: "social" },
  { id: "trail_cleanup", title: "Trail cleanup", body: "Morning volunteer crew on the creekside path.", location: "running_trail", dayOffset: 5, slot: timeChunk(9), kind: "campus" },
];

const BUZZ_POST_TEMPLATES = {
  scheduled: [
    "Heads up: {title} starts at {time} near {place}.",
    "{place} is getting traffic for {title} around {time}.",
  ],
  npc: [
    "{name} was spotted around {place}. Usual rhythm, slightly different expression.",
    "Campus orbit note: {name} seems to be spending time at {place}.",
  ],
  event: [
    "Someone's day just logged this: {event}",
    "Small campus ripple: {event}",
  ],
  bulletin: [
    "Flyer board says: {title}.",
    "New low-stakes plan material: {title} at {place}.",
  ],
};

const WAKE_ALARMS = [
  timeChunk(6, 30),
  timeChunk(7, 30),
  timeChunk(8, 30),
  timeChunk(9, 30),
  timeChunk(10, 30),
];

const STAT_LABELS = {
  charm: "Charm",
  sensitivity: "Sensitivity",
  knowledge: "Knowledge",
  athletics: "Athletics",
  grit: "Grit",
};

const RELATIONSHIP_LEVELS = [
  { id: "stranger", label: "Stranger", min: -999, max: 0, description: "They know of you, if that." },
  { id: "met", label: "Met", min: 1, max: 2, description: "There is a name and a first impression." },
  { id: "familiar", label: "Familiar", min: 3, max: 5, description: "Enough contact for small expectations to form." },
  { id: "friendly", label: "Friendly", min: 6, max: 9, description: "Warmth is becoming part of the pattern." },
  { id: "close", label: "Close", min: 10, max: 14, description: "They have reason to trust you with more than surface talk." },
  { id: "bonded", label: "Bonded", min: 15, max: 999, description: "This relationship has real weight in the semester." },
];

const RELATIONSHIP_FLAG_LABELS = {
  met: "Met",
  trust: "Trust",
  awkward: "Awkward",
  texting: "Texting",
  date_planned: "Date planned",
};

const INVENTORY_ITEMS = {
  notebook: { label: "Notebook", description: "Useful for class notes and study sessions." },
  granola_bar: { label: "Granola Bar", description: "Emergency food for a long day." },
  energy_drink: { label: "Energy Drink", description: "A short-term energy boost with questionable taste." },
  bus_ticket: { label: "Bus Ticket", description: "Covers one bus ride across campus or into town." },
};

const TRANSIT_MODES = {
  walk: { label: "Walk", moneyCost: 0, energyPerChunk: 1, timeFactor: 1, minChunks: 1 },
  bus: { label: "Bus", moneyCost: 2, ticketItem: "bus_ticket", energyPerChunk: 0, timeFactor: 0.55, minChunks: 1 },
  ride: { label: "Ride", moneyCost: 8, energyPerChunk: 0, timeFactor: 0.25, minChunks: 1 },
};

const ACTIVITY_DEFINITIONS = {
  study_deep: {
    label: "Focused study",
    groups: ["study"],
    stats: { knowledge: 4, grit: 1 },
    resources: { energy: -8 },
    event: "Studied seriously at the library.",
    gates: [
      { kind: "resource", key: "energy", min: 12, label: "Energy" },
      { kind: "stat", key: "grit", min: 25, label: "Grit" },
    ],
  },
  browse_stacks: {
    label: "Browsing the stacks",
    groups: ["study", "reflective"],
    stats: { knowledge: 2, sensitivity: 1 },
    event: "Wandered the library stacks and found a few promising books.",
  },
  workout_weights: {
    label: "Weight training",
    groups: ["fitness"],
    stats: { athletics: 4, grit: 2 },
    resources: { energy: -12 },
    event: "Lifted weights at the gym.",
    gates: [
      { kind: "resource", key: "energy", min: 18, label: "Energy" },
      { kind: "stat", key: "athletics", min: 20, label: "Athletics" },
    ],
  },
  workout_cardio: {
    label: "Cardio",
    groups: ["fitness"],
    stats: { athletics: 3, grit: 1 },
    resources: { energy: -10 },
    event: "Put in a cardio session at the gym.",
    gates: [
      { kind: "resource", key: "energy", min: 14, label: "Energy" },
      { kind: "stat", key: "athletics", min: 20, label: "Athletics" },
    ],
  },
  trail_run: {
    label: "Trail run",
    groups: ["fitness", "outdoors"],
    stats: { athletics: 3, grit: 1 },
    resources: { energy: -9 },
    event: "Ran the creekside trail.",
    gates: [
      { kind: "resource", key: "energy", min: 14, label: "Energy" },
      { kind: "stat", key: "athletics", min: 20, label: "Athletics" },
    ],
  },
  trail_walk: {
    label: "Thinking walk",
    groups: ["outdoors", "reflective"],
    stats: { sensitivity: 2, grit: 1 },
    event: "Took a long walk on the running trail.",
  },
  browse_flyers: {
    label: "Flyer board",
    groups: ["campus", "social"],
    stats: { charm: 1, knowledge: 1 },
    event: "Browsed the student union flyer board.",
    notification: { app: "Buzz", body: "A few campus events caught your eye." },
  },
  people_watch: {
    label: "People-watching",
    groups: ["campus", "social", "reflective"],
    stats: { sensitivity: 2, charm: 1 },
    event: "People-watched in the student union.",
  },
  drink_coffee: {
    label: "Coffee",
    groups: ["coffee", "self-care"],
    resources: { energy: 10, money: -3 },
    event: "Bought a coffee and took a minute to breathe.",
    gates: [{ kind: "resource", key: "money", min: 3, label: "Money" }],
  },
  buy_energy_drink: {
    label: "Energy drink",
    groups: ["self-care"],
    resources: { energy: 4, money: -4 },
    inventory: { energy_drink: 1 },
    event: "Bought an energy drink for later.",
    gates: [{ kind: "resource", key: "money", min: 4, label: "Money" }],
  },
  eat_meal: {
    label: "Real meal",
    groups: ["self-care"],
    resources: { energy: 18, money: -6 },
    event: "Ate a real meal at the dining hall.",
    gates: [{ kind: "resource", key: "money", min: 6, label: "Money" }],
  },
  grab_snack: {
    label: "Snack",
    groups: ["self-care"],
    resources: { energy: 7, money: -5 },
    inventory: { granola_bar: 1 },
    event: "Grabbed a snack and tucked one away for later.",
    gates: [{ kind: "resource", key: "money", min: 5, label: "Money" }],
  },
  sit_with_strangers: {
    label: "Small talk",
    groups: ["social"],
    stats: { charm: 2 },
    resources: { energy: 6 },
    event: "Sat near a busy table and made a little small talk.",
    gates: [{ kind: "stat", key: "charm", min: 25, label: "Charm" }],
  },
  browse_books: {
    label: "Book browsing",
    groups: ["study", "reflective"],
    stats: { knowledge: 2, sensitivity: 1 },
    event: "Browsed the back shelves at the bookstore.",
  },
  buy_supplies: {
    label: "Supplies",
    groups: ["prepared"],
    stats: { grit: 1 },
    resources: { money: -8 },
    inventory: { notebook: 1 },
    event: "Bought basic school supplies.",
    gates: [{ kind: "resource", key: "money", min: 8, label: "Money" }],
  },
  buy_bus_tickets: {
    label: "Bus tickets",
    groups: ["prepared"],
    resources: { money: -8 },
    inventory: { bus_ticket: 4 },
    event: "Bought a small packet of bus tickets.",
    gates: [{ kind: "resource", key: "money", min: 8, label: "Money" }],
  },
  bookstore_shift: {
    label: "Bookstore shift",
    groups: ["work", "prepared"],
    stats: { grit: 2 },
    resources: { money: 28, energy: -22 },
    event: "Worked a short shift at the bookstore.",
    gates: [
      { kind: "resource", key: "energy", min: 25, label: "Energy" },
      { kind: "stat", key: "grit", min: 25, label: "Grit" },
    ],
  },
  review_notes: {
    label: "Review notes",
    groups: ["study", "prepared"],
    stats: { knowledge: 3, grit: 1 },
    resources: { energy: -5 },
    event: "Reviewed class notes in the dorm room.",
    gates: [
      { kind: "resource", key: "energy", min: 8, label: "Energy" },
      { kind: "stat", key: "knowledge", min: 25, label: "Knowledge" },
    ],
  },
  tidy_room: {
    label: "Tidy room",
    groups: ["prepared", "self-care"],
    stats: { grit: 1 },
    resources: { energy: -3 },
    event: "Put the dorm room in better order.",
  },
  sit_window: {
    label: "Coffee shop study",
    groups: ["study", "coffee"],
    stats: { knowledge: 2 },
    resources: { energy: 5, money: -3 },
    event: "Studied for a while in the coffee shop window booth with a coffee.",
    gates: [{ kind: "resource", key: "money", min: 3, label: "Money" }],
  },
  chat_counter: {
    label: "Counter chat",
    groups: ["social", "coffee"],
    stats: { charm: 2, sensitivity: 1 },
    event: "Chatted with Mari at the coffee shop counter.",
    witnesses: ["studious"],
    gates: [{ kind: "stat", key: "charm", min: 25, label: "Charm" }],
    relationship: {
      npcId: "studious",
      delta: 1,
      status: "friendly",
      removeFlags: ["awkward"],
      lastSeenDisposition: "Warmer at the counter; willing to linger a little.",
      momentText: "Chatted with Mari at the coffee shop counter.",
    },
  },
};

const REPEATED_ACTIVITY_TRAITS = [
  { trait: "bookish", groups: ["study"], threshold: 3 },
  { trait: "gym regular", groups: ["fitness"], threshold: 3 },
  { trait: "campus-curious", groups: ["campus"], threshold: 2 },
  { trait: "socially game", groups: ["social"], threshold: 4 },
  { trait: "keeps it together", groups: ["prepared"], threshold: 3 },
  { trait: "takes care of himself", groups: ["self-care"], threshold: 3 },
  { trait: "coffee shop regular", groups: ["coffee"], threshold: 3 },
  { trait: "needs air to think", groups: ["outdoors"], threshold: 3 },
  { trait: "keeps a schedule", groups: ["work"], threshold: 2 },
];

function clampValue(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function relationshipScoreValue(record) {
  if (typeof record === "number") return record;
  if (typeof record === "string") {
    const parsed = Number(record);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (record && typeof record === "object") {
    const value = Number(record.score ?? record.value ?? record.affinity ?? 0);
    return Number.isFinite(value) ? value : 0;
  }
  return 0;
}

function getRelationshipLevel(score = 0) {
  return RELATIONSHIP_LEVELS.find(level => score >= level.min && score <= level.max) || RELATIONSHIP_LEVELS[0];
}

function normalizeRelationshipMoment(moment) {
  if (!moment) return null;
  if (typeof moment === "string") return { text: moment };
  if (typeof moment !== "object") return null;
  const text = moment.text || moment.summary || moment.label;
  if (!text) return null;
  return {
    day: moment.day,
    slot: moment.slot,
    text,
    kind: moment.kind || "shared",
  };
}

function normalizeRelationshipRecord(record, npc = {}) {
  const base = record && typeof record === "object" ? record : {};
  const score = relationshipScoreValue(record);
  const level = getRelationshipLevel(score);
  const flags = uniqueCompact([
    ...asArray(base.flags || base.traits || base.tags),
    ...(score >= 10 ? ["trust"] : []),
  ]);
  const moments = asArray(base.recentMoments || base.sharedMoments || base.moments)
    .map(normalizeRelationshipMoment)
    .filter(Boolean)
    .slice(-8);

  return {
    ...base,
    score,
    level: level.id,
    status: base.status || base.summary || base.label || (score > 0 ? "developing" : "no relationship record yet"),
    flags,
    recentMoments: moments,
    lastSeenDisposition: base.lastSeenDisposition || base.last_seen_disposition || base.disposition || npc.lastSeenDisposition || "No prior disposition recorded.",
  };
}

function normalizeRelationshipMap(relationships = {}) {
  return Object.fromEntries(
    Object.entries(relationships).map(([npcId, record]) => [npcId, normalizeRelationshipRecord(record, { id: npcId })])
  );
}

function makeRelationshipMoment(state, text, kind = "shared") {
  return { day: state.day, slot: state.timeSlot, text, kind };
}

function appendRelationshipMoment(record, moment) {
  const normalized = normalizeRelationshipMoment(moment);
  if (!normalized) return record.recentMoments || [];
  return [...(record.recentMoments || []), normalized].slice(-8);
}

function changeStats(state, changes) {
  const stats = { ...(state.player?.stats || {}) };
  for (const [stat, delta] of Object.entries(changes || {})) {
    if (typeof stats[stat] !== "number" || typeof delta !== "number") continue;
    stats[stat] = clampValue(stats[stat] + delta);
  }
  return { ...state, player: { ...state.player, stats } };
}

function changeResources(state, changes) {
  const resources = { ...(state.player?.resources || {}) };
  if (typeof changes?.energy === "number") resources.energy = clampValue((resources.energy || 0) + changes.energy);
  if (typeof changes?.money === "number") resources.money = Math.max(0, (resources.money || 0) + changes.money);
  return { ...state, player: { ...state.player, resources } };
}

function normalizeInventory(inventory = {}) {
  if (Array.isArray(inventory)) {
    return inventory.reduce((items, item) => {
      const id = typeof item === "string" ? item : item?.id;
      const qty = typeof item === "string" ? 1 : Number(item?.qty ?? item?.quantity ?? 1);
      if (!id || !Number.isFinite(qty) || qty <= 0) return items;
      return { ...items, [id]: (items[id] || 0) + qty };
    }, {});
  }

  if (!inventory || typeof inventory !== "object") return {};
  return Object.fromEntries(
    Object.entries(inventory)
      .map(([id, qty]) => [id, Math.max(0, Math.floor(Number(qty) || 0))])
      .filter(([, qty]) => qty > 0)
  );
}

function getInventoryQty(state, itemId) {
  return normalizeInventory(state.player?.inventory || {})[itemId] || 0;
}

function changeInventory(state, changes = {}) {
  const inventory = normalizeInventory(state.player?.inventory || {});
  for (const [itemId, delta] of Object.entries(changes || {})) {
    const nextQty = (inventory[itemId] || 0) + Number(delta || 0);
    if (nextQty > 0) inventory[itemId] = Math.floor(nextQty);
    else delete inventory[itemId];
  }
  return { ...state, player: { ...state.player, inventory } };
}

function changeRelationship(state, npcId, delta, status, details = {}) {
  const relationships = { ...(state.player?.relationships || {}) };
  const currentRecord = normalizeRelationshipRecord(relationships[npcId], { id: npcId });
  const nextScore = currentRecord.score + delta;
  const addFlags = uniqueCompact(details.addFlags || details.flags);
  const removeFlags = new Set(uniqueCompact(details.removeFlags).map(flag => String(flag).toLowerCase()));
  const flags = uniqueCompact([
    ...currentRecord.flags.filter(flag => !removeFlags.has(String(flag).toLowerCase())),
    ...addFlags,
    ...(nextScore >= 10 ? ["trust"] : []),
  ]);

  relationships[npcId] = {
    ...currentRecord,
    score: nextScore,
    level: getRelationshipLevel(nextScore).id,
    status: status || currentRecord.status || "developing",
    flags,
    recentMoments: details.moment
      ? appendRelationshipMoment(currentRecord, details.moment)
      : currentRecord.recentMoments,
    lastSeenDisposition: details.lastSeenDisposition || currentRecord.lastSeenDisposition,
  };

  return { ...state, player: { ...state.player, relationships } };
}

function addTrait(state, trait) {
  const traits = state.player?.traits || [];
  if (traits.includes(trait)) return state;
  return { ...state, player: { ...state.player, traits: [...traits, trait] } };
}

function normalizeActivityHistory(history = {}) {
  const source = history && typeof history === "object" ? history.activities || history : {};
  const activities = {};

  for (const [activityId, record] of Object.entries(source || {})) {
    if (!record || typeof record !== "object") continue;
    const recent = Array.isArray(record.recent)
      ? record.recent
        .filter(entry => entry && typeof entry === "object")
        .map(entry => ({
          day: typeof entry.day === "number" ? entry.day : 1,
          slot: normalizeTimeSlot(entry.slot),
          location: entry.location,
        }))
        .slice(-12)
      : [];
    activities[activityId] = {
      total: Number(record.total) || recent.length || 0,
      recent,
      label: record.label || ACTIVITY_DEFINITIONS[activityId]?.label || activityId,
    };
  }

  return { activities };
}

function countRecentActivity(state, activityId, dayWindow = 2) {
  const history = normalizeActivityHistory(state.activityHistory);
  const recent = history.activities[activityId]?.recent || [];
  const now = (state.day * CHUNKS_PER_DAY) + normalizeTimeSlot(state.timeSlot);
  const maxDistance = dayWindow * CHUNKS_PER_DAY;
  return recent.filter(entry => {
    const then = ((entry.day || 1) * CHUNKS_PER_DAY) + normalizeTimeSlot(entry.slot);
    const distance = now - then;
    return distance >= 0 && distance <= maxDistance;
  }).length;
}

function countActivityGroup(state, group) {
  const history = normalizeActivityHistory(state.activityHistory);
  return Object.entries(history.activities).reduce((total, [activityId, record]) => {
    const groups = ACTIVITY_DEFINITIONS[activityId]?.groups || [];
    return total + (groups.includes(group) ? (record.total || 0) : 0);
  }, 0);
}

function recordActivity(state, activityId, label) {
  const history = normalizeActivityHistory(state.activityHistory);
  const current = history.activities[activityId] || { total: 0, recent: [], label };
  const entry = { day: state.day, slot: state.timeSlot, location: state.location };
  return {
    ...state,
    activityHistory: {
      activities: {
        ...history.activities,
        [activityId]: {
          ...current,
          label: label || current.label || activityId,
          total: (current.total || 0) + 1,
          recent: [...(current.recent || []), entry].slice(-12),
        },
      },
    },
  };
}

function getDiminishingFactor(recentCount) {
  if (recentCount >= 2) return 0.5;
  if (recentCount >= 1) return 0.75;
  return 1;
}

function applyDiminishingReturns(changes, factor) {
  if (!changes || factor >= 1) return changes || {};
  return Object.fromEntries(Object.entries(changes).map(([key, delta]) => {
    if (typeof delta !== "number" || delta <= 0) return [key, delta];
    return [key, Math.max(1, Math.round(delta * factor))];
  }));
}

function getGateFailure(state, gates = []) {
  for (const gate of gates) {
    const current = gate.kind === "stat"
      ? state.player?.stats?.[gate.key]
      : state.player?.resources?.[gate.key];
    if (typeof current === "number" && current < gate.min) {
      return {
        ...gate,
        current,
        message: `${gate.label || gate.key} ${gate.min} needed; current ${current}.`,
      };
    }
  }
  return null;
}

function statResourceDiff(before, after) {
  const feedback = [];
  for (const [stat, label] of Object.entries(STAT_LABELS)) {
    const beforeValue = before.player?.stats?.[stat] || 0;
    const afterValue = after.player?.stats?.[stat] || 0;
    const delta = afterValue - beforeValue;
    if (delta) feedback.push(`${label} ${delta > 0 ? "+" : ""}${delta}`);
  }

  const resourceLabels = { energy: "Energy", money: "Money" };
  for (const [resource, label] of Object.entries(resourceLabels)) {
    const beforeValue = before.player?.resources?.[resource] || 0;
    const afterValue = after.player?.resources?.[resource] || 0;
    const delta = afterValue - beforeValue;
    if (delta) feedback.push(`${label} ${delta > 0 ? "+" : ""}${delta}`);
  }

  return feedback;
}

function inventoryDiff(before, after) {
  const feedback = [];
  const beforeInventory = normalizeInventory(before.player?.inventory || {});
  const afterInventory = normalizeInventory(after.player?.inventory || {});
  const itemIds = uniqueCompact([...Object.keys(beforeInventory), ...Object.keys(afterInventory)]);

  for (const itemId of itemIds) {
    const delta = (afterInventory[itemId] || 0) - (beforeInventory[itemId] || 0);
    if (!delta) continue;
    const label = INVENTORY_ITEMS[itemId]?.label || itemId;
    feedback.push(`${label} ${delta > 0 ? "+" : ""}${delta}`);
  }

  return feedback;
}

function applyRepeatedActivityTraits(state) {
  let next = state;
  const gained = [];
  const existing = new Set(state.player?.traits || []);

  for (const rule of REPEATED_ACTIVITY_TRAITS) {
    if (existing.has(rule.trait)) continue;
    const count = rule.groups.reduce((total, group) => total + countActivityGroup(next, group), 0);
    if (count >= rule.threshold) {
      next = addTrait(next, rule.trait);
      gained.push(rule.trait);
      existing.add(rule.trait);
    }
  }

  return { state: next, gained };
}

function buildActivityFeedback(before, after, traitGains = [], diminished = false) {
  const parts = [...statResourceDiff(before, after), ...inventoryDiff(before, after)];
  if (traitGains.length) parts.push(`Trait: ${traitGains.join(", ")}`);
  if (diminished) parts.push("repeated recently, gains softened");
  return parts.length ? parts.join("; ") : "No mechanical change.";
}

function getKnownNpc(state, key) {
  const directory = state.npcDirectory || {};
  return (
    directory[key] ||
    STARTER_NPCS[key] ||
    Object.values(directory).find(npc => npc.portraitKey === key || npc.id === key || npc.name === key) ||
    Object.values(STARTER_NPCS).find(npc => npc.portraitKey === key || npc.id === key) ||
    { id: key, name: key, portraitKey: key, role: "Contact" }
  );
}

function formatMoment(day = 1, slot = 0) {
  const safeDay = typeof day === "number" && day > 0 ? day : 1;
  const week = Math.floor((safeDay - 1) / 7) + 1;
  const dayName = DAY_LABELS[(safeDay - 1) % DAY_LABELS.length];
  const slotLabel = typeof slot === "number" ? formatTimeOfDay(slot) : slot;
  return `W${week} ${dayName} ${slotLabel}`;
}

function eventSummary(event) {
  return event?.text || event?.summary || event?.event_summary || event?.label || event?.kind || "Untitled event";
}

function noteMoment(note) {
  return formatMoment(note?.day, note?.slot);
}

function resolveActivity(state, choice, definition) {
  const gateFailure = getGateFailure(state, definition.gates);
  let next = recordActivity(state, choice.id, definition.label);

  if (gateFailure) {
    const text = `${definition.label}: ${gateFailure.message}`;
    next = appendEvent(next, `Tried ${definition.label.toLowerCase()}, but ${gateFailure.message.toLowerCase()}`);
    return {
      state: next,
      notification: { app: "Self", body: text },
    };
  }

  const before = next;
  const recentCount = countRecentActivity(state, choice.id);
  const diminishingFactor = getDiminishingFactor(recentCount);
  const statChanges = applyDiminishingReturns(definition.stats, diminishingFactor);

  if (definition.stats) next = changeStats(next, statChanges);
  if (definition.resources) next = changeResources(next, definition.resources);
  if (definition.inventory) next = changeInventory(next, definition.inventory);

  if (definition.relationship) {
    next = changeRelationship(next, definition.relationship.npcId, definition.relationship.delta, definition.relationship.status, {
      addFlags: definition.relationship.addFlags,
      removeFlags: definition.relationship.removeFlags,
      lastSeenDisposition: definition.relationship.lastSeenDisposition,
      moment: makeRelationshipMoment(next, definition.relationship.momentText || definition.event),
    });
  }

  const traitUpdate = applyRepeatedActivityTraits(next);
  next = traitUpdate.state;
  const feedback = buildActivityFeedback(before, next, traitUpdate.gained, diminishingFactor < 1);
  next = appendEvent(next, `${definition.event} Result: ${feedback}.`, definition.witnesses || []);

  const notification = definition.notification
    ? { app: definition.notification.app, body: `${definition.notification.body} ${feedback}` }
    : { app: "Self", body: feedback };

  return { state: next, notification };
}

function applyActivityOutcome(state, choice) {
  const definition = ACTIVITY_DEFINITIONS[choice.id];
  if (definition) return resolveActivity(state, choice, definition);

  if (choice.id === "leave") return { state: appendEvent(state, "Decided not to linger.") };
  return { state };
}

function getChoiceDurationChunks(choice) {
  const durations = {
    go_coffee: 2,
    explore: 4,
    unpack: 6,
    study_deep: 6,
    browse_stacks: 4,
    workout_weights: 6,
    workout_cardio: 5,
    trail_run: 4,
    trail_walk: 4,
    browse_flyers: 2,
    people_watch: 4,
    drink_coffee: 2,
    buy_energy_drink: 1,
    eat_meal: 3,
    grab_snack: 1,
    sit_with_strangers: 4,
    browse_books: 4,
    buy_supplies: 2,
    buy_bus_tickets: 1,
    bookstore_shift: 12,
    review_notes: 6,
    tidy_room: 4,
    sit_window: 6,
    chat_counter: 3,
    rest: 8,
    wait: 4,
    leave: 1,
  };
  return durations[choice?.id] || DEFAULT_ACTION_CHUNKS;
}

function getTravelDurationChunks(fromLocation, toLocation) {
  if (!fromLocation || !toLocation || fromLocation === toLocation) return 0;
  const fromCat = LOCATIONS[fromLocation]?.cat;
  const toCat = LOCATIONS[toLocation]?.cat;
  if (fromCat === "campus" && toCat === "campus") return 1;
  if (fromCat === toCat) return 2;
  if ((fromCat === "campus" && toCat === "town") || (fromCat === "town" && toCat === "campus")) return 2;
  return 3;
}

function getTravelPlan(state, locationKey, transitMode = "walk") {
  const mode = TRANSIT_MODES[transitMode] || TRANSIT_MODES.walk;
  const baseChunks = getTravelDurationChunks(state.location, locationKey);
  const chunks = baseChunks === 0 ? 0 : Math.max(mode.minChunks, Math.ceil(baseChunks * mode.timeFactor));
  const energyCost = Math.max(0, Math.ceil(chunks * mode.energyPerChunk));
  const hasTicket = mode.ticketItem && getInventoryQty(state, mode.ticketItem) > 0;
  const moneyCost = hasTicket ? 0 : mode.moneyCost;
  const inventoryCost = hasTicket ? { [mode.ticketItem]: -1 } : {};

  return {
    modeId: transitMode,
    modeLabel: mode.label,
    chunks,
    moneyCost,
    energyCost,
    inventoryCost,
    ticketItem: hasTicket ? mode.ticketItem : null,
  };
}

function canAffordTravel(state, plan) {
  if ((state.player?.resources?.money || 0) < plan.moneyCost) {
    return `Need $${plan.moneyCost} for ${plan.modeLabel.toLowerCase()}.`;
  }
  if ((state.player?.resources?.energy || 0) < plan.energyCost) {
    return `Need ${plan.energyCost} energy to ${plan.modeLabel.toLowerCase()}.`;
  }
  return null;
}

function describeTravelPlan(plan) {
  const parts = [formatDuration(plan.chunks)];
  if (plan.moneyCost) parts.push(`$${plan.moneyCost}`);
  if (plan.energyCost) parts.push(`${plan.energyCost} energy`);
  if (plan.ticketItem) parts.push(`${INVENTORY_ITEMS[plan.ticketItem]?.label || plan.ticketItem} -1`);
  return parts.join(" / ");
}

function getLocationHours(locationKey) {
  return LOCATION_HOURS[locationKey] || { open: timeChunk(7), close: timeChunk(22) };
}

function isSlotWithinHours(slot, hours) {
  if (!hours || hours.alwaysOpen) return true;
  const current = normalizeTimeSlot(slot);
  const open = normalizeTimeSlot(hours.open ?? 0);
  const closeRaw = hours.close ?? CHUNKS_PER_DAY;
  const close = closeRaw >= CHUNKS_PER_DAY ? CHUNKS_PER_DAY : normalizeTimeSlot(closeRaw);
  if (open === close) return true;
  if (open < close) return current >= open && current < close;
  return current >= open || current < close;
}

function isLocationOpenAt(state, locationKey, slot = state.timeSlot) {
  return isSlotWithinHours(slot, getLocationHours(locationKey));
}

function formatLocationHours(locationKey) {
  const hours = getLocationHours(locationKey);
  if (hours.alwaysOpen) return "always open";
  return `${formatClockTime(hours.open)}-${formatClockTime(hours.close)}`;
}

function describeLocationOpenState(state, locationKey) {
  const open = isLocationOpenAt(state, locationKey);
  return open ? "open" : "closed";
}

function navigateToLocation(state, locationKey, transitMode = "walk") {
  if (state.location === locationKey) return { state };
  const destination = LOCATIONS[locationKey]?.label || locationKey;
  if (!isLocationOpenAt(state, locationKey)) {
    const hours = formatLocationHours(locationKey);
    return {
      state: appendEvent(state, `Could not travel to ${destination}: closed (${hours}).`),
      notification: { app: "Compass", body: `${destination} is closed right now (${hours}).` },
    };
  }
  const plan = getTravelPlan(state, locationKey, transitMode);
  const failure = canAffordTravel(state, plan);
  if (failure) {
    return {
      state: appendEvent(state, `Could not travel to ${destination}: ${failure}`),
      notification: { app: "Self", body: failure },
    };
  }

  let next = state;
  if (plan.moneyCost || plan.energyCost) next = changeResources(next, { money: -plan.moneyCost, energy: -plan.energyCost });
  if (Object.keys(plan.inventoryCost).length) next = changeInventory(next, plan.inventoryCost);
  next = advanceTime(appendEvent(next, `${plan.modeLabel} to ${destination} (${describeTravelPlan(plan)})`), plan.chunks);
  return { state: { ...next, location: locationKey } };
}

function applyChoice(state, choice) {
  let next = advanceTime(appendEvent(state, `Chose: ${choice.label}`), getChoiceDurationChunks(choice));
  let notification = null;

  if (choice.tag === "intro_complete") next = { ...next, introSeen: true };

  if (choice.tag === "met_mari" || choice.tag === "met_mari_quiet") {
    next = appendEvent(next, "Met Mari at the coffee shop.", ["studious"]);
    next = {
      ...next,
      metMari: true,
      npcsKnown: next.npcsKnown.includes("studious") ? next.npcsKnown : [...next.npcsKnown, "studious"],
    };
    next = changeRelationship(next, "studious", 1, choice.tag === "met_mari_quiet" ? "met, reserved" : "met", {
      addFlags: choice.tag === "met_mari_quiet" ? ["met", "awkward"] : ["met", "texting"],
      moment: makeRelationshipMoment(next, "Met Mari at the coffee shop."),
      lastSeenDisposition: choice.tag === "met_mari_quiet" ? "Professionally polite; not unfriendly, but not drawn in yet." : "Professionally warm and curious.",
    });
    notification = { app: "Pulse", body: "Mari saved your number." };
  }

  if (choice.id === "go_coffee") next = { ...next, location: "coffee_shop" };
  if (choice.id === "explore") next = { ...next, location: "quad" };

  if (choice.id === "rest" || choice.id === "wait") {
    next = changeResources(next, { energy: 8 });
  }

  const activityUpdate = applyActivityOutcome(next, choice);
  return {
    state: activityUpdate.state,
    notification: activityUpdate.notification || notification,
  };
}

function sendPulseMessage(state, npcId, templateId) {
  const npc = getKnownNpc(state, npcId);
  const text = MESSAGE_TEMPLATES[templateId] || MESSAGE_TEMPLATES.check_in;
  const idSeed = `${state.day}-${state.timeSlot}-${npcId}-${templateId}-${Date.now()}`;
  const replyDelay = getPulseReplyDelay(state, npcId, templateId);
  const due = addChunksToMoment(state.day, state.timeSlot, replyDelay);
  const outgoing = {
    id: `${idSeed}-out`,
    day: state.day,
    slot: state.timeSlot,
    npcId,
    direction: "outgoing",
    text,
    read: true,
  };
  const pending = {
    id: `${idSeed}-in`,
    day: state.day,
    slot: state.timeSlot,
    dueDay: due.day,
    dueSlot: due.slot,
    npcId,
    direction: "incoming",
    text: getScriptedPulseReply(npc, templateId),
    read: false,
  };

  let next = appendEvent(
    {
      ...state,
      messages: [...(state.messages || []), outgoing],
      pendingMessages: [...(state.pendingMessages || []), pending],
    },
    `Texted ${npc?.name || npcId}: ${text}`,
    [npcId],
  );
  next = changeRelationship(next, npcId, templateId === "invite_coffee" ? 2 : 1, "texting", {
    addFlags: templateId === "invite_coffee" ? ["texting", "date_planned"] : ["texting"],
    moment: makeRelationshipMoment(next, `Texted ${npc?.name || npcId}: ${text}`, "message"),
    lastSeenDisposition: templateId === "invite_coffee" ? "Open to making plans by text." : "Responsive by text.",
  });

  return {
    state: next,
    notification: { app: "Pulse", body: `Message sent. Reply expected around ${formatClockTime(due.slot)}.` },
  };
}

function getScriptedPulseReply(npc, templateId) {
  const npcId = npc?.id || "default";
  const templates = PULSE_REPLY_TEMPLATES[npcId] || PULSE_REPLY_TEMPLATES.default;
  return templates[templateId] || templates.check_in || PULSE_REPLY_TEMPLATES.default.check_in;
}

function getPulseReplyDelay(state, npcId, templateId) {
  const seed = `${state.day}-${state.timeSlot}-${npcId}-${templateId}`
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 2 + (seed % 7); // 30-120 minutes in quarter-hour chunks.
}

function processPendingMessages(state) {
  const pending = state.pendingMessages || [];
  if (!pending.length) return { state };
  const now = absoluteMoment(state.day, state.timeSlot);
  const due = pending.filter(message => absoluteMoment(message.dueDay, message.dueSlot) <= now);
  if (!due.length) return { state };

  const delivered = due.map(message => ({
    ...message,
    day: state.day,
    slot: state.timeSlot,
    dueDay: undefined,
    dueSlot: undefined,
  }));
  let next = {
    ...state,
    pendingMessages: pending.filter(message => absoluteMoment(message.dueDay, message.dueSlot) > now),
    messages: [...(state.messages || []), ...delivered],
  };

  for (const message of due) {
    const npc = getKnownNpc(next, message.npcId);
    next = appendEvent(next, `${npc?.name || message.npcId} replied in Pulse.`, [message.npcId]);
    next = changeRelationship(next, message.npcId, 0, "texting", {
      addFlags: ["texting"],
      moment: makeRelationshipMoment(next, `${npc?.name || message.npcId} replied: ${message.text}`, "message"),
      lastSeenDisposition: "Responsive by text.",
    });
  }

  const firstNpc = getKnownNpc(next, due[0].npcId);
  return {
    state: next,
    notification: {
      app: "Pulse",
      body: due.length === 1 ? `${firstNpc?.name || due[0].npcId} replied.` : `${due.length} new replies.`,
    },
  };
}

function markPulseThreadRead(state, npcId) {
  return {
    ...state,
    messages: (state.messages || []).map(message => (
      message.npcId === npcId && message.direction === "incoming"
        ? { ...message, read: true }
        : message
    )),
  };
}

function getUnreadCount(state, npcId = null) {
  return (state.messages || []).filter(message => (
    message.direction === "incoming" &&
    !message.read &&
    (!npcId || message.npcId === npcId)
  )).length;
}

function bulletinBoardKey(state) {
  const moment = getCalendarMoment(state);
  return `w${moment.week}-d${moment.dayIndex}`;
}

function generateBulletinItems(state) {
  const key = bulletinBoardKey(state);
  const moment = getCalendarMoment(state);
  const startIndex = (moment.week + moment.dayIndex) % BULLETIN_TEMPLATES.length;
  return [0, 1, 2].map(index => {
    const template = BULLETIN_TEMPLATES[(startIndex + index) % BULLETIN_TEMPLATES.length];
    const target = addChunksToMoment(state.day + (template.dayOffset || 0), template.slot || timeChunk(18), 0);
    return {
      ...template,
      id: `${key}-${template.id}`,
      boardKey: key,
      day: target.day,
      slot: target.slot,
    };
  });
}

function getBulletinItems(state) {
  const key = bulletinBoardKey(state);
  const cached = state.bulletinBoards?.[key];
  return Array.isArray(cached) && cached.length ? cached : generateBulletinItems(state);
}

function ensureBulletinBoard(state) {
  const key = bulletinBoardKey(state);
  if (Array.isArray(state.bulletinBoards?.[key]) && state.bulletinBoards[key].length) return state;
  return {
    ...state,
    bulletinBoards: {
      ...(state.bulletinBoards || {}),
      [key]: generateBulletinItems(state),
    },
  };
}

function commitToBulletin(state, flyerId) {
  const withBoard = ensureBulletinBoard(state);
  const flyer = getBulletinItems(withBoard).find(item => item.id === flyerId);
  if (!flyer) return { state: withBoard };
  const already = (withBoard.commitments || []).some(commitment => commitment.sourceId === flyer.id);
  if (already) {
    return {
      state: withBoard,
      notification: { app: "Anthrop", body: `${flyer.title} is already on your radar.` },
    };
  }

  const commitment = {
    id: `commit-${flyer.id}`,
    sourceId: flyer.id,
    source: "bulletin",
    title: flyer.title,
    body: flyer.body,
    kind: flyer.kind,
    location: flyer.location,
    day: flyer.day,
    slot: flyer.slot,
    done: false,
  };
  let next = {
    ...withBoard,
    commitments: [...(withBoard.commitments || []), commitment],
  };
  next = appendEvent(next, `Committed to check out ${flyer.title}.`);
  return {
    state: next,
    notification: { app: "Anthrop", body: `${flyer.title} added as an active lead.` },
  };
}

function fillBuzzTemplate(template, data) {
  return String(template || "").replace(/\{(\w+)\}/g, (_, key) => data[key] ?? "");
}

function makeBuzzPost(state, source, text, details = {}) {
  return {
    id: `${source}-${details.id || state.day}-${state.timeSlot}-${details.index || 0}`,
    day: details.day ?? state.day,
    slot: details.slot ?? state.timeSlot,
    dayKey: details.dayKey || `d${details.day ?? state.day}`,
    author: details.author || "Campus Buzz",
    source,
    text,
    location: details.location || state.location,
    relatedId: details.relatedId,
  };
}

function generateDailyBuzzPosts(state) {
  const moment = getCalendarMoment(state);
  const dayKey = `w${moment.week}-d${moment.dayIndex}`;
  const posts = [];
  const scheduled = getTodayCalendarItems(state).filter(item => (item.end ?? item.slot + 1) >= state.timeSlot).slice(0, 2);
  scheduled.forEach((item, index) => {
    const template = BUZZ_POST_TEMPLATES.scheduled[index % BUZZ_POST_TEMPLATES.scheduled.length];
    posts.push(makeBuzzPost(state, "scheduled", fillBuzzTemplate(template, {
      title: item.title,
      time: formatClockTime(item.slot),
      place: LOCATIONS[item.location]?.label || item.location,
    }), { id: item.id, index, dayKey, day: item.day || state.day, slot: item.slot, location: item.location, relatedId: item.id }));
  });

  getBulletinItems(state).slice(0, 2).forEach((flyer, index) => {
    const template = BUZZ_POST_TEMPLATES.bulletin[index % BUZZ_POST_TEMPLATES.bulletin.length];
    posts.push(makeBuzzPost(state, "bulletin", fillBuzzTemplate(template, {
      title: flyer.title,
      place: LOCATIONS[flyer.location]?.label || flyer.location,
    }), { id: flyer.id, index: index + 10, dayKey, day: state.day, slot: state.timeSlot, location: flyer.location, relatedId: flyer.id }));
  });

  getNpcPresenceAtLocation(state, state.location, getNpcDirectory(state)).slice(0, 1).forEach((npc, index) => {
    const template = BUZZ_POST_TEMPLATES.npc[index % BUZZ_POST_TEMPLATES.npc.length];
    posts.push(makeBuzzPost(state, "npc", fillBuzzTemplate(template, {
      name: npc.name || npc.id,
      place: LOCATIONS[state.location]?.label || state.location,
    }), { id: npc.id, index: index + 20, dayKey, location: state.location, relatedId: npc.id, author: "Seen Around" }));
  });

  const recentEvent = (state.eventLog || []).slice(-1)[0];
  if (recentEvent) {
    const template = BUZZ_POST_TEMPLATES.event[0];
    posts.push(makeBuzzPost(state, "event", fillBuzzTemplate(template, {
      event: eventSummary(recentEvent),
    }), { id: `event-${recentEvent.day}-${recentEvent.slot}`, index: 30, dayKey, day: recentEvent.day, slot: recentEvent.slot, location: state.location }));
  }

  return posts.slice(0, 5);
}

function processDailyBuzz(state) {
  const moment = getCalendarMoment(state);
  const dayKey = `w${moment.week}-d${moment.dayIndex}`;
  if ((state.buzzPosts || []).some(post => post.dayKey === dayKey)) return { state };
  const generated = generateDailyBuzzPosts(state).map(post => ({ ...post, dayKey }));
  return {
    state: {
      ...state,
      buzzPosts: [...(state.buzzPosts || []), ...generated].slice(-80),
    },
  };
}

function getBuzzFeed(state) {
  const stored = state.buzzPosts || [];
  const fallback = stored.length ? [] : generateDailyBuzzPosts(state);
  return [...stored, ...fallback]
    .sort((a, b) => absoluteMoment(b.day, b.slot) - absoluteMoment(a.day, a.slot))
    .slice(0, 8);
}

function getUpcomingCommitments(state, limit = 6) {
  const now = absoluteMoment(state.day, state.timeSlot);
  return (state.commitments || [])
    .filter(commitment => !commitment.done && absoluteMoment(commitment.day, commitment.slot) >= now)
    .sort((a, b) => absoluteMoment(a.day, a.slot) - absoluteMoment(b.day, b.slot))
    .slice(0, limit);
}

function getLastContactMoment(state, npcId) {
  const messageMoments = (state.messages || [])
    .filter(message => message.npcId === npcId)
    .map(message => ({ day: message.day, slot: message.slot, text: message.text, kind: "message" }));
  const relationship = normalizeRelationshipRecord(state.player?.relationships?.[npcId], getKnownNpc(state, npcId));
  const relationshipMoments = relationship.recentMoments || [];
  const witnessed = (state.eventLog || [])
    .filter(event => asArray(event.witnesses).includes(npcId))
    .map(event => ({ day: event.day, slot: event.slot, text: eventSummary(event), kind: "event" }));
  return [...messageMoments, ...relationshipMoments, ...witnessed]
    .filter(moment => typeof moment.day === "number")
    .sort((a, b) => absoluteMoment(b.day, b.slot) - absoluteMoment(a.day, a.slot))[0] || null;
}

function getNeglectedContacts(state) {
  const now = absoluteMoment(state.day, state.timeSlot);
  return (state.npcsKnown || [])
    .map(npcId => {
      const npc = getKnownNpc(state, npcId);
      const last = getLastContactMoment(state, npcId);
      const ageChunks = last ? now - absoluteMoment(last.day, last.slot) : CHUNKS_PER_DAY * 7;
      return { npc, last, ageChunks };
    })
    .filter(item => item.ageChunks >= CHUNKS_PER_DAY * 2)
    .sort((a, b) => b.ageChunks - a.ageChunks);
}

function getRecentSignificantMoments(state, limit = 6) {
  const relationshipMoments = Object.entries(state.player?.relationships || {}).flatMap(([npcId, record]) => {
    const npc = getKnownNpc(state, npcId);
    return (normalizeRelationshipRecord(record, npc).recentMoments || []).map(moment => ({
      ...moment,
      label: `${npc.name || npcId}: ${moment.text}`,
    }));
  });
  const eventMoments = (state.eventLog || [])
    .filter(event => asArray(event.witnesses).length || /met|replied|committed|result/i.test(eventSummary(event)))
    .map(event => ({ day: event.day, slot: event.slot, label: eventSummary(event) }));
  return [...relationshipMoments, ...eventMoments]
    .filter(moment => typeof moment.day === "number")
    .sort((a, b) => absoluteMoment(b.day, b.slot) - absoluteMoment(a.day, a.slot))
    .slice(0, limit);
}

function getAnthropLeads(state) {
  const leads = [];
  const unread = getUnreadCount(state);
  const commitments = getUpcomingCommitments(state, 3);
  const currentRequired = getCurrentCalendarItems(state).filter(item => item.required);
  const presentHere = getNpcPresenceAtLocation(state, state.location, getNpcDirectory(state));
  if (unread) leads.push({ id: "unread", title: `${unread} unread Pulse message${unread === 1 ? "" : "s"}`, detail: "Texting is live enough to decay if ignored." });
  currentRequired.forEach(item => leads.push({ id: `class-${item.id}`, title: item.title, detail: `Happening now at ${LOCATIONS[item.location]?.label || item.location}.` }));
  commitments.forEach(item => leads.push({ id: item.id, title: item.title, detail: `${formatMoment(item.day, item.slot)} at ${LOCATIONS[item.location]?.label || item.location}.` }));
  presentHere.forEach(npc => leads.push({ id: `npc-${npc.id}`, title: `${npc.name || npc.id} is here`, detail: npc.scheduleNote || "A possible in-person beat." }));
  if ((state.player?.resources?.energy || 0) < 25) leads.push({ id: "energy", title: "Energy is low", detail: "Wake, food, or coffee will matter before heavier plans." });
  return leads.slice(0, 6);
}

function setWakeAlarm(state, alarmSlot) {
  return {
    ...state,
    wake: {
      ...(state.wake || {}),
      alarmSlot: normalizeTimeSlot(alarmSlot),
    },
  };
}

function getMissedScheduleItemsBetween(state, targetDay, targetSlot) {
  const start = absoluteMoment(state.day, state.timeSlot);
  const end = absoluteMoment(targetDay, targetSlot);
  const missed = [];
  for (let day = state.day; day <= targetDay; day += 1) {
    for (const item of getTodayCalendarItems(state, day)) {
      const itemStart = absoluteMoment(day, item.slot);
      const itemEnd = absoluteMoment(day, item.end ?? item.slot + 1);
      if (item.required && itemEnd > start && itemStart < end) {
        missed.push({
          id: `${item.id}-${day}-${item.slot}`,
          title: item.title,
          location: item.location,
          day,
          slot: item.slot,
        });
      }
    }
  }
  return missed;
}

function sleepUntilAlarm(state, alarmSlot = state.wake?.alarmSlot) {
  const requestedSlot = normalizeTimeSlot(alarmSlot ?? timeChunk(7, 30));
  const currentSlot = normalizeTimeSlot(state.timeSlot);
  let targetDay = currentSlot < requestedSlot ? state.day : state.day + 1;
  let targetSlot = requestedSlot;
  const exhausted = (state.player?.resources?.energy || 0) < 20;
  if (exhausted) {
    const overslept = addChunksToMoment(targetDay, targetSlot, 2);
    targetDay = overslept.day;
    targetSlot = overslept.slot;
  }

  const chunks = Math.max(1, absoluteMoment(targetDay, targetSlot) - absoluteMoment(state.day, state.timeSlot));
  const missed = getMissedScheduleItemsBetween(state, targetDay, targetSlot);
  let next = advanceTime(state, chunks);
  const energyGain = Math.min(100, Math.round(chunks * 2.4) + (exhausted ? 8 : 0));
  next = changeResources(next, { energy: energyGain });
  next = {
    ...next,
    wake: {
      ...(next.wake || {}),
      alarmSlot: requestedSlot,
      lastSleep: { day: state.day, slot: state.timeSlot, wakeDay: next.day, wakeSlot: next.timeSlot, chunks, exhausted },
    },
    missedBlocks: [...(next.missedBlocks || []), ...missed].slice(-20),
  };
  next = appendEvent(next, `Slept until ${formatClockTime(next.timeSlot)}. Energy restored by ${energyGain}.`);
  if (missed.length) {
    next = appendEvent(next, `Missed ${missed.map(item => item.title).join(", ")} while sleeping.`);
  }

  return {
    state: next,
    notification: {
      app: "Wake",
      body: missed.length
        ? `Woke at ${formatClockTime(next.timeSlot)} and missed ${missed.length} required block${missed.length === 1 ? "" : "s"}.`
        : `Woke at ${formatClockTime(next.timeSlot)}. Energy is ${next.player.resources.energy}/100.`,
    },
  };
}

function processTimedSystems(state) {
  let next = ensureBulletinBoard(state);
  const buzz = processDailyBuzz(next);
  next = buzz.state;
  const pulse = processPendingMessages(next);
  next = pulse.state;
  return {
    state: normalizeState(next),
    notification: pulse.notification || buzz.notification,
  };
}

function addMarginNote(state, text, meta = {}) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return { state };
  const currentCalendarItems = getCurrentCalendarItems(state);
  const presentNpcs = getNpcPresenceAtLocation(state, state.location, getNpcDirectory(state));
  const recentEvent = (state.eventLog || []).slice(-1)[0];
  const locationLabel = LOCATIONS[state.location]?.label || state.location;

  const note = {
    id: `${state.day}-${state.timeSlot}-${Date.now()}`,
    day: state.day,
    slot: state.timeSlot,
    location: state.location,
    locationLabel,
    context: meta.context || currentCalendarItems.map(item => item.title).join(", ") || locationLabel,
    calendarIds: currentCalendarItems.map(item => item.id),
    npcIds: presentNpcs.map(npc => npc.id),
    event: recentEvent ? eventSummary(recentEvent) : null,
    tags: uniqueCompact([
      locationLabel,
      ...currentCalendarItems.map(item => item.kind || item.title),
      ...presentNpcs.map(npc => npc.name || npc.id),
      ...asArray(meta.tags),
    ]),
    text: trimmed,
  };

  return {
    state: {
      ...appendEvent(state, "Added a note in Margin."),
      notes: [...(state.notes || []), note],
    },
  };
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
// SCRIPTED SCENES
// ============================================================================
//
// The narrator harness is where prompt iteration happens. This scripted scene
// set exists so the playable artifact has something to do without LLM calls.
// Replace or supplement this module when the live narration loop comes online.

function getScriptedScene(state) {
  const { location, day, timeSlot, metMari, introSeen } = state;

  if (location === "dorm_room" && !introSeen) {
    return {
      narration: "First morning. The boxes you didn't unpack last night are still where you left them. Your roommate Marcus is gone. There's a note on the fridge in handwriting that's somehow already familiar: \"coffee shop down the street is good. back by noon.\" The room is too quiet.",
      choices: [
        { id: "go_coffee",  label: "Head to the coffee shop",   tag: "intro_complete" },
        { id: "unpack",     label: "Stay in and unpack",         tag: "intro_complete" },
        { id: "explore",    label: "Walk the campus a bit",      tag: "intro_complete" },
      ],
    };
  }

  if (location === "coffee_shop" && !metMari) {
    return {
      narration: "The bell above the door chimes. The shop smells like good coffee and old wood. Behind the counter, a barista with copper hair glances up, registers new face, and gives you a half-smile that's mostly professional with a little curiosity underneath. \"What can I get you?\"",
      choices: [
        { id: "order_drip",   label: "\"Just a drip coffee, please.\"", tag: "met_mari" },
        { id: "order_fancy",  label: "\"What do you recommend?\"",       tag: "met_mari" },
        { id: "look_around",  label: "Stall and read the menu",          tag: "met_mari_quiet" },
      ],
    };
  }

  if (location === "coffee_shop" && metMari) {
    return {
      narration: "The shop is quieter this time. Mari spots you, gives a small nod from behind the espresso machine. The same booth by the window is open.",
      choices: [
        { id: "drink_coffee",  label: "Buy a coffee and breathe" },
        { id: "sit_window",   label: "Take the window booth and study" },
        { id: "chat_counter", label: "Lean on the counter and chat" },
        { id: "leave",        label: "Just grab something to go" },
      ],
    };
  }

  if (location === "library_main" || location === "library_stacks") {
    return {
      narration: "The library lowers its voice around you. Laptops glow between stacks of books, and every table has the same quiet bargain with time.",
      choices: [
        { id: "study_deep",    label: "Settle in for focused study" },
        { id: "browse_stacks", label: "Wander the stacks" },
        { id: "leave",         label: "Pack up and move on" },
      ],
    };
  }

  if (location === "gym") {
    return {
      narration: "The gym is all rubber floor, metal rhythm, and people pretending not to check whether anyone is watching their form.",
      choices: [
        { id: "workout_weights", label: "Lift for a while" },
        { id: "workout_cardio",  label: "Use the cardio machines" },
        { id: "leave",           label: "Head back out" },
      ],
    };
  }

  if (location === "running_trail") {
    return {
      narration: "The trail follows the creek through a strip of green that makes campus feel farther away than it is.",
      choices: [
        { id: "trail_run",  label: "Go for a run" },
        { id: "trail_walk", label: "Take a thinking walk" },
        { id: "leave",      label: "Turn back toward campus" },
      ],
    };
  }

  if (location === "student_union") {
    return {
      narration: "The student union is busy in layers: club tables near the doors, people waiting for food, someone laughing too loudly by the bulletin board.",
      choices: [
        { id: "browse_flyers", label: "Browse the flyer board" },
        { id: "people_watch",  label: "People-watch from a couch" },
        { id: "buy_bus_tickets", label: "Buy bus tickets" },
        { id: "buy_energy_drink", label: "Buy an energy drink" },
        { id: "leave",         label: "Cut through and leave" },
      ],
    };
  }

  if (location === "dining_hall") {
    return {
      narration: "The dining hall hums with trays, half-finished conversations, and the practical relief of food you do not have to cook.",
      choices: [
        { id: "eat_meal",           label: "Eat a real meal" },
        { id: "grab_snack",         label: "Grab a snack for later" },
        { id: "sit_with_strangers", label: "Sit near a busy table" },
        { id: "leave",              label: "Take something to go" },
      ],
    };
  }

  if (location === "bookstore") {
    return {
      narration: "The bookstore smells like paper, dust, and branded sweatshirts. The course texts are up front, but the better shelves wait in back.",
      choices: [
        { id: "browse_books", label: "Browse the back shelves" },
        { id: "buy_supplies", label: "Buy basic supplies" },
        { id: "bookstore_shift", label: "Work a short shift" },
        { id: "leave",        label: "Head back outside" },
      ],
    };
  }

  if (location === "dorm_room" && introSeen) {
    return {
      narration: "Your room is starting to look less like a storage unit and more like a place you might actually sleep. The quiet is useful, if you can keep from wasting it.",
      choices: [
        { id: "review_notes", label: "Review class notes" },
        { id: "rest",         label: "Rest for a while" },
        { id: "tidy_room",    label: "Put the room in order" },
      ],
    };
  }

  const loc = LOCATIONS[location];
  const partOfDay = getDaypartLabel(timeSlot).toLowerCase();
  return {
    narration: `${loc?.label || "Here"}. ${partOfDay}, day ${day}. The semester keeps moving around you.`,
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
  const moment = getCalendarMoment(state);
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
      <span style={{ color: PAL.accent }}>Week {moment.week}</span>
      <span style={{ color: PAL.inkSoft }}>·</span>
      <span style={{ color: PAL.inkDim }}>{moment.dayName}</span>
      <span style={{ color: PAL.inkSoft }}>·</span>
      <span style={{ color: PAL.inkDim }}>{moment.slotLabel}</span>
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
  const time = formatClockTime(state.timeSlot);
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
        {APPS.map(app => {
          const badge = app.id === "pulse" ? getUnreadCount(state) : 0;
          return (
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
                position: "relative",
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
                {badge > 0 && (
                  <span style={{
                    position: "absolute",
                    top: 3,
                    right: 3,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 999,
                    background: "#c8a165",
                    color: "#1a1814",
                    fontSize: 9,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.78)",
                  }}>
                    {badge}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: 9, color: "#3a3530",
                fontFamily: "system-ui, sans-serif", fontWeight: 500,
                letterSpacing: 0.2,
              }}>{app.label}</span>
            </button>
          );
        })}
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

function CompassApp({ state, onBack, onNavigate, onCommitBulletin }) {
  // Landscape map view
  const [transitMode, setTransitMode] = useState("walk");
  const groups = [
    { label: "Campus", cat: "campus" },
    { label: "Town",    cat: "town" },
    { label: "Outdoor", cat: "outdoor" },
  ];
  const here = state.location;
  const directory = getNpcDirectory(state);
  const bulletinItems = state.location === "student_union" ? getBulletinItems(state) : [];
  const upcomingCommitments = getUpcomingCommitments(state, 8);

  return (
    <AppShell title="Compass" onBack={onBack} dark>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 10,
      }}>
        <div style={{ color: "#c8a165", fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase", fontWeight: 700 }}>
          Transit
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {Object.entries(TRANSIT_MODES).map(([modeId, mode]) => {
            const active = transitMode === modeId;
            return (
              <button
                type="button"
                key={modeId}
                onClick={() => setTransitMode(modeId)}
                style={{
                  padding: "5px 8px",
                  borderRadius: 999,
                  border: `1px solid ${active ? "rgba(200,161,101,0.58)" : "rgba(240,235,220,0.14)"}`,
                  background: active ? "rgba(200,161,101,0.18)" : "rgba(240,235,220,0.04)",
                  color: active ? "#c8a165" : "#f0ebdc",
                  fontSize: 10,
                  cursor: "pointer",
                }}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>
      {bulletinItems.length > 0 && (
        <PhoneSection title="Student Union Bulletin Board" dark>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
            {bulletinItems.map(item => {
              const committed = upcomingCommitments.some(commitment => commitment.sourceId === item.id);
              return (
                <article key={item.id} style={{
                  border: "1px solid rgba(240,235,220,0.10)",
                  borderRadius: 8,
                  padding: 9,
                  background: "rgba(200,161,101,0.08)",
                  minHeight: 116,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}>
                  <div style={{ color: "#f0ebdc", fontSize: 12, fontWeight: 700, lineHeight: 1.25 }}>{item.title}</div>
                  <p style={{ margin: 0, color: "rgba(240,235,220,0.70)", fontSize: 10, lineHeight: 1.35, flex: 1 }}>{item.body}</p>
                  <div style={{ color: "#c8a165", fontSize: 9 }}>
                    {formatMoment(item.day, item.slot)} · {LOCATIONS[item.location]?.label || item.location}
                  </div>
                  <button
                    type="button"
                    onClick={() => onCommitBulletin?.(item.id)}
                    disabled={committed}
                    style={{
                      border: `1px solid ${committed ? "rgba(240,235,220,0.10)" : "rgba(200,161,101,0.42)"}`,
                      background: committed ? "rgba(240,235,220,0.04)" : "rgba(200,161,101,0.18)",
                      color: committed ? "rgba(240,235,220,0.50)" : "#f0ebdc",
                      borderRadius: 6,
                      padding: "5px 6px",
                      fontSize: 10,
                      cursor: committed ? "default" : "pointer",
                    }}
                  >
                    {committed ? "On radar" : "Track"}
                  </button>
                </article>
              );
            })}
          </div>
        </PhoneSection>
      )}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14,
        minHeight: 300,
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
                  const travelPlan = getTravelPlan(state, key, transitMode);
                  const travelFailure = !isHere ? canAffordTravel(state, travelPlan) : null;
                  const isOpen = isLocationOpenAt(state, key);
                  const npcHits = getNpcPresenceAtLocation(state, key, directory);
                  const calendarHits = getCalendarItemsAtLocation(state, key);
                  const disabled = isHere || !isOpen || Boolean(travelFailure);
                  const hasIndicators = npcHits.length > 0 || calendarHits.length > 0 || travelPlan.chunks > 0 || !isOpen || key !== "dorm_room";
                  return (
                    <button
                      key={key}
                      onClick={() => !disabled && onNavigate(key, transitMode)}
                      disabled={disabled}
                      title={travelFailure || `${describeLocationOpenState(state, key)} · ${formatLocationHours(key)}`}
                      style={{
                        textAlign: "left",
                        padding: "8px 10px",
                        background: isHere ? "rgba(200,161,101,0.18)" : "transparent",
                        border: `1px solid ${isHere ? "rgba(200,161,101,0.4)" : (!isOpen || travelFailure ? "rgba(240,235,220,0.05)" : "rgba(240,235,220,0.08)")}`,
                        borderRadius: 6,
                        color: isHere ? "#c8a165" : (!isOpen || travelFailure ? "rgba(240,235,220,0.42)" : "#f0ebdc"),
                        cursor: disabled ? "default" : "pointer",
                        fontSize: 12, fontFamily: "system-ui, sans-serif",
                        display: "block",
                        minHeight: hasIndicators ? 58 : 34,
                      }}
                    >
                      <span style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                        <span>{v.label}</span>
                        {isHere && <span style={{ fontSize: 9, opacity: 0.7 }}>here</span>}
                      </span>
                      {hasIndicators && (
                        <span style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 4,
                          marginTop: 6,
                        }}>
                          {calendarHits.map(item => (
                            <span key={`${item.id}-${item.slot}`} title={describeScheduleItem(item)} style={{
                              maxWidth: "100%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              padding: "2px 5px",
                              borderRadius: 999,
                              background: item.required ? "rgba(96,165,250,0.22)" : "rgba(200,161,101,0.18)",
                              color: item.required ? "#bfdbfe" : "#c8a165",
                              fontSize: 9,
                            }}>
                              {item.required ? "Class" : item.title}
                            </span>
                          ))}
                          <span style={{
                            padding: "2px 5px",
                            borderRadius: 999,
                            background: isOpen ? "rgba(34,197,94,0.12)" : "rgba(248,113,113,0.12)",
                            color: isOpen ? "#bbf7d0" : "#fecaca",
                            fontSize: 9,
                          }}>
                            {isOpen ? "open" : "closed"}
                          </span>
                          <span style={{
                            padding: "2px 5px",
                            borderRadius: 999,
                            background: "rgba(240,235,220,0.07)",
                            color: "rgba(240,235,220,0.62)",
                            fontSize: 9,
                          }}>
                            {formatLocationHours(key)}
                          </span>
                          {!isHere && travelPlan.chunks > 0 && (
                            <span style={{
                              padding: "2px 5px",
                              borderRadius: 999,
                              background: "rgba(56,189,248,0.14)",
                              color: "#bae6fd",
                              fontSize: 9,
                            }}>
                              {describeTravelPlan(travelPlan)}
                            </span>
                          )}
                          {npcHits.slice(0, 2).map(npc => (
                            <span key={npc.id} title={npc.scheduleNote || "scheduled here"} style={{
                              maxWidth: "100%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              padding: "2px 5px",
                              borderRadius: 999,
                              background: "rgba(240,235,220,0.10)",
                              color: "#f0ebdc",
                              fontSize: 9,
                            }}>
                              {npc.name || npc.id}
                            </span>
                          ))}
                          {npcHits.length > 2 && (
                            <span style={{ color: "rgba(240,235,220,0.62)", fontSize: 9 }}>+{npcHits.length - 2}</span>
                          )}
                        </span>
                      )}
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

function RelationshipScoreBar({ score }) {
  const normalized = clampValue((Number(score) || 0) / 15, 0, 1);
  return (
    <div style={{
      height: 6,
      borderRadius: 999,
      background: "rgba(58,53,48,0.10)",
      overflow: "hidden",
      marginTop: 6,
    }}>
      <div style={{
        width: `${normalized * 100}%`,
        height: "100%",
        borderRadius: 999,
        background: "#c8a165",
      }} />
    </div>
  );
}

function RelationshipFlagChips({ flags }) {
  const safeFlags = uniqueCompact(flags);
  if (!safeFlags.length) {
    return <span style={{ color: "#7a6e58", fontSize: 12, fontStyle: "italic" }}>No flags yet.</span>;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {safeFlags.map(flag => (
        <span key={flag} style={{
          padding: "4px 7px",
          borderRadius: 999,
          background: flag === "awkward" ? "rgba(180,83,9,0.12)" : "rgba(200,161,101,0.14)",
          border: `1px solid ${flag === "awkward" ? "rgba(180,83,9,0.18)" : "rgba(58,53,48,0.10)"}`,
          color: flag === "awkward" ? "#92400e" : "#3a3530",
          fontSize: 10,
        }}>
          {RELATIONSHIP_FLAG_LABELS[flag] || flag}
        </span>
      ))}
    </div>
  );
}

function RosterApp({ state, onBack }) {
  const known = (state.npcsKnown || []).map(key => getKnownNpc(state, key)).filter(Boolean);
  const [selectedId, setSelectedId] = useState(known[0]?.id || null);
  const selected = known.find(npc => npc.id === selectedId) || known[0];
  const relationship = selected ? getRelationshipForNpc(state, selected) : null;
  const relationshipLevel = relationship ? getRelationshipLevel(relationship.score) : null;
  const fallbackMoments = selected
    ? (state.eventLog || []).filter(event => eventMatchesPresentWitness(event, [selected])).slice(-4).map(event => ({
      day: event.day,
      slot: event.slot,
      text: eventSummary(event),
    }))
    : [];
  const moments = relationship?.recentMoments?.length ? relationship.recentMoments.slice().reverse() : fallbackMoments.reverse();
  const schema = selected?.schema || {};

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
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {known.map(npc => {
              const npcRelationship = getRelationshipForNpc(state, npc);
              const npcLevel = getRelationshipLevel(npcRelationship.score);
              const active = selected?.id === npc.id;
              return (
                <button
                  type="button"
                  key={npc.id}
                  onClick={() => setSelectedId(npc.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    textAlign: "left",
                    padding: "8px 10px",
                    background: active ? "rgba(200,161,101,0.18)" : "rgba(58,53,48,0.04)",
                    border: `1px solid ${active ? "rgba(200,161,101,0.32)" : "rgba(58,53,48,0.08)"}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    color: "#3a3530",
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    overflow: "hidden", flexShrink: 0,
                    border: "1px solid rgba(58,53,48,0.18)",
                  }}>
                    {PORTRAIT_SVGS[npc.portraitKey || npc.id] ? <InlineSvg svg={PORTRAIT_SVGS[npc.portraitKey || npc.id]} /> : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{npc.name || npc.id}</div>
                    <div style={{ fontSize: 10, color: "#7a6e58" }}>{npcLevel.label} · {npcRelationship.status}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#8b6f3d", fontWeight: 700 }}>{npcRelationship.score}</div>
                </button>
              );
            })}
          </div>

          {selected && relationship && (
            <>
              <PhoneSection title="Contact">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                overflow: "hidden", flexShrink: 0,
                border: "1px solid rgba(58,53,48,0.18)",
              }}>
                    {PORTRAIT_SVGS[selected.portraitKey || selected.id] ? <InlineSvg svg={PORTRAIT_SVGS[selected.portraitKey || selected.id]} /> : null}
              </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{selected.name || selected.id}</div>
                <div style={{ fontSize: 11, color: "#7a6e58" }}>
                      {selected.role || "Contact"}
                </div>
                    <div style={{ fontSize: 11, color: "#8b6f3d", marginTop: 5, fontWeight: 700 }}>
                      {relationshipLevel.label} · {relationship.score}
                    </div>
                    <RelationshipScoreBar score={relationship.score} />
                  </div>
                </div>
                <p style={{ margin: "10px 0 0", color: "#3a3530", fontSize: 12, lineHeight: 1.45 }}>
                  {relationshipLevel.description}
                </p>
              </PhoneSection>

              <PhoneSection title="Flags">
                <RelationshipFlagChips flags={relationship.flags} />
              </PhoneSection>

              <PhoneSection title="Standing">
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                  <div>
                    <div style={{ color: "#8b6f3d", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Status</div>
                    <p style={{ margin: "3px 0 0", color: "#3a3530", fontSize: 12 }}>{relationship.status}</p>
                  </div>
                  <div>
                    <div style={{ color: "#8b6f3d", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Last seen</div>
                    <p style={{ margin: "3px 0 0", color: "#3a3530", fontSize: 12, lineHeight: 1.4 }}>{relationship.lastSeenDisposition}</p>
                  </div>
                </div>
              </PhoneSection>

              <PhoneSection title="Recent Shared Moments">
                {moments.length ? moments.map((moment, index) => (
                  <TimelineItem when={moment.day ? formatMoment(moment.day, moment.slot || 0) : "Earlier"} key={`${moment.text}-${index}`}>
                    {moment.text}
                  </TimelineItem>
                )) : (
                  <p style={{ color: "#7a6e58", fontSize: 12, fontStyle: "italic" }}>No shared moments recorded yet.</p>
                )}
              </PhoneSection>

              <PhoneSection title="What You Know">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={{ color: "#8b6f3d", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Lands</div>
                    <p style={{ margin: 0, color: "#3a3530", fontSize: 11, lineHeight: 1.4 }}>
                      {asArray(schema.whatLands).join(", ") || "Nothing specific yet."}
                    </p>
                  </div>
                  <div>
                    <div style={{ color: "#8b6f3d", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Falls flat</div>
                    <p style={{ margin: 0, color: "#3a3530", fontSize: 11, lineHeight: 1.4 }}>
                      {asArray(schema.whatFallsFlat).join(", ") || "Nothing specific yet."}
                    </p>
                  </div>
                </div>
              </PhoneSection>
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}

function SelfApp({ state, onBack }) {
  const { stats, resources } = state.player;
  const inventoryRows = Object.entries(normalizeInventory(state.player.inventory || {}));
  const activityRows = Object.entries(normalizeActivityHistory(state.activityHistory).activities)
    .sort((a, b) => (b[1].total || 0) - (a[1].total || 0))
    .slice(0, 5);
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
      <div style={{ marginTop: 18 }}>
        <div style={{
          fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
          color: "#8b6f3d", fontWeight: 600, marginBottom: 8,
        }}>Inventory</div>
        {inventoryRows.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {inventoryRows.map(([itemId, qty]) => (
              <div key={itemId} style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                padding: "7px 9px",
                border: "1px solid rgba(58,53,48,0.08)",
                borderRadius: 8,
                background: "rgba(58,53,48,0.03)",
                fontSize: 11,
              }}>
                <span title={INVENTORY_ITEMS[itemId]?.description || ""}>{INVENTORY_ITEMS[itemId]?.label || itemId}</span>
                <span style={{ color: "#8b6f3d", fontWeight: 700 }}>{qty}</span>
              </div>
            ))}
          </div>
        ) : (
          <span style={{ color: "#7a6e58", fontSize: 12, fontStyle: "italic" }}>Nothing carried yet.</span>
        )}
      </div>
      <div style={{ marginTop: 18 }}>
        <div style={{
          fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
          color: "#8b6f3d", fontWeight: 600, marginBottom: 8,
        }}>Traits</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(state.player.traits || []).length ? state.player.traits.map(trait => (
            <span key={trait} style={{
              padding: "5px 8px",
              border: "1px solid rgba(58,53,48,0.12)",
              borderRadius: 12,
              fontSize: 11,
              color: "#3a3530",
              background: "rgba(200,161,101,0.12)",
            }}>{trait}</span>
          )) : (
            <span style={{ color: "#7a6e58", fontSize: 12, fontStyle: "italic" }}>No traits recorded yet.</span>
          )}
        </div>
      </div>
      <div style={{ marginTop: 18 }}>
        <div style={{
          fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
          color: "#8b6f3d", fontWeight: 600, marginBottom: 8,
        }}>Activity Patterns</div>
        {activityRows.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {activityRows.map(([activityId, record]) => (
              <div key={activityId} style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                padding: "7px 9px",
                border: "1px solid rgba(58,53,48,0.08)",
                borderRadius: 8,
                background: "rgba(58,53,48,0.03)",
                fontSize: 11,
              }}>
                <span>{record.label || ACTIVITY_DEFINITIONS[activityId]?.label || activityId}</span>
                <span style={{ color: "#8b6f3d", fontWeight: 700 }}>{record.total}</span>
              </div>
            ))}
          </div>
        ) : (
          <span style={{ color: "#7a6e58", fontSize: 12, fontStyle: "italic" }}>No repeated patterns yet.</span>
        )}
      </div>
    </AppShell>
  );
}

function PhoneSection({ title, children, dark = false }) {
  return (
    <section style={{
      border: `1px solid ${dark ? "rgba(240,235,220,0.12)" : "rgba(58,53,48,0.10)"}`,
      borderRadius: 8,
      padding: 12,
      background: dark ? "rgba(240,235,220,0.04)" : "rgba(255,255,255,0.38)",
      marginBottom: 12,
    }}>
      {title && (
        <h2 style={{
          margin: "0 0 8px",
          fontSize: 11,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: dark ? "#c8a165" : "#8b6f3d",
        }}>{title}</h2>
      )}
      {children}
    </section>
  );
}

function TimelineItem({ when, children, dark = false }) {
  return (
    <article style={{
      padding: "8px 0",
      borderTop: `1px solid ${dark ? "rgba(240,235,220,0.10)" : "rgba(58,53,48,0.08)"}`,
    }}>
      <small style={{
        display: "block",
        marginBottom: 3,
        color: dark ? "rgba(240,235,220,0.52)" : "#8b6f3d",
        fontSize: 10,
      }}>{when}</small>
      <p style={{
        margin: 0,
        color: dark ? "#f0ebdc" : "#3a3530",
        fontSize: 12,
        lineHeight: 1.42,
      }}>{children}</p>
    </article>
  );
}

function PulseApp({ state, onBack, onSendMessage, onMarkRead }) {
  const contacts = (state.npcsKnown || []).map(key => getKnownNpc(state, key)).filter(Boolean);
  const [selectedId, setSelectedId] = useState(contacts[0]?.id || null);
  const selected = contacts.find(contact => contact.id === selectedId) || contacts[0];
  const thread = selected ? (state.messages || []).filter(message => message.npcId === selected.id) : [];
  const pending = selected ? (state.pendingMessages || []).filter(message => message.npcId === selected.id) : [];
  const actionStyle = {
    border: "1px solid rgba(58,53,48,0.12)",
    background: "rgba(200,161,101,0.14)",
    color: "#3a3530",
    borderRadius: 6,
    padding: "7px 8px",
    fontSize: 11,
    cursor: "pointer",
  };

  useEffect(() => {
    if (selected?.id) onMarkRead?.(selected.id);
  }, [selected?.id, onMarkRead]);

  return (
    <AppShell title="Pulse" onBack={onBack}>
      {!contacts.length ? (
        <div style={{
          padding: "40px 20px", textAlign: "center",
          color: "#7a6e58", fontStyle: "italic", fontSize: 13,
        }}>
          No contacts yet.
        </div>
      ) : (
        <>
          <PhoneSection title="Threads">
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 7 }}>
              {contacts.map(contact => {
                const unread = getUnreadCount(state, contact.id);
                const active = selected?.id === contact.id;
                const lastMessage = (state.messages || []).filter(message => message.npcId === contact.id).slice(-1)[0];
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(contact.id);
                      onMarkRead?.(contact.id);
                    }}
                    style={{
                      border: `1px solid ${active ? "rgba(200,161,101,0.40)" : "rgba(58,53,48,0.09)"}`,
                      borderRadius: 8,
                      background: active ? "rgba(200,161,101,0.16)" : "rgba(255,255,255,0.30)",
                      padding: "8px 9px",
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      textAlign: "left",
                      cursor: "pointer",
                      color: "#3a3530",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{contact.name}</div>
                      <div style={{
                        color: "#7a6e58",
                        fontSize: 10,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {lastMessage ? lastMessage.text : contact.role || "No messages yet"}
                      </div>
                    </div>
                    {unread > 0 && (
                      <span style={{
                        minWidth: 20,
                        height: 20,
                        borderRadius: 999,
                        background: "#c8a165",
                        color: "#1a1814",
                        fontSize: 10,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </PhoneSection>

          {selected && (
            <PhoneSection title={selected.name}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10, minHeight: 110 }}>
                {thread.length ? thread.map(message => {
                  const incoming = message.direction === "incoming";
                  return (
                    <div key={message.id} style={{
                      alignSelf: incoming ? "flex-start" : "flex-end",
                      maxWidth: "86%",
                      padding: "7px 9px",
                      borderRadius: incoming ? "10px 10px 10px 3px" : "10px 10px 3px 10px",
                      background: incoming ? "rgba(58,53,48,0.08)" : "rgba(200,161,101,0.24)",
                      color: "#3a3530",
                      fontSize: 12,
                      lineHeight: 1.35,
                    }}>
                      <div>{message.text}</div>
                      <small style={{ color: "#8b6f3d", fontSize: 9 }}>{formatMoment(message.day, message.slot)}</small>
                    </div>
                  );
                }) : (
                  <div style={{ color: "#7a6e58", fontSize: 12, fontStyle: "italic" }}>No messages yet.</div>
                )}
                {pending.map(message => (
                  <div key={message.id} style={{
                    alignSelf: "flex-start",
                    maxWidth: "86%",
                    padding: "7px 9px",
                    borderRadius: "10px 10px 10px 3px",
                    border: "1px dashed rgba(58,53,48,0.16)",
                    color: "#7a6e58",
                    fontSize: 11,
                    lineHeight: 1.35,
                    background: "rgba(58,53,48,0.03)",
                  }}>
                    Reply expected around {formatClockTime(message.dueSlot)}.
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
                <button type="button" onClick={() => onSendMessage(selected.id, "check_in")} style={actionStyle}>Check in</button>
                <button type="button" onClick={() => onSendMessage(selected.id, "ask_about_day")} style={actionStyle}>Ask about day</button>
                <button type="button" onClick={() => onSendMessage(selected.id, "invite_coffee")} style={actionStyle}>Invite coffee</button>
              </div>
            </PhoneSection>
          )}
        </>
      )}
    </AppShell>
  );
}

function BuzzApp({ state, onBack }) {
  const feed = getBuzzFeed(state);
  const offset = state.day % BUZZ_FEED_ITEMS.length;
  const campusTicker = [...BUZZ_FEED_ITEMS.slice(offset), ...BUZZ_FEED_ITEMS.slice(0, offset)].slice(0, 3);
  const recent = (state.eventLog || []).slice(-4).reverse();

  return (
    <AppShell title="Buzz" onBack={onBack} dark>
      <PhoneSection title="Campus Pulse" dark>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, color: "#f0ebdc" }}>
          {LOCATIONS[state.location]?.label || state.location} is in your current orbit. Cached posts update as time moves.
        </p>
      </PhoneSection>
      <PhoneSection title="Feed" dark>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {feed.map((post, index) => (
            <article key={post.id || `${post.text}-${index}`} style={{
              border: "1px solid rgba(240,235,220,0.10)",
              borderRadius: 8,
              padding: 10,
              background: "rgba(200,161,101,0.08)",
              minHeight: 96,
            }}>
              <small style={{ color: "#c8a165", fontSize: 10 }}>
                {post.author || "Campus Buzz"} · {formatMoment(post.day, post.slot)}
              </small>
              <p style={{ margin: "4px 0 6px", color: "#f0ebdc", fontSize: 12, lineHeight: 1.36 }}>{post.text}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                <span style={{
                  padding: "2px 5px",
                  borderRadius: 999,
                  background: "rgba(240,235,220,0.08)",
                  color: "rgba(240,235,220,0.62)",
                  fontSize: 9,
                }}>
                  {post.source}
                </span>
                {post.location && (
                  <span style={{
                    padding: "2px 5px",
                    borderRadius: 999,
                    background: "rgba(56,189,248,0.12)",
                    color: "#bae6fd",
                    fontSize: 9,
                  }}>
                    {LOCATIONS[post.location]?.label || post.location}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </PhoneSection>
      <PhoneSection title="Ticker" dark>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {campusTicker.map(item => (
            <div key={item} style={{
              border: "1px solid rgba(240,235,220,0.08)",
              borderRadius: 8,
              padding: "7px 9px",
              color: "rgba(240,235,220,0.74)",
              fontSize: 11,
              lineHeight: 1.35,
            }}>
              {item}
            </div>
          ))}
        </div>
      </PhoneSection>
      <PhoneSection title="Your Footprint" dark>
        {recent.length ? recent.map((event, index) => (
          <TimelineItem dark when={formatMoment(event.day, event.slot || 0)} key={`${event.day}-${event.slot}-${index}`}>
            {eventSummary(event)}
          </TimelineItem>
        )) : (
          <p style={{ color: "rgba(240,235,220,0.56)", fontSize: 12, fontStyle: "italic" }}>Nothing logged yet.</p>
        )}
      </PhoneSection>
    </AppShell>
  );
}

function AnthropApp({ state, onBack }) {
  const stats = state.player.stats || {};
  const statEntries = Object.entries(stats);
  const weak = statEntries.slice().sort((a, b) => a[1] - b[1])[0]?.[0] || "knowledge";
  const strong = statEntries.slice().sort((a, b) => b[1] - a[1])[0]?.[0] || "charm";
  const relationshipEntries = Object.entries(state.player.relationships || {});
  const moment = getCalendarMoment(state);
  const currentCalendarItems = getCurrentCalendarItems(state);
  const upcomingItems = getUpcomingCalendarItems(state, 5);
  const presentHere = getNpcPresenceAtLocation(state, state.location, getNpcDirectory(state));
  const activeLeads = getAnthropLeads(state);
  const commitments = getUpcomingCommitments(state, 5);
  const neglectedContacts = getNeglectedContacts(state);
  const significantMoments = getRecentSignificantMoments(state, 6);
  const missedBlocks = (state.missedBlocks || []).slice(-4).reverse();

  return (
    <AppShell title="Anthrop" onBack={onBack} dark>
      <PhoneSection title="Readout" dark>
        <p style={{ margin: "0 0 8px", color: "#f0ebdc", fontSize: 13, lineHeight: 1.45 }}>
          Week {moment.week}, {moment.dayName} {moment.slotLabel}, currently at {LOCATIONS[state.location]?.label || state.location}.
          Your strongest stat is {STAT_LABELS[strong] || strong} and the easiest gain right now is probably {STAT_LABELS[weak] || weak}.
        </p>
        <p style={{ margin: 0, color: "rgba(240,235,220,0.72)", fontSize: 12 }}>
          Energy is {state.player.resources.energy}/100 and money is ${state.player.resources.money}.
        </p>
      </PhoneSection>
      <PhoneSection title="Active Leads" dark>
        {activeLeads.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {activeLeads.map(lead => (
              <article key={lead.id} style={{
                border: "1px solid rgba(240,235,220,0.10)",
                borderRadius: 8,
                padding: "8px 10px",
                background: "rgba(200,161,101,0.08)",
              }}>
                <div style={{ color: "#f0ebdc", fontSize: 12, fontWeight: 700 }}>{lead.title}</div>
                <p style={{ margin: "4px 0 0", color: "rgba(240,235,220,0.68)", fontSize: 11, lineHeight: 1.35 }}>{lead.detail}</p>
              </article>
            ))}
          </div>
        ) : (
          <p style={{ color: "rgba(240,235,220,0.56)", fontSize: 12, fontStyle: "italic" }}>No urgent leads right now.</p>
        )}
      </PhoneSection>
      <PhoneSection title="Calendar" dark>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ color: "#c8a165", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 }}>Now</div>
            {currentCalendarItems.length ? currentCalendarItems.map(item => (
              <p key={`${item.id}-${item.slot}`} style={{ margin: "0 0 5px", color: "#f0ebdc", fontSize: 12, lineHeight: 1.35 }}>
                {item.title} at {LOCATIONS[item.location]?.label || item.location}
              </p>
            )) : (
              <p style={{ margin: 0, color: "rgba(240,235,220,0.58)", fontSize: 12 }}>Free block.</p>
            )}
            <div style={{ color: "#c8a165", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", margin: "10px 0 5px" }}>Likely Here</div>
            {presentHere.length ? (
              <p style={{ margin: 0, color: "#f0ebdc", fontSize: 12, lineHeight: 1.35 }}>
                {presentHere.map(npc => `${npc.name || npc.id}${npc.scheduleNote ? ` (${npc.scheduleNote})` : ""}`).join(", ")}
              </p>
            ) : (
              <p style={{ margin: 0, color: "rgba(240,235,220,0.58)", fontSize: 12 }}>No named NPCs scheduled here.</p>
            )}
          </div>
          <div>
            <div style={{ color: "#c8a165", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 }}>Next Up</div>
            {upcomingItems.length ? upcomingItems.map(item => (
              <TimelineItem dark when={formatMoment(item.day, item.slot)} key={`${item.id}-${item.day}-${item.slot}`}>
                {item.title} at {LOCATIONS[item.location]?.label || item.location}
              </TimelineItem>
            )) : (
              <p style={{ margin: 0, color: "rgba(240,235,220,0.58)", fontSize: 12 }}>Nothing scheduled soon.</p>
            )}
          </div>
        </div>
      </PhoneSection>
      <PhoneSection title="Commitments" dark>
        {commitments.length ? commitments.map(item => (
          <TimelineItem dark when={formatMoment(item.day, item.slot)} key={item.id}>
            {item.title} at {LOCATIONS[item.location]?.label || item.location}
          </TimelineItem>
        )) : (
          <p style={{ color: "rgba(240,235,220,0.56)", fontSize: 12, fontStyle: "italic" }}>No tracked commitments yet.</p>
        )}
      </PhoneSection>
      <PhoneSection title="Neglected Contacts" dark>
        {neglectedContacts.length ? neglectedContacts.map(({ npc, last, ageChunks }) => (
          <TimelineItem dark when={last ? formatMoment(last.day, last.slot) : "No contact logged"} key={npc.id}>
            {npc.name || npc.id} has been quiet for about {formatDuration(ageChunks)}.
          </TimelineItem>
        )) : (
          <p style={{ color: "rgba(240,235,220,0.56)", fontSize: 12, fontStyle: "italic" }}>No neglected contacts yet.</p>
        )}
      </PhoneSection>
      <PhoneSection title="Suggestions" dark>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#f0ebdc", fontSize: 12, lineHeight: 1.55 }}>
          <li>{weak === "knowledge" ? "Study at the library or review notes in the dorm." : "Use location activities to round out the low stat."}</li>
          <li>{state.player.resources.energy < 35 ? "Recover energy before stacking more demanding activities." : "You have enough energy for one serious activity."}</li>
          <li>{state.npcsKnown.length ? "Use Pulse to keep a contact warm between in-person scenes." : "Explore town or campus until you meet someone worth saving."}</li>
        </ul>
      </PhoneSection>
      <PhoneSection title="Relationships" dark>
        {relationshipEntries.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            {relationshipEntries.map(([npcId, record]) => {
              const npc = getKnownNpc(state, npcId);
              const relationship = normalizeRelationshipRecord(record, npc);
              const level = getRelationshipLevel(relationship.score);
              return (
                <div key={npcId} style={{
                  border: "1px solid rgba(240,235,220,0.10)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  color: "#f0ebdc",
                  fontSize: 12,
                }}>
                  <span>{npc.name || npcId} · {level.label}</span>
                  <strong>{relationship.score ?? 0}</strong>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "rgba(240,235,220,0.56)", fontSize: 12, fontStyle: "italic" }}>No relationship records yet.</p>
        )}
      </PhoneSection>
      <PhoneSection title="Recent Significant Moments" dark>
        {significantMoments.length ? significantMoments.map((moment, index) => (
          <TimelineItem dark when={formatMoment(moment.day, moment.slot || 0)} key={`${moment.label}-${index}`}>
            {moment.label}
          </TimelineItem>
        )) : (
          <p style={{ color: "rgba(240,235,220,0.56)", fontSize: 12, fontStyle: "italic" }}>No events logged yet.</p>
        )}
      </PhoneSection>
      {!!missedBlocks.length && (
        <PhoneSection title="Missed Blocks" dark>
          {missedBlocks.map(block => (
            <TimelineItem dark when={formatMoment(block.day, block.slot)} key={block.id}>
              {block.title} at {LOCATIONS[block.location]?.label || block.location}
            </TimelineItem>
          ))}
        </PhoneSection>
      )}
    </AppShell>
  );
}

function MarginApp({ state, onBack, onAddNote }) {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const recentEvents = (state.eventLog || []).slice(-12).reverse();
  const normalizedQuery = query.trim().toLowerCase();
  const notes = (state.notes || []).slice().reverse();
  const filteredNotes = normalizedQuery
    ? notes.filter(note => [
      note.text,
      note.locationLabel,
      note.context,
      note.event,
      ...(note.tags || []),
      ...(note.npcIds || []).map(npcId => getKnownNpc(state, npcId)?.name || npcId),
    ].join(" ").toLowerCase().includes(normalizedQuery))
    : notes;
  const submitNote = () => {
    if (!draft.trim()) return;
    onAddNote(draft);
    setDraft("");
  };

  return (
    <AppShell title="Margin" onBack={onBack}>
      <PhoneSection title="New Note">
        <textarea
          value={draft}
          onChange={event => setDraft(event.target.value)}
          placeholder="Write what the player should remember..."
          style={{
            width: "100%",
            minHeight: 92,
            resize: "vertical",
            boxSizing: "border-box",
            border: "1px solid rgba(58,53,48,0.14)",
            borderRadius: 8,
            padding: 10,
            fontFamily: "system-ui, sans-serif",
            fontSize: 12,
            background: "rgba(255,255,255,0.45)",
            color: "#3a3530",
            outline: "none",
          }}
        />
        <button
          type="button"
          onMouseDown={event => {
            event.preventDefault();
            submitNote();
          }}
          onClick={submitNote}
          disabled={!draft.trim()}
          style={{
            marginTop: 8,
            width: "100%",
            border: "1px solid rgba(58,53,48,0.12)",
            background: draft.trim() ? "rgba(200,161,101,0.22)" : "rgba(58,53,48,0.04)",
            color: draft.trim() ? "#3a3530" : "#8b8173",
            borderRadius: 6,
            padding: "8px 10px",
            fontSize: 12,
            cursor: draft.trim() ? "pointer" : "default",
          }}
        >
          Add note
        </button>
      </PhoneSection>
      <PhoneSection title="Search">
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search notes, places, people, classes..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "1px solid rgba(58,53,48,0.14)",
            borderRadius: 8,
            padding: "8px 10px",
            fontFamily: "system-ui, sans-serif",
            fontSize: 12,
            background: "rgba(255,255,255,0.45)",
            color: "#3a3530",
            outline: "none",
          }}
        />
      </PhoneSection>
      <PhoneSection title="Notes">
        {filteredNotes.length ? filteredNotes.map(note => (
          <TimelineItem when={`${noteMoment(note)} · ${note.locationLabel || LOCATIONS[note.location]?.label || "Unknown place"}`} key={note.id}>
            <span>{note.text}</span>
            {(note.context || (note.tags || []).length || note.event) && (
              <span style={{ display: "block", marginTop: 6, color: "#7a6e58", fontSize: 10, lineHeight: 1.35 }}>
                {note.context ? `Context: ${note.context}. ` : ""}
                {(note.tags || []).length ? `Tags: ${(note.tags || []).join(", ")}. ` : ""}
                {note.event ? `Linked: ${note.event}` : ""}
              </span>
            )}
          </TimelineItem>
        )) : (
          <p style={{ color: "#7a6e58", fontSize: 12, fontStyle: "italic" }}>
            {(state.notes || []).length ? "No notes match that search." : "No notes yet."}
          </p>
        )}
      </PhoneSection>
      <PhoneSection title="Recent Log">
        {recentEvents.length ? recentEvents.map((event, index) => (
          <TimelineItem when={formatMoment(event.day, event.slot || 0)} key={`${event.day}-${event.slot}-${index}`}>
            {eventSummary(event)}
          </TimelineItem>
        )) : (
          <p style={{ color: "#7a6e58", fontSize: 12, fontStyle: "italic" }}>No events logged yet.</p>
        )}
      </PhoneSection>
    </AppShell>
  );
}

function WakeApp({ state, onBack, onSetAlarm, onSleep }) {
  const alarmSlot = state.wake?.alarmSlot ?? timeChunk(7, 30);
  const lastSleep = state.wake?.lastSleep;
  const missedBlocks = (state.missedBlocks || []).slice(-4).reverse();
  const currentEnergy = state.player?.resources?.energy ?? 0;
  const nextAlarmDay = normalizeTimeSlot(state.timeSlot) < alarmSlot ? state.day : state.day + 1;
  const sleepChunks = Math.max(1, absoluteMoment(nextAlarmDay, alarmSlot) - absoluteMoment(state.day, state.timeSlot));

  return (
    <AppShell title="Wake" onBack={onBack}>
      <PhoneSection title="Alarm">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#3a3530", lineHeight: 1 }}>{formatClockTime(alarmSlot)}</div>
            <div style={{ fontSize: 11, color: "#7a6e58", marginTop: 4 }}>
              Sleep window: {formatDuration(sleepChunks)}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: "#7a6e58" }}>
            Energy<br />
            <strong style={{ color: "#3a3530", fontSize: 16 }}>{currentEnergy}/100</strong>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
          {WAKE_ALARMS.map(slot => {
            const active = normalizeTimeSlot(slot) === normalizeTimeSlot(alarmSlot);
            return (
              <button
                type="button"
                key={slot}
                onClick={() => onSetAlarm(slot)}
                style={{
                  border: `1px solid ${active ? "rgba(200,161,101,0.42)" : "rgba(58,53,48,0.10)"}`,
                  background: active ? "rgba(200,161,101,0.18)" : "rgba(255,255,255,0.35)",
                  color: "#3a3530",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                {formatClockTime(slot)}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => onSleep(alarmSlot)}
          style={{
            marginTop: 10,
            width: "100%",
            border: "1px solid rgba(58,53,48,0.14)",
            background: "#3a3530",
            color: "#f0ebdc",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Sleep until alarm
        </button>
      </PhoneSection>

      <PhoneSection title="Risk">
        <p style={{ margin: 0, color: "#3a3530", fontSize: 12, lineHeight: 1.45 }}>
          If energy is below 20, exhaustion can push the wake time back by 30 minutes. Required class blocks crossed while asleep are recorded as missed.
        </p>
      </PhoneSection>

      {lastSleep && (
        <PhoneSection title="Last Sleep">
          <TimelineItem when={`${formatMoment(lastSleep.day, lastSleep.slot)} to ${formatMoment(lastSleep.wakeDay, lastSleep.wakeSlot)}`}>
            Slept for {formatDuration(lastSleep.chunks)}{lastSleep.exhausted ? " and overslept from exhaustion." : "."}
          </TimelineItem>
        </PhoneSection>
      )}

      <PhoneSection title="Missed Blocks">
        {missedBlocks.length ? missedBlocks.map(block => (
          <TimelineItem when={formatMoment(block.day, block.slot)} key={block.id}>
            {block.title} at {LOCATIONS[block.location]?.label || block.location}
          </TimelineItem>
        )) : (
          <p style={{ color: "#7a6e58", fontSize: 12, fontStyle: "italic" }}>Nothing missed by sleep yet.</p>
        )}
      </PhoneSection>
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
      setState(saved ? normalizeState(saved) : makeFreshState());
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
    if (!app) return;
    setPhone(p => ({
      ...p,
      view: `app:${appId}`,
      orientation: app.layout,
    }));
  }, []);

  const backToHome = useCallback(() => {
    setPhone(p => ({ ...p, view: "home", orientation: "portrait" }));
  }, []);

  const handleNavigate = useCallback((locationKey, transitMode = "walk") => {
    if (!state) return;
    const update = navigateToLocation(state, locationKey, transitMode);
    const processed = processTimedSystems(update.state);
    setState(processed.state);
    if (update.notification) setTimeout(() => showNotif(update.notification), 200);
    else if (processed.notification) setTimeout(() => showNotif(processed.notification), 500);
    if (update.state.location !== state.location) {
      setPhone({ open: false, view: "home", orientation: "portrait" });
    }
  }, [showNotif, state]);

  const handleChoice = useCallback((choice) => {
    setState(s => {
      const update = applyChoice(s, choice);
      const processed = processTimedSystems(update.state);
      if (update.notification) {
        const delay = update.notification.app === "Pulse" ? 1500 : 600;
        setTimeout(() => showNotif(update.notification), delay);
      }
      if (processed.notification) setTimeout(() => showNotif(processed.notification), update.notification ? 2200 : 700);
      return processed.state;
    });
  }, [showNotif]);

  const handleSendMessage = useCallback((npcId, templateId) => {
    setState(s => {
      const update = sendPulseMessage(s, npcId, templateId);
      if (update.notification) setTimeout(() => showNotif(update.notification), 200);
      return normalizeState(update.state);
    });
  }, [showNotif]);

  const handleMarkPulseRead = useCallback((npcId) => {
    setState(s => normalizeState(markPulseThreadRead(s, npcId)));
  }, []);

  const handleCommitBulletin = useCallback((flyerId) => {
    setState(s => {
      const update = commitToBulletin(s, flyerId);
      if (update.notification) setTimeout(() => showNotif(update.notification), 200);
      return normalizeState(update.state);
    });
  }, [showNotif]);

  const handleAddNote = useCallback((text) => {
    setState(s => normalizeState(addMarginNote(s, text).state));
  }, []);

  const handleSetAlarm = useCallback((alarmSlot) => {
    setState(s => normalizeState(setWakeAlarm(s, alarmSlot)));
  }, []);

  const handleSleep = useCallback((alarmSlot) => {
    setState(s => {
      const update = sleepUntilAlarm(s, alarmSlot);
      const processed = processTimedSystems(update.state);
      if (update.notification) setTimeout(() => showNotif(update.notification), 200);
      if (processed.notification) setTimeout(() => showNotif(processed.notification), 1400);
      return processed.state;
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
    else if (appId === "compass") phoneContent = <CompassApp state={state} onBack={backToHome} onNavigate={handleNavigate} onCommitBulletin={handleCommitBulletin} />;
    else if (appId === "pulse")   phoneContent = <PulseApp   state={state} onBack={backToHome} onSendMessage={handleSendMessage} onMarkRead={handleMarkPulseRead} />;
    else if (appId === "roster")  phoneContent = <RosterApp  state={state} onBack={backToHome} />;
    else if (appId === "self")    phoneContent = <SelfApp    state={state} onBack={backToHome} />;
    else if (appId === "buzz")    phoneContent = <BuzzApp    state={state} onBack={backToHome} />;
    else if (appId === "anthrop") phoneContent = <AnthropApp state={state} onBack={backToHome} />;
    else if (appId === "margin")  phoneContent = <MarginApp  state={state} onBack={backToHome} onAddNote={handleAddNote} />;
    else if (appId === "wake")    phoneContent = <WakeApp    state={state} onBack={backToHome} onSetAlarm={handleSetAlarm} onSleep={handleSleep} />;
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
                const app = APP_BY_ID[String(notif?.app || "").toLowerCase()];
                setNotif(null);
                setPhone({
                  open: true,
                  view: app ? `app:${app.id}` : "home",
                  orientation: app ? app.layout : "portrait",
                });
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
