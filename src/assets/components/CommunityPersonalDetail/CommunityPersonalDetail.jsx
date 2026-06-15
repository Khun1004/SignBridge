// CommunityPersonalDetail.jsx
import { useState } from 'react'
import './CommunityPersonalDetail.css'

const CONTACT_LABEL = {
    signbridge: '💬 SignBridge 채팅',
    chat:       '💬 오픈채팅',
    phone:      '📞 전화번호',
    email:      '📧 이메일',
}

export default function CommunityPersonalDetail({ members = [], onBack, myEmail = '', myName = '', onChat }) {
    const [activeIdx, setActiveIdx] = useState(0)

    if (!members || members.length === 0) return null

    const member = members[activeIdx]

    const contactType  = member.contactType  || member.contact?.type
    const contactValue = member.contactValue || member.contact?.value

    const handleContact = () => {
        if (contactType === 'phone') window.location.href = `tel:${contactValue}`
        else if (contactType === 'email') window.location.href = `mailto:${contactValue}`
        else if (contactType === 'chat') window.open(contactValue, '_blank')
    }

    const handleStartChat = async () => {
        if (!myEmail || !member.userEmail) {
            alert('사용자 정보가 없습니다. 다시 로그인해 주세요.')
            return
        }
        try {
            const res = await fetch('/api/chat/rooms/direct', {  // ✅ 프록시 경유, /rooms/direct 전용 엔드포인트
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailA:  myEmail,
                    nameA:   myName,
                    emailB:  member.userEmail,
                    nameB:   member.name,
                    avatarB: (member.avatar?.length > 2) ? member.avatar : '',
                }),
            })
            if (!res.ok) {
                const errText = await res.text()
                console.error('[채팅시작] 서버 오류:', res.status, errText)
                alert('채팅방을 만들 수 없습니다.')
                return
            }
            const room = await res.json()
            onChat?.(room)
        } catch (e) {
            console.error('[채팅시작]', e)
            alert('채팅방을 만들 수 없습니다. 다시 시도해 주세요.')
        }
    }

    const canChat = myEmail && member.userEmail && myEmail !== member.userEmail
    const hasExternalContact = contactValue && contactType && contactType !== 'signbridge'

    return (
        <div className="cpd-page">
            <button className="cpd-back-btn" onClick={onBack}>← 커뮤니티로</button>

            {/* ── 프로필 헤더 ── */}
            <div className="cpd-hero">
                <div className="cpd-avatar">{member.avatar || member.name?.charAt(0)}</div>
                <div className="cpd-hero-info">
                    <h1 className="cpd-name">{member.name}</h1>
                    <div className="cpd-badges">
                        {member.chatId && (
                            <span className="cpd-chatid-badge">@{member.chatId}</span>
                        )}
                        <span className="cpd-role-badge">{member.role}</span>
                        <span className="cpd-region-badge">📍 {member.region}</span>
                        {member.publicProfile === false && (
                            <span className="cpd-private-badge">🔒 비공개</span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── 역할 탭 (프로필 2개 이상일 때) ── */}
            {members.length > 1 && (
                <div className="cpd-role-tabs">
                    {members.map((m, i) => (
                        <button
                            key={m.id ?? i}
                            className={`cpd-role-tab ${activeIdx === i ? 'active' : ''}`}
                            onClick={() => setActiveIdx(i)}
                        >
                            {m.role}
                            {m.region && <span className="cpd-role-tab-region">📍{m.region}</span>}
                        </button>
                    ))}
                </div>
            )}

            {/* ── 액션 버튼 ── */}
            {canChat && (
                <div className="cpd-action-row">
                    <button className="cpd-chat-btn" onClick={handleStartChat}>
                        💬 채팅하기
                    </button>
                    {hasExternalContact && (
                        <button className="cpd-contact-btn-inline" onClick={handleContact}>
                            {contactType === 'phone' ? '📞 전화하기' : '📧 이메일 보내기'}
                        </button>
                    )}
                </div>
            )}
            {!myEmail && (
                <div className="cpd-login-hint">
                    채팅을 시작하려면 로그인이 필요합니다.
                </div>
            )}

            {/* ── 자기소개 ── */}
            <div className="cpd-section">
                <div className="cpd-section-title">💬 자기소개</div>
                <p className="cpd-text">{member.intro || '자기소개가 없습니다.'}</p>
            </div>

            {member.experience && (
                <div className="cpd-section">
                    <div className="cpd-section-title">📌 경력 / 활동 이력</div>
                    <p className="cpd-text">{member.experience}</p>
                </div>
            )}

            {member.speciality && (
                <div className="cpd-section">
                    <div className="cpd-section-title">🎯 전문 분야</div>
                    <div className="cpd-speciality-chips">
                        {member.speciality.split(',').map((s, i) => (
                            <span key={i} className="cpd-chip">{s.trim()}</span>
                        ))}
                    </div>
                </div>
            )}

            {member.certFiles?.length > 0 && (
                <div className="cpd-section">
                    <div className="cpd-section-title">📄 자격증 / 증명서</div>
                    <div className="cpd-cert-list">
                        {member.certFiles.map((f, i) => (
                            <div key={i} className="cpd-cert-item">
                                <span>{f.name?.includes('.pdf') ? '📑' : '🖼️'}</span>
                                <span className="cpd-cert-name">{f.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {hasExternalContact && (
                <div className="cpd-section">
                    <div className="cpd-section-title">📞 연락 방법</div>
                    <div className="cpd-contact-box">
                        <span>{CONTACT_LABEL[contactType] || '연락처'}</span>
                        <span className="cpd-contact-val">{contactValue}</span>
                    </div>
                    {!canChat && (
                        <button className="cpd-contact-btn" onClick={handleContact}>
                            {contactType === 'phone' ? '📞 전화하기' : '📧 이메일 보내기'}
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}