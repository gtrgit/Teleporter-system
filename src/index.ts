// We define the empty imports so the auto-complete feature works as expected.
import {} from '@dcl/sdk/math'
import { engine } from '@dcl/sdk/ecs'

import { changeColorSystem, circularSystem } from './systems'
import { setupUi } from './ui'
import { createTeleporter, teleporterSystem, teleporterRippleSystem } from './teleporter'

export function main() {
  // Defining behavior. See `src/systems.ts` file.
  engine.addSystem(circularSystem)
  engine.addSystem(changeColorSystem)
  engine.addSystem(teleporterSystem)
  engine.addSystem(teleporterRippleSystem)

  // Create test teleporter
  createTeleporter(
    { x: 4, y: 0.5, z: 4 },    // teleporter position
    { x: 4, y: 0.1, z: 24 },    // destination
    'images/teleporter-pad.png',
    'images/joystick-icon.png',
    'Games!'
  )

  // draw UI. Here is the logic to spawn cubes.
  setupUi()
}
