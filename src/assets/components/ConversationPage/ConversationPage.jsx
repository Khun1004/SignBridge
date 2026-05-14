import { useRef, useState, useEffect, useCallback } from 'react'
import './ConversationPage.css'
import { conversationApi } from '../../../assets/components/api/api.jsx'

/**
 * ConversationPage
 * props:
 *   messages       — 대화 기록 배열
 *   videoBlobs     — Blob[] (번역기 세션마다 누적된 녹화 blob 배열)
 *   onBack         — 번역기로 돌아가기
 *   onRegister     — 등록하기 (videos 배열 전달)
 *   onVideosChange — 부모(App)에 videos 동기화
 *   userEmail
 *   place
 */
export default function ConversationPage({
                                             messages       = [],
                                             videoBlobs     = [],   // ← 배열로 받음
                                             onBack,
                                             onRegister,
                                             onVideosChange,
                                             userEmail      = '',
                                             place          = 'immigration',
                                         }) {
    const printRef      = useRef(null)
    const processedRef  = useRef(new Set())  // 처리된 blob 추적 (index 기반)
    const urlsRef       = useRef([])         // ObjectURL 목록 — 언마운트 시 해제

    const [videos,     setVideos]     = useState([])
    const [saveStatus, setSaveStatus] = useState('idle')
    const [modalVideo, setModalVideo] = useState(null)
    const [toast,      setToast]      = useState(null)

    const showToast = useCallback((type, msg) => {
        setToast({ type, msg })
        setTimeout(() => setToast(null), 3500)
    }, [])

    // videos 변경 시 부모에 알림
    const updateVideos = useCallback((updater) => {
        setVideos(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater
            onVideosChange?.(next)
            return next
        })
    }, [onVideosChange])

    // ══════════════════════════════════════════════════════════
    //  videoBlobs 배열의 각 blob 처리
    //  processedRef로 이미 처리한 인덱스 추적 → 중복 방지
    //  의존성: videoBlobs.length — 새 blob이 추가될 때마다 실행
    // ══════════════════════════════════════════════════════════
    const processBlobsRef = useRef(null)
    processBlobsRef.current = videoBlobs   // 항상 최신 배열 참조

    useEffect(() => {
        const blobs = processBlobsRef.current
        if (!blobs?.length) return

        blobs.forEach((blob, blobIdx) => {
            if (!blob) return
            if (processedRef.current.has(blobIdx)) return
            processedRef.current.add(blobIdx)

            // ObjectURL 생성
            const localUrl = URL.createObjectURL(blob)
            urlsRef.current.push(localUrl)
            const vidId = Date.now() + blobIdx * 17  // 고유 ID

            updateVideos(prev => [...prev, {
                id: vidId, localUrl, serverId: null,
                uploadStatus: 'uploading',
            }])

            // 서버 업로드
            ;(async () => {
                try {
                    const result = await conversationApi.uploadVideo(blob, userEmail)
                    updateVideos(prev => prev.map(v =>
                        v.id === vidId
                            ? { ...v, serverId: result.videoId, uploadStatus: 'done' }
                            : v
                    ))
                } catch (e) {
                    console.error('[UPLOAD]', e)
                    updateVideos(prev => prev.map(v =>
                        v.id === vidId ? { ...v, uploadStatus: 'error' } : v
                    ))
                    showToast('err', `영상 ${blobIdx + 1} 서버 저장 실패. 로컬에서 재생 가능합니다.`)
                }
            })()
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoBlobs?.length])   // ← length 변화 감지

    // ── 언마운트 시 ObjectURL 일괄 해제 ──────────────────────
    useEffect(() => {
        return () => {
            urlsRef.current.forEach(url => URL.revokeObjectURL(url))
            urlsRef.current = []
        }
    }, [])

    // ── 마운트 시 대화 기록 저장 (1회) ───────────────────────
    const savedRef = useRef(false)
    useEffect(() => {
        if (savedRef.current || !messages.length) return
        savedRef.current = true
        doSaveConversation()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const doSaveConversation = async () => {
        if (!userEmail?.trim()) {
            setSaveStatus('error')
            showToast('err', '로그인 정보가 없어 저장할 수 없습니다.')
            return
        }
        setSaveStatus('saving')
        try {
            await conversationApi.saveConversation({
                userEmail: userEmail.trim(),
                place,
                videoId:  null,
                messages: messages.map(m => ({
                    msgType: m.type,
                    content: m.text,
                    pose:    m.pose ?? null,
                    sentAt:  m.time,
                })),
            })
            setSaveStatus('done')
            showToast('ok', `대화 기록 저장 완료 (${messages.length}개)`)
        } catch (e) {
            setSaveStatus('error')
            showToast('err', `저장 실패: ${e.message}`)
        }
    }

    const handleSaveTxt = () => {
        if (!messages.length) return
        const lines = messages.map(m =>
            `[${m.time}] ${m.type === 'sign' ? '🧏 장애인(수어)' : '🙋 담당자'}\n${m.text}`
        )
        const content = [
            '=== SignBridge 대화 기록 ===',
            `저장 시각: ${new Date().toLocaleString('ko-KR')}`,
            `총 ${messages.length}개 메시지`,
            '', ...lines.flatMap(l => [l, '']),
        ].join('\n')
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href = url; a.download = `signbridge_대화_${Date.now()}.txt`
        a.click(); URL.revokeObjectURL(url)
    }

    const handleDownloadVideo = (vid) => {
        const url = vid.localUrl
            || (vid.serverId ? conversationApi.getVideoUrl(vid.serverId) : null)
        if (!url) return
        const a = document.createElement('a')
        a.href = url
        a.download = `signbridge_녹화_${vid.id}.webm`
        a.click()
    }

    const handlePrint = () => window.print()

    const startTime  = messages[0]?.time || ''
    const endTime    = messages[messages.length - 1]?.time || ''
    const signCount  = messages.filter(m => m.type === 'sign').length
    const voiceCount = messages.filter(m => m.type === 'voice').length
    const hasVideos  = videos.length > 0

    return (
        <div className="conv-page" ref={printRef}>

            {!userEmail?.trim() && (
                <div className="conv-no-login-warn">
                    ⚠️ 로그인이 필요합니다. 대화 기록은 서버에 저장되지 않습니다.
                </div>
            )}

            {toast && (
                <div className={`conv-toast conv-toast-${toast.type}`}>
                    {toast.type === 'ok' ? '✅' : '⚠️'} {toast.msg}
                </div>
            )}

            {/* ── 헤더: 왼쪽(뒤로) | 가운데(타이틀+액션) | 오른쪽(등록) ── */}
            <div className="conv-header">
                <div className="conv-header-left">
                    <button className="btn-back" onClick={onBack}>← 번역기로 돌아가기</button>
                </div>

                <div className="conv-header-center">
                    <div className="conv-title-wrap">
                        <h1 className="conv-title">대화 기록</h1>
                        <p className="conv-subtitle">
                            <span className="conv-time-range">
                                {startTime && endTime ? `${startTime} ~ ${endTime}` : '기록 없음'}
                            </span>
                            {messages.length > 0 && (
                                <span className="conv-stats">
                                    <span style={{ color: 'var(--cp-text-mute)' }}>총 {messages.length}개</span>
                                    <span className="stat-sign">🧏 {signCount}</span>
                                    <span className="stat-voice">🙋 {voiceCount}</span>
                                </span>
                            )}
                            {hasVideos && (
                                <span className="conv-video-count">🎬 영상 {videos.length}개</span>
                            )}
                        </p>
                    </div>
                    <div className="conv-center-actions">
                        <div className="conv-save-status">
                            {saveStatus === 'saving' && <span className="save-badge save-badge-saving">💾 저장 중...</span>}
                            {saveStatus === 'done'   && <span className="save-badge save-badge-done">✅ 저장 완료</span>}
                            {saveStatus === 'error'  && <span className="save-badge save-badge-error">⚠️ 저장 실패</span>}
                        </div>
                        <button className="btn-save btn-save-txt"   onClick={handleSaveTxt}  disabled={!messages.length}>💾 텍스트 저장</button>
                        <button className="btn-save btn-save-print" onClick={handlePrint}     disabled={!messages.length}>🖨️ 인쇄 / PDF</button>
                    </div>
                </div>

                <div className="conv-header-right">
                    <button className="btn-save btn-register" onClick={() => onRegister?.(videos)}>💾 저장하기</button>
                </div>
            </div>

            {/* ── 2열 레이아웃 ── */}
            <div className={`conv-main ${hasVideos ? 'conv-main-split' : ''}`}>

                {/* 왼쪽: 대화 목록 */}
                <div className="conv-body">
                    {messages.length === 0 ? (
                        <div className="conv-empty">
                            <span style={{ fontSize: 44, opacity: 0.35 }}>💬</span>
                            <p>저장된 대화 기록이 없습니다.</p>
                            <button className="btn-back-center" onClick={onBack}>← 번역기로 돌아가기</button>
                        </div>
                    ) : (
                        <div className="conv-list">
                            {messages.map((msg, idx) => (
                                <div key={msg.id ?? idx} className={`conv-msg conv-msg-${msg.type}`}>
                                    <div className="conv-avatar">
                                        {msg.type === 'sign' ? '🧏' : '🙋'}
                                    </div>
                                    <div className="conv-bubble-wrap">
                                        <div className="conv-msg-name">
                                            {msg.type === 'sign' ? '장애인 (수어)' : '담당자'}
                                        </div>
                                        <div className="conv-bubble">{msg.text}</div>
                                        <div className="conv-msg-time">{msg.time}</div>
                                    </div>
                                    <div className="conv-index">#{idx + 1}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 오른쪽: 영상 목록 */}
                {hasVideos && (
                    <div className="conv-video-panel">
                        <div className="conv-video-panel-hd">
                            🎬 녹화 영상
                            <span className="conv-video-panel-count">{videos.length}개</span>
                        </div>
                        <div className="conv-video-stack">
                            {videos.map((vid, idx) => {
                                const playUrl = vid.localUrl
                                    || (vid.serverId ? conversationApi.getVideoUrl(vid.serverId) : null)
                                return (
                                    <div key={vid.id} className="conv-video-card">
                                        <div className="conv-video-card-hd">
                                            <span className="conv-video-card-label">영상 {idx + 1}</span>
                                            <div className="conv-video-card-badges">
                                                {vid.uploadStatus === 'uploading' && <span className="video-badge badge-uploading">⏳ 저장 중</span>}
                                                {vid.uploadStatus === 'done'      && <span className="video-badge badge-done">✅ 저장됨</span>}
                                                {vid.uploadStatus === 'error'     && <span className="video-badge badge-error">⚠️ 실패</span>}
                                            </div>
                                        </div>

                                        {playUrl ? (
                                            <video
                                                src={playUrl}
                                                controls
                                                className="conv-video-mini"
                                                playsInline
                                            />
                                        ) : (
                                            <div className="conv-video-mini-ph">
                                                <span>🎬</span><p>준비 중...</p>
                                            </div>
                                        )}

                                        <div className="conv-video-card-actions">
                                            {playUrl && (
                                                <button
                                                    className="btn-vid btn-vid-play"
                                                    onClick={() => setModalVideo({ url: playUrl, serverId: vid.serverId, idx })}
                                                >▶ 크게 보기</button>
                                            )}
                                            <button
                                                className="btn-vid btn-vid-dl"
                                                onClick={() => handleDownloadVideo(vid)}
                                                disabled={!playUrl}
                                            >⬇️ 다운로드</button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {messages.length > 4 && (
                <div className="conv-footer">
                    <button className="btn-save btn-save-txt"   onClick={handleSaveTxt}>💾 텍스트 저장</button>
                    <button className="btn-save btn-save-print" onClick={handlePrint}>🖨️ 인쇄 / PDF</button>
                </div>
            )}

            {/* 모달 */}
            {modalVideo && (
                <div className="video-modal-overlay" onClick={() => setModalVideo(null)}>
                    <div className="video-modal" onClick={e => e.stopPropagation()}>
                        <div className="video-modal-hd">
                            <span className="video-modal-title">🎬 영상 {modalVideo.idx + 1} 재생</span>
                            <div className="video-modal-actions">
                                <button className="video-modal-dl"
                                        onClick={() => handleDownloadVideo({ localUrl: modalVideo.url, id: Date.now() })}>
                                    ⬇️ 다운로드
                                </button>
                                <button className="video-modal-close" onClick={() => setModalVideo(null)}>✕</button>
                            </div>
                        </div>
                        <div className="video-modal-body">
                            <video src={modalVideo.url} controls autoPlay className="video-modal-player" playsInline />
                        </div>
                        {modalVideo.serverId && (
                            <div className="video-modal-ft">
                                <span className="video-badge badge-done">✅ 서버 저장 완료 (ID: {modalVideo.serverId})</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}