import { useState, useEffect } from 'react'
import { communityApi } from '../api/api.jsx'
import './Community.css'
import Registration from '../Registration/Registration.jsx'
import CommunityPersonalDetail from '../CommunityPersonalDetail/CommunityPersonalDetail.jsx'

// 샘플 데이터 제거 — 서버에서 로드

const ROLE_OPTIONS   = ['수어 선생님','수어 통역사','수어 학습자','가족/보호자','수어 관심자','연구자','기타']
const REGION_OPTIONS = ['서울','부산','대구','인천','광주','대전','울산','경기','기타']

// view: 'list' | 'register' | 'detail'
export default function Community({ userEmail = '', displayName = '', onLoginRequired, myProfile = null, onProfileSave }) {
    const [view,    setView]    = useState('list')  // 현재 화면
    const [members, setMembers] = useState([])
    const [listLoading, setListLoading] = useState(false)
    const [selected, setSelected] = useState(null)  // 상세 볼 멤버
    const [filterRole,   setFilterRole]   = useState('전체')
    const [filterRegion, setFilterRegion] = useState('전체')

    // ── 서버에서 목록 로드 ─────────────────────────────
    const loadMembers = async (role='', region='') => {
        setListLoading(true)
        try {
            const data = await communityApi.getMembers({ role, region })
            setMembers(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('[Community] 목록 로드 실패:', e)
            setMembers([])
        } finally {
            setListLoading(false)
        }
    }

    useEffect(() => { loadMembers(filterRole, filterRegion) }, [filterRole, filterRegion])

    // 등록하기 클릭
    const handleRegisterClick = () => {
        if (!userEmail) {
            alert('등록하려면 먼저 로그인 해야 합니다.')
            onLoginRequired?.()
            return
        }
        setView('register')
    }

    // 등록 완료 — 서버에 저장
    const handleRegisterSubmit = async (form) => {
        try {
            const certFileNames = (form.certFiles || []).map(f => f.name || f)
            const body = {
                name:          form.name || displayName,
                userEmail,
                role:          form.role,
                region:        form.region,
                intro:         form.intro,
                experience:    form.experience,
                speciality:    form.speciality,
                contactType:   form.contactType,
                contactValue:  form.contactValue,
                publicProfile: form.publicProfile,
                certFileNames,
            }
            const saved = await communityApi.save(body)

            // App.jsx communityProfile 상태 업데이트
            const profileData = {
                ...saved,
                contact: { type: saved.contactType, value: saved.contactValue },
                avatar:  saved.name?.charAt(0) || '?',
            }
            onProfileSave?.(profileData)

            // 목록 새로고침
            await loadMembers(filterRole, filterRegion)
        } catch (e) {
            console.error('[Community] 등록 실패:', e)
            alert('등록에 실패했습니다. 다시 시도해 주세요.')
        }
        setView('list')
    }

    // 카드 클릭 → 상세 화면
    const handleCardClick = (member) => {
        setSelected(member)
        setView('detail')
    }

    // 서버 필터링 사용 — filtered 제거

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
                {listLoading ? (
                    <div className="cm-empty">불러오는 중...</div>
                ) : members.length === 0 ? (
                    <div className="cm-empty">조건에 맞는 멤버가 없습니다.</div>
                ) : members.map(member => (
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