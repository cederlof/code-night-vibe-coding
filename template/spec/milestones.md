# Milestones

## M1: Core Movement
**Goal**: Runner moves

- Runner sprite starts behind (left of) the start line
- Runner moves left to right automatically after start button pressed
- Start button triggers movement
- Jump input makes runner jump
- Basic visual: rectangle runner
- Course boundary (start and end points)

**Playable**: Can start and see runner move with jump

---

## M2: Obstacle Detection
**Goal**: Runner reacts to obstacles

- Single obstacle placed on course
- Collision detection: hitting obstacle stops runner briefly
- Runner resumes movement after pause
- Basic visual: rectangle obstacle

**Playable**: Can run and jump, obstacle stops you

---

## M3: Full Course & Timing
**Goal**: Complete course with time tracking

- Fixed course layout with multiple obstacles (5-10)
- Timer displays during run (elapsed time)
- Timer stops at finish line
- Display final time at end
- Display obstacle hit count at end
- Personal best time stored (local storage)
- Display personal best during run
- Restart functionality
- Clear best button to reset personal best
- Runner stays at finish line after completing run
- Runner resets to start when start button is pressed

**Playable**: Can complete runs and track improvement

---

## M4: Two-Player Racing
**Goal**: Race against another player on same screen

- Two runners on same track, one above the other
- Player 1 lane (top) and Player 2 lane (bottom)
- Split canvas vertically into two lanes
- Each lane has identical obstacles at same positions
- Player 1 uses SPACE to jump
- Player 2 uses UP ARROW to jump
- Both runners start simultaneously with Start button
- Both runners move at same speed
- Independent collision detection for each player
- First player to cross finish line wins
- Display both player times when race ends
- Show winner announcement
- Each player has different color (blue vs red)

**Playable**: Can race head-to-head with a friend

---

## M5: Manual Movement Controls
**Goal**: Players control speed by pressing movement keys

- Remove automatic forward movement
- Start button initializes race, but players must press movement keys to go
- Player 1 controls:
  - W key for jumping
  - D key for moving forward
- Player 2 controls:
  - Numpad 8 for jumping
  - Numpad 6 for moving forward
- Speed system:
  - Players accelerate by repeatedly pressing the movement key
  - Faster key presses = faster movement speed
  - Slower key presses = speed decreases
  - Speed has minimum and maximum limits
  - Speed decays gradually when not pressing keys
- Both players start stationary and must "gas pedal" to move

**Playable**: Race by controlling your own speed

---

## M6: Visual & Audio Polish
**Goal**: Smooth and satisfying feel

- Smooth running animation (minimal but fluid)
- Jump animation
- Sound effect: jump
- Sound effect: obstacle hit
- Visual feedback when hitting obstacle

**Playable**: Feels good to play
