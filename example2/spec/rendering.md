# 3D Rendering Specification

## Overview
The game uses a 3D third-person perspective to provide an immersive driving experience through the maze.

## Camera Setup
- **Type:** Third-person follow camera
- **Position:** Above and behind the car at an elevated angle (45° suggested)
- **Offset:** Slightly offset to the side for better view
- **Behavior:** 
  - Rotates with car's orientation
  - Follows car smoothly with slight lag for natural feel
  - Maintains consistent distance from car
  
## 3D Assets

### Car
- **Model:** Simple box-based geometry
- **Size:** Proportional to maze cells (matches collision size)
- **Visual:** Distinct front/back for orientation clarity
- **Color:** Bright contrasting color (e.g., red/blue)
- **Dimensions:** Box primitive scaled appropriately

### Maze Walls
- **Height:** 3x car height
- **Thickness:** Match 2D collision boundaries (1 cell unit)
- **Material:** Simple solid color material
- **Color:** Dark gray (#333 or similar)
- **Geometry:** Box primitives for each wall cell

### Floor
- **Type:** Flat plane matching entire maze area
- **Color:** Dark background (#1a1a1a to match current theme)
- **Material:** Basic material, no texture in v1

### Goal
- **Representation:** Colored box or cylinder at goal position
- **Visual:** Bright yellow/gold color
- **Height:** Slightly elevated above floor

## Rendering Technology
- **Library:** Three.js (via CDN - no build step required)
- **Version:** Latest stable from CDN
- **Performance:** Target 60 FPS (performance prioritized)
- **Compatibility:** WebGL-based rendering

## Lighting
- **Type:** Basic ambient + directional light
- **Purpose:** Ensure all maze elements are clearly visible
- **Shadows:** Deferred to later milestone (performance priority)

## UI Integration
- **HUD:** 2D HTML overlay on top of 3D canvas (timer, best time, controls)
- **Maze Selector:** Remains 2D HTML overlay
- **Win Message:** 2D HTML overlay on 3D view
- **Canvas:** Full integration with existing DOM structure

## Technical Considerations
- Maintain existing physics and collision detection (2D logic)
- Translate 2D maze coordinates to 3D world space
- Preserve all existing game mechanics and controls
- 2D game logic remains unchanged
- Rendering layer is purely visual translation

## Future Enhancements (Later Milestones)
- Shadows
- Textures
- More detailed car model
- Particle effects
- Environmental details
