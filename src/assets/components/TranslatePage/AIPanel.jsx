// ══════════════════════════════════════════════════════════════
//  AIPanel — GLB 아바타 수어 시연 패널
// ══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react'
import Person3D from './Person3D.jsx'
import { A2P, POSE_CFG } from './constants.js'
import { fixAnim, speak } from './utils.js'

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
    const autoRef = useRef(null)
    const prevExternalRef = useRef(externalPlaying)

    // externalPlaying 변화 감지
    useEffect(() => {
        if (externalPlaying === prevExternalRef.current) return
        prevExternalRef.current = externalPlaying
        if (externalPlaying) {
            setIdx(0)
            setPlay(true)
        } else {
            setPlay(false)
        }
    }, [externalPlaying])

    // guide 바뀌면 처음부터
    useEffect(() => {
        setIdx(0)
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

    // 자동 재생 타이머
    useEffect(() => {
        clearTimeout(autoRef.current)
        if (!play || !guide?.steps?.length) return
        autoRef.current = setTimeout(() => {
            setIdx(s => (s + 1) % guide.steps.length)
        }, 3000)
        return () => clearTimeout(autoRef.current)
    }, [play, idx, guide])

    const cfg   = POSE_CFG[activePose] || POSE_CFG.idle
    const total = guide?.steps?.length || 0

    return (
        <div className="ai-panel">

            {/* ── 아바타 영역 ── */}
            <div className="ai-char-area" style={{ position: 'relative' }}>
                <Person3D
                    pose={activePose}
                    playing={play}
                />
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
                <div className="ai-ctrl-row">
                    <button className="ai-nav-btn"
                            disabled={idx === 0}
                            onClick={() => { setIdx(i => Math.max(0, i - 1)); setPlay(false) }}>
                        ◀ 이전
                    </button>
                    <button className="ai-play-btn" style={{ background: cfg.c }}
                            onClick={() => setPlay(p => !p)}>
                        {play ? '⏸ 일시정지' : '▶ 재생'}
                    </button>
                    <button className="ai-nav-btn"
                            disabled={idx === total - 1}
                            onClick={() => { setIdx(i => Math.min(total - 1, i + 1)); setPlay(false) }}>
                        다음 ▶
                    </button>
                </div>
            )}
        </div>
    )
}