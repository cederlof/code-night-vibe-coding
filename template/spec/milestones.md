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

## M6: 3D Perspective Transformation
**Goal**: Transform to 3D forward-moving perspective

- Change from 2D side-scrolling to 3D perspective view
- Movement goes forward (into the screen) instead of sideways
- Obstacles come toward the player from distance
- Player figure visible from behind (runner seen from back)
- Split-screen layout:
  - Player 1 viewport on left half of canvas
  - Player 2 viewport on right half of canvas
  - Each player has independent perspective view
- Controls remain same (W/D for P1, Numpad8/6 for P2)
- W key moves player forward in their lane
- D key (P1) and Numpad 6 (P2) become strafe/lane change (optional)
- 3D rendering:
  - Ground plane with perspective
  - Obstacles scale larger as they approach
  - Distance/depth perception
  - Horizon line
- Course length measured in depth (distance forward)
- Finish line at end of track depth

**Playable**: Race in 3D perspective view

---

## M7: Strafing Controls
**Goal**: Add left/right movement for dodging obstacles

- Player 1 controls:
  - W key for forward movement/speed
  - D key for strafing left
  - A key for strafing right
- Player 2 controls:
  - Numpad 8 for forward movement/speed
  - Numpad 6 for strafing left
  - Numpad 4 for strafing right
- Strafing mechanics:
  - Players can move left/right within their lane
  - Smooth animated transitions between positions
  - Larger discrete steps (like changing lanes)
  - Car-like smooth movement feel
  - Lane boundaries prevent moving too far left/right
  - Strafing allows dodging obstacles sideways
  - Maintain forward momentum while strafing
- Visual feedback for strafe position

**Playable**: Dodge obstacles by strafing left and right

---

## M8: Random Obstacle Course Generation
**Goal**: Dynamically generated obstacle courses for variety

- Procedurally generate obstacle positions each race
- Obstacles placed at random X positions:
  - Left lane position
  - Center lane position
  - Right lane position
- Obstacles placed at varied Z distances along track
- Minimum spacing between obstacles (ensure dodging is possible)
  - At least 8-10 units between consecutive obstacles
  - Prevents impossible-to-avoid patterns
- Random number of obstacles per race (5-10)
- Same random course generated for both players (fair racing)
- New random course on each restart
- Obstacles stay within track boundaries
- Visual variety in obstacle placement

**Playable**: Each race feels unique with different obstacle patterns

---

## M9: Visual & Audio Polish
**Goal**: Smooth and satisfying feel

- Smooth running animation (minimal but fluid)
- Jump animation
- Sound effect: jump
- Sound effect: obstacle hit
- Visual feedback when hitting obstacle

**Playable**: Feels good to play

---

## M10: Leaderboard
**Goal**: Competition with others

- Leaderboard displays top times
- Player can submit their time to leaderboard
- Leaderboard shows player's rank

**Playable**: Full version 1 experience
