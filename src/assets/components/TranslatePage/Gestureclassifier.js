// ══════════════════════════════════════════════════════════════
//  GestureClassifier.js — 실제 수어 이미지 기준 최종본
//  MediaPipe Holistic (손 + 포즈 랜드마크) 활용
//
//  실제 동작 (이미지 기준):
//  ① 안녕하세요     : 오른손(open)으로 왼팔 위→아래 쓸어내리기
//  ② 만나서 반갑습니다: 양손 검지 얼굴 앞 모음 / 엄지 위아래
//  ③ 고맙습니다     : 펼친 손 가슴에서 하강
//  ④ 좋아합니다     : 검지 코 옆 유지
//  ⑤ 미안합니다     : OK손(검지+엄지 원)을 이마에 댄 후 아래로 내리며 손 펴기
//  ⑥ 사랑합니다     : 한 손 주먹 세우고 다른 손 손바닥으로 주먹 위 원 그리기
// ══════════════════════════════════════════════════════════════

const d2    = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
const above = (lm, tip, pip) => lm[pip].y - lm[tip].y > 0.01

// ── 손 모양 판별 ──────────────────────────────────────────────
const isOpen = (lm) =>
    above(lm, 8, 6) && above(lm, 12, 10) && above(lm, 16, 14) && above(lm, 20, 18) &&
    d2(lm[5], lm[17]) > 0.08

const isFist = (lm) =>
    [!above(lm, 8, 6), !above(lm, 12, 10), !above(lm, 16, 14), !above(lm, 20, 18)]
        .filter(Boolean).length >= 3

const isThumbUp = (lm) =>
    (lm[3].y - lm[4].y) > 0.03 &&
    !above(lm, 8, 6) && !above(lm, 12, 10) && !above(lm, 16, 14) && !above(lm, 20, 18)

const isIndexOnly = (lm) =>
    above(lm, 8, 6) && !above(lm, 12, 10) && !above(lm, 16, 14) && !above(lm, 20, 18)

// OK sign: 검지+엄지 원 + 중·약·소지 펼침 (미안합니다 시작 손 모양)
const isOkSign = (lm) =>
    !above(lm, 8, 6) &&                              // 검지 구부러짐 (엄지와 원)
    above(lm, 12, 10) && above(lm, 16, 14) && above(lm, 20, 18) // 중·약·소지 펼침

const cx = (lm) => (lm[0].x + lm[9].x) / 2
const cy = (lm) => (lm[0].y + lm[9].y) / 2

const getShape = (lm) => {
    if (isOkSign(lm))    return 'ok'
    if (isThumbUp(lm))   return 'thumbUp'
    if (isIndexOnly(lm)) return 'index'
    if (isOpen(lm))      return 'open'
    if (isFist(lm))      return 'fist'
    return 'other'
}

// ── Holistic 포즈 랜드마크 헬퍼 ──────────────────────────────
const getNoseY     = (p) => p?.[0]?.y  ?? null
const getShoulderY = (p) => p ? ((p[11]?.y + p[12]?.y) / 2) : null
const getNoseX     = (p) => p?.[0]?.x  ?? null

const isTooHigh = (handLm, poseLm) => {
    const wristY = handLm[0].y
    const noseY  = getNoseY(poseLm)
    return noseY !== null ? wristY < noseY - 0.08 : wristY < 0.25
}

const isNearFace = (handLm, poseLm) => {
    const wristY = handLm[0].y
    const noseY  = getNoseY(poseLm)
    return noseY !== null ? wristY < noseY + 0.10 : wristY < 0.50
}

// 손이 이마/머리 높이 (noseY보다 위)
const isForeheadLevel = (handLm, poseLm) => {
    const wristY = handLm[0].y
    const noseY  = getNoseY(poseLm)
    return noseY !== null ? wristY < noseY + 0.05 : wristY < 0.40
}

const isChestLevel = (handLm, poseLm) => {
    const wristY    = handLm[0].y
    const noseY     = getNoseY(poseLm)
    const shoulderY = getShoulderY(poseLm)
    if (noseY !== null && shoulderY !== null)
        return wristY > noseY + 0.08 && wristY < shoulderY + 0.40
    return wristY > 0.44 && wristY < 0.78
}

const isBodyRange = (handLm, poseLm) => {
    const wristY    = handLm[0].y
    const noseY     = getNoseY(poseLm)
    const shoulderY = getShoulderY(poseLm)
    if (noseY !== null && shoulderY !== null)
        return wristY > noseY - 0.10 && wristY < shoulderY + 0.55
    return wristY > 0.28 && wristY < 0.85
}

const isBesideNose = (handLm, poseLm) => {
    const noseX  = getNoseX(poseLm)
    const noseY  = getNoseY(poseLm)
    const wristY = handLm[0].y
    const indexX = handLm[8].x
    if (noseX !== null && noseY !== null)
        return Math.abs(indexX - noseX) < 0.20 && Math.abs(wristY - noseY) < 0.22
    return wristY < 0.48
}

// ══════════════════════════════════════════════════════════════
export class MotionTracker {
    constructor(max = 60) {
        this.buf     = []
        this.buf2    = []
        this.poseBuf = []
        this.MAX     = max
        this._fired     = null
        this._firedTime = 0
        // 상태머신 변수
        this._helloPhase  = 0; this._helloStartY  = 0
        this._sorryPhase  = 0; this._sorryStartY  = 0
        this._likeFrames  = 0
        this._greetFrames = 0
        this._loveFrames  = 0  // 사랑합니다 유지 카운터
    }

    confirmGesture(name) {
        this._fired     = name
        this._firedTime = Date.now()
        this.buf     = this.buf.slice(-6)
        this.buf2    = this.buf2.slice(-6)
        this.poseBuf = this.poseBuf.slice(-6)
        this._helloPhase = 0
        this._sorryPhase = 0
        this._likeFrames = 0
        this._loveFrames = 0
        this._greetFrames = 0
    }

    _cd(name, ms = 2500) {
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
        this._likeFrames = 0; this._loveFrames = 0; this._greetFrames = 0
    }

    _sr(shape, n = 20, buf = this.buf) {
        const pts = buf.slice(-n)
        if (pts.length < 3) return 0
        return pts.filter(p => p.shape === shape).length / pts.length
    }

    _avgY(n = 8, buf = this.buf) {
        const pts = buf.slice(-n)
        if (!pts.length) return 0.5
        return pts.reduce((s, p) => s + p.y, 0) / pts.length
    }

    _latestPose() {
        return this.poseBuf.length ? this.poseBuf[this.poseBuf.length - 1] : null
    }

    _xSwings(pts, dead = 0.012) {
        let sw = 0, dir = 0
        for (let i = 1; i < pts.length; i++) {
            const d = pts[i].x - pts[i - 1].x
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
            const d = pts[i].y - pts[i - 1].y
            if (Math.abs(d) < dead) continue
            const nd = d > 0 ? 1 : -1
            if (dir !== 0 && nd !== dir) sw++
            dir = nd
        }
        return sw
    }

    // ══════════════════════════════════════════════════════════
    //  ⑤ 미안합니다
    //
    //  실제 수어 (이미지 기준):
    //    검지+엄지로 'o'형태(OK sign)를 만들어 이마에 댄 후
    //    아래로 내리면서 손가락을 펴는 동작 (한 손)
    //
    //  감지 전략 — 2단계 상태머신:
    //    Phase 0 → Phase 1: OK sign + 이마/얼굴 높이 감지
    //    Phase 1 → 확정:    손이 0.12 이상 아래로 하강 (open/other 모양으로 변해도 OK)
    // ══════════════════════════════════════════════════════════
    isSorryDown(handLm) {
        if (this._cd('미안합니다')) return false
        const last = this.buf[this.buf.length - 1]
        if (!last) return false
        const poseLm = this._latestPose()
        const { shape, y } = last

        if (this._sorryPhase === 0) {
            // OK sign이 이마/얼굴 높이에 있으면 Phase 1 진입
            const isOk       = shape === 'ok' || shape === 'other'
            const atForehead = handLm
                ? isForeheadLevel(handLm, poseLm)
                : (y < 0.48)
            if (isOk && atForehead) {
                this._sorryPhase  = 1
                this._sorryStartY = y
                console.log('[Sorry] Phase 1 진입, y=', y.toFixed(3))
            }
            return false
        }

        if (this._sorryPhase === 1) {
            // 위로 다시 올라가면 리셋
            if (y < this._sorryStartY - 0.08) {
                this._sorryPhase = 0; return false
            }
            // 손이 0.12 이상 하강하면 확정
            if (y - this._sorryStartY > 0.12) {
                this._sorryPhase = 0; return true
            }
            // 이마에서 너무 멀어지면 (옆으로 빠지면) 리셋
            const stillFaceArea = handLm
                ? (handLm[0].y < (getNoseY(poseLm) ?? 0.5) + 0.30)
                : (y < 0.70)
            if (!stillFaceArea) {
                this._sorryPhase = 0; return false
            }
        }
        return false
    }

    // ══════════════════════════════════════════════════════════
    //  ⑥ 사랑합니다
    //
    //  실제 수어 (이미지 기준):
    //    한 손은 주먹을 쥐고 일자로 세우고,
    //    다른 손은 손바닥을 펴서 주먹 위에서 원을 그리는 동작
    //    (가슴 앞, 양손 근접)
    //
    //  감지 전략:
    //    - 양손 감지
    //    - 한 손 fist/other + 다른 손 open
    //    - 두 손이 가슴 높이에서 X/Y 근접
    //    - open 손의 X 왕복 3회 이상 (원 그리기)
    //    - 일정 프레임 이상 유지 (오인식 방지)
    // ══════════════════════════════════════════════════════════
    isLoveCircle(handLm) {
        if (this._cd('사랑합니다')) return false
        if (this.buf2.length < 8) return false

        const r1 = this.buf.slice(-20)
        const r2 = this.buf2.slice(-20)
        if (r1.length < 10 || r2.length < 10) return false

        const poseLm = this._latestPose()

        // 두 손 평균 위치
        const avgY1 = r1.reduce((s, p) => s + p.y, 0) / r1.length
        const avgY2 = r2.reduce((s, p) => s + p.y, 0) / r2.length
        const avgX1 = r1.reduce((s, p) => s + p.x, 0) / r1.length
        const avgX2 = r2.reduce((s, p) => s + p.x, 0) / r2.length

        // 두 손 모두 가슴 높이
        const chestMin = handLm
            ? (getNoseY(poseLm) ?? 0.35) + 0.05
            : 0.40
        if (avgY1 < chestMin || avgY2 < chestMin) return false
        if (avgY1 > 0.85 || avgY2 > 0.85) return false

        // 두 손 X 간격: 가까이 (원 그리는 위치)
        const xGap = Math.abs(avgX1 - avgX2)
        if (xGap > 0.35) return false

        // 두 손 Y 간격: 비슷한 높이 (0~0.20)
        const yGap = Math.abs(avgY1 - avgY2)
        if (yGap > 0.22) return false

        // 한 손은 fist/other, 다른 손은 open
        const r1FistRatio = r1.filter(p => p.shape === 'fist' || p.shape === 'other').length / r1.length
        const r1OpenRatio = r1.filter(p => p.shape === 'open').length / r1.length
        const r2FistRatio = r2.filter(p => p.shape === 'fist' || p.shape === 'other').length / r2.length
        const r2OpenRatio = r2.filter(p => p.shape === 'open').length / r2.length

        const hasFistOpen = (r1FistRatio >= 0.40 && r2OpenRatio >= 0.40) ||
            (r2FistRatio >= 0.40 && r1OpenRatio >= 0.40)
        if (!hasFistOpen) return false

        // open 손이 X 왕복 3회 이상 (원 그리기 동작)
        const openBuf = r1OpenRatio >= r2OpenRatio ? r1 : r2
        const xSwings = this._xSwings(openBuf, 0.010)

        if (xSwings >= 3) {
            this._loveFrames++
        } else {
            this._loveFrames = 0
        }

        // 10프레임 이상 유지 (약 0.3초)
        return this._loveFrames >= 10
    }

    // ══════════════════════════════════════════════════════════
    //  ① 안녕하세요
    //
    //  [A] 단일 손 하강: open 포함 모든 손, 몸통 범위에서 0.08 이상 하강
    //  [B] 양손 동시 하강: 두 손 모두 0.06 이상 하강
    // ══════════════════════════════════════════════════════════
    isHelloDown(handLm) {
        if (this._cd('안녕하세요')) return false
        const last = this.buf[this.buf.length - 1]
        if (!last) return false
        const poseLm = this._latestPose()
        const { shape, y } = last

        // 미안합니다 phase 중이면 안녕하세요 차단
        if (this._sorryPhase === 1) return false

        // ── [B] 양손 동시 하강 ────────────────────────────────
        if (this.buf2.length >= 6) {
            const pts1 = this.buf.slice(-14)
            const pts2 = this.buf2.slice(-14)
            if (pts1.length >= 6 && pts2.length >= 6) {
                const yDelta1 = pts1[pts1.length - 1].y - pts1[0].y
                const yDelta2 = pts2[pts2.length - 1].y - pts2[0].y
                const ys1 = pts1.map(p => p.y)
                const ys2 = pts2.map(p => p.y)
                if (yDelta1 > 0.06 && yDelta2 > 0.06 &&
                    (Math.max(...ys1) - Math.min(...ys1)) > 0.05 &&
                    (Math.max(...ys2) - Math.min(...ys2)) > 0.05) {
                    let d1 = 0, d2 = 0
                    for (let i = 1; i < pts1.length; i++) {
                        if (pts1[i].y > pts1[i - 1].y + 0.002) d1++
                        if (pts2[i]?.y > pts2[i - 1]?.y + 0.002) d2++
                    }
                    if (d1 / (pts1.length - 1) > 0.45 &&
                        d2 / (pts2.length - 1) > 0.45) return true
                }
            }
        }

        // ── [A] 단일 손 하강 상태머신 ────────────────────────
        const validShape = shape !== 'thumbUp' && shape !== 'index' && shape !== 'ok'
        const inBody     = handLm ? isBodyRange(handLm, poseLm) : (y > 0.28 && y < 0.85)
        const tooHigh    = handLm ? isTooHigh(handLm, poseLm)   : (y < 0.25)

        if (this._helloPhase === 0) {
            if (validShape && inBody && !tooHigh) {
                this._helloPhase  = 1
                this._helloStartY = y
            }
            return false
        }
        if (this._helloPhase === 1) {
            if (!validShape || this._sorryPhase === 1) {
                this._helloPhase = 0; return false
            }
            if (y < this._helloStartY - 0.12) { this._helloPhase = 0; return false }
            if (y - this._helloStartY > 0.08)  { this._helloPhase = 0; return true  }
        }
        return false
    }

    // ══════════════════════════════════════════════════════════
    //  ② 만나서 반갑습니다
    // ══════════════════════════════════════════════════════════
    isGreet(handLm) {
        if (this._cd('만나서 반갑습니다')) return false
        const poseLm = this._latestPose()
        const noseY  = getNoseY(poseLm)

        // [반갑습니다]: thumbUp + 가슴 높이 + Y 왕복
        if (this._sr('thumbUp', 16) >= 0.40) {
            const chest = handLm ? isChestLevel(handLm, poseLm) : (this._avgY(10) > 0.42)
            if (chest) {
                const pts = this.buf.slice(-22)
                if (pts.length >= 12) {
                    const ys = pts.map(p => p.y)
                    if (Math.max(...ys) - Math.min(...ys) > 0.03 &&
                        this._ySwings(pts, 0.010) >= 2) return true
                }
            }
        }

        // [만나서]: 양손 검지 + 얼굴 레벨 + X 거리 감소
        if (this.buf2.length >= 8 &&
            this._sr('index', 16, this.buf)  >= 0.40 &&
            this._sr('index', 16, this.buf2) >= 0.40) {
            const recent1 = this.buf.slice(-12)
            const recent2 = this.buf2.slice(-12)
            if (recent1.length >= 8 && recent2.length >= 8) {
                const avgY1 = recent1.reduce((s, p) => s + p.y, 0) / recent1.length
                const avgY2 = recent2.reduce((s, p) => s + p.y, 0) / recent2.length
                const faceTh = noseY !== null ? noseY + 0.25 : 0.60
                if (avgY1 <= faceTh && avgY2 <= faceTh) {
                    const dists = recent1.map((p, i) =>
                        recent2[i] ? Math.abs(p.x - recent2[i].x) : null
                    ).filter(Boolean)
                    if (dists.length >= 6) {
                        const s = dists.slice(0, 3).reduce((a, b) => a + b, 0) / 3
                        const e = dists.slice(-3).reduce((a, b) => a + b, 0) / 3
                        if (s - e > 0.04) return true
                    }
                }
            }
        }
        return false
    }

    // ══════════════════════════════════════════════════════════
    //  ③ 고맙습니다 — 펼친 손 가슴 높이에서 하강
    // ══════════════════════════════════════════════════════════
    isThanksDown(handLm) {
        if (this._cd('고맙습니다')) return false
        if (this._sr('open', 16) < 0.35) return false
        const pts    = this.buf.slice(-20)
        if (pts.length < 10) return false
        const poseLm = this._latestPose()
        const chest  = handLm ? isChestLevel(handLm, poseLm) : (this._avgY(12) > 0.44)
        if (!chest) return false
        const face   = handLm ? isNearFace(handLm, poseLm)   : (this._avgY(12) < 0.44)
        if (face) return false
        const ys = pts.map(p => p.y)
        const xs = pts.map(p => p.x)
        const yR = Math.max(...ys) - Math.min(...ys)
        const xR = Math.max(...xs) - Math.min(...xs)
        if (yR < 0.035 || xR > yR * 2.0) return false
        let down = 0
        for (let i = 1; i < pts.length; i++)
            if (pts[i].y > pts[i - 1].y + 0.002) down++
        return down / (pts.length - 1) > 0.45
    }

    // ══════════════════════════════════════════════════════════
    //  ④ 좋아합니다 — 검지 코 옆 유지
    // ══════════════════════════════════════════════════════════
    isLikeNose(handLm) {
        if (this._cd('좋아합니다')) return false
        const last = this.buf[this.buf.length - 1]
        if (!last) return false
        if (last.shape !== 'index') { this._likeFrames = 0; return false }
        const poseLm = this._latestPose()
        const beside = handLm ? isBesideNose(handLm, poseLm) : (last.y < 0.48)
        if (!beside) { this._likeFrames = 0; return false }
        const pts = this.buf.slice(-10)
        if (pts.length < 8) return false
        const xR = Math.max(...pts.map(p => p.x)) - Math.min(...pts.map(p => p.x))
        const yR = Math.max(...pts.map(p => p.y)) - Math.min(...pts.map(p => p.y))
        if (xR < 0.07 && yR < 0.07) { this._likeFrames++ }
        else { this._likeFrames = 0 }
        return this._likeFrames >= 15
    }
}

// ══════════════════════════════════════════════════════════════
//  RULES — 우선순위 순서
//  미안합니다(이마→하강)와 안녕하세요(팔 쓸어내리기)를 명확히 분리
//  사랑합니다는 양손 필요 → 단독 손 동작과 충돌 없음
// ══════════════════════════════════════════════════════════════
export const RULES = [
    {
        name: '미안합니다', emoji: '🙇',
        meaning: 'OK손을 이마에 댄 후 아래로 내리며 손을 펴는 동작',
        pose: 'fist', type: 'motion',
        chk: (lm, m) => m.isSorryDown(lm),
    },
    {
        name: '사랑합니다', emoji: '❤️',
        meaning: '한 손 주먹 세우고 다른 손 손바닥으로 주먹 위에서 원 그리기',
        pose: 'love', type: 'motion',
        chk: (lm, m) => m.isLoveCircle(lm),
    },
    {
        name: '좋아합니다', emoji: '👍',
        meaning: '검지를 코 옆에 대고 유지하는 동작',
        pose: 'thumbUp', type: 'motion',
        chk: (lm, m) => m.isLikeNose(lm),
    },
    {
        name: '만나서 반갑습니다', emoji: '🤝',
        meaning: '양손 검지를 얼굴 앞에서 가운데로 모으거나 엄지로 위아래 끄덕이는 동작',
        pose: 'point', type: 'motion',
        chk: (lm, m) => m.isGreet(lm),
    },
    {
        name: '고맙습니다', emoji: '🙏',
        meaning: '펼친 손을 가슴 높이에서 아래로 내리는 동작',
        pose: 'thanks', type: 'motion',
        chk: (lm, m) => m.isThanksDown(lm),
    },
    {
        name: '안녕하세요', emoji: '👋',
        meaning: '오른손으로 왼팔을 쓸어내리거나 두 손을 아래로 내리는 동작',
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