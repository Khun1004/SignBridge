// ══════════════════════════════════════════════════════════════
//  Utils.js
// ══════════════════════════════════════════════════════════════
import { A2P, POSE_CFG } from './constants.js'

const VALID_POSES = new Set(Object.keys(POSE_CFG))

/**
 * animType 보정 — 우선순위:
 *  1) word 키워드 강제 매핑 (TM 학습 5종 기준)
 *  2) animType이 POSE_CFG에 직접 있으면 그대로
 *  3) A2P 매핑 통해 변환
 *  4) 없으면 idle
 */
export const fixAnim = (s) => {
    if (!s) return { animType: 'idle' }

    const word = s.word || ''
    let f = s.animType

    // ── 1. TM 학습 5종 키워드 우선 매핑 ───────────────────────
    if      (word.includes('안녕'))                                        f = 'hello'
    else if (word.includes('만나') || word.includes('반갑'))               f = 'point'
    else if (word.includes('고마') || word.includes('감사'))               f = 'thanks'
    else if (word.includes('좋아') || word.includes('최고'))               f = 'thumbUp'
    else if (word.includes('미안') || word.includes('죄송') || word.includes('사과')) f = 'fist'
    // 추가 보조 키워드
    else if (word.includes('사랑'))                                        f = 'love'
    else if (word.includes('싫어') || word.includes('아니'))               f = 'thumbDown'

    // ── 2. POSE_CFG에 직접 있으면 OK ───────────────────────────
    if (f && VALID_POSES.has(f)) return { ...s, animType: f }

    // ── 3. A2P 매핑으로 변환 (한글 TM 클래스명 포함) ──────────
    if (f) {
        const mapped = A2P[f] || A2P[f?.toLowerCase()]
        if (mapped && VALID_POSES.has(mapped)) return { ...s, animType: mapped }
    }

    // ── 4. 원본 animType도 A2P에서 한 번 더 시도 ──────────────
    const orig = s.animType
    if (orig) {
        const mapped = A2P[orig] || A2P[orig?.toLowerCase()]
        if (mapped && VALID_POSES.has(mapped)) return { ...s, animType: mapped }
        if (VALID_POSES.has(orig)) return { ...s, animType: orig }
        // 한글 클래스명 공백 제거 후 재시도 (예: "만나서 반갑습니다" → "만나서반갑습니다")
        const compact = orig.replace(/\s/g, '')
        const mappedCompact = A2P[compact]
        if (mappedCompact && VALID_POSES.has(mappedCompact)) return { ...s, animType: mappedCompact }
    }

    return { ...s, animType: 'idle' }
}

/** TTS (음성 합성) */
export const speak = (text, rate = 0.9) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ko-KR'; u.rate = rate
    const v = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('ko'))
    if (v) u.voice = v
    window.speechSynthesis.speak(u)
}

/** MediaPipe 등 외부 스크립트 로드 */
export const loadMP = () => new Promise((res, rej) => {
    if (window.Hands) { res(); return }
    const ld = src => new Promise((r, j) => {
        const s = document.createElement('script')
        s.src = src; s.crossOrigin = 'anonymous'
        s.onload = r; s.onerror = () => j(new Error(src))
        document.head.appendChild(s)
    })
    Promise.all([
        ld('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'),
        ld('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js')
    ]).then(res).catch(rej)
})