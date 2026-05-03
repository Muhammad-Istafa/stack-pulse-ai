# 3D Dynamic Logo — Obsidian Gem

Replace the flat gold diamond with a faceted 3D crystal that floats, rotates, refracts light, and reacts to hover. It will be the new signature mark of StackPulse — luxurious, alive, and on-brand with the Obsidian aesthetic.

## What it looks like

A faceted dark obsidian octahedron (sharp diamond silhouette) with:
- **Glass-like refraction** — light bends through the crystal, picking up the ivory + jewel-blue ambience
- **Glowing gold edges** — each facet outlined in champagne gold (`#c9a96e`)
- **Trapped inner light** — a pulsing gold core that breathes inside the gem
- **Idle motion** — gentle float + slow autonomous rotation (hypnotic, not distracting)
- **Hover interaction** — spins ~3.5x faster, edges brighten to `#e8d5a3`, inner core glows stronger

## Where it appears

1. **Hero section** (`/`) — a 320×320 canvas placed where the static diamond ornament currently sits, between the rule lines. Becomes the focal point of the page.
2. **Sidebar mark** (`AppLayout`) — a compact 32×32 non-interactive version replacing the gradient square in the dashboard sidebar.

## Technical approach

- **Library**: `@react-three/fiber@8.18.0` + `@react-three/drei@9.122.0` + `three@0.160.0` (already installed, React-18 compatible).
- **New component**: `src/components/ObsidianLogo3D.tsx`
  - `<Canvas>` with transparent background so it blends into the dark page
  - `OctahedronGeometry` (sharp diamond shape, matches existing ornament language)
  - `MeshTransmissionMaterial` for glass refraction with chromatic aberration
  - `Edges` helper for the glowing gold wireframe
  - Inner mesh with `meshBasicMaterial` (toneMapped: false) for the bloom-like core glow
  - `Float` from drei for idle bobbing
  - `useFrame` to drive rotation speed based on hover state
  - Three lights: warm gold key, cool jewel-blue rim, gold point light inside
  - `Environment preset="night"` for realistic reflections
- **Lazy-loaded** via `React.lazy` + `Suspense` so the 700kB three.js bundle only loads when the logo mounts (keeps initial route fast).
- **Reduced-motion**: respects `prefers-reduced-motion` — disables auto-rotation, keeps a still gem.

## Files

- **Create** `src/components/ObsidianLogo3D.tsx` (~110 lines)
- **Edit** `src/pages/Index.tsx` — replace the central static diamond in hero with the 3D logo
- **Edit** `src/components/AppLayout.tsx` — replace the gradient square with a small static instance of the gem

## Verification

Run typecheck and `vite build` afterwards to confirm bundle still builds cleanly with the 3D dependency.
