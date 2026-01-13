
# Game Rules

## World
- Playfield is a rectangular grid.
- Boundaries are walls (no wrap).

## Entities
- Snake(s): each snake occupies grid cells.
  - Head has a visual indicator (e.g., "eye") to show direction/front of snake.
- Food: single item on an empty grid cell.

## Core loop
- Game advances in discrete ticks.
- Each tick, every alive snake moves 1 cell in its current direction.
- Player input changes direction (see controls). 180° reversal is not allowed.

## Food + scoring
- If a snake’s head enters the food cell:
  - Score increases by +1 (score = foods eaten).
  - Snake grows by +1 segment.
  - New food spawns on an empty cell (not on any snake).

## Speed
- Speed is shared across all snakes (including multiplayer).
- Speed increases by time (not by food).
- HUD displays speed as a "Level" (Level 1, Level 2, …).

## Death conditions (any mode)
A snake dies immediately if its head:
- Hits a wall.
- Hits its own body.
- Hits any other snake’s body.

## Head-to-head / simultaneous collisions (multiplayer)
- If two heads enter the same cell on the same tick: both snakes die.
- If two heads enter the food cell on the same tick: treat as head-to-head → both die.

## Tail-vacated cell rule
- Moving into a cell vacated by a tail on the same tick is allowed.

## Win / loss
### Single-player
- No win condition; play until death.
- Result is final score.

### Local multiplayer
- No respawns.
- Winner is the last snake alive.
- If all snakes die on the same tick: draw.

## Screens / flow
- Start screen → countdown → gameplay → game over (and winner banner in multiplayer).
