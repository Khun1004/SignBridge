import { useState } from 'react'
import './RegisterPolice.css'

export default function RegisterPolice({ messages = [], onBack }) {
    const [officerName,  setOfficerName]  = useState('')
    const [officerBadge, setOfficerBadge] = useState('')
    const [subjectName,  setSubjectName]  = useState('')
    const [caseType,     setCaseType]     = useState('')
    const [caseNumber,   setCaseNumber]   = useState('')
    const [station,      setStation]      = useState('')
    const [saved,        setSaved]        = useState(false)

    const now = new Date().toLocaleString('ko-KR')
    const signCount  = messages.filter(m => m.type === 'sign').length
    const voiceCount = messages.filter(m => m.type === 'voice').length

    const handleSave = () => {
        if (!officerName.trim()) { alert('담당 경찰관 이름을 입력해 주세요.'); return }
        if (!subjectName.trim()) { alert('대상자 이름을 입력해 주세요.'); return }
        const record = {
            id:           Date.now(),
            type:         'police',
            officerName:  officerName.trim(),
            officerBadge: officerBadge.trim(),
            subjectName:  subjectName.trim(),
            caseType:     caseType.trim(),
            caseNumber:   caseNumber.trim(),
            station:      station.trim(),
            messages,
            savedAt:      now,
        }
        const existing = JSON.parse(localStorage.getItem('signbridge_police') || '[]')
        existing.push(record)
        localStorage.setItem('signbridge_police', JSON.stringify(existing))
        setSaved(true)
    }

    if (saved) return (
        <div className="rpol-page">
            <div className="rpol-success">
                <div className="rpol-success-icon">✅</div>
                <h2 className="rpol-success-title">등록 완료!</h2>
                <p className="rpol-success-desc">경찰서 공식 수어 통역 기록으로 저장되었습니다.</p>
                <button className="rpol-btn-primary" onClick={onBack}>← 대화 기록으로 돌아가기</button>
            </div>
        </div>
    )

    return (
        <div className="rpol-page">

            <div className="rpol-header">
                <button className="rpol-btn-back" onClick={onBack}>← 등록 선택으로 돌아가기</button>
                <div className="rpol-badge">👮 경찰서용</div>
                <h1 className="rpol-title">경찰서 수어 대화 공식 등록</h1>
                <p className="rpol-subtitle">경찰 업무 중 수어 통역 대화 기록을 공식 문서로 등록합니다.</p>
            </div>

            {/* 공문서 스타일 헤더 */}
            <div className="rpol-official-header">
                <div className="rpol-official-logo">👮</div>
                <div>
                    <div className="rpol-official-org">대한민국 경찰청</div>
                    <div className="rpol-official-doc">수어 통역 대화 기록부</div>
                </div>
                <div className="rpol-official-date">{now}</div>
            </div>

            {/* 대화 미리보기 */}
            <div className="rpol-preview">
                <div className="rpol-preview-header">
                    <span className="rpol-preview-title">📋 수어 통역 내용</span>
                    <span className="rpol-preview-meta">총 {messages.length}개
                        &nbsp;<span className="rpol-tag red">수어 {signCount}</span>
                        &nbsp;<span className="rpol-tag blue">음성 {voiceCount}</span>
          </span>
                </div>
                <div className="rpol-preview-list">
                    {messages.length === 0
                        ? <p className="rpol-empty">대화 내용이 없습니다.</p>
                        : messages.map((m, i) => (
                            <div key={i} className={`rpol-msg rpol-msg-${m.type}`}>
                                <span className="rpol-msg-who">{m.type === 'sign' ? '🧏 대상자(수어)' : '👮 경찰관(음성)'}</span>
                                <span className="rpol-msg-text">{m.text}</span>
                                <span className="rpol-msg-time">{m.time}</span>
                            </div>
                        ))
                    }
                </div>
            </div>

            {/* 입력 폼 */}
            <div className="rpol-form">
                <div className="rpol-form-row">
                    <div className="rpol-field">
                        <label className="rpol-label">담당 경찰관 이름 <span className="rpol-required">*</span></label>
                        <input className="rpol-input" placeholder="담당 경찰관 이름" value={officerName} onChange={e => setOfficerName(e.target.value)} />
                    </div>
                    <div className="rpol-field">
                        <label className="rpol-label">경찰관 배지 번호</label>
                        <input className="rpol-input" placeholder="예: 12345" value={officerBadge} onChange={e => setOfficerBadge(e.target.value)} />
                    </div>
                </div>
                <div className="rpol-form-row">
                    <div className="rpol-field">
                        <label className="rpol-label">대상자 이름 <span className="rpol-required">*</span></label>
                        <input className="rpol-input" placeholder="대상자 이름" value={subjectName} onChange={e => setSubjectName(e.target.value)} />
                    </div>
                    <div className="rpol-field">
                        <label className="rpol-label">사건 유형</label>
                        <input className="rpol-input" placeholder="예: 피해신고, 참고인 조사 등" value={caseType} onChange={e => setCaseType(e.target.value)} />
                    </div>
                </div>
                <div className="rpol-form-row">
                    <div className="rpol-field">
                        <label className="rpol-label">사건번호</label>
                        <input className="rpol-input" placeholder="예: 2024-경찰-12345" value={caseNumber} onChange={e => setCaseNumber(e.target.value)} />
                    </div>
                    <div className="rpol-field">
                        <label className="rpol-label">담당 경찰서</label>
                        <input className="rpol-input" placeholder="예: 서울 강남경찰서" value={station} onChange={e => setStation(e.target.value)} />
                    </div>
                </div>
                <button className="rpol-btn-primary" onClick={handleSave}>📄 공식 등록하기</button>
            </div>

        </div>
    )
}