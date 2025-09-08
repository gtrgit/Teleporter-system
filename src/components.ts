import { Schemas, engine } from '@dcl/sdk/ecs'


// We use this component to track and group all spinning entities.
// engine.getEntitiesWith(Spinner)
export const Spinner = engine.defineComponent('spinner', { speed: Schemas.Number })

// We use this component to track and group all the cubes.
// engine.getEntitiesWith(Cube)
export const Cube = engine.defineComponent('cube-id', {})

// We use this component to track teleporter entities and store their destination
export const Teleporter = engine.defineComponent('teleporter', {
  destination: Schemas.Map({
    x: Schemas.Float,
    y: Schemas.Float,
    z: Schemas.Float
  })
})

// Component to track teleporter ripple layers for animation
export const TeleporterRipple = engine.defineComponent('teleporter-ripple', {
  layerIndex: Schemas.Int,
  animationTime: Schemas.Float
})