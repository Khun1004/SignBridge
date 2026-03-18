import { useEffect, useRef, useState } from 'react'
import './TranslatePage.css'

// ── 수어 인식 샘플 (Teachable Machine 연결 전 시뮬레이션) ──
const SIGN_LABELS = [
  '안녕하세요 👋',
  '감사합니다 🙏',
  '도움이 필요해요 🤲',
  '화장실이 어디예요? 🚻',
  '괜찮아요 😊',
  '잠깐만요 ✋',
]

// ── AI가 수어로 다시 알려줄 때 표시할 동작 ──
const AI_SIGNS = {
  '안녕하세요 👋':       { sign: '👋', desc: '손을 흔들어요' },
  '감사합니다 🙏':       { sign: '🙏', desc: '두 손을 모아요' },
  '도움이 필요해요 🤲':  { sign: '🤲', desc: '두 손을 펼쳐요' },
  '화장실이 어디예요? 🚻':{ sign: '🚻', desc: '손으로 방향을 가리켜요' },
  '괜찮아요 😊':         { sign: '👍', desc: '엄지를 올려요' },
  '잠깐만요 ✋':         { sign: '✋', desc: '손바닥을 펼쳐요' },
}

export default function TranslatePage() {
  // ── 상태 ──
  const [cameraOn, setCameraOn]         = useState(false)
  const [listening, setListening]       = useState(false)
  const [messages, setMessages]         = useState([])
  const [currentSign, setCurrentSign]   = useState(null)
  const [aiResponse, setAiResponse]     = useState(null)
  const [voiceText, setVoiceText]       = useState('')
  const [aiTalking, setAiTalking]       = useState(false)

  // ── 텍스트 입력 모드 ──
  const [inputMode, setInputMode]       = useState('voice')   // 'voice' | 'text'
  const [textInput, setTextInput]       = useState('')

  // ── refs ──
  const videoRef       = useRef(null)
  const streamRef      = useRef(null)
  const signTimerRef   = useRef(null)
  const chatEndRef     = useRef(null)
  const recognitionRef = useRef(null)
  const textareaRef    = useRef(null)

  // ── 채팅 맨 아래로 자동 스크롤 ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── 탭 전환 시 음성 중지 ──
  useEffect(() => {
    if (inputMode === 'text' && listening) {
      stopVoice()
    }
    if (inputMode === 'text') {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [inputMode])

  // ── 1. 카메라 시작 ──
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraOn(true)

      let i = 0
      signTimerRef.current = setInterval(() => {
        const label = SIGN_LABELS[i % SIGN_LABELS.length]
        setCurrentSign(label)
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'sign',
          text: label,
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        }])
        i++
      }, 3000)
    } catch {
      alert('카메라 권한이 필요합니다.')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    clearInterval(signTimerRef.current)
    setCameraOn(false)
    setCurrentSign(null)
  }

  // ── 2. 음성 인식 시작 ──
  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('이 브라우저는 음성 인식을 지원하지 않아요. Chrome을 사용해주세요.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'ko-KR'
    recognition.interimResults = true
    recognition.continuous = true
    recognitionRef.current = recognition

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('')
      setVoiceText(transcript)

      if (e.results[e.results.length - 1].isFinal) {
        const finalText = e.results[e.results.length - 1][0].transcript
        submitMessage(finalText)
        setVoiceText('')
      }
    }

    recognition.onend = () => setListening(false)
    recognition.start()
    setListening(true)
  }

  const stopVoice = () => {
    recognitionRef.current?.stop()
    setListening(false)
    setVoiceText('')
  }

  // ── 3. 텍스트 전송 ──
  const submitTextInput = () => {
    const trimmed = textInput.trim()
    if (!trimmed) return
    submitMessage(trimmed)
    setTextInput('')
  }

  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitTextInput()
    }
  }

  // ── 4. 공통 메시지 처리 ──
  const submitMessage = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'voice',
      text,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }])
    triggerAIResponse(text)
  }

  // ── 5. AI 수어 응답 ──
  const triggerAIResponse = (text) => {
    const matched = Object.entries(AI_SIGNS).find(([key]) =>
      text.includes(key.replace(/[👋🙏🤲🚻😊✋]/gu, '').trim())
    )
    const response = matched
      ? matched[1]
      : { sign: '🤟', desc: '수어로 전달 중...' }

    setAiTalking(true)
    setAiResponse(response)

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        text: `${response.sign} ${response.desc}`,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      }])
      setAiTalking(false)
    }, 1200)
  }

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    clearInterval(signTimerRef.current)
    recognitionRef.current?.stop()
  }, [])

  return (
    <div className="demo-page">

      {/* 경고 배너 */}
      <div className="warn-banner">
        ⚠️ 이 화면에서 나온 것들 다 record 되는 것으로 참조해 조심시오.
      </div>

      <div className="demo-grid">

        {/* ── 왼쪽 컬럼 ── */}
        <div className="left-col">

          {/* 영상 */}
          <div className="panel">
            <div className="panel-title">
              📷 영상
              {cameraOn && <span className="badge-rec">● REC</span>}
            </div>
            <div className="video-box">
              <video
                ref={videoRef}
                autoPlay muted playsInline
                className="cam-video"
                style={{ display: cameraOn ? 'block' : 'none' }}
              />
              {!cameraOn && (
                <div className="video-empty">
                  <span style={{ fontSize: 44 }}>📷</span>
                  <p>카메라를 켜고<br />손을 움직여 보세요</p>
                  <button className="btn-cam" onClick={startCamera}>▶ 카메라 시작</button>
                </div>
              )}
              {cameraOn && currentSign && (
                <div className="sign-overlay" key={currentSign}>
                  🤟 {currentSign}
                </div>
              )}
              {cameraOn && (
                <button className="btn-stop" onClick={stopCamera}>⏹ 중지</button>
              )}
            </div>
          </div>

          {/* 음성 / 텍스트 입력 패널 */}
          <div className="panel">
            <div className="panel-title">
              {inputMode === 'voice' ? '🎙️ 음성' : '⌨️ 텍스트'}
              {listening && <span className="badge-live">● LIVE</span>}

              {/* 모드 전환 탭 */}
              <div className="input-tabs">
                <button
                  className={`tab-btn ${inputMode === 'voice' ? 'tab-active' : ''}`}
                  onClick={() => setInputMode('voice')}
                >
                  🎙️ 음성
                </button>
                <button
                  className={`tab-btn ${inputMode === 'text' ? 'tab-active' : ''}`}
                  onClick={() => setInputMode('text')}
                >
                  ⌨️ 텍스트
                </button>
              </div>
            </div>

            {/* ── 음성 모드 ── */}
            {inputMode === 'voice' && (
              <div className="voice-box">
                <button
                  className={`mic-btn ${listening ? 'mic-on' : ''}`}
                  onClick={listening ? stopVoice : startVoice}
                >
                  <span className="mic-emoji">🎙️</span>
                  {listening && (
                    <div className="mic-rings">
                      <div className="ring r1" /><div className="ring r2" />
                    </div>
                  )}
                </button>
                <p className="mic-hint">
                  {listening
                    ? voiceText || '듣고 있어요...'
                    : '버튼을 눌러 말하세요'}
                </p>
                {!listening && (
                  <p className="mic-desc">말하면 AI가 수어로 장애인에게 전달해요</p>
                )}
              </div>
            )}

            {/* ── 텍스트 모드 ── */}
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
                    rows={3}
                  />
                  <button
                    className={`text-send-btn ${textInput.trim() ? 'text-send-active' : ''}`}
                    onClick={submitTextInput}
                    disabled={!textInput.trim()}
                  >
                    전송<br />↑
                  </button>
                </div>
                <p className="text-input-sub">Shift+Enter로 줄바꿈 / Enter로 전송</p>
              </div>
            )}
          </div>

        </div>

        {/* ── 오른쪽 컬럼 ── */}
        <div className="right-col">

          {/* 대화창 */}
          <div className="panel chat-panel">
            <div className="panel-title">💬 대화</div>
            <div className="chat-box">
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <span style={{ fontSize: 40 }}>💬</span>
                  <p>카메라를 켜고 손을 움직이면<br />대화가 시작됩니다</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`msg msg-${msg.type}`}>
                    <div className="msg-avatar">
                      {msg.type === 'sign' ? '🧏' : msg.type === 'voice' ? '🙋' : '🤖'}
                    </div>
                    <div className="msg-content">
                      <div className="msg-name">
                        {msg.type === 'sign' ? '장애인 (수어)' : msg.type === 'voice' ? '나 (음성/텍스트)' : 'AI'}
                      </div>
                      <div className="msg-text">{msg.text}</div>
                      <div className="msg-time">{msg.time}</div>
                    </div>
                  </div>
                ))
              )}
              {aiTalking && (
                <div className="msg msg-ai">
                  <div className="msg-avatar">🤖</div>
                  <div className="msg-content">
                    <div className="msg-name">AI</div>
                    <div className="typing-dots"><span /><span /><span /></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* AI 영상 */}
          <div className="panel">
            <div className="panel-title">🤖 AI 영상 (수어 안내)</div>
            <div className="ai-box">
              <div className={`ai-figure ${aiTalking ? 'ai-talk' : ''}`}>
                <div className="ai-face">🧑‍💼</div>
                {aiResponse && (
                  <div className="ai-sign-display" key={aiResponse.sign}>
                    <div className="ai-sign-emoji">{aiResponse.sign}</div>
                    <div className="ai-sign-desc">{aiResponse.desc}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}