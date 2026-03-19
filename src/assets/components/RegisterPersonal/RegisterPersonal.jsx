import { useState } from 'react'
import './RegisterPersonal.css'

export default function RegisterPersonal({ messages = [], onBack }) {
    const [name,    setName]    = useState('')
    const [memo,    setMemo]    = useState('')
    const [saved,   setSaved]   = useState(false)

    const now = new Date().toLocaleString('ko-KR')
    const signCount  = messages.filter(m => m.type === 'sign').length
    const voiceCount = messages.filter(m => m.type === 'voice').length

    const handleSave = () => {
        if (!name.trim()) { alert('이름을 입력해 주세요.'); return }
        // 실제 저장 로직 (로컬스토리지 등)
        const record = {
            id:        Date.now(),
            type:      'personal',
            name:      name.trim(),
            memo:      memo.trim(),
            messages,
            savedAt:   now,
        }
        const existing = JSON.parse(localStorage.getItem('signbridge_personal') || '[]')
        existing.push(record)
        localStorage.setItem('signbridge_personal', JSON.stringify(existing))
        setSaved(true)
    }

    if (saved) return (
        <div className="rp-page">
            <div className="rp-success">
                <div className="rp-success-icon">✅</div>
                <h2 className="rp-success-title">등록 완료!</h2>
                <p className="rp-success-desc">개인 대화 기록이 저장되었습니다.</p>
                <button className="rp-btn-primary" onClick={onBack}>← 대화 기록으로 돌아가기</button>
            </div>
        </div>
    )

    return (
        <div className="rp-page">

            <div className="rp-header">
                <button className="rp-btn-back" onClick={onBack}>← 등록 선택으로 돌아가기</button>
                <div className="rp-badge" style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.2)' }}>
                    👤 개인용
                </div>
                <h1 className="rp-title">개인 대화 기록 등록</h1>
                <p className="rp-subtitle">대화 기록을 개인 저장소에 등록합니다.</p>
            </div>

            {/* 대화 미리보기 */}
            <div className="rp-preview">
                <div className="rp-preview-header">
                    <span className="rp-preview-title">📋 대화 내용 요약</span>
                    <span className="rp-preview-meta">{now} · 총 {messages.length}개
                        &nbsp;<span className="rp-tag blue">수어 {signCount}</span>
                        &nbsp;<span className="rp-tag green">음성 {voiceCount}</span>
          </span>
                </div>
                <div className="rp-preview-list">
                    {messages.length === 0
                        ? <p className="rp-empty">대화 내용이 없습니다.</p>
                        : messages.map((m, i) => (
                            <div key={i} className={`rp-msg rp-msg-${m.type}`}>
                                <span className="rp-msg-who">{m.type === 'sign' ? '🧏 수어' : '🙋 음성'}</span>
                                <span className="rp-msg-text">{m.text}</span>
                                <span className="rp-msg-time">{m.time}</span>
                            </div>
                        ))
                    }
                </div>
            </div>

            {/* 입력 폼 */}
            <div className="rp-form">
                <div className="rp-field">
                    <label className="rp-label">이름 <span className="rp-required">*</span></label>
                    <input
                        className="rp-input"
                        placeholder="본인 이름을 입력하세요"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </div>
                <div className="rp-field">
                    <label className="rp-label">메모</label>
                    <textarea
                        className="rp-textarea"
                        placeholder="대화에 대한 메모를 입력하세요 (선택)"
                        value={memo}
                        onChange={e => setMemo(e.target.value)}
                        rows={3}
                    />
                </div>
                <button className="rp-btn-primary" onClick={handleSave}>💾 등록하기</button>
            </div>

        </div>
    )
}