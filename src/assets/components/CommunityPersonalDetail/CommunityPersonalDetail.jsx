import './CommunityPersonalDetail.css'

const CONTACT_LABEL = { chat:'💬 오픈채팅', phone:'📞 전화번호', email:'📧 이메일' }

export default function CommunityPersonalDetail({ member, onBack }) {
    if (!member) return null

    const handleContact = () => {
        if (member.contact?.type === 'chat')  window.open(member.contact.value, '_blank')
        else if (member.contact?.type === 'phone') window.location.href = `tel:${member.contact.value}`
        else if (member.contact?.type === 'email') window.location.href = `mailto:${member.contact.value}`
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
            {member.contact?.value && (
                <div className="cpd-section">
                    <div className="cpd-section-title">📞 연락 방법</div>
                    <div className="cpd-contact-box">
                        <span>{CONTACT_LABEL[member.contact.type] || '연락처'}</span>
                        <span className="cpd-contact-val">{member.contact.value}</span>
                    </div>
                    <button className="cpd-contact-btn" onClick={handleContact}>
                        {member.contact.type==='chat' ? '💬 채팅하기'
                            : member.contact.type==='phone' ? '📞 전화하기'
                                : '📧 이메일 보내기'}
                    </button>
                </div>
            )}
        </div>
    )
}