# Game Rules

## Game Modes
- **Single Player**: Race against your personal best time
- **Two Player**: Race head-to-head against another player on same screen

## Starting
- Runner starts behind (left of) the start line
- Player presses start button to initialize race
- Players must press movement keys to make figures move forward
- Timer starts when start button is pressed

## Running
- Runners move forward when players press forward movement keys
- Player 1 uses W key, Player 2 uses Numpad 8
- Speed increases with faster key presses
- Speed decreases with slower key presses or no presses
- Speed gradually decays when not pressing movement keys
- Players can strafe left/right using D/A (P1) or Numpad 6/4 (P2)
- Strafing uses smooth animated transitions
- Strafing allows dodging obstacles sideways
- Lane boundaries prevent moving outside track
- Course layout is fixed (same every run)

## Obstacles
- Player must jump over obstacles
- Hitting an obstacle stops the runner briefly (~0.5-1 second)
- Runner resumes at normal speed after pause

## Finishing
- Runner reaches the end of the course
- Timer stops
- Final time is recorded
- Number of obstacles hit is counted
- Runner stays at the finish line
- Runner resets to start position when start button is pressed

## Win Condition
- **Single Player**: Beat your previous personal best time
- **Two Player**: First player to cross the finish line wins

## Two-Player Mode
- Both runners start simultaneously
- Player 1 (blue) runs in top lane
- Player 2 (red) runs in bottom lane
- Each lane has identical obstacles
- Independent collision detection for each player
- Both times displayed at finish
- Winner announced when first player crosses finish line

## No Failure
- Player always completes the course
- No game over or failure state