import { useState, useEffect } from 'react'
import { communityApi } from '../api/api.jsx'
import './Community.css'
import Registration from '../Registration/Registration.jsx'
import CommunityPersonalDetail from '../CommunityPersonalDetail/CommunityPersonalDetail.jsx'

const ROLE_OPTIONS   = ['수어 선생님','수어 통역사','수어 학습자','가족/보호자','수어 관심자','연구자','기타']
const REGION_OPTIONS = ['서울','부산','대구','인천','광주','대전','울산','경기','기타']

export default function Community({
                                      userEmail = '',
                                      displayName = '',
                                      onLoginRequired,
                                      myProfiles = [],
                                      onProfilesChange,
                                      onChat,
                                  }) {
    const [view,           setView]           = useState('list')
    const [members,        setMembers]        = useState([])
    const [listLoading,    setListLoading]    = useState(false)
    const [selected,       setSelected]       = useState(null)
    const [editingProfile, setEditingProfile] = useState(null)
    const [filterRole,     setFilterRole]     = useState('전체')
    const [filterRegion,   setFilterRegion]   = useState('전체')
    const [deleteConfirm,  setDeleteConfirm]  = useState(null)
    const [searchQuery,    setSearchQuery]    = useState('')
    const [deleteLoading,  setDeleteLoading]  = useState(false)

    const loadMembers = async (role = '', region = '') => {
        setListLoading(true)
        try {
            const params = {}
            if (role   && role   !== '전체') params.role   = role
            if (region && region !== '전체') params.region = region
            const data = await communityApi.getMembers(params)
            setMembers(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('[Community] 목록 로드 실패:', e)
            setMembers([])
        } finally {
            setListLoading(false)
        }
    }

    useEffect(() => { loadMembers(filterRole, filterRegion) }, [filterRole, filterRegion])

    const handleRegisterClick = () => {
        if (!userEmail) { alert('등록하려면 먼저 로그인 해야 합니다.'); onLoginRequired?.(); return }
        setEditingProfile(null)
        setView('register')
    }

    const handleEditClick = (profile) => {
        setEditingProfile(profile)
        setView('edit')
    }

    const registeredRoles = myProfiles.map(p => p.role)

    const handleRegisterSubmit = async (form) => {
        try {
            const body = {
                ...(editingProfile?.id ? { id: editingProfile.id } : {}),
                name:          form.name || displayName,
                chatId:        form.chatId,
                userEmail,
                role:          form.role,
                region:        form.region,
                intro:         form.intro,
                experience:    form.experience,
                speciality:    form.speciality,
                contactType:   form.contactType,
                contactValue:  form.contactValue,
                publicProfile: form.publicProfile,
                certFileNames: (form.certFiles || []).map(f => f.name || f),
            }
            const saved = await communityApi.save(body)
            const profileData = {
                ...saved,
                avatar:  saved.name?.charAt(0) || '?',
                contact: { type: saved.contactType, value: saved.contactValue },
            }
            if (editingProfile?.id) {
                onProfilesChange?.(myProfiles.map(p => p.id === editingProfile.id ? profileData : p))
            } else {
                onProfilesChange?.([...myProfiles, profileData])
            }
            await loadMembers(filterRole, filterRegion)
        } catch (e) {
            console.error('[Community] 등록 실패:', e)
            alert('등록에 실패했습니다: ' + e.message)
        }
        setEditingProfile(null)
        setView('list')
    }

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm) return
        setDeleteLoading(true)
        try {
            await fetch(`/api/community/members/${deleteConfirm}?email=${encodeURIComponent(userEmail)}`, {
                method: 'DELETE'
            }).then(r => { if (!r.ok) throw new Error('삭제 실패') })
            onProfilesChange?.(myProfiles.filter(p => p.id !== deleteConfirm))
            await loadMembers(filterRole, filterRegion)
            setDeleteConfirm(null)
        } catch (e) {
            console.error('[Community] 삭제 실패:', e)
            alert('삭제에 실패했습니다.')
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleCardClick = (member) => {
        // 같은 사용자의 모든 프로필 묶기
        const sameUserProfiles = members.filter(m => m.userEmail === member.userEmail)
        setSelected(sameUserProfiles.length > 1 ? sameUserProfiles : member)
        setView('detail')
    }
    const handleStartChat = (room)   => { onChat?.(room); setView('list'); setSelected(null) }

    // 이미 등록된 프로필이 있으면 기존 chatId 잠금
    const existingChatId = myProfiles.length > 0 ? (myProfiles[0]?.chatId || '') : ''

    if (view === 'register') return (
        <Registration
            defaultName={displayName}
            existingChatId={existingChatId}
            disabledRoles={registeredRoles}
            onBack={() => setView('list')}
            onSubmit={handleRegisterSubmit}
        />
    )

    if (view === 'edit' && editingProfile) return (
        <Registration
            defaultName={displayName}
            initialData={editingProfile}
            existingChatId={editingProfile?.chatId || ''}
            isEdit
            onBack={() => { setEditingProfile(null); setView('list') }}
            onSubmit={handleRegisterSubmit}
        />
    )

    if (view === 'detail' && selected) return (
        <CommunityPersonalDetail
            members={Array.isArray(selected) ? selected : [selected]}
            myEmail={userEmail}
            myName={displayName}
            onChat={handleStartChat}
            onBack={() => { setView('list'); setSelected(null) }}
        />
    )

    return (
        <div className="community-page">
            <div className="cm-header">
                <div>
                    <div className="cm-header-tag">COMMUNITY</div>
                    <h1 className="cm-title">커뮤니티</h1>
                    <p className="cm-subtitle">수어 선생님, 통역사, 학습자를 찾아보세요</p>
                </div>
                <button className="cm-register-btn" onClick={handleRegisterClick}>+ 등록하기</button>
            </div>



            {/* ── 삭제 확인 모달 ── */}
            {deleteConfirm && (
                <div className="cm-modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="cm-modal" onClick={e => e.stopPropagation()}>
                        <div className="cm-modal-icon">🗑</div>
                        <div className="cm-modal-title">프로필을 삭제할까요?</div>
                        <div className="cm-modal-desc">삭제하면 커뮤니티 목록에서 사라지며 복구할 수 없습니다.</div>
                        <div className="cm-modal-btns">
                            <button className="cm-modal-cancel" onClick={() => setDeleteConfirm(null)}>취소</button>
                            <button className="cm-modal-confirm" onClick={handleDeleteConfirm} disabled={deleteLoading}>
                                {deleteLoading ? '삭제 중...' : '삭제하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 검색바 ── */}
            <div className="cm-search-bar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                    className="cm-search-input"
                    placeholder="이름, 역할, 지역, 소개 검색..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button className="cm-search-clear" onClick={() => setSearchQuery('')}>✕</button>
                )}
            </div>

            {/* ── 필터 ── */}
            <div className="cm-filters">
                <div className="cm-filter-group">
                    <span className="cm-filter-label">역할</span>
                    {['전체', ...ROLE_OPTIONS].map(r => (
                        <button key={r} className={`cm-filter-btn ${filterRole===r?'active':''}`}
                                onClick={() => setFilterRole(r)}>{r}</button>
                    ))}
                </div>
                <div className="cm-filter-group">
                    <span className="cm-filter-label">지역</span>
                    {['전체', ...REGION_OPTIONS].map(r => (
                        <button key={r} className={`cm-filter-btn ${filterRegion===r?'active':''}`}
                                onClick={() => setFilterRegion(r)}>{r}</button>
                    ))}
                </div>
            </div>

            {/* ── 멤버 목록 ── */}
            <div className="cm-list">
                {listLoading ? (
                    <div className="cm-empty">불러오는 중...</div>
                ) : members.length === 0 ? (
                    <div className="cm-empty">조건에 맞는 멤버가 없습니다.</div>
                ) : members.filter(m =>
                    !searchQuery ||
                    m.name?.includes(searchQuery) ||
                    m.role?.includes(searchQuery) ||
                    m.region?.includes(searchQuery) ||
                    m.intro?.includes(searchQuery)
                ).map((member, idx) => (
                    <div className="cm-card" key={member.id ?? `member-${idx}`}
                         onClick={() => handleCardClick(member)}>
                        <div className="cm-card-avatar">
                            {member.avatar || member.name?.charAt(0) || '?'}
                        </div>
                        <div className="cm-card-info">
                            <div className="cm-card-name">
                                {member.name}
                                {member.chatId && <span className="cm-card-chatid">@{member.chatId}</span>}
                            </div>
                            <div className="cm-card-meta">
                                {member.role   && <span className="cm-role-badge">{member.role}</span>}
                                {member.region && <span className="cm-region-badge">📍 {member.region}</span>}
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