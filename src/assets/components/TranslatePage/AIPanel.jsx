// ══════════════════════════════════════════════════════════════
//  AIPanel — GLB 아바타 수어 시연 패널
// ══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { A2P, POSE_CFG } from './constants.js'
import { fixAnim, speak } from './utils.js'

// Person3D는 Three.js 등 무거운 라이브러리를 포함하므로 lazy load
const Person3D = lazy(() => import('./Person3D.jsx'))

const VALID_POSES = new Set(Object.keys(POSE_CFG))

function resolvePose(animType) {
    if (!animType) return 'idle'
    const trimmed = animType.trim()

    // 1) POSE_CFG에 직접 일치 (대소문자 무시)
    for (const key of VALID_POSES) {
        if (key.toLowerCase() === trimmed.toLowerCase()) return key
    }

    // 2) A2P 매핑 (한글 TM 클래스명 포함)
    for (const [aKey, pKey] of Object.entries(A2P)) {
        if (aKey.toLowerCase() === trimmed.toLowerCase()) {
            if (VALID_POSES.has(pKey)) return pKey
        }
    }

    // 3) 공백 제거 후 A2P 재시도 ("만나서 반갑습니다" → "만나서반갑습니다")
    const compact = trimmed.replace(/\s/g, '')
    for (const [aKey, pKey] of Object.entries(A2P)) {
        if (aKey.replace(/\s/g, '').toLowerCase() === compact.toLowerCase()) {
            if (VALID_POSES.has(pKey)) return pKey
        }
    }

    console.warn(`[AIPanel] resolvePose: "${animType}" 매핑 실패 → idle`)
    return 'idle'
}

export default function AIPanel({
                                    guide,
                                    loading,
                                    playing: externalPlaying,
                                }) {
    const [idx,        setIdx]       = useState(0)
    const [play,       setPlay]      = useState(false)
    const [activePose, setActivePose] = useState('idle')
    const [done,       setDone]       = useState(false)  // 전체 재생 완료
    const autoRef = useRef(null)
    const prevExternalRef = useRef(externalPlaying)

    // externalPlaying 변화 감지
    useEffect(() => {
        if (externalPlaying === prevExternalRef.current) return
        prevExternalRef.current = externalPlaying
        if (externalPlaying) {
            setIdx(0)
            setDone(false)
            setPlay(true)
        } else {
            setPlay(false)
        }
    }, [externalPlaying])

    // guide 바뀌면 처음부터
    useEffect(() => {
        setIdx(0)
        setDone(false)
        setPlay(!!externalPlaying)
    }, [guide])

    // 포즈 전환
    useEffect(() => {
        if (!guide?.steps?.length) {
            setActivePose('idle')
            return
        }
        const st    = guide.steps[idx]
        const fixed = fixAnim(st || {})
        const po    = resolvePose(fixed?.animType)

        console.log(
            `[AIPanel] step[${idx}] word="${st?.word}" | ` +
            `원본="${st?.animType}" | fixAnim 후="${fixed?.animType}" | 최종 pose="${po}"`
        )

        setActivePose(po)
    }, [idx, guide])

    // 자동 재생 타이머 — 각 단어마다 FBX 재생 시간 고려
    useEffect(() => {
        clearTimeout(autoRef.current)
        if (!play || !guide?.steps?.length || done) return
        const total = guide.steps.length
        // 마지막 단어면 완료 처리
        if (idx >= total - 1) {
            autoRef.current = setTimeout(() => {
                setPlay(false)
                setDone(true)
            }, 2800)
            return
        }
        // 다음 단어로 (2.8초마다 — FBX 한 사이클 기준)
        autoRef.current = setTimeout(() => {
            setIdx(s => s + 1)
        }, 2800)
        return () => clearTimeout(autoRef.current)
    }, [play, idx, guide, done])

    const cfg   = POSE_CFG[activePose] || POSE_CFG.idle
    const total = guide?.steps?.length || 0
    const progress = total > 0 ? Math.round(((idx + 1) / total) * 100) : 0

    return (
        <div className="ai-panel">

            {/* ── 아바타 영역 ── */}
            <div className="ai-char-area" style={{ position: 'relative' }}>
                <Suspense fallback={
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'#94a3b8', fontSize:13 }}>
                        🤟 아바타 로딩 중...
                    </div>
                }>
                    <Person3D pose={activePose} playing={play} />
                </Suspense>
                {loading && (
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex',
                        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.75)', gap: 8,
                    }}>
                        <div className="typing-dots"><span/><span/><span/></div>
                        <p style={{ fontSize: 13, color: '#64748b' }}>수어 가이드 생성 중...</p>
                    </div>
                )}
            </div>

            {/* ── guide 없고 로딩도 아닐 때 안내 문구 ── */}
            {!guide && !loading && (
                <div style={{
                    padding: '18px 16px', textAlign: 'center',
                    color: '#94a3b8', fontSize: 13, lineHeight: 1.6,
                }}>
                    <p>👆 왼쪽에 텍스트를 입력하고</p>
                    <p><strong>수어문 추출 → 전송하기</strong>를 누르면</p>
                    <p>아바타가 수어 동작을 보여줍니다</p>
                </div>
            )}

            {/* ── guide 있을 때: 컨트롤 버튼만 ── */}
            {guide && (
                <div className="ai-ctrl-col">
                    {/* 진행 바 */}
                    <div className="ai-progress-wrap">
                        <div className="ai-progress-bar" style={{ width: `${progress}%` }}/>
                        <span className="ai-progress-label">
                            {done ? '✅ 완료' : `${idx + 1} / ${total}`}
                        </span>
                    </div>
                    {/* 현재 단어 */}
                    <div className="ai-current-word">
                        {guide.steps[idx]?.word || ''}
                    </div>
                    {/* 버튼 */}
                    <div className="ai-ctrl-row">
                        <button className="ai-nav-btn"
                                disabled={idx === 0}
                                onClick={() => { setIdx(i => Math.max(0, i - 1)); setPlay(false); setDone(false) }}>
                            ◀ 이전
                        </button>
                        {done ? (
                            <button className="ai-play-btn" style={{ background: '#10b981' }}
                                    onClick={() => { setIdx(0); setDone(false); setPlay(true) }}>
                                🔄 다시 재생
                            </button>
                        ) : (
                            <button className="ai-play-btn" style={{ background: cfg.c }}
                                    onClick={() => { setPlay(p => !p); if (done) { setIdx(0); setDone(false); } }}>
                                {play ? '⏸ 일시정지' : '▶ 재생'}
                            </button>
                        )}
                        <button className="ai-nav-btn"
                                disabled={idx === total - 1}
                                onClick={() => { setIdx(i => Math.min(total - 1, i + 1)); setPlay(false); setDone(false) }}>
                            다음 ▶
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}