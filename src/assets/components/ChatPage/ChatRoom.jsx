import { useState, useEffect, useRef, useCallback } from 'react'
import './ChatRoom.css'

// ── localStorage helpers ──
const ROOMS_KEY   = 'sb_chat_rooms'
const NICK_KEY    = 'sb_my_nickname'
const PHOTO_KEY   = 'sb_my_photo'
const typingKey   = (id) => `sb_typing_${id}`
const msgsKey     = (id) => `sb_chat_msgs_${id}`
const pinnedKey   = (id) => `sb_pinned_${id}`

const load  = (k, fb) => { try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? fb } catch { return fb } }
const save  = (k, v)  => localStorage.setItem(k, JSON.stringify(v))
const loadM = (id)    => load(msgsKey(id), [])
const saveM = (id, m) => save(msgsKey(id), m)

const EMOJI_REACTIONS = ['👍','❤️','😂','😮','😢','🎉','🔥','🙏']
const AVATAR_EMOJIS   = ['😊','🐱','🐸','🌸','⚡','🎵','🏄','🦋','🌊','🔥','🎯','🍀']

const fmtTime   = (iso) => new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
const fmtDate   = (iso) => {
    const d = new Date(iso), today = new Date()
    const diff = Math.floor((today - d) / 86400000)
    if (diff === 0) return '오늘'
    if (diff === 1) return '어제'
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}
const fmtRecent = (iso) => {
    if (!iso) return ''
    const d = new Date(iso), today = new Date()
    const diff = Math.floor((today - d) / 86400000)
    if (diff === 0) return fmtTime(iso)
    if (diff === 1) return '어제'
    return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
}
const fmtFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Drag hook ──
function useDrag(init) {
    const [pos, setPos] = useState(init)
    const drag = useRef(false)
    const off  = useRef({ x: 0, y: 0 })
    const onMouseDown = (e) => {
        if (e.target.closest('.nd')) return
        drag.current = true
        off.current  = { x: e.clientX - pos.x, y: e.clientY - pos.y }
        e.preventDefault()
    }
    useEffect(() => {
        const mv = (e) => { if (drag.current) setPos({ x: e.clientX - off.current.x, y: e.clientY - off.current.y }) }
        const up = () => { drag.current = false }
        window.addEventListener('mousemove', mv)
        window.addEventListener('mouseup',   up)
        return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up) }
    }, [])
    return { pos, onMouseDown }
}

// ── SVG Icons ──
const IconUser   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
const IconChat   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
const IconSearch = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IconSend   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
const IconPin    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
const IconReply  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
const IconPaperclip = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
const IconX      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconCheck  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="10" height="10"><polyline points="20 6 9 17 4 12"/></svg>
const IconChecks = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><polyline points="17 1 9 17 4 12"/><polyline points="23 1 15 17"/></svg>
const IconMsgSearch = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>

// ══════════════════════════════════════════════
//  PROFILE EDIT MODAL
// ══════════════════════════════════════════════
function ProfileEditModal({ nickname, photo, myName, onSave, onClose }) {
    const [nickInput,  setNickInput]  = useState(nickname)
    const [photoInput, setPhotoInput] = useState(photo || '')
    const fileRef = useRef(null)
    const handleSave = () => onSave({ nickname: nickInput.trim() || myName, photo: photoInput })
    return (
        <div className="ci-modal-overlay nd" onClick={onClose}>
            <div className="ci-modal nd" onClick={e => e.stopPropagation()}>
                <div className="ci-modal-hd">
                    <span>프로필 편집</span>
                    <button className="ci-modal-close nd" onClick={onClose}>✕</button>
                </div>
                <div className="ci-modal-body">
                    <div className="ci-modal-av-wrap">
                        <div className="ci-modal-av" onClick={() => fileRef.current?.click()}>
                            {photoInput ? <span className="ci-modal-av-emoji">{photoInput}</span> : <span>{(nickname||myName||'?').charAt(0)}</span>}
                            <div className="ci-modal-av-overlay">📷</div>
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={() => {}}/>
                        <div className="ci-modal-av-hint">클릭하여 사진 변경</div>
                    </div>
                    <div className="ci-modal-section-label">이모지 아바타</div>
                    <div className="ci-emoji-grid">
                        {AVATAR_EMOJIS.map(e => (
                            <button key={e} className={`ci-emoji-opt nd ${photoInput===e?'selected':''}`}
                                onClick={() => setPhotoInput(photoInput===e?'':e)}>{e}</button>
                        ))}
                        {photoInput && <button className="ci-emoji-opt ci-emoji-clear nd" onClick={() => setPhotoInput('')}>✕</button>}
                    </div>
                    <div className="ci-modal-field">
                        <label className="ci-modal-label">닉네임</label>
                        <input className="ci-modal-input nd" value={nickInput}
                            onChange={e => setNickInput(e.target.value)}
                            onKeyDown={e => { if (e.key==='Enter') handleSave() }}
                            placeholder="닉네임 입력"/>
                    </div>
                    <button className="ci-modal-save nd" onClick={handleSave}>저장하기</button>
                </div>
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════
//  TYPING INDICATOR  (reads from localStorage)
// ══════════════════════════════════════════════
function TypingIndicator({ roomId, myEmail }) {
    const [typers, setTypers] = useState([])
    useEffect(() => {
        const check = () => {
            const data = load(typingKey(roomId), {})
            const now  = Date.now()
            const active = Object.entries(data)
                .filter(([email, ts]) => email !== myEmail && now - ts < 4000)
                .map(([email]) => email)
            setTypers(active)
        }
        check()
        const id = setInterval(check, 800)
        return () => clearInterval(id)
    }, [roomId, myEmail])
    if (typers.length === 0) return null
    return (
        <div className="cw-typing">
            <div className="cw-typing-av">{typers[0].charAt(0).toUpperCase()}</div>
            <div className="cw-typing-dots">
                <span/><span/><span/>
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════
//  PINNED MESSAGE BAR
// ══════════════════════════════════════════════
function PinnedBar({ pinned, onJump, onUnpin }) {
    if (!pinned) return null
    return (
        <div className="cw-pinned-bar nd">
            <span className="cw-pinned-icon"><IconPin/></span>
            <div className="cw-pinned-text" onClick={onJump}>
                <span className="cw-pinned-label">고정된 메시지</span>
                <span className="cw-pinned-preview">{pinned.text || (pinned.fileName ? `📎 ${pinned.fileName}` : '')}</span>
            </div>
            <button className="cw-pinned-close nd" onClick={onUnpin}><IconX/></button>
        </div>
    )
}

// ══════════════════════════════════════════════
//  MESSAGE SEARCH PANEL
// ══════════════════════════════════════════════
function MsgSearchPanel({ messages, onJump, onClose }) {
    const [q, setQ] = useState('')
    const results = q.trim()
        ? messages.filter(m => (m.text||m.fileName||'').toLowerCase().includes(q.toLowerCase()))
        : []
    return (
        <div className="cw-msgsearch nd">
            <div className="cw-msgsearch-hd">
                <span className="cw-msgsearch-title">메시지 검색</span>
                <button className="cw-msgsearch-close nd" onClick={onClose}><IconX/></button>
            </div>
            <div className="cw-msgsearch-input-wrap">
                <IconSearch/>
                <input className="cw-msgsearch-input nd" autoFocus
                    placeholder="검색어 입력..."
                    value={q} onChange={e => setQ(e.target.value)}/>
            </div>
            <div className="cw-msgsearch-results">
                {q.trim() && results.length === 0 && (
                    <div className="cw-msgsearch-empty">결과 없음</div>
                )}
                {results.map(m => (
                    <div key={m.id} className="cw-msgsearch-row" onClick={() => { onJump(m.id); onClose() }}>
                        <div className="cw-msgsearch-who">{m.name}</div>
                        <div className="cw-msgsearch-snippet">
                            {(m.text||m.fileName||'').replace(
                                new RegExp(`(${q})`, 'gi'),
                                (match) => `__MARK__${match}__ENDMARK__`
                            ).split('__MARK__').map((part, i) =>
                                part.startsWith('') && i === 0
                                    ? part.replace('__ENDMARK__','')
                                    : part.includes('__ENDMARK__')
                                        ? <mark key={i}>{part.replace('__ENDMARK__','')}</mark>
                                        : part
                            )}
                        </div>
                        <div className="cw-msgsearch-time">{fmtTime(m.at)}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════
//  SWIPE ROW WRAPPER
//  Swipe right → reply, swipe left → pin
// ══════════════════════════════════════════════
function SwipeRow({ children, onReply, onPin, isMe }) {
    const ref       = useRef(null)
    const startX    = useRef(null)
    const [dx, setDx]         = useState(0)
    const [swiping, setSwiping] = useState(false)
    const [action,  setAction]  = useState(null) // 'reply' | 'pin' | null

    const onTouchStart = (e) => {
        startX.current = e.touches[0].clientX
        setSwiping(true); setAction(null)
    }
    const onTouchMove  = (e) => {
        if (startX.current === null) return
        const d = e.touches[0].clientX - startX.current
        const clamped = Math.max(-80, Math.min(80, d))
        setDx(clamped)
        if (clamped > 40)  setAction('reply')
        else if (clamped < -40) setAction('pin')
        else setAction(null)
    }
    const onTouchEnd   = () => {
        if (action === 'reply') onReply?.()
        if (action === 'pin')   onPin?.()
        setDx(0); setSwiping(false); setAction(null)
        startX.current = null
    }

    return (
        <div ref={ref} className={`cw-swipe-row ${action?`cw-swipe-${action}`:''}`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ transform: swiping ? `translateX(${dx}px)` : undefined }}
        >
            {action === 'reply' && <div className="cw-swipe-hint cw-swipe-hint-reply"><IconReply/></div>}
            {action === 'pin'   && <div className="cw-swipe-hint cw-swipe-hint-pin"><IconPin/></div>}
            {children}
        </div>
    )
}

// ══════════════════════════════════════════════
//  CHAT WINDOW  560 × 700
// ══════════════════════════════════════════════
function ChatWindow({ room, myEmail, myName, myPhoto, onClose }) {
    const [messages,    setMessages]    = useState(() => loadM(room.id))
    const [input,       setInput]       = useState('')
    const [reacting,    setReacting]    = useState(null)   // msgId showing picker
    const [replyTo,     setReplyTo]     = useState(null)   // { id, name, text, fileName }
    const [pinned,      setPinned]      = useState(() => load(pinnedKey(room.id), null))
    const [showSearch,  setShowSearch]  = useState(false)
    const [searchOpen,  setSearchOpen]  = useState(false)
    const bottomRef    = useRef(null)
    const msgRefs      = useRef({})        // id → DOM node, for jump-to
    const fileRef      = useRef(null)
    const typingTimer  = useRef(null)
    const { pos, onMouseDown } = useDrag({
        x: Math.max(0, window.innerWidth  - 600),
        y: Math.max(0, window.innerHeight - 740),
    })

    // Scroll to bottom on new messages
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    // Listen for storage changes (multi-tab / other window)
    useEffect(() => {
        const h = () => {
            setMessages(loadM(room.id))
            setPinned(load(pinnedKey(room.id), null))
        }
        window.addEventListener('storage', h)
        return () => window.removeEventListener('storage', h)
    }, [room.id])

    // Broadcast typing
    const broadcastTyping = () => {
        const data = load(typingKey(room.id), {})
        data[myEmail] = Date.now()
        save(typingKey(room.id), data)
        clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => {
            const d = load(typingKey(room.id), {})
            delete d[myEmail]
            save(typingKey(room.id), d)
        }, 3000)
    }

    // ── Send text message ──
    const send = () => {
        const text = input.trim(); if (!text) return
        const msg = {
            id: Date.now(), email: myEmail, name: myName, text,
            at: new Date().toISOString(),
            reactions: {},   // { email: emoji }  — 1 per user
            status: 'sent',  // 'sent' | 'delivered' | 'read'
            replyTo: replyTo ? { id: replyTo.id, name: replyTo.name, text: replyTo.text, fileName: replyTo.fileName } : null,
        }
        const updated = [...messages, msg]
        setMessages(updated); saveM(room.id, updated)
        // Update room list
        const rooms = load(ROOMS_KEY, [])
        const idx = rooms.findIndex(r => r.id === room.id)
        if (idx !== -1) { rooms[idx].lastMsg = text; rooms[idx].lastAt = msg.at; save(ROOMS_KEY, rooms) }
        setInput(''); setReplyTo(null)
        // Clear typing
        const d = load(typingKey(room.id), {})
        delete d[myEmail]; save(typingKey(room.id), d)
    }

    // ── Send file/image ──
    const sendFile = (file) => {
        const isImage = file.type.startsWith('image/')
        const reader  = new FileReader()
        reader.onload = (e) => {
            const msg = {
                id: Date.now(), email: myEmail, name: myName,
                at: new Date().toISOString(),
                reactions: {}, status: 'sent',
                replyTo: replyTo ? { id: replyTo.id, name: replyTo.name, text: replyTo.text, fileName: replyTo.fileName } : null,
                ...(isImage
                    ? { imageData: e.target.result, fileName: file.name, fileSize: file.size }
                    : { fileName: file.name, fileSize: file.size, fileType: file.type }
                ),
            }
            const updated = [...messages, msg]
            setMessages(updated); saveM(room.id, updated)
            const rooms = load(ROOMS_KEY, [])
            const idx = rooms.findIndex(r => r.id === room.id)
            if (idx !== -1) {
                rooms[idx].lastMsg = isImage ? `📷 ${file.name}` : `📎 ${file.name}`
                rooms[idx].lastAt  = msg.at
                save(ROOMS_KEY, rooms)
            }
            setReplyTo(null)
        }
        reader.readAsDataURL(file)
    }

    // ── React: 1 emoji per user, can change ──
    // reactions = { [userEmail]: emoji }
    const addReaction = (msgId, emoji) => {
        setMessages(prev => {
            const updated = prev.map(m => {
                if (m.id !== msgId) return m
                // Migrate old array/count format if needed
                const r = {}
                Object.entries(m.reactions || {}).forEach(([k, v]) => {
                    if (typeof v === 'string') r[k] = v          // already new format
                    // skip old array/number formats
                })
                if (r[myEmail] === emoji) {
                    delete r[myEmail]   // toggle off same emoji
                } else {
                    r[myEmail] = emoji  // set or change
                }
                return { ...m, reactions: r }
            })
            saveM(room.id, updated)
            return updated
        })
        setReacting(null)
    }

    // Aggregate reactions for display: { emoji: count }
    const aggregateReactions = (reactions) => {
        const agg = {}
        Object.values(reactions || {}).forEach(e => { agg[e] = (agg[e] || 0) + 1 })
        return Object.entries(agg).filter(([,c]) => c > 0)
    }

    // ── Pin message ──
    const pinMessage = (msg) => {
        const p = { id: msg.id, text: msg.text, fileName: msg.fileName, name: msg.name }
        setPinned(p); save(pinnedKey(room.id), p)
    }
    const unpinMessage = () => {
        setPinned(null); save(pinnedKey(room.id), null)
    }
    const jumpToMsg = (id) => {
        const el = msgRefs.current[id]
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    const onKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
    }

    // ── Render messages ──
    let lastDate = null
    const rows = messages.map(msg => {
        const isMe = msg.email === myEmail
        const dl   = fmtDate(msg.at)
        const showDt = dl !== lastDate; lastDate = dl
        const aggReactions = aggregateReactions(msg.reactions)
        const myReaction   = (msg.reactions || {})[myEmail]
        const isPinned     = pinned?.id === msg.id

        return (
            <div key={msg.id} ref={el => { if (el) msgRefs.current[msg.id] = el }}>
                {showDt && <div className="cw-date-div"><span>{dl}</span></div>}
                <SwipeRow
                    onReply={() => setReplyTo({ id: msg.id, name: msg.name, text: msg.text, fileName: msg.fileName })}
                    onPin={() => pinMessage(msg)}
                    isMe={isMe}
                >
                    <div
                        className={`cw-row ${isMe ? 'cw-me' : 'cw-them'} ${isPinned ? 'cw-row-pinned' : ''}`}
                        onMouseLeave={() => setReacting(null)}
                    >
                        {!isMe && <div className="cw-avatar">{(msg.name||'?').charAt(0)}</div>}
                        <div className="cw-bwrap">
                            {!isMe && <div className="cw-sender">{msg.name}</div>}

                            {/* Reply preview */}
                            {msg.replyTo && (
                                <div className={`cw-reply-preview ${isMe?'cw-reply-me':'cw-reply-them'}`}
                                    onClick={() => jumpToMsg(msg.replyTo.id)}>
                                    <div className="cw-reply-name">{msg.replyTo.name}</div>
                                    <div className="cw-reply-text">
                                        {msg.replyTo.fileName ? `📎 ${msg.replyTo.fileName}` : msg.replyTo.text}
                                    </div>
                                </div>
                            )}

                            <div className="cw-brow">
                                {isMe && (
                                    <div className="cw-meta">
                                        <span className="cw-time">{fmtTime(msg.at)}</span>
                                        <span className={`cw-status cw-status-${msg.status||'sent'}`}>
                                            {msg.status === 'read' ? <IconChecks/> : <IconCheck/>}
                                        </span>
                                    </div>
                                )}
                                <div className="cw-bubble-wrap">
                                    {/* Bubble: text, image, or file */}
                                    <div className="cw-bubble">
                                        {msg.imageData ? (
                                            <div className="cw-img-wrap">
                                                <img src={msg.imageData} alt={msg.fileName} className="cw-img"/>
                                                <div className="cw-img-name">{msg.fileName}</div>
                                            </div>
                                        ) : msg.fileName ? (
                                            <div className="cw-file">
                                                <div className="cw-file-icon">📎</div>
                                                <div className="cw-file-info">
                                                    <div className="cw-file-name">{msg.fileName}</div>
                                                    {msg.fileSize && <div className="cw-file-size">{fmtFileSize(msg.fileSize)}</div>}
                                                </div>
                                            </div>
                                        ) : msg.text}
                                    </div>

                                    {/* Context buttons: emoji + reply + pin */}
                                    <div className={`cw-ctx-btns nd ${isMe?'cw-ctx-left':'cw-ctx-right'}`}>
                                        <button className="cw-ctx-btn nd"
                                            onClick={() => setReacting(reacting===msg.id ? null : msg.id)}>
                                            {myReaction || '😊'}
                                        </button>
                                        <button className="cw-ctx-btn nd"
                                            title="답장"
                                            onClick={() => setReplyTo({ id: msg.id, name: msg.name, text: msg.text, fileName: msg.fileName })}>
                                            <IconReply/>
                                        </button>
                                        <button className={`cw-ctx-btn nd ${isPinned?'cw-ctx-pinned':''}`}
                                            title={isPinned ? '고정 해제' : '고정'}
                                            onClick={() => isPinned ? unpinMessage() : pinMessage(msg)}>
                                            <IconPin/>
                                        </button>
                                    </div>

                                    {reacting === msg.id && (
                                        <div className={`cw-emoji-picker nd ${isMe?'picker-left':'picker-right'}`}>
                                            {EMOJI_REACTIONS.map(e => (
                                                <button key={e}
                                                    className={`cw-emoji-btn nd ${myReaction===e?'cw-emoji-mine':''}`}
                                                    onClick={() => addReaction(msg.id, e)}>{e}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {!isMe && <span className="cw-time">{fmtTime(msg.at)}</span>}
                            </div>

                            {/* Aggregated reaction chips */}
                            {aggReactions.length > 0 && (
                                <div className={`cw-reactions ${isMe?'reactions-left':'reactions-right'}`}>
                                    {aggReactions.map(([e, count]) => (
                                        <span key={e}
                                            className={`cw-reaction-chip nd ${myReaction===e?'cw-reaction-mine':''}`}
                                            onClick={() => addReaction(msg.id, e)}
                                            title={Object.entries(msg.reactions||{}).filter(([,v])=>v===e).map(([k])=>k).join(', ')}
                                        >{e} {count}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </SwipeRow>
            </div>
        )
    })

    return (
        <div className="cw-window" style={{ left: pos.x, top: pos.y }}>
            {/* Header */}
            <div className="cw-header" onMouseDown={onMouseDown}>
                <div className="cw-header-left">
                    <div className="cw-av-sm">{room.avatar}</div>
                    <div>
                        <div className="cw-hname">{room.name}</div>
                        <div className="cw-hsub">{room.sub}</div>
                    </div>
                </div>
                <div className="cw-header-actions nd">
                    <button className={`cw-hbtn nd ${showSearch?'cw-hbtn-active':''}`}
                        onClick={() => setShowSearch(v => !v)} title="메시지 검색">
                        <IconMsgSearch/>
                    </button>
                    <button className="cw-hclose nd" onClick={onClose}>✕</button>
                </div>
            </div>

            {/* Message search panel */}
            {showSearch && (
                <MsgSearchPanel
                    messages={messages}
                    onJump={jumpToMsg}
                    onClose={() => setShowSearch(false)}
                />
            )}

            {/* Pinned bar */}
            <PinnedBar
                pinned={pinned}
                onJump={() => jumpToMsg(pinned.id)}
                onUnpin={unpinMessage}
            />

            {/* Messages */}
            <div className="cw-messages">
                {rows.length === 0 && (
                    <div className="cw-empty">
                        <div className="cw-empty-av">{room.avatar}</div>
                        <div className="cw-empty-name">{room.name}</div>
                        <div className="cw-empty-sub">{room.sub}</div>
                        <div className="cw-empty-hint">첫 메시지를 보내보세요 👋</div>
                    </div>
                )}
                {rows}
                <TypingIndicator roomId={room.id} myEmail={myEmail}/>
                <div ref={bottomRef}/>
            </div>

            {/* Reply banner */}
            {replyTo && (
                <div className="cw-reply-bar nd">
                    <div className="cw-reply-bar-content">
                        <IconReply/>
                        <div className="cw-reply-bar-info">
                            <span className="cw-reply-bar-name">{replyTo.name}에게 답장</span>
                            <span className="cw-reply-bar-text">
                                {replyTo.fileName ? `📎 ${replyTo.fileName}` : replyTo.text}
                            </span>
                        </div>
                    </div>
                    <button className="cw-reply-bar-close nd" onClick={() => setReplyTo(null)}><IconX/></button>
                </div>
            )}

            {/* Input */}
            <div className="cw-input-row nd">
                <button className="cw-attach-btn nd" onClick={() => fileRef.current?.click()} title="파일 첨부">
                    <IconPaperclip/>
                </button>
                <input ref={fileRef} type="file" accept="image/*,*/*" style={{display:'none'}}
                    onChange={e => { const f = e.target.files?.[0]; if (f) sendFile(f); e.target.value='' }}/>
                <textarea
                    className="cw-input"
                    placeholder="메시지를 입력하세요… (Enter 전송)"
                    value={input}
                    onChange={e => { setInput(e.target.value); broadcastTyping() }}
                    onKeyDown={onKey}
                    rows={1}
                />
                <button className="cw-send nd" onClick={send} disabled={!input.trim()}>
                    <IconSend/>
                </button>
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════
//  INBOX — side rail layout
// ══════════════════════════════════════════════
export default function ChatRoom({ onClose, myEmail = '', myName = '', profile = null }) {
    const [rooms,          setRooms]         = useState(() => load(ROOMS_KEY, []))
    const [openRooms,      setOpenRooms]      = useState([])
    const [tab,            setTab]            = useState('chats')
    const [search,         setSearch]         = useState('')
    const [chatFilter,     setChatFilter]     = useState('all')
    const [nickname,       setNickname]       = useState(() => localStorage.getItem(NICK_KEY) || myName)
    const [photo,          setPhoto]          = useState(() => localStorage.getItem(PHOTO_KEY) || '')
    const [showPhotoModal, setShowPhotoModal] = useState(false)

    // Room-row swipe state
    const [swipedRoom,   setSwipedRoom]   = useState(null)  // roomId being swiped
    const swipeStartX    = useRef(null)

    const { pos, onMouseDown } = useDrag({
        x: Math.max(0, window.innerWidth  - 540),
        y: Math.max(0, window.innerHeight - 780),
    })

    const handleProfileSave = ({ nickname: nick, photo: ph }) => {
        setNickname(nick); setPhoto(ph)
        localStorage.setItem(NICK_KEY, nick)
        localStorage.setItem(PHOTO_KEY, ph)
        setShowPhotoModal(false)
    }

    const openChat = (room) =>
        setOpenRooms(prev => prev.find(r => r.id === room.id) ? prev : [...prev, room])

    const deleteRoom = (roomId) => {
        const updated = rooms.filter(r => r.id !== roomId)
        setRooms(updated); save(ROOMS_KEY, updated)
        setOpenRooms(prev => prev.filter(r => r.id !== roomId))
        setSwipedRoom(null)
    }

    const muteRoom = (roomId) => {
        const updated = rooms.map(r => r.id === roomId ? {...r, muted: !r.muted} : r)
        setRooms(updated); save(ROOMS_KEY, updated)
        setSwipedRoom(null)
    }

    const markRead = (roomId) => {
        const updated = rooms.map(r => r.id === roomId ? {...r, unread: 0} : r)
        setRooms(updated); save(ROOMS_KEY, updated)
        setSwipedRoom(null)
    }

    // Room row swipe handlers (desktop mouse + touch)
    const onRoomSwipeStart = (e, roomId) => {
        swipeStartX.current = e.touches?.[0]?.clientX ?? e.clientX
    }
    const onRoomSwipeEnd = (e, roomId) => {
        if (swipeStartX.current === null) return
        const endX = e.changedTouches?.[0]?.clientX ?? e.clientX
        const dx   = endX - swipeStartX.current
        swipeStartX.current = null
        if (dx < -50) setSwipedRoom(roomId)   // swipe left → show actions
        else if (dx > 30) setSwipedRoom(null)  // swipe right → close
    }

    const unreadTotal = rooms.reduce((s, r) => s + (r.unread || 0), 0)

    const filteredRooms = rooms.filter(r => {
        const matchSearch = r.name.includes(search) || (r.lastMsg||'').includes(search)
        const matchFilter = chatFilter==='all' || (chatFilter==='unread' && r.unread > 0)
        return matchSearch && matchFilter
    })

    const displayName  = profile?.name  || nickname || myName || '사용자'
    const displayEmail = profile?.email || myEmail  || '-'
    const joined = profile?.joinedAt ? new Date(profile.joinedAt).toLocaleDateString('ko-KR') : '-'

    return (
        <>
        <div className="ci-window" style={{ left: pos.x, top: pos.y }}>

            {/* ════════ SIDE RAIL ════════ */}
            <div className="ci-rail nd">
                <div className="ci-rail-logo">
                    <img src="/SignBridge.png" alt="SB" className="ci-rail-logo-img"
                         onError={e => { e.target.style.display='none'; e.target.nextElementSibling.style.display='flex' }}/>
                    <div className="ci-rail-logo-fallback" style={{display:'none'}}>🤟</div>
                </div>

                <nav className="ci-rail-nav">
                    <button className={`ci-rail-tab nd ${tab==='profile'?'active':''}`}
                        onClick={() => setTab('profile')} title="프로필">
                        <IconUser/>
                        <span className="ci-rail-tab-label">프로필</span>
                    </button>
                    <button className={`ci-rail-tab nd ${tab==='chats'?'active':''}`}
                        onClick={() => setTab('chats')} title="채팅">
                        <span className="ci-rail-tab-icon-wrap">
                            <IconChat/>
                            {unreadTotal > 0 && <span className="ci-rail-badge">{unreadTotal}</span>}
                        </span>
                        <span className="ci-rail-tab-label">채팅</span>
                    </button>
                </nav>

                <div className="ci-rail-bottom">
                    <button className="ci-rail-av-btn nd" onClick={() => setShowPhotoModal(true)} title="프로필 편집">
                        <div className="ci-rail-av">
                            {photo ? <span style={{fontSize:22}}>{photo}</span> : <span>{displayName.charAt(0)}</span>}
                        </div>
                    </button>
                </div>
            </div>

            {/* ════════ MAIN CONTENT ════════ */}
            <div className="ci-main">

                {/* ── 프로필 탭 ── */}
                {tab === 'profile' && (
                    <div className="ci-pane">
                        <div className="ci-pane-hd" onMouseDown={onMouseDown}>
                            <span className="ci-pane-title">내 프로필</span>
                            <button className="ci-pane-close nd" onClick={onClose}>✕</button>
                        </div>
                        <div className="ci-pane-scroll nd">
                            <div className="ci-prof-hero nd" onClick={() => setShowPhotoModal(true)}>
                                <div className="ci-prof-hero-av">
                                    {photo ? <span style={{fontSize:30}}>{photo}</span> : <span>{displayName.charAt(0)}</span>}
                                    <div className="ci-prof-hero-cam">📷</div>
                                </div>
                                <div className="ci-prof-hero-info">
                                    <div className="ci-prof-hero-name">{nickname || displayName}</div>
                                    <div className="ci-prof-hero-email">{displayEmail}</div>
                                </div>
                                <div className="ci-prof-hero-arrow">›</div>
                            </div>
                            <div className="ci-section-label">기본 정보</div>
                            <div className="ci-info-card">
                                {[
                                    ['이름',        profile?.name    || displayName],
                                    ['이메일',      displayEmail],
                                    ['사용자 유형',  profile?.orgType || '개인 사용자'],
                                    ['가입일',      joined],
                                    ['장애 등급',   profile?.disabilityGrade || '-'],
                                    ['주 사용 수어', profile?.preferredSign   || '-'],
                                ].map(([k,v]) => (
                                    <div className="ci-info-row" key={k}>
                                        <span className="ci-info-key">{k}</span>
                                        <span className="ci-info-val">{v}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="ci-section-label">주소 정보</div>
                            <div className="ci-info-card" style={{marginBottom:20}}>
                                {[
                                    ['주소',    profile?.address       || '-'],
                                    ['상세주소', profile?.addressDetail || '-'],
                                    ['우편번호', profile?.zonecode      || '-'],
                                ].map(([k,v]) => (
                                    <div className="ci-info-row" key={k}>
                                        <span className="ci-info-key">{k}</span>
                                        <span className="ci-info-val">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 채팅 탭 ── */}
                {tab === 'chats' && (
                    <div className="ci-pane">
                        <div className="ci-pane-hd ci-chats-hd" onMouseDown={onMouseDown}>
                            <div className="ci-chats-brand">
                                <img src="/SignBridge.png" alt="SignBridge" className="ci-chats-logo"
                                     onError={e => e.target.style.display='none'}/>
                                <span className="ci-pane-title">Chats</span>
                            </div>
                            <button className="ci-pane-close nd" onClick={onClose}>✕</button>
                        </div>

                        <div className="ci-search nd">
                            <span style={{color:'#a0aec0',flexShrink:0,display:'flex'}}><IconSearch/></span>
                            <input className="ci-search-input" placeholder="검색..."
                                value={search} onChange={e => setSearch(e.target.value)}/>
                            {search && <button className="ci-search-clear nd" onClick={() => setSearch('')}>✕</button>}
                        </div>

                        <div className="ci-filter-row nd">
                            <button className={`ci-filter-btn nd ${chatFilter==='all'?'active':''}`}
                                onClick={() => setChatFilter('all')}>전체</button>
                            <button className={`ci-filter-btn nd ${chatFilter==='unread'?'active':''}`}
                                onClick={() => setChatFilter('unread')}>
                                읽지 않음
                                {unreadTotal > 0 && <span className="ci-filter-count">{unreadTotal}</span>}
                            </button>
                        </div>

                        <div className="ci-pane-scroll nd" onClick={() => setSwipedRoom(null)}>
                            {filteredRooms.length === 0 ? (
                                <div className="ci-empty">
                                    <div className="ci-empty-icon">{chatFilter==='unread'?'✅':'💬'}</div>
                                    <div>{chatFilter==='unread'?'읽지 않은 대화가 없어요':'아직 대화가 없어요'}</div>
                                    {chatFilter==='all' && <div className="ci-empty-sub">첫 대화를 시작해 보세요</div>}
                                </div>
                            ) : filteredRooms.map(room => (
                                <div key={room.id} className="ci-room-swipe-wrap"
                                    onTouchStart={e => onRoomSwipeStart(e, room.id)}
                                    onTouchEnd={e => onRoomSwipeEnd(e, room.id)}
                                    onMouseDown={e => onRoomSwipeStart(e, room.id)}
                                    onMouseUp={e => onRoomSwipeEnd(e, room.id)}
                                >
                                    {/* Swipe action buttons (revealed on left swipe) */}
                                    {swipedRoom === room.id && (
                                        <div className="ci-room-actions nd">
                                            <button className="ci-room-action ci-room-action-read nd"
                                                onClick={e => { e.stopPropagation(); markRead(room.id) }}>
                                                ✓ 읽음
                                            </button>
                                            <button className="ci-room-action ci-room-action-mute nd"
                                                onClick={e => { e.stopPropagation(); muteRoom(room.id) }}>
                                                {room.muted ? '🔔' : '🔕'}
                                            </button>
                                            <button className="ci-room-action ci-room-action-del nd"
                                                onClick={e => { e.stopPropagation(); deleteRoom(room.id) }}>
                                                🗑
                                            </button>
                                        </div>
                                    )}
                                    <div
                                        className={`ci-room-row ${room.unread>0?'ci-room-unread':''} ${swipedRoom===room.id?'ci-room-swiped':''}`}
                                        onClick={() => { if (swipedRoom===room.id) { setSwipedRoom(null); return } openChat(room) }}
                                    >
                                        <div className="ci-room-av" style={{position:'relative'}}>
                                            {room.avatar}
                                            {room.muted && <span className="ci-room-mute-badge">🔕</span>}
                                        </div>
                                        <div className="ci-room-info">
                                            <div className="ci-room-top">
                                                <span className="ci-room-name">{room.name}</span>
                                                <span className="ci-room-time">{fmtRecent(room.lastAt)}</span>
                                            </div>
                                            <div className="ci-room-bottom">
                                                <span className="ci-room-last">{room.lastMsg||'대화를 시작하세요'}</span>
                                                {room.unread > 0 && <span className="ci-unread-badge">{room.unread}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {showPhotoModal && (
            <ProfileEditModal nickname={nickname||myName} photo={photo} myName={myName}
                onSave={handleProfileSave} onClose={() => setShowPhotoModal(false)}/>
        )}

        {openRooms.map(room => (
            <ChatWindow key={room.id} room={room}
                myEmail={myEmail} myName={nickname||myName} myPhoto={photo}
                onClose={() => setOpenRooms(prev => prev.filter(r => r.id !== room.id))}/>
        ))}
        </>
    )
}