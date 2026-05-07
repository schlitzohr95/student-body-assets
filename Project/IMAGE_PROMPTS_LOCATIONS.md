# Student Body — Location & Setting Image Prompts

This doc contains the image generation prompts for every location in the game. Use whichever image generator you prefer (Midjourney, DALL-E, Stable Diffusion, etc.); the prompts are written generically enough to work across systems.

The goal is **visual coherence across all locations**. The single biggest determinant of that is the style preamble at the top — every prompt below starts with the same style block. If you decide to tweak the style, change it at the top and re-do the set; don't mix styles across locations.

---

## Style preamble (locked in)

Every prompt should begin with this block. Treat it as the first paragraph of every image generation request.

> **Style**: soft pixel art, 16-bit era inspired but slightly more detail than authentic 16-bit (think modern indie games — *Stardew Valley*, *Eastward*, *Coromon*). Warm, slightly desaturated color palette. Limited but expressive color use. Soft pixel-perfect edges, no anti-aliasing blur, no painterly rendering. Top-down or side-on perspective depending on location (specified per-prompt). No people in the scene — environments only. Cozy, lived-in atmosphere. Slight grain. Designed as a background plate for a narrative game; the scene should feel inhabitable rather than decorative.

### Style notes (read once, then apply)

- **No people** in any of these images. Characters get separate portrait treatment. People appearing in backgrounds creates consistency problems and makes scenes feel staged.
- **Lived-in detail beats clean composition.** A library should have a stack of books left on a table, a coffee shop should have crumbs on the counter, a dorm should have laundry on a chair. The atmosphere comes from specifics, not pristine renders.
- **Time of day matters.** Some locations are specified at a specific time (the coffee shop at dawn, the library at dusk). If the prompt doesn't specify, default to *late afternoon, soft warm light*.
- **Avoid signage and text** unless specifically called for. Pixel-art text rarely looks right and rarely needs to be there. The narrator describes the place; the image evokes it.
- **No copyrighted IP or branding.** No real college logos, no recognizable storefronts, no real product names. The world is a fictional one.

---

## Locations

### Campus locations

#### 1. The Dorm Room (player + roommate)

The player and his best friend share this room. It's the most-visited interior in the game and needs to feel *theirs*.

> **Subject**: A college dorm room shared by two male students who are close friends. Two beds — one lofted with a desk underneath, one a regular bed against the opposite wall. Two desks, both visibly used. One side of the room shows a person who's organized but not pristine — books stacked but recently used, a few framed photos, a small plant. The other side is messier — open notebooks, a coffee mug, a hoodie thrown on the chair, a poster taped slightly crooked. Shared mini-fridge between the desks. A rug that doesn't match anything else. String lights along one wall. Window with the view of the campus quad outside, late afternoon light coming in. Door slightly ajar showing a bit of the dorm hallway.
>
> **Perspective**: side-on, slightly elevated, framed so both halves of the room are visible at once. Like a cutaway view of the room but realistic.
>
> **Mood**: warm, lived-in, the kind of room two friends have spent enough time in to leave their mark. Not staged. Not clean. Comfortable.

#### 2. The Lecture Hall

A generic mid-sized lecture hall, used for most class scenes.

> **Subject**: Empty mid-sized university lecture hall. Tiered rows of fixed seating with small fold-down desks, sloping down toward a podium and a large blackboard or whiteboard at the front. Some chairs have backpacks left under them. A few notebooks open on desks here and there as if students just stepped out. The board has the faint ghosts of erased equations or notes. High windows along one side letting in morning light. Slightly worn — this is a building used for decades. Acoustic tile ceiling. Fluorescent lights overhead, some on, some off.
>
> **Perspective**: from the back of the room looking down toward the podium.
>
> **Mood**: neutral-academic, slight nostalgia, the quiet of a room that's just emptied.

#### 3. The Library — Main Floor

The library is one of the most narratively important locations (Studious lives here). Worth two prompts — main floor for general studying, the upper stacks for quieter scenes.

> **Subject**: The main floor of a university library. Long wooden study tables with green-shaded library lamps. High windows on one side. Tall bookshelves visible in the background. A few tables show signs of use — open laptops (unbranded), stacks of books, a coffee cup, a discarded scarf. A wheeled cart of books to be reshelved sits at the end of one row. The floor is worn wood. There's a study carrel against the back wall with a small lamp. Late afternoon light, golden, coming through the windows.
>
> **Perspective**: side-on, slightly elevated, looking across the room.
>
> **Mood**: studious, quietly populated, the warm hum of a place where people are concentrating.

#### 4. The Library — Upper Stacks

> **Subject**: A narrow aisle between two tall bookshelves on an upper floor of a university library. Shelves packed with old hardback books, spines facing out, slight dust. A small wooden chair pushed against one shelf. A single bare bulb hanging overhead. A window at the end of the aisle showing the dimming evening sky. The floor is dark wood, slightly creaky-looking. A few books are pulled out of place, marking where someone was just researching.
>
> **Perspective**: looking down the aisle toward the window at the end.
>
> **Mood**: quiet, slightly secretive, the feeling of a place where a private conversation could happen.

#### 5. The Dining Hall

> **Subject**: A university dining hall, mid-afternoon when it's mostly empty. Long shared tables with mismatched chairs. A serving line on one wall (currently closed/dark). A few abandoned trays on a side cart. Big windows showing the quad. Industrial-feeling but warmed by use — the floor is scuffed, there's a corkboard with student flyers near the entrance, a stack of napkin dispensers on a side table. A coffee station against one wall. The air feels slightly post-rush.
>
> **Perspective**: from one of the doors looking in across the room.
>
> **Mood**: institutional but lived-in. The quiet between meals.

#### 6. The Quad

> **Subject**: The central grassy quadrangle of a small liberal arts college, in early fall. A few large trees with leaves just beginning to turn yellow and orange. Stone paths cutting across the grass between buildings. Some scattered groups of trees and benches. A few abandoned items — a frisbee on the grass, a backpack leaned against a tree, a chalk hopscotch grid faded on a path. Old stone academic buildings visible at the edges of the frame. A bell tower in the distance.
>
> **Perspective**: slightly elevated, like looking down from a third-floor window.
>
> **Mood**: nostalgic, golden, the ideal version of a college quad on a perfect afternoon.

#### 7. The Gym

> **Subject**: A small university gym. A row of treadmills facing a wall of mirrors. A weight rack along another wall with dumbbells in pairs. A pull-up bar setup. Yoga mats stacked in a corner. A water fountain by the door. The floor is rubberized, scuffed in places. A whiteboard near the entrance with handwritten workout-of-the-day notes. A lone basketball sitting near a bench. Fluorescent lighting. The smell of it — almost visible — that mix of rubber and sweat and cleaning spray.
>
> **Perspective**: from the entrance looking in.
>
> **Mood**: utilitarian, well-used, not flashy. A small-school gym, not a fitness center.

#### 8. The Student Union (with bulletin board)

This is where the bulletin board sub-interaction lives. The bulletin board itself is the focal point.

> **Subject**: The lobby of a university student union building. Mid-traffic — backpacks left on a couch, a few coffee cups on a low table — but no people in frame. To one side, a large cork bulletin board completely covered in overlapping flyers — handmade posters, photocopied event notices, a few professionally printed announcements, business cards, a tear-off-tab flyer at the bottom of the board with most tabs missing. The flyers are mostly unreadable but suggest a riot of campus activity. To the other side, a worn couch, a coffee table with magazines, a vending machine. Big windows showing the quad outside. Warm interior light against the gray late afternoon.
>
> **Perspective**: angled so both the bulletin board and the seating area are visible.
>
> **Mood**: a hub. The sense of a place that everything passes through.

#### 9. The Running Trail

For scenes with the Athletic and for the player's running activities.

> **Subject**: A wooded running trail near a college campus, in fall. Packed dirt path winding between trees. Leaves on the ground in oranges and yellows. A few trail markers nailed to trees. A simple wooden bench off to one side, weathered. A small wooden bridge over a creek visible in the middle distance. The light is the soft gold of late afternoon, dappled through trees. A pair of running shoes prints in the dirt going off into the distance.
>
> **Perspective**: looking down the trail from a runner's eye view.
>
> **Mood**: peaceful, healthy, the kind of trail someone runs every week without thinking about it.

### Town locations

#### 10. The Coffee Shop (Field Notes Coffee — the Townie's workplace)

This is one of the most narratively important locations. Worth getting right.

> **Subject**: A small independent coffee shop in a college town. Worn wooden floors, exposed brick on one wall, mismatched chairs and small tables. A long counter with a vintage espresso machine, a tip jar with a handwritten label, a small pastry case. A chalkboard menu above the counter with the daily specials hand-lettered. Local art on one wall — original pieces, not prints. A window seat with a view of the street outside (some autumn leaves on the sidewalk). A few books left on shelves for customers to browse. A small sign reading "Field Notes Coffee" in handmade script visible on the wall behind the counter. Soft pendant lights overhead. Late afternoon, the shop is quiet, light coming in slanted through the front window.
>
> **Perspective**: from a corner table looking across the room toward the counter.
>
> **Mood**: warm, independent, the kind of place that has regulars. Lived-in. Not Instagram-perfect, just genuinely good.

#### 11. The Townie's Apartment Building (exterior)

We may not need an interior of her apartment for v1; the exterior establishes the geography of where she lives.

> **Subject**: A two-story commercial building in a small downtown, at dusk. Ground floor is a hardware store with darkened windows showing tools and household items behind security gates that have been pulled partway down. Upstairs, two windows are lit warm yellow — one shows a sliver of an interior with bookshelves, one is curtained. A narrow side door with a small sign indicating apartment access — this is how Mari gets to her place. A fire escape running up one side. A streetlight beginning to flicker on overhead. A few autumn leaves on the sidewalk. The building is brick, slightly worn, painted decades ago. The kind of building that's been here longer than any of the businesses currently inside it.
>
> **Perspective**: from across the street looking up at the building.
>
> **Mood**: working-class urban, honest, slightly lonely but not bleak. A real place where someone real lives.

#### 12. The Bar

> **Subject**: A small college-town bar, the kind locals and students share. Dark wood interior. A long bar with stools, a few beer taps with hand-carved wooden handles. A dartboard on one wall, a small chalkboard with trivia night info. A jukebox in the corner. Booths along one wall with worn red vinyl seats. A few neon signs but not too many — this isn't a sports bar. A pool table visible in the back. Empty glasses on the bar suggesting it just opened or just emptied. Soft warm lighting, mostly from sconces and the bar back-lighting. A handwritten sign saying "Cash or card, no Venmo, don't ask" tucked beside the register.
>
> **Perspective**: from a booth looking across the room toward the bar.
>
> **Mood**: a real bar, not a college club. The kind of place where conversations happen.

#### 13. The Bookstore

> **Subject**: A small independent bookstore. Tall wooden shelves packed with books, some shelves labeled by section with handwritten cards. A single overstuffed armchair in a corner with a bookmark-shaped pillow. A counter near the front with a vintage cash register and a stack of bookmarks free for the taking. A "staff picks" display on a small table with handwritten notes attached to each book. A cat bed in the front window (cat optional — could be empty, suggesting the cat is somewhere in the store). String lights overhead. A bell over the door visible from inside. Afternoon light, autumn-colored, coming through the front window.
>
> **Perspective**: from near the entrance looking back through the shelves.
>
> **Mood**: cozy, beloved, the kind of bookstore that has its own gravity for the kind of people who would love it.

#### 14. The Park

For dates, walks, and outdoor scenes outside the running trail.

> **Subject**: A small town park with a central pond, surrounded by walking paths, benches, and old trees. A wooden gazebo on one side. A small footbridge over the narrow part of the pond. Some ducks on the water. Park benches at intervals along the path, one with a forgotten paperback book on it. Old cast-iron streetlamps along the path beginning to glow on as evening approaches. Autumn leaves drifting on the water. The buildings of the town visible just past the trees in the distance.
>
> **Perspective**: from one of the paths, looking across the pond toward the gazebo.
>
> **Mood**: gentle, romantic-but-not-clichéd, the kind of public place that holds private moments.

#### 15. The Restaurant

The town's "one nice restaurant." Used for date scenes that need to feel slightly elevated without being formal.

> **Subject**: A small upscale-but-unpretentious restaurant in a college town. White tablecloths but mismatched chairs. Small candles on each table — real candles, not battery. A chalkboard with the day's specials in cursive. Exposed beams overhead with subtle string lights wrapped around them. An open kitchen visible at the back, copper pans hanging over a counter where a chef would be working. Floor-to-ceiling windows looking out at a street with one or two trees. A small bar at the front with maybe five seats. Wine bottles displayed on a shelf along one wall. Evening, lights warm and low, the room feels intimate without being dim.
>
> **Perspective**: from a corner table looking across the room toward the open kitchen.
>
> **Mood**: special-but-not-fancy. The kind of place a college student would save for an actual occasion.

---

## Special / atmospheric scenes

These are not required for v1 but might be worth doing once core locations are done. They give the narrator more atmospheric variety.

#### 16. The Quad at Night

> **Subject**: Same composition as the Quad image (#6) but at night. The grass is dark. Lamp posts along the paths cast pools of warm yellow light. A few academic building windows are lit from within. The bell tower silhouetted against a dark blue sky with a few stars visible. The leaves on the trees rustling — hinted at through slight motion blur in the leaves. A bench in the foreground with a forgotten coffee cup. The whole scene has a hush to it.
>
> **Mood**: quiet, secret, the campus when most students are asleep or studying inside.

#### 17. The Walking Path Between Town and Campus

> **Subject**: A long sidewalk-and-tree-lined path connecting the campus to the downtown of the town. Old streetlamps at intervals. Maple trees on both sides, leaves just turning. A few houses set back from the path on one side — older, lived-in, some with porches where things are happening (chairs, plants, a wind chime). On the other side, a low stone wall. Late afternoon light slanting through the trees. The path curves slightly so the destination on either end is just out of sight.
>
> **Mood**: the in-between space. Where many of the small intimate walks-home scenes will happen.

#### 18. The Dorm Hallway

> **Subject**: A college dormitory hallway. Doors on both sides — most closed, some with whiteboards stuck on with handwritten notes (mostly illegible at the image's scale). One door slightly ajar. A bulletin board near a corner with RA notices. Carpeted floor, slightly dingy. Fluorescent lighting overhead. A bicycle leaned against one wall (probably against dorm policy). The hallway extends into the distance with a window at the far end showing the campus outside.
>
> **Mood**: lived-in institutional. The transitional space where roommate scenes start and end.

---

## Notes on generation order

If you're working through these as you have time, here's the suggested priority order:

1. **Dorm Room** (#1) — most-visited, sets the tone for player-roommate texture
2. **Coffee Shop** (#10) — most-visited romance location, key for the Townie arc
3. **Library Main Floor** (#3) — key for the Studious arc, also a frequent player location
4. **The Quad** (#6) — establishes the campus identity
5. **Student Union with bulletin board** (#8) — the discovery hub
6. **Lecture Hall** (#2) — class scenes
7. **Dining Hall** (#5) — frequent meet-up location
8. **Gym** (#7) — Athletic arc
9. **Bookstore** (#13) — Studious / Artistic flavor
10. **Park** (#14) — date scenes
11. **Bar** (#12) — Wildcard arc, social scenes
12. **Running Trail** (#9) — Athletic arc
13. **Townie's Apartment Building** (#11) — Townie arc deeper beats
14. **Restaurant** (#15) — special date scenes
15. **Library Upper Stacks** (#4) — atmospheric variant, lower priority

Items 16–18 are all v1.5 nice-to-haves.

---

## When you have an image

When you've generated something you want to use, drop it in the chat and tell me which location it's for. I'll add it to the artifact's image registry and we'll wire it up. Any image you don't have yet, the artifact will show a clean placeholder for — no blocking on assets.

If a generation comes out wrong in a way you want to fix, just regenerate. The prompts here are starting points; tweak them if you find a better wording or want to push the style somewhere specific. Just keep the **style preamble** consistent across the set.
