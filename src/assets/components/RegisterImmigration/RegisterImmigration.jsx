import { useState } from 'react'
import './RegisterImmigration.css'
import { immigrationApi, conversationApi } from '../../../assets/components/api/api.jsx'

export default function RegisterImmigration({
                                                messages    = [],
                                                videos      = [],
                                                onBack,
                                                userEmail   = '',
                                                displayName = '',
                                            }) {
    const [officerName,   setOfficerName]   = useState(displayName || '')
    const [applicantName, setApplicantName] = useState('')
    const [caseNumber,    setCaseNumber]    = useState('')
    const [purpose,       setPurpose]       = useState('')
    const [saved,         setSaved]         = useState(false)
    const [saving,        setSaving]        = useState(false)
    const [error,         setError]         = useState('')

    // 영상 모달
    const [modalUrl, setModalUrl] = useState(null)

    const now        = new Date().toLocaleString('ko-KR')
    const signCount  = messages.filter(m => m.type === 'sign').length
    const voiceCount = messages.filter(m => m.type === 'voice').length

    const handleSave = async () => {
        if (!officerName.trim())   { setError('담당 직원 이름을 입력해 주세요.'); return }
        if (!applicantName.trim()) { setError('신청인 이름을 입력해 주세요.'); return }

        // 업로드 중인 영상 확인
        const uploadingCount = videos.filter(v => v.uploadStatus === 'uploading').length
        if (uploadingCount > 0) {
            setError(`영상 ${uploadingCount}개가 아직 저장 중입니다. 잠시 후 다시 시도해 주세요.`)
            return
        }

        setSaving(true); setError('')
        try {
            const signs    = messages.filter(m => m.type === 'sign').map(m => m.text)
            const voice    = messages.filter(m => m.type === 'voice').map(m => m.text)
            const videoIds = videos.filter(v => v.serverId).map(v => Number(v.serverId))

            await immigrationApi.saveRecord({
                userEmail:     userEmail?.trim() || null,
                officerName:   officerName.trim(),
                applicantName: applicantName.trim(),
                caseNumber:    caseNumber.trim(),
                purpose:       purpose.trim(),
                videoId:       videoIds[0] ?? null,
                extraVideoIds: videoIds.slice(1),
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
        <div className="ri-page">
            <div className="ri-success">
                <div className="ri-success-icon">✅</div>
                <h2 className="ri-success-title">등록 완료!</h2>
                <p className="ri-success-desc">
                    출입국외국인사무소 공식 기록으로 저장되었습니다.
                    {videos.length > 0 && <><br/>영상 {videos.length}개 포함</>}
                </p>
                <button className="ri-btn-primary" onClick={onBack}>🏠 마이페이지로 가기</button>
            </div>
        </div>
    )

    return (
        <div className="ri-page">

            {/* ── 헤더 ── */}
            <div className="ri-header">
                <button className="ri-btn-back" onClick={onBack}>← 마이페이지로 돌아가기</button>
                <div className="ri-badge">🛂 출입국외국인사무소용</div>
                <h1 className="ri-title">출입국 수어 대화 공식 등록</h1>
                <p className="ri-subtitle">출입국 업무 시 수어 통역 대화 기록을 공식 문서로 등록합니다.</p>
            </div>

            {/* ── 공문서 헤더 ── */}
            <div className="ri-official-header">
                <div className="ri-official-logo">🛂</div>
                <div>
                    <div className="ri-official-org">출입국·외국인사무소</div>
                    <div className="ri-official-doc">수어 통역 대화 기록지</div>
                </div>
                <div className="ri-official-date">{now}</div>
            </div>

            {/* ── 대화 미리보기 ── */}
            <div className="ri-preview">
                <div className="ri-preview-header">
                    <span className="ri-preview-title">📋 대화 내용</span>
                    <span className="ri-preview-meta">
                        총 {messages.length}개
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

            {/* ── 영상 목록 ── */}
            {videos.length > 0 && (
                <div className="ri-videos">
                    <div className="ri-videos-header">
                        🎬 녹화 영상
                        <span className="ri-videos-count">{videos.length}개</span>
                    </div>
                    <div className="ri-videos-grid">
                        {videos.map((vid, idx) => {
                            const playUrl = vid.localUrl
                                || (vid.serverId ? conversationApi.getVideoUrl(vid.serverId) : null)
                            return (
                                <div key={vid.id} className="ri-video-card">
                                    <div className="ri-video-card-top">
                                        <span className="ri-video-label">영상 {idx + 1}</span>
                                        <span className={`ri-video-status ri-video-status-${vid.uploadStatus}`}>
                                            {vid.uploadStatus === 'done'      && '✅ 저장됨'}
                                            {vid.uploadStatus === 'uploading' && '⏳ 저장 중'}
                                            {vid.uploadStatus === 'error'     && '⚠️ 실패'}
                                        </span>
                                    </div>
                                    {playUrl ? (
                                        <video src={playUrl} className="ri-video-player"
                                               controls playsInline/>
                                    ) : (
                                        <div className="ri-video-placeholder">
                                            <span>🎬</span><p>준비 중...</p>
                                        </div>
                                    )}
                                    {playUrl && (
                                        <div className="ri-video-actions">
                                            <button className="ri-video-btn"
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

            {/* ── 입력 폼 ── */}
            <div className="ri-form">
                <div className="ri-form-row">
                    <div className="ri-field">
                        <label className="ri-label">
                            담당 직원 이름 <span className="ri-required">*</span>
                            {displayName && <span className="ri-autofill-hint">· 자동 입력됨</span>}
                        </label>
                        <input className="ri-input" placeholder="담당 직원 이름"
                               value={officerName} onChange={e => setOfficerName(e.target.value)}/>
                    </div>
                    <div className="ri-field">
                        <label className="ri-label">신청인 이름 <span className="ri-required">*</span></label>
                        <input className="ri-input" placeholder="신청인 이름"
                               value={applicantName} onChange={e => setApplicantName(e.target.value)}/>
                    </div>
                </div>
                <div className="ri-form-row">
                    <div className="ri-field">
                        <label className="ri-label">사건번호 / 접수번호</label>
                        <input className="ri-input" placeholder="예: 2024-12345"
                               value={caseNumber} onChange={e => setCaseNumber(e.target.value)}/>
                    </div>
                    <div className="ri-field">
                        <label className="ri-label">방문 목적</label>
                        <input className="ri-input" placeholder="예: 체류연장, 귀화신청 등"
                               value={purpose} onChange={e => setPurpose(e.target.value)}/>
                    </div>
                </div>

                {error && <p className="ri-error">⚠️ {error}</p>}

                {videos.some(v => v.uploadStatus === 'uploading') && (
                    <div className="ri-upload-warn">
                        ⏳ 영상을 서버에 저장 중입니다. 완료 후 등록해 주세요.
                    </div>
                )}

                <button className="ri-btn-primary" onClick={handleSave}
                        disabled={saving || videos.some(v => v.uploadStatus === 'uploading')}>
                    {saving ? '⏳ 저장 중...' : '📄 공식 등록하기'}
                </button>
            </div>

            {/* ── 영상 모달 ── */}
            {modalUrl && (
                <div className="ri-modal-overlay" onClick={() => setModalUrl(null)}>
                    <div className="ri-modal" onClick={e => e.stopPropagation()}>
                        <div className="ri-modal-hd">
                            <span>🎬 영상 재생</span>
                            <button className="ri-modal-close" onClick={() => setModalUrl(null)}>✕</button>
                        </div>
                        <div className="ri-modal-body">
                            <video src={modalUrl} controls autoPlay
                                   className="ri-modal-video" playsInline/>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}