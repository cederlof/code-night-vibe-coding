# Milestones

## M1: Playable Core ✅
**Goal:** Completable maze with working physics and timer

- Static small maze (e.g., 10×10 grid)
- Car sprite with position and rotation
- Arrow key input (UP/DOWN/LEFT/RIGHT)
- Acceleration, braking, friction, and turning with drift
- Wall collision detection with rebound and speed penalty
- Goal area (highlighted)
- Win detection (reach goal)
- Timer: starts on first input, displays current time
- Restart button (R key)

**Done when:** You can navigate start to finish and see your time.

---

## M2: Polish & Feedback ✅
**Goal:** Smooth, responsive experience

- Speedometer display
- Best time saved in localStorage
- Best time shown on win screen or HUD
- Tune physics constants (acceleration, friction, turn rate, bounce)
- Visual feedback for collisions (optional: flash/shake)
- Smooth rendering (requestAnimationFrame)

**Done when:** Controls feel tight and time-beating is satisfying.

---

## M3: Configurability & Iteration ✅
**Goal:** Adjustable difficulty and replayability

- Maze size/complexity config (small/medium/large presets or custom)
- Multiple static maze layouts (swap via dropdown/button)
- Optional: reset best time button
- Optional: visual improvements (better sprites, goal animation)

**Done when:** Player can choose maze size and try different layouts.

---

## M4: 3D Rendering (In Progress)
**Goal:** Convert 2D top-down view to immersive 3D third-person perspective

- Integrate Three.js via CDN
- Setup 3D scene, camera, and renderer
- Convert 2D maze layout to 3D world:
  - Walls at 3x car height
  - Floor plane matching entire maze area
  - Goal marker in 3D space
- Create simple 3D car model (box geometry)
- Implement third-person follow camera (rotates with car, slightly offset)
- Basic lighting (ambient + directional, no shadows yet)
- Maintain all existing physics and collision logic (2D calculations)
- Translate 2D coordinates to 3D positioning
- Keep 2D HUD elements as HTML overlay
- Test performance (target 60 FPS)

**Done when:** Game plays identically to 2D version but with 3D perspective and tall maze walls.

---

## M5: 3D Polish (Future)
**Goal:** Enhanced visuals while maintaining performance

- Add shadows
- Add textures to walls/floor
- Improve car model detail
- Particle effects for collisions
- Environmental details (lighting improvements)