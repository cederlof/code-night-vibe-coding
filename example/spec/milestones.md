
# Milestones

## M1 — Basic Grid & Snake Rendering
- Draw grid on canvas
- Render a single snake (3 segments) at starting position
- Snake is visible and properly positioned on grid

**Test:** Visual confirmation of grid and snake display

---

## M2 — Manual Snake Movement
- Arrow key input handling
- Snake moves one cell per key press (no auto-movement yet)
- No 180° reversal (can't go back on itself)

**Test:** Use arrow keys to move snake around grid in all valid directions

---

## M3 — Basic Collision Detection
- Wall collision detection (edge of grid kills snake)
- Self-collision detection (head hits body kills snake)
- Simple game over state (console log or alert)

**Test:** Intentionally crash into walls and self to verify death

---

## M4 — Tick-Based Auto-Movement
- Snake moves automatically at fixed interval (e.g., 200ms)
- Direction queuing (input changes direction for next tick)
- Game loop with consistent timing

**Test:** Snake moves on its own; can steer without manual movement per cell

---

## M5 — Food System
- Single food spawns on random empty cell
- Food detection (snake head reaches food cell)
- Snake grows by 1 segment when eating
- New food spawns after consumption

**Test:** Collect food multiple times, verify snake grows and food respawns

---

## M6 — Score & HUD
- Score counter (increments with each food eaten)
- Display score on screen
- Display current speed level (starts at 1)

**Test:** Score increases correctly; HUD is visible and accurate

---

## M7 — Speed Progression
- Time-based speed increase (e.g., every 10 seconds)
- Speed level increments and displays
- Tick interval decreases (snake moves faster)

**Test:** Wait through speed changes, verify snake accelerates and level updates

---

## M8 — Start Screen & Countdown
- Start screen with instructions
- Press SPACE to start
- 3-2-1 countdown before snake begins moving

**Test:** Full flow from start screen through countdown to gameplay

---

## M9 — Game Over & Restart
- Game over screen shows final score
- Press R to restart from start screen
- All game state resets properly

**Test:** Complete game loop multiple times; verify clean resets

---

## M10 — Pause/Resume
- Press P to pause/resume during gameplay
- Game state freezes (no movement, no timer)
- Pause indicator visible on screen

**Test:** Pause mid-game, verify all systems frozen; resume and verify continuation

---

## M11 — Edge Case Refinement
- Tail-vacated-cell rule (can move into cell just vacated by tail)
- Food never spawns on snake body
- Consistent restart behavior from any state

**Test:** Move into tail position safely; verify food placement over multiple spawns

---

## M12 — Second Player Setup
- Second snake renders in different color
- WASD controls for Player 2
- Both snakes visible on grid

**Test:** Visual confirmation of two distinct snakes

---

## M13 — Shared Tick Movement
- Both snakes move simultaneously on same tick
- Each maintains independent direction
- Shared speed level affects both

**Test:** Both snakes auto-move together; steering works independently

---

## M14 — Player Collision Rules
- Head-to-head collision (same cell) → both die
- Head into body → attacker dies, other survives
- Test each collision type individually

**Test:** Trigger each collision scenario, verify correct death outcomes

---

## M15 — Simultaneous Move Collisions
- Same empty cell at same tick → both die
- Same food cell at same tick → both die
- Proper detection of simultaneous moves

**Test:** Coordinate movements to trigger simultaneous collisions

---

## M16 — Winner Detection & Display
- Last snake alive wins
- Both die → draw
- Winner/draw banner on game over screen
- Both scores visible

**Test:** Complete multiplayer rounds with win/draw outcomes; verify banners

---

## M17 — Multiplayer Polish
- Both scores tracked independently in HUD
- Clear visual distinction between players
- Smooth restart for multiplayer mode

**Test:** Full multiplayer session with multiple rounds
