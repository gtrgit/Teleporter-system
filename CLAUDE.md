# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run start` - Start the Decentraland scene in preview mode
- `npm run build` - Build the scene for deployment
- `npm run deploy` - Deploy the scene to Decentraland
- `npm run upgrade-sdk` - Update to latest SDK version
- `npm run upgrade-sdk:next` - Update to next/beta SDK version

## Architecture Overview

This is a **Decentraland SDK7 scene** implementing an Entity-Component-System (ECS) architecture. The project creates interactive 3D cubes that users can click to change colors.

### Core Structure

- **Entry Point**: `src/index.ts:main()` - Initializes systems and UI
- **Components**: `src/components.ts` - Defines `Spinner` (rotation behavior) and `Cube` (entity marking)
- **Systems**: `src/systems.ts` - Contains `circularSystem` (rotation logic) and `changeColorSystem` (click handlers)
- **Factory**: `src/factory.ts:createCube()` - Creates cube entities with all required components
- **UI**: `src/ui.tsx` - React-based UI showing player position, cube count, and spawn button
- **Utilities**: `src/utils.ts` - Helper functions like `getRandomHexColor()`

### Key Patterns

**Component Definition**:
```ts
export const MyComponent = engine.defineComponent('name', { prop: Schemas.Type })
```

**System Pattern**:
```ts
function mySystem(dt: number) {
  for (const [entity, component] of engine.getEntitiesWith(Component)) {
    // Read-only access via component
    // Mutable access via Component.getMutable(entity)
  }
}
engine.addSystem(mySystem)
```

**Entity Creation**:
- Use `engine.addEntity()` to create entities
- Apply components via `Component.create(entity, data)`
- Entities automatically get Transform, MeshRenderer, MeshCollider for 3D objects

### Configuration Files

- `scene.json` - Scene metadata, spawn points, and parcel configuration
- `tsconfig.json` - Extends `@dcl/sdk/types/tsconfig.ecs7.json`
- `cursor.config` - Includes Decentraland SDK7 documentation context for AI assistance

### Dependencies

The project uses:
- `@dcl/sdk` - Core Decentraland SDK7
- `@dcl/js-runtime` - JavaScript runtime for Decentraland
- `@dcl/asset-packs` - Shared 3D assets

### Scene Properties

- Single parcel scene at coordinates `0,0`
- Spawn point at center with camera target at `(8,1,8)`
- Voice chat and portable experiences enabled