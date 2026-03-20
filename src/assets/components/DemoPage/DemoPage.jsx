import { useState, useEffect, useRef, useCallback } from 'react'
import './DemoPage.css'

/* ─────────────────────────────────────────
   시뮬레이션용 수어 메시지 목록
───────────────────────────────────────── */
const SIGN_PHRASES = [
    { sign: '🤟', text: '안녕하세요', confidence: 98.2 },
    { sign: '👋', text: '반갑습니다', confidence: 96.7 },
    { sign: '🙏', text: '감사합니다', confidence: 97.5 },
    { sign: '✋', text: '잠깐만요', confidence: 95.1 },
    { sign: '👍', text: '네, 맞아요', confidence: 99.0 },
    { sign: '🤲', text: '도움이 필요해요', confidence: 94.3 },
    { sign: '👐', text: '이해했습니다', confidence: 96.8 },
    { sign: '🖐', text: '괜찮습니다', confidence: 97.2 },
]

/* ─────────────────────────────────────────
   음파 애니메이션 컴포넌트 (시각장애인 측)
───────────────────────────────────────── */
function SoundWave({ active }) {
    return (
        <div className={`sound-wave ${active ? 'active' : ''}`}>
            {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
        </div>
    )
}

/* ─────────────────────────────────────────
   수어 감지 애니메이션 (카메라 피드 시뮬)
───────────────────────────────────────── */
function CameraFeed({ detecting, currentSign }) {
    return (
        <div className={`camera-feed ${detecting ? 'detecting' : ''}`}>
            <div className="camera-scan-line" />
            <div className="camera-grid">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="camera-grid-cell" />
                ))}
            </div>
            <div className="camera-hand-area">
                {detecting && currentSign ? (
                    <div className="camera-sign-display">
                        <span className="camera-sign-emoji">{currentSign.sign}</span>
                        <div className="camera-keypoints">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="camera-keypoint" style={{
                                    left: `${20 + i * 15}%`,
                                    top: `${30 + Math.sin(i) * 20}%`,
                                    animationDelay: `${i * 0.1}s`
                                }} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="camera-idle">
                        <div className="camera-idle-icon">📷</div>
                        <div className="camera-idle-text">카메라 대기 중</div>
                    </div>
                )}
            </div>
            <div className="camera-badge">
                <span className="camera-dot" />
                LIVE
            </div>
            {detecting && currentSign && (
                <div className="camera-confidence">
                    AI 정확도 <strong>{currentSign.confidence}%</strong>
                </div>
            )}
        </div>
    )
}

/* ─────────────────────────────────────────
   메인 DemoPage
───────────────────────────────────────── */
export default function DemoPage({ onBack }) {
    /* 공유 채팅 메시지 */
    const [messages, setMessages]       = useState([
        { id: 0, from: 'system', text: '소통 세션이 시작되었습니다. 각자의 방식으로 대화해보세요.' }
    ])

    /* 시각장애인 측 상태 */
    const [voiceText, setVoiceText]     = useState('')
    const [voiceActive, setVoiceActive] = useState(false)
    const [speaking, setSpeaking]       = useState(false)

    /* 청각장애인 측 상태 */
    const [detecting, setDetecting]     = useState(false)
    const [currentSign, setCurrentSign] = useState(null)
    const [signPhrase, setSignPhrase]   = useState(SIGN_PHRASES[0])
    const [signIdx, setSignIdx]         = useState(0)

    /* TTS 재생 큐 */
    const [ttsQueue, setTtsQueue]       = useState([])
    const [playingTts, setPlayingTts]   = useState(null)

    const msgEndRef = useRef(null)
    const voiceRef  = useRef(null)

    useEffect(() => {
        msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    /* ── 시각장애인: 음성 인식 시뮬 ── */
    const handleStartVoice = () => {
        setVoiceActive(true)
        setVoiceText('듣는 중...')
        const phrases = [
            '안녕하세요, 만나서 반갑습니다.',
            '도움이 필요하신가요?',
            '무엇을 도와드릴까요?',
            '네, 알겠습니다.',
            '잠시만 기다려주세요.',
            '감사합니다, 좋은 하루 되세요.',
        ]
        const picked = phrases[Math.floor(Math.random() * phrases.length)]
        let i = 0
        const interval = setInterval(() => {
            i++
            setVoiceText(picked.slice(0, Math.floor(picked.length * (i / 10))))
            if (i >= 10) {
                clearInterval(interval)
                setVoiceText(picked)
            }
        }, 100)
        setTimeout(() => {
            clearInterval(interval)
            setVoiceText(picked)
        }, 1200)
    }

    const handleSendVoice = () => {
        if (!voiceText || voiceText === '듣는 중...') return
        const newMsg = { id: Date.now(), from: 'visual', text: voiceText, type: 'voice' }
        setMessages(m => [...m, newMsg])
        /* 청각장애인 측에 TTS 큐 추가 */
        setTtsQueue(q => [...q, { id: newMsg.id, text: voiceText }])
        setVoiceText('')
        setVoiceActive(false)
    }

    const handleVoiceType = (e) => {
        setVoiceText(e.target.value)
        setVoiceActive(!!e.target.value)
    }

    /* ── 청각장애인 측으로 TTS 재생 (시뮬) ── */
    useEffect(() => {
        if (ttsQueue.length > 0 && !playingTts) {
            const next = ttsQueue[0]
            setPlayingTts(next)
            setTtsQueue(q => q.slice(1))
            setSpeaking(true)
            setTimeout(() => {
                setSpeaking(false)
                setPlayingTts(null)
            }, next.text.length * 80 + 500)
        }
    }, [ttsQueue, playingTts])

    /* ── 청각장애인: 수어 감지 시뮬 ── */
    const handleStartDetect = () => {
        setDetecting(true)
        let frame = 0
        const interval = setInterval(() => {
            frame++
            setCurrentSign(SIGN_PHRASES[signIdx])
            if (frame >= 15) {
                clearInterval(interval)
                setDetecting(false)
                setCurrentSign(SIGN_PHRASES[signIdx])
            }
        }, 80)
    }

    const handleSendSign = () => {
        if (!signPhrase) return
        const newMsg = { id: Date.now(), from: 'hearing', text: signPhrase.text, sign: signPhrase.sign, type: 'sign' }
        setMessages(m => [...m, newMsg])
        /* 시각장애인 측에 TTS 트리거 (시뮬: 텍스트로 표시) */
        const next = (signIdx + 1) % SIGN_PHRASES.length
        setSignIdx(next)
        setSignPhrase(SIGN_PHRASES[next])
        setCurrentSign(null)
    }

    const handlePickSign = (phrase, idx) => {
        setSignPhrase(phrase)
        setSignIdx(idx)
        setCurrentSign(phrase)
    }

    /* ── TTS 읽기 (Web Speech API, 지원 시) ── */
    const handleTtsPlay = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel()
            const utt = new SpeechSynthesisUtterance(text)
            utt.lang = 'ko-KR'
            window.speechSynthesis.speak(utt)
        }
    }

    return (
        <div className="demo-page">

            {/* ── 헤더 ── */}
            <div className="demo-header">

                <div className="demo-header-center">
                    <div className="demo-live-badge">
                        <span className="demo-live-dot" />
                        소통 데모
                    </div>
                    <h1 className="demo-title">함께하는 소통 공간</h1>
                    <p className="demo-subtitle">시각장애인과 청각장애인이 실시간으로 대화합니다</p>
                </div>
                <div className="demo-header-right">
                    <div className="demo-stat"><span>🎯</span>AI 정확도 98%</div>
                    <div className="demo-stat"><span>⚡</span>0.3초 응답</div>
                </div>
            </div>

            {/* ── 메인 3열 레이아웃 ── */}
            <div className="demo-layout">

                {/* ══ 왼쪽: 시각장애인 패널 ══ */}
                <div className="demo-panel panel-visual">
                    <div className="panel-header">
                        <div className="panel-avatar avatar-visual">👁</div>
                        <div>
                            <div className="panel-name">시각장애인 사용자</div>
                            <div className="panel-role">음성 입력 → 텍스트 전송</div>
                        </div>
                        <div className={`panel-status ${voiceActive ? 'active' : ''}`}>
                            {voiceActive ? '말하는 중' : '대기'}
                        </div>
                    </div>

                    {/* 음성 입력 영역 */}
                    <div className="panel-body">
                        <div className="panel-section-label">🎤 음성 입력</div>
                        <div className={`voice-input-area ${voiceActive ? 'active' : ''}`}>
                            <SoundWave active={voiceActive} />
                            <textarea
                                className="voice-textarea"
                                placeholder="마이크 버튼을 눌러 음성 인식을 시작하거나&#10;직접 텍스트를 입력하세요"
                                value={voiceText}
                                onChange={handleVoiceType}
                                rows={3}
                            />
                        </div>
                        <div className="panel-btn-row">
                            <button className="panel-mic-btn" onClick={handleStartVoice}>
                                🎤 음성 인식
                            </button>
                            <button
                                className="panel-send-btn"
                                onClick={handleSendVoice}
                                disabled={!voiceText || voiceText === '듣는 중...'}
                            >
                                전송 →
                            </button>
                        </div>

                        {/* 수신: 상대방 수어 메시지를 TTS로 읽어줌 */}
                        <div className="panel-section-label" style={{ marginTop: 20 }}>🔊 수신된 수어 메시지</div>
                        <div className="tts-received-list">
                            {messages
                                .filter(m => m.from === 'hearing')
                                .slice(-3)
                                .map(m => (
                                    <div key={m.id} className="tts-received-item">
                                        <span className="tts-sign-icon">{m.sign}</span>
                                        <span className="tts-text">{m.text}</span>
                                        <button className="tts-play-btn" onClick={() => handleTtsPlay(m.text)} title="소리로 읽기">
                                            🔊
                                        </button>
                                    </div>
                                ))}
                            {messages.filter(m => m.from === 'hearing').length === 0 && (
                                <div className="tts-empty">청각장애인의 수어 메시지가 여기에 표시됩니다</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══ 가운데: 공유 채팅 ══ */}
                <div className="demo-chat-panel">
                    <div className="chat-header">
                        <div className="chat-header-icon">💬</div>
                        <span>실시간 대화</span>
                    </div>
                    <div className="chat-messages">
                        {messages.map(m => (
                            <div
                                key={m.id}
                                className={`chat-msg ${m.from === 'system' ? 'msg-system' : m.from === 'visual' ? 'msg-visual' : 'msg-hearing'}`}
                            >
                                {m.from === 'system' ? (
                                    <div className="msg-system-text">{m.text}</div>
                                ) : (
                                    <>
                                        <div className="msg-bubble">
                                            {m.sign && <span className="msg-sign-icon">{m.sign}</span>}
                                            <span className="msg-text">{m.text}</span>
                                            {m.type === 'voice' && <span className="msg-type-badge">🎤</span>}
                                            {m.type === 'sign'  && <span className="msg-type-badge">🤟</span>}
                                        </div>
                                        <div className="msg-sender">
                                            {m.from === 'visual' ? '시각장애인' : '청각장애인'}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        <div ref={msgEndRef} />
                    </div>
                    <div className="chat-footer-note">
                        AI가 실시간으로 수어와 음성을 번역합니다
                    </div>
                </div>

                {/* ══ 오른쪽: 청각장애인 패널 ══ */}
                <div className="demo-panel panel-hearing">
                    <div className="panel-header">
                        <div className="panel-avatar avatar-hearing">🤟</div>
                        <div>
                            <div className="panel-name">청각장애인 사용자</div>
                            <div className="panel-role">수어 인식 → 텍스트 변환</div>
                        </div>
                        <div className={`panel-status ${detecting ? 'active' : ''}`}>
                            {detecting ? '인식 중' : '대기'}
                        </div>
                    </div>

                    <div className="panel-body">
                        {/* 카메라 피드 */}
                        <div className="panel-section-label">📷 수어 카메라</div>
                        <CameraFeed detecting={detecting} currentSign={currentSign} />

                        <div className="panel-btn-row" style={{ marginTop: 10 }}>
                            <button className="panel-mic-btn" onClick={handleStartDetect}>
                                📷 수어 인식
                            </button>
                            <button
                                className="panel-send-btn"
                                onClick={handleSendSign}
                                disabled={!currentSign && !signPhrase}
                            >
                                전송 →
                            </button>
                        </div>

                        {/* 빠른 수어 선택 */}
                        <div className="panel-section-label" style={{ marginTop: 16 }}>🔤 빠른 수어 선택</div>
                        <div className="sign-quick-grid">
                            {SIGN_PHRASES.map((p, i) => (
                                <button
                                    key={i}
                                    className={`sign-quick-btn ${signIdx === i ? 'selected' : ''}`}
                                    onClick={() => handlePickSign(p, i)}
                                >
                                    <span className="sqb-icon">{p.sign}</span>
                                    <span className="sqb-text">{p.text}</span>
                                </button>
                            ))}
                        </div>

                        {/* 수신: 상대방 음성 메시지 */}
                        <div className="panel-section-label" style={{ marginTop: 16 }}>📢 수신된 음성 메시지</div>
                        <div className={`voice-received-area ${speaking ? 'speaking' : ''}`}>
                            {speaking && playingTts ? (
                                <>
                                    <SoundWave active={true} />
                                    <div className="voice-received-text">{playingTts.text}</div>
                                </>
                            ) : messages.filter(m => m.from === 'visual').length > 0 ? (
                                <div className="voice-received-text last">
                                    {messages.filter(m => m.from === 'visual').slice(-1)[0].text}
                                    <span className="voice-read-badge">텍스트로 표시</span>
                                </div>
                            ) : (
                                <div className="tts-empty">시각장애인의 음성이 텍스트로 표시됩니다</div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* ── 하단 설명 ── */}
            <div className="demo-footer-info">
                <div className="dfi-item">
                    <span className="dfi-icon">👁</span>
                    <div>
                        <strong>시각장애인</strong>
                        <span>음성 또는 텍스트로 메시지를 보내면 상대방 화면에 텍스트로 표시됩니다</span>
                    </div>
                </div>
                <div className="dfi-arrow">⟷</div>
                <div className="dfi-item">
                    <span className="dfi-icon">🤟</span>
                    <div>
                        <strong>청각장애인</strong>
                        <span>카메라로 수어를 인식하면 상대방에게 텍스트로 전달되고 음성으로 읽어줍니다</span>
                    </div>
                </div>
            </div>

        </div>
    )
}