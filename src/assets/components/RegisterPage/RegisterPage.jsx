import './RegisterPage.css'

const REGISTER_TYPES = [
    {
        id: 'personal',
        icon: '👤',
        title: '개인용',
        desc: '개인 대화 기록을 저장하고 관리합니다. 일상적인 수어 소통 내용을 기록합니다.',
        color: '#2563eb',
        bg: 'rgba(37,99,235,0.06)',
        border: 'rgba(37,99,235,0.2)',
    },
    {
        id: 'immigration',
        icon: '🛂',
        title: '출입국외국인사무소용',
        desc: '출입국 업무 시 필요한 수어 대화를 공식 양식으로 등록합니다.',
        color: '#7c3aed',
        bg: 'rgba(124,58,237,0.06)',
        border: 'rgba(124,58,237,0.2)',
    },
    {
        id: 'police',
        icon: '👮',
        title: '경찰서용',
        desc: '경찰 업무 시 수어 대화 기록을 공식 문서로 등록합니다.',
        color: '#dc2626',
        bg: 'rgba(220,38,38,0.06)',
        border: 'rgba(220,38,38,0.2)',
    },
]

export default function RegisterPage({ messages = [], onBack, onSelect }) {
    return (
        <div className="reg-page">

            <div className="reg-header">
                <button className="reg-btn-back" onClick={onBack}>← 대화 기록으로 돌아가기</button>
                <div className="reg-title-wrap">
                    <h1 className="reg-title">📋 등록하기</h1>
                    <p className="reg-subtitle">등록 용도를 선택해 주세요</p>
                </div>
            </div>

            <div className="reg-cards">
                {REGISTER_TYPES.map(type => (
                    <button
                        key={type.id}
                        className="reg-card"
                        style={{
                            '--card-color':  type.color,
                            '--card-bg':     type.bg,
                            '--card-border': type.border,
                        }}
                        onClick={() => onSelect(type.id)}
                    >
                        <div className="reg-card-icon">{type.icon}</div>
                        <div className="reg-card-title">{type.title}</div>
                        <div className="reg-card-desc">{type.desc}</div>
                        <div className="reg-card-arrow">→</div>
                    </button>
                ))}
            </div>

            <p className="reg-note">
                총 <strong>{messages.length}개</strong>의 대화 내용이 선택한 양식으로 등록됩니다.
            </p>

        </div>
    )
}