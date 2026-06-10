// ══════════════════════════════════════════════════════════════
//  components/AI/AIChat.jsx
//  AI 채팅 창 — Gemini API 연동 + 타이핑 애니메이션
// ══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react'
import './AIChat.css'

// ── 빠른 질문 ──────────────────────────────────────────────────
const QUICK_QUESTIONS = [
    '안녕하세요 수어로 어떻게 해요?',
    '감사합니다 수어 알려주세요',
    '수어 배우는 좋은 방법은?',
    '청각장애인과 소통하는 팁',
    '도와주세요 수어로?',
    '수어 알파벳 알려주세요',
]

// ── 타이핑 애니메이션 함수 ────────────────────────────────────
function typeMessage(fullText, messageId, setMessages, onDone) {
    let index = 0
    const interval = setInterval(() => {
        index++
        setMessages(prev =>
            prev.map(m =>
                m.id === messageId
                    ? { ...m, content: fullText.slice(0, index), typing: index < fullText.length }
                    : m
            )
        )
        if (index >= fullText.length) {
            clearInterval(interval)
            onDone?.()
        }
    }, 18)
    return interval
}

// ══════════════════════════════════════════════════════════════
//  메인 컴포넌트
// ══════════════════════════════════════════════════════════════
export default function AIChat({ onClose, loggedIn = false, displayName = '', userEmail = '' }) {
    const [messages, setMessages] = useState([])
    const [input,    setInput]    = useState('')
    const [sending,  setSending]  = useState(false)
    const [speaking, setSpeaking] = useState(null)

    const bottomRef       = useRef(null)
    const inputRef        = useRef(null)
    const typingIntervalRef = useRef(null)

    // ── 초기 메시지 (타이핑 애니메이션) ─────────────────────
    useEffect(() => {
        if (messages.length === 0) {
            const welcomeText = `안녕하세요${displayName ? `, ${displayName}님` : ''}! 🤟\n\n저는 SignBridge AI 어시스턴트입니다.\n수어·청각장애·의사소통에 관해 무엇이든 물어보세요!`
            const welcomeId = 0

            setMessages([{ id: welcomeId, role: 'assistant', content: '', typing: true }])

            setTimeout(() => {
                typingIntervalRef.current = typeMessage(welcomeText, welcomeId, setMessages)
            }, 400)
        }
    }, [])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // ── 언마운트 시 정리 ──────────────────────────────────────
    useEffect(() => {
        return () => {
            if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
            window.speechSynthesis.cancel()
        }
    }, [])

    // ── TTS ──────────────────────────────────────────────────
    const speakMessage = (id, text) => {
        window.speechSynthesis.cancel()
        if (speaking === id) {
            setSpeaking(null)
            return
        }
        const utter = new SpeechSynthesisUtterance(text)
        utter.lang  = 'ko-KR'
        utter.rate  = 0.95
        utter.onend   = () => setSpeaking(null)
        utter.onerror = () => setSpeaking(null)
        window.speechSynthesis.speak(utter)
        setSpeaking(id)
    }

    // ── 메시지 전송 (Gemini API) ──────────────────────────────
    const send = async (text) => {
        const content = (text ?? input).trim()
        if (!content || sending) return
        setInput('')
        setSending(true)

        const userId  = Date.now()
        const loadId  = Date.now() + 1

        const userMsg = { id: userId, role: 'user', content }
        setMessages(prev => [
            ...prev,
            userMsg,
            { id: loadId, role: 'assistant', content: '', loading: true },
        ])

        try {
            // 현재 대화 내역 전체 전송
            const history = [...messages, userMsg]
                .filter(m => !m.loading)
                .map(m => ({ role: m.role, content: m.content }))

            const data = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail, messages: history }),
            }).then(r => r.json())

            const reply = data?.choices?.[0]?.message?.content ?? '응답을 가져오지 못했어요.'

            // 로딩 → 타이핑 시작
            const replyId = Date.now() + 2
            setMessages(prev =>
                prev.map(m =>
                    m.loading
                        ? { ...m, id: replyId, loading: false, content: '', typing: true }
                        : m
                )
            )

            typingIntervalRef.current = typeMessage(reply, replyId, setMessages, () => {
                speakMessage(replyId, reply)
            })

        } catch (e) {
            console.error('AI 채팅 오류:', e)
            setMessages(prev =>
                prev.map(m =>
                    m.loading
                        ? { ...m, loading: false, content: `오류: ${e?.message ?? '서버 연결 실패'}` }
                        : m
                )
            )
        } finally {
            setSending(false)
        }
    }

    // ── 초기화 ────────────────────────────────────────────────
    const clearChat = () => {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
        window.speechSynthesis.cancel()
        setSpeaking(null)

        const clearText = '대화가 초기화되었습니다. 무엇이든 물어보세요! 🤟'
        const clearId   = Date.now()
        setMessages([{ id: clearId, role: 'assistant', content: '', typing: true }])
        setTimeout(() => {
            typingIntervalRef.current = typeMessage(clearText, clearId, setMessages)
        }, 200)
    }

    const handleClose = () => {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
        window.speechSynthesis.cancel()
        setSpeaking(null)
        onClose()
    }

    const onKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
    }

    // ── 비로그인 화면 ─────────────────────────────────────────
    if (!loggedIn) {
        return (
            <div className="aic-window">
                <div className="aic-header">
                    <div className="aic-header-left">
                        <span className="aic-dot" />
                        <span className="aic-title">SignBridge AI</span>
                    </div>
                    <button className="aic-icon-btn" onClick={handleClose} title="닫기">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div className="aic-gate">
                    <div className="aic-gate-icon">🔒</div>
                    <div className="aic-gate-title">로그인이 필요합니다</div>
                    <div className="aic-gate-sub">AI 어시스턴트를 사용하려면 먼저 로그인 해주세요.</div>
                    <button className="aic-gate-btn" onClick={handleClose}>닫기</button>
                </div>
            </div>
        )
    }

    return (
        <div className="aic-window">
            {/* 헤더 */}
            <div className="aic-header">
                <div className="aic-header-left">
                    <span className="aic-dot" />
                    <span className="aic-title">SignBridge AI</span>
                </div>
                <div className="aic-header-right">
                    <button className="aic-icon-btn" onClick={clearChat} title="초기화">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                            <polyline points="23 4 23 10 17 10"/>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                        </svg>
                    </button>
                    <button className="aic-icon-btn" onClick={handleClose} title="닫기">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* 메시지 목록 */}
            <div className="aic-messages">
                {messages.map(msg => (
                    <div key={msg.id} className={`aic-row ${msg.role === 'user' ? 'aic-row-user' : 'aic-row-ai'}`}>
                        {msg.role === 'assistant' && (
                            <div className="aic-avatar">🤖</div>
                        )}
                        <div className="aic-bubble-wrap">
                            <div className={`aic-bubble ${msg.role === 'user' ? 'aic-bubble-user' : 'aic-bubble-ai'}`}>
                                {msg.loading ? (
                                    <div className="aic-loading">
                                        <span/><span/><span/>
                                    </div>
                                ) : (
                                    <span className="aic-bubble-text">
                                        {msg.content}
                                        {msg.typing && <span className="aic-cursor">▌</span>}
                                    </span>
                                )}
                            </div>
                            {msg.role === 'assistant' && !msg.loading && !msg.typing && (
                                <button
                                    className={`aic-tts-btn ${speaking === msg.id ? 'aic-tts-active' : ''}`}
                                    onClick={() => speakMessage(msg.id, msg.content)}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                                        {speaking === msg.id
                                            ? <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
                                            : <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></>
                                        }
                                    </svg>
                                    {speaking === msg.id ? '재생 중 (클릭하면 정지)' : '소리로 듣기'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* 빠른 질문 */}
            {messages.length <= 1 && (
                <div className="aic-quick-bar">
                    {QUICK_QUESTIONS.map((q, i) => (
                        <button key={i} className="aic-quick-chip" onClick={() => send(q)}>
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* 입력바 */}
            <div className="aic-input-bar">
                <textarea
                    ref={inputRef}
                    className="aic-input"
                    placeholder="무엇이든 물어보세요..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={onKey}
                    rows={1}
                    maxLength={300}
                    disabled={sending}
                />
                <button
                    className={`aic-send-btn ${(!input.trim() || sending) ? 'aic-send-off' : ''}`}
                    onClick={() => send()}
                    disabled={!input.trim() || sending}
                >
                    {sending ? (
                        <span className="aic-send-spinner" />
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                            <line x1="22" y1="2" x2="11" y2="13"/>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                    )}
                </button>
            </div>
        </div>
    )
}