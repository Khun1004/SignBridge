import { useEffect, useRef, useState } from 'react'
import './Demo.css'

// ─────────────────────────────────────────────────────────────
// ★ STEP 1: Teachable Machine 모델 URL 입력
// ─────────────────────────────────────────────────────────────
const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/여기에URL입력/'

// ─────────────────────────────────────────────────────────────
// ★ STEP 2: TM 클래스명 → 표시 레이블 매핑
//   왼쪽 키 = Teachable Machine에서 지정한 클래스명과 정확히 일치
// ─────────────────────────────────────────────────────────────
const CLASS_LABELS = {
  '안녕하세요': '안녕하세요 👋',
  '감사합니다': '감사합니다 🙏',
  '도와주세요': '도와주세요 🤲',
  '화장실':     '화장실 어디예요? 🚻',
  '괜찮아요':   '괜찮아요 😊',
  '잠깐만요':   '잠깐만요 ✋',
}

// ─────────────────────────────────────────────────────────────
// ★ STEP 3: AI 응답 방식 선택
//
//   방법 A (기본값, 바로 작동):
//     USE_CLAUDE_API = false
//     → 수어 동작마다 미리 정의된 응답을 즉시 표시
//     → 별도 서버 불필요
//
//   방법 B (실제 Claude AI):
//     USE_CLAUDE_API = true
//     → 반드시 백엔드 프록시 서버가 필요합니다
//     → 브라우저에서 API 키를 직접 노출하면 보안 위험!
//     → 아래 PROXY_URL에 본인 서버 주소 입력
//     → 서버 예시(Node.js):
//
//       app.post('/api/translate', async (req, res) => {
//         const response = await fetch('https://api.anthropic.com/v1/messages', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'x-api-key': process.env.ANTHROPIC_API_KEY,  // 서버 환경변수
//             'anthropic-version': '2023-06-01',
//           },
//           body: JSON.stringify(req.body),
//         })
//         const data = await response.json()
//         res.json(data)
//       })
// ─────────────────────────────────────────────────────────────
const USE_CLAUDE_API = false          // true = Claude API, false = 즉시 응답
const PROXY_URL      = '/api/translate' // 백엔드 프록시 주소 (방법 B 사용 시)

// 방법 A: 수어별 미리 정의된 즉시 응답
const PRESET_RESPONSES = {
  '안녕하세요 👋': `📢 해석/번역: 상대방이 "안녕하세요"라고 인사하고 있습니다.\n\n🤟 수어 표현: 오른손을 펼쳐 이마 옆에 가져다 댄 뒤 앞쪽 아래로 내립니다. 부드럽고 자연스럽게 흔드는 느낌으로 표현하세요.\n\n💬 소통 팁: 밝은 표정과 함께 눈을 마주치면 더 따뜻한 인사가 됩니다.`,
  '감사합니다 🙏': `📢 해석/번역: 상대방이 감사함을 표현하고 있습니다.\n\n🤟 수어 표현: 두 손을 모아 가슴 앞에서 합장하듯 모은 뒤 앞쪽으로 살짝 내밀어 인사합니다.\n\n💬 소통 팁: 고개를 약간 숙이면서 함께 표현하면 더 진심이 전달됩니다.`,
  '도와주세요 🤲': `📢 해석/번역: 상대방이 도움을 요청하고 있습니다.\n\n🤟 수어 표현: 두 손바닥을 위로 펼쳐 앞으로 내밀며 눈썹을 올리고 도움을 구하는 표정을 짓습니다.\n\n💬 소통 팁: "어떤 도움이 필요하세요?"라고 천천히 입 모양을 크게 만들어 주세요.`,
  '화장실 어디예요? 🚻': `📢 해석/번역: 화장실 위치를 묻고 있습니다.\n\n🤟 수어 표현: 오른손 검지로 "ㅎ" 자 모양을 만들며 흔들고, 이어서 손으로 방향을 가리킵니다. 방향을 알면 손가락으로 명확히 가리켜 주세요.\n\n💬 소통 팁: 방향을 손가락으로 직접 가리키며 "이쪽입니다"라고 안내하면 가장 빠릅니다.`,
  '괜찮아요 😊': `📢 해석/번역: 상대방이 "괜찮다"고 말하고 있습니다.\n\n🤟 수어 표현: 오른손 엄지를 세워 위로 올립니다(엄지 척). 밝은 표정과 함께 표현하세요.\n\n💬 소통 팁: 상황에 따라 고개를 끄덕이며 미소 지으면 의사 전달이 더 명확해집니다.`,
  '잠깐만요 ✋': `📢 해석/번역: 잠시 기다려달라고 요청하고 있습니다.\n\n🤟 수어 표현: 오른손 손바닥을 상대방 쪽으로 향하게 펼쳐 들고 잠시 유지합니다.\n\n💬 소통 팁: 손을 든 상태에서 1~2초 유지해야 의미가 분명히 전달됩니다.`,
}

const CONFIDENCE_THRESHOLD = 0.85
const SIGN_COOLDOWN_MS      = 3000

export default function Demo() {
  const [modelLoaded, setModelLoaded] = useState(false)
  const [modelError,  setModelError]  = useState(null)
  const [cameraOn,    setCameraOn]    = useState(false)
  const [listening,   setListening]   = useState(false)
  const [messages,    setMessages]    = useState([])
  const [currentSign, setCurrentSign] = useState(null)
  const [aiResponse,  setAiResponse]  = useState(null)
  const [aiLoading,   setAiLoading]   = useState(false)
  const [voiceText,   setVoiceText]   = useState('')
  const [inputMode,   setInputMode]   = useState('voice')
  const [textInput,   setTextInput]   = useState('')
  const [predictions, setPredictions] = useState([])
  const [topConf,     setTopConf]     = useState(0)

  const canvasRef       = useRef(null)
  const modelRef        = useRef(null)
  const webcamRef       = useRef(null)
  const ctxRef          = useRef(null)
  const maxPredRef      = useRef(0)
  const rafRef          = useRef(null)
  const recognitionRef  = useRef(null)
  const chatEndRef      = useRef(null)
  const textareaRef     = useRef(null)
  const lastSignRef     = useRef(null)
  const lastSignTimeRef = useRef(0)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (inputMode === 'text' && listening) stopVoice()
    if (inputMode === 'text') setTimeout(() => textareaRef.current?.focus(), 100)
  }, [inputMode])

  // ── 스크립트 로드 (공식 샘플과 동일한 CDN / 버전) ──────────
  const loadScripts = () => new Promise((resolve, reject) => {
    if (window.tmPose) { resolve(); return }
    const tfScript = document.createElement('script')
    tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js'
    tfScript.onload = () => {
      const tmScript = document.createElement('script')
      tmScript.src = 'https://cdn.jsdelivr.net/npm/@teachablemachine/pose@0.8/dist/teachablemachine-pose.min.js'
      tmScript.onload  = resolve
      tmScript.onerror = () => reject(new Error('teachablemachine-pose 로드 실패'))
      document.head.appendChild(tmScript)
    }
    tfScript.onerror = () => reject(new Error('TensorFlow.js 로드 실패'))
    document.head.appendChild(tfScript)
  })

  // ── init() ─────────────────────────────────────────────────
  const init = async () => {
    try {
      await loadScripts()
      const tmPose = window.tmPose
      const base        = MODEL_URL.endsWith('/') ? MODEL_URL : MODEL_URL + '/'
      const model       = await tmPose.load(base + 'model.json', base + 'metadata.json')
      modelRef.current   = model
      maxPredRef.current = model.getTotalClasses()
      setModelLoaded(true)
      setModelError(null)

      const size   = 300
      const webcam = new tmPose.Webcam(size, size, true)
      await webcam.setup()
      await webcam.play()
      webcamRef.current = webcam

      const canvas      = canvasRef.current
      canvas.width      = size
      canvas.height     = size
      ctxRef.current    = canvas.getContext('2d')

      setCameraOn(true)
      rafRef.current = window.requestAnimationFrame(loop)
    } catch (err) {
      setModelError(err.message || '모델 로드 실패. MODEL_URL을 확인하세요.')
    }
  }

  // ── loop() ─────────────────────────────────────────────────
  const loop = async () => {
    webcamRef.current?.update()
    await predict()
    rafRef.current = window.requestAnimationFrame(loop)
  }

  // ── predict() ──────────────────────────────────────────────
  const predict = async () => {
    const model  = modelRef.current
    const webcam = webcamRef.current
    if (!model || !webcam) return

    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas)
    const prediction = await model.predict(posenetOutput)

    const predList = Array.from({ length: maxPredRef.current }, (_, i) => ({
      className:   prediction[i].className,
      probability: prediction[i].probability,
    }))
    setPredictions(predList)

    const best = predList.reduce(
        (max, p) => p.probability > max.probability ? p : max,
        { probability: 0, className: '' }
    )
    setTopConf(best.probability)

    if (best.probability >= CONFIDENCE_THRESHOLD) {
      const now      = Date.now()
      const diffSign = best.className !== lastSignRef.current
      const diffTime = now - lastSignTimeRef.current > SIGN_COOLDOWN_MS
      if (diffSign || diffTime) {
        lastSignRef.current     = best.className
        lastSignTimeRef.current = now
        const label = CLASS_LABELS[best.className] || best.className
        setCurrentSign(label)
        addMessage('sign', label)
        handleAIResponse(label, 'sign')
      }
    } else if (best.probability < 0.3) {
      setCurrentSign(null)
    }

    drawPose(pose)
  }

  // ── drawPose() — 공식 샘플과 완전히 동일 ──────────────────
  const drawPose = (pose) => {
    const webcam = webcamRef.current
    const ctx    = ctxRef.current
    if (!webcam?.canvas || !ctx) return
    ctx.drawImage(webcam.canvas, 0, 0)
    if (pose) {
      const minPartConfidence = 0.5
      window.tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx)
      window.tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx)
    }
  }

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current)
    webcamRef.current?.stop()
    setCameraOn(false)
    setCurrentSign(null)
    setTopConf(0)
    setPredictions([])
    ctxRef.current?.clearRect(0, 0, 300, 300)
  }

  // ── AI 응답 처리 (방법 A / B 자동 선택) ───────────────────
  const handleAIResponse = async (input, inputType) => {
    setAiLoading(true)

    if (!USE_CLAUDE_API) {
      // ── 방법 A: 즉시 응답 (바로 작동) ──
      await new Promise(r => setTimeout(r, 600)) // 자연스러운 딜레이
      const preset = PRESET_RESPONSES[input]
      const response = preset
          || `📢 해석/번역: "${input}" 동작이 인식되었습니다.\n\n🤟 수어 표현: 해당 동작을 PRESET_RESPONSES에 추가해 맞춤 응답을 설정하세요.\n\n💬 소통 팁: 천천히 명확하게 표현하면 인식률이 높아집니다.`
      setAiResponse(response)
      addMessage('ai', response)
      setAiLoading(false)
      return
    }

    // ── 방법 B: 실제 Claude API (백엔드 프록시 필요) ──
    const system = `당신은 청각 장애인과 비장애인의 소통을 돕는 AI 수어 번역 시스템입니다.

입력 타입이 "sign"(수어)이면:
- 수어 동작의 의미를 자연스럽게 해석하고
- 비장애인이 수어로 어떻게 답할 수 있는지 안내하세요

입력 타입이 "voice"(말/텍스트)이면:
- 입력 내용을 수어로 어떻게 표현하는지 구체적인 손동작과 함께 설명하세요

응답 형식 (이모지 + 텍스트, 마크다운 헤더 금지):
📢 해석/번역: (1~2문장)
🤟 수어 표현: (손동작 설명)
💬 소통 팁: (짧은 조언)

한국어로 간결하고 친절하게 작성하세요.`

    try {
      const res  = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 600,
          system,
          messages: [{
            role:    'user',
            content: `입력 타입: ${inputType === 'sign' ? '수어 동작' : '음성/텍스트'}\n내용: "${input}"`,
          }],
        }),
      })
      const data   = await res.json()
      const aiText = data.content?.map(c => c.text || '').join('') || '응답 없음'
      setAiResponse(aiText)
      addMessage('ai', aiText)
    } catch (err) {
      const msg = `AI 연결 오류: ${err.message}\n\nPROXY_URL(${PROXY_URL})을 확인하세요.`
      setAiResponse(msg)
      addMessage('ai', msg)
    } finally {
      setAiLoading(false)
    }
  }

  // ── 음성 인식 ──────────────────────────────────────────────
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Chrome 브라우저를 사용해주세요.'); return }
    const rec = new SR()
    rec.lang           = 'ko-KR'
    rec.interimResults = true
    rec.continuous     = true
    recognitionRef.current = rec
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('')
      setVoiceText(t)
      if (e.results[e.results.length - 1].isFinal) {
        const final = e.results[e.results.length - 1][0].transcript.trim()
        if (final) { submitMessage(final); setVoiceText('') }
      }
    }
    rec.onend = () => setListening(false)
    rec.start()
    setListening(true)
  }

  const stopVoice = () => {
    recognitionRef.current?.stop()
    setListening(false)
    setVoiceText('')
  }

  const submitTextInput = () => {
    const v = textInput.trim()
    if (!v) return
    submitMessage(v)
    setTextInput('')
  }

  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitTextInput() }
  }

  const submitMessage = (text) => {
    addMessage('voice', text)
    handleAIResponse(text, 'voice')
  }

  const addMessage = (type, text) => {
    setMessages(prev => [...prev, {
      id:   Date.now() + Math.random(),
      type, text,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    }])
  }

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current)
    webcamRef.current?.stop()
    recognitionRef.current?.stop()
  }, [])

  const confColor = topConf >= CONFIDENCE_THRESHOLD
      ? '#10b981' : topConf >= 0.5 ? '#f59e0b' : '#ef4444'

  return (
      <div className="demo-page">

        <div className="warn-banner">
          ⚠️ 이 화면에서 나온 것들 다 record 되는 것으로 참조해 조심시오.
        </div>

        {MODEL_URL.includes('여기에URL입력') && (
            <div className="url-notice">
              <strong>📌 설정 필요:</strong> Demo.jsx 상단의 <code>MODEL_URL</code>에
              Teachable Machine 모델 URL을 붙여넣으세요.{' '}
              <a href="https://teachablemachine.withgoogle.com/train/pose" target="_blank" rel="noreferrer">
                모델 만들러 가기 →
              </a>
            </div>
        )}
        {modelError && <div className="error-banner">❌ {modelError}</div>}

        {/* ── 4개 패널 동일 사이즈 그리드 ── */}
        <div className="demo-grid">

          {/* 패널 1: 카메라 */}
          <div className="panel">
            <div className="panel-title">
              📷 Pose 인식 (Teachable Machine)
              {cameraOn    && <span className="badge-rec">● REC</span>}
              {modelLoaded && <span className="badge-model">✓ 모델 로드됨</span>}
            </div>
            <div className="panel-body">

              <div className="video-box">
                <canvas
                    ref={canvasRef}
                    id="canvas"
                    style={{ display: cameraOn ? 'block' : 'none' }}
                    className="cam-canvas"
                />
                {!cameraOn && (
                    <div className="video-empty">
                      <span style={{ fontSize: 40 }}>🤟</span>
                      <p>버튼을 눌러 카메라와<br />모델을 시작하세요</p>
                      <button className="btn-cam" onClick={init}>▶ Start</button>
                    </div>
                )}
                {cameraOn && currentSign && (
                    <div className="sign-overlay" key={currentSign}>🤟 {currentSign}</div>
                )}
                {cameraOn && (
                    <button className="btn-stop" onClick={stopCamera}>⏹ 중지</button>
                )}
              </div>

              {/* 신뢰도 바 */}
              <div className="confidence-bar" style={{ opacity: cameraOn ? 1 : 0.3 }}>
                <span className="conf-label">신뢰도</span>
                <div className="conf-track">
                  <div className="conf-fill" style={{
                    width: `${(topConf * 100).toFixed(0)}%`,
                    background: confColor,
                    transition: 'width 0.15s ease, background 0.3s',
                  }} />
                </div>
                <span className="conf-value" style={{ color: confColor }}>
                {(topConf * 100).toFixed(0)}%
              </span>
              </div>

              {/* label-container */}
              <div className="label-container" id="label-container">
                {predictions.length > 0
                    ? predictions.map((p, i) => (
                        <div key={i} className={`label-item ${p.probability >= CONFIDENCE_THRESHOLD ? 'label-active' : ''}`}>
                          <span className="label-name">{CLASS_LABELS[p.className] || p.className}</span>
                          <div className="label-bar-track">
                            <div className="label-bar-fill" style={{
                              width: `${(p.probability * 100).toFixed(0)}%`,
                              background: p.probability >= CONFIDENCE_THRESHOLD ? '#10b981' : '#d0d0e8',
                            }} />
                          </div>
                          <span className="label-prob">{p.probability.toFixed(2)}</span>
                        </div>
                    ))
                    : Object.values(CLASS_LABELS).map((label, i) => (
                        <div key={i} className="label-item">
                          <span className="label-name">{label}</span>
                          <div className="label-bar-track">
                            <div className="label-bar-fill" style={{ width: '0%', background: '#d0d0e8' }} />
                          </div>
                          <span className="label-prob">0.00</span>
                        </div>
                    ))
                }
              </div>

            </div>
          </div>

          {/* 패널 2: 음성 / 텍스트 입력 */}
          <div className="panel">
            <div className="panel-title">
              {inputMode === 'voice' ? '🎙️ 음성 입력' : '⌨️ 텍스트 입력'}
              {listening && <span className="badge-live">● LIVE</span>}
              <div className="input-tabs">
                <button className={`tab-btn ${inputMode === 'voice' ? 'tab-active' : ''}`} onClick={() => setInputMode('voice')}>🎙️ 음성</button>
                <button className={`tab-btn ${inputMode === 'text'  ? 'tab-active' : ''}`} onClick={() => setInputMode('text')}>⌨️ 텍스트</button>
              </div>
            </div>
            <div className="panel-body panel-body-center">

              {inputMode === 'voice' && (
                  <div className="voice-box">
                    <button className={`mic-btn ${listening ? 'mic-on' : ''}`} onClick={listening ? stopVoice : startVoice}>
                      <span className="mic-emoji">🎙️</span>
                      {listening && <div className="mic-rings"><div className="ring r1"/><div className="ring r2"/></div>}
                    </button>
                    <p className="mic-hint">{listening ? voiceText || '듣고 있어요...' : '버튼을 눌러 말하세요'}</p>
                    <p className="mic-desc">말하면 AI가 수어로 전달해요</p>
                  </div>
              )}

              {inputMode === 'text' && (
                  <div className="text-input-box">
                    <p className="text-input-hint">메시지를 입력하면 AI가 수어로 전달해요</p>
                    <div className="text-input-row">
                  <textarea
                      ref={textareaRef}
                      className="text-input-area"
                      placeholder="여기에 입력하세요... (Enter로 전송)"
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      onKeyDown={handleTextKeyDown}
                      rows={4}
                  />
                      <button
                          className={`text-send-btn ${textInput.trim() ? 'text-send-active' : ''}`}
                          onClick={submitTextInput}
                          disabled={!textInput.trim()}
                      >전송<br/>↑</button>
                    </div>
                    <p className="text-input-sub">Shift+Enter 줄바꿈 / Enter 전송</p>
                  </div>
              )}

            </div>
          </div>

          {/* 패널 3: 대화 기록 */}
          <div className="panel">
            <div className="panel-title">💬 대화 기록</div>
            <div className="panel-body">
              <div className="chat-box">
                {messages.length === 0 ? (
                    <div className="chat-empty">
                      <span style={{ fontSize: 36 }}>💬</span>
                      <p>Start를 누르고 수어 동작을 하거나<br/>말/타이핑하면 대화가 시작됩니다</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} className={`msg msg-${msg.type}`}>
                          <div className="msg-avatar">
                            {msg.type === 'sign' ? '🧏' : msg.type === 'voice' ? '🙋' : '🤖'}
                          </div>
                          <div className="msg-content">
                            <div className="msg-name">
                              {msg.type === 'sign' ? '장애인 (수어)' : msg.type === 'voice' ? '나 (음성/텍스트)' : 'AI 번역'}
                            </div>
                            <div className="msg-text" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                            <div className="msg-time">{msg.time}</div>
                          </div>
                        </div>
                    ))
                )}
                {aiLoading && (
                    <div className="msg msg-ai">
                      <div className="msg-avatar">🤖</div>
                      <div className="msg-content">
                        <div className="msg-name">AI 번역</div>
                        <div className="typing-dots"><span/><span/><span/></div>
                      </div>
                    </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          </div>

          {/* 패널 4: AI 수어 번역 응답 */}
          <div className="panel">
            <div className="panel-title">
              🤖 AI 수어 번역 응답
              {aiLoading && <span className="badge-live">● 번역 중...</span>}
              <span className="api-mode-badge">
              {USE_CLAUDE_API ? '🟢 Claude API' : '⚡ 즉시 응답'}
            </span>
            </div>
            <div className="panel-body">
              <div className="ai-response-box">
                {aiResponse ? (
                    <div className="ai-response-text">{aiResponse}</div>
                ) : (
                    <div className="ai-placeholder">
                      <span style={{ fontSize: 40 }}>🤖</span>
                      <p>수어 인식 또는 입력이 감지되면<br/>AI가 여기에 번역을 표시합니다</p>
                      <div className="ai-mode-info">
                        {USE_CLAUDE_API
                            ? `현재: 실제 Claude API 모드\n프록시 서버: ${PROXY_URL}`
                            : '현재: 즉시 응답 모드 (서버 불필요)\nClaude API 사용 시 USE_CLAUDE_API = true'}
                      </div>
                    </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
  )
}