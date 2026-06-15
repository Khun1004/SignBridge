import { useState, useEffect, useRef, useCallback } from 'react'
import './ChatRoom.css'
import chatService from './chatService'

/* ── localStorage helpers ── */
const NICK_KEY     = 'sb_my_nickname'
const PHOTO_KEY    = 'sb_my_photo'
const BLOCKED_KEY  = 'sb_blocked'
const DELETED_KEY  = 'sb_deleted_rooms'
const pinnedKey    = (id)  => `sb_pinned_${id}`
const starredKey   = 'sb_starred_msgs'
const membersKey   = (id)  => `sb_members_${id}`
const deletedAtKey = (roomId, email) => `sb_deleted_at_${roomId}_${email}`
const hiddenMsgsKey= (roomId, email) => `sb_hidden_msgs_${roomId}_${email}`

const load = (k, fb) => { try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? fb } catch { return fb } }
const save = (k, v)  => localStorage.setItem(k, JSON.stringify(v))

/* ── Constants ── */
const QUICK_REACTIONS = ['❤️','😂','😮','😢','😡','👍']
const EMOJI_CATEGORIES = [
    { label: '자주 쓰는', emojis: ['❤️','😂','😮','😢','😡','👍','🔥','🙏','👏','🤟','💯','😍'] },
    { label: '스마일',    emojis: ['😀','😃','😄','😁','😆','🥹','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳'] },
    { label: '손동작',    emojis: ['👋','🤚','✋','🖐','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🙏','✍️'] },
    { label: '기타',      emojis: ['🎉','🎊','🎈','🎁','🏆','⭐','🌟','💫','✨','🔥','💥','💢','💬','💭','💤','♥️','💔','💕','💞','💓','💗','💖','💝','💘','💟'] },
]
const AVATAR_EMOJIS = ['😊','🐱','🐸','🌸','⚡','🎵','🏄','🦋','🌊','🔥','🎯','🍀']
const OFFICIAL_ROOMS = [
    { id:'official_signbridge', name:'SignBridge Official', sub:'공식 커뮤니티', avatar:'🤟', description:'SignBridge 공식 채팅방입니다.', memberCount:1284, isOfficial:true, isGroup:true, previewMessages:[
            { id:'p1', name:'SignBridge', email:'admin@sb.com', text:'🎉 SignBridge v2.0 업데이트가 출시되었습니다!', at: new Date(Date.now()-3600000*2).toISOString() },
            { id:'p2', name:'쿤산', email:'kunsan@sb.com', text:'와! 정말 기대가 되네요 🤟', at: new Date(Date.now()-3600000*1.5).toISOString() },
        ]},
    { id:'official_learners', name:'수어 배우기 방', sub:'학습자 모임', avatar:'📚', description:'수어를 배우는 분들을 위한 방입니다.', memberCount:437, isOfficial:true, isGroup:true, previewMessages:[
            { id:'p1', name:'준호', email:'junho@sb.com', text:'안녕하세요! 처음 오신 분들 환영합니다 👋', at: new Date(Date.now()-7200000).toISOString() },
        ]},
]

/* ── Formatters ── */
const fmtTime   = (iso) => new Date(iso).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' })
const fmtDate   = (iso) => { const d=new Date(iso),today=new Date(),diff=Math.floor((today-d)/86400000); if(diff===0)return'오늘'; if(diff===1)return'어제'; return d.toLocaleDateString('ko-KR',{month:'long',day:'numeric'}) }
const fmtRecent = (iso) => { if(!iso)return''; const d=new Date(iso),today=new Date(),diff=Math.floor((today-d)/86400000); if(diff===0)return fmtTime(iso); if(diff===1)return'어제'; return d.toLocaleDateString('ko-KR',{month:'numeric',day:'numeric'}) }
const fmtFileSize=(b)=> b<1024?`${b} B`:b<1048576?`${(b/1024).toFixed(1)} KB`:`${(b/1048576).toFixed(1)} MB`
const fmtMembers=(n)=> n>=1000?`${(n/1000).toFixed(1)}k`:n

/* ── useDrag ── */
function useDrag(init) {
    const [pos,setPos]=useState(init)
    const drag=useRef(false),off=useRef({x:0,y:0})
    const onMouseDown=(e)=>{ if(e.target.closest('.nd'))return; drag.current=true; off.current={x:e.clientX-pos.x,y:e.clientY-pos.y}; e.preventDefault() }
    useEffect(()=>{ const mv=(e)=>{if(drag.current)setPos({x:e.clientX-off.current.x,y:e.clientY-off.current.y})}; const up=()=>{drag.current=false}; window.addEventListener('mousemove',mv); window.addEventListener('mouseup',up); return()=>{window.removeEventListener('mousemove',mv);window.removeEventListener('mouseup',up)} },[])
    return {pos,onMouseDown}
}

/* ── Icons ── */
const Ico=({d,w=16,h=16,fill='none',sw=2})=><svg viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" width={w} height={h}>{d}</svg>
const IconUser   =()=><Ico w={20} h={20} d={<><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>}/>
const IconChat   =()=><Ico w={20} h={20} d={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>}/>
const IconGroup  =()=><Ico w={20} h={20} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>
const IconSearch =()=><Ico w={14} h={14} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>
const IconSend   =()=><Ico sw={2.5} d={<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>}/>
const IconPin    =()=><Ico w={14} h={14} d={<><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></>}/>
const IconReply  =()=><Ico w={14} h={14} d={<><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></>}/>
const IconClip   =()=><Ico w={18} h={18} d={<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>}/>
const IconX      =()=><Ico w={13} h={13} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>
const IconPencil =()=><Ico w={14} h={14} d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}/>
const IconTrash  =()=><Ico w={14} h={14} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></>}/>
const IconCopy   =()=><Ico w={14} h={14} d={<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>}/>
const IconForward=()=><Ico w={14} h={14} d={<><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></>}/>
const IconDots   =()=><Ico w={15} h={15} fill="currentColor" sw={0} d={<><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></>}/>
const IconMsgSrch=()=><Ico w={18} h={18} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>
const IconMembers=()=><Ico w={18} h={18} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>
const IconRoomDots=()=><Ico w={16} h={16} fill="currentColor" sw={0} d={<><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>}/>
const IconVideo  =()=><Ico w={18} h={18} d={<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>}/>
const IconPhone  =()=><Ico w={18} h={18} d={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.42a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z"/>}/>
const IconChevronLeft=()=><Ico w={20} h={20} d={<polyline points="15 18 9 12 15 6"/>}/>
const IconEmoji  =()=><Ico w={20} h={20} d={<><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>}/>
const IconMic    =()=><Ico w={20} h={20} d={<><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>}/>

/* ── Avatar ── */
function Avatar({ name, photo, size=40, radius='50%', bg='linear-gradient(135deg,#7C3AED,#A78BFA)', className='' }) {
    const letter = (name||'?').charAt(0).toUpperCase()
    return (
        <div className={`sb-av ${className}`} style={{ width:size, height:size, borderRadius:radius, background:photo?'transparent':bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontWeight:700, color:'#fff', fontSize:size*0.4, fontFamily:'var(--font-b)', boxShadow:photo?'none':'0 3px 10px rgba(124,58,237,0.3)', minWidth:size }}>
            {photo ? <span style={{fontSize:size*0.55}}>{photo}</span> : <span>{letter}</span>}
        </div>
    )
}

/* ── FullEmojiPicker ── */
function FullEmojiPicker({ onSelect, onClose, isMe, dir='up' }) {
    const [search,setSearch]=useState('')
    const ref=useRef(null)
    useEffect(()=>{ const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))onClose()}; setTimeout(()=>document.addEventListener('mousedown',h),0); return()=>document.removeEventListener('mousedown',h) },[onClose])
    const allEmojis=EMOJI_CATEGORIES.flatMap(c=>c.emojis)
    const filtered=search.trim()?allEmojis.filter(e=>e.includes(search)):null
    const cats=filtered?[{label:`"${search}" 결과`,emojis:filtered}]:EMOJI_CATEGORIES
    return (
        <div ref={ref} className={`cw-full-picker nd ${isMe?'cw-full-picker-left':'cw-full-picker-right'} cw-pop-${dir}`}>
            <div className="cw-fp-search-row"><span className="cw-fp-search-icon"><IconSearch/></span><input className="cw-fp-search nd" autoFocus placeholder="이모지 검색…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <div className="cw-fp-body">
                {cats.map((cat,ci)=>(<div key={ci} className="cw-fp-section"><div className="cw-fp-section-label">{cat.label}</div><div className="cw-fp-grid">{cat.emojis.map(e=><button key={e} className="cw-fp-btn nd" onClick={()=>{onSelect(e);onClose()}}>{e}</button>)}</div></div>))}
                {filtered&&filtered.length===0&&<div className="cw-fp-empty">이모지를 찾을 수 없어요</div>}
            </div>
        </div>
    )
}

/* ── QuickReactionBar ── */
function QuickReactionBar({ msgId, myReaction, isMe, dir='up', onReact, onOpenFull, onClose }) {
    return (
        <div className={`cw-quick-bar nd ${isMe?'cw-quick-bar-left':'cw-quick-bar-right'} cw-pop-${dir}`}>
            {QUICK_REACTIONS.map(e=><button key={e} className={`cw-quick-btn nd ${myReaction===e?'cw-quick-active':''}`} onClick={()=>{onReact(msgId,e);onClose()}}>{e}</button>)}
            <button className="cw-quick-plus nd" onClick={onOpenFull}>+</button>
        </div>
    )
}

/* ── MsgContextMenu ── */
function MsgContextMenu({ msg, isMe, isPinned, isStarred=false, dir='up', onEdit, onDelete, onCopy, onForward, onPin, onStar, onClose }) {
    const ref=useRef(null)
    useEffect(()=>{ const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))onClose()}; setTimeout(()=>document.addEventListener('mousedown',h),0); return()=>document.removeEventListener('mousedown',h) },[onClose])
    const fmtMsgTime=msg.sentAt||msg.at?new Date(msg.sentAt||msg.at).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}):''
    const item=(icon,label,onClick,danger=false,disabled=false)=>(
        <button className={`cw-ctx-menu-item nd ${danger?'cw-ctx-menu-danger':''} ${disabled?'cw-ctx-menu-disabled':''}`} onClick={e=>{e.stopPropagation();if(!disabled){onClick();onClose()}}}>
            <span className="cw-ctx-menu-label">{label}</span><span className="cw-ctx-menu-icon">{icon}</span>
        </button>
    )
    return (
        <div ref={ref} className={`cw-ctx-menu nd ${isMe?'cw-ctx-menu-left':'cw-ctx-menu-right'} cw-pop-${dir}`} onClick={e=>e.stopPropagation()}>
            <div className="cw-ctx-menu-time">{fmtMsgTime}</div>
            {isMe&&!msg.imageData&&!msg.fileName&&item(<IconPencil/>,'수정',onEdit)}
            {item(<IconForward/>,'전달',onForward)}
            {!msg.imageData&&!msg.fileName&&item(<IconCopy/>,'복사',onCopy)}
            {item(<IconPin/>,isPinned?'고정 해제':'고정',onPin)}
            {item(<span style={{fontSize:14}}>⭐</span>,isStarred?'즐겨찾기 해제':'즐겨찾기',onStar)}
            {item(<span style={{color:'#ef4444',display:'flex'}}><IconTrash/></span>,isMe?'삭제':'숨기기',onDelete,true)}
        </div>
    )
}

/* ── WhoReacted ── */
function WhoReacted({ reactions, nameMap, onClose }) {
    const ref=useRef(null)
    useEffect(()=>{ const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))onClose()}; setTimeout(()=>document.addEventListener('mousedown',h),0); return()=>document.removeEventListener('mousedown',h) },[onClose])
    const who=Object.entries(reactions||{}).map(([email,emoji])=>({email,emoji,name:nameMap?.[email]||email.split('@')[0]}))
    return (
        <div ref={ref} className="cw-who-reacted nd">
            <div className="cw-who-reacted-hd">모든 반응<button className="cw-who-close nd" onClick={onClose}><IconX/></button></div>
            <div className="cw-who-list">{who.map(({name,emoji})=>(<div key={name} className="cw-who-row"><div className="cw-who-av">{name.charAt(0)}</div><span className="cw-who-name">{name}</span><span className="cw-who-emoji">{emoji}</span></div>))}</div>
        </div>
    )
}

/* ── MemberPanel ── */
function MemberPanel({ roomId, myEmail, myName, onClose }) {
    const members=load(membersKey(roomId),[])
    const all=members.find(m=>m.email===myEmail)?members:[{email:myEmail,name:myName,role:'나'},...members]
    return (
        <div className="cw-member-panel nd">
            <div className="cw-member-hd"><span className="cw-member-title">참여자 {all.length}명</span><button className="cw-member-close nd" onClick={onClose}><IconX/></button></div>
            <div className="cw-member-list">{all.map(m=>(<div key={m.email} className="cw-member-row"><Avatar name={m.name||m.email} size={34}/><div className="cw-member-info"><span className="cw-member-name">{m.name||m.email}</span>{m.role&&<span className="cw-member-role">{m.role}</span>}</div>{m.email===myEmail&&<span className="cw-member-me">나</span>}</div>))}</div>
        </div>
    )
}

/* ── MsgSearchPanel ── */
function MsgSearchPanel({ messages, onJump, onClose }) {
    const [q,setQ]=useState('')
    const results=q.trim()?messages.filter(m=>(m.text||m.fileName||'').toLowerCase().includes(q.toLowerCase())):[]
    return (
        <div className="cw-msgsearch nd">
            <div className="cw-msgsearch-hd"><span className="cw-msgsearch-title">메시지 검색</span><button className="cw-msgsearch-close nd" onClick={onClose}><IconX/></button></div>
            <div className="cw-msgsearch-input-wrap"><IconSearch/><input className="cw-msgsearch-input nd" autoFocus placeholder="검색어 입력..." value={q} onChange={e=>setQ(e.target.value)}/></div>
            <div className="cw-msgsearch-results">
                {q.trim()&&!results.length&&<div className="cw-msgsearch-empty">결과 없음</div>}
                {results.map(m=>(<div key={m.id} className="cw-msgsearch-row" onClick={()=>{onJump(m.id);onClose()}}><div className="cw-msgsearch-who">{m.senderName||m.name}</div><div className="cw-msgsearch-snippet">{(m.text||m.fileName||'').split(new RegExp(`(${q})`,'gi')).map((p,i)=>p.toLowerCase()===q.toLowerCase()?<mark key={i}>{p}</mark>:p)}</div><div className="cw-msgsearch-time">{fmtTime(m.sentAt||m.at)}</div></div>))}
            </div>
        </div>
    )
}

/* ── PinnedBar ── */
function PinnedBar({ pinned, onJump, onUnpin }) {
    if(!pinned)return null
    return (
        <div className="cw-pinned-bar nd">
            <span className="cw-pinned-icon"><IconPin/></span>
            <div className="cw-pinned-text" onClick={onJump}><span className="cw-pinned-label">고정된 메시지</span><span className="cw-pinned-preview">{pinned.text||(pinned.fileName?`📎 ${pinned.fileName}`:'')}</span></div>
            <button className="cw-pinned-close nd" onClick={onUnpin}><IconX/></button>
        </div>
    )
}

/* ── TypingIndicator — WebSocket 기반 ── */
function TypingIndicator({ roomId, myEmail }) {
    const [typerName, setTyperName] = useState(null)
    const timerRef = useRef(null)
    useEffect(() => {
        const unsub = chatService.subscribeToRoom(roomId, (msg) => {
            if (msg.type !== 'TYPING') return
            if (msg.senderEmail === myEmail) return
            setTyperName(msg.senderName || msg.senderEmail?.split('@')[0] || '...')
            clearTimeout(timerRef.current)
            timerRef.current = setTimeout(() => setTyperName(null), 3000)
        })
        return () => { unsub(); clearTimeout(timerRef.current) }
    }, [roomId, myEmail])
    if (!typerName) return null
    return (
        <div className="cw-typing">
            <Avatar name={typerName} size={28}/>
            <div className="cw-typing-dots"><span/><span/><span/></div>
        </div>
    )
}

/* ── ProfileEditModal ── */
function ProfileEditModal({ nickname, photo, myName, onSave, onClose }) {
    const [nickInput,setNick]=useState(nickname)
    const [photoInput,setPhoto]=useState(photo||'')
    const fileRef=useRef(null)
    const doSave=()=>onSave({nickname:nickInput.trim()||myName,photo:photoInput})
    return (
        <div className="ci-modal-overlay nd" onClick={onClose}>
            <div className="ci-modal nd" onClick={e=>e.stopPropagation()}>
                <div className="ci-modal-hd"><span>프로필 편집</span><button className="ci-modal-close nd" onClick={onClose}>✕</button></div>
                <div className="ci-modal-body">
                    <div className="ci-modal-av-wrap">
                        <div className="ci-modal-av" onClick={()=>fileRef.current?.click()}>
                            {photoInput?<span style={{fontSize:38}}>{photoInput}</span>:<span>{(nickname||myName||'?').charAt(0)}</span>}
                            <div className="ci-modal-av-overlay">📷</div>
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={()=>{}}/>
                        <div className="ci-modal-av-hint">클릭하여 사진 변경</div>
                    </div>
                    <div className="ci-modal-section-label">이모지 아바타</div>
                    <div className="ci-emoji-grid">{AVATAR_EMOJIS.map(e=><button key={e} className={`ci-emoji-opt nd ${photoInput===e?'selected':''}`} onClick={()=>setPhoto(photoInput===e?'':e)}>{e}</button>)}{photoInput&&<button className="ci-emoji-opt ci-emoji-clear nd" onClick={()=>setPhoto('')}>✕</button>}</div>
                    <div className="ci-modal-field"><label className="ci-modal-label">닉네임</label><input className="ci-modal-input nd" value={nickInput} onChange={e=>setNick(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSave()} placeholder="닉네임 입력"/></div>
                    <button className="ci-modal-save nd" onClick={doSave}>저장하기</button>
                </div>
            </div>
        </div>
    )
}

/* ── RoomMenu ── */
function RoomMenu({ room, onMarkRead, onMute, onDelete, onBlock, onClose }) {
    const ref=useRef(null)
    useEffect(()=>{ const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))onClose()}; setTimeout(()=>document.addEventListener('mousedown',h),0); return()=>document.removeEventListener('mousedown',h) },[onClose])
    const item=(icon,label,onClick,danger=false)=>(<button className={`ci-menu-item nd ${danger?'ci-menu-danger':''}`} onClick={e=>{e.stopPropagation();onClick();onClose()}}><span className="ci-menu-icon">{icon}</span><span>{label}</span></button>)
    return (
        <div ref={ref} className="ci-room-menu nd" onClick={e=>e.stopPropagation()}>
            {room.unread>0&&item('✓','읽음으로 표시',onMarkRead)}
            {item(room.muted?'🔔':'🔕',room.muted?'알림 켜기':'알림 끄기',onMute)}
            {item('🗑','대화 삭제',onDelete,true)}
            {item('🚫','차단하기',onBlock,true)}
        </div>
    )
}

/* ── GroupPreviewModal ── */
function GroupPreviewModal({ room, onJoin, onClose }) {
    return (
        <div className="ci-modal-overlay nd" onClick={onClose}>
            <div className="ci-group-preview nd" onClick={e=>e.stopPropagation()}>
                <div className="ci-gp-header"><div className="ci-gp-av">{room.avatar}</div><button className="ci-gp-close nd" onClick={onClose}><IconX/></button></div>
                <div className="ci-gp-info"><div className="ci-gp-name">{room.name}{room.isOfficial&&<span className="ci-official-badge">공식</span>}</div><div className="ci-gp-desc">{room.description}</div><div className="ci-gp-meta">👥 {fmtMembers(room.memberCount)}명 참여 중</div></div>
                <div className="ci-gp-preview-label">최근 대화 미리보기</div>
                <div className="ci-gp-messages"><div className="ci-gp-blur-top"/>{(room.previewMessages||[]).map(msg=>(<div key={msg.id} className="ci-gp-msg-row"><div className="ci-gp-msg-av">{msg.name.charAt(0)}</div><div className="ci-gp-msg-body"><div className="ci-gp-msg-name">{msg.name}</div><div className="ci-gp-msg-text">{msg.text}</div></div><div className="ci-gp-msg-time">{fmtTime(msg.at)}</div></div>))}</div>
                <button className="ci-gp-join-btn nd" onClick={onJoin}>🤟 참여하기</button>
            </div>
        </div>
    )
}

/* ── OfficialRoomBanner ── */
function OfficialRoomBanner({ room, joined, onJoin, onLeave, onOpen, onPreview }) {
    return (
        <div className="ci-official-banner nd">
            <div className="ci-official-glow"/>
            <div className="ci-official-left" onClick={joined?onOpen:onPreview} style={{cursor:'pointer'}}>
                <div className="ci-official-av">{room.avatar}</div>
                <div className="ci-official-info">
                    <div className="ci-official-name-row"><span className="ci-official-name">{room.name}</span><span className="ci-official-badge">공식</span></div>
                    <div className="ci-official-desc">{room.description}</div>
                    <div className="ci-official-meta"><span className="ci-official-members">👥 {fmtMembers(room.memberCount+(joined?1:0))}명 참여 중</span>{!joined&&<span className="ci-official-preview-hint">미리보기 →</span>}</div>
                </div>
            </div>
            <button className={`ci-official-join nd ${joined?'ci-official-leave':''}`} onClick={joined?onLeave:onJoin}>{joined?'나가기':'참여하기'}</button>
        </div>
    )
}

/* ── ForwardModal ── */
function ForwardModal({ msg, currentRoomId, rooms, onForward, onClose }) {
    const all=rooms.filter(r=>r.id!==currentRoomId)
    const preview=msg.text?(msg.text.length>55?msg.text.slice(0,55)+'…':msg.text):msg.fileName||'파일'
    return (
        <div className="ci-modal-overlay nd" onClick={onClose}>
            <div className="cw-fwd-modal nd" onClick={e=>e.stopPropagation()}>
                <div className="cw-fwd-hd"><span className="cw-fwd-hd-title">메시지 전달</span><button className="cw-fwd-close nd" onClick={onClose}><IconX/></button></div>
                <div className="cw-fwd-preview"><span className="cw-fwd-preview-label">↪ 전달할 메시지</span><span className="cw-fwd-preview-text">{preview}</span></div>
                <div className="cw-fwd-section">대화 선택</div>
                <div className="cw-fwd-list">{all.length===0?(<div className="cw-fwd-empty"><div className="cw-fwd-empty-icon">💬</div><div>전달할 대화방이 없어요</div></div>):all.map(r=>(<div key={r.id} className="cw-fwd-room nd"><Avatar name={r.avatar||r.name} photo={r.avatar?.length===2?r.avatar:undefined} size={44}/><div className="cw-fwd-room-info"><div className="cw-fwd-room-name">{r.name}</div>{r.sub&&<div className="cw-fwd-room-sub">{r.sub}</div>}</div><button className="cw-fwd-send-btn nd" onClick={()=>onForward(r,msg)}>전달</button></div>))}</div>
            </div>
        </div>
    )
}

/* ── ImagePreview ── */
function ImagePreview({ file, dataUrl, onSend, onCancel }) {
    return (
        <div className="cw-img-preview-overlay nd" onClick={onCancel}>
            <div className="cw-img-preview-modal nd" onClick={e=>e.stopPropagation()}>
                <div className="cw-img-preview-hd"><span>사진 전송</span><button className="cw-img-preview-close nd" onClick={onCancel}><IconX/></button></div>
                <div className="cw-img-preview-body"><img src={dataUrl} alt={file.name} className="cw-img-preview-img"/><div className="cw-img-preview-meta"><span className="cw-img-preview-name">{file.name}</span><span className="cw-img-preview-size">{fmtFileSize(file.size)}</span></div></div>
                <div className="cw-img-preview-actions"><button className="cw-img-preview-cancel nd" onClick={onCancel}>취소</button><button className="cw-img-preview-send nd" onClick={onSend}>전송하기</button></div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════
   CHAT WINDOW
═══════════════════════════════════════════ */
function ChatWindow({ room, myEmail, myName, myNickname, myPhoto, onClose, isGroup=false, allRooms=[], starred=[], onStarChange, isDeleted=false }) {
    const chatDisplayName = myNickname || myName
    const [messages,setMessages]=useState([])
    const [hoveredMsgId,setHoveredMsgId]=useState(null)
    const hoverTimer=useRef(null)
    const [loading,setLoading]=useState(true)
    const [input,setInput]=useState('')
    const [popover,setPopover]=useState(null)
    const [replyTo,setReplyTo]=useState(null)
    const [editingMsg,setEditingMsg]=useState(null)
    const [pinned,setPinned]=useState(()=>load(pinnedKey(room.id),null))
    const [showSearch,setShowSearch]=useState(false)
    const [showMembers,setShowMembers]=useState(false)
    const [imgPreview,setImgPreview]=useState(null)
    const [forwardMsg,setForwardMsg]=useState(null)
    const [msgDeleteTarget,setMsgDeleteTarget]=useState(null)
    const bottomRef=useRef(null)
    const msgRefs=useRef({})
    const fileRef=useRef(null)
    const typingTimer=useRef(null)
    const inputRef=useRef(null)
    const {pos,onMouseDown}=useDrag({ x:Math.max(20,window.innerWidth-980), y:Math.max(20,window.innerHeight-780) })

    useEffect(()=>{
        setLoading(true)
        chatService.getMessages(room.id)
            .then(data=>{
                const raw=Array.isArray(data)?data:[]
                const deletedAt=localStorage.getItem(deletedAtKey(room.id,myEmail))
                const hidden=load(hiddenMsgsKey(room.id,myEmail),[])
                setMessages(raw
                    .filter(m=>!deletedAt||new Date(m.sentAt)>new Date(deletedAt))
                    .filter(m=>!hidden.includes(m.id)))
            })
            .catch(()=>setMessages([]))
            .finally(()=>setLoading(false))
        const unsub=chatService.subscribeToRoom(room.id,(msg)=>{
            if(msg.type==='TYPING') return
            if(msg.type==='EDIT') setMessages(prev=>prev.map(m=>m.id===msg.id?{...m,text:msg.text,isEdited:true}:m))
            else if(msg.type==='DELETE') setMessages(prev=>prev.filter(m=>m.id!==msg.id))
            else {
                // 새 메시지 — deletedAt 이후면 표시
                const deletedAt=localStorage.getItem(deletedAtKey(room.id,myEmail))
                if(deletedAt && new Date(msg.sentAt||msg.at||Date.now()) <= new Date(deletedAt)) return
                setMessages(prev=>[...prev,msg])
            }
        })
        return()=>unsub()
    },[room.id])

    useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])
    const closePopover=()=>setPopover(null)
    const nameMap={[myEmail]:chatDisplayName}
    messages.forEach(m=>{if(m.senderEmail&&m.senderName)nameMap[m.senderEmail]=m.senderName})

    const send=()=>{
        if(editingMsg){ const t=input.trim(); if(!t)return; chatService.editMessage(editingMsg.id,room.id,t); setEditingMsg(null); setInput(''); return }
        const text=input.trim(); if(!text)return
        chatService.sendMessage({roomId:room.id,senderEmail:myEmail,senderName:chatDisplayName,text,replyToId:replyTo?.id||null,replyToName:replyTo?.name||null,replyToText:replyTo?.text||null})
        setInput(''); setReplyTo(null)
    }
    const deleteMsg=(msg,isMe)=>setMsgDeleteTarget({msg,isMe})
    const doDeleteMsg=(mode,msg)=>{
        if(mode==='me'){
            const hidden=load(hiddenMsgsKey(room.id,myEmail),[])
            save(hiddenMsgsKey(room.id,myEmail),[...hidden,msg.id])
            setMessages(prev=>prev.filter(m=>m.id!==msg.id))
        } else if(mode==='all'){
            chatService.deleteMessage(msg.id,room.id)
        }
        setMsgDeleteTarget(null)
    }
    const startEdit=(msg)=>{ setEditingMsg({id:msg.id,text:msg.text}); setInput(msg.text); setReplyTo(null); setTimeout(()=>inputRef.current?.focus(),50) }
    const handleFileSelect=(file)=>{ if(file.type.startsWith('image/')){const r=new FileReader();r.onload=e=>setImgPreview({file,dataUrl:e.target.result});r.readAsDataURL(file)}else{sendFile(file,null)} }
    const sendFile=(file,dataUrl)=>{ chatService.sendMessage({roomId:room.id,senderEmail:myEmail,senderName:chatDisplayName,text:null,fileName:file.name,fileUrl:dataUrl||null,isImage:!!dataUrl}); setReplyTo(null); setImgPreview(null) }
    const forwardToRoom=(targetRoom,msg)=>{ chatService.sendMessage({roomId:targetRoom.id,senderEmail:myEmail,senderName:chatDisplayName,text:msg.text||null,fileName:msg.fileName||null,forwardedFrom:msg.senderName||msg.name||'알 수 없음'}); setForwardMsg(null) }
    const broadcastTyping=()=>{ clearTimeout(typingTimer.current); chatService.sendTyping(room.id,myEmail,chatDisplayName); typingTimer.current=setTimeout(()=>{},3000) }
    const addReaction=(msgId,emoji)=>setMessages(prev=>prev.map(m=>{if(m.id!==msgId)return m;const r={...(m.reactions||{})};r[myEmail]===emoji?delete r[myEmail]:(r[myEmail]=emoji);return{...m,reactions:r}}))
    const aggregateReactions=(reactions)=>{const agg={};Object.values(reactions||{}).forEach(e=>{agg[e]=(agg[e]||0)+1});return Object.entries(agg).filter(([,c])=>c>0)}
    const pinMessage=(msg)=>{const p={id:msg.id,text:msg.text,fileName:msg.fileName,name:msg.senderName||msg.name};setPinned(p);save(pinnedKey(room.id),p)}
    const unpinMessage=()=>{setPinned(null);save(pinnedKey(room.id),null)}
    const jumpToMsg=(id)=>msgRefs.current[id]?.scrollIntoView({behavior:'smooth',block:'center'})
    const onKey=(e)=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}; if(e.key==='Escape'&&editingMsg){setEditingMsg(null);setInput('')} }

    let lastDate=null
    const rows=messages.map(msg=>{
        const senderEmail=msg.senderEmail||msg.email
        const senderName=msg.senderName||msg.name||msg.senderEmail?.split('@')[0]||'?'
        const sentAt=msg.sentAt||msg.at
        const isMe=senderEmail===myEmail
        const dl=fmtDate(sentAt)
        const showDt=dl!==lastDate; lastDate=dl
        const aggR=aggregateReactions(msg.reactions)
        const myR=(msg.reactions||{})[myEmail]
        const isPinned=pinned?.id===msg.id
        const isCtxOpen=popover?.msgId===msg.id&&popover.type==='ctx'
        const isQuickOpen=popover?.msgId===msg.id&&popover.type==='quickReact'
        const isFullPickOpen=popover?.msgId===msg.id&&popover.type==='fullPicker'
        const isWhoOpen=popover?.msgId===msg.id&&popover.type==='whoReacted'
        const msgEl=msgRefs.current[msg.id]
        let popDir='up'
        if(msgEl){const container=msgEl.closest('.cw-messages');if(container){const elRect=msgEl.getBoundingClientRect();const conRect=container.getBoundingClientRect();popDir=((elRect.top+elRect.height/2)-conRect.top)>conRect.height*0.55?'up':'down'}}
        if(msg.isSystem)return(<div key={msg.id} className="cw-row-system"><span className="cw-system-msg">{msg.text}</span></div>)
        return (
            <div key={msg.id} ref={el=>{if(el)msgRefs.current[msg.id]=el}}>
                {showDt&&<div className="cw-date-div"><span>{dl}</span></div>}
                <div className={`cw-msg-block ${isMe?'cw-msg-block-me':'cw-msg-block-them'}`}>
                    {msg.isEdited&&<div className={`cw-edited-label ${isMe?'cw-edited-me':'cw-edited-them'}`}>수정됨</div>}
                    <div className={`cw-row ${isMe?'cw-me':'cw-them'} ${isPinned?'cw-row-pinned':''}`}>
                        {!isMe&&(<div className="cw-avatar">{isGroup?(senderName||'?').charAt(0).toUpperCase():room.avatar&&room.avatar.length<=2?room.avatar:(senderName||room.name||'?').charAt(0).toUpperCase()}</div>)}
                        <div className="cw-bwrap">
                            {(!isMe&&isGroup)&&<div className="cw-sender">{senderName}</div>}
                            <div className="cw-bubble-wrap" onMouseEnter={()=>{clearTimeout(hoverTimer.current);setHoveredMsgId(msg.id)}} onMouseLeave={()=>{hoverTimer.current=setTimeout(()=>setHoveredMsgId(null),200)}}>
                                <div className={`cw-bubble ${isMe?'cw-bubble-me':'cw-bubble-them'}`}>
                                    {msg.forwardedFrom&&<div className="cw-fwd-badge"><IconForward/> {msg.forwardedFrom}에서 전달됨</div>}
                                    {msg.replyToId&&<div className="cw-reply-inbubble" onClick={e=>{e.stopPropagation();jumpToMsg(msg.replyToId)}}><div className="cw-reply-inbubble-name">{msg.replyToName}</div><div className="cw-reply-inbubble-text">{msg.replyToText}</div></div>}
                                    {msg.isImage&&msg.fileUrl?(<div className="cw-img-wrap"><img src={msg.fileUrl} alt={msg.fileName} className="cw-img"/><div className="cw-img-name">{msg.fileName}</div></div>):msg.fileName?(<div className="cw-file"><div className="cw-file-icon">📎</div><div className="cw-file-info"><div className="cw-file-name">{msg.fileName}</div></div></div>):msg.text}
                                </div>
                                <div className={`cw-hover-bar nd ${isMe?'cw-hover-bar-left':'cw-hover-bar-right'} ${hoveredMsgId===msg.id?'cw-hover-bar-visible':''}`}>
                                    <button className={`cw-hbar-btn nd ${isCtxOpen?'cw-hbar-active':''}`} onClick={e=>{e.stopPropagation();setPopover(isCtxOpen?null:{msgId:msg.id,type:'ctx'})}}><IconDots/></button>
                                    <button className="cw-hbar-btn nd" onClick={e=>{e.stopPropagation();setReplyTo({id:msg.id,name:senderName,text:msg.text,fileName:msg.fileName});setPopover(null)}}><IconReply/></button>
                                    <button className={`cw-hbar-btn nd ${isQuickOpen||isFullPickOpen?'cw-hbar-active':''}`} onClick={e=>{e.stopPropagation();setPopover(isQuickOpen?null:{msgId:msg.id,type:'quickReact'})}}><span style={{fontSize:15,lineHeight:1}}>{myR||'😊'}</span></button>
                                </div>
                                {isCtxOpen&&<div onClick={e=>e.stopPropagation()}><MsgContextMenu msg={msg} isMe={isMe} isPinned={isPinned} isStarred={starred.some(s=>s.id===msg.id)} dir={popDir} onEdit={()=>{startEdit(msg);closePopover()}} onDelete={()=>{deleteMsg(msg,isMe);closePopover()}} onCopy={()=>{navigator.clipboard?.writeText(msg.text||'');closePopover()}} onForward={()=>{setForwardMsg(msg);closePopover()}} onPin={()=>{isPinned?unpinMessage():pinMessage(msg);closePopover()}} onStar={()=>{const isS=starred.some(s=>s.id===msg.id);const next=isS?starred.filter(s=>s.id!==msg.id):[...starred,{...msg,starredAt:Date.now(),roomName:room?.name||''}];onStarChange?.(next);closePopover()}} onClose={closePopover}/></div>}
                                {isQuickOpen&&<div onClick={e=>e.stopPropagation()}><QuickReactionBar msgId={msg.id} myReaction={myR} isMe={isMe} dir={popDir} onReact={(id,emoji)=>{addReaction(id,emoji);closePopover()}} onOpenFull={()=>setPopover({msgId:msg.id,type:'fullPicker'})} onClose={closePopover}/></div>}
                                {isFullPickOpen&&<div onClick={e=>e.stopPropagation()}><FullEmojiPicker isMe={isMe} dir={popDir} onSelect={emoji=>{addReaction(msg.id,emoji);closePopover()}} onClose={closePopover}/></div>}
                            </div>
                            {aggR.length>0&&(<div className={`cw-reactions ${isMe?'reactions-left':'reactions-right'}`}>{aggR.map(([e,count])=><span key={e} className={`cw-reaction-chip nd ${myR===e?'cw-reaction-mine':''}`} onClick={ev=>{ev.stopPropagation();addReaction(msg.id,e)}}>{e} {count}</span>)}<button className="cw-who-btn nd" onClick={ev=>{ev.stopPropagation();setPopover(isWhoOpen?null:{msgId:msg.id,type:'whoReacted'})}}><IconMembers/></button>{isWhoOpen&&<div onClick={e=>e.stopPropagation()}><WhoReacted reactions={msg.reactions} nameMap={nameMap} onClose={closePopover}/></div>}</div>)}
                        </div>
                        <div className={`cw-side-meta ${isMe?'cw-side-meta-me':'cw-side-meta-them'}`}><span className="cw-time">{fmtTime(sentAt)}</span></div>
                    </div>
                </div>
            </div>
        )
    })

    return (
        <>
            <div className="cw-window" style={{left:pos.x,top:pos.y}}>
                <div className="cw-header" onMouseDown={onMouseDown}>
                    <div className="cw-header-left">
                        <button className="cw-hback nd" onClick={onClose}><IconChevronLeft/></button>
                        <div className="cw-av-wrap"><Avatar name={room.name} photo={room.avatar||room.name?.charAt(0).toUpperCase()} size={42} radius="50%"/><span className="cw-av-status"/></div>
                        <div><div className="cw-hname">{room.name}{isGroup&&<span className="cw-group-badge">그룹</span>}</div><div className="cw-hsub">{isGroup?`${fmtMembers(room.memberCount)}명 참여 중`:room.sub||'온라인'}</div></div>
                    </div>
                    <div className="cw-header-actions nd">
                        <button className="cw-hbtn nd" title="영상통화"><IconVideo/></button>
                        <button className="cw-hbtn nd" title="전화"><IconPhone/></button>
                        {isGroup&&<button className={`cw-hbtn nd ${showMembers?'cw-hbtn-active':''}`} onClick={()=>{setShowMembers(v=>!v);setShowSearch(false)}}><IconMembers/></button>}
                        <button className={`cw-hbtn nd ${showSearch?'cw-hbtn-active':''}`} onClick={()=>{setShowSearch(v=>!v);setShowMembers(false)}}><IconMsgSrch/></button>
                        <button className="cw-hclose nd" onClick={onClose}><IconX/></button>
                    </div>
                </div>
                {showSearch&&<MsgSearchPanel messages={messages} onJump={jumpToMsg} onClose={()=>setShowSearch(false)}/>}
                {showMembers&&<MemberPanel roomId={room.id} myEmail={myEmail} myName={myName} onClose={()=>setShowMembers(false)}/>}
                <PinnedBar pinned={pinned} onJump={()=>jumpToMsg(pinned.id)} onUnpin={unpinMessage}/>
                <div className="cw-messages" onClick={closePopover}>
                    {loading?(<div className="cw-empty"><div className="cw-empty-hint">불러오는 중...</div></div>)
                        :!rows.length?(<div className="cw-empty"><Avatar name={room.name} photo={room.avatar||room.name?.charAt(0).toUpperCase()} size={72}/><div className="cw-empty-name">{room.name}</div><div className="cw-empty-hint">첫 메시지를 보내보세요 👋</div></div>)
                            :rows}
                    <TypingIndicator roomId={room.id} myEmail={myEmail}/>
                    <div ref={bottomRef}/>
                </div>
                {editingMsg&&(<div className="cw-edit-bar nd"><div className="cw-edit-bar-content"><IconPencil/><div className="cw-edit-bar-info"><span className="cw-edit-bar-label">메시지 수정 중</span><span className="cw-edit-bar-text">{editingMsg.text}</span></div></div><button className="cw-reply-bar-close nd" onClick={()=>{setEditingMsg(null);setInput('')}}><IconX/></button></div>)}
                {replyTo&&!editingMsg&&(<div className="cw-reply-bar nd"><div className="cw-reply-bar-content"><IconReply/><div className="cw-reply-bar-info"><span className="cw-reply-bar-name">{replyTo.name}에게 답장</span><span className="cw-reply-bar-text">{replyTo.fileName?`📎 ${replyTo.fileName}`:replyTo.text}</span></div></div><button className="cw-reply-bar-close nd" onClick={()=>setReplyTo(null)}><IconX/></button></div>)}
                <div className="cw-input-row nd">
                    <button className="cw-attach-btn nd" onClick={()=>fileRef.current?.click()}><IconClip/></button>
                    <input ref={fileRef} type="file" accept="image/*,*/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)handleFileSelect(f);e.target.value=''}}/>
                    <div className="cw-input-wrap">
                        <textarea ref={inputRef} className="cw-input" placeholder={editingMsg?'수정할 내용 입력…':'메시지를 입력하세요…'} value={input} onChange={e=>{setInput(e.target.value);broadcastTyping()}} onKeyDown={onKey} rows={1}/>
                        <button className="cw-input-emoji nd"><IconEmoji/></button>
                    </div>
                    <button className="cw-send nd" onClick={send} disabled={!input.trim()}>{input.trim()?<IconSend/>:<IconMic/>}</button>
                </div>
            </div>
            {imgPreview&&<ImagePreview file={imgPreview.file} dataUrl={imgPreview.dataUrl} onSend={()=>sendFile(imgPreview.file,imgPreview.dataUrl)} onCancel={()=>setImgPreview(null)}/>}
            {msgDeleteTarget&&(
                <div className="ci-modal-overlay nd" onClick={()=>setMsgDeleteTarget(null)}>
                    <div className="ci-modal nd" style={{maxWidth:300}} onClick={e=>e.stopPropagation()}>
                        <div className="ci-modal-hd" style={{fontSize:15}}><span>🗑 메시지 삭제</span><button className="ci-modal-close nd" onClick={()=>setMsgDeleteTarget(null)}>✕</button></div>
                        <div className="ci-modal-body" style={{gap:8,padding:'16px 18px'}}>
                            {msgDeleteTarget.isMe?(
                                <>
                                    <button style={{width:'100%',padding:'12px',borderRadius:10,border:'1.5px solid #e0e0f0',background:'#f8f8ff',color:'#333',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',textAlign:'left'}} onClick={()=>doDeleteMsg('me',msgDeleteTarget.msg)}>
                                        🙋 나에게만 삭제<div style={{fontSize:11,color:'#aaa',fontWeight:500,marginTop:2}}>상대방은 그대로 볼 수 있습니다</div>
                                    </button>
                                    {(()=>{
                                        const sentAt=msgDeleteTarget.msg.sentAt||msgDeleteTarget.msg.at
                                        const canDeleteAll=sentAt&&(Date.now()-new Date(sentAt).getTime())<5*60*1000
                                        return canDeleteAll?(
                                            <button style={{width:'100%',padding:'12px',borderRadius:10,border:'1.5px solid #fca5a5',background:'#fff5f5',color:'#ef4444',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',textAlign:'left'}} onClick={()=>doDeleteMsg('all',msgDeleteTarget.msg)}>
                                                👥 모두에게 삭제<div style={{fontSize:11,color:'#f87171',fontWeight:500,marginTop:2}}>상대방 화면에서도 사라집니다</div>
                                            </button>
                                        ):(
                                            <button disabled style={{width:'100%',padding:'12px',borderRadius:10,border:'1.5px solid #e0e0f0',background:'#f4f4fb',color:'#bbb',fontSize:14,fontWeight:700,cursor:'not-allowed',fontFamily:'inherit',textAlign:'left'}}>
                                                👥 모두에게 삭제 불가<div style={{fontSize:11,color:'#ccc',fontWeight:500,marginTop:2}}>전송 후 5분이 지나 삭제할 수 없습니다</div>
                                            </button>
                                        )
                                    })()}
                                </>
                            ):(
                                <button style={{width:'100%',padding:'12px',borderRadius:10,border:'1.5px solid #e0e0f0',background:'#f8f8ff',color:'#333',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',textAlign:'left'}} onClick={()=>doDeleteMsg('me',msgDeleteTarget.msg)}>
                                    🙋 내 화면에서 숨기기<div style={{fontSize:11,color:'#aaa',fontWeight:500,marginTop:2}}>상대방 메시지는 삭제할 수 없습니다</div>
                                </button>
                            )}
                            <button style={{width:'100%',padding:'10px',borderRadius:10,border:'1.5px solid #e0e0f0',background:'#f4f4fb',color:'#888',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}} onClick={()=>setMsgDeleteTarget(null)}>취소</button>
                        </div>
                    </div>
                </div>
            )}
            {forwardMsg&&<ForwardModal msg={forwardMsg} currentRoomId={room.id} rooms={allRooms} onForward={forwardToRoom} onClose={()=>setForwardMsg(null)}/>}
        </>
    )
}

/* ═══════════════════════════════════════════
   INBOX
═══════════════════════════════════════════ */
export default function ChatRoom({ onClose, myEmail='', myName='', profile=null, communityProfile=null, initialRoom=null, unreadByRoom={}, onRoomRead, onOpenRoomsChange }) {
    const [rooms,setRooms]=useState([])
    const [starred,setStarred]=useState(()=>load(starredKey,[]))
    // ── 삭제 상태: roomId 목록 ──
    const [deletedRooms,setDeletedRooms]=useState(()=>load(DELETED_KEY,[]))
    const [openRooms,setOpenRooms]=useState([])
    const [tab,setTab]=useState('chats')
    const [search,setSearch]=useState('')
    const [chatFilter,setChatFilter]=useState('all')
    const [nickname,setNickname]=useState(()=>{ const s=localStorage.getItem(NICK_KEY); if(s)return s; if(myName){localStorage.setItem(NICK_KEY,myName);return myName} return '' })
    const [photo,setPhoto]=useState(()=>localStorage.getItem(PHOTO_KEY)||'')
    const [showPhotoModal,setShowPhotoModal]=useState(false)
    const [menuOpenId,setMenuOpenId]=useState(null)
    const [blocked,setBlocked]=useState(()=>load(BLOCKED_KEY,[]))
    const [joinedGroups,setJoinedGroups]=useState(()=>load('sb_joined_groups',[]))
    const [previewRoom,setPreviewRoom]=useState(null)
    const [deleteConfirmId,setDeleteConfirmId]=useState(null)
    const {pos,onMouseDown}=useDrag({ x:Math.max(20,window.innerWidth-500), y:Math.max(20,window.innerHeight-780) })

    useEffect(()=>{ onOpenRoomsChange?.(openRooms.map(r=>r.id)) },[openRooms])
    const handleSelectRoom=(room)=>{ openChat(room); onRoomRead?.(room.id) }

    // ── 방 목록 로드 — 삭제된 방도 포함해서 가져옴 (filteredRooms에서 숨김) ──
    const loadRooms = useCallback(()=>{
        if(!myEmail) return
        fetch(`/api/chat/rooms?email=${encodeURIComponent(myEmail)}`)
            .then(r=>r.json())
            .then(data=>{
                if(!Array.isArray(data)) return
                setRooms(data.map(r=>{
                    const id=r.roomId||r.id
                    let name=r.name
                    if(!r.isGroup&&r.participants){
                        const others=r.participants.split(',').map(e=>e.trim()).filter(e=>e!==myEmail)
                        if(r.name===myEmail||r.name==='') name=others[0]||r.name
                    }
                    return {...r,id,name}
                }))
            })
            .catch(err=>console.error('Failed to load rooms:',err))
    },[myEmail])

    useEffect(()=>{ loadRooms() },[loadRooms])

    // ── 새 메시지 수신 ──
    useEffect(()=>{
        if(!myEmail) return
        const unsub=chatService.onMessage?.((msg)=>{
            if(!msg?.roomId) return
            if(msg.type&&msg.type!=='SEND') return
            if(msg.senderEmail===myEmail) return

            // 삭제된 방에서 새 메시지 오면 → 목록에 복원
            setDeletedRooms(prev=>{
                if(!prev.includes(msg.roomId)) return prev
                const next=prev.filter(id=>id!==msg.roomId)
                save(DELETED_KEY,next)
                return next
            })

            setRooms(prev=>{
                const exists=prev.some(r=>r.id===msg.roomId)
                if(exists) return prev.map(r=>r.id===msg.roomId?{...r,lastMsg:msg.text||(msg.fileName?`📎 ${msg.fileName}`:''),lastAt:new Date().toISOString()}:r)
                loadRooms()
                return prev
            })
        })
        return()=>unsub?.()
    },[myEmail,loadRooms])

    // ── 커뮤니티 채팅하기 ──
    useEffect(()=>{
        if(!initialRoom) return
        const normalized={...initialRoom,id:initialRoom.roomId||initialRoom.id}
        // 삭제 목록에서 제거 → 목록에 다시 표시
        setDeletedRooms(prev=>{
            if(!prev.includes(normalized.id)) return prev
            const next=prev.filter(id=>id!==normalized.id)
            save(DELETED_KEY,next)
            return next
        })
        setOpenRooms([normalized])
        setTab('chats')
        setRooms(prev=>prev.find(r=>r.id===normalized.id)?prev:[normalized,...prev])
    },[initialRoom])

    const handleProfileSave=({nickname:nick,photo:ph})=>{ setNickname(nick);setPhoto(ph);localStorage.setItem(NICK_KEY,nick);localStorage.setItem(PHOTO_KEY,ph);setShowPhotoModal(false) }
    const openChat=(room,isGroup=false)=>setOpenRooms(prev=>prev.find(r=>r.id===room.id)?prev:[...prev,{...room,isGroup}])

    // ── 대화 삭제: deletedRooms에 추가 + deletedAt 기록 ──
    const deleteRoom=(id)=>setDeleteConfirmId(id)
    const confirmDeleteRoom=(id)=>{
        localStorage.setItem(deletedAtKey(id,myEmail),new Date().toISOString())
        setDeletedRooms(prev=>{ const next=[...new Set([...prev,id])]; save(DELETED_KEY,next); return next })
        setOpenRooms(prev=>prev.filter(r=>r.id!==id))
        setDeleteConfirmId(null)
    }

    const muteRoom=(id)=>setRooms(prev=>prev.map(r=>r.id===id?{...r,muted:!r.muted}:r))
    const markRead=(id)=>setRooms(prev=>prev.map(r=>r.id===id?{...r,unread:0}:r))
    const blockRoom=(id)=>{ setBlocked(prev=>{ const u=[...prev,id]; save(BLOCKED_KEY,u); return u }); confirmDeleteRoom(id) }
    const joinGroup=(gid)=>{ setJoinedGroups(prev=>{ const u=[...prev,gid]; save('sb_joined_groups',u); return u }); setPreviewRoom(null) }
    const leaveGroup=(gid)=>{ setJoinedGroups(prev=>{ const u=prev.filter(id=>id!==gid); save('sb_joined_groups',u); return u }); setOpenRooms(prev=>prev.filter(r=>r.id!==gid)) }

    const unreadTotal=rooms.filter(r=>!deletedRooms.includes(r.id)&&!blocked.includes(r.id)).reduce((s,r)=>s+(r.unread||0)+(unreadByRoom[r.id]||0),0)

    // ── filteredRooms: 삭제된 방 숨김, 차단 숨김 ──
    const filteredRooms=rooms.filter(r=>{
        if(blocked.includes(r.id)) return false
        if(deletedRooms.includes(r.id)) return false
        const matchS=r.name?.includes(search)||(r.lastMsg||'').includes(search)
        const totalUnread=(r.unread||0)+(unreadByRoom[r.id]||0)
        const matchF=chatFilter==='all'||(chatFilter==='unread'&&totalUnread>0)
        return matchS&&matchF
    })

    const realName=myName||'사용자'
    const displayName=profile?.name||realName
    const displayEmail=profile?.email||myEmail||'-'
    const joined=profile?.joinedAt?new Date(profile.joinedAt).toLocaleDateString('ko-KR'):'-'
    const myChatId=Array.isArray(communityProfile)?communityProfile[0]?.chatId||null:communityProfile?.chatId||null

    return (
        <>
            <div className="ci-window" style={{left:pos.x,top:pos.y}}>
                <div className="ci-rail nd">
                    <div className="ci-rail-logo"><img src="/SignBridge.png" alt="SB" className="ci-rail-logo-img" onError={e=>{e.target.style.display='none';e.target.nextElementSibling.style.display='flex'}}/><div className="ci-rail-logo-fallback" style={{display:'none'}}>🤟</div></div>
                    <nav className="ci-rail-nav">
                        {[{id:'profile',icon:<IconUser/>,label:'프로필'},{id:'chats',icon:<IconChat/>,label:'채팅',badge:unreadTotal},{id:'groups',icon:<IconGroup/>,label:'그룹'},{id:'starred',icon:<span style={{fontSize:16}}>⭐</span>,label:'즐겨찾기',badge:starred.length}].map(({id,icon,label,badge})=>(
                            <button key={id} className={`ci-rail-tab nd ${tab===id?'active':''}`} onClick={()=>setTab(id)}>
                                <span className="ci-rail-tab-icon-wrap">{icon}{badge>0&&<span className="ci-rail-badge">{badge}</span>}</span>
                                <span className="ci-rail-tab-label">{label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="ci-main">
                    {/* 프로필 탭 */}
                    {tab==='profile'&&(
                        <div className="ci-pane">
                            <div className="ci-pane-hd" onMouseDown={onMouseDown}>
                                <div className="ci-pane-hd-avatar nd" onClick={()=>setShowPhotoModal(true)}>{photo?<span style={{fontSize:22}}>{photo}</span>:<span style={{fontSize:18,fontWeight:700,color:'#8a6c2a'}}>{displayName.charAt(0)}</span>}</div>
                                <span className="ci-pane-title">내 프로필</span>
                                <button className="ci-pane-close nd" onClick={onClose}>✕</button>
                            </div>
                            <div className="ci-pane-scroll nd">
                                <div className="ci-prof-hero nd" onClick={()=>setShowPhotoModal(true)}>
                                    <div className="ci-prof-hero-av">{photo?<span style={{fontSize:28}}>{photo}</span>:<span>{displayName.charAt(0)}</span>}<div className="ci-prof-hero-cam">📷</div></div>
                                    <div className="ci-prof-hero-info"><div className="ci-prof-hero-nick">{nickname||displayName}</div><div className="ci-prof-hero-email">{displayEmail}</div></div>
                                    <div className="ci-prof-hero-arrow">›</div>
                                </div>
                                {myChatId&&(<div className="ci-chatid-banner"><span className="ci-chatid-at">@</span><span className="ci-chatid-val">{myChatId}</span><span className="ci-chatid-badge">커뮤니티 ID</span></div>)}
                                <div className="ci-section-label">기본 정보</div>
                                <div className="ci-info-card">{[['이름',profile?.name||displayName],['닉네임',nickname||'(미설정)'],['이메일',displayEmail],['사용자 유형',profile?.orgType||'개인 사용자'],['가입일',joined],['장애 등급',profile?.disabilityGrade||'-'],['수어와의 관계',profile?.preferredSign||'-'],...(profile?.orgType&&profile.orgType!=='personal'?[['기관명',profile?.officeName||'-'],['기관 코드',profile?.orgCode||'-']]:[] )].map(([k,v])=>(<div className="ci-info-row" key={k}><span className="ci-info-key">{k}</span><span className="ci-info-val">{v}</span></div>))}</div>
                                <div className="ci-section-label">주소 정보</div>
                                <div className="ci-info-card" style={{marginBottom:20}}>{[['우편번호',profile?.zonecode||'-'],['주소',profile?.address||'-'],['상세주소',profile?.addressDetail||'-']].map(([k,v])=>(<div className="ci-info-row" key={k}><span className="ci-info-key">{k}</span><span className="ci-info-val">{v}</span></div>))}</div>
                            </div>
                        </div>
                    )}

                    {/* 채팅 탭 */}
                    {tab==='chats'&&(
                        <div className="ci-pane">
                            <div className="ci-pane-hd ci-chats-hd" onMouseDown={onMouseDown}>
                                <div className="ci-pane-hd-avatar nd" onClick={()=>setShowPhotoModal(true)}>{photo?<span style={{fontSize:22}}>{photo}</span>:<span style={{fontSize:18,fontWeight:700,color:'#8a6c2a'}}>{displayName.charAt(0)}</span>}</div>
                                <span className="ci-pane-title">Chats</span>
                                <button className="ci-pane-close nd" onClick={onClose}>✕</button>
                            </div>
                            <div className="ci-search-bar nd"><span className="ci-search-icon"><IconSearch/></span><input className="ci-search-input" placeholder="검색..." value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button className="ci-search-clear nd" onClick={()=>setSearch('')}><IconX/></button>}</div>
                            <div className="ci-filter-row nd">
                                <button className={`ci-filter-btn nd ${chatFilter==='all'?'active':''}`} onClick={()=>setChatFilter('all')}>전체</button>
                                <button className={`ci-filter-btn nd ${chatFilter==='unread'?'active':''}`} onClick={()=>setChatFilter('unread')}>읽지 않음{unreadTotal>0&&<span className="ci-filter-count">{unreadTotal}</span>}</button>
                            </div>
                            <div className="ci-pane-scroll nd" onClick={()=>setMenuOpenId(null)}>
                                {!filteredRooms.length?(
                                    <div className="ci-empty">
                                        <div className="ci-empty-icon">{chatFilter==='unread'?'✅':'💬'}</div>
                                        <div className="ci-empty-text">{chatFilter==='unread'?'읽지 않은 대화가 없어요':'아직 대화가 없어요'}</div>
                                        <div className="ci-empty-sub">커뮤니티에서 대화를 시작해보세요</div>
                                    </div>
                                ):filteredRooms.map(room=>{
                                    const appUnread=unreadByRoom[room.id]||0
                                    const totalUnread=(room.unread||0)+appUnread
                                    return (
                                        <div key={room.id} className="ci-room-wrap">
                                            <div className={`ci-room-row ${totalUnread>0?'ci-room-unread':''}`} onClick={()=>{ if(menuOpenId===room.id){setMenuOpenId(null);return}; handleSelectRoom(room) }}>
                                                <div className="ci-room-av-wrap"><Avatar name={room.avatar||room.name} photo={room.avatar?.length<=2?room.avatar:undefined} size={50}/>{room.muted&&<span className="ci-room-mute-badge">🔕</span>}</div>
                                                <div className="ci-room-info">
                                                    <div className="ci-room-top"><span className="ci-room-name">{room.name}</span><span className="ci-room-time">{fmtRecent(room.lastAt)}</span></div>
                                                    <div className="ci-room-bottom">
                                                        <span className="ci-room-last">{room.lastMsg||'대화를 시작하세요'}</span>
                                                        {totalUnread>0&&<span className="ci-unread-badge">{totalUnread>99?'99+':totalUnread}</span>}
                                                    </div>
                                                </div>
                                                <button className="ci-room-dots nd" onClick={e=>{e.stopPropagation();setMenuOpenId(menuOpenId===room.id?null:room.id)}}><IconRoomDots/></button>
                                            </div>
                                            {menuOpenId===room.id&&<RoomMenu room={room} onMarkRead={()=>{markRead(room.id);onRoomRead?.(room.id)}} onMute={()=>muteRoom(room.id)} onDelete={()=>deleteRoom(room.id)} onBlock={()=>blockRoom(room.id)} onClose={()=>setMenuOpenId(null)}/>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* 그룹 탭 */}
                    {tab==='groups'&&(
                        <div className="ci-pane">
                            <div className="ci-pane-hd" onMouseDown={onMouseDown}><div className="ci-pane-hd-avatar nd" onClick={()=>setShowPhotoModal(true)}>{photo?<span style={{fontSize:22}}>{photo}</span>:<span style={{fontSize:18,fontWeight:700,color:'#8a6c2a'}}>{displayName.charAt(0)}</span>}</div><span className="ci-pane-title">공개 그룹</span><button className="ci-pane-close nd" onClick={onClose}>✕</button></div>
                            <div className="ci-pane-scroll nd"><div className="ci-section-label" style={{paddingTop:14}}>공식 채팅방</div>{OFFICIAL_ROOMS.map(room=>(<OfficialRoomBanner key={room.id} room={room} joined={joinedGroups.includes(room.id)} onJoin={()=>joinGroup(room.id)} onLeave={()=>leaveGroup(room.id)} onOpen={()=>openChat(room,true)} onPreview={()=>setPreviewRoom(room)}/>))}<div className="ci-groups-hint">참여한 그룹 채팅은 여기에서 열 수 있어요.</div></div>
                        </div>
                    )}

                    {/* 즐겨찾기 탭 */}
                    {tab==='starred'&&(
                        <div className="ci-pane">
                            <div className="ci-pane-hd nd" onMouseDown={onMouseDown}><div className="ci-pane-hd-avatar nd" onClick={()=>setShowPhotoModal(true)}>{photo?<span style={{fontSize:22}}>{photo}</span>:<span style={{fontSize:18,fontWeight:700,color:'#8a6c2a'}}>{displayName.charAt(0)}</span>}</div><span className="ci-pane-title">즐겨찾기</span><button className="ci-pane-close nd" onClick={onClose}>✕</button></div>
                            <div className="ci-pane-scroll">
                                {starred.length===0?(
                                    <div className="ci-empty" style={{padding:'48px 20px'}}><div className="ci-empty-icon">⭐</div><div className="ci-empty-text">즐겨찾기한 메시지가 없습니다</div><div className="ci-empty-sub" style={{fontSize:12,color:'var(--text-3)',marginTop:4,textAlign:'center',lineHeight:1.6}}>채팅 메시지를 꾹 누르면<br/>즐겨찾기에 추가할 수 있습니다</div></div>
                                ):starred.map((msg,idx)=>{
                                    const isImg=!!msg.imageData,isFile=!!msg.fileName
                                    const preview=isImg?'🖼 이미지':isFile?`📎 ${msg.fileName}`:msg.text||''
                                    const timeStr=msg.starredAt?new Date(msg.starredAt).toLocaleDateString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):''
                                    return (
                                        <div key={msg.id??idx} style={{margin:'8px 14px',padding:'13px 14px',background:'#fff',borderRadius:14,border:'1.5px solid #e8e8ec',boxShadow:'0 2px 8px rgba(0,0,0,0.04)',cursor:'pointer',transition:'all 0.15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#c7d2fe'} onMouseLeave={e=>e.currentTarget.style.borderColor='#e8e8ec'}>
                                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                                                <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:10,fontWeight:700,background:'#eef2ff',color:'#6366f1',borderRadius:20,padding:'2px 8px'}}>{msg.roomName||'채팅'}</span><span style={{fontSize:11,color:'var(--text-3)'}}>{msg.senderName||'상대방'}</span></div>
                                                <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:10,color:'var(--text-3)'}}>{timeStr}</span><button style={{background:'none',border:'none',cursor:'pointer',fontSize:14,opacity:0.5,padding:'0 2px'}} onClick={e=>{e.stopPropagation();const next=starred.filter(s=>s.id!==msg.id);setStarred(next);save(starredKey,next)}}>✕</button></div>
                                            </div>
                                            <div style={{fontSize:13,color:'var(--text-1)',lineHeight:1.55,display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{preview}</div>
                                        </div>
                                    )
                                })}
                                {starred.length>0&&(<div style={{textAlign:'center',padding:'8px 0 16px'}}><button style={{background:'none',border:'none',fontSize:12,color:'#ef4444',cursor:'pointer',fontWeight:600}} onClick={()=>{if(window.confirm('즐겨찾기를 모두 삭제할까요?')){setStarred([]);save(starredKey,[])}}}>전체 삭제</button></div>)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showPhotoModal&&<ProfileEditModal nickname={nickname} photo={photo} myName={myName} onSave={handleProfileSave} onClose={()=>setShowPhotoModal(false)}/>}
            {previewRoom&&<GroupPreviewModal room={previewRoom} onJoin={()=>{joinGroup(previewRoom.id);openChat(previewRoom,true)}} onClose={()=>setPreviewRoom(null)}/>}

            {/* 대화 삭제 확인 모달 */}
            {deleteConfirmId&&(
                <div className="ci-modal-overlay nd" onClick={()=>setDeleteConfirmId(null)}>
                    <div className="ci-modal nd" style={{maxWidth:320}} onClick={e=>e.stopPropagation()}>
                        <div className="ci-modal-hd" style={{fontSize:15}}><span>🗑 대화 삭제</span><button className="ci-modal-close nd" onClick={()=>setDeleteConfirmId(null)}>✕</button></div>
                        <div className="ci-modal-body" style={{gap:10}}>
                            <div style={{fontSize:32,textAlign:'center'}}>🗑️</div>
                            <div style={{fontWeight:700,fontSize:14,color:'#1a1a2e',textAlign:'center'}}>정말로 삭제하겠습니까?</div>
                            <div style={{fontSize:13,color:'#888',textAlign:'center',lineHeight:1.6}}>내 채팅 목록에서만 사라집니다.<br/>상대방의 대화 내용은 유지됩니다.<br/>다시 채팅하려면 커뮤니티에서<br/>채팅하기를 눌러주세요.</div>
                            <div style={{display:'flex',gap:8,width:'100%',marginTop:4}}>
                                <button style={{flex:1,padding:'11px',borderRadius:10,border:'1.5px solid #e0e0f0',background:'#f4f4fb',color:'#555',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}} onClick={()=>setDeleteConfirmId(null)}>취소</button>
                                <button style={{flex:1,padding:'11px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#ef4444,#dc2626)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 3px 10px rgba(239,68,68,0.3)'}} onClick={()=>confirmDeleteRoom(deleteConfirmId)}>삭제하기</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {openRooms.map(room=>(
                <ChatWindow key={room.id} room={room} isGroup={!!room.isGroup}
                            myEmail={myEmail} myName={myName} myNickname={nickname} myPhoto={photo}
                            allRooms={rooms} starred={starred}
                            isDeleted={deletedRooms.includes(room.id)}
                            onStarChange={(next)=>{ setStarred(next); save(starredKey,next) }}
                            onClose={()=>setOpenRooms(prev=>prev.filter(r=>r.id!==room.id))}/>
            ))}
        </>
    )
}