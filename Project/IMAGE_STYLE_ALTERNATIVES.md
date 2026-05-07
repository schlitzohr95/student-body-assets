# Student Body — Style Preamble Alternatives

This doc gives you alternative style preambles to test. Each one is a complete drop-in replacement for the **Style** block at the top of the prompts in `IMAGE_PROMPTS_LOCATIONS.md` and `IMAGE_PROMPTS_PORTRAITS_AND_ICONS.md`. Generate the same subject (the dorm room is a good test case) with multiple styles and compare.

The current locked default is **Style A: Modern Indie Pixel** (from the existing prompt docs). Everything else here is an alternative to evaluate.

## How to test

1. Pick two or three locations to use as test subjects. Recommended: **the dorm room, the coffee shop, the library main floor.** These are the most-visited locations and the ones the player will form their visual impression of the game from.
2. For each style you want to test, generate the test subjects with that style preamble, keeping the rest of the prompt identical.
3. Look at the test set as a group, not individually. Style decisions should be made on *how the set feels together*, not on whether one image is good in isolation.
4. The "winner" is the style where the set feels coherent, distinct, and *like a game you'd want to play*.

## Quick decision guide

If you're not sure which to test, here's a rough mental map of what each style is *for*:

- **You want cozy and warm** → A, B, or C
- **You want literary and atmospheric** → D or E
- **You want stylized and distinctive** → F, G, or I
- **You want a more experimental look** → H or I
- **You want something that signals "this is a serious narrative game"** → D, E, or J

The biggest single split is **pixel vs. painted**. Pixel art (A, B, C, F, G) gives you the cozy-indie-game feel and is technically forgiving — pixels hide a lot of small generation errors. Painted styles (D, E, H, J) give you a more "literary" feel but expose generation errors more clearly and need a steadier prompting hand. Both can work for this project; the question is which one fits your taste.

---

## Style A — Modern Indie Pixel (current default)

> **Style**: soft pixel art, 16-bit era inspired but slightly more detail than authentic 16-bit (think modern indie games — *Stardew Valley*, *Eastward*, *Coromon*). Warm, slightly desaturated color palette. Limited but expressive color use. Soft pixel-perfect edges, no anti-aliasing blur, no painterly rendering. Top-down or side-on perspective depending on location (specified per-prompt). Cozy, lived-in atmosphere. Slight grain. Designed as a background plate for a narrative game; the scene should feel inhabitable rather than decorative.

**What it gives you**: cozy, warm, immediately readable, evokes the indie-game tradition the project is in dialogue with.
**Best for**: a player who wants the genre comforts of a Stardew-like, with the writing being the elevated part.
**Risks**: might feel too familiar / too genre-default; doesn't visually announce that this is a literary-narrative game.

## Style B — High-Detail Pixel Art

> **Style**: detailed pixel art with a high pixel density (think *Octopath Traveler*, *Sea of Stars*, *Eastward*'s more detailed scenes). Rich color palette with depth shading and selective dithering for atmosphere. Fine detail on textures (wood grain, fabric folds, plant leaves) achieved through pixel-level work rather than blur. Crisp edges, no anti-aliasing. Lighting is a major part of the composition — warm light pools, soft shadows, atmospheric haze where appropriate. Designed as a background plate for a narrative game; should feel like a still from an animated film executed in pixel art.

**What it gives you**: pixel art at its most ambitious, almost painterly without losing the pixel structure.
**Best for**: a player who wants pixel art that doesn't apologize for being pixel art — wants the *Sea of Stars* level of visual ambition.
**Risks**: harder for AI to generate consistently; some images may come out looking great while others look muddy. More iteration needed.

## Style C — Soft Vintage Pixel

> **Style**: pixel art with a vintage softness, evoking old SNES-era JRPGs but with modern color sensibility (think early *Final Fantasy*, *Chrono Trigger*, *Earthbound*). Warm sepia-tinted palette, slightly faded as if the image has been kept in a sunlit room for years. Limited color count per scene (~16 colors maximum). Visible pixel structure, slightly chunky compared to Style A. Soft black outlines on key shapes. Reads as nostalgic without being kitsch.

**What it gives you**: real nostalgia rather than evocative-of-nostalgia. Plays as memory, which fits the semester-as-temporary framing of the game.
**Best for**: a player who wants the game to feel like a memory of college rather than a depiction of it.
**Risks**: can read as "old" rather than "stylized" if the rest of the project doesn't earn it. Pairs less well with modern phone-UI elements like the Buzz feed.

## Style D — Painterly Watercolor

> **Style**: digital painting in a soft watercolor style, with visible brush texture and color bleed at edges. Warm desaturated palette, lots of paper-white showing through in highlights. Loose composition where some elements are detailed and others are suggested with a few brush strokes. Soft natural lighting. The mood of an illustrated novel or a contemporary picture book for adults. No hard digital edges, no rendered 3D, no photographic quality.

**What it gives you**: a literary, elevated feel. Looks like a novel illustration.
**Best for**: a player who wants the visuals to read as *art* before they read as *game*.
**Risks**: harder to make 11 app icons and a phone UI feel coherent in this style; the icons especially might look mismatched.

## Style E — Soft Gouache / Studio Ghibli-Adjacent

> **Style**: digital gouache painting reminiscent of contemporary animation backgrounds (think Studio Ghibli, *Kiki's Delivery Service*, *Whisper of the Heart*, but originally created — not derivative). Warm natural palette with rich greens and golden hour lighting. Soft brushwork, hand-painted feel, slight imperfection in line work. Strong sense of *place* — every scene should feel like it has weather, time of day, and atmosphere. Detailed but not photorealistic; stylized but not cartoonish.

**What it gives you**: probably the most universally appealing style on this list. Warm, beautiful, atmospheric.
**Best for**: a player who wants every screenshot of the game to be something you'd want to print.
**Risks**: highest bar of all the styles — if generations come out short of the reference, they'll feel like cheap imitations rather than the real thing. Also, "Studio Ghibli style" is overgenerated by AI right now and many results will feel generic.

## Style F — Bold Graphic / Limited Palette

> **Style**: pixel art with a bold, graphic, limited-palette aesthetic (think *Hyper Light Drifter*, *Sword & Sworcery*, *Crypt of the NecroDancer*). Deliberately restricted color palette per scene — sometimes only 4–6 colors. Strong silhouettes. High contrast. Atmospheric rather than realistic; mood over detail. A scene might be primarily two or three colors with one accent. Designed to be visually striking and immediately identifiable.

**What it gives you**: a strong, distinctive visual identity that's instantly recognizable. The game looks like *itself*, not like other games in the genre.
**Best for**: a player who wants the visuals to be a marketing-strong calling card.
**Risks**: cozy is harder to communicate when the palette is this restricted; the mood may read as cooler/more distant than the writing actually is. Possible mismatch with the game's warmth.

## Style G — Storybook Pixel

> **Style**: pixel art with a handcrafted, storybook quality — slightly larger pixels than Style A, more visible structure, decorative without being ornate. Warm earthy palette. Each scene composed like a children's book illustration but for adults — clear focal point, balanced composition, a few small details that reward close looking. Rounded forms, soft edges within the pixel grid. Reads as gentle and inviting.

**What it gives you**: visual gentleness that signals the game is character-driven and warm.
**Best for**: a player who wants the visuals to feel like a hug.
**Risks**: might undersell the more serious story beats (Mari's exhaustion, the chemistry-thread sadness, etc.). Tonal mismatch between visuals and writing.

## Style H — Anime-Inspired Backgrounds

> **Style**: digital painting in the style of Japanese animation backgrounds (think Makoto Shinkai's films — *5 Centimeters Per Second*, *Your Name* — but for environments only, not characters). Hyper-detailed lighting. Saturated but believable color palette. Strong sense of weather and atmosphere. Often a single dramatic light source (a window, a streetlamp, a sunset) anchoring the composition. Photorealistic in spatial logic but stylized in color and light treatment.

**What it gives you**: emotionally heightened atmosphere. Every scene feels like *a moment*.
**Best for**: a player who wants the game to feel like a slice-of-life anime in still frames.
**Risks**: very high bar — generations that fall short will look generic-anime rather than Shinkai-quality. Also pulls the project's reference set toward anime tropes the design has been deliberately avoiding.

## Style I — Minimalist Vector

> **Style**: clean vector-style illustration with flat color fills and simple geometric shapes. Limited palette, high contrast, modern editorial feel (think New Yorker covers or contemporary design illustration). Each scene reduced to its essential elements — a few shapes, a few colors, one clear focal point. No texture, no shading beyond simple gradient fills. Reads as adult, sophisticated, intentional.

**What it gives you**: visual sophistication that signals "this is a game for grown-ups about grown-ups."
**Best for**: a player who wants the visuals to feel editorial rather than escapist.
**Risks**: cozy is hard to communicate in flat vector. The game's warmth would have to come entirely from writing. Also doesn't pair as naturally with character portraits — flat vector portraits are a specific aesthetic that not everyone loves.

## Style J — Soft Photorealism / Concept Art

> **Style**: digital concept art with soft photorealistic rendering. Warm cinematic color grading. Realistic spatial logic and lighting. Slight painterly looseness in textures (visible brushwork in fabric, foliage, etc.) to keep it from feeling cold or rendered. The kind of background painting you'd see in a contemporary indie animated film aimed at adults. Detailed but not fussy; realistic but not documentary.

**What it gives you**: maximum visual realism while staying stylized. Looks like a high-budget indie film still.
**Best for**: a player who wants the world to feel utterly believable as a place that exists.
**Risks**: highest production-value bar of all styles. Inconsistent generations will be the most jarring here because the style demands the most polish. Also, this style sits awkwardly with a phone UI overlay — realism makes diegetic UI feel pasted-on.

---

## Some honest observations about the choice

**Pixel art (A, B, C, F, G) plays best with the phone UI overlay** the design includes. Pixel art *is* a UI-friendly aesthetic — the phone icons sit naturally on top of pixel-art locations because the entire visual register is the same. Painted styles (D, E, H, J) create a slight visual mismatch with the phone unless we also style the phone in the same painted way, which is more work.

**The current locked default (A) is a safe, defensible choice** that won't make the project look bad and won't surprise anyone. If you're feeling decisive, picking A and moving on costs nothing.

**If you want the game to look distinctive — to look like *itself* — the boldest options are E, F, or H.** These are the ones where the visuals have a *point of view*. Each carries risks (E and H have high bars, F undersells warmth) but each gives the project a recognizable identity.

**My honest recommendation**: test A, B, and E with the dorm room and coffee shop. That gives you a safe pixel option, an ambitious pixel option, and a painterly option as a swing-for-the-fences. Whichever feels most like *the game you want to make* is the right one.

---

## What to do once you've picked

When you've chosen a style, tell me which one and I'll update the existing prompt docs to use that as the locked default, replacing Style A. After that, you generate against the new default and the assets will be coherent across the set.

If you find yourself liking elements from two styles, also tell me — sometimes the right answer is a custom blend ("the warmth of Style E with the pixel structure of Style B," or whatever). I can write a custom preamble that fuses them.
