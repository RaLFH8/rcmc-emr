# Cruise Ship Management Simulator

A management + navigation hybrid game built in Godot 4. You are the Captain and CEO of a cruise line — prepare your ship in port, navigate real ocean routes using real-world geographic coordinates, and dock at real ports around the world.

## Project Status
🚧 In Planning — GDD complete, implementation not yet started

## Platform
- PC (Steam) — primary target, $20–25
- Mobile port — Year 2+

## Tech Stack
- Godot 4 (GDScript)
- Real-world lat/long coordinates with origin-shifting for 64-bit precision

## Key Design Docs
- `GDD.md` — Full Game Design Document

## Core Loop
Three phases per voyage:
1. **Port** — hire crew, buy supplies, set ticket prices, repair ship
2. **Navigation** — sail real ocean routes, manage passengers, respond to events
3. **Docking** — manual minigame or hire a port pilot

## Developer Notes
- Kiro writes all GDScript code
- Developer executes in Godot editor
- Learn Godot basics (nodes, scenes, editor) before implementation begins
- Recommended: complete a Godot 4 3D tutorial series first
