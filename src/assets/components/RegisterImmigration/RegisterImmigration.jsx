import { useState } from 'react'
import './RegisterImmigration.css'

export default function RegisterImmigration({ messages = [], onBack }) {
    const [officerName,   setOfficerName]   = useState('')
    const [applicantName, setApplicantName] = useState('')
    const [caseNumber,    setCaseNumber]    = useState('')
    const [purpose,       setPurpose]       = useState('')
    const [saved,         setSaved]         = useState(false)

    const now = new Date().toLocaleString('ko-KR')
    const signCount  = messages.filter(m => m.type === 'sign').length
    const voiceCount = messages.filter(m => m.type === 'voice').length

    const handleSave = () => {
        if (!officerName.trim())   { alert('담당 직원 이름을 입력해 주세요.'); return }
        if (!applicantName.trim()) { alert('신청인 이름을 입력해 주세요.'); return }
        const record = {
            id:            Date.now(),
            type:          'immigration',
            officerName:   officerName.trim(),
            applicantName: applicantName.trim(),
            caseNumber:    caseNumber.trim(),
            purpose:       purpose.trim(),
            messages,
            savedAt:       now,
        }
        const existing = JSON.parse(localStorage.getItem('signbridge_immigration') || '[]')
        existing.push(record)
        localStorage.setItem('signbridge_immigration', JSON.stringify(existing))
        setSaved(true)
    }

    if (saved) return (
        <div className="ri-page">
            <div className="ri-success">
                <div className="ri-success-icon">✅</div>
                <h2 className="ri-success-title">등록 완료!</h2>
                <p className="ri-success-desc">출입국외국인사무소 공식 기록으로 저장되었습니다.</p>
                <button className="ri-btn-primary" onClick={onBack}>← 대화 기록으로 돌아가기</button>
            </div>
        </div>
    )

    return (
        <div className="ri-page">

            <div className="ri-header">
                <button className="ri-btn-back" onClick={onBack}>← 등록 선택으로 돌아가기</button>
                <div className="ri-badge">🛂 출입국외국인사무소용</div>
                <h1 className="ri-title">출입국 수어 대화 공식 등록</h1>
                <p className="ri-subtitle">출입국 업무 시 수어 통역 대화 기록을 공식 문서로 등록합니다.</p>
            </div>

            {/* 공문서 스타일 헤더 */}
            <div className="ri-official-header">
                <div className="ri-official-logo">🛂</div>
                <div>
                    <div className="ri-official-org">출입국·외국인사무소</div>
                    <div className="ri-official-doc">수어 통역 대화 기록지</div>
                </div>
                <div className="ri-official-date">{now}</div>
            </div>

            {/* 대화 미리보기 */}
            <div className="ri-preview">
                <div className="ri-preview-header">
                    <span className="ri-preview-title">📋 대화 내용</span>
                    <span className="ri-preview-meta">총 {messages.length}개
                        &nbsp;<span className="ri-tag purple">수어 {signCount}</span>
                        &nbsp;<span className="ri-tag blue">음성 {voiceCount}</span>
          </span>
                </div>
                <div className="ri-preview-list">
                    {messages.length === 0
                        ? <p className="ri-empty">대화 내용이 없습니다.</p>
                        : messages.map((m, i) => (
                            <div key={i} className={`ri-msg ri-msg-${m.type}`}>
                                <span className="ri-msg-who">{m.type === 'sign' ? '🧏 신청인(수어)' : '🙋 직원(음성)'}</span>
                                <span className="ri-msg-text">{m.text}</span>
                                <span className="ri-msg-time">{m.time}</span>
                            </div>
                        ))
                    }
                </div>
            </div>

            {/* 입력 폼 */}
            <div className="ri-form">
                <div className="ri-form-row">
                    <div className="ri-field">
                        <label className="ri-label">담당 직원 이름 <span className="ri-required">*</span></label>
                        <input className="ri-input" placeholder="담당 직원 이름" value={officerName} onChange={e => setOfficerName(e.target.value)} />
                    </div>
                    <div className="ri-field">
                        <label className="ri-label">신청인 이름 <span className="ri-required">*</span></label>
                        <input className="ri-input" placeholder="신청인 이름" value={applicantName} onChange={e => setApplicantName(e.target.value)} />
                    </div>
                </div>
                <div className="ri-form-row">
                    <div className="ri-field">
                        <label className="ri-label">사건번호 / 접수번호</label>
                        <input className="ri-input" placeholder="예: 2024-12345" value={caseNumber} onChange={e => setCaseNumber(e.target.value)} />
                    </div>
                    <div className="ri-field">
                        <label className="ri-label">방문 목적</label>
                        <input className="ri-input" placeholder="예: 체류연장, 귀화신청 등" value={purpose} onChange={e => setPurpose(e.target.value)} />
                    </div>
                </div>
                <button className="ri-btn-primary" onClick={handleSave}>📄 공식 등록하기</button>
            </div>

        </div>
    )
}