import { useState, useEffect, useRef, useCallback } from 'react'
import './GestureCheck.css'
import SignAnimator from './SignAnimator'

export const GESTURE_SIGNS = [
  {
    id: 'gs01', label: '안녕하세요', english: 'Hello',
    color: '#7c6fff', difficulty: 'easy',
    instruction: '오른손을 B형(편손)으로 — 손끝을 관자놀이에 댄 뒤 앞·아래로 내리세요.',
    checker: 'hello',
    checkParams: {
      수형: 'B형 (네 손가락 펴기)',
      수위: '이마/관자놀이 높이',
      수향: '손바닥이 바깥 방향',
      수동: '앞으로 내리기 (감지 중)',
    },
  },
  {
    id: 'gs02', label: '감사합니다', english: 'Thank you',
    color: '#7c6fff', difficulty: 'easy',
    instruction: 'B형 손을 턱 아래에 대고 앞으로 내밉니다.',
    checker: 'thankyou',
    checkParams: {
      수형: 'B형 (네 손가락 펴기)',
      수위: '턱 아래',
      수향: '손바닥이 위를 향함',
      수동: '앞으로 내밀기',
    },
  },
  {
    id: 'gs03', label: '미안합니다', english: 'Sorry',
    color: '#7c6fff', difficulty: 'easy',
    instruction: '주먹을 쥐고 가슴 위에서 원을 그립니다.',
    checker: 'sorry',
    checkParams: {
      수형: '주먹 (S형)',
      수위: '가슴',
      수향: '손등이 앞을 향함',
      수동: '가슴 위 원 그리기 (감지 중)',
    },
  },
  {
    id: 'gs04', label: '1 (일)', english: 'One',
    color: '#3b82f6', difficulty: 'easy',
    instruction: '검지만 세우고 나머지는 주먹. 손바닥이 앞을 향하게.',
    checker: 'one',
    checkParams: {
      수형: '1형 (검지만)',
      수위: '가슴 앞 중앙',
      수향: '손바닥이 앞을 향함',
      수동: '정지',
    },
  },
  {
    id: 'gs05', label: '2 (이)', english: 'Two',
    color: '#3b82f6', difficulty: 'easy',
    instruction: '검지·중지를 펴고 나머지는 접습니다.',
    checker: 'two',
    checkParams: {
      수형: 'V형 (검지·중지)',
      수위: '가슴 앞 중앙',
      수향: '손바닥이 앞을 향함',
      수동: '정지',
    },
  },
  {
    id: 'gs06', label: '5 (오)', english: 'Five',
    color: '#3b82f6', difficulty: 'easy',
    instruction: '다섯 손가락 모두 펴서 손바닥이 앞을 향하게.',
    checker: 'five',
    checkParams: {
      수형: '5형 (모두 펴기)',
      수위: '가슴 앞 중앙',
      수향: '손바닥이 앞을 향함',
      수동: '정지',
    },
  },
  {
    id: 'gs07', label: '도와주세요', english: 'Help me',
    color: '#ef4444', difficulty: 'medium',
    instruction: '왼손 엄지 위에 오른손을 얹고 두 손을 함께 위로 올리세요.',
    checker: 'help',
    checkParams: {
      수형: '엄지 세움 + 편손',
      수위: '가슴 앞',
      수향: '편손 손바닥이 아래',
      수동: '위로 올리기',
    },
  },
  {
    id: 'gs08', label: '사랑해요', english: 'I love you',
    color: '#e11d48', difficulty: 'easy',
    instruction: '엄지·검지·소지를 펴고 중지·약지는 접습니다.',
    checker: 'ily',
    checkParams: {
      수형: 'ILY형',
      수위: '가슴 앞',
      수향: '손바닥이 앞을 향함',
      수동: '정지 (또는 살짝 흔들기)',
    },
  },
  {
    id: 'gs09', label: '좋아요', english: 'Good / Like',
    color: '#10b981', difficulty: 'easy',
    instruction: '엄지만 세우고 나머지는 주먹. 앞으로 내밉니다.',
    checker: 'thumbup',
    checkParams: {
      수형: '엄지 (A형)',
      수위: '가슴 앞',
      수향: '엄지가 위를 향함',
      수동: '앞으로 내밀기',
    },
  },
  {
    id: 'gs10', label: '싫어요', english: 'Dislike / No',
    color: '#f59e0b', difficulty: 'easy',
    instruction: '엄지를 아래로 내리고 나머지는 주먹.',
    checker: 'thumbdown',
    checkParams: {
      수형: '엄지 (아래)',
      수위: '가슴 앞',
      수향: '엄지가 아래를 향함',
      수동: '정지 또는 아래로 내리기',
    },
  },
  {
    id: 'gs11', label: '예 / 네', english: 'Yes',
    color: '#10b981', difficulty: 'easy',
    instruction: '주먹을 쥐고 위아래로 끄덕입니다.',
    checker: 'yes',
    checkParams: {
      수형: '주먹 (S형)',
      수위: '가슴 앞',
      수향: '손등이 바깥 방향',
      수동: '위아래 끄덕임',
    },
  },
  {
    id: 'gs12', label: '아니요', english: 'No',
    color: '#ef4444', difficulty: 'easy',
    instruction: '검지·중지를 붙여 펴고 좌우로 흔듭니다.',
    checker: 'no',
    checkParams: {
      수형: 'V형 또는 검지만',
      수위: '가슴 앞',
      수향: '손바닥이 아래 또는 옆',
      수동: '좌우 흔들기',
    },
  },
]

/* ═══════════════════════════════════════════════════════════
   MEDIAPIPE LANDMARK INDICES
   0=wrist  1-4=thumb  5-8=index  9-12=middle  13-16=ring  17-20=pinky
═══════════════════════════════════════════════════════════ */
const LM = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
}

/* ── Geometry helpers ── */
const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + ((a.z || 0) - (b.z || 0)) ** 2)

// Is a finger extended? Compare tip-to-wrist vs mcp-to-wrist
function isExtended(lm, tipIdx, mcpIdx) {
  return dist(lm[tipIdx], lm[LM.WRIST]) > dist(lm[mcpIdx], lm[LM.WRIST]) * 1.15
}
// Convenience
const indexUp  = lm => isExtended(lm, LM.INDEX_TIP,  LM.INDEX_MCP)
const middleUp = lm => isExtended(lm, LM.MIDDLE_TIP, LM.MIDDLE_MCP)
const ringUp   = lm => isExtended(lm, LM.RING_TIP,   LM.RING_MCP)
const pinkyUp  = lm => isExtended(lm, LM.PINKY_TIP,  LM.PINKY_MCP)
const thumbUp  = lm => lm[LM.THUMB_TIP].y < lm[LM.THUMB_MCP].y - 0.04

// Palm faces roughly toward camera (z of wrist < mean z of fingertips)
function palmFacingCamera(lm) {
  const tips = [LM.INDEX_TIP, LM.MIDDLE_TIP, LM.RING_TIP, LM.PINKY_TIP]
  const avgTipZ = tips.reduce((s, i) => s + (lm[i].z || 0), 0) / 4
  return (lm[LM.WRIST].z || 0) > avgTipZ
}

// Wrist Y relative to normalised video frame
// In MediaPipe normalised coords: y=0 is top, y=1 is bottom
// Face is roughly y=0.1–0.5 on a typical frame
function wristZone(lm) {
  const wy = lm[LM.WRIST].y
  if (wy < 0.35) return 'head'     // above nose
  if (wy < 0.55) return 'face'     // nose to chin
  if (wy < 0.72) return 'chest'    // chin to navel
  return 'low'
}

// All four fingers (index→pinky) extended
const fourFingersUp = lm => indexUp(lm) && middleUp(lm) && ringUp(lm) && pinkyUp(lm)
// Fist: all four down, thumb optional
const isFist = lm => !indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm)

/* ═══════════════════════════════════════════════════════════
   RULE ENGINE
   Returns { 수형: bool, 수위: bool, 수향: bool, 수동: 'waiting'|bool }
   수동 is always 'waiting' on first check; caller accumulates history
   for movement detection.
═══════════════════════════════════════════════════════════ */
function checkSign(checker, lm, motionHistory) {
  if (!lm || lm.length < 21) return null

  const zone = wristZone(lm)
  const pfc  = palmFacingCamera(lm)

  switch (checker) {

    case 'hello': {
      // B형: four fingers up, thumb tucked; at head height; palm facing out
      const 수형 = fourFingersUp(lm) && !thumbUp(lm)
      const 수위 = zone === 'head' || zone === 'face'
      const 수향 = pfc
      const 수동 = detectDownwardSwipe(motionHistory)
      return { 수형, 수위, 수향, 수동 }
    }

    case 'thankyou': {
      // B형 under chin (face zone), palm up (not facing camera)
      const 수형 = fourFingersUp(lm) && !thumbUp(lm)
      const 수위 = zone === 'face'
      const 수향 = !pfc  // palm facing up = not toward camera
      const 수동 = detectForwardPush(motionHistory)
      return { 수형, 수위, 수향, 수동 }
    }

    case 'sorry': {
      // Fist at chest, palm not flat
      const 수형 = isFist(lm)
      const 수위 = zone === 'chest'
      const 수향 = true  // orientation less critical here
      const 수동 = detectCircularMotion(motionHistory)
      return { 수형, 수위, 수향, 수동 }
    }

    case 'one': {
      // Only index up
      const 수형 = indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm)
      const 수위 = zone === 'chest'
      const 수향 = pfc
      const 수동 = isStill(motionHistory)
      return { 수형, 수위, 수향, 수동 }
    }

    case 'two': {
      // Index + middle up, rest down
      const 수형 = indexUp(lm) && middleUp(lm) && !ringUp(lm) && !pinkyUp(lm)
      const 수위 = zone === 'chest'
      const 수향 = pfc
      const 수동 = isStill(motionHistory)
      return { 수형, 수위, 수향, 수동 }
    }

    case 'five': {
      // All five fingers up
      const 수형 = fourFingersUp(lm) && thumbUp(lm)
      const 수위 = zone === 'chest'
      const 수향 = pfc
      const 수동 = isStill(motionHistory)
      return { 수형, 수위, 수향, 수동 }
    }

    case 'help': {
      // Open palm at chest, palm facing down (offering up gesture)
      const 수형 = fourFingersUp(lm)
      const 수위 = zone === 'chest'
      const 수향 = !pfc  // palm down
      const 수동 = detectUpwardMove(motionHistory)
      return { 수형, 수위, 수향, 수동 }
    }

    case 'ily': {
      // Thumb + index + pinky up; middle + ring down
      const 수형 = thumbUp(lm) && indexUp(lm) && !middleUp(lm) && !ringUp(lm) && pinkyUp(lm)
      const 수위 = zone === 'chest'
      const 수향 = pfc
      const 수동 = isStill(motionHistory)
      return { 수형, 수위, 수향, 수동 }
    }

    case 'thumbup': {
      // Thumb up, rest fist
      const 수형 = thumbUp(lm) && !indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm)
      const 수위 = zone === 'chest'
      const 수향 = lm[LM.THUMB_TIP].y < lm[LM.THUMB_MCP].y
      const 수동 = isStill(motionHistory)
      return { 수형, 수위, 수향, 수동 }
    }

    case 'thumbdown': {
      // Thumb pointing down (tip Y > MCP Y in normalised coords)
      const thumbDown = lm[LM.THUMB_TIP].y > lm[LM.THUMB_MCP].y + 0.04
      const 수형 = thumbDown && !indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm)
      const 수위 = zone === 'chest'
      const 수향 = lm[LM.THUMB_TIP].y > lm[LM.THUMB_MCP].y
      const 수동 = isStill(motionHistory)
      return { 수형, 수위, 수향, 수동 }
    }

    case 'yes': {
      // Fist, chest height
      const 수형 = isFist(lm)
      const 수위 = zone === 'chest'
      const 수향 = true
      const 수동 = detectNodding(motionHistory)
      return { 수형, 수위, 수향, 수동 }
    }

    case 'no': {
      // Index (or index+middle) extended, at chest, lateral movement
      const 수형 = indexUp(lm) && !ringUp(lm) && !pinkyUp(lm)
      const 수위 = zone === 'chest'
      const 수향 = true
      const 수동 = detectLateralShake(motionHistory)
      return { 수형, 수위, 수향, 수동 }
    }

    default:
      return null
  }
}

/* ── Motion detectors (operate on wrist XY history, last 30 frames) ── */

function isStill(h) {
  if (h.length < 6) return 'waiting'
  const recent = h.slice(-6)
  const dx = Math.max(...recent.map(p => p.x)) - Math.min(...recent.map(p => p.x))
  const dy = Math.max(...recent.map(p => p.y)) - Math.min(...recent.map(p => p.y))
  return dx < 0.04 && dy < 0.04
}

function detectDownwardSwipe(h) {
  if (h.length < 8) return 'waiting'
  const recent = h.slice(-8)
  const dy = recent[recent.length - 1].y - recent[0].y
  return dy > 0.06  // y increases downward in normalised coords
}

function detectForwardPush(h) {
  if (h.length < 8) return 'waiting'
  const recent = h.slice(-8)
  const dz = recent[0].z - recent[recent.length - 1].z
  // z decreases as hand moves toward camera (forward in world space)
  // Approximate with x movement as z not always reliable
  const dx = Math.abs(recent[recent.length - 1].x - recent[0].x)
  return dx > 0.05 || dz > 0.02
}

function detectCircularMotion(h) {
  if (h.length < 12) return 'waiting'
  const recent = h.slice(-12)
  // Check for direction changes in both X and Y
  const xs = recent.map(p => p.x)
  const ys = recent.map(p => p.y)
  const xRange = Math.max(...xs) - Math.min(...xs)
  const yRange = Math.max(...ys) - Math.min(...ys)
  return xRange > 0.04 && yRange > 0.04
}

function detectUpwardMove(h) {
  if (h.length < 8) return 'waiting'
  const recent = h.slice(-8)
  const dy = recent[0].y - recent[recent.length - 1].y
  return dy > 0.05  // y decreases as hand moves up
}

function detectNodding(h) {
  if (h.length < 10) return 'waiting'
  const recent = h.slice(-10)
  const ys = recent.map(p => p.y)
  const yRange = Math.max(...ys) - Math.min(...ys)
  return yRange > 0.04
}

function detectLateralShake(h) {
  if (h.length < 10) return 'waiting'
  const recent = h.slice(-10)
  const xs = recent.map(p => p.x)
  const xRange = Math.max(...xs) - Math.min(...xs)
  return xRange > 0.06
}

/* ═══════════════════════════════════════════════════════════
   CLAUDE API
═══════════════════════════════════════════════════════════ */
async function callClaude(prompt, system = '') {
  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  }
  if (system) body.system = system
  const res  = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return data.content?.map(b => b.text || '').join('') || ''
}

/* ═══════════════════════════════════════════════════════════
   PARAM SCORE ROW component
═══════════════════════════════════════════════════════════ */
function ParamRow({ label, value, desc }) {
  const status = value === 'waiting' ? 'wait' : value ? 'pass' : 'fail'
  const icons  = { wait: '⏳', pass: '✓', fail: '✗' }
  return (
    <div className={`param-row ${status}`}>
      <span className="pr-icon">{icons[status]}</span>
      <span className="pr-label">{label}</span>
      <span className="pr-desc">{desc}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function GestureCheck() {
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const handsRef    = useRef(null)
  const cameraRef   = useRef(null)
  const motionRef   = useRef([])          // wrist XY history
  const holdRef     = useRef(null)        // timeout for auto-submit
  const animRef     = useRef(null)

  const [loaded,    setLoaded]   = useState(false)   // MediaPipe ready
  const [error,     setError]    = useState('')
  const [camOn,     setCamOn]    = useState(false)
  const [signIdx,   setSignIdx]  = useState(0)
  const [scores,    setScores]   = useState(null)    // live param scores
  const [holdPct,   setHoldPct]  = useState(0)       // 0-100 hold progress
  const [submitted, setSubmitted]= useState(false)
  const [aiFb,      setAiFb]     = useState('')
  const [aiLoad,    setAiLoad]   = useState(false)
  const [streak,    setStreak]   = useState(0)
  const [history,   setHistory]  = useState([])
  const [filter,    setFilter]   = useState('all')   // all | easy | medium

  const sign = GESTURE_SIGNS[signIdx]

  /* ── Load MediaPipe once ── */
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Dynamic import — user must have installed @mediapipe/hands
        const { Hands, HAND_CONNECTIONS } = await import('@mediapipe/hands')
        if (cancelled) return

        const hands = new Hands({
          locateFile: file =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        })
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.6,
        })
        hands.onResults(results => onResults(results, HAND_CONNECTIONS))
        handsRef.current = hands
        if (!cancelled) setLoaded(true)
      } catch (e) {
        if (!cancelled) setError('MediaPipe를 로드할 수 없습니다. npm install @mediapipe/hands 를 실행했는지 확인하세요.')
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  /* ── Camera on/off ── */
  const startCamera = useCallback(async () => {
    if (!loaded || !videoRef.current) return
    try {
      const { Camera } = await import('@mediapipe/camera_utils')
      const cam = new Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && videoRef.current) {
            await handsRef.current.send({ image: videoRef.current })
          }
        },
        width: 640, height: 480,
      })
      await cam.start()
      cameraRef.current = cam
      setCamOn(true)
    } catch (e) {
      setError('카메라 접근 권한이 필요합니다. 브라우저에서 허용해 주세요.')
    }
  }, [loaded])

  const stopCamera = useCallback(() => {
    cameraRef.current?.stop()
    setCamOn(false)
    setScores(null)
    motionRef.current = []
    clearTimeout(holdRef.current)
    setHoldPct(0)
  }, [])

  useEffect(() => () => { stopCamera() }, [stopCamera])

  /* ── Per-frame result handler ── */
  const onResults = useCallback((results, HAND_CONNECTIONS) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)

    if (!results.multiHandLandmarks?.length) {
      setScores(null)
      motionRef.current = []
      ctx.restore()
      return
    }

    const lm = results.multiHandLandmarks[0]

    // Draw landmarks
    drawConnections(ctx, lm, HAND_CONNECTIONS, canvas.width, canvas.height)
    drawLandmarks(ctx, lm, canvas.width, canvas.height)

    // Update motion history (keep last 30 frames)
    const wrist = lm[LM.WRIST]
    motionRef.current = [...motionRef.current.slice(-29), { x: wrist.x, y: wrist.y, z: wrist.z || 0 }]

    // Run rule engine for current sign (avoid stale closure via ref)
    const currentSign = GESTURE_SIGNS[signIdxRef.current]
    if (!currentSign || submittedRef.current) { ctx.restore(); return }

    const result = checkSign(currentSign.checker, lm, motionRef.current)
    if (!result) { ctx.restore(); return }
    setScores(result)

    // Auto-submit when all params pass for 1.5s
    const allPass = Object.values(result).every(v => v === true)
    if (allPass) {
      if (!holdRef.current) {
        const start = Date.now()
        const tick = () => {
          const pct = Math.min(100, ((Date.now() - start) / 1500) * 100)
          setHoldPct(pct)
          if (pct < 100) {
            holdRef.current = requestAnimationFrame(tick)
          } else {
            holdRef.current = null
            autoSubmit(currentSign)
          }
        }
        holdRef.current = requestAnimationFrame(tick)
      }
    } else {
      if (holdRef.current) {
        cancelAnimationFrame(holdRef.current)
        holdRef.current = null
        setHoldPct(0)
      }
    }

    ctx.restore()
  }, [])

  // Refs to avoid stale closures inside onResults
  const signIdxRef    = useRef(signIdx)
  const submittedRef  = useRef(submitted)
  useEffect(() => { signIdxRef.current = signIdx }, [signIdx])
  useEffect(() => { submittedRef.current = submitted }, [submitted])

  /* ── Auto-submit ── */
  const autoSubmit = useCallback(async (currentSign) => {
    setSubmitted(true)
    setHoldPct(100)
    stopCamera()
    setStreak(s => s + 1)
    setHistory(h => [{ label: currentSign.label, ts: new Date().toLocaleTimeString('ko-KR'), pass: true }, ...h.slice(0, 7)])

    setAiLoad(true)
    try {
      const fb = await callClaude(
        `학습자가 한국수어 "${currentSign.label}" (${currentSign.english}) 수어를 성공적으로 수행했습니다. 카메라로 수형·수위·수향이 모두 확인되었습니다. 3가지를 알려주세요: 1) 짧은 격려 메시지 2) 이 수어를 사용하는 실생활 문장 예시 한 개 3) 다음에 배우면 좋을 관련 수어 한 개 추천. 총 3-4문장, 한국어로.`,
        '한국수어 전문 강사. 간결하고 친근하게.'
      )
      setAiFb(fb.trim())
    } catch { setAiFb('피드백을 불러올 수 없습니다.') }
    setAiLoad(false)
  }, [stopCamera])

  /* ── Next sign ── */
  const nextSign = () => {
    const pool = filter === 'all' ? GESTURE_SIGNS : GESTURE_SIGNS.filter(s => s.difficulty === filter)
    const next = pool[Math.floor(Math.random() * pool.length)]
    setSignIdx(GESTURE_SIGNS.indexOf(next))
    setScores(null)
    setSubmitted(false)
    setAiFb('')
    setHoldPct(0)
    motionRef.current = []
    if (holdRef.current) { cancelAnimationFrame(holdRef.current); holdRef.current = null }
  }

  /* ── Draw helpers ── */
  function drawConnections(ctx, lm, CONNECTIONS, w, h) {
    ctx.strokeStyle = 'rgba(124,111,255,0.6)'
    ctx.lineWidth = 2
    for (const [a, b] of CONNECTIONS) {
      ctx.beginPath()
      ctx.moveTo(lm[a].x * w, lm[a].y * h)
      ctx.lineTo(lm[b].x * w, lm[b].y * h)
      ctx.stroke()
    }
  }
  function drawLandmarks(ctx, lm, w, h) {
    for (let i = 0; i < lm.length; i++) {
      const isFingerTip = [4, 8, 12, 16, 20].includes(i)
      ctx.beginPath()
      ctx.arc(lm[i].x * w, lm[i].y * h, isFingerTip ? 6 : 4, 0, Math.PI * 2)
      ctx.fillStyle = isFingerTip ? '#7c6fff' : '#ffffff'
      ctx.strokeStyle = '#7c6fff'
      ctx.lineWidth = 2
      ctx.fill()
      ctx.stroke()
    }
  }

  /* ── Count passing params ── */
  const passCount = scores
    ? Object.values(scores).filter(v => v === true).length
    : 0
  const totalChecked = scores
    ? Object.values(scores).filter(v => v !== 'waiting').length
    : 0

  const DIFF_COLORS = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' }
  const DIFF_LABELS = { easy: '쉬움', medium: '보통', hard: '어려움' }

  return (
    <div className="gc-wrap">

      {/* ── Header ── */}
      <div className="gc-header">
        <div className="gc-title-row">
          <h2 className="gc-title">📷 카메라 제스처 연습</h2>
          <div className="gc-streak">
            <span className="streak-fire">🔥</span>
            <span className="streak-n">{streak}</span>
            <span className="streak-lbl">연속</span>
          </div>
        </div>
        <p className="gc-sub">MediaPipe로 수형·수위·수향을 실시간 감지합니다</p>

        {/* Filter */}
        <div className="gc-filter">
          {[['all','전체'],['easy','쉬움'],['medium','보통']].map(([v, l]) => (
            <button key={v} className={`gc-filter-btn ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      {error && <div className="gc-error">⚠️ {error}</div>}

      {!loaded && !error && (
        <div className="gc-loading">
          <div className="gc-spinner" />
          <span>MediaPipe 로딩 중...</span>
        </div>
      )}

      {loaded && (
        <div className="gc-body">
          {/* ── Sign selector ── */}
          <div className="sign-selector">
            {GESTURE_SIGNS
              .filter(s => filter === 'all' || s.difficulty === filter)
              .map(s => (
                <button
                  key={s.id}
                  className={`sign-pill ${GESTURE_SIGNS[signIdx]?.id === s.id ? 'active' : ''}`}
                  style={{ '--sc': s.color }}
                  onClick={() => {
                    setSignIdx(GESTURE_SIGNS.indexOf(s))
                    setScores(null); setSubmitted(false); setAiFb(''); setHoldPct(0)
                    motionRef.current = []
                    if (camOn) stopCamera()
                  }}
                >
                  {s.label}
                  <span className="pill-diff" style={{ color: DIFF_COLORS[s.difficulty] }}>
                    {DIFF_LABELS[s.difficulty]}
                  </span>
                </button>
              ))}
          </div>

          {/* ── Main practice area ── */}
          <div className="gc-main">

            {/* Left — camera + canvas */}
            <div className="gc-cam-col">
              <div className="cam-wrapper">
                <video ref={videoRef} className="cam-video" playsInline muted />
                <canvas ref={canvasRef} className="cam-canvas" width={640} height={480} />

                {!camOn && !submitted && (
                  <div className="cam-overlay">
                    <div className="cam-overlay-inner">
                      <div className="cam-sign-preview">
                        <div className="csp-label">{sign.label}</div>
                        <div className="csp-en">{sign.english}</div>
                      </div>
                      <div className="cam-animator-wrap">
                        <SignAnimator signId={sign.id} color={sign.color} compact />
                      </div>
                      <button className="cam-start-btn" onClick={startCamera}>
                        📷 카메라 시작
                      </button>
                    </div>
                  </div>
                )}

                {submitted && (
                  <div className="cam-overlay success-overlay">
                    <div className="success-badge">✓</div>
                    <div className="success-label">완료!</div>
                  </div>
                )}

                {/* Hold progress ring */}
                {camOn && !submitted && holdPct > 0 && (
                  <div className="hold-ring-wrap">
                    <svg viewBox="0 0 48 48" className="hold-ring">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                      <circle
                        cx="24" cy="24" r="20"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 20}`}
                        strokeDashoffset={`${2 * Math.PI * 20 * (1 - holdPct / 100)}`}
                        transform="rotate(-90 24 24)"
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                      />
                    </svg>
                    <span className="hold-pct">{Math.round(holdPct)}%</span>
                  </div>
                )}

                {/* Live detection indicator */}
                {camOn && !submitted && (
                  <div className="live-badge">
                    <span className="live-dot" />
                    감지 중
                  </div>
                )}
              </div>

              {camOn && !submitted && (
                <button className="cam-stop-btn" onClick={stopCamera}>카메라 중지</button>
              )}
            </div>

            {/* Right — scores + instruction */}
            <div className="gc-score-col">

              {/* Sign animator — body diagram + steps + dict link */}
              <SignAnimator signId={sign.id} color={sign.color} />

              {/* Parameter check panel */}
              <div className="param-panel">
                <div className="pp-title">
                  실시간 수어 5요소 체크
                  {scores && (
                    <span className="pp-score" style={{ color: passCount >= 3 ? '#10b981' : '#f59e0b' }}>
                      {passCount}/{Object.keys(scores).length}
                    </span>
                  )}
                </div>

                {!scores && !submitted && (
                  <div className="pp-idle">카메라를 시작하면 실시간으로 체크됩니다</div>
                )}

                {scores && !submitted && Object.entries(sign.checkParams).map(([k, desc]) => (
                  <ParamRow key={k} label={k} value={scores[k]} desc={desc} />
                ))}

                {submitted && Object.entries(sign.checkParams).map(([k, desc]) => (
                  <ParamRow key={k} label={k} value={true} desc={desc} />
                ))}

                {scores && !submitted && (
                  <div className="hold-hint">
                    {Object.values(scores).every(v => v === true)
                      ? '✓ 자세 유지 중... 1.5초 동안 유지하면 자동 완료!'
                      : '빨간 항목을 수정하세요'}
                  </div>
                )}
              </div>

              {/* AI Feedback */}
              {(aiLoad || aiFb) && (
                <div className={`gc-ai-box ${aiFb ? 'has-content' : ''} ${aiLoad ? 'loading' : ''}`}>
                  <div className="gc-ai-header">
                    <span>🤖</span>
                    <span>AI 피드백</span>
                    {aiLoad && <span className="ai-dot" />}
                  </div>
                  {aiLoad
                    ? <div className="ai-skel"><div className="sk-line" /><div className="sk-line short" /></div>
                    : <p className="gc-ai-text">{aiFb}</p>}
                </div>
              )}

              {/* Next button */}
              {(submitted || !camOn) && (
                <button className="gc-next-btn" onClick={nextSign}>
                  {submitted ? '✓ 다음 수어 →' : '⏭ 다른 수어'}
                </button>
              )}
            </div>
          </div>

          {/* ── History ── */}
          {history.length > 0 && (
            <div className="gc-history">
              <div className="gh-title">🕐 최근 완료</div>
              <div className="gh-list">
                {history.map((h, i) => (
                  <div key={i} className="gh-item">
                    <span className="gh-label">{h.label}</span>
                    <span className="gh-pass">✓</span>
                    <span className="gh-time">{h.ts}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}