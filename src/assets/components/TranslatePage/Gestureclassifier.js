// ══════════════════════════════════════════════════════════════
//  GestureClassifier.js — 실제 수어 이미지 기준 최종본
//  MediaPipe Holistic (손 + 포즈 랜드마크) 활용
//
//  이미지 기준 실제 동작:
//  ① 안녕하세요     : 오른주먹으로 왼팔 쓸어내리기 → 두 주먹 아래로
//  ② 만나서반갑습니다: [만나서] 양손 검지 세워 가운데로 모음
//                     [반갑습니다] 엄지 세우고 가슴에서 위아래 번갈아
//                     → 두 동작 중 하나라도 감지되면 인식
//  ③ 고맙습니다     : 양손 펼쳐서 한 손 위에서 아래로 (가슴 높이)
//  ④ 좋아합니다     : 검지를 코 옆에 대고 0.5초 유지
//  ⑤ 미안합니다     : O형/펼친 손을 이마에 댄 후 아래로 내리기
// ══════════════════════════════════════════════════════════════

const d2 = (a, b) => Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2)
const above = (lm, tip, pip) => lm[pip].y - lm[tip].y > 0.01

// ── 손 모양 판별 ──────────────────────────────────────────────
const isOpen = (lm) =>
    above(lm,8,6) && above(lm,12,10) && above(lm,16,14) && above(lm,20,18) &&
    d2(lm[5], lm[17]) > 0.08

const isFist = (lm) =>
    [!above(lm,8,6), !above(lm,12,10), !above(lm,16,14), !above(lm,20,18)]
        .filter(Boolean).length >= 3

const isThumbUp = (lm) =>
    (lm[3].y - lm[4].y) > 0.03 &&
    !above(lm,8,6) && !above(lm,12,10) && !above(lm,16,14) && !above(lm,20,18)

const isIndexOnly = (lm) =>
    above(lm,8,6) && !above(lm,12,10) && !above(lm,16,14) && !above(lm,20,18)

const cx = (lm) => (lm[0].x + lm[9].x) / 2
const cy = (lm) => (lm[0].y + lm[9].y) / 2

const getShape = (lm) => {
    if (isThumbUp(lm))   return 'thumbUp'
    if (isIndexOnly(lm)) return 'index'
    if (isOpen(lm))      return 'open'
    if (isFist(lm))      return 'fist'
    return 'other'
}

// ── Holistic 포즈 기준 위치 판별 ─────────────────────────────
const getNoseY     = (p) => p?.[0]?.y ?? null
const getShoulderY = (p) => p ? ((p[11]?.y + p[12]?.y) / 2) : null
const getNoseX     = (p) => p?.[0]?.x ?? null

// 손이 이마/얼굴 높이 (코보다 위 또는 같은 높이)
const isNearFace = (handLm, poseLm) => {
    const wristY = handLm[0].y
    const noseY  = getNoseY(poseLm)
    return noseY !== null ? wristY < noseY + 0.08 : wristY < 0.50
}

// 손이 가슴 높이 (코 아래, 배 위)
const isChestLevel = (handLm, poseLm) => {
    const wristY    = handLm[0].y
    const noseY     = getNoseY(poseLm)
    const shoulderY = getShoulderY(poseLm)
    if (noseY !== null && shoulderY !== null)
        return wristY > noseY + 0.08 && wristY < shoulderY + 0.40
    return wristY > 0.44 && wristY < 0.78
}

// 손(검지)이 코 옆에 있는지
const isBesideNose = (handLm, poseLm) => {
    const noseX  = getNoseX(poseLm)
    const noseY  = getNoseY(poseLm)
    const wristY = handLm[0].y
    const indexX = handLm[8].x
    if (noseX !== null && noseY !== null) {
        return Math.abs(indexX - noseX) < 0.20 &&
            Math.abs(wristY - noseY) < 0.22
    }
    return wristY < 0.48
}

// ══════════════════════════════════════════════════════════════
export class MotionTracker {
    constructor(max = 60) {
        this.buf     = []  // { x, y, shape, t }
        this.buf2    = []  // 두 번째 손
        this.poseBuf = []  // 포즈 랜드마크
        this.MAX     = max
        this._fired     = null
        this._firedTime = 0
        // 상태머신
        this._helloPhase  = 0; this._helloStartY = 0
        this._sorryPhase  = 0; this._sorryStartY = 0
        this._likeFrames  = 0
        this._greetFrames = 0  // 만나서반갑: 손 모음 감지용
    }

    confirmGesture(name) {
        this._fired     = name
        this._firedTime = Date.now()
        this.buf     = this.buf.slice(-6)
        this.buf2    = this.buf2.slice(-6)
        this.poseBuf = this.poseBuf.slice(-6)
        this._helloPhase  = 0
        this._sorryPhase  = 0
        this._likeFrames  = 0
        this._greetFrames = 0
    }

    _cd(name, ms = 2000) {
        return this._fired === name && Date.now() - this._firedTime < ms
    }

    push(lm, lm2 = null, poseLm = null) {
        this.buf.push({ x: cx(lm), y: cy(lm), shape: getShape(lm), t: Date.now() })
        if (this.buf.length > this.MAX) this.buf.shift()
        if (lm2) {
            this.buf2.push({ x: cx(lm2), y: cy(lm2), shape: getShape(lm2), t: Date.now() })
            if (this.buf2.length > this.MAX) this.buf2.shift()
        } else {
            this.buf2 = []
        }
        if (poseLm) {
            this.poseBuf.push(poseLm)
            if (this.poseBuf.length > this.MAX) this.poseBuf.shift()
        }
    }

    reset() {
        this.buf = []; this.buf2 = []; this.poseBuf = []
        this._fired = null; this._firedTime = 0
        this._helloPhase = 0; this._sorryPhase = 0
        this._likeFrames = 0; this._greetFrames = 0
    }

    _sr(shape, n = 20, buf = this.buf) {
        const pts = buf.slice(-n)
        if (pts.length < 3) return 0
        return pts.filter(p => p.shape === shape).length / pts.length
    }

    _avgY(n = 8) {
        const pts = this.buf.slice(-n)
        if (!pts.length) return 0.5
        return pts.reduce((s,p) => s + p.y, 0) / pts.length
    }

    _latestPose() {
        return this.poseBuf.length ? this.poseBuf[this.poseBuf.length - 1] : null
    }

    _xSwings(pts, dead = 0.012) {
        let sw = 0, dir = 0
        for (let i = 1; i < pts.length; i++) {
            const d = pts[i].x - pts[i-1].x
            if (Math.abs(d) < dead) continue
            const nd = d > 0 ? 1 : -1
            if (dir !== 0 && nd !== dir) sw++
            dir = nd
        }
        return sw
    }

    _ySwings(pts, dead = 0.010) {
        let sw = 0, dir = 0
        for (let i = 1; i < pts.length; i++) {
            const d = pts[i].y - pts[i-1].y
            if (Math.abs(d) < dead) continue
            const nd = d > 0 ? 1 : -1
            if (dir !== 0 && nd !== dir) sw++
            dir = nd
        }
        return sw
    }

    // ══════════════════════════════════════════════════════════
    //  ① 안녕하세요
    //  동작: 오른주먹으로 왼팔 쓸어내리기 → 두 주먹 아래로
    //  감지:
    //  [A] 두 손 모두 하강 (두 주먹 동시에 아래로)
    //  [B] fist 손 + 가슴 높이에서 하강 (팔 쓸어내리기)
    // ══════════════════════════════════════════════════════════
    isHelloDown(handLm) {
        if (this._cd('안녕하세요')) return false
        const last = this.buf[this.buf.length - 1]
        if (!last) return false
        const poseLm = this._latestPose()

        // [A] 두 손 동시 하강
        if (this.buf2.length >= 8) {
            const pts1 = this.buf.slice(-16)
            const pts2 = this.buf2.slice(-16)
            if (pts1.length >= 8 && pts2.length >= 8) {
                const ys1 = pts1.map(p => p.y)
                const ys2 = pts2.map(p => p.y)
                if (Math.max(...ys1) - Math.min(...ys1) > 0.05 &&
                    Math.max(...ys2) - Math.min(...ys2) > 0.05) {
                    let d1 = 0, d2 = 0
                    for (let i = 1; i < pts1.length; i++) {
                        if (pts1[i].y > pts1[i-1].y + 0.003) d1++
                        if (pts2[i]?.y > pts2[i-1]?.y + 0.003) d2++
                    }
                    if (d1/(pts1.length-1) > 0.50 && d2/(pts2.length-1) > 0.50)
                        return true
                }
            }
        }

        // [B] fist 손 + 하강 상태머신
        const { shape, y } = last
        if (this._helloPhase === 0) {
            const chest = handLm
                ? isChestLevel(handLm, poseLm)
                : (y > 0.35 && y < 0.78)
            if ((shape === 'fist' || shape === 'other') && chest) {
                this._helloPhase = 1; this._helloStartY = y
            }
            return false
        }
        if (this._helloPhase === 1) {
            if (shape === 'thumbUp' || shape === 'index') {
                this._helloPhase = 0; return false
            }
            if (y < this._helloStartY - 0.08) {
                this._helloPhase = 0; return false
            }
            if (y - this._helloStartY > 0.12) {
                this._helloPhase = 0; return true
            }
        }
        return false
    }

    // ══════════════════════════════════════════════════════════
    //  ② 만나서 반갑습니다
    //  실제 동작 2가지:
    //  [만나서]    양손 검지 세워서 가운데로 모으기 (두 손 X 거리 감소)
    //  [반갑습니다] 엄지 세우고 가슴에서 위아래 번갈아 (thumbUp + Y 왕복)
    //
    //  → 두 동작 중 하나라도 감지되면 인식
    // ══════════════════════════════════════════════════════════
    isGreet(handLm) {
        if (this._cd('만나서 반갑습니다')) return false
        const poseLm = this._latestPose()

        // ── [반갑습니다]: thumbUp + 가슴 높이 + 위아래 왕복 ──
        if (this._sr('thumbUp', 16) >= 0.40) {
            const chest = handLm
                ? isChestLevel(handLm, poseLm)
                : (this._avgY(10) > 0.42)
            if (chest) {
                const pts = this.buf.slice(-22)
                if (pts.length >= 12) {
                    const ys = pts.map(p => p.y)
                    if (Math.max(...ys) - Math.min(...ys) > 0.03 &&
                        this._ySwings(pts, 0.010) >= 2) return true
                }
            }
        }

        // ── [만나서]: 양손 검지 + 두 손 X 거리가 줄어드는 동작 ─
        if (this.buf2.length >= 8 &&
            this._sr('index', 16, this.buf) >= 0.40 &&
            this._sr('index', 16, this.buf2) >= 0.40) {

            const recent1 = this.buf.slice(-12)
            const recent2 = this.buf2.slice(-12)
            if (recent1.length >= 8 && recent2.length >= 8) {
                // 두 손의 X 거리 변화 계산
                const dists = recent1.map((p, i) =>
                    recent2[i] ? Math.abs(p.x - recent2[i].x) : null
                ).filter(Boolean)

                if (dists.length >= 6) {
                    const startDist = dists.slice(0, 3).reduce((a,b) => a+b, 0) / 3
                    const endDist   = dists.slice(-3).reduce((a,b) => a+b, 0) / 3
                    // 두 손이 0.05 이상 가까워지면 "모으기" 동작
                    if (startDist - endDist > 0.05) return true
                }
            }
        }

        return false
    }

    // ══════════════════════════════════════════════════════════
    //  ③ 고맙습니다
    //  동작: 양손 펼쳐서 한 손 위→아래 (가슴 높이)
    //  감지: open 손 + 가슴 높이 + 하강
    // ══════════════════════════════════════════════════════════
    isThanksDown(handLm) {
        if (this._cd('고맙습니다')) return false
        if (this._sr('open', 16) < 0.35) return false

        const pts = this.buf.slice(-20)
        if (pts.length < 10) return false
        const poseLm = this._latestPose()

        // 가슴 높이 확인
        const chest = handLm
            ? isChestLevel(handLm, poseLm)
            : (this._avgY(12) > 0.44)
        if (!chest) return false

        // 이마 높이이면 미안합니다 → 제외
        const face = handLm
            ? isNearFace(handLm, poseLm)
            : (this._avgY(12) < 0.44)
        if (face) return false

        const ys = pts.map(p => p.y)
        const xs = pts.map(p => p.x)
        const yR = Math.max(...ys) - Math.min(...ys)
        const xR = Math.max(...xs) - Math.min(...xs)
        if (yR < 0.035) return false
        if (xR > yR * 2.0) return false

        let down = 0
        for (let i = 1; i < pts.length; i++) {
            if (pts[i].y > pts[i-1].y + 0.002) down++
        }
        return down / (pts.length - 1) > 0.45
    }

    // ══════════════════════════════════════════════════════════
    //  ④ 좋아합니다
    //  동작: 검지를 코 옆에 대고 유지 (정지형)
    //  감지: index 손 + 코 옆 위치 + 0.5초 정지
    //  Holistic: 코 위치와 검지 X 거리로 정확히 판별
    // ══════════════════════════════════════════════════════════
    isLikeNose(handLm) {
        if (this._cd('좋아합니다')) return false
        const last = this.buf[this.buf.length - 1]
        if (!last) return false

        if (last.shape !== 'index') {
            this._likeFrames = 0; return false
        }

        const poseLm = this._latestPose()
        const beside = handLm
            ? isBesideNose(handLm, poseLm)
            : (last.y < 0.48)
        if (!beside) {
            this._likeFrames = 0; return false
        }

        // 정지 확인 (최근 10프레임 움직임 작아야)
        const pts = this.buf.slice(-10)
        if (pts.length < 8) return false
        const xR = Math.max(...pts.map(p=>p.x)) - Math.min(...pts.map(p=>p.x))
        const yR = Math.max(...pts.map(p=>p.y)) - Math.min(...pts.map(p=>p.y))

        if (xR < 0.07 && yR < 0.07) {
            this._likeFrames++
        } else {
            this._likeFrames = 0
        }
        return this._likeFrames >= 15  // 약 0.5초
    }

    // ══════════════════════════════════════════════════════════
    //  ⑤ 미안합니다
    //  동작: O형/펼친 손을 이마에 댄 후 아래로 내리기
    //  감지: 이마 높이에서 시작 → 0.12 이상 하강
    //  Holistic: 코 기준으로 이마 높이 정확히 판별
    // ══════════════════════════════════════════════════════════
    isSorryDown(handLm) {
        if (this._cd('미안합니다')) return false
        const last = this.buf[this.buf.length - 1]
        if (!last) return false
        const { shape, y } = last
        const poseLm = this._latestPose()

        if (this._sorryPhase === 0) {
            const face = handLm
                ? isNearFace(handLm, poseLm)
                : (y < 0.50)
            if (face && shape !== 'thumbUp' && shape !== 'index') {
                this._sorryPhase = 1; this._sorryStartY = y
            }
            return false
        }

        if (this._sorryPhase === 1) {
            if (shape === 'thumbUp' || shape === 'index') {
                this._sorryPhase = 0; return false
            }
            if (y < this._sorryStartY - 0.06) {
                this._sorryPhase = 0; return false
            }
            if (y - this._sorryStartY > 0.12) {
                this._sorryPhase = 0; return true
            }
        }
        return false
    }
}

// ══════════════════════════════════════════════════════════════
//  RULES — 5가지 동작
//  우선순위: 손 모양이 독특한 것 먼저
// ══════════════════════════════════════════════════════════════
export const RULES = [
    {
        name: '좋아합니다', emoji: '👍',
        meaning: '검지를 코 옆에 대고 유지하는 동작',
        pose: 'thumbUp', type: 'motion',
        chk: (lm, m) => m.isLikeNose(lm),
    },
    {
        name: '만나서 반갑습니다', emoji: '🤝',
        meaning: '양손 검지를 모으거나 엄지로 위아래 끄덕이는 동작',
        pose: 'point', type: 'motion',
        chk: (lm, m) => m.isGreet(lm),
    },
    {
        name: '미안합니다', emoji: '🙇',
        meaning: '이마에 손을 댄 후 아래로 내리는 동작',
        pose: 'fist', type: 'motion',
        chk: (lm, m) => m.isSorryDown(lm),
    },
    {
        name: '고맙습니다', emoji: '🙏',
        meaning: '펼친 손을 가슴 높이에서 아래로 내리는 동작',
        pose: 'thanks', type: 'motion',
        chk: (lm, m) => m.isThanksDown(lm),
    },
    {
        name: '안녕하세요', emoji: '👋',
        meaning: '주먹으로 팔을 쓸어내린 후 두 주먹을 아래로 내리는 동작',
        pose: 'hello', type: 'motion',
        chk: (lm, m) => m.isHelloDown(lm),
    },
]

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