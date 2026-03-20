import { useEffect, useRef, useState } from 'react'
import './TranslatePage.css'

const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/6n8gMoIoU/'

const CLASS_LABELS = {
  '안녕하세요': '안녕하세요 👋',
  '감사합니다': '감사합니다 🙏',
  '도와주세요': '도와주세요 🤲',
  '화장실':     '화장실 어디예요? 🚻',
  '괜찮아요':   '괜찮아요 😊',
  '잠깐만요':   '잠깐만요 ✋',
}

const SIGN_MEANINGS = {
  '안녕하세요 👋': '상대방이 인사를 건네고 있습니다.\n\n오른손을 펼쳐 이마 옆에 가져다 댄 뒤 앞쪽 아래로 내리는 동작입니다.',
  '감사합니다 🙏': '상대방이 감사함을 표현하고 있습니다.\n\n두 손을 모아 가슴 앞에서 합장하듯 모은 뒤 앞쪽으로 살짝 내미는 동작입니다.',
  '도와주세요 🤲': '상대방이 도움을 요청하고 있습니다.\n\n두 손바닥을 위로 펼쳐 앞으로 내밀며 눈썹을 올리고 도움을 구하는 표정입니다.',
  '화장실 어디예요? 🚻': '상대방이 화장실 위치를 묻고 있습니다.\n\n오른손 검지로 "ㅎ" 자 모양을 만들며 흔들고, 이어서 방향을 가리키는 동작입니다.',
  '괜찮아요 😊': '상대방이 괜찮다고 말하고 있습니다.\n\n오른손 엄지를 세워 위로 올리는 동작(엄지 척)입니다.',
  '잠깐만요 ✋': '잠시 기다려달라고 요청하고 있습니다.\n\n오른손 손바닥을 상대방 쪽으로 향하게 펼쳐 들고 유지하는 동작입니다.',
}

const CONFIDENCE_THRESHOLD = 0.85
const SIGN_COOLDOWN_MS      = 3000

export default function TranslatePage({ onEndConversation }) {
  const [modelLoaded,  setModelLoaded]  = useState(false)
  const [modelError,   setModelError]   = useState(null)
  const [cameraOn,     setCameraOn]     = useState(false)
  const [listening,    setListening]    = useState(false)
  const [messages,     setMessages]     = useState([])
  const [predictions,  setPredictions]  = useState([])
  const [topConf,      setTopConf]      = useState(0)
  const [inputMode,    setInputMode]    = useState('voice')
  const [textInput,    setTextInput]    = useState('')
  const [voiceText,    setVoiceText]    = useState('')
  const [pendingSign,  setPendingSign]  = useState(null)
  const [signMeaning,  setSignMeaning]  = useState(null)
  const [pendingVoice, setPendingVoice] = useState(null)
  const [aiSignGuide,  setAiSignGuide]  = useState(null)
  const [aiLoading,    setAiLoading]    = useState(false)
  // 카메라가 켜있는 상태에서 대화 종료 시도 시 경고 표시
  const [showStopWarning, setShowStopWarning] = useState(false)

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
  const isRunningRef    = useRef(false)
  const messagesRef     = useRef([])   // messages state를 동기적으로 추적

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (inputMode === 'text' && listening) stopVoice()
    if (inputMode === 'text') setTimeout(() => textareaRef.current?.focus(), 100)
  }, [inputMode])

  // ── 스크립트 로드 ──
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

  // ── 카메라 시작 ──
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

      const canvas   = canvasRef.current
      canvas.width   = size
      canvas.height  = size
      ctxRef.current = canvas.getContext('2d')

      setCameraOn(true)
      setShowStopWarning(false)
      isRunningRef.current = true
      rafRef.current = window.requestAnimationFrame(loop)
    } catch (err) {
      setModelError(err.message || '모델 로드 실패.')
    }
  }

  const loop = async () => {
    if (!isRunningRef.current) return
    webcamRef.current?.update()
    await predict()
    rafRef.current = window.requestAnimationFrame(loop)
  }

  const predict = async () => {
    const model  = modelRef.current
    const webcam = webcamRef.current
    if (!model || !webcam) return

    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas)
    const prediction = await model.predict(posenetOutput)

    // 비동기 완료 후 이미 종료됐으면 state 업데이트 안 함
    if (!isRunningRef.current) return

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
        setPendingSign(label)
        setSignMeaning(SIGN_MEANINGS[label] || `"${label}" 동작이 인식되었습니다.`)
      }
    }

    drawPose(pose)
  }

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

  // ── 카메라 중지 ──
  const stopCamera = () => {
    isRunningRef.current = false
    cancelAnimationFrame(rafRef.current)
    try { webcamRef.current?.stop() } catch (_) {}
    setCameraOn(false)
    setTopConf(0)
    setPredictions([])
    setShowStopWarning(false)
    ctxRef.current?.clearRect(0, 0, 300, 300)
  }

  // ── 수어 전송 ──
  const sendSign = () => {
    if (!pendingSign) return
    addMessage('sign', pendingSign)
    setPendingSign(null)
    setSignMeaning(null)
    lastSignRef.current = null
    // 전송 후 카메라가 꺼져 있으면 다시 시작
    if (!isRunningRef.current) init()
  }

  // ── 재촬영 ──
  const retakeSign = () => {
    setPendingSign(null)
    setSignMeaning(null)
    init()
  }

  // ── AI 수어 안내 ──
  const getAiSignGuide = async (text) => {
    setAiLoading(true)
    await new Promise(r => setTimeout(r, 700))
    if (!isRunningRef.current && messagesRef.current.length > 0) {
      setAiLoading(false)
      return
    }
    const guide = `🤟 수어로 전달하기\n\n입력하신 내용: "${text}"\n\n📌 표현 방법\n천천히 입 모양을 크게 만들며 상대방의 눈을 바라보세요. 수어 동작이 어렵다면 손으로 글씨를 쓰거나 이 화면을 보여주는 것도 좋습니다.\n\n💡 소통 팁\n표정과 눈빛으로도 많은 것을 전달할 수 있습니다. 밝은 표정으로 천천히 대화하세요.`
    setAiSignGuide(guide)
    setAiLoading(false)
  }

  // ── 음성 인식 ──
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
        if (final) {
          setPendingVoice(final)
          setVoiceText('')
          stopVoice()
        }
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

  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const v = textInput.trim()
      if (v) { setPendingVoice(v); setTextInput('') }
    }
  }

  const submitTextInput = () => {
    const v = textInput.trim()
    if (!v) return
    setPendingVoice(v)
    setTextInput('')
  }

  const sendVoice = () => {
    if (!pendingVoice) return
    addMessage('voice', pendingVoice)
    getAiSignGuide(pendingVoice)
    setPendingVoice(null)
  }

  const retakeVoice = () => setPendingVoice(null)

  // ── 메시지 추가 (messagesRef 동기화) ──
  const addMessage = (type, text) => {
    const newMsg = {
      id:   Date.now() + Math.random(),
      type, text,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => {
      const next = [...prev, newMsg]
      messagesRef.current = next
      return next
    })
  }

  // ── 대화 종료 ──
  // 카메라가 켜 있으면 경고 표시, 꺼져 있으면 바로 전환
  const handleEndConversation = () => {
    if (cameraOn) {
      setShowStopWarning(true)
      return
    }
    try { recognitionRef.current?.stop() } catch (_) {}
    if (onEndConversation) onEndConversation(messagesRef.current)
  }

  // 언마운트 시 정리
  useEffect(() => () => {
    isRunningRef.current = false
    cancelAnimationFrame(rafRef.current)
    try { webcamRef.current?.stop() } catch (_) {}
    try { recognitionRef.current?.stop() } catch (_) {}
  }, [])

  const confColor = topConf >= CONFIDENCE_THRESHOLD
      ? '#10b981' : topConf >= 0.5 ? '#f59e0b' : '#ef4444'

  return (
      <div className="trans-page">

        <div className="warn-banner">
          ⚠️ 이 화면에서 나온 것들 다 record 되는 것으로 참조해 조심시오.
        </div>
        {modelError && <div className="error-banner">❌ {modelError}</div>}

        {/* 카메라가 켜있을 때 대화 종료 시도하면 경고 */}
        {showStopWarning && (
            <div className="stop-warning-banner">
              ⚠️ 카메라가 켜져 있습니다. 먼저 수어 인식 패널에서 <strong>⏹ Stop</strong> 버튼을 눌러 카메라를 꺼주세요.
              <button className="stop-warning-close" onClick={() => setShowStopWarning(false)}>✕</button>
            </div>
        )}

        {/* 대화 종료 버튼 */}
        <div className="end-conv-row">
          <span className="end-conv-hint">대화가 끝나면 Stop 후 아래 버튼을 눌러 기록을 확인하세요</span>
          <button
              className="btn-end-conversation"
              onClick={handleEndConversation}
          >
            대화 종료하기 →
          </button>
        </div>

        <div className="demo-grid">

          {/* ── 패널 1: 수어 인식 ── */}
          <div className="panel">
            <div className="panel-title">
              📷 수어 인식 (장애인)
              {cameraOn    && <span className="badge-rec">● REC</span>}
              {modelLoaded && <span className="badge-model">✓ 모델 로드됨</span>}
            </div>
            <div className="panel-body">

              {/* Start / Stop 버튼: pendingSign 여부와 무관하게 항상 표시 */}
              <div className="cam-btn-row">
                <button className="btn-cam"  onClick={init}       disabled={cameraOn}>▶ Start</button>
                <button className="btn-stop" onClick={stopCamera} disabled={!cameraOn}>⏹ Stop</button>
              </div>

              {!pendingSign ? (
                  <>
                    <div className="video-box">
                      <canvas
                          ref={canvasRef}
                          style={{ display: cameraOn ? 'block' : 'none' }}
                          className="cam-canvas"
                      />
                      {!cameraOn && (
                          <div className="video-empty">
                            <span style={{ fontSize: 40 }}>🤟</span>
                            <p>▶ Start를 눌러<br />카메라를 시작하세요</p>
                          </div>
                      )}
                    </div>

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

                    <div className="label-container">
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
                  </>
              ) : (
                  /* 수어 미리보기 */
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

          {/* ── 패널 2: 음성 / 텍스트 입력 ── */}
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
                      <textarea
                          ref={textareaRef}
                          className="text-input-area"
                          placeholder="여기에 입력하세요... (Enter로 미리보기)"
                          value={textInput}
                          onChange={e => setTextInput(e.target.value)}
                          onKeyDown={handleTextKeyDown}
                          rows={4}
                      />
                            <button
                                className={`text-send-btn ${textInput.trim() ? 'text-send-active' : ''}`}
                                onClick={submitTextInput}
                                disabled={!textInput.trim()}
                            >미리<br/>보기<br/>↑</button>
                          </div>
                          <p className="text-input-sub">Shift+Enter 줄바꿈 / Enter 미리보기</p>
                        </div>
                    )}
                  </>
              ) : (
                  /* 음성/텍스트 미리보기 */
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

          {/* ── 패널 3: 대화 기록 ── */}
          <div className="panel">
            <div className="panel-title">💬 대화 기록</div>
            <div className="panel-body">
              <div className="chat-box">
                {messages.length === 0 ? (
                    <div className="chat-empty">
                      <span style={{ fontSize: 36 }}>💬</span>
                      <p>수어 동작 후 전송하거나<br/>말/타이핑 후 전송하면<br/>대화가 시작됩니다</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} className={`msg msg-${msg.type}`}>
                          <div className="msg-avatar">
                            {msg.type === 'sign' ? '🧏' : '🙋'}
                          </div>
                          <div className="msg-content">
                            <div className="msg-name">
                              {msg.type === 'sign' ? '장애인 (수어)' : '나 (음성/텍스트)'}
                            </div>
                            <div className="msg-text" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                            <div className="msg-time">{msg.time}</div>
                          </div>
                        </div>
                    ))
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          </div>

          {/* ── 패널 4: AI 수어 안내 ── */}
          <div className="panel">
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
                    <div className="ai-response-text">{aiSignGuide}</div>
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

        </div>
      </div>
  )
}