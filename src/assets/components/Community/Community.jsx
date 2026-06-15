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
    myProfile = null,
    onProfileSave,
    onProfileDelete,
    onChat,
}) {
    const [view,          setView]         = useState('list')
    const [members,       setMembers]      = useState([])
    const [listLoading,   setListLoading]  = useState(false)
    const [selected,      setSelected]     = useState(null)  // currently viewing post
    const [editingPost,   setEditingPost]  = useState(null)  // post being edited
    const [filterRole,    setFilterRole]   = useState('전체')
    const [filterRegion,  setFilterRegion] = useState('전체')
    const [deleteConfirm, setDeleteConfirm]= useState(false)
    const [deleteLoading, setDeleteLoading]= useState(false)

    const loadMembers = async (role = '', region = '') => {
        setListLoading(true)
        try {
            const params = {}
            if (role   && role   !== '전체') params.role   = role
            if (region && region !== '전체') params.region = region
            const data = await communityApi.getMembers(params)
            setMembers(Array.isArray(data) ? data : [])
        } catch (e) {
            setMembers([])
        } finally {
            setListLoading(false)
        }
    }

    useEffect(() => { loadMembers(filterRole, filterRegion) }, [filterRole, filterRegion])

    // ── Register — always creates NEW post ───────────────
    const handleRegisterClick = () => {
        if (!userEmail) {
            alert('등록하려면 먼저 로그인 해야 합니다.')
            onLoginRequired?.()
            return
        }
        setEditingPost(null)  // new post, no pre-fill
        setView('register')
    }

    // Get this user's existing chatId from the member list
    const myExistingChatId = members.find(m => m.userEmail === userEmail)?.chatId || ''

    // ── Edit specific post ────────────────────────────────
    const handleEditPost = (post) => {
        setView('edit')
    // ── Submit (create or update) ─────────────────────────
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

            let saved
            if (editingPost?.id) {
                // Update existing post via PUT
                const res = await fetch(`/api/community/members/${editingPost.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                })
                saved = await res.json()
            } else {
                // Create new post via POST
                saved = await communityApi.save(body)
            }

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
            alert('등록에 실패했습니다. 다시 시도해 주세요.')
        }
        setEditingProfile(null)
        setView('list')
        setEditingPost(null)
    }

    // ── Delete specific post ──────────────────────────────
    const handleDeleteConfirm = async () => {
        if (!selected?.id) return
        setDeleteLoading(true)
        try {
            const res = await fetch(
                `/api/community/members/${selected.id}?email=${encodeURIComponent(userEmail)}`,
                { method: 'DELETE' }
            )
            if (!res.ok) throw new Error('삭제 실패')
            // If deleted post was the "myProfile", notify App.jsx
            if (myProfile?.id === selected.id) onProfileDelete?.()
            await loadMembers(filterRole, filterRegion)
            setDeleteConfirm(false)
            setView('list')
            setSelected(null)
        } catch (e) {
            alert('삭제에 실패했습니다. 다시 시도해 주세요.')
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleCardClick = (member) => { setSelected(member); setView('detail') }
    const handleStartChat = (room)   => { onChat?.(room); setView('list'); setSelected(null) }

    // ── Views ─────────────────────────────────────────────
    if (view === 'register') {
        return (
            <Registration
                defaultName={displayName}
                existingChatId={myExistingChatId}
                onBack={() => setView('list')}
                onSubmit={handleRegisterSubmit}
            />
        )
    }

    if (view === 'edit' && editingPost) {
        return (
            <Registration
                defaultName={displayName}
                initialData={editingPost}
                existingChatId={editingPost?.chatId || ''}
                isEdit
                onBack={() => { setView('detail'); }}
                onSubmit={handleRegisterSubmit}
            />
        )
    }

    if (view === 'detail' && selected) {
        const isMyPost = selected.userEmail === userEmail
        return (
            <>
                <CommunityPersonalDetail
                    member={selected}
                    myEmail={userEmail}
                    myName={displayName}
                    onChat={handleStartChat}
                    onBack={() => { setView('list'); setSelected(null) }}
                    isMyProfile={isMyPost}
                    onEdit={() => handleEditPost(selected)}
                    onDelete={() => setDeleteConfirm(true)}
                />
                {deleteConfirm && (
                    <div className="cm-modal-overlay" onClick={() => setDeleteConfirm(false)}>
                        <div className="cm-modal" onClick={e => e.stopPropagation()}>
                            <div className="cm-modal-icon">🗑</div>
                            <div className="cm-modal-title">이 게시물을 삭제할까요?</div>
                            <div className="cm-modal-desc">삭제하면 목록에서 사라지며 복구할 수 없습니다.</div>
                            <div className="cm-modal-btns">
                                <button className="cm-modal-cancel" onClick={() => setDeleteConfirm(false)}>취소</button>
                                <button className="cm-modal-confirm" onClick={handleDeleteConfirm} disabled={deleteLoading}>
                                    {deleteLoading ? '삭제 중...' : '삭제하기'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )
    }

    // ── List view ─────────────────────────────────────────
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

            <div className="cm-list">
                {listLoading ? (
                    <div className="cm-empty">불러오는 중...</div>
                ) : members.length === 0 ? (
                    <div className="cm-empty">조건에 맞는 멤버가 없습니다.</div>
                ) : members.map(member => (
                    <div className="cm-card" key={member.id} onClick={() => handleCardClick(member)}>
                        <div className="cm-card-avatar">{member.avatar}</div>
                        <div className="cm-card-info">
                            <div className="cm-card-name">
                                {member.name}
                                {member.chatId && <span className="cm-card-chatid"> @{member.chatId}</span>}
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