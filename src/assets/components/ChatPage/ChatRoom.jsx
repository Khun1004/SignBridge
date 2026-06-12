import { useState, useEffect, useRef } from 'react'
import './ChatRoom.css'
import chatService from './chatService'   // ← WebSocket + REST

/* ── localStorage helpers (UI 전용 — 방 목록, 핀, 타이핑 등) ── */
const ROOMS_KEY   = 'sb_chat_rooms'
const NICK_KEY    = 'sb_my_nickname'
const PHOTO_KEY   = 'sb_my_photo'
const BLOCKED_KEY = 'sb_blocked'
const typingKey   = (id) => `sb_typing_${id}`
const pinnedKey   = (id) => `sb_pinned_${id}`
const membersKey  = (id) => `sb_members_${id}`
const readKey     = (roomId, email) => `sb_read_${roomId}_${email}`

const load  = (k, fb) => { try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? fb } catch { return fb } }
const save  = (k, v)  => localStorage.setItem(k, JSON.stringify(v))

/* ── Constants ── */
const QUICK_REACTIONS = ['❤️','😂','😮','😢','😡','👍']

const EMOJI_CATEGORIES = [
    { label: '자주 쓰는', emojis: ['❤️','😂','😮','😢','😡','👍','🔥','🙏','👏','🤟','💯','😍'] },
    { label: '스마일', emojis: ['😀','😃','😄','😁','😆','🥹','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳'] },
    { label: '손동작', emojis: ['👋','🤚','✋','🖐','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🙏','✍️'] },
    { label: '기타', emojis: ['🎉','🎊','🎈','🎁','🏆','⭐','🌟','💫','✨','🔥','💥','💢','💬','💭','💤','♥️','💔','💕','💞','💓','💗','💖','💝','💘','💟'] },
]

const AVATAR_EMOJIS = ['😊','🐱','🐸','🌸','⚡','🎵','🏄','🦋','🌊','🔥','🎯','🍀']

const OFFICIAL_ROOMS = [
    {
        id: 'official_signbridge', name: 'SignBridge Official', sub: '공식 커뮤니티', avatar: '🤟',
        description: 'SignBridge 공식 채팅방입니다. 공지사항, 수어 팁, 커뮤니티 소식을 공유해요.',
        memberCount: 1284, isOfficial: true, isGroup: true,
        previewMessages: [
            { id:'p1', name:'SignBridge', email:'admin@sb.com', text:'🎉 SignBridge v2.0 업데이트가 출시되었습니다!', at: new Date(Date.now()-3600000*2).toISOString() },
            { id:'p2', name:'쿤산', email:'kunsan@sb.com', text:'와! 정말 기대가 되네요 🤟', at: new Date(Date.now()-3600000*1.5).toISOString() },
            { id:'p3', name:'민지', email:'minji@sb.com', text:'저도요! 수어 인식이 더 정확해졌으면 좋겠어요 📚', at: new Date(Date.now()-3600000).toISOString() },
            { id:'p4', name:'토야', email:'toya@sb.com', text:'다음 오프라인 모임은 언제인가요?', at: new Date(Date.now()-1800000).toISOString() },
            { id:'p5', name:'SignBridge', email:'admin@sb.com', text:'6월 15일 토요일 오후 2시 예정입니다 📅', at: new Date(Date.now()-900000).toISOString() },
        ],
    },
    {
        id: 'official_learners', name: '수어 배우기 방', sub: '학습자 모임', avatar: '📚',
        description: '수어를 배우는 분들을 위한 방입니다.',
        memberCount: 437, isOfficial: true, isGroup: true,
        previewMessages: [
            { id:'p1', name:'준호', email:'junho@sb.com', text:'안녕하세요! 처음 오신 분들 환영합니다 👋', at: new Date(Date.now()-7200000).toISOString() },
            { id:'p2', name:'소라', email:'sora@sb.com', text:'"감사합니다"를 수어로 하는 방법 알려주실 수 있나요?', at: new Date(Date.now()-5400000).toISOString() },
            { id:'p3', name:'쿤산', email:'kunsan@sb.com', text:'네! 오른손을 턱에서 앞으로 내밀면서 살짝 내리면 돼요 🤟', at: new Date(Date.now()-3600000).toISOString() },
        ],
    },
]

/* ── Formatters ── */
const fmtTime     = (iso) => new Date(iso).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' })
const fmtDate     = (iso) => {
    const d = new Date(iso), today = new Date()
    const diff = Math.floor((today - d) / 86400000)
    if (diff === 0) return '오늘'
    if (diff === 1) return '어제'
    return d.toLocaleDateString('ko-KR', { month:'long', day:'numeric' })
}
const fmtRecent   = (iso) => {
    if (!iso) return ''
    const d = new Date(iso), today = new Date()
    const diff = Math.floor((today - d) / 86400000)
    if (diff === 0) return fmtTime(iso)
    if (diff === 1) return '어제'
    return d.toLocaleDateString('ko-KR', { month:'numeric', day:'numeric' })
}
const fmtFileSize = (b) =>
    b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`
const fmtMembers  = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n

/* ── useDrag ── */
function useDrag(init) {
    const [pos, setPos] = useState(init)
    const drag = useRef(false)
    const off  = useRef({ x:0, y:0 })
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
        window.addEventListener('mouseup', up)
        return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up) }
    }, [])
    return { pos, onMouseDown }
}

/* ── Icons ── */
const Ico = ({ d, w=16, h=16, fill='none', sw=2 }) =>
    <svg viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw}
         strokeLinecap="round" strokeLinejoin="round" width={w} height={h}>{d}</svg>

const IconUser    = () => <Ico w={20} h={20} d={<><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>}/>
const IconChat    = () => <Ico w={20} h={20} d={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>}/>
const IconGroup   = () => <Ico w={20} h={20} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>
const IconSearch  = () => <Ico w={14} h={14} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>
const IconSend    = () => <Ico sw={2.5} d={<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>}/>
const IconPin     = () => <Ico w={14} h={14} d={<><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></>}/>
const IconReply   = () => <Ico w={14} h={14} d={<><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></>}/>
const IconClip    = () => <Ico w={18} h={18} d={<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>}/>
const IconX       = () => <Ico w={13} h={13} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>
const IconPencil  = () => <Ico w={14} h={14} d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}/>
const IconTrash   = () => <Ico w={14} h={14} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></>}/>
const IconCopy    = () => <Ico w={14} h={14} d={<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>}/>
const IconForward = () => <Ico w={14} h={14} d={<><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></>}/>
const IconDots    = () => <Ico w={15} h={15} fill="currentColor" sw={0} d={<><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></>}/>
const IconMsgSrch = () => <Ico w={18} h={18} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>
const IconMembers = () => <Ico w={18} h={18} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>
const IconRoomDots= () => <Ico w={16} h={16} fill="currentColor" sw={0} d={<><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>}/>

/* ── FullEmojiPicker ── */
function FullEmojiPicker({ onSelect, onClose, isMe, dir='up' }) {
    const [search, setSearch] = useState('')
    const [tab,    setTab]    = useState(0)
    const ref = useRef(null)

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
        setTimeout(() => document.addEventListener('mousedown', h), 0)
        return () => document.removeEventListener('mousedown', h)
    }, [onClose])

    const allEmojis = EMOJI_CATEGORIES.flatMap(c => c.emojis)
    const filtered  = search.trim() ? allEmojis.filter(e => e.includes(search)) : null
    const cats = filtered ? [{ label: `"${search}" 결과`, emojis: filtered }] : EMOJI_CATEGORIES

    return (
        <div ref={ref} className={`cw-full-picker nd ${isMe ? 'cw-full-picker-left' : 'cw-full-picker-right'} cw-pop-${dir}`}>
            <div className="cw-fp-search-row">
                <span className="cw-fp-search-icon"><IconSearch/></span>
                <input className="cw-fp-search nd" autoFocus placeholder="이모지 검색…"
                       value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <div className="cw-fp-body">
                {cats.map((cat, ci) => (
                    <div key={ci} className="cw-fp-section">
                        <div className="cw-fp-section-label">{cat.label}</div>
                        <div className="cw-fp-grid">
                            {cat.emojis.map(e => (
                                <button key={e} className="cw-fp-btn nd" onClick={() => { onSelect(e); onClose() }}>{e}</button>
                            ))}
                        </div>
                    </div>
                ))}
                {filtered && filtered.length === 0 && <div className="cw-fp-empty">이모지를 찾을 수 없어요</div>}
            </div>
        </div>
    )
}

/* ── QuickReactionBar ── */
function QuickReactionBar({ msgId, myReaction, isMe, dir='up', onReact, onOpenFull, onClose }) {
    return (
        <div className={`cw-quick-bar nd ${isMe ? 'cw-quick-bar-left' : 'cw-quick-bar-right'} cw-pop-${dir}`}>
            {QUICK_REACTIONS.map(e => (
                <button key={e} className={`cw-quick-btn nd ${myReaction === e ? 'cw-quick-active' : ''}`}
                        onClick={() => { onReact(msgId, e); onClose() }}>{e}</button>
            ))}
            <button className="cw-quick-plus nd" onClick={onOpenFull} title="더 많은 이모지">+</button>
        </div>
    )
}

/* ── MsgContextMenu ── */
function MsgContextMenu({ msg, isMe, isPinned, dir='up', onEdit, onDelete, onCopy, onForward, onPin, onClose }) {
    const ref = useRef(null)
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
        setTimeout(() => document.addEventListener('mousedown', h), 0)
        return () => document.removeEventListener('mousedown', h)
    }, [onClose])

    const fmtMsgTime = msg.sentAt || msg.at
        ? new Date(msg.sentAt || msg.at).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' })
        : ''

    const item = (icon, label, onClick, danger=false, disabled=false) => (
        <button className={`cw-ctx-menu-item nd ${danger?'cw-ctx-menu-danger':''} ${disabled?'cw-ctx-menu-disabled':''}`}
                onClick={(e) => { e.stopPropagation(); if (!disabled) { onClick(); onClose() } }}>
            <span className="cw-ctx-menu-label">{label}</span>
            <span className="cw-ctx-menu-icon">{icon}</span>
        </button>
    )

    return (
        <div ref={ref} className={`cw-ctx-menu nd ${isMe ? 'cw-ctx-menu-left' : 'cw-ctx-menu-right'} cw-pop-${dir}`}
             onClick={e => e.stopPropagation()}>
            <div className="cw-ctx-menu-time">{fmtMsgTime}</div>
            {isMe && !msg.imageData && !msg.fileName && item(<IconPencil/>, 'Edit', onEdit)}
            {item(<IconForward/>, 'Forward', onForward)}
            {!msg.imageData && !msg.fileName && item(<IconCopy/>, 'Copy', onCopy)}
            {item(<IconPin/>, isPinned ? 'Unpin' : 'Pin', onPin)}
            {isMe && item(<span style={{color:'#ef4444',display:'flex'}}><IconTrash/></span>, 'Unsend', onDelete, true)}
        </div>
    )
}

/* ── WhoReacted ── */
function WhoReacted({ reactions, nameMap, dir='up', onClose }) {
    const ref = useRef(null)
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
        setTimeout(() => document.addEventListener('mousedown', h), 0)
        return () => document.removeEventListener('mousedown', h)
    }, [onClose])

    const who = Object.entries(reactions || {}).map(([email, emoji]) => ({
        email, emoji, name: nameMap?.[email] || email.split('@')[0],
    }))

    return (
        <div ref={ref} className={`cw-who-reacted nd cw-pop-${dir}`}>
            <div className="cw-who-reacted-hd">모든 반응<button className="cw-who-close nd" onClick={onClose}><IconX/></button></div>
            <div className="cw-who-list">
                {who.map(({ name, emoji }) => (
                    <div key={name} className="cw-who-row">
                        <div className="cw-who-av">{name.charAt(0)}</div>
                        <span className="cw-who-name">{name}</span>
                        <span className="cw-who-emoji">{emoji}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ── MemberPanel ── */
function MemberPanel({ roomId, myEmail, myName, onClose }) {
    const members = load(membersKey(roomId), [])
    const all = members.find(m => m.email === myEmail)
        ? members
        : [{ email: myEmail, name: myName, role: '나' }, ...members]
    return (
        <div className="cw-member-panel nd">
            <div className="cw-member-hd">
                <span className="cw-member-title">참여자 {all.length}명</span>
                <button className="cw-member-close nd" onClick={onClose}><IconX/></button>
            </div>
            <div className="cw-member-list">
                {all.map(m => (
                    <div key={m.email} className="cw-member-row">
                        <div className="cw-member-av">{(m.name||m.email).charAt(0)}</div>
                        <div className="cw-member-info">
                            <span className="cw-member-name">{m.name||m.email}</span>
                            {m.role && <span className="cw-member-role">{m.role}</span>}
                        </div>
                        {m.email === myEmail && <span className="cw-member-me">나</span>}
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ── ImagePreview ── */
function ImagePreview({ file, dataUrl, onSend, onCancel }) {
    return (
        <div className="cw-img-preview-overlay nd" onClick={onCancel}>
            <div className="cw-img-preview-modal nd" onClick={e => e.stopPropagation()}>
                <div className="cw-img-preview-hd">
                    <span>사진 전송</span>
                    <button className="cw-img-preview-close nd" onClick={onCancel}><IconX/></button>
                </div>
                <div className="cw-img-preview-body">
                    <img src={dataUrl} alt={file.name} className="cw-img-preview-img"/>
                    <div className="cw-img-preview-meta">
                        <span className="cw-img-preview-name">{file.name}</span>
                        <span className="cw-img-preview-size">{fmtFileSize(file.size)}</span>
                    </div>
                </div>
                <div className="cw-img-preview-actions">
                    <button className="cw-img-preview-cancel nd" onClick={onCancel}>취소</button>
                    <button className="cw-img-preview-send nd" onClick={onSend}>전송하기</button>
                </div>
            </div>
        </div>
    )
}

/* ── GroupPreviewModal ── */
function GroupPreviewModal({ room, onJoin, onClose }) {
    return (
        <div className="ci-modal-overlay nd" onClick={onClose}>
            <div className="ci-group-preview nd" onClick={e => e.stopPropagation()}>
                <div className="ci-gp-header">
                    <div className="ci-gp-av">{room.avatar}</div>
                    <button className="ci-gp-close nd" onClick={onClose}><IconX/></button>
                </div>
                <div className="ci-gp-info">
                    <div className="ci-gp-name">
                        {room.name}
                        {room.isOfficial && <span className="ci-official-badge">공식</span>}
                    </div>
                    <div className="ci-gp-desc">{room.description}</div>
                    <div className="ci-gp-meta">👥 {fmtMembers(room.memberCount)}명 참여 중</div>
                </div>
                <div className="ci-gp-preview-label">최근 대화 미리보기</div>
                <div className="ci-gp-messages">
                    <div className="ci-gp-blur-top"/>
                    {(room.previewMessages||[]).map(msg => (
                        <div key={msg.id} className="ci-gp-msg-row">
                            <div className="ci-gp-msg-av">{msg.name.charAt(0)}</div>
                            <div className="ci-gp-msg-body">
                                <div className="ci-gp-msg-name">{msg.name}</div>
                                <div className="ci-gp-msg-text">{msg.text}</div>
                            </div>
                            <div className="ci-gp-msg-time">{fmtTime(msg.at)}</div>
                        </div>
                    ))}
                </div>
                <button className="ci-gp-join-btn nd" onClick={onJoin}>🤟 참여하기</button>
            </div>
        </div>
    )
}

/* ── MsgSearchPanel ── */
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
                       placeholder="검색어 입력..." value={q} onChange={e => setQ(e.target.value)}/>
            </div>
            <div className="cw-msgsearch-results">
                {q.trim() && !results.length && <div className="cw-msgsearch-empty">결과 없음</div>}
                {results.map(m => (
                    <div key={m.id} className="cw-msgsearch-row" onClick={() => { onJump(m.id); onClose() }}>
                        <div className="cw-msgsearch-who">{m.senderName || m.name}</div>
                        <div className="cw-msgsearch-snippet">
                            {(m.text||m.fileName||'').split(new RegExp(`(${q})`, 'gi')).map((p, i) =>
                                p.toLowerCase() === q.toLowerCase() ? <mark key={i}>{p}</mark> : p
                            )}
                        </div>
                        <div className="cw-msgsearch-time">{fmtTime(m.sentAt || m.at)}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ── PinnedBar ── */
function PinnedBar({ pinned, onJump, onUnpin }) {
    if (!pinned) return null
    return (
        <div className="cw-pinned-bar nd">
            <span className="cw-pinned-icon"><IconPin/></span>
            <div className="cw-pinned-text" onClick={onJump}>
                <span className="cw-pinned-label">고정된 메시지</span>
                <span className="cw-pinned-preview">{pinned.text||(pinned.fileName?`📎 ${pinned.fileName}`:'')}</span>
            </div>
            <button className="cw-pinned-close nd" onClick={onUnpin}><IconX/></button>
        </div>
    )
}

/* ── TypingIndicator ── */
function TypingIndicator({ roomId, myEmail }) {
    const [typers, setTypers] = useState([])
    useEffect(() => {
        const check = () => {
            const data = load(typingKey(roomId), {})
            const now  = Date.now()
            setTypers(Object.entries(data).filter(([em,ts]) => em!==myEmail && now-ts<4000).map(([em])=>em))
        }
        check()
        const id = setInterval(check, 800)
        return () => clearInterval(id)
    }, [roomId, myEmail])
    if (!typers.length) return null
    return (
        <div className="cw-typing">
            <div className="cw-typing-av">{typers[0].charAt(0).toUpperCase()}</div>
            <div className="cw-typing-dots"><span/><span/><span/></div>
        </div>
    )
}

/* ── ProfileEditModal ── */
function ProfileEditModal({ nickname, photo, myName, onSave, onClose }) {
    const [nickInput, setNick]   = useState(nickname)
    const [photoInput, setPhoto] = useState(photo||'')
    const fileRef = useRef(null)
    const doSave  = () => onSave({ nickname: nickInput.trim()||myName, photo: photoInput })
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
                            {photoInput ? <span style={{fontSize:38}}>{photoInput}</span> : <span>{(nickname||myName||'?').charAt(0)}</span>}
                            <div className="ci-modal-av-overlay">📷</div>
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={() => {}}/>
                        <div className="ci-modal-av-hint">클릭하여 사진 변경</div>
                    </div>
                    <div className="ci-modal-section-label">이모지 아바타</div>
                    <div className="ci-emoji-grid">
                        {AVATAR_EMOJIS.map(e => (
                            <button key={e} className={`ci-emoji-opt nd ${photoInput===e?'selected':''}`}
                                    onClick={() => setPhoto(photoInput===e?'':e)}>{e}</button>
                        ))}
                        {photoInput && <button className="ci-emoji-opt ci-emoji-clear nd" onClick={() => setPhoto('')}>✕</button>}
                    </div>
                    <div className="ci-modal-field">
                        <label className="ci-modal-label">닉네임</label>
                        <input className="ci-modal-input nd" value={nickInput}
                               onChange={e => setNick(e.target.value)}
                               onKeyDown={e => e.key==='Enter' && doSave()}
                               placeholder="닉네임 입력"/>
                    </div>
                    <button className="ci-modal-save nd" onClick={doSave}>저장하기</button>
                </div>
            </div>
        </div>
    )
}

/* ── RoomMenu ── */
function RoomMenu({ room, onMarkRead, onMute, onDelete, onBlock, onClose }) {
    const ref = useRef(null)
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
        setTimeout(() => document.addEventListener('mousedown', h), 0)
        return () => document.removeEventListener('mousedown', h)
    }, [onClose])
    const item = (icon, label, onClick, danger=false) => (
        <button className={`ci-menu-item nd ${danger?'ci-menu-danger':''}`}
                onClick={(e) => { e.stopPropagation(); onClick(); onClose() }}>
            <span className="ci-menu-icon">{icon}</span><span>{label}</span>
        </button>
    )
    return (
        <div ref={ref} className="ci-room-menu nd" onClick={e => e.stopPropagation()}>
            {room.unread > 0 && item('✓','읽음으로 표시', onMarkRead)}
            {item(room.muted?'🔔':'🔕', room.muted?'알림 켜기':'알림 끄기', onMute)}
            {item('🗑','대화 삭제', onDelete, true)}
            {item('🚫','차단하기', onBlock, true)}
        </div>
    )
}

/* ── OfficialRoomBanner ── */
function OfficialRoomBanner({ room, joined, onJoin, onLeave, onOpen, onPreview }) {
    return (
        <div className="ci-official-banner nd">
            <div className="ci-official-glow"/>
            <div className="ci-official-left" onClick={joined ? onOpen : onPreview} style={{cursor:'pointer'}}>
                <div className="ci-official-av">{room.avatar}</div>
                <div className="ci-official-info">
                    <div className="ci-official-name-row">
                        <span className="ci-official-name">{room.name}</span>
                        <span className="ci-official-badge">공식</span>
                    </div>
                    <div className="ci-official-desc">{room.description}</div>
                    <div className="ci-official-meta">
                        <span className="ci-official-members">👥 {fmtMembers(room.memberCount+(joined?1:0))}명 참여 중</span>
                        {!joined && <span className="ci-official-preview-hint">미리보기 →</span>}
                    </div>
                </div>
            </div>
            <button className={`ci-official-join nd ${joined?'ci-official-leave':''}`}
                    onClick={joined ? onLeave : onJoin}>
                {joined ? '나가기' : '참여하기'}
            </button>
        </div>
    )
}

/* ── ForwardModal ── */
function ForwardModal({ msg, currentRoomId, rooms, onForward, onClose }) {
    const all = rooms.filter(r => r.id !== currentRoomId)
    const preview = msg.text
        ? (msg.text.length > 55 ? msg.text.slice(0, 55) + '…' : msg.text)
        : msg.fileName || '파일'

    return (
        <div className="ci-modal-overlay nd" onClick={onClose}>
            <div className="cw-fwd-modal nd" onClick={e => e.stopPropagation()}>
                <div className="cw-fwd-hd">
                    <span className="cw-fwd-hd-title">메시지 전달</span>
                    <button className="cw-fwd-close nd" onClick={onClose}><IconX/></button>
                </div>
                <div className="cw-fwd-preview">
                    <span className="cw-fwd-preview-label">↪ 전달할 메시지</span>
                    <span className="cw-fwd-preview-text">{preview}</span>
                </div>
                <div className="cw-fwd-section">대화 선택</div>
                <div className="cw-fwd-list">
                    {all.length === 0 ? (
                        <div className="cw-fwd-empty">
                            <div className="cw-fwd-empty-icon">💬</div>
                            <div>전달할 대화방이 없어요</div>
                        </div>
                    ) : all.map(r => (
                        <div key={r.id} className="cw-fwd-room nd">
                            <div className="cw-fwd-room-av">{r.avatar}</div>
                            <div className="cw-fwd-room-info">
                                <div className="cw-fwd-room-name">{r.name}</div>
                                {r.sub && <div className="cw-fwd-room-sub">{r.sub}</div>}
                            </div>
                            <button className="cw-fwd-send-btn nd" onClick={() => onForward(r, msg)}>전달</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════
   CHAT WINDOW  ← 핵심 변경: chatService 연동
═══════════════════════════════════════════════════════ */
function ChatWindow({ room, myEmail, myName, myNickname, myPhoto, onClose, isGroup=false, allRooms=[] }) {
    const chatDisplayName = myNickname || myName

    const [messages,    setMessages]    = useState([])
    const [loading,     setLoading]     = useState(true)
    const [input,       setInput]       = useState('')
    const [popover,     setPopover]     = useState(null)
    const [replyTo,     setReplyTo]     = useState(null)
    const [editingMsg,  setEditingMsg]  = useState(null)
    const [pinned,      setPinned]      = useState(() => load(pinnedKey(room.id), null))
    const [showSearch,  setShowSearch]  = useState(false)
    const [showMembers, setShowMembers] = useState(false)
    const [imgPreview,  setImgPreview]  = useState(null)
    const [forwardMsg,  setForwardMsg]  = useState(null)

    const bottomRef   = useRef(null)
    const msgRefs     = useRef({})
    const fileRef     = useRef(null)
    const typingTimer = useRef(null)
    const inputRef    = useRef(null)

    const { pos, onMouseDown } = useDrag({
        x: Math.max(20, window.innerWidth  - 980),
        y: Math.max(20, window.innerHeight - 780),
    })

    /* ── ① 메시지 히스토리 로드 + WebSocket 구독 ── */
    useEffect(() => {
        setLoading(true)
        chatService.getMessages(room.id)
            .then(data => setMessages(Array.isArray(data) ? data : []))
            .catch(() => setMessages([]))
            .finally(() => setLoading(false))

        const unsub = chatService.subscribeToRoom(room.id, (msg) => {
            if (msg.type === 'EDIT') {
                setMessages(prev => prev.map(m =>
                    m.id === msg.id ? { ...m, text: msg.text, isEdited: true } : m
                ))
            } else if (msg.type === 'DELETE') {
                setMessages(prev => prev.filter(m => m.id !== msg.id))
            } else {
                setMessages(prev => [...prev, msg])
            }
        })

        return () => unsub()
    }, [room.id])

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

    const closePopover = () => setPopover(null)

    const nameMap = { [myEmail]: chatDisplayName }
    messages.forEach(m => {
        if (m.senderEmail && m.senderName) nameMap[m.senderEmail] = m.senderName
    })

    /* ── ② send() — chatService.sendMessage() ── */
    const send = () => {
        // 수정 모드
        if (editingMsg) {
            const trimmed = input.trim()
            if (!trimmed) return
            chatService.editMessage(editingMsg.id, room.id, trimmed)
            setEditingMsg(null)
            setInput('')
            return
        }

        const text = input.trim()
        if (!text) return

        chatService.sendMessage({
            roomId:      room.id,
            senderEmail: myEmail,
            senderName:  chatDisplayName,
            text,
            replyToId:   replyTo?.id   || null,
            replyToName: replyTo?.name || null,
            replyToText: replyTo?.text || null,
        })

        setInput('')
        setReplyTo(null)

        // 타이핑 상태 제거
        const d = load(typingKey(room.id), {})
        delete d[myEmail]
        save(typingKey(room.id), d)
    }

    /* ── ③ deleteMsg — chatService.deleteMessage() ── */
    const deleteMsg = (id) => {
        chatService.deleteMessage(id, room.id)
    }

    /* ── ④ startEdit ── */
    const startEdit = (msg) => {
        setEditingMsg({ id: msg.id, text: msg.text })
        setInput(msg.text)
        setReplyTo(null)
        setTimeout(() => inputRef.current?.focus(), 50)
    }

    /* ── 파일 전송 (이미지는 base64로 텍스트 전송) ── */
    const handleFileSelect = (file) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = (e) => setImgPreview({ file, dataUrl: e.target.result })
            reader.readAsDataURL(file)
        } else {
            sendFile(file, null)
        }
    }

    const sendFile = (file, dataUrl) => {
        chatService.sendMessage({
            roomId:      room.id,
            senderEmail: myEmail,
            senderName:  chatDisplayName,
            text:        dataUrl ? null : null,
            fileName:    file.name,
            fileUrl:     dataUrl || null,
            isImage:     !!dataUrl,
        })
        setReplyTo(null)
        setImgPreview(null)
    }

    /* ── 로컬 전달 (Forward) ── */
    const forwardToRoom = (targetRoom, msg) => {
        chatService.sendMessage({
            roomId:       targetRoom.id,
            senderEmail:  myEmail,
            senderName:   chatDisplayName,
            text:         msg.text || null,
            fileName:     msg.fileName || null,
            forwardedFrom: msg.senderName || msg.name || '알 수 없음',
        })
        setForwardMsg(null)
    }

    /* ── 타이핑 브로드캐스트 (localStorage, UI 전용) ── */
    const broadcastTyping = () => {
        const d = load(typingKey(room.id), {})
        d[myEmail] = Date.now()
        save(typingKey(room.id), d)
        clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => {
            const d2 = load(typingKey(room.id), {})
            delete d2[myEmail]
            save(typingKey(room.id), d2)
        }, 3000)
    }

    /* ── 반응 (로컬 UI — 추후 WebSocket으로 확장 가능) ── */
    const addReaction = (msgId, emoji) => {
        setMessages(prev => prev.map(m => {
            if (m.id !== msgId) return m
            const r = { ...(m.reactions || {}) }
            r[myEmail] === emoji ? delete r[myEmail] : (r[myEmail] = emoji)
            return { ...m, reactions: r }
        }))
    }

    const aggregateReactions = (reactions) => {
        const agg = {}
        Object.values(reactions||{}).forEach(e => { agg[e] = (agg[e]||0)+1 })
        return Object.entries(agg).filter(([,c]) => c > 0)
    }

    const pinMessage   = (msg) => { const p={id:msg.id,text:msg.text,fileName:msg.fileName,name:msg.senderName||msg.name}; setPinned(p); save(pinnedKey(room.id),p) }
    const unpinMessage = ()    => { setPinned(null); save(pinnedKey(room.id),null) }
    const jumpToMsg    = (id)  => { msgRefs.current[id]?.scrollIntoView({behavior:'smooth',block:'center'}) }

    const onKey = (e) => {
        if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() }
        if (e.key==='Escape' && editingMsg)  { setEditingMsg(null); setInput('') }
    }

    /* ── 메시지 렌더링 ── */
    let lastDate = null
    const rows = messages.map(msg => {
        // DB 필드명 통일 (senderEmail/senderName or email/name)
        const senderEmail = msg.senderEmail || msg.email
        const senderName  = msg.senderName  || msg.name
        const sentAt      = msg.sentAt      || msg.at
        const isMe        = senderEmail === myEmail
        const dl          = fmtDate(sentAt)
        const showDt      = dl !== lastDate; lastDate = dl
        const aggR        = aggregateReactions(msg.reactions)
        const myR         = (msg.reactions||{})[myEmail]
        const isPinned    = pinned?.id === msg.id

        const isCtxOpen      = popover?.msgId === msg.id && popover.type === 'ctx'
        const isQuickOpen    = popover?.msgId === msg.id && popover.type === 'quickReact'
        const isFullPickOpen = popover?.msgId === msg.id && popover.type === 'fullPicker'
        const isWhoOpen      = popover?.msgId === msg.id && popover.type === 'whoReacted'

        const msgEl = msgRefs.current[msg.id]
        let popDir = 'up'
        if (msgEl) {
            const container = msgEl.closest('.cw-messages')
            if (container) {
                const elRect  = msgEl.getBoundingClientRect()
                const conRect = container.getBoundingClientRect()
                popDir = ((elRect.top + elRect.height / 2) - conRect.top) > conRect.height * 0.55 ? 'up' : 'down'
            }
        }

        if (msg.isSystem) return (
            <div key={msg.id} className="cw-row-system">
                <span className="cw-system-msg">{msg.text}</span>
            </div>
        )

        return (
            <div key={msg.id} ref={el => { if(el) msgRefs.current[msg.id]=el }}>
                {showDt && <div className="cw-date-div"><span>{dl}</span></div>}
                <div className={`cw-msg-block ${isMe?'cw-msg-block-me':'cw-msg-block-them'}`}>
                    {msg.isEdited && (
                        <div className={`cw-edited-label ${isMe?'cw-edited-me':'cw-edited-them'}`}>수정됨</div>
                    )}
                    <div className={`cw-row ${isMe?'cw-me':'cw-them'} ${isPinned?'cw-row-pinned':''}`}>
                        {!isMe && <div className="cw-avatar">{(senderName||'?').charAt(0)}</div>}
                        <div className="cw-bwrap">
                            {(!isMe && isGroup) && <div className="cw-sender">{senderName}</div>}
                            <div className="cw-bubble-wrap">
                                <div className={`cw-bubble ${isMe?'cw-bubble-me':'cw-bubble-them'}`}>
                                    {msg.forwardedFrom && (
                                        <div className="cw-fwd-badge"><IconForward/> {msg.forwardedFrom}에서 전달됨</div>
                                    )}
                                    {msg.replyToId && (
                                        <div className="cw-reply-inbubble" onClick={(e) => { e.stopPropagation(); jumpToMsg(msg.replyToId) }}>
                                            <div className="cw-reply-inbubble-name">{msg.replyToName}</div>
                                            <div className="cw-reply-inbubble-text">{msg.replyToText}</div>
                                        </div>
                                    )}
                                    {msg.isImage && msg.fileUrl ? (
                                        <div className="cw-img-wrap">
                                            <img src={msg.fileUrl} alt={msg.fileName} className="cw-img"/>
                                            <div className="cw-img-name">{msg.fileName}</div>
                                        </div>
                                    ) : msg.fileName ? (
                                        <div className="cw-file">
                                            <div className="cw-file-icon">📎</div>
                                            <div className="cw-file-info">
                                                <div className="cw-file-name">{msg.fileName}</div>
                                            </div>
                                        </div>
                                    ) : msg.text}
                                </div>

                                {/* Hover bar */}
                                <div className={`cw-hover-bar nd ${isMe?'cw-hover-bar-left':'cw-hover-bar-right'}`}>
                                    <button className={`cw-hbar-btn nd ${isCtxOpen?'cw-hbar-active':''}`}
                                            onClick={(e) => { e.stopPropagation(); setPopover(isCtxOpen ? null : { msgId:msg.id, type:'ctx' }) }}>
                                        <IconDots/>
                                    </button>
                                    <button className="cw-hbar-btn nd"
                                            onClick={(e) => { e.stopPropagation(); setReplyTo({id:msg.id,name:senderName,text:msg.text,fileName:msg.fileName}); setPopover(null) }}>
                                        <IconReply/>
                                    </button>
                                    <button className={`cw-hbar-btn nd ${isQuickOpen||isFullPickOpen?'cw-hbar-active':''}`}
                                            onClick={(e) => { e.stopPropagation(); setPopover(isQuickOpen ? null : { msgId:msg.id, type:'quickReact' }) }}>
                                        <span style={{fontSize:15,lineHeight:1}}>{myR || '😊'}</span>
                                    </button>
                                </div>

                                {isCtxOpen && (
                                    <div onClick={e => e.stopPropagation()}>
                                        <MsgContextMenu msg={msg} isMe={isMe} isPinned={isPinned} dir={popDir}
                                                        onEdit={() => { startEdit(msg); closePopover() }}
                                                        onDelete={() => { deleteMsg(msg.id); closePopover() }}
                                                        onCopy={() => { navigator.clipboard?.writeText(msg.text||''); closePopover() }}
                                                        onForward={() => { setForwardMsg(msg); closePopover() }}
                                                        onPin={() => { isPinned ? unpinMessage() : pinMessage(msg); closePopover() }}
                                                        onClose={closePopover}/>
                                    </div>
                                )}
                                {isQuickOpen && (
                                    <div onClick={e => e.stopPropagation()}>
                                        <QuickReactionBar msgId={msg.id} myReaction={myR} isMe={isMe} dir={popDir}
                                                          onReact={(id, emoji) => { addReaction(id, emoji); closePopover() }}
                                                          onOpenFull={() => setPopover({ msgId:msg.id, type:'fullPicker' })}
                                                          onClose={closePopover}/>
                                    </div>
                                )}
                                {isFullPickOpen && (
                                    <div onClick={e => e.stopPropagation()}>
                                        <FullEmojiPicker isMe={isMe} dir={popDir}
                                                         onSelect={(emoji) => { addReaction(msg.id, emoji); closePopover() }}
                                                         onClose={closePopover}/>
                                    </div>
                                )}
                            </div>

                            {aggR.length > 0 && (
                                <div className={`cw-reactions ${isMe?'reactions-left':'reactions-right'}`}>
                                    {aggR.map(([e, count]) => (
                                        <span key={e} className={`cw-reaction-chip nd ${myR===e?'cw-reaction-mine':''}`}
                                              onClick={(ev) => { ev.stopPropagation(); addReaction(msg.id, e) }}>
                      {e} {count}
                    </span>
                                    ))}
                                    <button className="cw-who-btn nd"
                                            onClick={(ev) => { ev.stopPropagation(); setPopover(isWhoOpen ? null : { msgId:msg.id, type:'whoReacted' }) }}>
                                        <IconMembers/>
                                    </button>
                                    {isWhoOpen && (
                                        <div onClick={e => e.stopPropagation()}>
                                            <WhoReacted reactions={msg.reactions} nameMap={nameMap} dir={popDir} onClose={closePopover}/>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={`cw-side-meta ${isMe?'cw-side-meta-me':'cw-side-meta-them'}`}>
                            <span className="cw-time">{fmtTime(sentAt)}</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    })

    return (
        <>
            <div className="cw-window" style={{ left:pos.x, top:pos.y }}>
                <div className="cw-header" onMouseDown={onMouseDown}>
                    <div className="cw-header-left">
                        <div className="cw-av-sm">{room.avatar}</div>
                        <div>
                            <div className="cw-hname">
                                {room.name}
                                {isGroup && <span className="cw-group-badge">그룹</span>}
                            </div>
                            <div className="cw-hsub">{isGroup ? `${fmtMembers(room.memberCount)}명` : room.sub}</div>
                        </div>
                    </div>
                    <div className="cw-header-actions nd">
                        {isGroup && (
                            <button className={`cw-hbtn nd ${showMembers?'cw-hbtn-active':''}`}
                                    onClick={() => { setShowMembers(v=>!v); setShowSearch(false) }}>
                                <IconMembers/>
                            </button>
                        )}
                        <button className={`cw-hbtn nd ${showSearch?'cw-hbtn-active':''}`}
                                onClick={() => { setShowSearch(v=>!v); setShowMembers(false) }}>
                            <IconMsgSrch/>
                        </button>
                        <button className="cw-hclose nd" onClick={onClose}>✕</button>
                    </div>
                </div>

                {showSearch  && <MsgSearchPanel messages={messages} onJump={jumpToMsg} onClose={() => setShowSearch(false)}/>}
                {showMembers && <MemberPanel roomId={room.id} myEmail={myEmail} myName={myName} onClose={() => setShowMembers(false)}/>}
                <PinnedBar pinned={pinned} onJump={() => jumpToMsg(pinned.id)} onUnpin={unpinMessage}/>

                <div className="cw-messages">
                    {loading ? (
                        <div className="cw-empty"><div className="cw-empty-hint">불러오는 중...</div></div>
                    ) : !rows.length ? (
                        <div className="cw-empty">
                            <div className="cw-empty-av">{room.avatar}</div>
                            <div className="cw-empty-name">{room.name}</div>
                            <div className="cw-empty-hint">첫 메시지를 보내보세요 👋</div>
                        </div>
                    ) : rows}
                    <TypingIndicator roomId={room.id} myEmail={myEmail}/>
                    <div ref={bottomRef}/>
                </div>

                {editingMsg && (
                    <div className="cw-edit-bar nd">
                        <div className="cw-edit-bar-content">
                            <IconPencil/>
                            <div className="cw-edit-bar-info">
                                <span className="cw-edit-bar-label">메시지 수정 중</span>
                                <span className="cw-edit-bar-text">{editingMsg.text}</span>
                            </div>
                        </div>
                        <button className="cw-reply-bar-close nd" onClick={() => { setEditingMsg(null); setInput('') }}><IconX/></button>
                    </div>
                )}

                {replyTo && !editingMsg && (
                    <div className="cw-reply-bar nd">
                        <div className="cw-reply-bar-content">
                            <IconReply/>
                            <div className="cw-reply-bar-info">
                                <span className="cw-reply-bar-name">{replyTo.name}에게 답장</span>
                                <span className="cw-reply-bar-text">{replyTo.fileName?`📎 ${replyTo.fileName}`:replyTo.text}</span>
                            </div>
                        </div>
                        <button className="cw-reply-bar-close nd" onClick={() => setReplyTo(null)}><IconX/></button>
                    </div>
                )}

                <div className="cw-input-row nd">
                    <button className="cw-attach-btn nd" onClick={() => fileRef.current?.click()}>
                        <IconClip/>
                    </button>
                    <input ref={fileRef} type="file" accept="image/*,*/*" style={{display:'none'}}
                           onChange={e => { const f=e.target.files?.[0]; if(f) handleFileSelect(f); e.target.value='' }}/>
                    <textarea ref={inputRef} className="cw-input"
                              placeholder={editingMsg ? '수정할 내용 입력…' : '메시지를 입력하세요… (Enter 전송)'}
                              value={input}
                              onChange={e => { setInput(e.target.value); broadcastTyping() }}
                              onKeyDown={onKey} rows={1}/>
                    <button className="cw-send nd" onClick={send} disabled={!input.trim()}>
                        <IconSend/>
                    </button>
                </div>
            </div>

            {imgPreview && (
                <ImagePreview
                    file={imgPreview.file} dataUrl={imgPreview.dataUrl}
                    onSend={() => sendFile(imgPreview.file, imgPreview.dataUrl)}
                    onCancel={() => setImgPreview(null)}/>
            )}

            {forwardMsg && (
                <ForwardModal
                    msg={forwardMsg}
                    currentRoomId={room.id}
                    rooms={allRooms}
                    onForward={forwardToRoom}
                    onClose={() => setForwardMsg(null)}/>
            )}
        </>
    )
}

/* ═══════════════════════════════════════════════════════
   INBOX (ChatRoom export)
═══════════════════════════════════════════════════════ */
export default function ChatRoom({ onClose, myEmail='', myName='', profile=null, initialRoom=null }) {
    const [rooms,          setRooms]         = useState([])
    const [openRooms,      setOpenRooms]      = useState([])
    const [tab,            setTab]            = useState('chats')
    const [search,         setSearch]         = useState('')
    const [chatFilter,     setChatFilter]     = useState('all')
    const [nickname, setNickname] = useState(() => {
        const stored = localStorage.getItem(NICK_KEY)
        if (stored) return stored
        if (myName) { localStorage.setItem(NICK_KEY, myName); return myName }
        return ''
    })
    const [photo,          setPhoto]          = useState(() => localStorage.getItem(PHOTO_KEY) || '')
    const [showPhotoModal, setShowPhotoModal] = useState(false)
    const [menuOpenId,     setMenuOpenId]     = useState(null)
    const [blocked,        setBlocked]        = useState(() => load(BLOCKED_KEY, []))
    const [joinedGroups,   setJoinedGroups]   = useState(() => load('sb_joined_groups', []))
    const [previewRoom,    setPreviewRoom]    = useState(null)

    const { pos, onMouseDown } = useDrag({
        x: Math.max(20, window.innerWidth  - 500),
        y: Math.max(20, window.innerHeight - 780),
    })

    // ── 방 목록 DB에서 로드 ──
    useEffect(() => {
        if (!myEmail) return
        fetch(`/api/chat/rooms?email=${encodeURIComponent(myEmail)}`)
            .then(r => r.json())
            .then(data => setRooms(Array.isArray(data) ? data.map(r => ({...r, id: r.roomId || r.id})) : []))
            .catch(err => console.error('Failed to load rooms:', err))
    }, [myEmail])

    // ── 커뮤니티에서 채팅 시작 시 자동 오픈 ──
    useEffect(() => {
        if (!initialRoom) return
        const normalized = { ...initialRoom, id: initialRoom.roomId || initialRoom.id }
        setOpenRooms([normalized])
        setTab('chats')
        // 방 목록에도 추가
        setRooms(prev => prev.find(r => r.id === normalized.id) ? prev : [normalized, ...prev])
    }, [initialRoom])

    const handleProfileSave = ({ nickname:nick, photo:ph }) => {
        setNickname(nick); setPhoto(ph)
        localStorage.setItem(NICK_KEY, nick); localStorage.setItem(PHOTO_KEY, ph)
        setShowPhotoModal(false)
    }

    const openChat = (room, isGroup=false) =>
        setOpenRooms(prev => prev.find(r => r.id===room.id) ? prev : [...prev, {...room, isGroup}])

    const deleteRoom = (id) => {
        setRooms(prev => prev.filter(r => r.id!==id))
        setOpenRooms(prev => prev.filter(r => r.id!==id))
    }
    const muteRoom  = (id) => setRooms(prev => prev.map(r=>r.id===id?{...r,muted:!r.muted}:r))
    const markRead  = (id) => setRooms(prev => prev.map(r=>r.id===id?{...r,unread:0}:r))
    const blockRoom = (id) => { setBlocked(prev => { const u=[...prev,id]; save(BLOCKED_KEY,u); return u }); deleteRoom(id) }

    const joinGroup = (gid) => {
        setJoinedGroups(prev => { const u=[...prev,gid]; save('sb_joined_groups',u); return u })
        setPreviewRoom(null)
    }
    const leaveGroup = (gid) => {
        setJoinedGroups(prev => { const u=prev.filter(id=>id!==gid); save('sb_joined_groups',u); return u })
        setOpenRooms(prev => prev.filter(r => r.id!==gid))
    }

    const unreadTotal    = rooms.reduce((s,r) => s+(r.unread||0), 0)
    const filteredRooms  = rooms.filter(r => {
        if (blocked.includes(r.id)) return false
        const matchS = r.name?.includes(search)||(r.lastMsg||'').includes(search)
        const matchF = chatFilter==='all'||(chatFilter==='unread'&&r.unread>0)
        return matchS && matchF
    })

    const realName     = myName || '사용자'
    const displayName  = profile?.name  || realName
    const displayEmail = profile?.email || myEmail || '-'
    const joined       = profile?.joinedAt ? new Date(profile.joinedAt).toLocaleDateString('ko-KR') : '-'

    return (
        <>
            <div className="ci-window" style={{ left:pos.x, top:pos.y }}>
                <div className="ci-rail nd">
                    <div className="ci-rail-logo">
                        <img src="/SignBridge.png" alt="SB" className="ci-rail-logo-img"
                             onError={e => { e.target.style.display='none'; e.target.nextElementSibling.style.display='flex' }}/>
                        <div className="ci-rail-logo-fallback" style={{display:'none'}}>🤟</div>
                    </div>
                    <nav className="ci-rail-nav">
                        <button className={`ci-rail-tab nd ${tab==='profile'?'active':''}`} onClick={() => setTab('profile')}>
                            <IconUser/><span className="ci-rail-tab-label">프로필</span>
                        </button>
                        <button className={`ci-rail-tab nd ${tab==='chats'?'active':''}`} onClick={() => setTab('chats')}>
            <span className="ci-rail-tab-icon-wrap">
              <IconChat/>
                {unreadTotal>0 && <span className="ci-rail-badge">{unreadTotal}</span>}
            </span>
                            <span className="ci-rail-tab-label">채팅</span>
                        </button>
                        <button className={`ci-rail-tab nd ${tab==='groups'?'active':''}`} onClick={() => setTab('groups')}>
                            <span className="ci-rail-tab-icon-wrap"><IconGroup/></span>
                            <span className="ci-rail-tab-label">그룹</span>
                        </button>
                    </nav>
                    <div className="ci-rail-bottom">
                        <button className="ci-rail-av-btn nd" onClick={() => setShowPhotoModal(true)}>
                            <div className="ci-rail-av">
                                {photo ? <span style={{fontSize:22}}>{photo}</span> : <span>{displayName.charAt(0)}</span>}
                            </div>
                        </button>
                    </div>
                </div>

                <div className="ci-main">
                    {tab==='profile' && (
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
                                        {nickname && nickname !== displayName && (
                                            <div className="ci-prof-hero-nick">{nickname}</div>
                                        )}
                                        <div className="ci-prof-hero-email">{displayEmail}</div>
                                    </div>
                                    <div className="ci-prof-hero-arrow">›</div>
                                </div>
                                <div className="ci-section-label">기본 정보</div>
                                <div className="ci-info-card">
                                    {[
                                        ['이름',        displayName],
                                        ['닉네임',      nickname || '(미설정)'],
                                        ['이메일',      displayEmail],
                                        ['사용자 유형', profile?.orgType||'개인 사용자'],
                                        ['가입일',      joined],
                                        ['장애 등급',   profile?.disabilityGrade||'-'],
                                        ['주 사용 수어',profile?.preferredSign||'-'],
                                    ].map(([k,v]) => (
                                        <div className="ci-info-row" key={k}><span className="ci-info-key">{k}</span><span className="ci-info-val">{v}</span></div>
                                    ))}
                                </div>
                                <div className="ci-section-label">주소 정보</div>
                                <div className="ci-info-card" style={{marginBottom:20}}>
                                    {[['주소',profile?.address||'-'],['상세주소',profile?.addressDetail||'-'],['우편번호',profile?.zonecode||'-']].map(([k,v]) => (
                                        <div className="ci-info-row" key={k}><span className="ci-info-key">{k}</span><span className="ci-info-val">{v}</span></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {tab==='chats' && (
                        <div className="ci-pane">
                            <div className="ci-pane-hd ci-chats-hd" onMouseDown={onMouseDown}>
                                <div className="ci-chats-brand">
                                    <img src="/SignBridge.png" alt="SignBridge" className="ci-chats-logo" onError={e => e.target.style.display='none'}/>
                                    <span className="ci-pane-title">Chats</span>
                                </div>
                                <button className="ci-pane-close nd" onClick={onClose}>✕</button>
                            </div>
                            <div className="ci-search nd">
                                <span style={{color:'#a0aec0',flexShrink:0,display:'flex'}}><IconSearch/></span>
                                <input className="ci-search-input" placeholder="검색..." value={search} onChange={e => setSearch(e.target.value)}/>
                                {search && <button className="ci-search-clear nd" onClick={() => setSearch('')}>✕</button>}
                            </div>
                            <div className="ci-filter-row nd">
                                <button className={`ci-filter-btn nd ${chatFilter==='all'?'active':''}`} onClick={() => setChatFilter('all')}>전체</button>
                                <button className={`ci-filter-btn nd ${chatFilter==='unread'?'active':''}`} onClick={() => setChatFilter('unread')}>
                                    읽지 않음{unreadTotal>0&&<span className="ci-filter-count">{unreadTotal}</span>}
                                </button>
                            </div>
                            <div className="ci-pane-scroll nd" onClick={() => setMenuOpenId(null)}>
                                {!filteredRooms.length ? (
                                    <div className="ci-empty">
                                        <div className="ci-empty-icon">{chatFilter==='unread'?'✅':'💬'}</div>
                                        <div>{chatFilter==='unread'?'읽지 않은 대화가 없어요':'아직 대화가 없어요'}</div>
                                    </div>
                                ) : filteredRooms.map(room => (
                                    <div key={room.id} className="ci-room-wrap">
                                        <div className={`ci-room-row ${room.unread>0?'ci-room-unread':''}`}
                                             onClick={() => { if(menuOpenId===room.id){setMenuOpenId(null);return} openChat(room) }}>
                                            <div className="ci-room-av">
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
                                                    {room.unread>0&&<span className="ci-unread-badge">{room.unread}</span>}
                                                </div>
                                            </div>
                                            <button className="ci-room-dots nd"
                                                    onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId===room.id?null:room.id) }}>
                                                <IconRoomDots/>
                                            </button>
                                        </div>
                                        {menuOpenId===room.id && (
                                            <RoomMenu room={room}
                                                      onMarkRead={() => markRead(room.id)} onMute={() => muteRoom(room.id)}
                                                      onDelete={() => deleteRoom(room.id)} onBlock={() => blockRoom(room.id)}
                                                      onClose={() => setMenuOpenId(null)}/>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tab==='groups' && (
                        <div className="ci-pane">
                            <div className="ci-pane-hd" onMouseDown={onMouseDown}>
                                <span className="ci-pane-title">공개 그룹</span>
                                <button className="ci-pane-close nd" onClick={onClose}>✕</button>
                            </div>
                            <div className="ci-pane-scroll nd">
                                <div className="ci-section-label" style={{paddingTop:14}}>공식 채팅방</div>
                                {OFFICIAL_ROOMS.map(room => (
                                    <OfficialRoomBanner key={room.id} room={room}
                                                        joined={joinedGroups.includes(room.id)}
                                                        onJoin={() => joinGroup(room.id)}
                                                        onLeave={() => leaveGroup(room.id)}
                                                        onOpen={() => openChat(room, true)}
                                                        onPreview={() => setPreviewRoom(room)}/>
                                ))}
                                <div className="ci-groups-hint">참여한 그룹 채팅은 여기에서 열 수 있어요.</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showPhotoModal && (
                <ProfileEditModal nickname={nickname} photo={photo} myName={myName}
                                  onSave={handleProfileSave} onClose={() => setShowPhotoModal(false)}/>
            )}

            {previewRoom && (
                <GroupPreviewModal room={previewRoom}
                                   onJoin={() => { joinGroup(previewRoom.id); openChat(previewRoom, true) }}
                                   onClose={() => setPreviewRoom(null)}/>
            )}

            {openRooms.map(room => (
                <ChatWindow key={room.id} room={room} isGroup={!!room.isGroup}
                            myEmail={myEmail} myName={myName} myNickname={nickname} myPhoto={photo}
                            allRooms={rooms}
                            onClose={() => setOpenRooms(prev => prev.filter(r => r.id!==room.id))}/>
            ))}
        </>
    )
}