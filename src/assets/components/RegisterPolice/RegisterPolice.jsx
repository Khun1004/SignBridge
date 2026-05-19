import { useState } from 'react'
import './RegisterPolice.css'
import { policeApi, conversationApi } from '../../../assets/components/api/api.jsx'

export default function RegisterPolice({
                                           messages    = [],
                                           videos      = [],
                                           onBack,
                                           userEmail   = '',
                                           displayName = '',
                                       }) {
    const [officerName,  setOfficerName]  = useState(displayName || '')
    const [officerBadge, setOfficerBadge] = useState('')
    const [officerRank,  setOfficerRank]  = useState('')
    const [officerDept,  setOfficerDept]  = useState('')
    const [subjectName,  setSubjectName]  = useState('')
    const [subjectRole,  setSubjectRole]  = useState('피해자')
    const [caseType,     setCaseType]     = useState('')
    const [caseNumber,   setCaseNumber]   = useState('')
    const [saved,        setSaved]        = useState(false)
    const [saving,       setSaving]       = useState(false)
    const [error,        setError]        = useState('')
    const [modalUrl,     setModalUrl]     = useState(null)

    const now        = new Date().toLocaleString('ko-KR')
    const signCount  = messages.filter(m => m.type === 'sign').length
    const voiceCount = messages.filter(m => m.type === 'voice').length

    const handleSave = async () => {
        if (!officerName.trim()) { setError('담당 경찰관 이름을 입력해 주세요.'); return }
        if (!subjectName.trim()) { setError('대상자 이름을 입력해 주세요.'); return }

        const uploadingCount = videos.filter(v => v.uploadStatus === 'uploading').length
        if (uploadingCount > 0) {
            setError(`영상 ${uploadingCount}개가 아직 저장 중입니다. 잠시 후 다시 시도해 주세요.`)
            return
        }

        setError(''); setSaving(true)
        try {
            const signs    = messages.filter(m => m.type === 'sign').map(m => m.text)
            const voice    = messages.filter(m => m.type === 'voice').map(m => m.text)
            const videoIds = videos.filter(v => v.serverId).map(v => Number(v.serverId))

            await policeApi.saveRecord({
                userEmail:         userEmail?.trim() || null,
                officerName:       officerName.trim(),
                officerBadge:      officerBadge.trim(),
                officerRank:       officerRank.trim(),
                officerDepartment: officerDept.trim(),
                subjectName:       subjectName.trim(),
                subjectRole:       subjectRole,
                caseType:          caseType.trim(),
                caseNumber:        caseNumber.trim(),
                videoId:           videoIds[0] ?? null,
                extraVideoIds:     videoIds.slice(1),
                signs,
                voice,
            })
            setSaved(true)
        } catch (err) {
            setError('저장 중 오류가 발생했습니다: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    if (saved) return (
        <div className="rpol-page">
            <div className="rpol-success">
                <div className="rpol-success-icon">✅</div>
                <h2 className="rpol-success-title">등록 완료!</h2>
                <p className="rpol-success-desc">
                    경찰서 공식 수어 통역 기록으로 저장되었습니다.
                    {videos.length > 0 && <><br/>영상 {videos.length}개 포함</>}
                </p>
                <button className="rpol-btn-primary" onClick={onBack}>🏠 마이페이지로 가기</button>
            </div>
        </div>
    )

    return (
        <div className="rpol-page">

            <div className="rpol-header">
                <button className="rpol-btn-back" onClick={onBack}>← 마이페이지로 돌아가기</button>
                <div className="rpol-badge">👮 경찰서용</div>
                <h1 className="rpol-title">경찰서 수어 대화 공식 등록</h1>
                <p className="rpol-subtitle">경찰 업무 중 수어 통역 대화 기록을 공식 문서로 등록합니다.</p>
            </div>

            {/* 공문서 헤더 */}
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
                    <span className="rpol-preview-meta">
                        총 {messages.length}개
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

            {/* 영상 목록 */}
            {videos.length > 0 && (
                <div className="rpol-videos">
                    <div className="rpol-videos-header">
                        🎬 녹화 영상
                        <span className="rpol-videos-count">{videos.length}개</span>
                    </div>
                    <div className="rpol-videos-grid">
                        {videos.map((vid, idx) => {
                            const playUrl = vid.localUrl
                                || (vid.serverId ? conversationApi.getVideoUrl(vid.serverId) : null)
                            return (
                                <div key={vid.id} className="rpol-video-card">
                                    <div className="rpol-video-card-top">
                                        <span className="rpol-video-label">영상 {idx + 1}</span>
                                        <span className={`rpol-video-status rpol-video-status-${vid.uploadStatus}`}>
                                            {vid.uploadStatus === 'done'      && '✅ 저장됨'}
                                            {vid.uploadStatus === 'uploading' && '⏳ 저장 중'}
                                            {vid.uploadStatus === 'error'     && '⚠️ 실패'}
                                        </span>
                                    </div>
                                    {playUrl ? (
                                        <video src={playUrl} className="rpol-video-player"
                                               controls playsInline/>
                                    ) : (
                                        <div className="rpol-video-placeholder">
                                            <span>🎬</span><p>준비 중...</p>
                                        </div>
                                    )}
                                    {playUrl && (
                                        <div className="rpol-video-actions">
                                            <button className="rpol-video-btn"
                                                    onClick={() => setModalUrl(playUrl)}>
                                                ▶ 크게 보기
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* 입력 폼 */}
            <div className="rpol-form">
                <div className="rpol-form-row">
                    <div className="rpol-field">
                        <label className="rpol-label">
                            담당 경찰관 이름 <span className="rpol-required">*</span>
                            {displayName && <span className="rpol-autofill-hint">· 자동 입력됨</span>}
                        </label>
                        <input className="rpol-input" placeholder="담당 경찰관 이름"
                               value={officerName} onChange={e => setOfficerName(e.target.value)}/>
                    </div>
                    <div className="rpol-field">
                        <label className="rpol-label">대상자 이름 <span className="rpol-required">*</span></label>
                        <input className="rpol-input" placeholder="대상자 이름"
                               value={subjectName} onChange={e => setSubjectName(e.target.value)}/>
                    </div>
                </div>
                <div className="rpol-form-row">
                    <div className="rpol-field">
                        <label className="rpol-label">계급</label>
                        <input className="rpol-input" placeholder="예: 경장, 경위, 순경"
                               value={officerRank} onChange={e => setOfficerRank(e.target.value)}/>
                    </div>
                    <div className="rpol-field">
                        <label className="rpol-label">소속 부서</label>
                        <input className="rpol-input" placeholder="예: 형사과 1팀"
                               value={officerDept} onChange={e => setOfficerDept(e.target.value)}/>
                    </div>
                </div>
                <div className="rpol-form-row">
                    <div className="rpol-field">
                        <label className="rpol-label">경찰관 배지 번호</label>
                        <input className="rpol-input" placeholder="예: 12-4892"
                               value={officerBadge} onChange={e => setOfficerBadge(e.target.value)}/>
                    </div>
                    <div className="rpol-field">
                        <label className="rpol-label">대상자 역할</label>
                        <select className="rpol-input" value={subjectRole}
                                onChange={e => setSubjectRole(e.target.value)}>
                            <option>피해자</option>
                            <option>참고인</option>
                            <option>피의자</option>
                            <option>신고자</option>
                        </select>
                    </div>
                </div>
                <div className="rpol-form-row">
                    <div className="rpol-field">
                        <label className="rpol-label">사건 유형</label>
                        <input className="rpol-input" placeholder="예: 피해신고, 참고인 조사"
                               value={caseType} onChange={e => setCaseType(e.target.value)}/>
                    </div>
                    <div className="rpol-field">
                        <label className="rpol-label">사건번호</label>
                        <input className="rpol-input" placeholder="예: 2025-강남-4421"
                               value={caseNumber} onChange={e => setCaseNumber(e.target.value)}/>
                    </div>
                </div>

                {error && <p className="rpol-error">⚠️ {error}</p>}

                {videos.some(v => v.uploadStatus === 'uploading') && (
                    <div className="rpol-upload-warn">
                        ⏳ 영상을 서버에 저장 중입니다. 완료 후 등록해 주세요.
                    </div>
                )}

                <button className="rpol-btn-primary" onClick={handleSave}
                        disabled={saving || videos.some(v => v.uploadStatus === 'uploading')}>
                    {saving ? '⏳ 저장 중...' : '📄 공식 등록하기'}
                </button>
            </div>

            {/* 영상 모달 */}
            {modalUrl && (
                <div className="rpol-modal-overlay" onClick={() => setModalUrl(null)}>
                    <div className="rpol-modal" onClick={e => e.stopPropagation()}>
                        <div className="rpol-modal-hd">
                            <span>🎬 영상 재생</span>
                            <button className="rpol-modal-close" onClick={() => setModalUrl(null)}>✕</button>
                        </div>
                        <div className="rpol-modal-body">
                            <video src={modalUrl} controls autoPlay
                                   className="rpol-modal-video" playsInline/>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}