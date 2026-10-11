import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { posterUrl } from '../utils.js'

const ZONE_COLORS = { Front: '#2dd4bf', Middle: '#60a5fa', Balcony: '#f5b942' }
const SELECTED_COLOR = '#22c55e'
const TAKEN_COLOR = '#4b3b45'

const SEAT_GAP = 0.95     // space between seats (x)
const ROW_GAP = 1.3       // space between rows (z)

// Where a seat stands in the 3D hall.
// Every row is a little higher and further back (like steps),
// and the balcony rows are on a raised platform behind the middle block.
function seatPosition(seat, cols) {
  const rowIndex = seat.row.charCodeAt(0) - 65
  const balcony = seat.zone === 'Balcony'
  const x = (seat.number - 1 - (cols - 1) / 2) * SEAT_GAP
  const y = rowIndex * 0.22 + (balcony ? 0.9 : 0)
  const z = rowIndex * ROW_GAP + (balcony ? 1.2 : 0)
  return [x, y, z]
}

// ---------------------------------------------------------------
// One seat. It lifts on hover, pops when clicked and changes colour smoothly.
// ---------------------------------------------------------------
function Seat3D({ seat, position, selected, onHover, onToggle }) {
  const group = useRef()
  const ring = useRef()
  const [hover, setHover] = useState(false)

  const pop = useRef(0)            // 1 -> 0 after a click (drives the bounce)
  const appear = useRef(0)         // time since the seat was added (intro animation)
  const firstRender = useRef(true)

  // one material for the whole seat, so we can change its colour in one place
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.6 }), [])
  const target = useMemo(() => new THREE.Color(), [])

  // bounce every time the seat is selected or unselected
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    pop.current = 1
  }, [selected])

  useFrame((state, delta) => {
    const g = group.current
    const speed = Math.min(1, delta * 10)
    const canHover = hover && !seat.taken

    // intro: seats rise up one row after another
    appear.current += delta
    const rowDelay = (seat.row.charCodeAt(0) - 65) * 0.08
    const t = Math.min(1, Math.max(0, (appear.current - rowDelay) / 0.6))
    const intro = 1 - Math.pow(1 - t, 3)

    pop.current = Math.max(0, pop.current - delta * 2.2)
    const bump = Math.sin(pop.current * Math.PI)

    // height and size
    const lift = selected ? 0.3 : canHover ? 0.18 : 0
    const goalY = position[1] + lift + bump * 0.35 - (1 - intro) * 2
    g.position.y += (goalY - g.position.y) * speed

    const goalScale = ((selected ? 1.08 : canHover ? 1.05 : 1) + bump * 0.18) * intro
    g.scale.setScalar(g.scale.x + (goalScale - g.scale.x) * speed)

    // colour
    if (seat.taken) {
      target.set(TAKEN_COLOR)
    } else if (selected) {
      target.set(SELECTED_COLOR)
    } else {
      target.set(ZONE_COLORS[seat.zone])
      if (canHover) target.offsetHSL(0, 0, 0.12)
    }
    material.color.lerp(target, speed)
    material.emissive.copy(material.color)
    const glow = selected ? 0.55 : canHover ? 0.4 : 0
    material.emissiveIntensity += (glow - material.emissiveIntensity) * speed

    // green ring on the floor that spreads out after a click
    ring.current.visible = pop.current > 0.01
    const spread = 1 + (1 - pop.current) * 1.8
    ring.current.scale.set(spread, spread, 1)
    ring.current.material.opacity = pop.current * 0.8
  })

  function pointerOver(e) {
    e.stopPropagation()
    setHover(true)
    onHover(seat)
    document.body.style.cursor = seat.taken ? 'not-allowed' : 'pointer'
  }

  function pointerOut() {
    setHover(false)
    onHover(null)
    document.body.style.cursor = 'auto'
  }

  function click(e) {
    e.stopPropagation()
    if (!seat.taken) onToggle(seat.id)
  }

  return (
    <group
      ref={group}
      position={position}
      onPointerOver={pointerOver}
      onPointerOut={pointerOut}
      onClick={click}
    >
      {/* legs */}
      <mesh position={[0, 0.15, 0]} material={material}>
        <boxGeometry args={[0.14, 0.3, 0.14]} />
      </mesh>
      {/* cushion */}
      <mesh position={[0, 0.36, 0]} material={material}>
        <boxGeometry args={[0.72, 0.16, 0.7]} />
      </mesh>
      {/* back rest (seats face the screen, which is at -z) */}
      <mesh position={[0, 0.74, 0.32]} material={material}>
        <boxGeometry args={[0.72, 0.64, 0.12]} />
      </mesh>
      {/* arm rests */}
      <mesh position={[-0.4, 0.52, 0.04]} material={material}>
        <boxGeometry args={[0.08, 0.2, 0.55]} />
      </mesh>
      <mesh position={[0.4, 0.52, 0.04]} material={material}>
        <boxGeometry args={[0.08, 0.2, 0.55]} />
      </mesh>
      {/* pink strip on the top of the back rest = corner seat (costs more) */}
      {seat.corner && (
        <mesh position={[0, 1.08, 0.32]}>
          <boxGeometry args={[0.4, 0.06, 0.14]} />
          <meshStandardMaterial color="#ff4fa3" emissive="#ff4fa3" emissiveIntensity={1} />
        </mesh>
      )}
      {/* click ring */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} visible={false}>
        <ringGeometry args={[0.4, 0.5, 32]} />
        <meshBasicMaterial color={SELECTED_COLOR} transparent />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------
// Big screen at the front. It shows the movie name.
// ---------------------------------------------------------------
function Screen({ title, poster }) {
  const material = useRef()

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 400
    const ctx = canvas.getContext('2d')
    const texture = new THREE.CanvasTexture(canvas)

    // draws the screen content, with or without the poster image
    function draw(image) {
      const gradient = ctx.createLinearGradient(0, 0, 1024, 400)
      gradient.addColorStop(0, '#1b2559')
      gradient.addColorStop(1, '#4a2a6b')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 1024, 400)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 84px sans-serif'
      ctx.textBaseline = 'middle'
      if (image) {
        const posterHeight = 310
        const posterWidth = Math.min(420, (image.width / image.height) * posterHeight)
        const posterX = 54
        const posterY = 45
        ctx.drawImage(image, posterX, posterY, posterWidth, posterHeight)
        ctx.textAlign = 'left'
        ctx.fillText(title, posterX + posterWidth + 36, 200, 1024 - posterX - posterWidth - 80)
      } else {
        ctx.textAlign = 'center'
        ctx.fillText(title, 512, 200, 940)
      }
      texture.needsUpdate = true
    }

    draw(null)
    if (poster) {
      const image = new Image()
      image.onload = () => draw(image)
      image.src = posterUrl(poster)
    }
    return texture
  }, [title, poster])

  // screen light flickers a little
  useFrame((state) => {
    const level = 0.88 + Math.sin(state.clock.elapsedTime * 2) * 0.08
    material.current.color.setScalar(level)
  })

  return (
    <group position={[0, 3.2, -3.2]}>
      <mesh position={[0, 0, -0.15]}>
        <boxGeometry args={[13.2, 5.2, 0.2]} />
        <meshStandardMaterial color="#05060c" />
      </mesh>
      <mesh>
        <planeGeometry args={[12.6, 4.6]} />
        <meshBasicMaterial ref={material} map={texture} />
      </mesh>
      <pointLight position={[0, -1, 4]} intensity={30} distance={22} color="#8fa2ff" />
    </group>
  )
}

// ---------------------------------------------------------------
// Floor steps, light strips and labels
// ---------------------------------------------------------------
function Hall({ seats, cols }) {
  // one entry per row
  const rows = []
  seats.forEach((seat) => {
    if (seat.number === 1) rows.push(seat)
  })
  const width = cols * SEAT_GAP + 2.4

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 6]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#0d0f1a" />
      </mesh>

      {rows.map((seat) => {
        const [, y, z] = seatPosition(seat, cols)
        const balcony = seat.zone === 'Balcony'
        const firstBalcony = balcony && seat.row === 'G'
        // the first balcony row also covers the gap in front of it
        const depth = firstBalcony ? ROW_GAP + 1.2 : ROW_GAP
        const zCenter = firstBalcony ? z - 0.6 : z
        const height = y + 0.5
        return (
          <group key={seat.row}>
            <mesh position={[0, y - height / 2, zCenter]}>
              <boxGeometry args={[width, height, depth]} />
              <meshStandardMaterial color={balcony ? '#1c1a2e' : '#171a2b'} />
            </mesh>
            {/* coloured light strip on the front edge of each step */}
            <mesh position={[0, y + 0.01, zCenter - depth / 2 + 0.04]}>
              <boxGeometry args={[width, 0.03, 0.06]} />
              <meshStandardMaterial
                color={ZONE_COLORS[seat.zone]}
                emissive={ZONE_COLORS[seat.zone]}
                emissiveIntensity={0.8}
              />
            </mesh>
            {/* row letters on both sides */}
            <Html position={[-(width / 2 + 0.3), y + 0.3, z]} center className="row-label">
              {seat.row}
            </Html>
            <Html position={[width / 2 + 0.3, y + 0.3, z]} center className="row-label">
              {seat.row}
            </Html>
            {firstBalcony && (
              <>
                {/* balcony railing */}
                <mesh position={[0, y + 0.3, zCenter - depth / 2 + 0.1]}>
                  <boxGeometry args={[width, 0.08, 0.08]} />
                  <meshStandardMaterial color="#f5b942" emissive="#f5b942" emissiveIntensity={0.6} />
                </mesh>
                <Html position={[-(width / 2 + 0.9), y + 0.1, z - 1.25]} center className="zone-label">
                  BALCONY
                </Html>
              </>
            )}
          </group>
        )
      })}
    </group>
  )
}

// small fly-in when the page opens
function CameraIntro() {
  const time = useRef(0)
  useFrame((state, delta) => {
    time.current += delta
    if (time.current < 1.8) {
      const k = Math.min(1, delta * 3)
      state.camera.position.lerp(new THREE.Vector3(0, 11, 18), k)
    }
  })
  return null
}

// ---------------------------------------------------------------
// The 3D theatre. Props: seats from the server, selected seat ids, click handler
// ---------------------------------------------------------------
export default function Theatre3D({ seats, cols, selected, onToggle, title, poster }) {
  const [hoverSeat, setHoverSeat] = useState(null)
  const tooltip = useRef()

  // tooltip follows the mouse
  function moveTooltip(e) {
    const box = e.currentTarget.getBoundingClientRect()
    tooltip.current.style.transform =
      'translate(' + (e.clientX - box.left + 16) + 'px, ' + (e.clientY - box.top + 16) + 'px)'
  }

  // price of a normal seat in each zone and how much extra a corner seat costs
  const zonePrice = {}
  let cornerExtra = 0
  seats.forEach((s) => {
    if (!s.corner) zonePrice[s.zone] = s.price
  })
  seats.forEach((s) => {
    if (s.corner) cornerExtra = s.price - zonePrice[s.zone]
  })

  return (
    <div className="theatre" onMouseMove={moveTooltip}>
      <Canvas camera={{ position: [0, 14, 30], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={['#0a0c16']} />
        <fog attach="fog" args={['#0a0c16', 25, 55]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 14, 12]} intensity={1.4} />

        <Screen title={title} poster={poster} />
        <Hall seats={seats} cols={cols} />

        {seats.map((seat) => (
          <Seat3D
            key={seat.id}
            seat={seat}
            position={seatPosition(seat, cols)}
            selected={selected.includes(seat.id)}
            onHover={setHoverSeat}
            onToggle={onToggle}
          />
        ))}

        <CameraIntro />
        <OrbitControls
          target={[0, 1.6, 3.4]}
          enablePan={false}
          enableDamping
          minDistance={9}
          maxDistance={28}
          minPolarAngle={0.35}
          maxPolarAngle={1.45}
          minAzimuthAngle={-0.9}
          maxAzimuthAngle={0.9}
        />
      </Canvas>

      {/* tooltip near the mouse */}
      <div ref={tooltip} className="tooltip" style={{ opacity: hoverSeat ? 1 : 0 }}>
        {hoverSeat && (
          <>
            <strong>Seat {hoverSeat.id}</strong> · {hoverSeat.zone}
            <div>
              {hoverSeat.taken ? 'Already booked' : '₹' + hoverSeat.price}
              {hoverSeat.corner && !hoverSeat.taken && ' (corner seat)'}
            </div>
          </>
        )}
      </div>

      <div className="legend">
        <span><i style={{ background: ZONE_COLORS.Front }} /> Front ₹{zonePrice.Front}</span>
        <span><i style={{ background: ZONE_COLORS.Middle }} /> Middle ₹{zonePrice.Middle}</span>
        <span><i style={{ background: ZONE_COLORS.Balcony }} /> Balcony ₹{zonePrice.Balcony}</span>
        <span><i style={{ background: '#ff4fa3' }} /> Corner +₹{cornerExtra}</span>
        <span><i style={{ background: SELECTED_COLOR }} /> Selected</span>
        <span><i style={{ background: TAKEN_COLOR }} /> Booked</span>
      </div>
      <div className="hint">Drag to rotate · scroll to zoom · click a seat to select</div>
    </div>
  )
}
