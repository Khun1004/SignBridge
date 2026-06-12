import { useState, useEffect, useRef } from 'react'
import './ChatRoom.css'
import chatService from './chatService'
const ROOMS_KEY   = 'sb_chat_rooms'
const NICK_KEY  = (email) => `sb_my_nickname_${email}`
const PHOTO_KEY = (email) => `sb_my_photo_${email}`
const BLOCKED_KEY = 'sb_blocked'
const typingKey   = (id) => `sb_typing_${id}`
const msgsKey     = (id) => `sb_chat_msgs_${id}`
const pinnedKey   = (id) => `sb_pinned_${id}`
const membersKey  = (id) => `sb_members_${id}`
const readKey     = (roomId, email) => `sb_read_${roomId}_${email}`

const load  = (k, fb) => { try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? fb } catch { return fb } }
const save  = (k, v)  => localStorage.setItem(k, JSON.stringify(v))
const loadM = (id)    => load(msgsKey(id), [])
const saveM = (id, m) => save(msgsKey(id), m)

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

// Helper: get the other person's name in a 1:1 room
const getOtherName = (room, myEmail, messages) => {
  if (!room || room.isGroup) return room?.name || ''
  // Try from participants + message history
  if (room.participants) {
    const parts = room.participants.split(',').map(e => e.trim())
    const otherEmail = parts.find(e => e !== myEmail)
    if (otherEmail) {
      const otherMsg = messages?.find(m => m.email === otherEmail)
      if (otherMsg?.name) return otherMsg.name
    }
  }
  return room.name || '상대방'
}

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

function usePopoverDir(ref) {
  const [dir, setDir] = useState('up')
  useEffect(() => {
    if (!ref?.current) return
    const el = ref.current
    const container = el.closest('.cw-messages')
    if (!container) return
    const elRect  = el.getBoundingClientRect()
    const conRect = container.getBoundingClientRect()
    const relY = (elRect.top + elRect.height / 2) - conRect.top
    setDir(relY > conRect.height * 0.55 ? 'up' : 'down')
  })
  return dir
}

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

function FullEmojiPicker({ onSelect, onClose, isMe, dir='up' }) {
  const [search, setSearch] = useState('')
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
        <input className="cw-fp-search nd" autoFocus placeholder="이모지 검색…" value={search} onChange={e => setSearch(e.target.value)}/>
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

function MsgContextMenu({ msg, isMe, isPinned, dir='up', onEdit, onDelete, onCopy, onForward, onPin, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    setTimeout(() => document.addEventListener('mousedown', h), 0)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])
  const fmtMsgTime = msg.at ? new Date(msg.at).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' }) : ''
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
      <div className="cw-who-reacted-hd">
        모든 반응
        <button className="cw-who-close nd" onClick={onClose}><IconX/></button>
      </div>
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

function GroupPreviewModal({ room, onJoin, onClose }) {
  return (
    <div className="ci-modal-overlay nd" onClick={onClose}>
      <div className="ci-group-preview nd" onClick={e => e.stopPropagation()}>
        <div className="ci-gp-header">
          <div className="ci-gp-av">{room.avatar}</div>
          <button className="ci-gp-close nd" onClick={onClose}><IconX/></button>
        </div>
        <div className="ci-gp-info">
          <div className="ci-gp-name">{room.name}{room.isOfficial && <span className="ci-official-badge">공식</span>}</div>
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

function MsgSearchPanel({ messages, onJump, onClose }) {
  const [q, setQ] = useState('')
  const results = q.trim() ? messages.filter(m => (m.text||m.fileName||'').toLowerCase().includes(q.toLowerCase())) : []
  return (
    <div className="cw-msgsearch nd">
      <div className="cw-msgsearch-hd">
        <span className="cw-msgsearch-title">메시지 검색</span>
        <button className="cw-msgsearch-close nd" onClick={onClose}><IconX/></button>
      </div>
      <div className="cw-msgsearch-input-wrap">
        <IconSearch/>
        <input className="cw-msgsearch-input nd" autoFocus placeholder="검색어 입력..." value={q} onChange={e => setQ(e.target.value)}/>
      </div>
      <div className="cw-msgsearch-results">
        {q.trim() && !results.length && <div className="cw-msgsearch-empty">결과 없음</div>}
        {results.map(m => (
          <div key={m.id} className="cw-msgsearch-row" onClick={() => { onJump(m.id); onClose() }}>
            <div className="cw-msgsearch-who">{m.name}</div>
            <div className="cw-msgsearch-snippet">
              {(m.text||m.fileName||'').split(new RegExp(`(${q})`, 'gi')).map((p, i) =>
                p.toLowerCase() === q.toLowerCase() ? <mark key={i}>{p}</mark> : p
              )}
            </div>
            <div className="cw-msgsearch-time">{fmtTime(m.at)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

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

function RoomMenu({ room, onMarkRead, onMute, onDelete, onBlock, onLeave, onClose }) {
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
      {room.isGroup ? (
        <>
          {item('🗑','삭제하기', onDelete, true)}
          {item('🚪','나가기', onLeave, true)}
        </>
      ) : (
        <>
          {item('🗑','대화 삭제', onDelete, true)}
          {item('🚫','차단하기', onBlock, true)}
        </>
      )}
    </div>
  )
}

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
      <button className={`ci-official-join nd ${joined?'ci-official-leave':''}`} onClick={joined ? onLeave : onJoin}>
        {joined ? '나가기' : '참여하기'}
      </button>
    </div>
  )
}

function ForwardModal({ msg, currentRoomId, onForward, onClose }) {
  const rooms  = load(ROOMS_KEY, []).filter(r => r.id !== currentRoomId)
  const joined = load('sb_joined_groups', [])
  const groups = OFFICIAL_ROOMS.filter(r => joined.includes(r.id) && r.id !== currentRoomId)
  const all    = [...rooms, ...groups]
  const preview = msg.text ? (msg.text.length > 55 ? msg.text.slice(0, 55) + '…' : msg.text) : msg.fileName || '파일'
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
            <div className="cw-fwd-empty"><div className="cw-fwd-empty-icon">💬</div><div>전달할 대화방이 없어요</div></div>
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


/* ═══════════════════════════════════════════════════════════════
   CHAT WINDOW — clean rewrite
   Rules:
   1. Load messages from backend on open
   2. WebSocket subscription for real-time
   3. Poll every 3s as backup
   4. Optimistic send (show immediately, replace with server msg)
   5. READ receipt when window is open
   6. Show "1" on my messages until other person reads
═══════════════════════════════════════════════════════════════ */
function ChatWindow({ room, myEmail, myName, myNickname, myPhoto, onClose, isGroup=false, onRefreshRooms, userNames={} }) {
  const displayName = myNickname || myName

  const [messages,    setMessages]   = useState([])
  const [input,       setInput]      = useState('')
  const [replyTo,     setReplyTo]    = useState(null)
  const [editingMsg,  setEditingMsg] = useState(null)
  const [popover,     setPopover]    = useState(null)
  const [pinned,      setPinned]     = useState(null)
  const [showSearch,  setShowSearch] = useState(false)
  const [showMembers, setShowMembers]= useState(false)
  const [imgPreview,  setImgPreview] = useState(null)
  const [forwardMsg,  setForwardMsg] = useState(null)
  const [readByOther, setReadByOther]= useState(false) // has other person read my messages?

  const bottomRef   = useRef(null)
  const msgRefs     = useRef({})
  const fileRef     = useRef(null)
  const inputRef    = useRef(null)
  const typingTimer = useRef(null)

  const { pos, onMouseDown } = useDrag({
    x: Math.max(20, window.innerWidth  - 980),
    y: Math.max(20, window.innerHeight - 780),
  })

  // Other person's email for display
  const otherEmail = !isGroup && room.participants
    ? room.participants.split(',').map(e=>e.trim()).find(e=>e!==myEmail) || ''
    : ''

  // Room display name — use account name from userNames cache (most reliable)
  const getRoomDisplayName = () => {
    if (isGroup) return room.name
    if (!otherEmail) return room.name || '상대방'
    // Best: account name from users API cache
    if (userNames[otherEmail]) return userNames[otherEmail]
    // Second best: from actual messages
    const fromMsg = messages.find(m => m.email === otherEmail)?.name
    if (fromMsg) return fromMsg
    if (!room.participants) return room.name || otherEmail.split('@')[0]
    const parts = room.participants.split(',').map(e => e.trim())
    const iAmA = parts[0] === myEmail
    if (iAmA) {
      if (room.name && !room.name.includes('@')) return room.name
    } else {
      if (room.sub && !room.sub.includes('@')) return room.sub
    }
    return otherEmail.split('@')[0]
  }
  const roomDisplayName = getRoomDisplayName()

  // Convert backend message to local format
  const toLocal = (m) => ({
    id: m.id,
    email: m.senderEmail || m.email,
    name: m.senderName || m.name,
    text: m.text,
    at: m.sentAt || m.at,
    reactions: m.reactions || {},
    edited: !!m.isEdited || !!m.edited,
    replyTo: m.replyTo || null,
    fileName: m.fileName || null,
    fileSize: m.fileSize || null,
    imageData: m.imageData || null,
    forwarded: !!m.forwarded,
    forwardedFrom: m.forwardedFrom || null,
    isSystem: !!m.isSystem,
  })

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // ── Load history + subscribe + poll ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    // Load history
    fetch(`http://localhost:8080/api/chat/rooms/${room.id}/messages`)
      .then(r => r.json())
      .then(data => {
        if (cancelled || !Array.isArray(data)) return
        setMessages(data.map(toLocal))
      })
      .catch(() => {})

    // Real-time subscription
    const unsub = chatService.subscribeToRoom(room.id, (msg) => {
      if (msg.type === 'DELETE') {
        setMessages(prev => prev.filter(m => String(m.id) !== String(msg.id)))
        return
      }
      if (msg.type === 'EDIT') {
        setMessages(prev => prev.map(m =>
          String(m.id) === String(msg.id) ? {...m, text: msg.text, edited: true} : m
        ))
        return
      }
      if (msg.type === 'READ') {
        setReadByOther(true)
        return
      }
      // New message — replace temp or add new
      const incoming = toLocal({
        id: msg.id, senderEmail: msg.senderEmail, senderName: msg.senderName,
        text: msg.text, sentAt: msg.sentAt,
      })
      setMessages(prev => {
        // Replace temp with same text from same sender
        const withoutTemp = prev.filter(m =>
          !(String(m.id).startsWith('temp_') && m.email === incoming.email && m.text === incoming.text)
        )
        if (withoutTemp.some(m => String(m.id) === String(incoming.id))) return withoutTemp
        return [...withoutTemp, incoming]
      })
    })

    // Polling backup every 3s
    const poll = setInterval(() => {
      fetch(`http://localhost:8080/api/chat/rooms/${room.id}/messages`)
        .then(r => r.json())
        .then(data => {
          if (cancelled || !Array.isArray(data)) return
          const server = data.map(toLocal)
          setMessages(prev => {
            const existingIds = new Set(
              prev.filter(m => !String(m.id).startsWith('temp_')).map(m => String(m.id))
            )
            const hasNew = server.some(m => !existingIds.has(String(m.id)))
            if (!hasNew) return prev
            const temps = prev.filter(m =>
              String(m.id).startsWith('temp_') &&
              !server.some(s => s.email === m.email && s.text === m.text)
            )
            return [...server, ...temps]
          })
        })
        .catch(() => {})
    }, 3000)

    return () => {
      cancelled = true
      unsub()
      clearInterval(poll)
    }
  }, [room.id])

  // ── Send READ receipt when window open and messages exist ────────────────────
  useEffect(() => {
    if (messages.some(m => m.email !== myEmail)) {
      chatService.markRead(room.id, myEmail)
    }
  }, [messages.length])

  // ── Send message ─────────────────────────────────────────────────────────────
  const send = () => {
    if (editingMsg) {
      const text = input.trim()
      if (!text) return
      chatService.editMessage(editingMsg.id, room.id, text)
      setMessages(prev => prev.map(m => m.id === editingMsg.id ? {...m, text, edited: true} : m))
      setEditingMsg(null); setInput('')
      return
    }
    const text = input.trim()
    if (!text) return
    setInput(''); setReplyTo(null)


    // Show immediately (optimistic)
    const tempId = `temp_${Date.now()}`
    setMessages(prev => [...prev, {
      id: tempId, email: myEmail, name: displayName, text,
      at: new Date().toISOString(), reactions: {}, edited: false,
      replyTo: replyTo ? {id:replyTo.id, name:replyTo.name, text:replyTo.text} : null,
    }])
    setReadByOther(false) // reset read state when sending new message

    // Send via WebSocket
    chatService.sendMessage({ roomId: room.id, senderEmail: myEmail, senderName: displayName, text })
    onRefreshRooms?.()
  }

  const deleteMsg = (id) => {
    chatService.deleteMessage(id, room.id)
    setMessages(prev => prev.filter(m => String(m.id) !== String(id)))
  }

  const handleFileSelect = (file) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setImgPreview({ file, dataUrl: e.target.result })
      reader.readAsDataURL(file)
    }
  }

  const sendFile = (file, dataUrl) => {
    const msg = {
      id: `temp_${Date.now()}`, email: myEmail, name: displayName,
      at: new Date().toISOString(), reactions: {}, edited: false,
      imageData: dataUrl, fileName: file.name, fileSize: file.size,
    }
    setMessages(prev => [...prev, msg])
    setImgPreview(null)
  }

  const addReaction = (msgId, emoji) => {
    setMessages(prev => prev.map(m => {
      if (String(m.id) !== String(msgId)) return m
      const r = {...(m.reactions || {})}
      r[myEmail] === emoji ? delete r[myEmail] : (r[myEmail] = emoji)
      return {...m, reactions: r}
    }))
  }

  const aggregateReactions = (reactions) => {
    const agg = {}
    Object.values(reactions||{}).forEach(e => { agg[e] = (agg[e]||0)+1 })
    return Object.entries(agg).filter(([,c])=>c>0)
  }

  const pinMessage   = (msg) => setPinned({id:msg.id, text:msg.text, name:msg.name})
  const unpinMessage = ()    => setPinned(null)
  const jumpToMsg    = (id)  => msgRefs.current[id]?.scrollIntoView({behavior:'smooth', block:'center'})
  const startEdit    = (msg) => { setEditingMsg({id:msg.id}); setInput(msg.text); setTimeout(()=>inputRef.current?.focus(),50) }
  const closePopover = ()    => setPopover(null)

  const broadcastTyping = () => {
    const d = load(typingKey(room.id), {})
    d[myEmail] = Date.now(); save(typingKey(room.id), d)
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      const d2 = load(typingKey(room.id), {}); delete d2[myEmail]; save(typingKey(room.id), d2)
    }, 3000)
  }

  const forwardToRoom = (targetRoom, msg) => {
    setForwardMsg(null)
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
    if (e.key === 'Escape' && editingMsg) { setEditingMsg(null); setInput('') }
  }

  const nameMap = {[myEmail]: displayName}
  messages.forEach(m => { if (m.email && m.name) nameMap[m.email] = m.name })

  let lastDate = null
  const rows = messages.map(msg => {
    const isMe    = msg.email === myEmail
    const dl      = fmtDate(msg.at)
    const showDt  = dl !== lastDate; lastDate = dl
    const aggR    = aggregateReactions(msg.reactions)
    const myR     = (msg.reactions||{})[myEmail]
    const isPinned= pinned?.id === msg.id
    // Show "1" only on my messages that haven't been read by other person
    const showUnread = isMe && !readByOther && !String(msg.id).startsWith('temp_') === false
      ? true
      : isMe && !readByOther

    const isCtxOpen   = popover?.msgId === msg.id && popover.type === 'ctx'
    const isQuickOpen = popover?.msgId === msg.id && popover.type === 'quickReact'
    const isFullOpen  = popover?.msgId === msg.id && popover.type === 'fullPicker'
    const isWhoOpen   = popover?.msgId === msg.id && popover.type === 'whoReacted'

    const msgEl = msgRefs.current[msg.id]
    let popDir = 'up'
    if (msgEl) {
      const container = msgEl.closest('.cw-messages')
      if (container) {
        const relY = (msgEl.getBoundingClientRect().top + msgEl.getBoundingClientRect().height/2) - container.getBoundingClientRect().top
        popDir = relY > container.getBoundingClientRect().height * 0.55 ? 'up' : 'down'
      }
    }

    if (msg.isSystem) return (
      <div key={msg.id} className="cw-row-system"><span className="cw-system-msg">{msg.text}</span></div>
    )

    return (
      <div key={msg.id} ref={el => { if(el) msgRefs.current[msg.id]=el }}>
        {showDt && <div className="cw-date-div"><span>{dl}</span></div>}
        <div className={`cw-msg-block ${isMe?'cw-msg-block-me':'cw-msg-block-them'}`}>
          {msg.edited && <div className={`cw-edited-label ${isMe?'cw-edited-me':'cw-edited-them'}`}>수정됨</div>}
          <div className={`cw-row ${isMe?'cw-me':'cw-them'} ${isPinned?'cw-row-pinned':''}`}>
            {!isMe && <div className="cw-avatar">{(msg.name||'?').charAt(0)}</div>}
            <div className="cw-bwrap">
              {!isMe && isGroup && <div className="cw-sender">{msg.name}</div>}
              <div className="cw-bubble-wrap">
                <div className={`cw-bubble ${isMe?'cw-bubble-me':'cw-bubble-them'}`}>
                  {msg.forwarded && <div className="cw-fwd-badge"><IconForward/> {msg.forwardedFrom}에서 전달됨</div>}
                  {msg.replyTo && (
                    <div className="cw-reply-inbubble" onClick={e=>{e.stopPropagation();jumpToMsg(msg.replyTo.id)}}>
                      <div className="cw-reply-inbubble-name">{msg.replyTo.name}</div>
                      <div className="cw-reply-inbubble-text">{msg.replyTo.text}</div>
                    </div>
                  )}
                  {msg.imageData
                    ? <div className="cw-img-wrap"><img src={msg.imageData} alt={msg.fileName} className="cw-img"/></div>
                    : msg.fileName
                    ? <div className="cw-file"><div className="cw-file-icon">📎</div><div className="cw-file-info"><div className="cw-file-name">{msg.fileName}</div>{msg.fileSize&&<div className="cw-file-size">{fmtFileSize(msg.fileSize)}</div>}</div></div>
                    : msg.text}
                </div>
                {/* Hover action bar */}
                <div className={`cw-hover-bar nd ${isMe?'cw-hover-bar-left':'cw-hover-bar-right'}`}>
                  <button className={`cw-hbar-btn nd ${isCtxOpen?'cw-hbar-active':''}`}
                    onClick={e=>{e.stopPropagation();setPopover(isCtxOpen?null:{msgId:msg.id,type:'ctx'})}}>
                    <IconDots/>
                  </button>
                  <button className="cw-hbar-btn nd"
                    onClick={e=>{e.stopPropagation();setReplyTo({id:msg.id,name:msg.name,text:msg.text});closePopover()}}>
                    <IconReply/>
                  </button>
                  <button className={`cw-hbar-btn nd ${isQuickOpen||isFullOpen?'cw-hbar-active':''}`}
                    onClick={e=>{e.stopPropagation();setPopover(isQuickOpen?null:{msgId:msg.id,type:'quickReact'})}}>
                    <span style={{fontSize:15,lineHeight:1}}>{myR||'😊'}</span>
                  </button>
                </div>
                {isCtxOpen && <div onClick={e=>e.stopPropagation()}>
                  <MsgContextMenu msg={msg} isMe={isMe} isPinned={isPinned} dir={popDir}
                    onEdit={()=>{startEdit(msg);closePopover()}}
                    onDelete={()=>{deleteMsg(msg.id);closePopover()}}
                    onCopy={()=>{navigator.clipboard?.writeText(msg.text||'');closePopover()}}
                    onForward={()=>{setForwardMsg(msg);closePopover()}}
                    onPin={()=>{isPinned?unpinMessage():pinMessage(msg);closePopover()}}
                    onClose={closePopover}/>
                </div>}
                {isQuickOpen && <div onClick={e=>e.stopPropagation()}>
                  <QuickReactionBar msgId={msg.id} myReaction={myR} isMe={isMe} dir={popDir}
                    onReact={(id,emoji)=>{addReaction(id,emoji);closePopover()}}
                    onOpenFull={()=>setPopover({msgId:msg.id,type:'fullPicker'})}
                    onClose={closePopover}/>
                </div>}
                {isFullOpen && <div onClick={e=>e.stopPropagation()}>
                  <FullEmojiPicker isMe={isMe} dir={popDir}
                    onSelect={emoji=>{addReaction(msg.id,emoji);closePopover()}}
                    onClose={closePopover}/>
                </div>}
              </div>
              {aggR.length > 0 && (
                <div className={`cw-reactions ${isMe?'reactions-left':'reactions-right'}`}>
                  {aggR.map(([e,count])=>(
                    <span key={e} className={`cw-reaction-chip nd ${myR===e?'cw-reaction-mine':''}`}
                      onClick={ev=>{ev.stopPropagation();addReaction(msg.id,e)}}>{e} {count}</span>
                  ))}
                  <button className="cw-who-btn nd"
                    onClick={ev=>{ev.stopPropagation();setPopover(isWhoOpen?null:{msgId:msg.id,type:'whoReacted'})}}>
                    <IconMembers/>
                  </button>
                  {isWhoOpen && <div onClick={e=>e.stopPropagation()}>
                    <WhoReacted reactions={msg.reactions} nameMap={nameMap} dir={popDir} onClose={closePopover}/>
                  </div>}
                </div>
              )}
            </div>
            {/* Time + unread indicator */}
            <div className={`cw-side-meta ${isMe?'cw-side-meta-me':'cw-side-meta-them'}`}>
              {isMe && showUnread && <span className="cw-unread-num">1</span>}
              <span className="cw-time">{fmtTime(msg.at)}</span>
            </div>
          </div>
        </div>
      </div>
    )
  })

  return (
    <>
    <div className="cw-window" style={{left:pos.x, top:pos.y}}>
      <div className="cw-header" onMouseDown={onMouseDown}>
        <div className="cw-header-left">
          <div className="cw-av-sm">{room.avatar || roomDisplayName.charAt(0)}</div>
          <div>
            <div className="cw-hname">{roomDisplayName}{isGroup&&<span className="cw-group-badge">그룹</span>}</div>
            <div className="cw-hsub">{isGroup ? `${fmtMembers(room.memberCount||0)}명` : otherEmail}</div>
          </div>
        </div>
        <div className="cw-header-actions nd">
          {isGroup && <button className={`cw-hbtn nd ${showMembers?'cw-hbtn-active':''}`}
            onClick={()=>{setShowMembers(v=>!v);setShowSearch(false)}}><IconMembers/></button>}
          <button className={`cw-hbtn nd ${showSearch?'cw-hbtn-active':''}`}
            onClick={()=>{setShowSearch(v=>!v);setShowMembers(false)}}><IconMsgSrch/></button>
          <button className="cw-hclose nd" onClick={onClose}>✕</button>
        </div>
      </div>

      {showSearch  && <MsgSearchPanel messages={messages} onJump={jumpToMsg} onClose={()=>setShowSearch(false)}/>}
      {showMembers && <MemberPanel roomId={room.id} myEmail={myEmail} myName={myName} onClose={()=>setShowMembers(false)}/>}
      {pinned && <PinnedBar pinned={pinned} onJump={()=>jumpToMsg(pinned.id)} onUnpin={unpinMessage}/>}

      <div className="cw-messages">
        {!rows.length && (
          <div className="cw-empty">
            <div className="cw-empty-av">{room.avatar || roomDisplayName.charAt(0)}</div>
            <div className="cw-empty-name">{roomDisplayName}</div>
            <div className="cw-empty-hint">첫 메시지를 보내보세요 👋</div>
          </div>
        )}
        {rows}
        <TypingIndicator roomId={room.id} myEmail={myEmail}/>
        <div ref={bottomRef}/>
      </div>

      {editingMsg && (
        <div className="cw-edit-bar nd">
          <div className="cw-edit-bar-content">
            <IconPencil/>
            <div className="cw-edit-bar-info">
              <span className="cw-edit-bar-label">메시지 수정 중</span>
              <span className="cw-edit-bar-text">{input}</span>
            </div>
          </div>
          <button className="cw-reply-bar-close nd" onClick={()=>{setEditingMsg(null);setInput('')}}><IconX/></button>
        </div>
      )}
      {replyTo && !editingMsg && (
        <div className="cw-reply-bar nd">
          <div className="cw-reply-bar-content">
            <IconReply/>
            <div className="cw-reply-bar-info">
              <span className="cw-reply-bar-name">{replyTo.name}에게 답장</span>
              <span className="cw-reply-bar-text">{replyTo.text}</span>
            </div>
          </div>
          <button className="cw-reply-bar-close nd" onClick={()=>setReplyTo(null)}><IconX/></button>
        </div>
      )}

      <div className="cw-input-row nd">
        <button className="cw-attach-btn nd" onClick={()=>fileRef.current?.click()}><IconClip/></button>
        <input ref={fileRef} type="file" accept="image/*,*/*" style={{display:'none'}}
          onChange={e=>{const f=e.target.files?.[0];if(f)handleFileSelect(f);e.target.value=''}}/>
        <textarea ref={inputRef} className="cw-input"
          placeholder={editingMsg?'수정할 내용 입력…':'메시지를 입력하세요… (Enter 전송)'}
          value={input}
          onChange={e=>{setInput(e.target.value);broadcastTyping()}}
          onKeyDown={onKey} rows={1}/>
        <button className="cw-send nd" onClick={send} disabled={!input.trim()}><IconSend/></button>
      </div>
    </div>

    {imgPreview && <ImagePreview file={imgPreview.file} dataUrl={imgPreview.dataUrl}
      onSend={()=>sendFile(imgPreview.file,imgPreview.dataUrl)} onCancel={()=>setImgPreview(null)}/>}
    {forwardMsg && <ForwardModal msg={forwardMsg} currentRoomId={room.id}
      onForward={forwardToRoom} onClose={()=>setForwardMsg(null)}/>}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   INBOX — chat list + notifications
═══════════════════════════════════════════════════════════════ */
export default function ChatRoom({ onClose, myEmail='', myName='', profile=null, initialRoom=null, onRegisterRefresh=null, onUnreadChange=null, visible=true }) {
  const [rooms,         setRooms]        = useState([])
  const [openRooms,     setOpenRooms]    = useState([])
  const [tab,           setTab]          = useState('chats')
  const [search,        setSearch]       = useState('')
  const [chatFilter,    setChatFilter]   = useState('all')
  const [nickname,      setNickname]     = useState(() => {
    const s = localStorage.getItem(NICK_KEY(myEmail))
    if (s) return s
    if (myName) { localStorage.setItem(NICK_KEY(myEmail), myName); return myName }
    return ''
  })
  const [photo,         setPhoto]        = useState(() => localStorage.getItem(PHOTO_KEY(myEmail)) || '')
  const [showPhotoModal,setShowPhotoModal]= useState(false)
  const [menuOpenId,    setMenuOpenId]   = useState(null)
  const [blocked,       setBlocked]      = useState(() => load(BLOCKED_KEY, []))
  const [joinedGroups,  setJoinedGroups] = useState(() => load('sb_joined_groups', []))
  const [previewRoom,   setPreviewRoom]  = useState(null)
  // No toast notifications — just unread badges on room list
  const openRoomsRef = useRef([])

  const { pos, onMouseDown } = useDrag({
    x: Math.max(20, window.innerWidth  - 500),
    y: Math.max(20, window.innerHeight - 780),
  })

  // Keep ref in sync
  useEffect(() => { openRoomsRef.current = openRooms }, [openRooms])

  // ── User name cache ──────────────────────────────────────────────────────
  const [userNames, setUserNames] = useState({}) // email -> name

  useEffect(() => {
    if (!myEmail) return
    fetch(`http://localhost:8080/api/chat/users?email=${encodeURIComponent(myEmail)}`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return
        const map = {}
        data.forEach(u => { if (u.email && u.name) map[u.email] = u.name })
        setUserNames(map)
      })
      .catch(() => {})
  }, [myEmail])

  // ── Load joined group rooms on mount ─────────────────────────────────────
  useEffect(() => {
    if (!myEmail) return
    // Load official groups the user has joined (stored in localStorage)
    const joined = load('sb_joined_groups', [])
    if (joined.length === 0) return
    // Fetch the actual room data from backend for each joined group
    Promise.all(
      OFFICIAL_ROOMS
        .filter(r => joined.includes(r.id))
        .map(r => fetch('http://localhost:8080/api/chat/groups/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId: r.id, name: r.name, sub: r.sub, avatar: r.avatar }),
        }).then(res => res.json()).catch(() => null))
    ).then(results => {
      results.forEach(backendRoom => {
        if (!backendRoom) return
        const gid2 = backendRoom.roomId || backendRoom.id
        const clearedAt2 = localStorage.getItem(`sb_group_cleared_${myEmail}_${gid2}`)
        const normalized = {
          ...backendRoom,
          id: gid2,
          isGroup: true,
          isOfficial: true,
          avatar: OFFICIAL_ROOMS.find(r => r.id === gid2)?.avatar || backendRoom.avatar,
          memberCount: OFFICIAL_ROOMS.find(r => r.id === gid2)?.memberCount || 0,
          clearedAt: clearedAt2 || null,
        }
        setRooms(prev => prev.find(r => r.id === normalized.id) ? prev : [...prev, normalized])
      })
    })
  }, [myEmail])

  // ── Load rooms from backend ────────────────────────────────────────────────
  const getHidden = () => {
    if (!myEmail) return []
    return JSON.parse(localStorage.getItem(`sb_hidden_${myEmail}`) || '[]')
  }
  const setHidden = (list) => {
    if (!myEmail) return
    localStorage.setItem(`sb_hidden_${myEmail}`, JSON.stringify(list))
  }

  const refreshRooms = () => {
    if (!myEmail) return
    const hidden = getHidden()
    fetch(`http://localhost:8080/api/chat/rooms?email=${encodeURIComponent(myEmail)}`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return
        const mapped = data.map(r => ({...r, id: r.roomId || r.id}))
        const visible = hidden.length > 0 ? mapped.filter(r => !hidden.includes(r.id)) : mapped
        // Preserve existing unread counts AND keep group rooms (not returned by this endpoint)
        setRooms(prev => {
          const groupRooms = prev.filter(r => r.isGroup)
          const merged = visible.map(room => {
            const existing = prev.find(r => r.id === room.id)
            return {...room, unread: existing?.unread || 0, muted: existing?.muted || false}
          })
          // Add group rooms that aren't in the direct rooms list
          groupRooms.forEach(gr => {
            if (!merged.find(r => r.id === gr.id)) merged.push(gr)
          })
          return merged
        })
      })
      .catch(err => console.error('refreshRooms failed:', err))
  }

  useEffect(() => { refreshRooms() }, [myEmail])

  // Poll room list every 5s
  useEffect(() => {
    if (!myEmail) return
    const t = setInterval(refreshRooms, 5000)
    return () => clearInterval(t)
  }, [myEmail])

  // Expose to App.jsx
  useEffect(() => { if (onRegisterRefresh) onRegisterRefresh(refreshRooms) }, [myEmail])

  // ── Notification subscription ─────────────────────────────────────────────
  useEffect(() => {
    if (!myEmail) return
    const unsub = chatService.subscribe(`/topic/notifications_${myEmail}`, (msg) => {
      if (!msg.roomId || msg.senderEmail === myEmail) return
      const hidden = getHidden()
      const isHidden = hidden.includes(msg.roomId)
      const windowOpen = !!openRoomsRef.current.find(r => r.id === msg.roomId)

      if (isHidden) {
        const h = getHidden()
        const room = openRoomsRef.current.find(r => r.id === msg.roomId)
        // For group rooms that were "deleted for me" — restore with unread badge
        // For 1:1 rooms — same restore logic
        setHidden(h.filter(id => id !== msg.roomId))
        setTimeout(() => {
          refreshRooms()
          setTimeout(() => {
            setRooms(prev => {
              // If it's a group room, restore it from OFFICIAL_ROOMS data
              const existing = prev.find(r => r.id === msg.roomId)
              if (!existing) {
                const officialRoom = OFFICIAL_ROOMS.find(r => r.id === msg.roomId)
                if (officialRoom) {
                  return [...prev, {...officialRoom, unread: 1, lastMsg: msg.text || '', lastAt: msg.sentAt}]
                }
              }
              return prev.map(r => r.id === msg.roomId
                ? {...r, unread: 1, lastMsg: msg.text || '', lastAt: msg.sentAt}
                : r
              )
            })
          }, 400)
        }, 300)
        return
      }

      // Update room list unread badge + lastMsg + lastAt for sorting
      setRooms(prev => {
        const exists = prev.find(r => r.id === msg.roomId)
        if (exists) {
          return prev.map(r => r.id === msg.roomId ? {
            ...r,
            lastMsg: msg.text || '',
            lastAt: msg.sentAt || new Date().toISOString(),
            unread: windowOpen ? 0 : (r.unread || 0) + 1,
          } : r)
        }
        // New room — refresh list
        setTimeout(refreshRooms, 300)
        return prev
      })
    })
    return () => unsub()
  }, [myEmail])

  // ── Group notification subscriptions ────────────────────────────────────
  useEffect(() => {
    if (!myEmail || joinedGroups.length === 0) return
    const unsubs = joinedGroups.map(gid => {
      return chatService.subscribe(`/topic/group_notifications_${gid}`, (msg) => {
        if (!msg.roomId || msg.senderEmail === myEmail) return
        const hidden = getHidden()
        const isHidden = hidden.includes(msg.roomId)
        const windowOpen = !!openRoomsRef.current.find(r => r.id === msg.roomId)

        if (isHidden) {
          // Fix 2: Deleted group — restore it when new message arrives
          const h = getHidden()
          setHidden(h.filter(id => id !== msg.roomId))
          // Find the room data from OFFICIAL_ROOMS
          const officialRoom = OFFICIAL_ROOMS.find(r => r.id === msg.roomId)
          if (officialRoom) {
            fetch('http://localhost:8080/api/chat/groups/join', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                groupId: officialRoom.id,
                name: officialRoom.name,
                sub: officialRoom.sub,
                avatar: officialRoom.avatar,
              }),
            })
              .then(r => r.json())
              .then(backendRoom => {
                const sessionKey = localStorage.getItem(`sb_group_session_${myEmail}_${msg.roomId}`) || Date.now().toString()
                const clearedTs2 = parseInt(sessionKey, 10)
                const normalized = {
                  ...backendRoom,
                  id: backendRoom.roomId || backendRoom.id,
                  isGroup: true,
                  isOfficial: true,
                  memberCount: officialRoom.memberCount,
                  avatar: officialRoom.avatar,
                  unread: 1,
                  lastMsg: msg.text || '',
                  lastAt: msg.sentAt,
                  clearedAt: sessionKey,
                }
                setRooms(prev => prev.find(r => r.id === normalized.id)
                  ? prev.map(r => r.id === normalized.id ? {
                      ...r, unread: (r.unread||0)+1,
                      lastMsg: msg.text||'',
                      lastAt: msg.sentAt,
                      clearedAt: sessionKey
                    } : r)
                  : [normalized, ...prev]
                )
              })
              .catch(() => {})
          }
          return
        }

        // Fix 1: Update unread badge + lastMsg
        setRooms(prev => prev.map(r => r.id === msg.roomId ? {
          ...r,
          lastMsg: msg.text || '',
          lastAt: msg.sentAt,
          unread: windowOpen ? 0 : (r.unread || 0) + 1,
        } : r))
      })
    })
    return () => unsubs.forEach(u => u())
  }, [myEmail, joinedGroups.join(',')])

  // ── Open initialRoom from Community ──────────────────────────────────────
  useEffect(() => {
    if (!initialRoom) return
    const normalized = {...initialRoom, id: initialRoom.roomId || initialRoom.id}
    if (!normalized.id) return

    // Remove from hidden list in case it was previously deleted
    const hidden = getHidden()
    if (hidden.includes(normalized.id)) {
      setHidden(hidden.filter(id => id !== normalized.id))
    }

    // Add to room list immediately so it shows right away
    setRooms(prev => prev.find(r => r.id === normalized.id) ? prev : [normalized, ...prev])
    // Open the chat window
    setOpenRooms(prev => prev.find(r => r.id === normalized.id) ? prev : [normalized])
    setTab('chats')
    // Refresh from backend to get full room data
    setTimeout(refreshRooms, 300)
  }, [initialRoom?.roomId || initialRoom?.id])


  // ── Room actions ──────────────────────────────────────────────────────────
  const openChat = (room, isGroup=false) => {
    setOpenRooms(prev => prev.find(r=>r.id===room.id) ? prev : [...prev, {...room, isGroup}])
    // Clear unread + dismiss notification
    setRooms(prev => prev.map(r => r.id===room.id ? {...r, unread:0} : r))
  }

  const deleteRoom = (id) => {
    setRooms(prev => prev.filter(r => r.id !== id))
    setOpenRooms(prev => prev.filter(r => r.id !== id))
    // Remember as hidden so polling doesn't bring it back
    const hidden = getHidden()
    if (!hidden.includes(id)) {
      setHidden([...hidden, id])
    }
    // Clear local cache
    localStorage.removeItem(msgsKey(id))
    // Clear messages from backend so old messages don't reappear
    fetch(`http://localhost:8080/api/chat/rooms/${id}/messages?email=${encodeURIComponent(myEmail)}`, {
      method: 'DELETE',
    }).catch(() => {})
  }

  const muteRoom  = (id) => setRooms(prev => prev.map(r => r.id===id ? {...r, muted:!r.muted} : r))
  const blockRoom = (id) => { setBlocked(prev=>{const u=[...prev,id];save(BLOCKED_KEY,u);return u}); deleteRoom(id) }

  const joinGroup = async (room) => {
    const gid = room.id
    // Create or get the group room in backend
    try {
      const res = await fetch('http://localhost:8080/api/chat/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: gid,
          name: room.name,
          sub: room.sub,
          avatar: room.avatar,
        }),
      })
      const backendRoom = await res.json()
      const clearedAtVal = localStorage.getItem(`sb_group_cleared_${myEmail}_${gid}`)
      const normalized = {
        ...backendRoom,
        id: backendRoom.roomId || backendRoom.id,
        isGroup: true,
        isOfficial: true,
        memberCount: room.memberCount,
        avatar: room.avatar || backendRoom.avatar,
        clearedAt: clearedAtVal || null,
      }
      // Add to joined groups list
      const u = [...joinedGroups, gid]
      setJoinedGroups(u)
      save('sb_joined_groups', u)
      // Add to rooms list so it shows in chat tab
      setRooms(prev => prev.find(r => r.id === normalized.id)
        ? prev
        : [normalized, ...prev]
      )
    } catch(e) {
      console.error('[joinGroup]', e)
      // Fallback: just track locally
      const u = [...joinedGroups, gid]
      setJoinedGroups(u)
      save('sb_joined_groups', u)
    }
    setPreviewRoom(null)
  }
  const leaveGroup = (gid) => {
    // Permanent leave — remove from joined groups, won't auto-restore
    const u = joinedGroups.filter(id=>id!==gid)
    setJoinedGroups(u)
    save('sb_joined_groups', u)
    setRooms(prev => prev.filter(r => r.id !== gid))
    setOpenRooms(prev => prev.filter(r=>r.id!==gid))
  }

  const deleteGroupForMe = (gid) => {
    // Exactly same as 1:1 deleteRoom — hide + delete backend messages
    const hidden = getHidden()
    if (!hidden.includes(gid)) setHidden([...hidden, gid])
    setRooms(prev => prev.filter(r => r.id !== gid))
    setOpenRooms(prev => prev.filter(r => r.id !== gid))
    localStorage.removeItem(msgsKey(gid))
    // Clear all clearedAt flags for this room
    localStorage.removeItem(`sb_group_cleared_${myEmail}_${gid}`)
    localStorage.removeItem(`sb_group_session_${myEmail}_${gid}`)
    // Delete messages from backend
    fetch(`http://localhost:8080/api/chat/rooms/${gid}/messages?email=${encodeURIComponent(myEmail)}`, {
      method: 'DELETE',
    }).catch(() => {})
  }

  const handleProfileSave = ({nickname:nick, photo:ph}) => {
    setNickname(nick); setPhoto(ph)
    localStorage.setItem(NICK_KEY(myEmail), nick)
    localStorage.setItem(PHOTO_KEY(myEmail), ph)
    setShowPhotoModal(false)
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const unreadTotal = rooms.reduce((s,r) => s+(r.unread||0), 0)
  useEffect(() => { onUnreadChange?.(unreadTotal) }, [unreadTotal])

  const getRoomName = (room) => {
    if (room.isGroup) return room.name
    if (!room.participants) return room.name || '상대방'
    const parts = room.participants.split(',').map(e => e.trim())
    const otherEmail = parts.find(e => e !== myEmail)
    if (!otherEmail) return '상대방'
    // Best: real name from users API
    if (userNames[otherEmail]) return userNames[otherEmail]
    // Fallback: participant order logic
    const iAmA = parts[0] === myEmail
    if (iAmA) {
      if (room.name && !room.name.includes('@')) return room.name
    } else {
      if (room.sub && !room.sub.includes('@')) return room.sub
    }
    return otherEmail.split('@')[0]
  }

  const filteredRooms = rooms
    .filter(r => {
      if (blocked.includes(r.id)) return false
      const name = getRoomName(r)
      const matchS = name.toLowerCase().includes(search.toLowerCase()) || (r.lastMsg||'').includes(search)
      const matchF = chatFilter==='all' || (chatFilter==='unread' && r.unread>0)
      return matchS && matchF
    })
    .sort((a, b) => {
      // Sort by lastAt descending — most recent message at top
      const ta = a.lastAt ? new Date(a.lastAt).getTime() : 0
      const tb = b.lastAt ? new Date(b.lastAt).getTime() : 0
      return tb - ta
    })

  const displayName  = profile?.name  || myName || '사용자'
  const displayEmail = profile?.email || myEmail || '-'
  const joined = profile?.joinedAt ? new Date(profile.joinedAt).toLocaleDateString('ko-KR') : '-'

  return (
    <>
    <div className="ci-window" style={{left:pos.x, top:pos.y, display: visible ? '' : 'none'}}>
      <div className="ci-rail nd">
        <div className="ci-rail-logo">
          <img src="/SignBridge.png" alt="SB" className="ci-rail-logo-img"
            onError={e=>{e.target.style.display='none';e.target.nextElementSibling.style.display='flex'}}/>
          <div className="ci-rail-logo-fallback" style={{display:'none'}}>🤟</div>
        </div>
        <nav className="ci-rail-nav">
          <button className={`ci-rail-tab nd ${tab==='profile'?'active':''}`} onClick={()=>setTab('profile')}>
            <IconUser/><span className="ci-rail-tab-label">프로필</span>
          </button>
          <button className={`ci-rail-tab nd ${tab==='chats'?'active':''}`} onClick={()=>setTab('chats')}>
            <span className="ci-rail-tab-icon-wrap">
              <IconChat/>
              {unreadTotal>0 && <span className="ci-rail-badge">{unreadTotal}</span>}
            </span>
            <span className="ci-rail-tab-label">채팅</span>
          </button>
          <button className={`ci-rail-tab nd ${tab==='groups'?'active':''}`} onClick={()=>setTab('groups')}>
            <span className="ci-rail-tab-icon-wrap"><IconGroup/></span>
            <span className="ci-rail-tab-label">그룹</span>
          </button>
        </nav>
        <div className="ci-rail-bottom">
          <button className="ci-rail-av-btn nd" onClick={()=>setShowPhotoModal(true)}>
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
              <div className="ci-prof-hero nd" onClick={()=>setShowPhotoModal(true)}>
                <div className="ci-prof-hero-av">
                  {photo ? <span style={{fontSize:30}}>{photo}</span> : <span>{displayName.charAt(0)}</span>}
                  <div className="ci-prof-hero-cam">📷</div>
                </div>
                <div className="ci-prof-hero-info">
                  {nickname && nickname !== displayName && <div className="ci-prof-hero-nick">{nickname}</div>}
                  <div className="ci-prof-hero-email">{displayEmail}</div>
                </div>
                <div className="ci-prof-hero-arrow">›</div>
              </div>
              <div className="ci-section-label">기본 정보</div>
              <div className="ci-info-card">
                {[
                  ['이름', displayName],
                  ['닉네임', nickname||'(미설정)'],
                  ['이메일', displayEmail],
                  ['사용자 유형', profile?.orgType||'개인 사용자'],
                  ['가입일', joined],
                  ['장애 등급', profile?.disabilityGrade||'-'],
                  ['주 사용 수어', profile?.preferredSign||'-'],
                ].map(([k,v]) => (
                  <div className="ci-info-row" key={k}>
                    <span className="ci-info-key">{k}</span>
                    <span className="ci-info-val">{v}</span>
                  </div>
                ))}
              </div>
              <div className="ci-section-label">주소 정보</div>
              <div className="ci-info-card" style={{marginBottom:20}}>
                {[['주소',profile?.address||'-'],['상세주소',profile?.addressDetail||'-'],['우편번호',profile?.zonecode||'-']].map(([k,v])=>(
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
                <img src="/SignBridge.png" alt="SignBridge" className="ci-chats-logo" onError={e=>e.target.style.display='none'}/>
                <span className="ci-pane-title">Chats</span>
              </div>
              <button className="ci-pane-close nd" onClick={onClose}>✕</button>
            </div>
            <div className="ci-search nd">
              <span style={{color:'#a0aec0',flexShrink:0,display:'flex'}}><IconSearch/></span>
              <input className="ci-search-input" placeholder="검색..." value={search} onChange={e=>setSearch(e.target.value)}/>
              {search && <button className="ci-search-clear nd" onClick={()=>setSearch('')}>✕</button>}
            </div>
            <div className="ci-filter-row nd">
              <button className={`ci-filter-btn nd ${chatFilter==='all'?'active':''}`} onClick={()=>setChatFilter('all')}>전체</button>
              <button className={`ci-filter-btn nd ${chatFilter==='unread'?'active':''}`} onClick={()=>setChatFilter('unread')}>
                읽지 않음{unreadTotal>0&&<span className="ci-filter-count">{unreadTotal}</span>}
              </button>
            </div>
            <div className="ci-pane-scroll nd" onClick={()=>setMenuOpenId(null)}>
              {!filteredRooms.length ? (
                <div className="ci-empty">
                  <div className="ci-empty-icon">{chatFilter==='unread'?'✅':'💬'}</div>
                  <div>{chatFilter==='unread'?'읽지 않은 대화가 없어요':'아직 대화가 없어요'}</div>
                </div>
              ) : filteredRooms.map(room => (
                <div key={room.id} className="ci-room-wrap">
                  <div className={`ci-room-row ${room.unread>0?'ci-room-unread':''}`}
                    onClick={()=>{if(menuOpenId===room.id){setMenuOpenId(null);return}openChat(room)}}>
                    <div className="ci-room-av">
                      {room.avatar || getRoomName(room).charAt(0)}
                      {room.muted && <span className="ci-room-mute-badge">🔕</span>}
                    </div>
                    <div className="ci-room-info">
                      <div className="ci-room-top">
                        <span className="ci-room-name">{getRoomName(room)}</span>
                        <span className="ci-room-time">{fmtRecent(room.lastAt)}</span>
                      </div>
                      <div className="ci-room-bottom">
                        <span className="ci-room-last">{room.lastMsg||'대화를 시작하세요'}</span>
                        {room.unread>0 && <span className="ci-unread-badge">{room.unread}</span>}
                      </div>
                    </div>
                    <button className="ci-room-dots nd"
                      onClick={e=>{e.stopPropagation();setMenuOpenId(menuOpenId===room.id?null:room.id)}}>
                      <IconRoomDots/>
                    </button>
                  </div>
                  {menuOpenId===room.id && (
                    <RoomMenu room={room}
                      onMarkRead={()=>{setRooms(prev=>prev.map(r=>r.id===room.id?{...r,unread:0}:r))}}
                      onMute={()=>muteRoom(room.id)}
                      onDelete={()=>room.isGroup ? deleteGroupForMe(room.id) : deleteRoom(room.id)}
                      onBlock={()=>blockRoom(room.id)}
                      onLeave={()=>leaveGroup(room.id)}
                      onClose={()=>setMenuOpenId(null)}/>
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
                  onJoin={()=>joinGroup(room)}
                  onLeave={()=>leaveGroup(room.id)}
                  onOpen={()=>openChat(room, true)}
                  onPreview={()=>setPreviewRoom(room)}/>
              ))}
              <div className="ci-groups-hint">참여한 그룹 채팅은 여기에서 열 수 있어요.</div>
            </div>
          </div>
        )}
      </div>
    </div>

    {showPhotoModal && (
      <ProfileEditModal nickname={nickname} photo={photo} myName={myName}
        onSave={handleProfileSave} onClose={()=>setShowPhotoModal(false)}/>
    )}
    {previewRoom && (
      <GroupPreviewModal room={previewRoom}
        onJoin={()=>{joinGroup(previewRoom);openChat(previewRoom,true)}}
        onClose={()=>setPreviewRoom(null)}/>
    )}

    {visible && openRooms.map(room => (
      <ChatWindow key={room.id} room={room} isGroup={!!room.isGroup}
        myEmail={myEmail} myName={myName} myNickname={nickname} myPhoto={photo}
        onClose={()=>setOpenRooms(prev=>prev.filter(r=>r.id!==room.id))}
        onRefreshRooms={refreshRooms}
        userNames={userNames}/>
    ))}


    </>
  )
}