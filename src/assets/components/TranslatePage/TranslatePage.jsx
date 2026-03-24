import { useEffect, useRef, useState, useCallback } from 'react'
import './TranslatePage.css'


// ══════════════════════════════════════════════════════
//  수어 제스처 사전 (MediaPipe 손 관절 21개 기반 규칙)
//  랜드마크 인덱스:
//    0=손목, 1~4=엄지, 5~8=검지, 9~12=중지,
//    13~16=약지, 17~20=새끼
//  각 손가락 TIP: 4,8,12,16,20
//  각 손가락 PIP: 3,7,11,15,19  (중간 관절)
//  각 손가락 MCP: 2,6,10,14,18  (손바닥 관절)
// ══════════════════════════════════════════════════════

const isFingerUp   = (lm, tip, pip) => lm[tip].y < lm[pip].y
const isThumbUp    = (lm) => lm[4].y < lm[3].y
const isHandOpen   = (lm) =>
    isThumbUp(lm) && isFingerUp(lm,8,6) && isFingerUp(lm,12,10) && isFingerUp(lm,16,14) && isFingerUp(lm,20,18)
const isHandClosed = (lm) =>
    !isFingerUp(lm,8,6) && !isFingerUp(lm,12,10) && !isFingerUp(lm,16,14) && !isFingerUp(lm,20,18)
const isIndexOnly  = (lm) =>
    isFingerUp(lm,8,6) && !isFingerUp(lm,12,10) && !isFingerUp(lm,16,14) && !isFingerUp(lm,20,18)
const isVSign      = (lm) =>
    isFingerUp(lm,8,6) && isFingerUp(lm,12,10) && !isFingerUp(lm,16,14) && !isFingerUp(lm,20,18)
const isThumbOnly  = (lm) =>
    isThumbUp(lm) && !isFingerUp(lm,8,6) && !isFingerUp(lm,12,10) && !isFingerUp(lm,16,14) && !isFingerUp(lm,20,18)
const isILY        = (lm) =>
    isThumbUp(lm) && isFingerUp(lm,8,6) && !isFingerUp(lm,12,10) && !isFingerUp(lm,16,14) && isFingerUp(lm,20,18)
const isThumbDown  = (lm) =>
    lm[4].y > lm[3].y && !isFingerUp(lm,8,6) && !isFingerUp(lm,12,10) && !isFingerUp(lm,16,14) && !isFingerUp(lm,20,18)
const isOK         = (lm) => {
  const dx = lm[4].x - lm[8].x, dy = lm[4].y - lm[8].y
  return Math.sqrt(dx*dx+dy*dy) < 0.07 && isFingerUp(lm,12,10) && isFingerUp(lm,16,14) && isFingerUp(lm,20,18)
}
const isThreeFingers = (lm) =>
    !isThumbUp(lm) && isFingerUp(lm,8,6) && isFingerUp(lm,12,10) && isFingerUp(lm,16,14) && !isFingerUp(lm,20,18)
const isFourFingers  = (lm) =>
    !isThumbUp(lm) && isFingerUp(lm,8,6) && isFingerUp(lm,12,10) && isFingerUp(lm,16,14) && isFingerUp(lm,20,18)
const isPistol       = (lm) =>
    isThumbUp(lm) && isFingerUp(lm,8,6) && !isFingerUp(lm,12,10) && !isFingerUp(lm,16,14) && !isFingerUp(lm,20,18)
const isPinkyOnly    = (lm) =>
    !isThumbUp(lm) && !isFingerUp(lm,8,6) && !isFingerUp(lm,12,10) && !isFingerUp(lm,16,14) && isFingerUp(lm,20,18)

// ── 제스처 규칙 목록 (우선순위 순) ──
const GESTURE_RULES = [
  { name: '안녕하세요',      emoji: '👋', meaning: '인사를 건네고 있습니다.\n손을 펼쳐 가볍게 흔드는 동작입니다.',                                  check: isHandOpen   },
  { name: '괜찮아요',        emoji: '👍', meaning: '괜찮다고 말하고 있습니다.\n엄지손가락을 위로 세우는 동작입니다.',                                  check: isThumbOnly  },
  { name: '싫어요 / 아니요', emoji: '👎', meaning: '거절하거나 아니라고 표현하고 있습니다.\n엄지손가락을 아래로 내리는 동작입니다.',                    check: isThumbDown  },
  { name: '맞아요 / 좋아요', emoji: '✌️', meaning: '동의하거나 좋다는 표현입니다.\n검지와 중지를 V자로 펼치는 동작입니다.',                            check: isVSign      },
  { name: '알겠어요 / OK',   emoji: '👌', meaning: '이해했거나 괜찮다는 표현입니다.\n엄지와 검지 끝을 붙여 동그라미를 만드는 동작입니다.',              check: isOK         },
  { name: '가리키기 / 저기요',emoji: '☝️', meaning: '무언가를 가리키거나 주의를 끌고 있습니다.\n검지만 펴서 위로 가리키는 동작입니다.',                  check: isIndexOnly  },
  { name: '사랑해요',        emoji: '🤟', meaning: '사랑과 애정을 표현하고 있습니다.\n엄지·검지·새끼를 펴는 ILY 동작입니다.',                          check: isILY        },
  { name: '잠깐만요',        emoji: '✋', meaning: '잠시 기다려달라는 표현입니다.\n손바닥 전체를 상대방 쪽으로 펼치는 동작입니다.',                      check: isFourFingers},
  { name: '세 개 / 셋',     emoji: '3️⃣', meaning: '숫자 3을 나타내고 있습니다.\n검지·중지·약지 세 손가락을 펴는 동작입니다.',                          check: isThreeFingers},
  { name: '전화해요',        emoji: '🤙', meaning: '전화하자는 표현입니다.\n엄지와 새끼만 펴서 귀에 대는 동작입니다.',                                   check: isPinkyOnly  },
  { name: '총 / 가리켜요',   emoji: '🫵', meaning: '방향을 가리키거나 강조하는 표현입니다.\n엄지·검지를 총 모양으로 펴는 동작입니다.',                   check: isPistol     },
  { name: '감사합니다',      emoji: '🙏', meaning: '감사함을 표현하고 있습니다.\n두 손을 모아 합장하는 동작입니다.',                                     check: (lm) => isHandClosed(lm) && lm[0].y < 0.6 },
  { name: '주먹 / 힘내요',   emoji: '✊', meaning: '힘내라거나 결의를 다지는 표현입니다.\n손을 꽉 쥔 주먹 동작입니다.',                                  check: isHandClosed },
]

const classifyGesture = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return null
  for (const rule of GESTURE_RULES) {
    if (rule.check(landmarks)) return rule
  }
  return null
}

const STABLE_FRAMES    = 12
const SIGN_COOLDOWN_MS = 3000

// ══════════════════════════════════════════════════════
//  HandSVG — 손 모양 SVG 애니메이션 컴포넌트
//  type: open / fist / point / peace / thumbup /
//        thumbdown / ok / pinch / call / love
// ══════════════════════════════════════════════════════
function HandSVG({ type = 'open', animate = true }) {
  // 손바닥 + 손가락 5개를 파라미터로 정의
  // fingers: [엄지, 검지, 중지, 약지, 새끼] — 1=펴짐, 0=접힘
  const configs = {
    open:     { fingers: [1,1,1,1,1], label: 'Open Hand',  labelKo: '손 펼치기',    color: '#7c6fff' },
    fist:     { fingers: [0,0,0,0,0], label: 'Fist',       labelKo: '주먹',          color: '#ef4444' },
    point:    { fingers: [0,1,0,0,0], label: 'Point',      labelKo: '검지 가리키기', color: '#06b6d4' },
    peace:    { fingers: [0,1,1,0,0], label: 'Peace / V',  labelKo: 'V 사인',        color: '#10b981' },
    thumbup:  { fingers: [1,0,0,0,0], label: 'Thumbs Up',  labelKo: '엄지 위로',     color: '#f59e0b' },
    thumbdown:{ fingers: [1,0,0,0,0], label: 'Thumbs Down',labelKo: '엄지 아래로',   color: '#f97316', thumbDown: true },
    ok:       { fingers: [1,1,0,0,0], label: 'OK',         labelKo: 'OK 사인',       color: '#8b5cf6', okSign: true },
    pinch:    { fingers: [1,1,0,0,0], label: 'Pinch',      labelKo: '집기',          color: '#ec4899', okSign: true },
    call:     { fingers: [1,0,0,0,1], label: 'Call Me',    labelKo: '전화해요',      color: '#0ea5e9' },
    love:     { fingers: [1,1,0,0,1], label: 'I Love You', labelKo: '사랑해요',      color: '#e11d48' },
  }
  const cfg = configs[type] || configs.open
  const { fingers, color, thumbDown, okSign } = cfg

  // 손가락 위치 정의 (x, 접혔을때y, 폈을때y)
  const fingerDefs = [
    { x: 62,  foldY: 88,  upY: 38,  w: 11 }, // 엄지 (별도처리)
    { x: 84,  foldY: 85,  upY: 28,  w: 11 }, // 검지
    { x: 98,  foldY: 85,  upY: 22,  w: 11 }, // 중지
    { x: 112, foldY: 85,  upY: 26,  w: 11 }, // 약지
    { x: 126, foldY: 85,  upY: 34,  w: 10 }, // 새끼
  ]

  // 엄지는 별도로 옆으로 뻗음
  const thumbX     = thumbDown ? 52 : 52
  const thumbY     = thumbDown ? 115 : 75
  const thumbTipX  = fingers[0] ? (thumbDown ? 40 : 38) : 60
  const thumbTipY  = fingers[0] ? (thumbDown ? 130 : 60) : 95

  return (
      <div className="hand-svg-wrap" style={{ '--hand-color': color }}>
        <svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg" className={`hand-svg ${animate ? 'hand-animated' : ''}`}>
          {/* 손바닥 */}
          <ellipse cx="104" cy="112" rx="38" ry="34" fill={color} opacity="0.15" />
          <ellipse cx="104" cy="112" rx="36" ry="32" fill="none" stroke={color} strokeWidth="2.5" />

          {/* 엄지 */}
          <line
              x1={thumbX} y1={thumbY}
              x2={thumbTipX} y2={thumbTipY}
              stroke={color} strokeWidth="10" strokeLinecap="round"
              className={animate ? 'finger-animated' : ''}
              style={{ animationDelay: '0s' }}
          />
          <circle cx={thumbTipX} cy={thumbTipY} r="5.5" fill={color} />

          {/* 검지~새끼 */}
          {fingerDefs.slice(1).map((f, i) => {
            const isUp  = fingers[i + 1] === 1
            const tipY  = isUp ? f.upY : f.foldY
            return (
                <g key={i}>
                  <line
                      x1={f.x} y1={90}
                      x2={okSign && i === 0 ? thumbTipX + 4 : f.x}
                      y2={okSign && i === 0 ? thumbTipY + 4 : tipY}
                      stroke={color} strokeWidth={f.w} strokeLinecap="round"
                      className={animate ? 'finger-animated' : ''}
                      style={{ animationDelay: `${(i + 1) * 0.08}s` }}
                  />
                  {!(okSign && i === 0) && (
                      <circle cx={f.x} cy={tipY} r="5.5" fill={color} />
                  )}
                </g>
            )
          })}

          {/* OK 사인: 엄지+검지 연결 원 */}
          {okSign && (
              <circle cx={(thumbTipX + fingerDefs[1].x) / 2 + 2} cy={(thumbTipY + 50) / 2}
                      r="7" fill="none" stroke={color} strokeWidth="2.5" />
          )}

          {/* 동작 방향 화살표 (애니메이션) */}
          {animate && type === 'open' && (
              <g className="wave-arrow">
                <path d="M 60 160 Q 104 150 148 160" fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 3" opacity="0.5" />
                <polygon points="146,155 150,162 142,162" fill={color} opacity="0.5" />
              </g>
          )}
          {animate && type === 'thumbup' && (
              <g className="pulse-arrow">
                <line x1="38" y1="55" x2="38" y2="38" stroke={color} strokeWidth="2" opacity="0.6" className="arrow-up" />
                <polygon points="34,42 38,34 42,42" fill={color} opacity="0.6" className="arrow-up" />
              </g>
          )}
          {animate && type === 'thumbdown' && (
              <g className="pulse-arrow">
                <line x1="38" y1="125" x2="38" y2="142" stroke={color} strokeWidth="2" opacity="0.6" className="arrow-down" />
                <polygon points="34,138 38,146 42,138" fill={color} opacity="0.6" className="arrow-down" />
              </g>
          )}
        </svg>

        {/* 한/영 라벨 */}
        <div className="hand-svg-label">
          <span className="hand-label-ko">{cfg.labelKo}</span>
          <span className="hand-label-en">{cfg.label}</span>
        </div>
      </div>
  )
}

export default function TranslatePage({ onEndConversation }) {
  const [mpLoaded,      setMpLoaded]      = useState(false)
  const [mpError,       setMpError]       = useState(null)
  const [cameraOn,      setCameraOn]      = useState(false)
  const [listening,     setListening]     = useState(false)
  const [messages,      setMessages]      = useState([])
  const [inputMode,     setInputMode]     = useState('voice')
  const [textInput,     setTextInput]     = useState('')
  const [voiceText,     setVoiceText]     = useState('')
  const [pendingSign,   setPendingSign]   = useState(null)
  const [signMeaning,   setSignMeaning]   = useState(null)
  const [pendingVoice,  setPendingVoice]  = useState(null)
  const [aiSignGuide,   setAiSignGuide]   = useState(null)
  const [aiLoading,     setAiLoading]     = useState(false)
  const [showStopWarning, setShowStopWarning] = useState(false)
  const [liveGesture,   setLiveGesture]   = useState(null)
  const [handDetected,  setHandDetected]  = useState(false)
  const [stableProgress,setStableProgress]= useState(0)

  const videoRef        = useRef(null)
  const canvasRef       = useRef(null)
  const handsRef        = useRef(null)
  const rafRef          = useRef(null)
  const recognitionRef  = useRef(null)
  const chatEndRef      = useRef(null)
  const textareaRef     = useRef(null)
  const lastSignRef     = useRef(null)
  const lastSignTimeRef = useRef(0)
  const isRunningRef    = useRef(false)
  const messagesRef     = useRef([])
  const stableCountRef  = useRef(0)
  const stableNameRef   = useRef(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (inputMode === 'text' && listening) stopVoice()
    if (inputMode === 'text') setTimeout(() => textareaRef.current?.focus(), 100)
  }, [inputMode])

  // ── MediaPipe 스크립트 로드 ──
  const loadMediaPipe = () => new Promise((resolve, reject) => {
    if (window.Hands) { resolve(); return }
    const s1 = document.createElement('script')
    s1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.min.js'
    s1.crossOrigin = 'anonymous'
    s1.onload = () => {
      const s2 = document.createElement('script')
      s2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074/camera_utils.min.js'
      s2.crossOrigin = 'anonymous'
      s2.onload = () => {
        const s3 = document.createElement('script')
        s3.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1620248257/drawing_utils.min.js'
        s3.crossOrigin = 'anonymous'
        s3.onload  = resolve
        s3.onerror = () => reject(new Error('drawing_utils 로드 실패'))
        document.head.appendChild(s3)
      }
      s2.onerror = () => reject(new Error('camera_utils 로드 실패'))
      document.head.appendChild(s2)
    }
    s1.onerror = () => reject(new Error('MediaPipe Hands 로드 실패'))
    document.head.appendChild(s1)
  })

  // ── 카메라 시작 ──
  const init = async () => {
    setMpError(null)
    try {
      await loadMediaPipe()
      if (handsRef.current) { try { handsRef.current.close() } catch (_) {}; handsRef.current = null }

      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`,
      })
      hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.6 })
      hands.onResults(onResults)
      handsRef.current = hands
      setMpLoaded(true)

      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      const video  = videoRef.current
      video.srcObject = stream
      await video.play()

      isRunningRef.current = true
      setCameraOn(true)
      setShowStopWarning(false)

      const processFrame = async () => {
        if (!isRunningRef.current) return
        if (video.readyState >= 2) await handsRef.current?.send({ image: video })
        rafRef.current = requestAnimationFrame(processFrame)
      }
      rafRef.current = requestAnimationFrame(processFrame)
    } catch (err) {
      setMpError(err.message || '카메라 또는 MediaPipe 초기화 실패')
    }
  }

  // ── MediaPipe 결과 콜백 ──
  const onResults = useCallback((results) => {
    if (!isRunningRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.scale(-1, 1)
    ctx.drawImage(results.image, -canvas.width, 0, canvas.width, canvas.height)
    ctx.restore()

    if (results.multiHandLandmarks?.length > 0) {
      setHandDetected(true)
      const landmarks = results.multiHandLandmarks[0]

      window.drawConnectors?.(ctx, landmarks, window.HAND_CONNECTIONS, { color: '#7c6fff', lineWidth: 2 })
      window.drawLandmarks?.(ctx, landmarks, { color: '#fff', lineWidth: 1, radius: 3, fillColor: '#7c6fff' })

      const gesture = classifyGesture(landmarks)
      if (gesture) {
        if (gesture.name === stableNameRef.current) {
          stableCountRef.current += 1
        } else {
          stableNameRef.current  = gesture.name
          stableCountRef.current = 1
        }
        const progress = Math.min((stableCountRef.current / STABLE_FRAMES) * 100, 100)
        setStableProgress(progress)
        if (stableCountRef.current >= 3) setLiveGesture(gesture)

        if (stableCountRef.current >= STABLE_FRAMES) {
          const now = Date.now()
          if (gesture.name !== lastSignRef.current || now - lastSignTimeRef.current > SIGN_COOLDOWN_MS) {
            lastSignRef.current     = gesture.name
            lastSignTimeRef.current = now
            stableCountRef.current  = 0
            stableNameRef.current   = null
            setStableProgress(0)
            setPendingSign(`${gesture.emoji} ${gesture.name}`)
            setSignMeaning(gesture.meaning)
          }
        }
      } else {
        stableCountRef.current = 0
        stableNameRef.current  = null
        setStableProgress(0)
        setLiveGesture(null)
      }
    } else {
      setHandDetected(false)
      setLiveGesture(null)
      stableCountRef.current = 0
      stableNameRef.current  = null
      setStableProgress(0)
    }
  }, [])

  // ── 카메라 중지 ──
  const stopCamera = () => {
    isRunningRef.current = false
    cancelAnimationFrame(rafRef.current)
    const video = videoRef.current
    if (video?.srcObject) { video.srcObject.getTracks().forEach(t => t.stop()); video.srcObject = null }
    try { handsRef.current?.close() } catch (_) {}
    handsRef.current = null
    setCameraOn(false); setHandDetected(false); setLiveGesture(null); setShowStopWarning(false); setStableProgress(0)
    stableCountRef.current = 0
    canvasRef.current?.getContext('2d').clearRect(0, 0, 640, 480)
  }

  // ── 수어 전송 ──
  const sendSign = () => {
    if (!pendingSign) return
    addMessage('sign', pendingSign)
    setPendingSign(null); setSignMeaning(null)
    lastSignRef.current = null
    if (!isRunningRef.current) init()
  }
  const retakeSign = () => { setPendingSign(null); setSignMeaning(null); if (!isRunningRef.current) init() }

  // ── AI 수어 안내 (Claude API) ──
  const getAiSignGuide = async (text) => {
    setAiLoading(true)
    setAiSignGuide(null)
    try {
      const systemPrompt = `You are a professional Korean Sign Language (KSL) interpreter.
When given a text input, explain how to express it in sign language so that a deaf/hard-of-hearing person can understand.

IMPORTANT: All descriptions must be written in BOTH Korean AND English (bilingual).

Respond ONLY with a JSON object in this exact format — no markdown, no extra text:

{
  "summary": "핵심 메시지 (Korean) / Key message (English)",
  "steps": [
    {
      "order": 1,
      "word": "단어/구절 (Korean) / Word/phrase (English)",
      "handShape": "손 모양 설명 (Korean) / Hand shape description (English)",
      "movement": "동작 설명 (Korean) / Movement description (English)",
      "expression": "표정/입 모양 (Korean) / Facial expression (English)",
      "handType": "one of: open / fist / point / peace / thumbup / thumbdown / ok / pinch / call / love"
    }
  ],
  "tip": "소통 팁 (Korean) / Communication tip (English)"
}`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: `다음 문장을 수어로 표현하는 방법을 알려주세요: "${text}"` }],
        }),
      })
      const data = await response.json()
      const raw  = data.content?.[0]?.text || ''
      const clean = raw.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setAiSignGuide(parsed)
    } catch (err) {
      setAiSignGuide({
        summary: text,
        steps: [{
          order: 1, word: text,
          handShape: '두 손을 앞으로 펼쳐 보여주세요',
          movement: '천천히 입 모양을 크게 만들며 상대방의 눈을 바라보세요',
          expression: '밝은 표정으로 천천히',
          handType: 'open',
        }],
        tip: '수어가 어렵다면 이 화면을 장애인에게 직접 보여주세요.',
      })
    }
    setAiLoading(false)
  }

  // ── 음성 인식 ──
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Chrome 브라우저를 사용해주세요.'); return }
    const rec = new SR()
    rec.lang = 'ko-KR'; rec.interimResults = true; rec.continuous = true
    recognitionRef.current = rec
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('')
      setVoiceText(t)
      if (e.results[e.results.length - 1].isFinal) {
        const final = e.results[e.results.length - 1][0].transcript.trim()
        if (final) { setPendingVoice(final); setVoiceText(''); stopVoice() }
      }
    }
    rec.onend = () => setListening(false)
    rec.start(); setListening(true)
  }
  const stopVoice = () => { recognitionRef.current?.stop(); setListening(false); setVoiceText('') }

  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const v = textInput.trim()
      if (v) { setPendingVoice(v); setTextInput('') }
    }
  }
  const submitTextInput = () => { const v = textInput.trim(); if (!v) return; setPendingVoice(v); setTextInput('') }
  const sendVoice  = () => { if (!pendingVoice) return; addMessage('voice', pendingVoice); getAiSignGuide(pendingVoice); setPendingVoice(null) }
  const retakeVoice = () => setPendingVoice(null)

  const addMessage = (type, text) => {
    const newMsg = { id: Date.now() + Math.random(), type, text,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) }
    setMessages(prev => { const next = [...prev, newMsg]; messagesRef.current = next; return next })
  }

  const handleEndConversation = () => {
    if (cameraOn) { setShowStopWarning(true); return }
    try { recognitionRef.current?.stop() } catch (_) {}
    if (onEndConversation) onEndConversation(messagesRef.current)
  }

  useEffect(() => () => {
    isRunningRef.current = false
    cancelAnimationFrame(rafRef.current)
    const video = videoRef.current
    if (video?.srcObject) video.srcObject.getTracks().forEach(t => t.stop())
    try { handsRef.current?.close() } catch (_) {}
    try { recognitionRef.current?.stop() } catch (_) {}
  }, [])

  return (
      <div className="trans-page">
        <div className="warn-banner">⚠️ 이 화면의 모든 내용은 기록됩니다.</div>
        {mpError && <div className="error-banner">❌ {mpError}</div>}

        {showStopWarning && (
            <div className="stop-warning-banner">
              ⚠️ 카메라가 켜져 있습니다. 먼저 수어 인식 패널에서 <strong>⏹ Stop</strong> 버튼을 눌러 카메라를 꺼주세요.
              <button className="stop-warning-close" onClick={() => setShowStopWarning(false)}>✕</button>
            </div>
        )}

        <div className="end-conv-row">
          <span className="end-conv-hint">대화가 끝나면 Stop 후 아래 버튼을 눌러 기록을 확인하세요</span>
          <button className="btn-end-conversation" onClick={handleEndConversation}>대화 종료하기 →</button>
        </div>

        {/* 숨겨진 비디오 (MediaPipe 입력용) */}
        <video ref={videoRef} style={{ display: 'none' }} playsInline muted />

        <div className="demo-grid">

          {/* ── 열 1: 수어 인식 ── */}
          <div className="panel panel-full panel-sign">
            <div className="panel-title">
              🖐 수어 인식 (장애인)
              {cameraOn && <span className="badge-rec">● REC</span>}
              {mpLoaded && <span className="badge-model">✓ MediaPipe</span>}
            </div>
            <div className="panel-body">
              <div className="cam-btn-row">
                <button className="btn-cam"  onClick={init}       disabled={cameraOn}>▶ Start</button>
                <button className="btn-stop" onClick={stopCamera} disabled={!cameraOn}>⏹ Stop</button>
              </div>

              {/* 카메라 캔버스 */}
              <div className="video-box">
                <canvas ref={canvasRef} width={640} height={480} className="cam-canvas"
                        style={{ display: cameraOn ? 'block' : 'none' }} />
                {!cameraOn && (
                    <div className="video-empty">
                      <span style={{ fontSize: 40 }}>🤟</span>
                      <p>▶ Start를 눌러<br />카메라를 시작하세요</p>
                    </div>
                )}
              </div>

              {/* ── 실시간 인식 결과 ── */}
              <div className="live-result-area">
                {!cameraOn ? (
                    <div className="live-result-idle">카메라를 켜면 수어 인식이 시작됩니다</div>
                ) : !handDetected ? (
                    <div className="live-result-idle">✋ 손을 카메라 앞에 보여주세요</div>
                ) : liveGesture ? (
                    <div className="live-result-active">
                      <span className="live-gesture-emoji">{liveGesture.emoji}</span>
                      <div className="live-gesture-info">
                        <div className="live-gesture-name">{liveGesture.name}</div>
                        <div className="live-gesture-meaning">{liveGesture.meaning}</div>
                      </div>
                      <div className="stable-bar-wrap">
                        <div className="stable-bar-label">동작 유지 중... {Math.round(stableProgress)}%</div>
                        <div className="stable-bar-track">
                          <div className="stable-bar-fill" style={{ width: `${stableProgress}%` }} />
                        </div>
                      </div>
                    </div>
                ) : (
                    <div className="live-result-idle">🔍 동작을 인식하고 있어요...</div>
                )}
              </div>

              {/* pendingSign 확인 카드 */}
              {pendingSign && (
                  <div className="sign-preview">
                    <div className="sign-preview-icon">🤟</div>
                    <div className="sign-preview-label">인식된 수어</div>
                    <div className="sign-preview-text">{pendingSign}</div>
                    <div className="sign-preview-meaning">{signMeaning}</div>
                    <p className="sign-preview-question">이 내용이 맞나요?</p>
                    <div className="sign-preview-actions">
                      <button className="btn-retake"    onClick={retakeSign}>↩ 재촬영</button>
                      <button className="btn-send-sign" onClick={sendSign}>전송하기 →</button>
                    </div>
                  </div>
              )}
            </div>
          </div>

          {/* ── 열 2: AI 수어 안내 + 대화 기록 ── */}
          <div className="panel-col-center">
            <div className="panel panel-ai panel-ai-guide">
              <div className="panel-title">
                🤖 AI 수어 안내
                {aiLoading && <span className="badge-live">● 분석 중...</span>}
                <span className="api-mode-badge">장애인에게 보여주기</span>
              </div>
              <div className="panel-body">
                <div className="ai-response-box">
                  {aiLoading ? (
                      <div className="ai-placeholder">
                        <div className="typing-dots"><span/><span/><span/></div>
                        <p style={{ color: '#aaa', fontSize: 13 }}>수어 동작 안내를 생성 중...</p>
                      </div>
                  ) : aiSignGuide ? (
                      <div className="ai-guide-result">
                        {/* 핵심 메시지 */}
                        <div className="ai-summary-box">
                          <span className="ai-summary-label">💬 전달할 내용</span>
                          <div className="ai-summary-text">{aiSignGuide.summary}</div>
                        </div>
                        {/* 단계별 수어 카드 */}
                        <div className="ai-steps">
                          {aiSignGuide.steps?.map((step, i) => (
                              <div key={i} className="ai-step-card">
                                <div className="ai-step-header">
                                  <span className="ai-step-num">{step.order}</span>
                                  <span className="ai-step-word">{step.word}</span>
                                </div>
                                {/* SVG 손 일러스트 */}
                                <div className="ai-hand-wrap">
                                  <HandSVG type={step.handType} />
                                </div>
                                <div className="ai-step-desc">
                                  <div className="ai-step-row">
                                    <span className="ai-step-icon">✋</span>
                                    <span>{step.handShape}</span>
                                  </div>
                                  <div className="ai-step-row">
                                    <span className="ai-step-icon">🔄</span>
                                    <span>{step.movement}</span>
                                  </div>
                                  <div className="ai-step-row">
                                    <span className="ai-step-icon">😊</span>
                                    <span>{step.expression}</span>
                                  </div>
                                </div>
                              </div>
                          ))}
                        </div>
                        {/* 소통 팁 */}
                        {aiSignGuide.tip && (
                            <div className="ai-tip-box">💡 {aiSignGuide.tip}</div>
                        )}
                      </div>
                  ) : (
                      <div className="ai-placeholder">
                        <span style={{ fontSize: 40 }}>🤟</span>
                        <p>음성/텍스트를 입력하고 전송하면<br/>장애인에게 보여줄<br/>수어 동작 안내가 표시됩니다</p>
                        <div className="ai-mode-info">
                          이 패널의 내용은 대화 기록에 저장되지 않습니다.{'\n'}
                          장애인이 내용을 이해할 수 있도록 화면을 보여주세요.
                        </div>
                      </div>
                  )}
                </div>
              </div>
            </div>

            <div className="panel panel-chat panel-chat-log">
              <div className="panel-title">💬 대화 기록</div>
              <div className="panel-body">
                <div className="chat-box">
                  {messages.length === 0 ? (
                      <div className="chat-empty">
                        <span style={{ fontSize: 36 }}>💬</span>
                        <p>수어 동작 후 전송하거나<br/>말/타이핑 후 전송하면<br/>대화가 시작됩니다</p>
                      </div>
                  ) : messages.map(msg => (
                      <div key={msg.id} className={`msg msg-${msg.type}`}>
                        <div className="msg-avatar">{msg.type === 'sign' ? '🧏' : '🙋'}</div>
                        <div className="msg-content">
                          <div className="msg-name">{msg.type === 'sign' ? '장애인 (수어)' : '나 (음성/텍스트)'}</div>
                          <div className="msg-text" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                          <div className="msg-time">{msg.time}</div>
                        </div>
                      </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>
            </div>
          </div>

          {/* ── 열 3: 음성 / 텍스트 입력 ── */}
          <div className="panel panel-full panel-voice">
            <div className="panel-title">
              {inputMode === 'voice' ? '🎙️ 음성 입력' : '⌨️ 텍스트 입력'}
              {listening && <span className="badge-live">● LIVE</span>}
              <div className="input-tabs">
                <button className={`tab-btn ${inputMode === 'voice' ? 'tab-active' : ''}`} onClick={() => setInputMode('voice')}>🎙️ 음성</button>
                <button className={`tab-btn ${inputMode === 'text'  ? 'tab-active' : ''}`} onClick={() => setInputMode('text')}>⌨️ 텍스트</button>
              </div>
            </div>
            <div className="panel-body panel-body-center">
              {!pendingVoice ? (
                  <>
                    {inputMode === 'voice' && (
                        <div className="voice-box">
                          <button className={`mic-btn ${listening ? 'mic-on' : ''}`} onClick={listening ? stopVoice : startVoice}>
                            <span className="mic-emoji">🎙️</span>
                            {listening && <div className="mic-rings"><div className="ring r1"/><div className="ring r2"/></div>}
                          </button>
                          <p className="mic-hint">{listening ? voiceText || '듣고 있어요...' : '버튼을 눌러 말하세요'}</p>
                          <p className="mic-desc">말이 끝나면 자동으로 미리보기가 나타납니다</p>
                        </div>
                    )}
                    {inputMode === 'text' && (
                        <div className="text-input-box">
                          <p className="text-input-hint">메시지를 입력 후 미리보기 버튼을 누르세요</p>
                          <div className="text-input-row">
                      <textarea ref={textareaRef} className="text-input-area"
                                placeholder="여기에 입력하세요... (Enter로 미리보기)"
                                value={textInput} onChange={e => setTextInput(e.target.value)}
                                onKeyDown={handleTextKeyDown} rows={4} />
                            <button className={`text-send-btn ${textInput.trim() ? 'text-send-active' : ''}`}
                                    onClick={submitTextInput} disabled={!textInput.trim()}>미리<br/>보기<br/>↑</button>
                          </div>
                          <p className="text-input-sub">Shift+Enter 줄바꿈 / Enter 미리보기</p>
                        </div>
                    )}
                  </>
              ) : (
                  <div className="voice-preview">
                    <div className="voice-preview-icon">🙋</div>
                    <div className="voice-preview-label">입력된 내용</div>
                    <div className="voice-preview-text">{pendingVoice}</div>
                    <p className="voice-preview-question">이 내용을 전송할까요?</p>
                    <div className="voice-preview-actions">
                      <button className="btn-retake"     onClick={retakeVoice}>↩ 다시 입력</button>
                      <button className="btn-send-voice" onClick={sendVoice}>전송하기 →</button>
                    </div>
                  </div>
              )}
            </div>
          </div>

        </div>
      </div>
  )
}