import { useState } from 'react'
import './Community.css'
import Registration from '../Registration/Registration.jsx'
import CommunityPersonalDetail from '../CommunityPersonalDetail/CommunityPersonalDetail.jsx'

const SAMPLE_MEMBERS = [
    {
        id: 1, name: '쿤산', role: '수어 선생님', region: '서울',
        intro: '안녕하세요! 저는 10년 경력의 수어 선생님입니다. 초급부터 고급까지 체계적으로 가르쳐 드립니다.',
        experience: '한국수어 통역사 1급 자격증 보유\n수어 교육 경력 10년\n청각장애인복지관 강사 5년',
        speciality: '교육 수어, 의료 수어, 법정 수어',
        contact: { type: 'chat', value: 'https://open.kakao.com/example1' },
        avatar: '쿤', publicProfile: true, certFiles: [],
    },
    {
        id: 2, name: '토야', role: '수어 통역사', region: '부산',
        intro: '청각장애인 전문 수어 통역사이자 선생님입니다. 편하게 연락 주세요!',
        experience: '수어 통역사 경력 7년\n부산 청각장애인 협회 소속',
        speciality: '의료 수어, 법정 수어',
        contact: { type: 'phone', value: '010-1234-5678' },
        avatar: '토', publicProfile: true, certFiles: [],
    },
]

const ROLE_OPTIONS   = ['수어 선생님','수어 통역사','수어 학습자','가족/보호자','수어 관심자','연구자','기타']
const REGION_OPTIONS = ['서울','부산','대구','인천','광주','대전','울산','경기','기타']

// view: 'list' | 'register' | 'detail'
export default function Community({ userEmail = '', displayName = '', onLoginRequired, myProfile = null, onProfileSave }) {
    const [view,    setView]    = useState('list')  // 현재 화면
    const [members, setMembers] = useState(SAMPLE_MEMBERS)
    const [selected, setSelected] = useState(null)  // 상세 볼 멤버
    const [filterRole,   setFilterRole]   = useState('전체')
    const [filterRegion, setFilterRegion] = useState('전체')

    // 등록하기 클릭
    const handleRegisterClick = () => {
        if (!userEmail) {
            alert('등록하려면 먼저 로그인 해야 합니다.')
            onLoginRequired?.()
            return
        }
        setView('register')
    }

    // 등록 완료
    const handleRegisterSubmit = (form) => {
        const newMember = {
            id: Date.now(),
            name:         form.name || displayName,
            role:         form.role,
            region:       form.region,
            intro:        form.intro,
            experience:   form.experience,
            speciality:   form.speciality,
            contact:      { type: form.contactType, value: form.contactValue },
            avatar:       (form.name || displayName)?.charAt(0) || '?',
            publicProfile: form.publicProfile,
            certFiles:    form.certFiles || [],
            userEmail,
        }
        setMembers(m => [newMember, ...m])
        if (userEmail) onProfileSave?.(newMember)
        setView('list')
    }

    // 카드 클릭 → 상세 화면
    const handleCardClick = (member) => {
        setSelected(member)
        setView('detail')
    }

    const filtered = members.filter(m => {
        const roleOk   = filterRole   === '전체' || m.role   === filterRole
        const regionOk = filterRegion === '전체' || m.region === filterRegion
        return roleOk && regionOk
    })

    // ── 등록 화면 ───────────────────────────────────────────
    if (view === 'register') {
        return (
            <Registration
                defaultName={displayName}
                onBack={() => setView('list')}
                onSubmit={handleRegisterSubmit}
            />
        )
    }

    // ── 상세 화면 ───────────────────────────────────────────
    if (view === 'detail' && selected) {
        return (
            <CommunityPersonalDetail
                member={selected}
                onBack={() => { setView('list'); setSelected(null) }}
            />
        )
    }

    // ── 목록 화면 ───────────────────────────────────────────
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
                    + 등록하기
                </button>
            </div>

            {/* 내 프로필 배너 */}
            {myProfile && (
                <div className="cm-my-profile-banner">
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div className="cm-card-avatar"
                             style={{width:36,height:36,fontSize:14,borderRadius:10,flexShrink:0}}>
                            {myProfile.avatar}
                        </div>
                        <div>
                            <div style={{fontSize:12,color:'#6366f1',fontWeight:700}}>내 커뮤니티 프로필</div>
                            <div style={{fontSize:13,fontWeight:700,color:'#1e1b4b'}}>
                                {myProfile.name} · {myProfile.role}
                            </div>
                        </div>
                    </div>
                    <span className="cm-region-badge">📍 {myProfile.region}</span>
                </div>
            )}

            {/* 필터 */}
            <div className="cm-filters">
                <div className="cm-filter-group">
                    <span className="cm-filter-label">역할</span>
                    {['전체', ...ROLE_OPTIONS].map(r => (
                        <button key={r}
                                className={`cm-filter-btn ${filterRole===r?'active':''}`}
                                onClick={() => setFilterRole(r)}>{r}</button>
                    ))}
                </div>
                <div className="cm-filter-group">
                    <span className="cm-filter-label">지역</span>
                    {['전체', ...REGION_OPTIONS].map(r => (
                        <button key={r}
                                className={`cm-filter-btn ${filterRegion===r?'active':''}`}
                                onClick={() => setFilterRegion(r)}>{r}</button>
                    ))}
                </div>
            </div>

            {/* 멤버 목록 */}
            <div className="cm-list">
                {filtered.length === 0 ? (
                    <div className="cm-empty">조건에 맞는 멤버가 없습니다.</div>
                ) : filtered.map(member => (
                    <div className="cm-card" key={member.id}
                         onClick={() => handleCardClick(member)}>
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
                ))}
            </div>
        </div>
    )
}