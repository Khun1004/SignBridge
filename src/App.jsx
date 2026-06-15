import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './App.css'
import SignBridgeLogo from './assets/SignBridge.png'
import { commonApi, communityApi, myPageApi } from './assets/components/api/api.jsx';
import About            from './assets/components/About/About.jsx'
import ConversationPage from './assets/components/ConversationPage/ConversationPage.jsx'
import Practice         from './assets/components/Practice/Practice.jsx'
import DictPage         from './assets/components/DictPage/DictPage.jsx'
import Home             from './assets/components/Home/Home.jsx'
import MyPage           from './assets/components/MyPage/MyPage.jsx'
import TranslatePage    from './assets/components/TranslatePage/TranslatePage.jsx'
import chatService from './assets/components/ChatPage/chatService'
import AIChat from './assets/components/AI/AIChat'
import RegisterPersonal    from './assets/components/RegisterPersonal/RegisterPersonal.jsx'
import RegisterImmigration from './assets/components/RegisterImmigration/RegisterImmigration.jsx'
import RegisterPolice      from './assets/components/RegisterPolice/RegisterPolice.jsx'

import LoginPage  from './assets/components/LoginPage/LoginPage.jsx'
import SearchPage from './assets/components/Search/Search.jsx'
import NotiPage   from './assets/components/Noti/Noti.jsx'
import SignupPage from './assets/components/SignupPage/SignupPage.jsx'
import DemoPage    from "./assets/components/DemoPage/DemoPage.jsx";
import Community  from './assets/components/Community/Community.jsx'
import ChatRoom from './assets/components/ChatPage/ChatRoom.jsx'

const MENUS = [
    { id: 'home',      label: '홈' },
    { id: 'practice',  label: '연습하기' },
    { id: 'trans',     label: '번역기' },
    { id: 'dict',      label: '수어사전' },
    { id: 'community', label: '커뮤니티' },
    { id: 'about',     label: 'About' },
]

const SAMPLE_NOTIFICATIONS = [
    { id: 1, icon: '🎉', text: '수어 번역 정확도가 98%를 달성했습니다!',        time: '방금 전',  unread: true,  category: 'system'    },
    { id: 2, icon: '📋', text: '대화 기록 REC-002가 검토되었습니다.',           time: '5분 전',  unread: true,  category: 'translate' },
    { id: 3, icon: '✅', text: 'IMM-2025-001 신청 처리가 완료되었습니다.',      time: '1시간 전', unread: true,  category: 'system'    },
    { id: 4, icon: '📚', text: '새로운 수어 단어 50개가 추가되었습니다.',        time: '3시간 전', unread: false, category: 'update'    },
    { id: 5, icon: '🤝', text: '커뮤니티에 새 멤버가 가입했습니다.',            time: '어제',    unread: false, category: 'community' },
    { id: 6, icon: '🤟', text: '실시간 번역 기능이 업데이트되었습니다.',         time: '2일 전',  unread: false, category: 'translate' },
]

// ── 알림 드롭다운 (앱 Noti.tsx 기반 업그레이드) ──
const CATEGORY_COLORS = {
    system:    '#7c6fff',
    update:    '#10b981',
    community: '#3b82f6',
    translate: '#f59e0b',
}
const CATEGORY_LABELS = {
    system:    '시스템',
    update:    '업데이트',
    community: '커뮤니티',
    translate: '번역',
}

function NotificationDropdown({ notifications, setNotifications, onClose, onMarkAll }) {
    const ref = useRef(null)

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [onClose])

    const handleMarkRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
    }

    const handleDelete = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    const unreadCount = notifications.filter(n => n.unread).length

    return (
        <div className="notif-dropdown" ref={ref}>
            {/* 요약 바 */}
            <div className="notif-header">
                <div className="notif-header-left">
                    <span className="notif-unread-badge">{unreadCount}</span>
                    <span className="notif-title">읽지 않은 알림</span>
                </div>
                {unreadCount > 0 && (
                    <button className="notif-mark-all" onClick={onMarkAll}>모두 읽음</button>
                )}
            </div>

            {/* 알림 목록 */}
            <div className="notif-list">
                {notifications.length === 0 ? (
                    <div className="notif-empty">
                        <span className="notif-empty-icon">🔔</span>
                        <div className="notif-empty-title">알림이 없습니다</div>
                        <div className="notif-empty-sub">새로운 알림이 오면 여기에 표시됩니다.</div>
                    </div>
                ) : notifications.map(n => {
                    const catColor = CATEGORY_COLORS[n.category ?? 'system'] ?? '#7c6fff'
                    const catLabel = CATEGORY_LABELS[n.category ?? 'system'] ?? '시스템'
                    return (
                        <div
                            key={n.id}
                            className={`notif-item ${n.unread ? 'unread' : ''}`}
                            onClick={() => handleMarkRead(n.id)}
                            style={n.unread ? { borderLeft: `4px solid ${catColor}` } : {}}
                        >
                            {/* 아이콘 */}
                            <div className="notif-icon-wrap" style={{ background: catColor + '22' }}>
                                <span className="notif-icon">{n.icon}</span>
                            </div>

                            {/* 본문 */}
                            <div className="notif-body">
                                <div className="notif-top-row">
                                    <span className="notif-cat-badge" style={{ background: catColor + '22', color: catColor }}>{catLabel}</span>
                                    <span className="notif-time">{n.time}</span>
                                </div>
                                <div className={`notif-text ${n.unread ? 'notif-text-bold' : ''}`}>{n.text}</div>
                            </div>

                            {/* 삭제 버튼 */}
                            <button
                                className="notif-delete-btn"
                                onClick={(e) => { e.stopPropagation(); handleDelete(n.id) }}
                                title="삭제"
                            >✕</button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ── AI 채팅 창 ──
function AiChatWindow({ onClose }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: '안녕하세요! SignBridge AI 어시스턴트입니다. 수어나 서비스에 관해 궁금한 점을 물어보세요 🤟' }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef(null)
    const inputRef  = useRef(null)

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    const send = async () => {
        const text = input.trim()
        if (!text || loading) return
        setInput('')
        setMessages(prev => [...prev, { role: 'user', text }])
        setLoading(true)
        try {
            const history = messages
                .filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0)
                .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }))
            history.push({ role: 'user', content: text })

            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 1000,
                    system: 'You are a helpful assistant for SignBridge, a Korean sign language translation service. Answer in Korean. Be concise and friendly. Help users with questions about sign language, the service features, and general questions.',
                    messages: history,
                })
            })
            const data = await res.json()
            const reply = data.content?.[0]?.text || '죄송합니다, 응답을 받지 못했어요.'
            setMessages(prev => [...prev, { role: 'assistant', text: reply }])
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', text: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }])
        }
        setLoading(false)
    }

    const onKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
    }

    return (
        <div className="ai-chat-window">
            <div className="ai-chat-header">
                <div className="ai-chat-header-left">
                    <div className="ai-chat-avatar">🤖</div>
                    <div>
                        <div className="ai-chat-title">AI 어시스턴트</div>
                        <div className="ai-chat-subtitle">SignBridge · Claude</div>
                    </div>
                </div>
                <button className="ai-chat-close" onClick={onClose}>✕</button>
            </div>

            <div className="ai-chat-messages">
                {messages.map((m, i) => (
                    <div key={i} className={`ai-msg-row ${m.role === 'user' ? 'ai-msg-me' : 'ai-msg-them'}`}>
                        {m.role === 'assistant' && <div className="ai-msg-av">🤖</div>}
                        <div className={`ai-msg-bubble ${m.role === 'user' ? 'ai-bubble-me' : 'ai-bubble-them'}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="ai-msg-row ai-msg-them">
                        <div className="ai-msg-av">🤖</div>
                        <div className="ai-msg-bubble ai-bubble-them ai-typing">
                            <span/><span/><span/>
                        </div>
                    </div>
                )}
                <div ref={bottomRef}/>
            </div>

            <div className="ai-chat-input-row">
                <textarea
                    ref={inputRef}
                    className="ai-chat-input"
                    placeholder="메시지를 입력하세요… (Enter 전송)"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={onKey}
                    rows={1}
                    disabled={loading}
                />
                <button className="ai-chat-send" onClick={send} disabled={!input.trim() || loading}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                </button>
            </div>
        </div>
    )
}

// ── 오른쪽 플로팅 사이드바 ──
// chatUnread: 전체 읽지 않은 메시지 수 (숫자 뱃지용)
function FloatingSidebar({ onChat, onCall, onAiChat, chatUnread = 0, toastMessages = [], onToastClick }) {
    const scrollTo = (dir) =>
        window.scrollTo({ top: dir === 'top' ? 0 : document.body.scrollHeight, behavior: 'smooth' })

    return (
        <div className="floating-sidebar">
            <button className="fsb-btn fsb-scroll" onClick={() => scrollTo('top')} title="맨 위로">
                <span className="fsb-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 15l-6-6-6 6"/>
                    </svg>
                </span>
                <span className="fsb-label">위로</span>
            </button>

            <button className="fsb-btn fsb-chat" onClick={onChat} title="채팅" style={{position:'relative'}}>
                {chatUnread > 0 && (
                    <span style={{
                        position:'absolute', top:6, right:6,
                        minWidth:18, height:18,
                        background:'#ef4444', color:'#fff',
                        fontSize:10, fontWeight:800,
                        borderRadius:9, padding:'0 5px',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        border:'2px solid #fff',
                        lineHeight:1, zIndex:10,
                    }}>
                        {chatUnread > 99 ? '99+' : chatUnread}
                    </span>
                )}
                <span className="fsb-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                </span>
                <span className="fsb-label">채팅</span>

                {/* 토스트 팝업 */}
                {toastMessages.length > 0 && (
                    <div style={{
                        position:'absolute', right:'calc(100% + 12px)', bottom:0,
                        display:'flex', flexDirection:'column-reverse', gap:8,
                        width:260, zIndex:9999,
                    }}>
                        {toastMessages.map(m => (
                            <div key={m.id} onClick={onToastClick} style={{
                                background:'#fff',
                                borderRadius:14,
                                padding:'10px 14px',
                                boxShadow:'0 4px 20px rgba(0,0,0,0.13)',
                                border:'1.5px solid #e0e7ff',
                                cursor:'pointer',
                                display:'flex', alignItems:'center', gap:10,
                                animation:'slideIn 0.2s ease',
                            }}>
                                <div style={{
                                    width:36, height:36, borderRadius:'50%',
                                    background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                    color:'#fff', fontWeight:800, fontSize:15,
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    flexShrink:0,
                                }}>
                                    {m.avatar}
                                </div>
                                <div style={{overflow:'hidden'}}>
                                    <div style={{fontWeight:700, fontSize:13, color:'#1e1b4b', marginBottom:2}}>
                                        {m.name}
                                    </div>
                                    <div style={{
                                        fontSize:12, color:'#6b7280',
                                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                                    }}>
                                        {m.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </button>

            <button className="fsb-btn fsb-call" onClick={onCall} title="전화">
                <span className="fsb-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.42a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/>
                    </svg>
                </span>
                <span className="fsb-label">전화</span>
            </button>

            {/* AI 채팅 버튼 */}
            <button className="fsb-btn fsb-ai" onClick={onAiChat} title="AI 채팅">
                <span className="fsb-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="14" rx="3"/>
                        <path d="M8 21h8M12 17v4"/>
                        <path d="M8 8h8M8 11h5"/>
                    </svg>
                </span>
                <span className="fsb-label">AI</span>
            </button>

            <button className="fsb-btn fsb-scroll" onClick={() => scrollTo('bottom')} title="맨 아래로">
                <span className="fsb-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </span>
                <span className="fsb-label">아래</span>
            </button>
        </div>
    )
}

// ── 수어 데이터베이스 ──
const SIGN_DB = [
    { id:'1', word:'안녕하세요',     category:'인사', emoji:'👋', description:'상대방을 처음 만나거나 하루를 시작할 때 사용하는 기본 인사 표현입니다.', handShape:'오른손을 펴서 손바닥이 앞을 향하게 합니다', movement:'손을 이마 옆에서 앞으로 내밀며 가볍게 흔듭니다', expression:'밝고 친근한 표정, 눈 맞춤 유지', tips:'손을 너무 크게 흔들지 않고 자연스럽게 움직이는 것이 포인트입니다', related:['안녕히 가세요','안녕히 계세요','반갑습니다'] },
    { id:'2', word:'감사합니다',     category:'예절', emoji:'🙏', description:'고마움을 표현할 때 사용하는 수어입니다. 일상에서 가장 많이 쓰이는 표현 중 하나입니다.', handShape:'오른손 손끝을 모아 입술 아래에 댑니다', movement:'손을 앞으로 뻗으며 약간 아래로 내립니다', expression:'진심 어린 표정, 가벼운 목례와 함께 사용하면 더욱 자연스럽습니다', tips:'손의 속도를 너무 빠르게 하지 말고 천천히 정성스럽게 표현하세요', related:['고맙습니다','죄송합니다','괜찮습니다'] },
    { id:'3', word:'도와주세요',     category:'요청', emoji:'🤝', description:'도움이 필요할 때 상대방에게 요청하는 표현입니다. 긴급 상황에서도 활용됩니다.', handShape:'왼손 주먹 위에 오른손 엄지를 올려 받칩니다', movement:'두 손을 함께 앞으로 내밀며 올립니다', expression:'간절하거나 급한 표정, 눈썹을 약간 올립니다', tips:'긴급할 때는 동작을 빠르고 크게, 일상적 요청은 작고 부드럽게 표현하세요', related:['부탁합니다','필요해요','긴급'] },
    { id:'4', word:'만나서 반갑습니다', category:'인사', emoji:'🤗', description:'처음 만나는 사람에게 반가움을 표현하는 수어입니다. 공식적인 자리에서도 사용됩니다.', handShape:'양손을 가슴 앞에서 마주 보게 펼칩니다', movement:'양손을 가슴 중앙으로 모으듯 합장하며 살짝 흔듭니다', expression:'밝고 환한 미소, 상대방과 눈을 맞춥니다', tips:'악수하듯 자연스럽게 연결하면 더욱 자연스러운 표현이 됩니다', related:['안녕하세요','처음 뵙겠습니다','반갑습니다'] },
    { id:'5', word:'사랑합니다',     category:'감정', emoji:'❤️', description:'깊은 애정과 사랑을 표현하는 수어입니다. 가족, 친구, 연인 모두에게 사용할 수 있습니다.', handShape:'오른손 엄지·검지·소지를 펴고 나머지를 접습니다 (I Love You 핸드셰이프)', movement:'손을 가슴에서 상대방을 향해 부드럽게 내밉니다', expression:'따뜻하고 진심 어린 표정, 부드러운 눈빛', tips:"국제 수어에서도 통용되는 'ILY' 핸드셰이프로 표현하면 전 세계 농인에게 전달됩니다", related:['좋아해요','보고 싶어요','행복해요'] },
]
const RECENT_KEY = 'sb_search_recent'

function SearchOverlay({ onClose, onGoDict }) {
    const [query, setQuery]           = useState('')
    const [recent, setRecent]         = useState(() => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] } })
    const [results, setResults]       = useState([])
    const [searched, setSearched]     = useState(false)
    const [expandedId, setExpandedId] = useState(null)
    const inputRef = useRef(null)

    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80) }, [])

    useEffect(() => {
        const h = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', h)
        return () => document.removeEventListener('keydown', h)
    }, [onClose])

    const suggestions = query.trim()
        ? SIGN_DB.filter(s => s.word.includes(query) || s.category.includes(query)).map(s => s.word)
        : []

    const doSearch = (text) => {
        const t = text.trim()
        if (!t) return
        const next = [t, ...recent.filter(r => r !== t)].slice(0, 10)
        setRecent(next)
        localStorage.setItem(RECENT_KEY, JSON.stringify(next))
        setQuery(t)
        setResults(SIGN_DB.filter(w => w.word.includes(t) || w.category.includes(t) || w.description.includes(t) || w.related.some(r => r.includes(t))))
        setSearched(true)
        setExpandedId(null)
    }

    const reset = () => { setSearched(false); setResults([]); setQuery(''); setExpandedId(null); inputRef.current?.focus() }
    const removeRecent = (item, e) => { e.stopPropagation(); const next = recent.filter(r => r !== item); setRecent(next); localStorage.setItem(RECENT_KEY, JSON.stringify(next)) }

    return (
        <div className="search-overlay" onClick={onClose}>
            <div className="search-overlay-panel" onClick={e => e.stopPropagation()}>
                <div className="so-input-wrap">
                    <span className="so-lead-icon">🔍</span>
                    <input
                        ref={inputRef}
                        className="so-input"
                        placeholder="수어 단어를 검색하세요..."
                        value={query}
                        onChange={e => { setQuery(e.target.value); if (!e.target.value.trim()) { setSearched(false); setResults([]) } }}
                        onKeyDown={e => { if (e.key === 'Enter') doSearch(query) }}
                    />
                    {query && <button className="so-clear" onClick={reset}>✕</button>}
                    <button className="so-search-btn" onClick={() => doSearch(query)}>검색</button>
                    <button className="so-close-btn" onClick={onClose}>✕ 닫기</button>
                </div>
                <div className="so-body">
                    {!searched && suggestions.length > 0 && (
                        <div className="so-section">
                            {suggestions.map(item => (
                                <div key={item} className="so-sugg-row" onClick={() => doSearch(item)}>
                                    <span className="so-row-icon">🔍</span>
                                    <span className="so-row-text">{item}</span>
                                    <button className="so-fill-btn" onClick={e => { e.stopPropagation(); setQuery(item) }}>↙</button>
                                </div>
                            ))}
                        </div>
                    )}
                    {searched && (
                        <>
                            <div className="so-result-count">"{query}" 검색 결과 {results.length}개</div>
                            {results.length > 0 ? results.map(item => (
                                <div key={item.id} className="so-card">
                                    <div className="so-card-header" onClick={() => setExpandedId(v => v === item.id ? null : item.id)}>
                                        <div className="so-card-left">
                                            <span className="so-card-emoji">{item.emoji}</span>
                                            <div>
                                                <div className="so-card-word">{item.word}</div>
                                                <span className="so-cat-badge">{item.category}</span>
                                            </div>
                                        </div>
                                        <span className="so-chevron">{expandedId === item.id ? '▲' : '▼'}</span>
                                    </div>
                                    <div className="so-card-body">{item.description}</div>
                                    {expandedId === item.id && (
                                        <div className="so-card-detail">
                                            <div className="so-detail-divider"/>
                                            <div className="so-detail-row"><div className="so-detail-icon-wrap">✋</div><div><div className="so-detail-label">손 모양</div><div className="so-detail-value">{item.handShape}</div></div></div>
                                            <div className="so-detail-row"><div className="so-detail-icon-wrap">↔️</div><div><div className="so-detail-label">동작</div><div className="so-detail-value">{item.movement}</div></div></div>
                                            <div className="so-detail-row"><div className="so-detail-icon-wrap">😊</div><div><div className="so-detail-label">표정</div><div className="so-detail-value">{item.expression}</div></div></div>
                                            <div className="so-detail-row so-detail-row-accent"><div className="so-detail-icon-wrap so-detail-icon-accent">💡</div><div><div className="so-detail-label">학습 팁</div><div className="so-detail-value">{item.tips}</div></div></div>
                                            <div className="so-related-wrap">
                                                <div className="so-related-label">관련 단어</div>
                                                <div className="so-related-tags">
                                                    {item.related.map(r => (
                                                        <button key={r} className="so-related-tag" onClick={() => doSearch(r)}>{r}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="so-no-result">
                                    <div className="so-no-result-icon">🔍</div>
                                    <div className="so-no-result-title">"{query}" 검색 결과가 없습니다</div>
                                    <div className="so-no-result-sub">다른 단어로 검색하거나 수어 사전을 이용해 보세요</div>
                                    <button className="so-dict-btn" onClick={() => { onGoDict(query); onClose() }}>수어 사전으로 이동 →</button>
                                </div>
                            )}
                            {results.length > 0 && (
                                <div className="so-dict-banner" onClick={() => { onGoDict(query); onClose() }}>
                                    <div className="so-dict-banner-left">
                                        <span>📖</span>
                                        <div>
                                            <div className="so-dict-banner-title">수어 사전</div>
                                            <div className="so-dict-banner-sub">더 많은 수어를 찾아보세요</div>
                                        </div>
                                    </div>
                                    <span>›</span>
                                </div>
                            )}
                        </>
                    )}
                    {!searched && query.length === 0 && recent.length > 0 && (
                        <div className="so-section">
                            <div className="so-section-header">
                                <span className="so-section-title">최근 검색어</span>
                                <button className="so-clear-all" onClick={() => { setRecent([]); localStorage.removeItem(RECENT_KEY) }}>전체 삭제</button>
                            </div>
                            {recent.map(item => (
                                <div key={item} className="so-recent-row" onClick={() => doSearch(item)}>
                                    <span className="so-row-icon">🕐</span>
                                    <span className="so-row-text">{item}</span>
                                    <button className="so-remove-btn" onClick={(e) => removeRecent(item, e)}>✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                    {!searched && (
                        <div className="so-quick-wrap">
                            <div className="so-quick-title">자주 찾는 수어</div>
                            <div className="so-quick-grid">
                                {SIGN_DB.map(w => (
                                    <button key={w.id} className="so-quick-chip" onClick={() => doSearch(w.word)}>
                                        <span className="so-quick-emoji">{w.emoji}</span>
                                        <span className="so-quick-word">{w.word}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


// ── 메인 App ──
export default function App() {
    const [tab,            setTab]            = useState('home')
    const [showDemo,       setShowDemo]       = useState(false)
    const [showAbout,      setShowAbout]      = useState(false)
    const [searchInput,    setSearchInput]    = useState('')
    const [query,          setQuery]          = useState('')
    const [convMessages,   setConvMessages]   = useState([])
    const [convVideoBlobs, setConvVideoBlobs] = useState([])
    const [convVideos,     setConvVideos]     = useState([])
    const [showConv,       setShowConv]       = useState(false)
    const [registerScreen, setRegisterScreen] = useState(null)
    const [chatInitialRoom, setChatInitialRoom] = useState(null)
    // 인증 상태
    const [authModal,    setAuthModal]    = useState(null)
    const [loggedIn,     setLoggedIn]     = useState(false)
    const [displayName,  setDisplayName]  = useState('')
    const [orgType,      setOrgType]      = useState('')
    const [userEmail,    setUserEmail]    = useState('')
    const [communityProfiles, setCommunityProfiles] = useState([])
    const [userProfile,       setUserProfile]       = useState(null)

    // 알림 상태
    const [notifs,     setNotifs]     = useState(SAMPLE_NOTIFICATIONS)
    const [showNotifs, setShowNotifs] = useState(false)
    const unreadCount = notifs.filter(n => n.unread).length

    // 검색/알림 전체 화면
    const [showSearchOverlay, setShowSearchOverlay] = useState(false)
    const [showSearchPage, setShowSearchPage] = useState(false)
    const [showNotiPage,   setShowNotiPage]   = useState(false)

    // 채팅 / AI 채팅 상태
    const [showChat,        setShowChat]        = useState(false)
    const [showAiChat,      setShowAiChat]      = useState(false)

    // ── ✅ 방별 읽지 않은 메시지 수: { [roomId]: number } ──
    const [unreadByRoom, setUnreadByRoom] = useState({})

    // 전체 읽지 않은 수 (플로팅 버튼 뱃지용)
    const chatUnreadCount = Object.values(unreadByRoom).reduce((s, n) => s + n, 0)

    const [chatToastMessages,  setChatToastMessages]  = useState([])

    // 네비바에 표시할 짧은 이름
    const navLabel = displayName.length > 6 ? displayName.slice(0, 6) + '…' : displayName

    // 새로고침 시 로그인 유지
    useEffect(() => {
        const savedEmail = localStorage.getItem('userEmail');
        const savedName  = localStorage.getItem('displayName');
        const savedType  = localStorage.getItem('orgType');
        if (savedEmail && savedName) {
            setUserEmail(savedEmail);
            setDisplayName(savedName);
            setOrgType(savedType || '');
            setLoggedIn(true);

            // ✅ 현재 로그인 이메일과 다른 이메일로 저장된 deletedAt 키 정리
            // (다른 계정으로 테스트 후 남은 잔여 데이터 제거)
            Object.keys(localStorage)
                .filter(k => k.startsWith('sb_deleted_at_') && !k.endsWith(`_${savedEmail}`))
                .forEach(k => localStorage.removeItem(k))

            // sb_deleted_rooms도 현재 계정 기준으로만 유효하므로
            // 다른 계정 로그인 시 초기화
            const lastEmail = localStorage.getItem('sb_last_email')
            if (lastEmail && lastEmail !== savedEmail) {
                localStorage.removeItem('sb_deleted_rooms')
                localStorage.removeItem('sb_blocked')
            }
            localStorage.setItem('sb_last_email', savedEmail)
        }
    }, []);

    // showChat을 ref로 유지 — useEffect 재구독 없이 최신 값 참조
    const showChatRef = useRef(showChat)
    useEffect(() => { showChatRef.current = showChat }, [showChat])

    const userEmailRef = useRef(userEmail)
    useEffect(() => { userEmailRef.current = userEmail }, [userEmail])

    // ── ✅ 현재 ChatRoom에서 열려 있는 방 ID 목록 (ref로 관리)
    // ChatRoom이 onOpenRoomsChange로 업데이트해 줌
    const openRoomIdsRef = useRef(new Set())
    const handleOpenRoomsChange = (ids) => {
        openRoomIdsRef.current = new Set(ids)
    }

    useEffect(() => {
        chatService.connect('http://localhost:8080')

        const unsub = chatService.onMessage?.((msg) => {
            // 내가 보낸 메시지는 무시
            if (msg?.senderEmail === userEmailRef.current) return

            const roomId = msg?.roomId

            // ── ✅ 카운트 조건:
            //   1) 채팅창이 닫혀 있거나
            //   2) 채팅창이 열려 있어도 해당 방이 현재 열린 채팅 창 목록에 없으면
            const isChatOpen = showChatRef.current
            const isRoomOpen = roomId && openRoomIdsRef.current.has(roomId)

            if (roomId && (!isChatOpen || !isRoomOpen)) {
                setUnreadByRoom(prev => ({
                    ...prev,
                    [roomId]: (prev[roomId] || 0) + 1,
                }))
            }

            // 토스트 알림: 채팅창이 닫혀 있거나 해당 방이 열려 있지 않을 때
            if (!isChatOpen || !isRoomOpen) {
                const id = Date.now()
                const newMsg = {
                    id,
                    roomId,
                    name:   msg.senderName || msg.senderEmail?.split('@')[0] || '?',
                    text:   msg.text || (msg.fileName ? `📎 ${msg.fileName}` : ''),
                    avatar: (msg.senderName || '?').charAt(0).toUpperCase(),
                }
                setChatToastMessages(prev => [newMsg, ...prev].slice(0, 3))
                setTimeout(() => {
                    setChatToastMessages(prev => prev.filter(m => m.id !== id))
                }, 5000)
            }
        })
        return () => { chatService.disconnect(); unsub?.() }
    }, [])

    // ── ✅ 특정 방의 읽지 않은 수 초기화 (ChatRoom에서 방 입장 시 호출) ──
    const handleRoomRead = (roomId) => {
        if (!roomId) return
        setUnreadByRoom(prev => {
            if (!prev[roomId]) return prev
            const next = { ...prev }
            delete next[roomId]
            return next
        })
    }

    // Background subscribe my rooms on login
    useEffect(() => {
        if (!userEmail) return
        chatService.getRooms(userEmail)
            .then(data => {
                if (!Array.isArray(data)) return
                const roomIds = data.map(r => r.roomId || r.id).filter(Boolean)
                chatService.subscribeBackground(roomIds)
            })
            .catch(() => {})
    }, [userEmail])

    // ── 로그인 시 내 프로필 로드 ──
    useEffect(() => {
        if (!userEmail) { setUserProfile(null); return }
        myPageApi.getProfile(userEmail)
            .then(data => { if (data) setUserProfile(data) })
            .catch(() => {})
    }, [userEmail])

    // ── 로그인 시 커뮤니티 프로필 자동 로드 ──
    useEffect(() => {
        if (!userEmail) return
        fetch(`/api/community/members/me?email=${encodeURIComponent(userEmail)}`)
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setCommunityProfiles(data.map(p => ({
                        ...p,
                        avatar: p.name?.charAt(0) || '?',
                        contact: { type: p.contactType, value: p.contactValue },
                    })))
                } else {
                    setCommunityProfiles([])
                }
            })
            .catch(() => {})
    }, [userEmail])

    const handleSearch = (e) => {
        e.preventDefault()
        setQuery(searchInput)
        setShowConv(false)
        setRegisterScreen(null)
        setTab('dict')
    }

    const handleEndConversation = (messages, videoBlob) => {
        setConvMessages(Array.isArray(messages) ? messages : [])
        setRegisterScreen(null)
        if (videoBlob) {
            setConvVideoBlobs(prev => {
                const next = [...prev, videoBlob]
                setTimeout(() => setShowConv(true), 0)
                return next
            })
        } else {
            setShowConv(true)
        }
    }

    const handleBackToTranslate = () => { setShowConv(false); setRegisterScreen(null); setTab('trans') }
    const handleGoRegister = (videos) => {
        if (videos && Array.isArray(videos)) setConvVideos(videos)
        const type = orgType || 'personal'
        setRegisterScreen(`register_${type}`)
    }
    const handleBackToConv  = () => setRegisterScreen(null)
    const handleLogoClick   = () => { setShowConv(false); setRegisterScreen(null); setShowDemo(false); setShowAbout(false); setTab('home'); setQuery('') }

    const handleLogin = (name, type, email) => {
        setDisplayName(name);
        setOrgType(type || '');
        setUserEmail(email || '');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('displayName', name);
        localStorage.setItem('orgType', type || '');
        setLoggedIn(true);
        setAuthModal(null);
    }

    const handleSignup = (name, type) => {
        setDisplayName(name)
        setOrgType(type || '')
    }

    const handleLogout = () => {
        setLoggedIn(false)
        setDisplayName('')
        setOrgType('')
        setUserEmail('')
        setCommunityProfiles([])
        setUnreadByRoom({})  // ✅ 로그아웃 시 뱃지 초기화
        setTab('home')
        localStorage.removeItem('userEmail');
        localStorage.removeItem('displayName');
        localStorage.removeItem('orgType');
        localStorage.removeItem('sb_my_nickname')
        localStorage.removeItem('sb_my_photo')
    }

    const handleMarkAllRead = () => setNotifs(ns => ns.map(n => ({ ...n, unread: false })))

    const handleQuickChat = () => {
        if (!loggedIn) {
            setAuthModal('login')
        } else {
            setShowChat(true)
            // ✅ 채팅창 열 때 전체 뱃지 초기화 (방 입장하면 handleRoomRead로 개별 초기화)
        }
    }

    const handleCommunityChat = (room) => {
        const iAmB = room.sub === userEmail

        const otherName   = iAmB ? room.nameA  : room.name
        const otherAvatar = iAmB ? room.avatarA : room.avatar
        const otherEmail  = iAmB
            ? room.participants?.split(',').map(e => e.trim()).find(e => e !== userEmail)
            : room.sub

        const normalized = {
            ...room,
            id:     room.roomId || room.id,
            name:   otherName   || otherEmail,
            avatar: otherAvatar || (otherName ? otherName.charAt(0) : '?'),
            sub:    otherEmail,
        }

        setChatInitialRoom(normalized)
        setShowChat(true)
    }

    const handleQuickCall   = () => alert('전화 연결 기능은 준비 중입니다.')
    const handleQuickAiChat = () => setShowAiChat(v => !v)

    const renderMain = () => {
        if (showSearchPage) return (
            <SearchPage
                onBack={() => setShowSearchPage(false)}
                onGoDict={(q) => { setQuery(q); setSearchInput(q); setShowConv(false); setRegisterScreen(null); setShowSearchPage(false); setTab('dict') }}
            />
        )
        if (showNotiPage) return (
            <NotiPage
                notifications={notifs}
                setNotifications={setNotifs}
                onBack={() => setShowNotiPage(false)}
            />
        )
        if (registerScreen === 'register_personal')    return <RegisterPersonal    messages={convMessages} videos={convVideos} onBack={() => { setRegisterScreen(null); setShowConv(false); setConvMessages([]); setConvVideoBlobs([]); setConvVideos([]); setTab('mypage') }} userEmail={userEmail} displayName={displayName} />
        if (registerScreen === 'register_immigration') return <RegisterImmigration messages={convMessages} videos={convVideos} onBack={() => { setRegisterScreen(null); setShowConv(false); setConvMessages([]); setConvVideoBlobs([]); setConvVideos([]); setTab('mypage') }} userEmail={userEmail} displayName={displayName} />
        if (registerScreen === 'register_police')      return <RegisterPolice      messages={convMessages} videos={convVideos} onBack={() => { setRegisterScreen(null); setShowConv(false); setConvMessages([]); setConvVideoBlobs([]); setConvVideos([]); setTab('mypage') }} userEmail={userEmail} displayName={displayName} />
        if (showConv)  return <ConversationPage messages={convMessages} videoBlobs={convVideoBlobs} onBack={handleBackToTranslate} onRegister={handleGoRegister} orgType={orgType} userEmail={userEmail} place={orgType || 'immigration'} onVideosChange={setConvVideos} />
        if (showDemo)  return <DemoPage  onBack={() => { setShowDemo(false); setTab('home') }} />
        if (showAbout) return <About onBack={() => { setShowAbout(false); setTab('home') }} />
        if (tab === 'home')      return <Home onDemo={() => setShowDemo(true)} onAbout={() => setShowAbout(true)} onCommunity={() => setTab('community')} onPractice={() => setTab('practice')} onTranslate={() => setTab('trans')} />
        if (tab === 'practice')  return <Practice />
        if (tab === 'trans')     return <TranslatePage onEndConversation={handleEndConversation} place={orgType || 'immigration'} userEmail={userEmail} initialMessages={convMessages} onLoginRequired={() => setAuthModal('login')} />
        if (tab === 'dict')      return <DictPage query={query} />
        if (tab === 'community') return (
            <Community
                userEmail={userEmail}
                displayName={displayName}
                onLoginRequired={() => setAuthModal('login')}
                myProfiles={communityProfiles}
                onProfilesChange={setCommunityProfiles}
                onChat={handleCommunityChat}
            />
        )
        if (tab === 'about') return <About onBack={() => setTab('home')} />
        if (tab === 'my') return (
            <MyPage
                displayName={displayName}
                orgType={orgType}
                userEmail={userEmail}
                communityProfiles={communityProfiles}
                onCommunityProfilesChange={setCommunityProfiles}
            />
        )
        return null
    }

    const isNormalTab = !showConv && !registerScreen && !showDemo && !showAbout

    return (
        <div className="app">
            {/* ── 네비바 ── */}
            {!showSearchPage && !showNotiPage && <header className="navbar">
                <div className="navbar-top">
                    <div className="nav-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
                        <img src={SignBridgeLogo} alt="SignBridge" className="nav-logo-icon" />
                        <span className="nav-logo-text">SignBridge</span>
                    </div>

                    <div className="nav-actions">
                        <button className="search-form search-form-btn" onClick={() => { setShowConv(false); setRegisterScreen(null); setShowDemo(false); setShowAbout(false); setShowNotiPage(false); setShowSearchPage(true) }}>
                            <span className="search-input-placeholder">수어 검색...</span>
                            <span className="search-btn">🔍</span>
                        </button>

                        <div className="notif-wrap">
                            <button className={`notif-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                                    onClick={() => { setShowConv(false); setRegisterScreen(null); setShowDemo(false); setShowAbout(false); setShowSearchPage(false); setShowNotiPage(true) }} title="알림">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                                </svg>
                                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                            </button>
                        </div>

                        {loggedIn ? (
                            <div className="nav-user-group">
                                <button className="my-btn"
                                        onClick={() => { setShowConv(false); setRegisterScreen(null); setShowDemo(false); setShowAbout(false); setTab('my') }}>
                                    <div className="my-avatar">{displayName.charAt(0)}</div>
                                    <span>{navLabel}</span>
                                </button>
                                <button className="nav-logout-btn" onClick={handleLogout}>로그아웃</button>
                            </div>
                        ) : (
                            <div className="nav-auth-group">
                                <button className="nav-login-btn"  onClick={() => setAuthModal('login')}>로그인</button>
                                <button className="nav-signup-btn" onClick={() => setAuthModal('signup')}>회원가입</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="navbar-bottom">
                    <nav className="navbar-bottom-inner">
                        {MENUS.map(m => (
                            <button key={m.id}
                                    className={`nav-menu-btn ${(isNormalTab && tab === m.id) || (showAbout && m.id === 'about') ? 'active' : ''}`}
                                    onClick={() => { setShowConv(false); setRegisterScreen(null); setShowDemo(false); setShowAbout(false); setTab(m.id); setQuery('') }}>
                                {m.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>}

            {/* ── 본문 ── */}
            <main className="main-content">{renderMain()}</main>

            {/* ── 푸터 ── */}
            <footer className="footer">
                <span className="footer-logo"><img src={SignBridgeLogo} alt="SignBridge" className="footer-logo-icon" />SignBridge</span>
                <span>© 2025 SignBridge Team · AI 수어 번역 시스템</span>
            </footer>

            {/* ── 플로팅 사이드바 ── */}
            <FloatingSidebar
                onChat={handleQuickChat}
                onCall={handleQuickCall}
                onAiChat={handleQuickAiChat}
                chatUnread={chatUnreadCount}
                toastMessages={chatToastMessages}
                onToastClick={() => {
                    setChatToastMessages([])
                    handleQuickChat()
                }}
            />

            {/* 검색 오버레이 */}
            {showSearchOverlay && (
                <SearchOverlay
                    onClose={() => setShowSearchOverlay(false)}
                    onGoDict={(q) => { setQuery(q); setSearchInput(q); setShowConv(false); setRegisterScreen(null); setTab('dict') }}
                />
            )}

            {showChat && createPortal(
                <ChatRoom
                    onClose={() => { setShowChat(false); setChatInitialRoom(null); openRoomIdsRef.current = new Set() }}
                    myEmail={userEmail}
                    myName={displayName}
                    initialRoom={chatInitialRoom}
                    profile={userProfile}
                    // ── ✅ 방별 읽지 않은 수 + 방 입장 콜백 전달 ──
                    unreadByRoom={unreadByRoom}
                    onRoomRead={handleRoomRead}
                    // ── ✅ 현재 열린 채팅 방 목록 동기화 ──
                    onOpenRoomsChange={handleOpenRoomsChange}
                />,
                document.body
            )}

            {/* AI 채팅 창 */}
            {showAiChat && (
                <AIChat
                    onClose={() => setShowAiChat(false)}
                    loggedIn={loggedIn}
                    displayName={displayName}
                />
            )}

            {/* 로그인 모달 */}
            {authModal === 'login' && (
                <LoginPage
                    displayName={displayName}
                    orgType={orgType}
                    onLogin={handleLogin}
                    onClose={() => setAuthModal(null)}
                    onSwitchToSignup={() => setAuthModal('signup')}
                />
            )}

            {/* 회원가입 모달 */}
            {authModal === 'signup' && (
                <SignupPage
                    onSignup={handleSignup}
                    onClose={() => setAuthModal(null)}
                    onSwitchToLogin={() => setAuthModal('login')}
                />
            )}
        </div>
    )
}