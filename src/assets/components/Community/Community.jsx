import { useState } from 'react'
import './Community.css'

/* ── 샘플 데이터 ── */
const SAMPLE_MEMBERS = [
    {
        id: 1,
        name: '쿤산',
        role: '수어 선생님',
        roleTag: 'TEACHER',
        region: '서울',
        intro: '안녕하세요! 저는 10년 경력의 수어 선생님입니다. 초급부터 고급까지 체계적으로 가르쳐 드립니다.',
        contact: { type: 'chat' },
        avatar: '쿤',
    },
    {
        id: 2,
        name: '토야',
        role: '수어 선생님',
        roleTag: 'TEACHER',
        region: '부산',
        intro: '청각장애인 전문 수어 통역사이자 선생님입니다. 편하게 연락 주세요!',
        contact: { type: 'chat' },
        avatar: '토',
    },
]

const ROLE_OPTIONS = ['수어 선생님', '수어 통역사', '학습자', '연구자', '기타']
const REGION_OPTIONS = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '경기', '기타']

/* ── 인앱 채팅 모달 ── */
function ChatModal({ member, onClose }) {
    const [messages, setMessages] = useState([
        {
            id: 1,
            from: 'them',
            text: `안녕하세요! 저는 ${member.name}입니다. 무엇을 도와드릴까요? 😊`,
            time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        },
    ])
    const [input, setInput] = useState('')

    const sendMessage = () => {
        const text = input.trim()
        if (!text) return
        const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        setMessages(prev => [...prev, { id: Date.now(), from: 'me', text, time: now }])
        setInput('')

        // 자동 응답 (실제 구현 시 WebSocket/API로 교체)
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                from: 'them',
                text: '감사합니다! 곧 답변 드리겠습니다.',
                time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            }])
        }, 800)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <div className="cm-modal-overlay" onClick={onClose}>
            <div className="cm-chat-modal" onClick={e => e.stopPropagation()}>
                {/* 채팅 헤더 */}
                <div className="cm-chat-header">
                    <div className="cm-chat-header-avatar">{member.avatar}</div>
                    <div className="cm-chat-header-info">
                        <div className="cm-chat-header-name">{member.name}</div>
                        <div className="cm-chat-header-role">{member.role} · {member.region}</div>
                    </div>
                    <button className="cm-modal-close" onClick={onClose}>✕</button>
                </div>

                {/* 메시지 목록 */}
                <div className="cm-chat-messages">
                    {messages.map(msg => (
                        <div key={msg.id} className={`cm-msg-row cm-msg-${msg.from}`}>
                            {msg.from === 'them' && (
                                <div className="cm-msg-avatar">{member.avatar}</div>
                            )}
                            <div className="cm-msg-bubble-wrap">
                                <div className="cm-msg-bubble">{msg.text}</div>
                                <div className="cm-msg-time">{msg.time}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 입력창 */}
                <div className="cm-chat-input-row">
                    <textarea
                        className="cm-chat-input"
                        placeholder="메시지를 입력하세요..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                    />
                    <button
                        className="cm-chat-send-btn"
                        onClick={sendMessage}
                        disabled={!input.trim()}
                    >
                        ↑
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ── 등록 모달 ── */
function RegisterModal({ onClose, onSubmit }) {
    const [form, setForm] = useState({
        name: '',
        role: '',
        region: '',
        intro: '',
    })
    const [error, setError] = useState('')

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = () => {
        if (!form.name.trim()) return setError('이름을 입력해 주세요.')
        if (!form.role) return setError('역할을 선택해 주세요.')
        if (!form.region) return setError('지역을 선택해 주세요.')
        if (!form.intro.trim()) return setError('자기소개를 입력해 주세요.')
        setError('')
        onSubmit(form)
    }

    return (
        <div className="cm-modal-overlay" onClick={onClose}>
            <div className="cm-modal" onClick={e => e.stopPropagation()}>
                <div className="cm-modal-header">
                    <h2 className="cm-modal-title">프로필 등록</h2>
                    <button className="cm-modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="cm-modal-body">
                    <div className="cm-field">
                        <label className="cm-label">이름</label>
                        <input
                            className="cm-input"
                            placeholder="이름을 입력하세요"
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                        />
                    </div>

                    <div className="cm-field-row">
                        <div className="cm-field">
                            <label className="cm-label">역할</label>
                            <select className="cm-select" value={form.role} onChange={e => set('role', e.target.value)}>
                                <option value="">선택하세요</option>
                                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="cm-field">
                            <label className="cm-label">지역</label>
                            <select className="cm-select" value={form.region} onChange={e => set('region', e.target.value)}>
                                <option value="">선택하세요</option>
                                {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="cm-field">
                        <label className="cm-label">자기소개</label>
                        <textarea
                            className="cm-textarea"
                            placeholder="간단히 소개해 주세요 (활동 경력, 전문 분야 등)"
                            value={form.intro}
                            onChange={e => set('intro', e.target.value)}
                            rows={3}
                        />
                    </div>

                    {error && <div className="cm-error">⚠️ {error}</div>}
                </div>

                <div className="cm-modal-footer">
                    <button className="cm-btn-cancel" onClick={onClose}>취소</button>
                    <button className="cm-btn-submit" onClick={handleSubmit}>등록하기</button>
                </div>
            </div>
        </div>
    )
}

/* ── 상세 페이지 (전체 화면) ── */
function DetailPage({ member, onClose, isLoggedIn, onOpenLogin }) {
    const [showChat, setShowChat] = useState(false)

    const handleChatClick = () => {
        if (!isLoggedIn) {
            onOpenLogin?.()
        } else {
            setShowChat(true)
        }
    }

    return (
        <>
            <div className="cm-detail-page">
                <div className="cm-detail-nav">
                    <button className="cm-back-btn" onClick={onClose}>← 목록으로</button>
                </div>

                <div className="cm-detail-content">
                    <div className="cm-detail-hero">
                        <div className="cm-detail-avatar-lg">{member.avatar}</div>
                        <div className="cm-detail-hero-info">
                            <h1 className="cm-detail-name-lg">{member.name}</h1>
                            <div className="cm-detail-tags">
                                <span className="cm-role-badge">{member.role}</span>
                                <span className="cm-region-badge">📍 {member.region}</span>
                            </div>
                        </div>
                    </div>

                    <div className="cm-detail-section">
                        <div className="cm-detail-section-label">자기소개</div>
                        <p className="cm-detail-section-text">{member.intro}</p>
                    </div>

                    <button className="cm-contact-btn" onClick={handleChatClick}>
                        💬 채팅하기
                    </button>

                    {!isLoggedIn && (
                        <p className="cm-login-hint">채팅을 하려면 로그인이 필요합니다.</p>
                    )}
                </div>
            </div>

            {showChat && (
                <ChatModal member={member} onClose={() => setShowChat(false)} />
            )}
        </>
    )
}

/* ── 메인 컴포넌트 ── */
// Props:
//   isLoggedIn  : boolean   — 현재 로그인 여부
//   onOpenLogin : () => void — 로그인 모달을 여는 콜백 (부모에서 전달)
//
// 부모 사용 예시:
//   <Community isLoggedIn={isLoggedIn} onOpenLogin={() => setShowLogin(true)} />
export default function Community({ isLoggedIn = false, onOpenLogin }) {
    const [members, setMembers] = useState(SAMPLE_MEMBERS)
    const [showRegister, setShowRegister] = useState(false)
    const [selectedMember, setSelectedMember] = useState(null)
    const [filterRole, setFilterRole] = useState('전체')
    const [filterRegion, setFilterRegion] = useState('전체')
    const [searchQuery, setSearchQuery] = useState('')

    const handleRegisterClick = () => {
        if (!isLoggedIn) {
            // onOpenLogin이 전달되지 않은 경우 경고 (개발 디버깅용)
            if (typeof onOpenLogin !== 'function') {
                console.warn('[Community] onOpenLogin prop이 전달되지 않았습니다. 부모에서 onOpenLogin={() => setShowLogin(true)} 를 전달해 주세요.')
                return
            }
            onOpenLogin()
        } else {
            setShowRegister(true)
        }
    }

    const handleRegister = (form) => {
        const newMember = {
            id: Date.now(),
            name: form.name,
            role: form.role,
            roleTag: 'MEMBER',
            region: form.region,
            intro: form.intro,
            contact: { type: 'chat' },
            avatar: form.name.charAt(0),
        }
        setMembers(m => [newMember, ...m])
        setShowRegister(false)
    }

    const filtered = members.filter(m => {
        const roleOk = filterRole === '전체' || m.role === filterRole
        const regionOk = filterRegion === '전체' || m.region === filterRegion
        const searchOk = !searchQuery.trim() ||
            m.name.includes(searchQuery) ||
            m.intro.includes(searchQuery) ||
            m.role.includes(searchQuery)
        return roleOk && regionOk && searchOk
    })

    if (selectedMember) {
        return (
            <DetailPage
                member={selectedMember}
                onClose={() => setSelectedMember(null)}
                isLoggedIn={isLoggedIn}
                onOpenLogin={onOpenLogin}
            />
        )
    }

    return (
        <div className="community-page">
            {/* 헤더 */}
            <div className="cm-header">
                <div>
                    <div className="cm-header-tag">COMMUNITY</div>
                    <h1 className="cm-title">커뮤니티</h1>
                    <p className="cm-subtitle">수어 선생님, 통역사, 학습자를 찾아보세요</p>
                </div>
                <button className="cm-register-btn" onClick={handleRegisterClick}>
                    {isLoggedIn ? '+ 등록하기' : '🔒 등록하기'}
                </button>
            </div>

            {/* 검색창 */}
            <div className="cm-search-bar">
                <span className="cm-search-icon">🔍</span>
                <input
                    className="cm-search-input"
                    type="text"
                    placeholder="이름, 역할, 소개 검색..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button className="cm-search-clear" onClick={() => setSearchQuery('')}>✕</button>
                )}
            </div>

            {/* 필터 */}
            <div className="cm-filters">
                <div className="cm-filter-group">
                    <span className="cm-filter-label">역할</span>
                    {['전체', ...ROLE_OPTIONS].map(r => (
                        <button
                            key={r}
                            className={`cm-filter-btn ${filterRole === r ? 'active' : ''}`}
                            onClick={() => setFilterRole(r)}
                        >{r}</button>
                    ))}
                </div>
                <div className="cm-filter-group">
                    <span className="cm-filter-label">지역</span>
                    {['전체', ...REGION_OPTIONS].map(r => (
                        <button
                            key={r}
                            className={`cm-filter-btn ${filterRegion === r ? 'active' : ''}`}
                            onClick={() => setFilterRegion(r)}
                        >{r}</button>
                    ))}
                </div>
            </div>

            {/* 결과 수 */}
            <div className="cm-result-count">
                총 <strong>{filtered.length}</strong>명의 멤버
            </div>

            {/* 멤버 목록 */}
            <div className="cm-list">
                {filtered.length === 0 ? (
                    <div className="cm-empty">
                        <div className="cm-empty-icon">🔎</div>
                        <div className="cm-empty-title">조건에 맞는 멤버가 없습니다</div>
                        <div className="cm-empty-desc">필터나 검색어를 변경해 보세요</div>
                    </div>
                ) : (
                    filtered.map(member => (
                        <div
                            className="cm-card"
                            key={member.id}
                            onClick={() => setSelectedMember(member)}
                        >
                            <div className="cm-card-avatar">{member.avatar}</div>
                            <div className="cm-card-info">
                                <div className="cm-card-name">{member.name}</div>
                                <div className="cm-card-meta">
                                    <span className="cm-role-badge">{member.role}</span>
                                    <span className="cm-region-badge">📍 {member.region}</span>
                                </div>
                                <div className="cm-card-intro">{member.intro}</div>
                            </div>
                            <button
                                className="cm-card-contact-btn"
                                title="채팅하기"
                                onClick={e => {
                                    e.stopPropagation()
                                    if (!isLoggedIn) {
                                        onOpenLogin?.()
                                    } else {
                                        setSelectedMember(member)
                                    }
                                }}
                            >
                                💬
                            </button>
                        </div>
                    ))
                )}
            </div>

            {showRegister && (
                <RegisterModal onClose={() => setShowRegister(false)} onSubmit={handleRegister} />
            )}
        </div>
    )
}