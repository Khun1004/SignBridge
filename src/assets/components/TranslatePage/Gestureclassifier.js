// ══════════════════════════════════════════════════════════════
//  Rule-based 제스처 분류 — 5가지 동작
//  TM 클래스명과 완전히 일치:
//  안녕하세요 / 만나서 반갑습니다 / 고맙습니다 / 좋아합니다 / 미안합니다
// ══════════════════════════════════════════════════════════════

const d2  = (a, b) => Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2)
const fsc = (lm, t, p) => ({ up: lm[p].y - lm[t].y > 0.01, yd: lm[p].y - lm[t].y })
const tsc = (lm) => ({ up: lm[3].y - lm[4].y > 0.01 })
const fu  = (lm, t, p) => fsc(lm, t, p).up

// ── 손 모양 판별 ─────────────────────────────────────────────

// 손 전체 펼침 (고맙습니다용)
const isOpen = (lm) =>
    [fsc(lm,8,6), fsc(lm,12,10), fsc(lm,16,14), fsc(lm,20,18)].every(f => f.up) &&
    d2(lm[5], lm[17]) > 0.10

// 주먹 — 3개 이상 접힘 (안녕하세요, 미안합니다, 좋아합니다용)
const isFist = (lm) => {
    const curled = [fsc(lm,8,6), fsc(lm,12,10), fsc(lm,16,14), fsc(lm,20,18)]
        .filter(f => !f.up).length
    return curled >= 3 && !isOpen(lm)
}

// 엄지 위 + 나머지 접힘 (좋아합니다용)
const isThumbUp = (lm) =>
    tsc(lm).up &&
    !fu(lm,8,6) && !fu(lm,12,10) && !fu(lm,16,14) && !fu(lm,20,18)

// 검지만 세움 (만나서 반갑습니다용)
const isIndexOnly = (lm) =>
    fu(lm,8,6) &&
    !fu(lm,12,10) &&
    !fu(lm,16,14) &&
    !fu(lm,20,18)

// 손 중심점
const cx = (lm) => (lm[0].x + lm[9].x) / 2
const cy = (lm) => (lm[0].y + lm[9].y) / 2

// ══════════════════════════════════════════════════════════════
//  움직임 추적기
// ══════════════════════════════════════════════════════════════
export class MotionTracker {
    constructor() { this.buf = []; this.MAX = 30 }

    push(lm) {
        this.buf.push({ x: cx(lm), y: cy(lm), t: Date.now() })
        if (this.buf.length > this.MAX) this.buf.shift()
    }

    reset() { this.buf = [] }

    vel(n = 8) {
        if (this.buf.length < n) return { dx: 0, dy: 0, spd: 0 }
        const r = this.buf.slice(-n)
        const dt = Math.max((r[r.length-1].t - r[0].t) / 1000, 0.001)
        const dx = (r[r.length-1].x - r[0].x) / dt
        const dy = (r[r.length-1].y - r[0].y) / dt
        return { dx, dy, spd: Math.sqrt(dx*dx + dy*dy) }
    }

    // 안녕하세요: 아래로 내리기
    isDown() {
        if (this.buf.length < 8) return false
        const ys = this.buf.slice(-14).map(p => p.y)
        if (Math.max(...ys) - Math.min(...ys) < 0.04) return false
        const { dy, spd } = this.vel(8)
        return dy > 0.20 && spd > 0.20
    }

    // 만나서 반갑습니다: 좌우 흔들기
    isShakeX() {
        if (this.buf.length < 14) return false
        const xs = this.buf.slice(-22).map(p => p.x)
        if (Math.max(...xs) - Math.min(...xs) < 0.08) return false
        let changes = 0, prev = 0
        for (let i = 1; i < xs.length; i++) {
            const d = xs[i] - xs[i-1]
            if (Math.abs(d) < 0.018) continue
            const dir = d > 0 ? 1 : -1
            if (prev !== 0 && dir !== prev) changes++
            prev = dir
        }
        return changes >= 3
    }

    // 고맙습니다: 앞으로/아래로 내밀기
    isForward() {
        if (this.buf.length < 8) return false
        const pts = this.buf.slice(-16)
        const ys = pts.map(p => p.y)
        if (Math.max(...ys) - Math.min(...ys) < 0.025) return false
        const { spd } = this.vel(8)
        return spd > 0.15
    }

    // 좋아합니다: 위아래로 끄덕이기
    isNodY() {
        if (this.buf.length < 10) return false
        const ys = this.buf.slice(-18).map(p => p.y)
        if (Math.max(...ys) - Math.min(...ys) < 0.04) return false
        let changes = 0, prev = 0
        for (let i = 1; i < ys.length; i++) {
            const d = ys[i] - ys[i-1]
            if (Math.abs(d) < 0.015) continue
            const dir = d > 0 ? 1 : -1
            if (prev !== 0 && dir !== prev) changes++
            prev = dir
        }
        return changes >= 2
    }

    // 미안합니다: 원형 회전
    isCircle() {
        if (this.buf.length < 16) return false
        const pts = this.buf.slice(-24)
        const xs = pts.map(p => p.x)
        const ys = pts.map(p => p.y)
        const xRange = Math.max(...xs) - Math.min(...xs)
        const yRange = Math.max(...ys) - Math.min(...ys)
        if (xRange < 0.04 || yRange < 0.03) return false
        let xC = 0, prev = 0
        for (let i = 1; i < xs.length; i++) {
            const d = xs[i] - xs[i-1]
            if (Math.abs(d) < 0.012) continue
            const dir = d > 0 ? 1 : -1
            if (prev !== 0 && dir !== prev) xC++
            prev = dir
        }
        return xC >= 2 && yRange > 0.03
    }
}

// ══════════════════════════════════════════════════════════════
//  규칙 목록 — TM 클래스명과 완전 일치
// ══════════════════════════════════════════════════════════════
export const RULES = [
    {
        name: '만나서 반갑습니다',   // TM 클래스명 일치
        emoji: '🤝',
        meaning: '검지를 세워 좌우로 흔드는 동작',
        pose: 'point',
        type: 'motion',
        chk: (lm, motion) => isIndexOnly(lm) && motion.isShakeX(),
    },
    {
        name: '고맙습니다',          // TM 클래스명 일치
        emoji: '🙏',
        meaning: '손을 이마에 대고 앞으로 내미는 동작',
        pose: 'thumbUp',
        type: 'motion',
        chk: (lm, motion) => isOpen(lm) && motion.isForward(),
    },
    {
        name: '좋아합니다',          // TM 클래스명 일치
        emoji: '👍',
        meaning: '엄지를 세우고 위아래로 끄덕이는 동작',
        pose: 'thumbUp',
        type: 'motion',
        chk: (lm, motion) => isThumbUp(lm) && motion.isNodY(),
    },
    {
        name: '미안합니다',          // TM 클래스명 일치
        emoji: '🙇',
        meaning: '주먹을 가슴 앞에서 원을 그리는 동작',
        pose: 'fist',
        type: 'motion',
        chk: (lm, motion) => isFist(lm) && motion.isCircle(),
    },
    {
        name: '안녕하세요',          // TM 클래스명 일치
        emoji: '👋',
        meaning: '주먹으로 팔을 쓸어내린 뒤 두 주먹을 아래로 내리는 동작',
        pose: 'hello',
        type: 'motion',
        chk: (lm, motion) => isFist(lm) && motion.isDown(),
    },
]

// ── classify ──────────────────────────────────────────────────
export const classify = (lm, motion) => {
    if (!lm || lm.length < 21) return null
    for (const r of RULES) {
        if (r.chk(lm, motion)) return r
    }
    return null
}

export const classifyHint = () => null
export function vote({ ruleName }) {
    if (!ruleName) return null
    return { name: ruleName, score: 1.0, sources: ['Rule'] }
}