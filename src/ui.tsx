import {
  engine,
  Transform,
  VirtualCamera,
  MainCamera,
  Entity
} from '@dcl/sdk/ecs'
import { Color4, Vector3, Quaternion } from '@dcl/sdk/math'
import ReactEcs, { Button, Label, ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Cube } from './components'
import { createCube } from './factory'

// Store test camera reference
let testCameraEntity: Entity | undefined

export function setupUi() {
  ReactEcsRenderer.setUiRenderer(uiComponent)
}

const uiComponent = () => (
  <UiEntity
    uiTransform={{
      width: 400,
      height: 230,
      margin: '16px 0 8px 270px',
      padding: 4,
    }}
    uiBackground={{ color: Color4.create(0.5, 0.8, 0.1, 0.6) }}
  >
    <UiEntity
      uiTransform={{
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
      uiBackground={{ color: Color4.fromHexString("#70ac76ff") }}
    >
      <UiEntity
        uiTransform={{
          width: '100%',
          height: 50,
          margin: '8px 0'
        }}
        uiBackground={{
          textureMode: 'center',
          texture: {
            src: 'images/scene-thumbnail.png',
          },
        }}
        uiText={{ value: 'SDK7', fontSize: 18 }}
      />
      <Label
        onMouseDown={() => {console.log('Player Position clicked !')}}
        value={`Player: ${getPlayerPosition()}`}
        fontSize={18}
        uiTransform={{ width: '100%', height: 30 } }
      />
      <Label
        onMouseDown={() => {console.log('# Cubes clicked !')}}
        value={`# Cubes: ${[...engine.getEntitiesWith(Cube)].length}`}
        fontSize={18}
        uiTransform={{ width: '100%', height: 30 } }
      />
      <Button
        uiTransform={{ width: 100, height: 40, margin: 8 }}
        value='Spawn cube'
        variant='primary'
        fontSize={14}
        onMouseDown={() => {
          createCube(1 + Math.random() * 8, Math.random() * 8, 1 + Math.random() * 8, false)
        }}
      />
      <Button
        uiTransform={{ width: 150, height: 40, margin: 8 }}
        value='Test Camera'
        variant='secondary'
        fontSize={14}
        onMouseDown={() => {
          console.log('Testing virtual camera')
          
          if (!testCameraEntity) {
            // Create test virtual camera
            testCameraEntity = engine.addEntity()
            console.log('Created test camera entity:', testCameraEntity)
            
            Transform.create(testCameraEntity, {
              position: Vector3.create(8, 10, 8),
              rotation: Quaternion.fromEulerDegrees(45, 0, 0)
            })
            
            VirtualCamera.create(testCameraEntity, {
              defaultTransition: { transitionMode: VirtualCamera.Transition.Time(2) }
            })
            
            // Assign virtual camera to main camera
            console.log('Switching to virtual camera')
            const mainCameraResult = MainCamera.createOrReplace(engine.CameraEntity, {
              virtualCameraEntity: testCameraEntity
            })
            
            console.log('Main camera component:', mainCameraResult)
            console.log('Camera entity ID:', engine.CameraEntity)
            
            // Verify the virtual camera was created
            const virtualCameraComponent = VirtualCamera.getOrNull(testCameraEntity)
            console.log('VirtualCamera component:', virtualCameraComponent)
            
            // Verify the main camera is pointing to our virtual camera
            const mainCameraComponent = MainCamera.getOrNull(engine.CameraEntity)
            console.log('MainCamera component:', mainCameraComponent)
            
            console.log('Virtual camera should now be active at position 8,10,8')
          } else {
            // Reset to default camera
            console.log('Resetting to default camera')
            MainCamera.createOrReplace(engine.CameraEntity, {
              virtualCameraEntity: undefined
            })
            
            // Cleanup test camera
            engine.removeEntity(testCameraEntity)
            testCameraEntity = undefined
            console.log('Virtual camera removed, back to player camera')
          }
        }}
      />
     </UiEntity>
  </UiEntity>
)

function getPlayerPosition() {
  const playerPosition = Transform.getOrNull(engine.PlayerEntity)
  if (!playerPosition) return ' no data yet'
  const { x, y, z } = playerPosition.position
  return `{X: ${x.toFixed(2)}, Y: ${y.toFixed(2)}, z: ${z.toFixed(2)} }`
}

