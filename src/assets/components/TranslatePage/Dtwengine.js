// ══════════════════════════════════════════════════════════════
//  DTW (Dynamic Time Warping) 엔진 v2
//  합성 템플릿 내장 — 앱 시작 시 바로 인식 가능
// ══════════════════════════════════════════════════════════════

const DTW_WIN = 40
const DTW_TH  = 0.50
const SEQ_MIN = 8

// 핵심 키포인트 (손끝 + MCP 관절)
const KP = [4, 8, 12, 16, 20, 5, 9, 13, 0]

export function normalizeLandmarks(lm) {
    const w = lm[0], m = lm[9]
    const s = Math.sqrt((m.x - w.x) ** 2 + (m.y - w.y) ** 2) || 1
    return lm.map(p => [(p.x - w.x) / s, (p.y - w.y) / s, (p.z - w.z) / s])
}

function frameDist(a, b) {
    let s = 0
    for (const i of KP)
        s += (a[i][0]-b[i][0])**2 + (a[i][1]-b[i][1])**2 + (a[i][2]-b[i][2])**2
    return Math.sqrt(s / KP.length)
}

function dtwDist(A, B) {
    const n = A.length, m = B.length
    if (!n || !m) return Infinity
    const w = Math.max(4, Math.abs(n - m)), I = 1e9
    const dp = Array.from({ length: n }, () => new Float32Array(m).fill(I))
    dp[0][0] = frameDist(A[0], B[0])
    for (let i = 1; i < n; i++) {
        const j0 = Math.max(0, i - w), j1 = Math.min(m - 1, i + w)
        for (let j = j0; j <= j1; j++) {
            const c = frameDist(A[i], B[j])
            const p = Math.min(
                j > 0 && dp[i][j-1] < I ? dp[i][j-1] : I,
                i > 0 && dp[i-1][j] < I ? dp[i-1][j] : I,
                i > 0 && j > 0 && dp[i-1][j-1] < I ? dp[i-1][j-1] : I,
            )
            dp[i][j] = c + (p === I ? 0 : p)
        }
    }
    return dp[n-1][m-1] / (n + m)
}

// ══════════════════════════════════════════════════════════════
//  합성 템플릿 생성기
//  MediaPipe 정규화 좌표계 기준으로 손 모양 + 움직임 패턴 생성
//  손목(lm[0])을 원점으로, lm[9]까지 거리를 1로 정규화
// ══════════════════════════════════════════════════════════════

// 주먹 쥔 손 모양 (21개 랜드마크, 정규화 좌표)
// 손가락이 모두 접힌 상태
function makeFistFrame(wristY) {
    return [
        [0, wristY, 0],          // 0 손목
        [-0.3, wristY-0.2, 0],   // 1 엄지MCP
        [-0.5, wristY-0.35, 0],  // 2 엄지IP
        [-0.55, wristY-0.25, 0], // 3 엄지DIP
        [-0.5, wristY-0.15, 0],  // 4 엄지끝
        [-0.1, wristY-0.7, 0],   // 5 검지MCP
        [-0.1, wristY-0.5, 0],   // 6 검지PIP
        [-0.1, wristY-0.3, 0],   // 7 검지DIP
        [-0.1, wristY-0.2, 0],   // 8 검지끝
        [0.1, wristY-0.75, 0],   // 9 중지MCP
        [0.1, wristY-0.5, 0],    // 10 중지PIP
        [0.1, wristY-0.3, 0],    // 11 중지DIP
        [0.1, wristY-0.2, 0],    // 12 중지끝
        [0.3, wristY-0.7, 0],    // 13 약지MCP
        [0.3, wristY-0.5, 0],    // 14 약지PIP
        [0.3, wristY-0.3, 0],    // 15 약지DIP
        [0.3, wristY-0.2, 0],    // 16 약지끝
        [0.5, wristY-0.6, 0],    // 17 새끼MCP
        [0.5, wristY-0.4, 0],    // 18 새끼PIP
        [0.5, wristY-0.25, 0],   // 19 새끼DIP
        [0.5, wristY-0.15, 0],   // 20 새끼끝
    ]
}

// 검지만 세운 손 모양 (만나서 반갑습니다)
function makeIndexFrame(wristX) {
    return [
        [wristX, 0, 0],           // 0 손목
        [wristX-0.3, -0.2, 0],    // 1 엄지MCP
        [wristX-0.5, -0.3, 0],    // 2 엄지IP
        [wristX-0.55, -0.2, 0],   // 3 엄지DIP
        [wristX-0.5, -0.1, 0],    // 4 엄지끝
        [wristX-0.1, -0.7, 0],    // 5 검지MCP
        [wristX-0.1, -1.0, 0],    // 6 검지PIP (펴짐)
        [wristX-0.1, -1.3, 0],    // 7 검지DIP (펴짐)
        [wristX-0.1, -1.6, 0],    // 8 검지끝 (펴짐 - 위로)
        [wristX+0.1, -0.75, 0],   // 9 중지MCP
        [wristX+0.1, -0.5, 0],    // 10 중지PIP (접힘)
        [wristX+0.1, -0.3, 0],    // 11 중지DIP
        [wristX+0.1, -0.2, 0],    // 12 중지끝
        [wristX+0.3, -0.7, 0],    // 13 약지MCP
        [wristX+0.3, -0.5, 0],    // 14 약지PIP (접힘)
        [wristX+0.3, -0.3, 0],    // 15 약지DIP
        [wristX+0.3, -0.2, 0],    // 16 약지끝
        [wristX+0.5, -0.6, 0],    // 17 새끼MCP
        [wristX+0.5, -0.4, 0],    // 18 새끼PIP (접힘)
        [wristX+0.5, -0.25, 0],   // 19 새끼DIP
        [wristX+0.5, -0.15, 0],   // 20 새끼끝
    ]
}

// ── 안녕하세요 템플릿 생성 ────────────────────────────────────
// 1단계: 주먹 쥔 손이 위(Y=-0.3)에서 아래(Y=0.5)로 내려감 (팔 쓸기)
// 2단계: 두 주먹이 아래(Y=0.3)로 내려감
function makeHelloTemplate() {
    const frames = []
    // 1단계: 위에서 아래로 쓸어내리기 (16프레임)
    for (let i = 0; i < 16; i++) {
        const t = i / 15
        const y = -0.3 + t * 0.8  // -0.3 → 0.5
        frames.push(makeFistFrame(y))
    }
    // 2단계: 잠깐 멈춤 (4프레임)
    for (let i = 0; i < 4; i++) frames.push(makeFistFrame(0.5))
    // 3단계: 다시 아래로 내리기 (12프레임)
    for (let i = 0; i < 12; i++) {
        const t = i / 11
        const y = 0.0 + t * 0.6   // 0.0 → 0.6
        frames.push(makeFistFrame(y))
    }
    return frames
}

// ── 만나서 반갑습니다 템플릿 생성 ────────────────────────────
// 검지 세운 손이 좌(-0.4)→우(0.4)→좌(-0.4)→우(0.4)로 흔들림
function makeGreetTemplate() {
    const frames = []
    const xs = [-0.4, 0.4, -0.4, 0.4]  // 좌우 흔들기 4번
    for (let s = 0; s < xs.length - 1; s++) {
        const startX = xs[s], endX = xs[s+1]
        for (let i = 0; i < 8; i++) {
            const t = i / 7
            const x = startX + (endX - startX) * t
            frames.push(makeIndexFrame(x))
        }
    }
    return frames
}

// ══════════════════════════════════════════════════════════════
//  DTWRec 클래스
// ══════════════════════════════════════════════════════════════
export class DTWRec {
    constructor() {
        this.buf = []
        // 합성 템플릿 내장 — 앱 시작 시 바로 인식 가능
        this.tpl = {
            '안녕하세요':       makeHelloTemplate(),
            '만나서 반갑습니다': makeGreetTemplate(),
        }
    }

    push(lm) {
        const normalized = Array.isArray(lm[0])
            ? lm
            : normalizeLandmarks(lm)
        this.buf.push(normalized)
        if (this.buf.length > DTW_WIN) this.buf.shift()
    }

    recognize() {
        if (this.buf.length < SEQ_MIN) return null
        let best = null, bd = DTW_TH
        for (const [n, t] of Object.entries(this.tpl)) {
            const d = dtwDist(this.buf, t)
            if (d < bd) { bd = d; best = n }
        }
        return best ? { name: best, score: bd } : null
    }

    // 개발자가 앱에서 직접 추가 학습 가능 (선택)
    learn(name) {
        if (this.buf.length >= SEQ_MIN) this.tpl[name] = [...this.buf]
    }

    reset() { this.buf = [] }
}

export { DTW_TH, SEQ_MIN }