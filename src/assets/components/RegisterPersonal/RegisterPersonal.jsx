import { useState } from 'react'
import './RegisterPersonal.css'
import { personalApi, conversationApi } from '../../../assets/components/api/api.jsx'

/**
 * RegisterPersonal
 * props:
 *   messages     — 대화 기록 배열
 *   videos       — [{ id, localUrl, serverId, uploadStatus }] 영상 목록
 *   onBack       — 뒤로가기 콜백
 *   userEmail    — 로그인 이메일
 *   displayName  — 로그인 시 이름 (이름 필드 자동 입력)
 */
export default function RegisterPersonal({
                                             messages    = [],
                                             videos      = [],
                                             onBack,
                                             userEmail   = '',
                                             displayName = '',
                                         }) {
    const [name,   setName]   = useState(displayName || '')  // 로그인 이름 자동 입력
    const [memo,   setMemo]   = useState('')
    const [saving, setSaving] = useState(false)
    const [saved,  setSaved]  = useState(false)
    const [error,  setError]  = useState('')

    // 모달 영상 재생
    const [modalUrl, setModalUrl] = useState(null)

    const now        = new Date().toLocaleString('ko-KR')
    const signCount  = messages.filter(m => m.type === 'sign').length
    const voiceCount = messages.filter(m => m.type === 'voice').length

    // ── 저장 ─────────────────────────────────────────────────
    const handleSave = async () => {
        if (!name.trim()) { setError('이름을 입력해 주세요.'); return }

        // 업로드 중인 영상이 있으면 경고
        const uploadingCount = videos.filter(v => v.uploadStatus === 'uploading').length
        if (uploadingCount > 0) {
            setError(`영상 ${uploadingCount}개가 아직 서버에 저장 중입니다. 잠시 후 다시 시도해 주세요.`)
            return
        }

        setError('')
        setSaving(true)

        try {
            // 서버에 저장 완료된 영상 ID + 실패한 경우 건너뜀
            const videoIds = videos
                .filter(v => v.serverId)
                .map(v => Number(v.serverId))

            console.log('[RegisterPersonal] videos:', videos)
            console.log('[RegisterPersonal] videoIds to save:', videoIds)

            await personalApi.saveCase({
                userEmail:     userEmail?.trim() || null,
                place:         'personal',
                videoId:       videoIds[0] ?? null,
                extraVideoIds: videoIds.slice(1),
                name:          name.trim(),
                memo:          memo.trim(),
                messages:      messages.map(m => ({
                    msgType: m.type    || m.msgType,
                    content: m.text    || m.content,
                    pose:    m.pose    ?? null,
                    sentAt:  m.time    || m.sentAt,
                })),
            })
            setSaved(true)
        } catch (e) {
            console.error('[REGISTER_PERSONAL]', e)
            setError(`저장 실패: ${e.message}`)
        } finally {
            setSaving(false)
        }
    }

    // ── 완료 화면 ─────────────────────────────────────────────
    if (saved) return (
        <div className="rp-page">
            <div className="rp-success">
                <div className="rp-success-icon">✅</div>
                <h2 className="rp-success-title">등록 완료!</h2>
                <p className="rp-success-desc">
                    개인 대화 기록이 저장되었습니다.<br />
                    {videos.length > 0 && `영상 ${videos.length}개 포함`}
                </p>
                <button className="rp-btn-primary" onClick={onBack}>← 대화 기록으로 돌아가기</button>
            </div>
        </div>
    )

    return (
        <div className="rp-page">

            {/* ── 헤더 ── */}
            <div className="rp-header">
                <button className="rp-btn-back" onClick={onBack}>← 등록 선택으로 돌아가기</button>
                <div className="rp-badge" style={{
                    background: 'rgba(37,99,235,0.08)',
                    color: '#2563eb',
                    border: '1px solid rgba(37,99,235,0.2)',
                }}>
                    👤 개인용
                </div>
                <h1 className="rp-title">개인 대화 기록 등록</h1>
                <p className="rp-subtitle">대화 기록과 녹화 영상을 개인 저장소에 등록합니다.</p>
            </div>

            {/* ── 대화 미리보기 ── */}
            <div className="rp-preview">
                <div className="rp-preview-header">
                    <span className="rp-preview-title">📋 대화 내용 요약</span>
                    <span className="rp-preview-meta">
                        {now} · 총 {messages.length}개
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

            {/* ── 영상 목록 ── */}
            {videos.length > 0 && (
                <div className="rp-videos">
                    <div className="rp-videos-header">
                        🎬 녹화 영상
                        <span className="rp-videos-count">{videos.length}개</span>
                    </div>
                    <div className="rp-videos-grid">
                        {videos.map((vid, idx) => {
                            const playUrl = vid.localUrl
                                || (vid.serverId ? conversationApi.getVideoUrl(vid.serverId) : null)
                            return (
                                <div key={vid.id} className="rp-video-card">
                                    <div className="rp-video-card-top">
                                        <span className="rp-video-label">영상 {idx + 1}</span>
                                        <span className={`rp-video-status rp-video-status-${vid.uploadStatus}`}>
                                            {vid.uploadStatus === 'done'      && '✅ 저장됨'}
                                            {vid.uploadStatus === 'uploading' && '⏳ 저장 중'}
                                            {vid.uploadStatus === 'error'     && '⚠️ 실패'}
                                        </span>
                                    </div>

                                    {playUrl ? (
                                        <video
                                            src={playUrl}
                                            className="rp-video-player"
                                            controls
                                            playsInline
                                        />
                                    ) : (
                                        <div className="rp-video-placeholder">
                                            <span>🎬</span>
                                            <p>준비 중...</p>
                                        </div>
                                    )}

                                    <div className="rp-video-actions">
                                        {playUrl && (
                                            <button
                                                className="rp-video-btn rp-video-btn-play"
                                                onClick={() => setModalUrl(playUrl)}
                                            >
                                                ▶ 크게 보기
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── 입력 폼 ── */}
            <div className="rp-form">
                <div className="rp-field">
                    <label className="rp-label">
                        이름 <span className="rp-required">*</span>
                        {displayName && (
                            <span className="rp-autofill-hint">· 로그인 정보에서 자동 입력됨</span>
                        )}
                    </label>
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

                {error && (
                    <div className="rp-error">⚠️ {error}</div>
                )}

                {/* 업로드 중 영상 경고 */}
                {videos.some(v => v.uploadStatus === 'uploading') && (
                    <div style={{
                        padding: '10px 14px',
                        background: '#fef3c7',
                        border: '1.5px solid #fcd34d',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#92400e',
                    }}>
                        ⏳ 영상을 서버에 저장 중입니다. 완료 후 등록해 주세요.
                    </div>
                )}
                <button
                    className="rp-btn-primary"
                    onClick={handleSave}
                    disabled={saving || videos.some(v => v.uploadStatus === 'uploading')}
                >
                    {saving ? '⏳ 저장 중...' : '💾 마이페이지에 저장하기'}
                </button>
            </div>

            {/* ── 영상 전체화면 모달 ── */}
            {modalUrl && (
                <div className="rp-modal-overlay" onClick={() => setModalUrl(null)}>
                    <div className="rp-modal" onClick={e => e.stopPropagation()}>
                        <div className="rp-modal-hd">
                            <span>🎬 영상 재생</span>
                            <button className="rp-modal-close" onClick={() => setModalUrl(null)}>✕</button>
                        </div>
                        <div className="rp-modal-body">
                            <video
                                src={modalUrl}
                                controls
                                autoPlay
                                className="rp-modal-video"
                                playsInline
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}