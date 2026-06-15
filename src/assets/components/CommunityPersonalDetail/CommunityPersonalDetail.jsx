import './CommunityPersonalDetail.css'

const CONTACT_LABEL = {
    signbridge: '💬 SignBridge 채팅',
    chat:       '💬 오픈채팅',
    phone:      '📞 전화번호',
    email:      '📧 이메일',
}

export default function CommunityPersonalDetail({ member, onBack, myEmail = '', myName = '', onChat }) {
    if (!member) return null

    const contactType  = member.contactType  || member.contact?.type
    const contactValue = member.contactValue || member.contact?.value

    const handleContact = () => {
        if (contactType === 'phone') window.location.href = `tel:${contactValue}`
        else if (contactType === 'email') window.location.href = `mailto:${contactValue}`
        else if (contactType === 'chat') window.open(contactValue, '_blank')
    }

    // Start a SignBridge chat with this member
    const handleStartChat = async () => {
        try {
            const res = await fetch('/api/chat/rooms/direct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailA:  myEmail,
                    nameA:   myName,
                    emailB:  member.userEmail,
                    nameB:   member.name,
                }),
            })
            if (!res.ok) throw new Error('서버 오류')
            const room = await res.json()
            onChat?.(room)
        } catch (e) {
            alert('채팅방을 만들 수 없습니다. 다시 시도해 주세요.')
        }
    }

    const canChat = myEmail && member.userEmail && myEmail !== member.userEmail

    // Decide if we should show a contact action button (non-signbridge types)
    const hasExternalContact = contactValue && contactType && contactType !== 'signbridge'

    return (
        <div className="cpd-page">
            <button className="cpd-back-btn" onClick={onBack}>← 커뮤니티로</button>

            {/* Profile header */}
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

            {/* Action buttons row — chat + optional external contact */}
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

            {/* 자기소개 */}
            <div className="cpd-section">
                <div className="cpd-section-title">💬 자기소개</div>
                <p className="cpd-text">{member.intro || '자기소개가 없습니다.'}</p>
            </div>

            {/* 경력 */}
            {member.experience && (
                <div className="cpd-section">
                    <div className="cpd-section-title">📌 경력 / 활동 이력</div>
                    <p className="cpd-text">{member.experience}</p>
                </div>
            )}

            {/* 전문 분야 */}
            {member.speciality && (
                <div className="cpd-section">
                    <div className="cpd-section-title">🎯 전문 분야</div>
                    <div className="cpd-speciality-chips">
                        {member.speciality.split(',').map((s,i)=>(
                            <span key={i} className="cpd-chip">{s.trim()}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* 자격증 */}
            {member.certFiles?.length > 0 && (
                <div className="cpd-section">
                    <div className="cpd-section-title">📄 자격증 / 증명서</div>
                    <div className="cpd-cert-list">
                        {member.certFiles.map((f,i)=>(
                            <div key={i} className="cpd-cert-item">
                                <span>{f.name?.includes('.pdf')?'📑':'🖼️'}</span>
                                <span className="cpd-cert-name">{f.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 연락 방법 — shown for non-signbridge types, but action button is now in the top row */}
            {hasExternalContact && (
                <div className="cpd-section">
                    <div className="cpd-section-title">📞 연락 방법</div>
                    <div className="cpd-contact-box">
                        <span>{CONTACT_LABEL[contactType] || '연락처'}</span>
                        <span className="cpd-contact-val">{contactValue}</span>
                    </div>
                    {/* Button also shown here for users not logged in */}
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