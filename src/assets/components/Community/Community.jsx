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
        contact: { type: 'chat', value: 'https://open.kakao.com/example1' },
        avatar: '쿤',
    },
    {
        id: 2,
        name: '토야',
        role: '수어 선생님',
        roleTag: 'TEACHER',
        region: '부산',
        intro: '청각장애인 전문 수어 통역사이자 선생님입니다. 편하게 연락 주세요!',
        contact: { type: 'phone', value: '010-1234-5678' },
        avatar: '토',
    },
]

const ROLE_OPTIONS = ['수어 선생님', '수어 통역사', '학습자', '연구자', '기타']
const REGION_OPTIONS = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '경기', '기타']

/* ── 등록 모달 ── */
function RegisterModal({ onClose, onSubmit }) {
    const [form, setForm] = useState({
        name: '',
        role: '',
        region: '',
        intro: '',
        contactType: 'chat',
        contactValue: '',
    })
    const [error, setError] = useState('')

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = () => {
        if (!form.name.trim()) return setError('이름을 입력해 주세요.')
        if (!form.role) return setError('역할을 선택해 주세요.')
        if (!form.region) return setError('지역을 선택해 주세요.')
        if (!form.intro.trim()) return setError('자기소개를 입력해 주세요.')
        if (!form.contactValue.trim()) return setError('연락처를 입력해 주세요.')
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

                    <div className="cm-field">
                        <label className="cm-label">연락 방법</label>
                        <div className="cm-contact-type">
                            <button
                                className={`cm-type-btn ${form.contactType === 'chat' ? 'active' : ''}`}
                                onClick={() => set('contactType', 'chat')}
                            >💬 오픈채팅 링크</button>
                            <button
                                className={`cm-type-btn ${form.contactType === 'phone' ? 'active' : ''}`}
                                onClick={() => set('contactType', 'phone')}
                            >📞 전화번호</button>
                        </div>
                        <input
                            className="cm-input"
                            placeholder={form.contactType === 'chat' ? '카카오 오픈채팅 링크를 입력하세요' : '010-0000-0000'}
                            value={form.contactValue}
                            onChange={e => set('contactValue', e.target.value)}
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

/* ── 상세 모달 ── */
function DetailModal({ member, onClose }) {
    const handleContact = () => {
        if (member.contact.type === 'chat') {
            window.open(member.contact.value, '_blank')
        } else {
            window.location.href = `tel:${member.contact.value}`
        }
    }

    return (
        <div className="cm-modal-overlay" onClick={onClose}>
            <div className="cm-modal cm-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="cm-modal-header">
                    <h2 className="cm-modal-title">프로필 상세</h2>
                    <button className="cm-modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="cm-detail-body">
                    <div className="cm-detail-top">
                        <div className="cm-detail-avatar">{member.avatar}</div>
                        <div>
                            <div className="cm-detail-name">{member.name}</div>
                            <div className="cm-detail-tags">
                                <span className="cm-role-badge">{member.role}</span>
                                <span className="cm-region-badge">📍 {member.region}</span>
                            </div>
                        </div>
                    </div>

                    <div className="cm-detail-intro">
                        <div className="cm-detail-intro-label">자기소개</div>
                        <p className="cm-detail-intro-text">{member.intro}</p>
                    </div>

                    <div className="cm-detail-contact">
                        <div className="cm-detail-intro-label">연락 방법</div>
                        <div className="cm-contact-value">
                            {member.contact.type === 'chat' ? '💬 오픈채팅' : `📞 ${member.contact.value}`}
                        </div>
                    </div>
                </div>

                <div className="cm-modal-footer">
                    <button className="cm-btn-cancel" onClick={onClose}>닫기</button>
                    <button className="cm-btn-submit" onClick={handleContact}>
                        {member.contact.type === 'chat' ? '💬 채팅하기' : '📞 전화하기'}
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ── 메인 컴포넌트 ── */
export default function Community() {
    const [members, setMembers] = useState(SAMPLE_MEMBERS)
    const [showRegister, setShowRegister] = useState(false)
    const [selectedMember, setSelectedMember] = useState(null)
    const [filterRole, setFilterRole] = useState('전체')
    const [filterRegion, setFilterRegion] = useState('전체')

    const handleRegister = (form) => {
        const newMember = {
            id: Date.now(),
            name: form.name,
            role: form.role,
            roleTag: 'MEMBER',
            region: form.region,
            intro: form.intro,
            contact: { type: form.contactType, value: form.contactValue },
            avatar: form.name.charAt(0),
        }
        setMembers(m => [newMember, ...m])
        setShowRegister(false)
    }

    const filtered = members.filter(m => {
        const roleOk = filterRole === '전체' || m.role === filterRole
        const regionOk = filterRegion === '전체' || m.region === filterRegion
        return roleOk && regionOk
    })

    return (
        <div className="community-page">
            {/* 헤더 */}
            <div className="cm-header">
                <div>
                    <div className="cm-header-tag">COMMUNITY</div>
                    <h1 className="cm-title">커뮤니티</h1>
                    <p className="cm-subtitle">수어 선생님, 통역사, 학습자를 찾아보세요</p>
                </div>
                <button className="cm-register-btn" onClick={() => setShowRegister(true)}>
                    + 등록하기
                </button>
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

            {/* 멤버 목록 */}
            <div className="cm-list">
                {filtered.length === 0 ? (
                    <div className="cm-empty">조건에 맞는 멤버가 없습니다.</div>
                ) : (
                    filtered.map(member => (
                        <div className="cm-card" key={member.id} onClick={() => setSelectedMember(member)}>
                            <div className="cm-card-avatar">{member.avatar}</div>
                            <div className="cm-card-info">
                                <div className="cm-card-name">{member.name}</div>
                                <div className="cm-card-meta">
                                    <span className="cm-role-badge">{member.role}</span>
                                    <span className="cm-region-badge">📍 {member.region}</span>
                                </div>
                                <div className="cm-card-intro">{member.intro}</div>
                            </div>
                            <button className="cm-card-arrow">›</button>
                        </div>
                    ))
                )}
            </div>

            {/* 등록 모달 */}
            {showRegister && (
                <RegisterModal onClose={() => setShowRegister(false)} onSubmit={handleRegister} />
            )}

            {/* 상세 모달 */}
            {selectedMember && (
                <DetailModal member={selectedMember} onClose={() => setSelectedMember(null)} />
            )}
        </div>
    )
}