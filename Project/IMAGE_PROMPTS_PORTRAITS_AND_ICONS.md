# Student Body — Portrait & Icon Prompts

This doc covers two related-but-distinct image sets: **character portraits** for the cast (used as contact pictures, dialogue avatars, and Buzz post profile pictures) and **app icons** for the phone home screen.

The two sets share a project-wide visual identity but use different style preambles because they're solving different problems. Portraits need to read as *people*; icons need to read as *symbols*.

---

## Part 1 — Character Portraits

### Style preamble for portraits

Every portrait prompt should begin with this block.

> **Style**: pixel art portrait, head-and-shoulders framing, painted in the style of modern indie games (think *Stardew Valley* portraits but slightly more detailed — *Eastward* or *Coromon* level of pixel detail). Soft, warm color palette, slightly desaturated. Solid or simple gradient background — never a complex scene behind the portrait. Subject facing slightly toward the viewer, three-quarter view, neutral-to-warm expression unless specified. Clear pixel edges, no anti-aliasing, no painterly blur. Designed to read clearly at small sizes (will be displayed as a 64×64 or 128×128 contact picture in the game).

### Style notes (read once, then apply)

- **Background should be simple.** A solid color, a subtle gradient, or a very soft suggestion of an environment. The face is what matters; the background should never compete.
- **Expression should be characteristic, not extreme.** Avoid open-mouthed laughs or angry scowls. The portrait represents the character generally, not a specific moment. Slight smile, slight thoughtful look, slightly closed-off, etc. Subtle tells.
- **Read at small size.** These will display at small sizes in the contacts app and on Buzz posts. Test by mentally squinting — do the key features still come through? If a character's defining trait is their glasses, the glasses need to be visible at thumbnail scale.
- **Each character has one distinguishing visual element.** Not a costume — just a *thing*. The Studious has the kind of cardigan that doesn't quite fit. The Athletic has the kind of haircut that suggests she gets it cut for function. The Townie has tired eyes and an apron sometimes visible in the framing. These are *identifiers*, not stereotypes.
- **No anachronistic or fantasy elements.** This is a contemporary realistic college setting. No glowing eyes, no implausible hair colors, no tattoos that wouldn't pass at a job interview, no costumes.
- **Adults.** All romanceable characters are written as adult college students; the Townie is also adult. Portraits should look 19–24, not younger. This is a grounded contemporary setting and the visual register should match.

### A note on consistency across runs

Because the world generator creates a new specific person per archetype each run, *the portrait set is for one specific run*. If you generate a Studious portrait with a particular look, that look is locked for that playthrough. A new playthrough would need new portraits — or could reuse the same set, treating that specific Studious as a recurring character across runs (which is also fine and arguably better for v1).

For the v1 prototype, I'd suggest **generating one portrait set and locking it as the canonical cast for v1**. Multiple-cast support is a v2 feature.

---

### Cast portraits to generate

Each portrait below has the prompt body — paste the style preamble above first, then the prompt below.

---

#### Mari Caldera (Townie)

> **Subject**: A 22-year-old woman, head-and-shoulders portrait. She has brown skin, dark hair worn in a low practical ponytail with a few escaped strands. Tired but alert eyes — the look of someone who's been up since 5am and is still going. Wearing a simple dark t-shirt under a partially-visible coffee shop apron (suggesting she's mid-shift or just off). A tiny silver stud earring in each ear. No other jewelry. A slight, knowing smile — not warm-customer-service smile, just the small honest one she gives people she's started to trust. A small visible birthmark or freckle pattern somewhere on her face — your choice — to make her specific. Background: soft warm cream gradient, the suggestion of coffee-shop lighting without any actual scene.
>
> **Mood**: tired, smart, warm but reserved. The face of someone who is good at her job and has more going on than she usually shows.

#### The Studious (name TBD by generator)

> **Subject**: A 20-year-old woman, head-and-shoulders portrait. Auburn or dark blonde hair, slightly messy in a way that suggests she stopped paying attention to it three hours ago. Tortoiseshell glasses, worn habitually rather than fashionably. A soft cardigan in a faded color (rust, sage, or muted navy) over a button-up shirt — the cardigan is slightly too big and one sleeve is pushed up further than the other. A visible pen tucked behind her ear. A pencil-mark smudge on her cheek that she hasn't noticed. Slight thoughtful expression — looking at something just past the viewer, like she's mid-thought. Background: soft cool gradient, a subtle suggestion of warm library lamp light somewhere off-frame.
>
> **Mood**: bookish, gentle, quietly working. Approachable but inside her own head.

#### The Athletic (name TBD by generator)

> **Subject**: A 20-year-old woman, head-and-shoulders portrait. Dark hair pulled into a high practical ponytail, no fly-aways — disciplined hair. Strong jawline, clear skin with a hint of a sunburn line on her nose from being outside. Wearing a heather-gray school athletic-program quarter-zip in a muted color, a thin gold chain visible at the collar. Small functional studs in her ears. A direct, level expression — meeting the viewer's gaze, not posing for anyone. Slight smile that suggests both confidence and that she's holding a joke back. Background: soft pale gradient, the slight suggestion of late-afternoon training-field light.
>
> **Mood**: present, capable, a little intimidating until you realize she's funny.

#### The Artistic (name TBD by generator)

> **Subject**: A 20-year-old woman, head-and-shoulders portrait. Hair worn in an interesting way — could be cropped short, could have an asymmetric cut, could have a natural color but worn deliberately. A small unusual piece of jewelry — a ring on an unusual finger, or a thin chain with a charm. Wearing a thrifted-looking layered outfit — a vintage band shirt under an open denim or corduroy shirt or jacket, a few ink stains on the cuffs. Light traces of paint or charcoal under her fingernails (visible if framed wide enough). An expression that's looking past the viewer toward something interesting — not distracted, just attentive to the world around her. Background: soft gradient with a subtle texture suggesting a studio space without showing any of it.
>
> **Mood**: present in her own world, quietly observant, the kind of person who makes things and sees things others don't.

#### The Wildcard (name TBD by generator)

> **Subject**: A 21-year-old woman, head-and-shoulders portrait. Hair worn loose, slightly windblown, like she just came in from somewhere. A vintage band tee or a leather jacket or both. Subtle eye makeup, the kind that's deliberate but not heavy. A small visible scar somewhere — a thin line above an eyebrow or a faded one on her chin — that the viewer wonders about. A direct, slightly amused expression — half a smile, the kind that suggests she's already three steps ahead in the conversation. A coffee cup or a cigarette held just at the edge of frame, ambiguous. Background: soft gradient with a slight color shift, suggesting a transitional space.
>
> **Mood**: quick, interested, possibly trouble. Magnetic without being polished.

---

### Non-romance character portraits

#### The Roommate / Best Friend (name TBD by generator)

This portrait deserves the same care as the romance cast — the roommate is one of the most narratively important characters in the project.

> **Subject**: A 19-year-old man, head-and-shoulders portrait. East Asian features (the generator can specify ethnicity within this — Korean, Chinese, Japanese, Vietnamese, Filipino, etc.). Slightly broader build for the face — not gaunt, not thin-cheeked. Soft features, dark hair worn in a simple low-maintenance cut, slightly mussed because he hasn't thought about it today. Wearing a comfortable sweatshirt or hoodie — university-affiliated but in a way that's worn-in not flashy. A small visible detail like a friendship-bracelet, a pin on the hoodie, or a pencil tucked behind his ear — something that hints at being thoughtful. An open, warm, genuine smile — not posed, just *resting friendly face*. Eyes that read as kind without being soft. Background: soft warm gradient.
>
> **Mood**: warm, present, the kind of face you immediately trust. Genuinely happy to see whoever's on the other side of the camera.

#### The Bully (specifics TBD by generator)

> **Subject**: A 20-or-21-year-old man or woman (generator picks based on antagonist type), head-and-shoulders portrait. Generically attractive in a deliberate, polished way — well-styled hair, careful clothing, expensive-looking small details. Expression that reads as *measuring* — not openly hostile, just sizing the viewer up. Slight smile that doesn't reach the eyes. Could be wearing a fraternity/sorority pin, a button-down with the top button undone in a curated way, or athletic apparel from an elite-sounding program. The kind of face that's been told it's good-looking and never had a reason to doubt it. Background: cool-toned gradient, slightly less warm than the other portraits.
>
> **Mood**: assessing, polished, the kind of person who doesn't have to be cruel to be the antagonist of someone else's story.

#### The Professor (specifics TBD by generator)

> **Subject**: A 50-something professor, head-and-shoulders portrait. The generator can specify gender, ethnicity, and field. Hair beginning to gray naturally. Wearing a thoughtful outfit — for a male professor, possibly a button-up shirt and a thin sweater; for a female, perhaps a blouse with a scarf or simple jewelry. Glasses pushed up onto the forehead or hanging on a chain. An expression that's both warm and skeptical — the look of someone who has read too many freshman essays. Slight smile, eyes that suggest they're already three questions ahead of you. A book or a coffee cup or a fountain pen partially visible at the edge of the frame. Background: a subtle suggestion of a wood-paneled office without showing any of it.
>
> **Mood**: warm and exacting. The kind of face that demands more from you than you thought you had.

#### The RA (specifics TBD by generator)

> **Subject**: A 21-or-22-year-old, head-and-shoulders portrait. Junior or senior, has been doing the RA job for at least a year and is mildly tired of it. Dressed in a way that's slightly more put-together than the freshman dorm population — a clean shirt, neat hair. Wearing a lanyard with keys visible at the edge of the frame. Expression: friendly-professional, but eyes that read as having already heard every possible excuse this semester. A slight knowing smile. Background: simple neutral gradient.
>
> **Mood**: helpful but unfooled. The mid-management of the dorm.

---

### Generation order priority for portraits

If you're working through these as you have time:

1. **Mari (Townie)** — most fully written character, most narrative weight
2. **The Roommate** — most narratively important non-romance character
3. **The Studious** — chemistry-thread requires both her and the Roommate to be visualized
4. **The remaining three romance options** (Athletic, Artistic, Wildcard) — order doesn't matter
5. **Non-romance characters** (Professor, RA, Bully) — can wait for v1.5

A note on the **player character**: traditionally, Tokimeki-style games don't show the player's portrait — the player is the camera. I'd recommend skipping a player portrait for v1. If you want to add one later for use in mirror-scenes or for Buzz posts the player makes, we can.

---

## Part 2 — App Icons

### Style preamble for icons

Every icon prompt should begin with this block.

> **Style**: pixel art icon, square format with rounded corners (the OS rounds them, but the art should fill the square cleanly), simple symbolic design that reads at small sizes. Solid or simple gradient background fill in a single color per icon. The icon should communicate function with one clear central symbol. Modern flat-design sensibility executed in pixel art. No text inside the icon. Distinct color identity per app so the home screen reads as a varied set, not a uniform palette.

### Style notes for icons

- **Read at small size.** These will display at maybe 32×32 or 48×48 on the phone home screen. Detail beyond that is wasted.
- **One clear symbol per icon.** Don't try to communicate the whole function in the icon — communicate the *category*.
- **Color is your friend.** Each icon's background color should be different enough that the player can identify apps by color alone after a few sessions. Pulse blue, Compass orange, Buzz purple, etc.
- **Avoid skeuomorphism.** Don't try to render a full smartphone-app-icon look. Keep it pixelated, charming, and clearly *of* the game.

### Icons to generate

#### Functional v1 apps (six icons — these are the priority)

**Compass** (map / navigation)
> A simple compass rose — a cross-shape with N/S/E/W points, a circle around it. Background color: warm orange or rust. Should read as "navigation" instantly.

**Pulse** (messages)
> A simple speech bubble or heartbeat-line. Background color: soft blue. Should read as "communication."

**Roster** (contacts)
> A simple stack of cards or a single stylized person silhouette. Background color: muted teal. Should read as "list of people."

**Self / Mirror** (stats)
> A simple bar-chart shape, a circular dial gauge, or an abstract self-portrait silhouette. Background color: warm yellow or gold. Should read as "you, summarized."

**Buzz** (social feed)
> A simple bee silhouette, a "buzz" wave pattern, or a speech-bubble-with-multiple-overlapping-bubbles. Background color: pink or magenta. Should read as "lots of people, lots of voices."

**Anthrop** (goals / tracker / AI assistant)
> A simple stylized "A" that suggests both AI-assistant and being helpful, OR a small abstract checkmark-on-a-list shape, OR a small clipboard with a checkmark. Background color: deep purple or midnight blue. Should feel slightly more sophisticated than the other icons — this is the "trustworthy assistant" app. **Optional small joke**: a tiny anthropic A-shape worked into the design.

#### Decorative v1 apps (five icons — lower priority)

**Spark** (dating app)
> A flame, a heart with a flame, or a striking-match symbol. Background color: bright pink or coral.

**Margin** (notes)
> A simple notebook page with a faint line, or a pencil tip, or a paper-with-corner-folded. Background color: pale yellow or off-white.

**Lens** (camera)
> A simple aperture/shutter shape or a pixelated camera icon. Background color: dark gray or black.

**Wake** (alarm clock)
> A simple bell or analog clock face. Background color: muted red or burgundy.

**Beacon** (browser)
> A lighthouse beam, a simple radar-pulse shape, or a simplified globe. Background color: muted ocean blue or cyan.

---

### Phone home screen design (informational)

You don't need to generate this as one image, but here's how the icons will be arranged so you can think about palette balance:

```
Row 1:  [Compass]  [Pulse]    [Roster]    [Self]
Row 2:  [Buzz]     [Anthrop]  [Spark]     [Margin]
Row 3:  [Lens]     [Wake]     [Beacon]    [empty]
```

Eleven icons across three rows. The home screen should read as colorful but coherent — different background colors per icon so each is identifiable at a glance, but all in the same pixel-art register so it reads as one phone.

---

## Generation order priority for icons

If you're working through these:

1. **Compass, Pulse, Roster, Self, Anthrop** — these are the most-tapped functional apps and the player will see them constantly
2. **Buzz** — also frequently visited
3. **Spark, Margin, Lens, Wake, Beacon** — decorative, can be done last or in any order

---

## When you have an image

Same workflow as the locations: drop it in chat, tell me which character or app it's for, I add it to the artifact's image registry. Placeholders are fine for anything you haven't done yet — the artifact will display a clean blank instead of a broken-image link.

If a portrait or icon comes out wrong, regenerate. The prompts are starting points and you can tweak them. Just keep the **style preamble** consistent across each set (portraits and icons are different sets, but within each set everything should match).

---

## Notes on iteration

For portraits especially, you may need to generate multiple options before one *feels* right. That's normal — the prompt produces a person but doesn't always produce *the* person. If a generated portrait is technically correct but feels off, regenerate. The portraits are going to be the face of the cast for hours of play; it's worth getting them where you want them.

For icons, a single round of generation per app is usually enough. They're symbolic and the prompt is constrained.
