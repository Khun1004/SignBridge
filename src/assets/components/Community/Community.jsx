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
    const [view,          setView]          = useState('list')
    const [members,       setMembers]       = useState([])
    const [listLoading,   setListLoading]   = useState(false)
    const [selected,      setSelected]      = useState(null)
    const [filterRole,    setFilterRole]    = useState('전체')
    const [filterRegion,  setFilterRegion]  = useState('전체')
    const [deleteConfirm, setDeleteConfirm] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)

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

    const handleRegisterClick = () => {
        if (!userEmail) {
            alert('등록하려면 먼저 로그인 해야 합니다.')
            onLoginRequired?.()
            return
        }
        setView('register')
    }

    const handleEditClick = () => setView('edit')

    const handleRegisterSubmit = async (form) => {
        try {
            const certFileNames = (form.certFiles || []).map(f => f.name || f)
            const body = {
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
                certFileNames,
            }
            const saved = await communityApi.save(body)
            const profileData = {
                ...saved,
                contact: { type: saved.contactType, value: saved.contactValue },
                avatar:  saved.name?.charAt(0) || '?',
            }
            onProfileSave?.(profileData)
            await loadMembers(filterRole, filterRegion)
        } catch (e) {
            console.error('[Community] 등록 실패:', e)
            alert('등록에 실패했습니다. 다시 시도해 주세요.')
        }
        setView('list')
    }

    const handleDeleteConfirm = async () => {
        setDeleteLoading(true)
        try {
            await communityApi.delete(userEmail)
            onProfileDelete?.()
            await loadMembers(filterRole, filterRegion)
            setDeleteConfirm(false)
        } catch (e) {
            console.error('[Community] 삭제 실패:', e)
            alert('삭제에 실패했습니다. 다시 시도해 주세요.')
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleCardClick  = (member) => { setSelected(member); setView('detail') }
    const handleStartChat  = (room)   => { onChat?.(room); setView('list'); setSelected(null) }

    if (view === 'register') return (
        <Registration
            defaultName={displayName}
            existingChatId={''}
            onBack={() => setView('list')}
            onSubmit={handleRegisterSubmit}
        />
    )

    if (view === 'edit') return (
        <Registration
            defaultName={displayName}
            initialData={myProfile}
            existingChatId={myProfile?.chatId || ''}
            isEdit
            onBack={() => setView('list')}
            onSubmit={handleRegisterSubmit}
        />
    )

    if (view === 'detail' && selected) return (
        <CommunityPersonalDetail
            member={selected}
            myEmail={userEmail}
            myName={displayName}
            onChat={handleStartChat}
            onBack={() => { setView('list'); setSelected(null) }}
        />
    )

    return (
        <div className="community-page">

            {/* ── Header ── */}
            <div className="cm-header">
                <div>
                    <div className="cm-header-tag">COMMUNITY</div>
                    <h1 className="cm-title">커뮤니티</h1>
                    <p className="cm-subtitle">수어 선생님, 통역사, 학습자를 찾아보세요</p>
                </div>
                {!myProfile && (
                    <button className="cm-register-btn" onClick={handleRegisterClick}>
                        + 등록하기
                    </button>
                )}
            </div>

            {/* ── 내 프로필 배너 ── */}
            {myProfile && (
                <div className="cm-my-banner">
                    {/* 상단: 아바타 + 정보 + 버튼 */}
                    <div className="cm-my-banner-top">
                        <div className="cm-my-banner-avatar">{myProfile.avatar}</div>
                        <div className="cm-my-banner-info">
                            <div className="cm-my-banner-label">내 커뮤니티 프로필</div>
                            <div className="cm-my-banner-name">
                                {myProfile.name}
                                {myProfile.chatId && (
                                    <span className="cm-my-banner-chatid">@{myProfile.chatId}</span>
                                )}
                            </div>
                            <div className="cm-my-banner-meta">
                                <span className="cm-role-badge">{myProfile.role}</span>
                                <span className="cm-region-badge">📍 {myProfile.region}</span>
                            </div>
                        </div>
                        <div className="cm-my-banner-actions">
                            <button className="cm-edit-btn" onClick={handleEditClick}>✏️ 수정</button>
                            <button className="cm-delete-btn" onClick={() => setDeleteConfirm(true)}>🗑 삭제</button>
                        </div>
                    </div>
                    {/* 하단: 자기소개 */}
                    {myProfile.intro && (
                        <div className="cm-my-banner-intro">{myProfile.intro}</div>
                    )}
                </div>
            )}

            {/* ── 삭제 확인 모달 ── */}
            {deleteConfirm && (
                <div className="cm-modal-overlay" onClick={() => setDeleteConfirm(false)}>
                    <div className="cm-modal" onClick={e => e.stopPropagation()}>
                        <div className="cm-modal-icon">🗑</div>
                        <div className="cm-modal-title">프로필을 삭제할까요?</div>
                        <div className="cm-modal-desc">삭제하면 커뮤니티 목록에서 사라지며 복구할 수 없습니다.</div>
                        <div className="cm-modal-btns">
                            <button className="cm-modal-cancel" onClick={() => setDeleteConfirm(false)}>취소</button>
                            <button className="cm-modal-confirm" onClick={handleDeleteConfirm} disabled={deleteLoading}>
                                {deleteLoading ? '삭제 중...' : '삭제하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 필터 ── */}
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

            {/* ── 멤버 목록 ── */}
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
                            <div className="cm-card-name">
                                {member.name}
                                {member.chatId && (
                                    <span className="cm-card-chatid">@{member.chatId}</span>
                                )}
                            </div>
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