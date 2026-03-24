import { useState, useEffect, useRef, useCallback } from 'react'
import './DemoPage.css'

/* ─────────────────────────────────────────
   수어 인식 매핑 (MediaPipe Hands 기반 손 제스처)
───────────────────────────────────────── */
const SIGN_MAP = [
    { id: 'hello',   label: '안녕하세요',    emoji: '🤟', desc: 'ILY sign',         handShape: '☝️✌️',  meaning: '반가움 인사' },
    { id: 'thanks',  label: '감사합니다',    emoji: '🙏', desc: 'Both palms up',    handShape: '🙏',    meaning: '고마움 표현' },
    { id: 'yes',     label: '네, 맞아요',   emoji: '👍', desc: 'Thumb up',         handShape: '👍',    meaning: '긍정 동의'  },
    { id: 'wait',    label: '잠깐만요',     emoji: '✋', desc: 'Open palm stop',   handShape: '✋',    meaning: '멈춤 요청'  },
    { id: 'help',    label: '도움이 필요해요', emoji: '🤲', desc: 'Cupped hands',   handShape: '🤲',    meaning: '도움 요청'  },
    { id: 'ok',      label: '이해했습니다',  emoji: '👌', desc: 'OK gesture',       handShape: '👌',    meaning: '이해 완료'  },
    { id: 'nice',    label: '괜찮습니다',   emoji: '🖐', desc: 'Five fingers',     handShape: '🖐️',   meaning: '긍정 표현'  },
    { id: 'meet',    label: '반갑습니다',   emoji: '👋', desc: 'Wave',             handShape: '👋',    meaning: '처음 인사'  },
]

/* ─────────────────────────────────────────
   21개 손 랜드마크 연결 (MediaPipe 표준)
───────────────────────────────────────── */
const HAND_CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [5,9],[9,10],[10,11],[11,12],
    [9,13],[13,14],[14,15],[15,16],
    [13,17],[17,18],[18,19],[19,20],
    [0,17],
]

/* 손 랜드마크 SVG 오버레이 */
function HandOverlay({ landmarks, width, height }) {
    if (!landmarks || landmarks.length === 0) return null
    const pts = landmarks.map(lm => ({
        x: lm.x * width,
        y: lm.y * height,
    }))
    return (
        <svg
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}
            width={width} height={height}
        >
            {HAND_CONNECTIONS.map(([a, b], i) => (
                <line
                    key={i}
                    x1={pts[a]?.x} y1={pts[a]?.y}
                    x2={pts[b]?.x} y2={pts[b]?.y}
                    stroke="rgba(99,220,180,0.85)" strokeWidth="2.5"
                    strokeLinecap="round"
                />
            ))}
            {pts.map((p, i) => (
                <circle
                    key={i}
                    cx={p.x} cy={p.y} r={i === 0 ? 6 : i % 4 === 0 ? 5 : 3.5}
                    fill={i % 4 === 0 ? '#63dcb4' : '#fff'}
                    stroke="#63dcb4" strokeWidth="1.5"
                />
            ))}
        </svg>
    )
}

/* 음파 바 */
function WaveBar({ active, color }) {
    return (
        <div className={`sb-wave ${active ? 'sb-wave--active' : ''}`} data-color={color}>
            {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="sb-wave__bar" style={{ '--i': i }} />
            ))}
        </div>
    )
}

/* ── 수어 뜻 카드 (수신된 음성 패널용) ── */
function SignMeaningCard({ sign }) {
    if (!sign) return null
    return (
        <div className="sb-sign-meaning-card">
            <div className="sb-sign-meaning-card__hand">{sign.emoji}</div>
            <div className="sb-sign-meaning-card__info">
                <div className="sb-sign-meaning-card__label">{sign.label}</div>
                <div className="sb-sign-meaning-card__meaning">{sign.meaning}</div>
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────
   메인 컴포넌트
───────────────────────────────────────── */
export default function DemoPage({ onBack }) {
    const [messages, setMessages] = useState([
        { id: 0, from: 'system', text: '소통 세션이 시작되었습니다.' },
    ])

    /* 음성 측 */
    const [voiceText, setVoiceText]       = useState('')
    const [isListening, setIsListening]   = useState(false)
    const [voiceSending, setVoiceSending] = useState(false)
    const recognitionRef = useRef(null)

    /* 수어 측 */
    const [cameraOn, setCameraOn]           = useState(false)
    const [handLandmarks, setHandLandmarks] = useState(null)
    const [detectedSign, setDetectedSign]   = useState(null)
    const [isDetecting, setIsDetecting]     = useState(false)
    const [selectedSign, setSelectedSign]   = useState(SIGN_MAP[0])
    const [videoSize, setVideoSize]         = useState({ w: 320, h: 240 })
    /* 감지 결과 표시 강조 (새로 감지될 때 애니메이션) */
    const [signFlash, setSignFlash]         = useState(false)

    /* TTS 수신 표시 */
    const [isSpeaking, setIsSpeaking]       = useState(false)
    const [lastVoiceMsg, setLastVoiceMsg]   = useState(null)
    /* 수신된 수어 메시지 목록 (손 표시 포함) */
    const [lastSignReceived, setLastSignReceived] = useState(null)

    const videoRef   = useRef(null)
    const canvasRef  = useRef(null)
    const mpRef      = useRef(null)
    const streamRef  = useRef(null)
    const animRef    = useRef(null)
    const msgEndRef  = useRef(null)

    useEffect(() => {
        msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    /* ── MediaPipe Hands 초기화 ── */
    const initMediaPipe = useCallback(async () => {
        if (mpRef.current) return
        try {
            const { Hands } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js')
            const hands = new Hands({
                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`,
            })
            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.6,
            })
            hands.onResults((results) => {
                if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                    const lm = results.multiHandLandmarks[0]
                    setHandLandmarks(lm)
                    const sign = classifyHand(lm)
                    if (sign) {
                        setDetectedSign(prev => {
                            if (!prev || prev.id !== sign.id) {
                                // 새 제스처 감지 → 플래시 효과
                                setSignFlash(true)
                                setTimeout(() => setSignFlash(false), 600)
                            }
                            return sign
                        })
                    }
                } else {
                    setHandLandmarks(null)
                    setDetectedSign(null)
                }
            })
            await hands.initialize()
            mpRef.current = hands
        } catch (e) {
            console.error('MediaPipe 로드 실패:', e)
        }
    }, [])

    /* ── 손 제스처 분류 ── */
    const classifyHand = (lm) => {
        const fingerTips = [8, 12, 16, 20]
        const fingerBase = [5,  9, 13, 17]
        const extended = fingerTips.map((tip, i) => lm[tip].y < lm[fingerBase[i]].y)
        const thumbOut = lm[4].x > lm[3].x
        const count = extended.filter(Boolean).length

        if (count === 0 && thumbOut) return SIGN_MAP.find(s => s.id === 'yes')
        if (count === 4 && !thumbOut) return SIGN_MAP.find(s => s.id === 'wait')
        if (count === 4 && thumbOut) return SIGN_MAP.find(s => s.id === 'nice')
        if (count === 0 && !thumbOut) return SIGN_MAP.find(s => s.id === 'ok')
        if (extended[0] && !extended[1] && !extended[2] && extended[3] && thumbOut)
            return SIGN_MAP.find(s => s.id === 'hello')
        if (count === 2) return SIGN_MAP.find(s => s.id === 'meet')
        if (count === 3) return SIGN_MAP.find(s => s.id === 'help')
        return null
    }

    /* ── 카메라 시작 ── */
    const startCamera = useCallback(async () => {
        setCameraOn(true)
        setDetectedSign(null)
        setHandLandmarks(null)
        await initMediaPipe()
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play()
                    const w = videoRef.current.videoWidth || 640
                    const h = videoRef.current.videoHeight || 480
                    setVideoSize({ w, h })
                    runDetection()
                }
            }
        } catch (e) {
            console.error('카메라 접근 실패:', e)
            setCameraOn(false)
        }
    }, [initMediaPipe])

    const runDetection = useCallback(() => {
        const loop = async () => {
            if (videoRef.current && mpRef.current && videoRef.current.readyState >= 2) {
                await mpRef.current.send({ image: videoRef.current })
            }
            animRef.current = requestAnimationFrame(loop)
        }
        loop()
    }, [])

    /* ── 카메라 종료 ── */
    const stopCamera = useCallback(() => {
        setCameraOn(false)
        setHandLandmarks(null)
        setDetectedSign(null)
        if (animRef.current) cancelAnimationFrame(animRef.current)
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
    }, [])

    /* ── 음성 인식 ── */
    const startListening = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) { alert('이 브라우저는 음성 인식을 지원하지 않습니다.'); return }
        const rec = new SpeechRecognition()
        rec.lang = 'ko-KR'
        rec.continuous = false
        rec.interimResults = true
        rec.onstart = () => setIsListening(true)
        rec.onresult = (e) => {
            const transcript = Array.from(e.results).map(r => r[0].transcript).join('')
            setVoiceText(transcript)
        }
        rec.onend = () => setIsListening(false)
        rec.onerror = () => setIsListening(false)
        rec.start()
        recognitionRef.current = rec
    }, [])

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop()
        setIsListening(false)
    }, [])

    /* ── 음성 메시지 전송 ── */
    const sendVoiceMsg = useCallback(() => {
        if (!voiceText.trim()) return
        const msg = { id: Date.now(), from: 'voice', text: voiceText.trim(), type: 'voice' }
        setMessages(m => [...m, msg])
        setLastVoiceMsg(msg)
        setVoiceText('')
    }, [voiceText])

    /* ── 수어 메시지 전송 ── */
    const sendSignMsg = useCallback(() => {
        const sign = detectedSign || selectedSign
        if (!sign) return
        setIsDetecting(true)
        setTimeout(() => {
            const msg = { id: Date.now(), from: 'sign', text: sign.label, emoji: sign.emoji, sign, type: 'sign' }
            setMessages(m => [...m, msg])
            setLastSignReceived(sign)
            setIsDetecting(false)
            speakText(sign.label)
        }, 500)
    }, [detectedSign, selectedSign])

    /* ── TTS ── */
    const speakText = (text) => {
        if (!('speechSynthesis' in window)) return
        window.speechSynthesis.cancel()
        const utt = new SpeechSynthesisUtterance(text)
        utt.lang = 'ko-KR'
        utt.rate = 0.95
        utt.pitch = 1.05
        utt.onstart = () => setIsSpeaking(true)
        utt.onend   = () => setIsSpeaking(false)
        window.speechSynthesis.speak(utt)
    }

    /* voice 메시지 업데이트 */
    useEffect(() => {
        const voiceMsgs = messages.filter(m => m.from === 'voice')
        if (voiceMsgs.length > 0) setLastVoiceMsg(voiceMsgs[voiceMsgs.length - 1])
    }, [messages])

    /* sign 메시지 TTS */
    useEffect(() => {
        const signMsgs = messages.filter(m => m.from === 'sign')
        if (signMsgs.length > 0) {
            const last = signMsgs[signMsgs.length - 1]
            speakText(last.text)
            setLastSignReceived(last.sign)
        }
    }, [messages.filter(m => m.from === 'sign').length])

    useEffect(() => () => stopCamera(), [stopCamera])

    /* ═══════════════════════════════════════════
       RENDER
    ═══════════════════════════════════════════ */
    return (
        <div className="sb-page">

            {/* ── 헤더 ── */}
            <header className="sb-header">
                {onBack && (
                    <button className="sb-back" onClick={onBack}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M5 12l7-7M5 12l7 7" />
                        </svg>
                    </button>
                )}
                <div className="sb-header__brand">
                    <span className="sb-header__logo">◈</span>
                    <span className="sb-header__name">SignBridge</span>
                </div>
                <div className="sb-header__center">
                    <span className="sb-live-pill">
                        <span className="sb-live-dot" />
                        LIVE SESSION
                    </span>
                    <h1 className="sb-header__title">실시간 수어·음성 소통</h1>
                </div>
                <div className="sb-header__stats">
                    <div className="sb-stat">
                        <span className="sb-stat__val">0.3s</span>
                        <span className="sb-stat__label">응답</span>
                    </div>
                    <div className="sb-stat">
                        <span className="sb-stat__val">98%</span>
                        <span className="sb-stat__label">정확도</span>
                    </div>
                </div>
            </header>

            {/* ── 3열 본문 ── */}
            <main className="sb-main">

                {/* ════ 왼쪽: 음성 패널 ════ */}
                <section className="sb-panel sb-panel--voice">
                    <div className="sb-panel__header">
                        <div className="sb-panel__avatar sb-panel__avatar--voice">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                <line x1="12" y1="19" x2="12" y2="23"/>
                                <line x1="8" y1="23" x2="16" y2="23"/>
                            </svg>
                        </div>
                        <div>
                            <div className="sb-panel__name">음성 사용자</div>
                            <div className="sb-panel__role">음성 → 텍스트 전송</div>
                        </div>
                        <div className={`sb-badge ${isListening ? 'sb-badge--on' : ''}`}>
                            {isListening ? '말하는 중' : '대기'}
                        </div>
                    </div>

                    <div className="sb-panel__body">
                        <div className="sb-section-label">🎤 음성 입력</div>
                        <div className={`sb-voice-box ${isListening ? 'sb-voice-box--active' : ''}`}>
                            <WaveBar active={isListening} color="voice" />
                            <textarea
                                className="sb-textarea"
                                placeholder="마이크 버튼을 눌러 음성 인식을 시작하거나 직접 입력하세요"
                                value={voiceText}
                                onChange={e => setVoiceText(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="sb-btn-row">
                            <button
                                className={`sb-btn sb-btn--mic ${isListening ? 'sb-btn--recording' : ''}`}
                                onClick={isListening ? stopListening : startListening}
                            >
                                {isListening ? '⏹ 중지' : '🎤 녹음'}
                            </button>
                            <button
                                className="sb-btn sb-btn--send"
                                onClick={sendVoiceMsg}
                                disabled={!voiceText.trim()}
                            >
                                전송 →
                            </button>
                        </div>

                        {/* 수신된 수어 메시지 — 손 표시 포함 */}
                        <div className="sb-section-label" style={{ marginTop: 24 }}>📥 수신된 수어</div>
                        <div className="sb-received-list">
                            {messages.filter(m => m.from === 'sign').slice(-4).map(m => (
                                <div key={m.id} className="sb-received-item">
                                    {/* 손 제스처 시각 표시 */}
                                    <div className="sb-received-hand-icon">
                                        <span className="sb-received-emoji">{m.emoji}</span>
                                        <div className="sb-received-hand-lines">
                                            <div className="sb-hand-line sb-hand-line--1" />
                                            <div className="sb-hand-line sb-hand-line--2" />
                                            <div className="sb-hand-line sb-hand-line--3" />
                                        </div>
                                    </div>
                                    <div className="sb-received-content">
                                        <span className="sb-received-text">{m.text}</span>
                                        {m.sign && (
                                            <span className="sb-received-meaning">{m.sign.meaning}</span>
                                        )}
                                    </div>
                                    <button
                                        className="sb-tts-btn"
                                        onClick={() => speakText(m.text)}
                                        title="소리로 읽기"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            {messages.filter(m => m.from === 'sign').length === 0 && (
                                <p className="sb-empty">수어 메시지가 여기 표시됩니다</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* ════ 가운데: 채팅 ════ */}
                <div className="sb-chat">
                    <div className="sb-chat__header">
                        <span className="sb-chat__icon">⬡</span>
                        실시간 대화
                    </div>
                    <div className="sb-chat__messages">
                        {messages.map(m => (
                            <div
                                key={m.id}
                                className={`sb-msg ${
                                    m.from === 'system' ? 'sb-msg--sys'
                                        : m.from === 'voice' ? 'sb-msg--voice'
                                            : 'sb-msg--sign'
                                }`}
                            >
                                {m.from === 'system' ? (
                                    <span className="sb-msg__sys">{m.text}</span>
                                ) : (
                                    <>
                                        <div className="sb-msg__bubble">
                                            {m.emoji && <span className="sb-msg__emoji">{m.emoji}</span>}
                                            <span>{m.text}</span>
                                            <span className="sb-msg__type">
                                                {m.type === 'voice' ? '🎤' : '🤟'}
                                            </span>
                                        </div>
                                        <div className="sb-msg__from">
                                            {m.from === 'voice' ? '음성' : '수어'}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        <div ref={msgEndRef} />
                    </div>
                    <div className="sb-chat__footer">AI 실시간 번역 · MediaPipe Hands</div>
                </div>

                {/* ════ 오른쪽: 수어 패널 ════ */}
                <section className="sb-panel sb-panel--sign">
                    <div className="sb-panel__header">
                        <div className="sb-panel__avatar sb-panel__avatar--sign">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/>
                                <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2"/>
                                <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8"/>
                                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
                            </svg>
                        </div>
                        <div>
                            <div className="sb-panel__name">수어 사용자</div>
                            <div className="sb-panel__role">수어 인식 → 텍스트 변환</div>
                        </div>
                        <div className={`sb-badge sb-badge--sign ${cameraOn ? 'sb-badge--on' : ''}`}>
                            {cameraOn ? '인식 중' : '대기'}
                        </div>
                    </div>

                    <div className="sb-panel__body">
                        <div className="sb-section-label">📷 MediaPipe Hands</div>
                        <div className="sb-camera-wrap">
                            <video
                                ref={videoRef}
                                className={`sb-camera-video ${cameraOn ? 'sb-camera-video--on' : ''}`}
                                playsInline
                                muted
                                style={{ transform: 'scaleX(-1)' }}
                            />
                            {/* 랜드마크 오버레이 */}
                            {cameraOn && handLandmarks && (
                                <div className="sb-landmark-overlay" style={{ transform: 'scaleX(-1)' }}>
                                    <HandOverlay
                                        landmarks={handLandmarks}
                                        width={videoSize.w}
                                        height={videoSize.h}
                                    />
                                </div>
                            )}
                            {/* 카메라 꺼짐 플레이스홀더 */}
                            {!cameraOn && (
                                <div className="sb-camera-placeholder">
                                    <div className="sb-camera-placeholder__icon">
                                        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <rect x="4" y="14" width="56" height="42" rx="6"/>
                                            <circle cx="32" cy="35" r="10"/>
                                            <path d="M20 14V10a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v4"/>
                                        </svg>
                                    </div>
                                    <p>카메라 시작 버튼을 누르세요</p>
                                </div>
                            )}

                            {/* ✅ 감지된 수어 뜻 — 크고 명확하게 표시 */}
                            {cameraOn && detectedSign && (
                                <div className={`sb-detected-overlay ${signFlash ? 'sb-detected-overlay--flash' : ''}`}>
                                    {/* 손 랜드마크 아이콘 */}
                                    <div className="sb-detected-overlay__hand">
                                        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
                                            {/* 손바닥 */}
                                            <ellipse cx="20" cy="26" rx="10" ry="9" fill="rgba(99,220,180,0.18)" stroke="#63dcb4" strokeWidth="1.5"/>
                                            {/* 손가락 */}
                                            <rect x="10" y="9" width="4" height="14" rx="2" fill="rgba(99,220,180,0.25)" stroke="#63dcb4" strokeWidth="1.2"/>
                                            <rect x="15" y="6" width="4" height="16" rx="2" fill="rgba(99,220,180,0.25)" stroke="#63dcb4" strokeWidth="1.2"/>
                                            <rect x="20" y="7" width="4" height="15" rx="2" fill="rgba(99,220,180,0.25)" stroke="#63dcb4" strokeWidth="1.2"/>
                                            <rect x="25" y="9" width="4" height="13" rx="2" fill="rgba(99,220,180,0.25)" stroke="#63dcb4" strokeWidth="1.2"/>
                                        </svg>
                                    </div>
                                    <div className="sb-detected-overlay__emoji">{detectedSign.emoji}</div>
                                    <div className="sb-detected-overlay__label">{detectedSign.label}</div>
                                    <div className="sb-detected-overlay__meaning">{detectedSign.meaning}</div>
                                </div>
                            )}

                            {/* 손 없을 때 안내 */}
                            {cameraOn && !handLandmarks && (
                                <div className="sb-no-hand-hint">
                                    <span>📷 카메라에 손을 보여주세요</span>
                                </div>
                            )}

                            {cameraOn && (
                                <div className="sb-live-badge-cam">
                                    <span className="sb-live-dot" />
                                    LIVE
                                </div>
                            )}
                        </div>

                        <div className="sb-btn-row" style={{ marginTop: 10 }}>
                            <button
                                className={`sb-btn ${cameraOn ? 'sb-btn--stop' : 'sb-btn--cam'}`}
                                onClick={cameraOn ? stopCamera : startCamera}
                            >
                                {cameraOn ? '⏹ 종료' : '📷 카메라 시작'}
                            </button>
                            <button
                                className={`sb-btn sb-btn--send ${isDetecting ? 'sb-btn--detecting' : ''}`}
                                onClick={sendSignMsg}
                                disabled={isDetecting}
                            >
                                {isDetecting ? '전송 중…' : '전송 →'}
                            </button>
                        </div>

                        {/* 빠른 수어 선택 */}
                        <div className="sb-section-label" style={{ marginTop: 20 }}>⚡ 빠른 수어 선택</div>
                        <div className="sb-sign-grid">
                            {SIGN_MAP.map((s, i) => (
                                <button
                                    key={i}
                                    className={`sb-sign-chip ${selectedSign?.id === s.id ? 'sb-sign-chip--sel' : ''}`}
                                    onClick={() => { setSelectedSign(s); setDetectedSign(s) }}
                                >
                                    <span className="sb-sign-chip__emoji">{s.emoji}</span>
                                    <div className="sb-sign-chip__info">
                                        <span className="sb-sign-chip__label">{s.label}</span>
                                        <span className="sb-sign-chip__meaning">{s.meaning}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* 수신된 음성 — 손 제스처 함께 표시 */}
                        <div className="sb-section-label" style={{ marginTop: 20 }}>📢 수신된 음성</div>
                        <div className={`sb-voice-received ${isSpeaking ? 'sb-voice-received--speaking' : ''}`}>
                            {isSpeaking && <WaveBar active color="sign" />}
                            {lastVoiceMsg ? (
                                <>
                                    <p className="sb-voice-received__text">{lastVoiceMsg.text}</p>
                                    {/* ✅ 음성 메시지에도 손 모양 아이콘 표시 (수어 사용자 이해 보조) */}
                                    <div className="sb-voice-hand-hint">
                                        <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28" style={{opacity: 0.55}}>
                                            <ellipse cx="18" cy="24" rx="9" ry="8" fill="rgba(167,139,250,0.15)" stroke="#a78bfa" strokeWidth="1.3"/>
                                            <rect x="9"  y="8"  width="3.5" height="13" rx="1.7" fill="rgba(167,139,250,0.2)" stroke="#a78bfa" strokeWidth="1.1"/>
                                            <rect x="13.5" y="5" width="3.5" height="15" rx="1.7" fill="rgba(167,139,250,0.2)" stroke="#a78bfa" strokeWidth="1.1"/>
                                            <rect x="18" y="6"  width="3.5" height="14" rx="1.7" fill="rgba(167,139,250,0.2)" stroke="#a78bfa" strokeWidth="1.1"/>
                                            <rect x="22.5" y="8" width="3.5" height="12" rx="1.7" fill="rgba(167,139,250,0.2)" stroke="#a78bfa" strokeWidth="1.1"/>
                                        </svg>
                                        <span className="sb-voice-hand-hint__text">음성 메시지 수신됨</span>
                                    </div>
                                </>
                            ) : (
                                <p className="sb-empty">음성 메시지가 텍스트로 표시됩니다</p>
                            )}
                        </div>
                    </div>
                </section>

            </main>

            {/* ── 하단 푸터 ── */}
            <footer className="sb-footer">
                <div className="sb-footer__item">
                    <span className="sb-footer__icon sb-footer__icon--voice">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zm-5 8a5 5 0 0 0 10 0h-2a3 3 0 0 1-6 0H5z"/></svg>
                    </span>
                    <div>
                        <strong>음성 사용자</strong>
                        <span>음성으로 말하면 수어 사용자 화면에 텍스트로 표시됩니다</span>
                    </div>
                </div>
                <div className="sb-footer__arrow">⟷</div>
                <div className="sb-footer__item">
                    <span className="sb-footer__icon sb-footer__icon--sign">🤟</span>
                    <div>
                        <strong>수어 사용자</strong>
                        <span>카메라로 수어를 인식하면 뜻이 바로 표시되고 음성으로도 전달됩니다</span>
                    </div>
                </div>
            </footer>

        </div>
    )
}