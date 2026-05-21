import './CommunityPersonalDetail.css'

const CONTACT_LABEL = { chat:'💬 오픈채팅', phone:'📞 전화번호', email:'📧 이메일' }

export default function CommunityPersonalDetail({ member, onBack, myEmail = '', myName = '', onChat }) {
    if (!member) return null

    // 서버: contactType/contactValue, 프론트 상태: contact.type/contact.value 둘 다 지원
    const contactType  = member.contactType  || member.contact?.type
    const contactValue = member.contactValue || member.contact?.value

    const handleContact = () => {
        if (contactType === 'chat')  window.open(contactValue, '_blank')
        else if (contactType === 'phone') window.location.href = `tel:${contactValue}`
        else if (contactType === 'email') window.location.href = `mailto:${contactValue}`
    }

    return (
        <div className="cpd-page">
            {/* 뒤로가기 */}
            <button className="cpd-back-btn" onClick={onBack}>← 커뮤니티로</button>

            {/* 프로필 헤더 */}
            <div className="cpd-hero">
                <div className="cpd-avatar">{member.avatar || member.name?.charAt(0)}</div>
                <div className="cpd-hero-info">
                    <h1 className="cpd-name">{member.name}</h1>
                    <div className="cpd-badges">
                        <span className="cpd-role-badge">{member.role}</span>
                        <span className="cpd-region-badge">📍 {member.region}</span>
                        {member.publicProfile === false && (
                            <span className="cpd-private-badge">🔒 비공개</span>
                        )}
                    </div>
                </div>
            </div>

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

            {/* 연락하기 */}
            {/* 채팅하기 버튼 — 로그인된 사용자만 */}
            {myEmail && myEmail !== member.userEmail && (
                <button className="cpd-chat-btn" onClick={async () => {
                    try {
                        const res = await fetch('/api/chat/rooms', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userA: myEmail, userAName: myName,
                                userB: member.userEmail || member.name,
                                userBName: member.name,
                            })
                        })
                        const room = await res.json()
                        onChat?.(room.roomId, member.name)
                    } catch(e) {
                        alert('채팅방을 만들 수 없습니다.')
                    }
                }}>
                    💬 {member.name}님과 채팅하기
                </button>
            )}

            {contactValue && (
                <div className="cpd-section">
                    <div className="cpd-section-title">📞 연락 방법</div>
                    <div className="cpd-contact-box">
                        <span>{CONTACT_LABEL[contactType] || '연락처'}</span>
                        <span className="cpd-contact-val">{contactValue}</span>
                    </div>
                    <button className="cpd-contact-btn" onClick={handleContact}>
                        {contactType==='chat'  ? '💬 채팅하기'
                            : contactType==='phone' ? '📞 전화하기'
                                : '📧 이메일 보내기'}
                    </button>
                </div>
            )}
        </div>
    )
}