import {
  Entity,
  engine,
  Transform,
  MeshRenderer,
  Material,
  MeshCollider,
  MaterialTransparencyMode,
  TextShape,
  Billboard,
  VirtualCamera,
  MainCamera
} from '@dcl/sdk/ecs'
import { Quaternion, Vector3, Color4 } from '@dcl/sdk/math'
import { movePlayerTo } from '~system/RestrictedActions'
import { Teleporter, TeleporterRipple } from './components'

export function createTeleporter(
  position: { x: number, y: number, z: number },
  destination: { x: number, y: number, z: number },
  textureSrc: string = 'images/teleporter-pad.png',
  logoTextureSrc: string = 'images/Commodore Logo.png',
  labelText: string = 'Teleporter'
): Entity {
  const entity = engine.addEntity()

  // Add teleporter component with destination
  Teleporter.create(entity, { destination })

  // Set position
  Transform.create(entity, { 
    position: Vector3.create(position.x, position.y, position.z),
    scale: Vector3.create(2, 2, 2), // Make it a thin plane, 2x2 units
    rotation: Quaternion.fromEulerDegrees(90,0,0)
  })

  // Create plane mesh
  MeshRenderer.setPlane(entity)
  MeshCollider.setPlane(entity)

  // Apply texture with alpha transparency (main layer - 100% opacity)
  Material.setPbrMaterial(entity, {
    texture: Material.Texture.Common({
      src: textureSrc
    }),
    transparencyMode: 2, // Alpha blend mode
    alphaTest: 0.1,
    emissiveColor: { r: 1, g: 1, b: 1 }, // White emission
    castShadows: false, // Hide shadows
    albedoColor: { r: 1, g: 1, b: 1, a: 1.0 } // 100% opacity
  })

  // Create 4 child planes without colliders with varying initial transparency
  for (let i = 0; i < 4; i++) {
    const childEntity = engine.addEntity()
    
    // Add ripple component for animation tracking
    TeleporterRipple.create(childEntity, {
      layerIndex: i,
      animationTime: 0
    })
    
    // Set as child of main teleporter
    Transform.create(childEntity, {
      position: Vector3.create(0, 0, 0.05 * (i + 1)), // Slightly offset each layer
      scale: Vector3.create(1, 1, 1),
      parent: entity
    })

    // Add mesh renderer but no collider
    MeshRenderer.setPlane(childEntity)

    // Calculate linear transparency: bottom layer (i=0) = 90%, top layer (i=3) = 10%
    const baseAlpha = 0.9 - (i * 0.2) // 0.9, 0.7, 0.5, 0.3

    // Apply same material with varying transparency
    Material.setPbrMaterial(childEntity, {
      texture: Material.Texture.Common({
        src: textureSrc
      }),
      transparencyMode: 2, // Alpha blend mode
      alphaTest: 0.1,
      emissiveColor: { r: 1, g: 1, b: 1 }, // White emission
      castShadows: false, // Hide shadows
      albedoColor: { r: 1, g: 1, b: 1, a: baseAlpha }
    })
  }

  // Create logo plane (not as child to avoid inheriting transparency)
  const logoEntity = engine.addEntity()
  
  // Position independently but linked to teleporter position
  Transform.create(logoEntity, {
    position: Vector3.create(position.x, position.y, position.z), // Above teleporter
    scale: Vector3.create(0.9, 0.9, 0.9), // Reduced scale
    rotation: Quaternion.fromEulerDegrees(90, 0, 0)
  })

  // Add mesh renderer but no collider
  MeshRenderer.setPlane(logoEntity)

  // Apply logo texture without transparency inheritance
  Material.setPbrMaterial(logoEntity, {
    texture: Material.Texture.Common({
      src: logoTextureSrc
    }),
    transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
    // alphaTest: 0.1,
    // emissiveColor: Color4.create(1.0, 1.0, 1.0, 1.0),
    emissiveIntensity: 0.2,
    castShadows: false,
    albedoColor: Color4.create(1, 1, 1, 1.0) // Full opacity
  })

  // Create text label above teleporter
  const textEntity = engine.addEntity()
  
  // Position text 2 meters above teleporter
  Transform.create(textEntity, {
    position: Vector3.create(position.x, position.y + 2, position.z)
  })

  // Add billboard component for X-axis rotation only
  Billboard.create(textEntity, {
    billboardMode: 2 // X-axis billboard
  })

  // Create text shape
  TextShape.create(textEntity, {
    text: labelText,
    fontSize: 3,
    textColor: Color4.create(1, 1, 1, 1), // White text
    outlineColor: Color4.create(0, 0, 0, 1), // Black outline
    outlineWidth: 0.1
  })

  return entity
}

export function teleporterRippleSystem(dt: number) {
  const animationDuration = 1.0 // 2 seconds for full cycle
  const phaseOffset = 0.25 // 25% phase offset between each layer
  const time = Date.now() / 1000 // Time in seconds
  
  // Animate ripple effect on all teleporter layers
  for (const [entity, ripple] of engine.getEntitiesWith(TeleporterRipple)) {
    // Calculate phase for each plane (creates the ripple effect)
    const phase = (time / animationDuration + ripple.layerIndex * phaseOffset) % 1
    
    // Use sine wave for smooth transition (0 to 1)
    const opacity = (Math.sin(phase * Math.PI * 2 - Math.PI / 2) + 1) / 2 * 0.5
    
    // Update material opacity by re-setting the material
    Material.setPbrMaterial(entity, {
      texture: Material.Texture.Common({
        src: 'images/teleporter-pad.png'
      }),
      emissiveColor: Color4.create(1.0, 2.0, 1.0, 1.0),
      emissiveIntensity: 1.0,
      albedoColor: Color4.create(1, 1, 1, opacity),
      transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
      metallic: 0.0,
      roughness: 1.0,
      castShadows: false
    })
  }
}

// Store teleportation state
let isTeleporting = false
let teleportCooldown = 0

export function teleporterSystem(dt: number) {
  // Update cooldown
  if (teleportCooldown > 0) {
    teleportCooldown -= dt
    return
  }

  const playerTransform = Transform.getOrNull(engine.PlayerEntity)
  if (!playerTransform) return

  const playerPos = playerTransform.position

  for (const [entity, teleporter, transform] of engine.getEntitiesWith(Teleporter, Transform)) {
    const teleporterPos = transform.position
    
    // Check if player is close enough to the teleporter (within 1.5 units on X and Z, and close on Y)
    const xDiff = Math.abs(playerPos.x - teleporterPos.x)
    const yDiff = Math.abs(playerPos.y - teleporterPos.y)
    const zDiff = Math.abs(playerPos.z - teleporterPos.z)
    
    if (xDiff < 1.5 && zDiff < 1.5 && yDiff < 3 && !isTeleporting) {
      console.log('Initiating teleportation sequence!')
      isTeleporting = true
      teleportCooldown = 4.0 // 4 second cooldown to prevent rapid teleporting
      
      // Create virtual camera at start position (at teleporter, looking towards destination)
      const startCamera = engine.addEntity()
      console.log('Creating start camera entity:', startCamera)
      
      // Calculate direction from teleporter to destination
      const direction = Vector3.subtract(
        Vector3.create(teleporter.destination.x, teleporter.destination.y, teleporter.destination.z),
        Vector3.create(teleporterPos.x, teleporterPos.y, teleporterPos.z)
      )
      const lookAtRotation = Quaternion.lookRotation(Vector3.normalize(direction))
      
      Transform.create(startCamera, {
        position: Vector3.create(teleporterPos.x, teleporterPos.y + 3, teleporterPos.z), // At teleporter, 3m up
        rotation: lookAtRotation // Look towards destination
      })
      VirtualCamera.create(startCamera, {
        defaultTransition: { transitionMode: VirtualCamera.Transition.Time(0.5) }
      })
      console.log('Start camera position (at teleporter):', teleporterPos.x, teleporterPos.y + 3, teleporterPos.z)
      console.log('Looking towards destination:', teleporter.destination.x, teleporter.destination.y, teleporter.destination.z)

      // Create virtual camera at destination position
      const endCamera = engine.addEntity()
      console.log('Creating end camera entity:', endCamera)
      Transform.create(endCamera, {
        position: Vector3.create(
          teleporter.destination.x,
          teleporter.destination.y + 5,
          teleporter.destination.z - 5
        ),
        rotation: Quaternion.fromEulerDegrees(45, 0, 0)
      })
      VirtualCamera.create(endCamera, {
        defaultTransition: { transitionMode: VirtualCamera.Transition.Time(3) }
      })
      console.log('End camera position:', teleporter.destination.x, teleporter.destination.y + 5, teleporter.destination.z - 5)

      // Switch to start camera (exactly like test camera)
      console.log('Switching to start camera')
      MainCamera.createOrReplace(engine.CameraEntity, {
        virtualCameraEntity: startCamera,
      })

      // Create timer system for the sequence
      let sequenceTimer = 0
      let phase = 0 // 0: at start, 1: transitioning, 2: at destination
      
      engine.addSystem(function teleportSequence(dt: number) {
        sequenceTimer += dt
        
        if (phase === 0 && sequenceTimer >= 1.0) {
          console.log('Phase 0 complete - switching to end camera')
          // Switch to end camera - exactly like test camera switch
          MainCamera.createOrReplace(engine.CameraEntity, {
            virtualCameraEntity: endCamera,
          })
          
          phase = 1
          sequenceTimer = 0
          console.log('Camera transition started (3s)')
        } else if (phase === 1 && sequenceTimer >= 3.0) {
          console.log('Phase 1 complete - camera arrived, teleporting player')
          // Camera has arrived, now teleport player
          movePlayerTo({
            newRelativePosition: Vector3.create(
              teleporter.destination.x,
              teleporter.destination.y,
              teleporter.destination.z
            )
          })
          
          phase = 2
          sequenceTimer = 0
        } else if (phase === 2 && sequenceTimer >= 1.0) {
          console.log('Phase 2 complete - resetting to player camera')
          // Reset to player camera (exactly like test camera reset)
          MainCamera.createOrReplace(engine.CameraEntity, {
            virtualCameraEntity: undefined
          })
          
          // Cleanup
          engine.removeEntity(startCamera)
          engine.removeEntity(endCamera)
          isTeleporting = false
          console.log('Teleportation complete')
          
          // Remove this system
          engine.removeSystem(teleportSequence)
        }
      })
    }
  }
}