import React, { useState, useMemo } from 'react';

// ============================================================================
// IMAGE REGISTRY DATA
// ============================================================================
// This is the canonical registry. Replace `url` with a real image URL
// and set `status` to "active" when an asset is ready.
// Keys here are referenced from artifact code; do not rename them.

const REGISTRY = {
  locations: {
    dorm_room:           { url: "https://raw.githubusercontent.com/schlitzohr95/student-body-assets/main/locations/dorm_room.svg", status: "active", label: "Dorm Room", category: "campus" },
    lecture_hall:        { url: null, status: "pending", label: "Lecture Hall",               category: "campus" },
    library_main:        { url: null, status: "pending", label: "Library — Main Floor",       category: "campus" },
    library_stacks:      { url: null, status: "pending", label: "Library — Upper Stacks",     category: "campus" },
    dining_hall:         { url: null, status: "pending", label: "Dining Hall",                category: "campus" },
    quad:                { url: null, status: "pending", label: "The Quad",                   category: "campus" },
    gym:                 { url: null, status: "pending", label: "Gym",                        category: "campus" },
    student_union:       { url: null, status: "pending", label: "Student Union",              category: "campus" },
    running_trail:       { url: null, status: "pending", label: "Running Trail",              category: "campus" },
    coffee_shop:         { url: "https://raw.githubusercontent.com/schlitzohr95/student-body-assets/main/locations/coffee_shop.svg", status: "active", label: "Field Notes Coffee", category: "town" },
    townie_apartment:    { url: null, status: "pending", label: "Townie's Building",          category: "town" },
    bar:                 { url: null, status: "pending", label: "The Bar",                    category: "town" },
    bookstore:           { url: null, status: "pending", label: "Bookstore",                  category: "town" },
    park:                { url: null, status: "pending", label: "Town Park",                  category: "town" },
    restaurant:          { url: null, status: "pending", label: "Restaurant",                 category: "town" },
    quad_night:          { url: null, status: "pending", label: "Quad at Night",              category: "atmosphere" },
    walking_path:        { url: null, status: "pending", label: "Walking Path",               category: "atmosphere" },
    dorm_hallway:        { url: null, status: "pending", label: "Dorm Hallway",               category: "atmosphere" },
  },
  portraits: {
    townie:    { url: "https://raw.githubusercontent.com/schlitzohr95/student-body-assets/main/portraits/townie.svg", status: "active", label: "Mari (Townie)", archetype: "romance" },
    studious:  { url: null, status: "pending", label: "Studious",          archetype: "romance" },
    athletic:  { url: null, status: "pending", label: "Athletic",          archetype: "romance" },
    artistic:  { url: null, status: "pending", label: "Artistic",          archetype: "romance" },
    wildcard:  { url: null, status: "pending", label: "Wildcard",          archetype: "romance" },
    roommate:  { url: null, status: "pending", label: "Roommate",          archetype: "non-romance" },
    bully:     { url: null, status: "pending", label: "Bully",             archetype: "non-romance" },
    professor: { url: null, status: "pending", label: "Professor",         archetype: "non-romance" },
    ra:        { url: null, status: "pending", label: "RA",                archetype: "non-romance" },
  },
  icons: {
    compass: { url: "https://raw.githubusercontent.com/schlitzohr95/student-body-assets/main/icons/compass.svg", status: "active", label: "Compass", color: "#C45B3A", role: "functional", glyph: "✦" },
    pulse:   { url: null, status: "pending", label: "Pulse",   color: "#5A8FA8", role: "functional", glyph: "◐" },
    roster:  { url: null, status: "pending", label: "Roster",  color: "#5E8B7E", role: "functional", glyph: "▤" },
    self:    { url: null, status: "pending", label: "Self",    color: "#C99E3F", role: "functional", glyph: "◈" },
    buzz:    { url: null, status: "pending", label: "Buzz",    color: "#A85A8C", role: "functional", glyph: "◌" },
    anthrop: { url: null, status: "pending", label: "Anthrop", color: "#3C3A6E", role: "functional", glyph: "A" },
    spark:   { url: null, status: "pending", label: "Spark",   color: "#D86F6A", role: "decorative", glyph: "✸" },
    margin:  { url: null, status: "pending", label: "Margin",  color: "#C9B575", role: "decorative", glyph: "▭" },
    lens:    { url: null, status: "pending", label: "Lens",    color: "#3F3F45", role: "decorative", glyph: "◉" },
    wake:    { url: null, status: "pending", label: "Wake",    color: "#8E3A3A", role: "decorative", glyph: "◷" },
    beacon:  { url: null, status: "pending", label: "Beacon",  color: "#5A8AA8", role: "decorative", glyph: "◊" },
  },
};

// ============================================================================
// PLACEHOLDER SVG COMPONENTS
// ============================================================================

const CATEGORY_TINTS = {
  campus:     { from: "#F4E4C1", to: "#E8C896", glyph: "❖" },
  town:       { from: "#E8D4B5", to: "#D9B380", glyph: "◉" },
  atmosphere: { from: "#D4C4A8", to: "#A89878", glyph: "✶" },
};

const ARCHETYPE_TINTS = {
  romance:       { from: "#F2D7B8", to: "#D89572" },
  "non-romance": { from: "#D4D2C0", to: "#9E9C82" },
};

function LocationPlaceholder({ label, category, url }) {
  if (url) {
    return (
      <div style={{ width: "100%", aspectRatio: "16 / 10", borderRadius: "4px", overflow: "hidden", border: "1px solid #8B6F3D" }}>
        <img src={url} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  const tint = CATEGORY_TINTS[category] || CATEGORY_TINTS.campus;
  const id = `grad-${label.replace(/\s+/g, '-')}`;
  return (
    <svg viewBox="0 0 320 200" style={{ width: "100%", height: "auto", display: "block", borderRadius: "4px", border: "1px solid #8B6F3D" }}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={tint.from} />
          <stop offset="100%" stopColor={tint.to} />
        </linearGradient>
        <pattern id={`grid-${id}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="transparent" />
          <rect width="1" height="1" fill="#8B6F3D" opacity="0.18" />
        </pattern>
      </defs>
      <rect width="320" height="200" fill={`url(#${id})`} />
      <rect width="320" height="200" fill={`url(#grid-${id})`} />
      <text x="160" y="90" textAnchor="middle" fill="#5C3A1F" fontFamily="ui-monospace, monospace" fontSize="44" fontWeight="700" opacity="0.45">{tint.glyph}</text>
      <text x="160" y="135" textAnchor="middle" fill="#3C2510" fontFamily="ui-monospace, monospace" fontSize="14" fontWeight="600" letterSpacing="1.5">{label.toUpperCase()}</text>
      <text x="160" y="156" textAnchor="middle" fill="#5C3A1F" fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="2" opacity="0.65">PLACEHOLDER</text>
    </svg>
  );
}

function PortraitPlaceholder({ label, archetype, url }) {
  if (url) {
    return (
      <div style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: "50%", overflow: "hidden", border: "2px solid #8B6F3D" }}>
        <img src={url} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  const tint = ARCHETYPE_TINTS[archetype] || ARCHETYPE_TINTS.romance;
  const initial = label.charAt(0).toUpperCase();
  const id = `port-${label.replace(/\s+/g, '-')}`;
  return (
    <svg viewBox="0 0 200 200" style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <radialGradient id={id} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={tint.from} />
          <stop offset="100%" stopColor={tint.to} />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill={`url(#${id})`} stroke="#8B6F3D" strokeWidth="2" />
      <text x="100" y="118" textAnchor="middle" fill="#3C2510" fontFamily="Georgia, 'Times New Roman', serif" fontSize="76" fontWeight="700" opacity="0.55">{initial}</text>
    </svg>
  );
}

function IconPlaceholder({ label, color, glyph, url }) {
  if (url) {
    return (
      <div style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(60,37,16,0.3)" }}>
        <img src={url} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "auto", display: "block", borderRadius: "16px" }}>
      <rect width="100" height="100" rx="16" fill={color} />
      <rect width="100" height="100" rx="16" fill="white" opacity="0.05" />
      <text x="50" y="68" textAnchor="middle" fill="white" fontFamily="ui-monospace, monospace" fontSize="48" fontWeight="600" opacity="0.95">{glyph}</text>
    </svg>
  );
}

// ============================================================================
// REGISTRY VIEWER
// ============================================================================

const styles = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #F7EFDD 0%, #EFE3C7 100%)",
    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
    color: "#3C2510",
    padding: "32px 24px 80px",
  },
  inner: {
    maxWidth: "1080px",
    margin: "0 auto",
  },
  header: {
    borderBottom: "1px solid #8B6F3D",
    paddingBottom: "20px",
    marginBottom: "32px",
  },
  pretitle: {
    fontFamily: "ui-monospace, monospace",
    fontSize: "11px",
    letterSpacing: "3px",
    color: "#8B6F3D",
    marginBottom: "8px",
  },
  title: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "42px",
    fontWeight: "400",
    fontStyle: "italic",
    margin: "0 0 8px 0",
    color: "#3C2510",
  },
  subtitle: {
    fontFamily: "ui-monospace, monospace",
    fontSize: "13px",
    color: "#6B4F2D",
    margin: 0,
  },
  statsBar: {
    display: "flex",
    gap: "24px",
    marginTop: "20px",
    fontSize: "12px",
    flexWrap: "wrap",
  },
  stat: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  statDot: (color) => ({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: color,
  }),
  controls: {
    display: "flex",
    gap: "8px",
    marginBottom: "32px",
    flexWrap: "wrap",
  },
  filterBtn: (active) => ({
    padding: "6px 14px",
    fontSize: "11px",
    letterSpacing: "1.5px",
    fontFamily: "ui-monospace, monospace",
    background: active ? "#3C2510" : "transparent",
    color: active ? "#F7EFDD" : "#3C2510",
    border: "1px solid #3C2510",
    borderRadius: "2px",
    cursor: "pointer",
    textTransform: "uppercase",
  }),
  sectionTitle: {
    fontFamily: "Georgia, serif",
    fontStyle: "italic",
    fontSize: "24px",
    fontWeight: "400",
    margin: "40px 0 4px 0",
  },
  sectionDesc: {
    fontSize: "12px",
    color: "#6B4F2D",
    margin: "0 0 20px 0",
  },
  locGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  portraitGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "20px",
  },
  iconGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
    gap: "16px",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  cardLabel: {
    fontSize: "11px",
    letterSpacing: "1px",
    color: "#3C2510",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  cardMeta: {
    fontSize: "10px",
    color: "#8B6F3D",
    fontFamily: "ui-monospace, monospace",
  },
  cardKey: {
    fontSize: "9px",
    color: "#A89878",
    fontFamily: "ui-monospace, monospace",
    letterSpacing: "0.5px",
  },
  iconCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    textAlign: "center",
  },
  footer: {
    marginTop: "60px",
    paddingTop: "24px",
    borderTop: "1px solid #8B6F3D",
    fontSize: "11px",
    color: "#6B4F2D",
    lineHeight: "1.7",
  },
};

export default function ImageRegistry() {
  const [filter, setFilter] = useState("all");

  const stats = useMemo(() => {
    const all = [
      ...Object.values(REGISTRY.locations),
      ...Object.values(REGISTRY.portraits),
      ...Object.values(REGISTRY.icons),
    ];
    return {
      total: all.length,
      active: all.filter((e) => e.status === "active").length,
      pending: all.filter((e) => e.status === "pending").length,
    };
  }, []);

  const showLocations = filter === "all" || filter === "locations";
  const showPortraits = filter === "all" || filter === "portraits";
  const showIcons = filter === "all" || filter === "icons";

  return (
    <div style={styles.root}>
      <div style={styles.inner}>
        <header style={styles.header}>
          <div style={styles.pretitle}>STUDENT BODY · ASSET REGISTRY</div>
          <h1 style={styles.title}>Image Registry</h1>
          <p style={styles.subtitle}>v0.3 · Standalone preview · {stats.total} entries</p>
          <div style={styles.statsBar}>
            <div style={styles.stat}>
              <span style={styles.statDot("#5E8B7E")} />
              <span>{stats.active} active</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statDot("#C99E3F")} />
              <span>{stats.pending} pending</span>
            </div>
            <div style={styles.stat}>
              <span style={{ color: "#8B6F3D" }}>·</span>
              <span>{Object.keys(REGISTRY.locations).length} locations</span>
            </div>
            <div style={styles.stat}>
              <span style={{ color: "#8B6F3D" }}>·</span>
              <span>{Object.keys(REGISTRY.portraits).length} portraits</span>
            </div>
            <div style={styles.stat}>
              <span style={{ color: "#8B6F3D" }}>·</span>
              <span>{Object.keys(REGISTRY.icons).length} icons</span>
            </div>
          </div>
        </header>

        <div style={styles.controls}>
          {["all", "locations", "portraits", "icons"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={styles.filterBtn(filter === f)}>
              {f}
            </button>
          ))}
        </div>

        {showLocations && (
          <section>
            <h2 style={styles.sectionTitle}>Locations</h2>
            <p style={styles.sectionDesc}>
              Background plates. Campus, town, atmospheric. Generated against the locked style preamble.
            </p>
            <div style={styles.locGrid}>
              {Object.entries(REGISTRY.locations).map(([key, entry]) => (
                <div key={key} style={styles.card}>
                  <LocationPlaceholder label={entry.label} category={entry.category} url={entry.url} />
                  <div>
                    <div style={styles.cardLabel}>{entry.label}</div>
                    <div style={styles.cardMeta}>{entry.category} · {entry.status}</div>
                    <div style={styles.cardKey}>{key}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {showPortraits && (
          <section>
            <h2 style={styles.sectionTitle}>Portraits</h2>
            <p style={styles.sectionDesc}>
              Head-and-shoulders. Romance cast on warm-tint backgrounds, non-romance on muted gray.
            </p>
            <div style={styles.portraitGrid}>
              {Object.entries(REGISTRY.portraits).map(([key, entry]) => (
                <div key={key} style={styles.card}>
                  <PortraitPlaceholder label={entry.label} archetype={entry.archetype} url={entry.url} />
                  <div style={{ textAlign: "center" }}>
                    <div style={styles.cardLabel}>{entry.label}</div>
                    <div style={styles.cardMeta}>{entry.archetype}</div>
                    <div style={styles.cardKey}>{key}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {showIcons && (
          <section>
            <h2 style={styles.sectionTitle}>App Icons</h2>
            <p style={styles.sectionDesc}>
              Phone home screen. Six functional in v1, five decorative. Each icon has a locked color identity.
            </p>
            <div style={styles.iconGrid}>
              {Object.entries(REGISTRY.icons).map(([key, entry]) => (
                <div key={key} style={styles.iconCard}>
                  <IconPlaceholder label={entry.label} color={entry.color} glyph={entry.glyph} url={entry.url} />
                  <div>
                    <div style={styles.cardLabel}>{entry.label}</div>
                    <div style={styles.cardMeta}>{entry.role}</div>
                    <div style={styles.cardKey}>{key}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer style={styles.footer}>
          <p style={{ margin: 0 }}>
            <strong style={{ color: "#3C2510" }}>How to populate:</strong> Replace <code style={{ background: "#E8D4B5", padding: "1px 5px", borderRadius: "2px" }}>url: null</code> with a real image URL and set <code style={{ background: "#E8D4B5", padding: "1px 5px", borderRadius: "2px" }}>status: "active"</code>. The card will swap from placeholder to image automatically. Keys are stable references the rest of the artifact uses; do not rename them.
          </p>
          <p style={{ margin: "12px 0 0 0" }}>
            <strong style={{ color: "#3C2510" }}>Placeholders:</strong> Inline SVG, no external dependencies. Locations use a category-tinted gradient with a glyph; portraits use an archetype-tinted radial with the character's first initial; icons use their locked brand color with a symbolic glyph.
          </p>
        </footer>
      </div>
    </div>
  );
}
