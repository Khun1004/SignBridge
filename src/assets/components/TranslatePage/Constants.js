// ══════════════════════════════════════════════════════════════
//  상수 및 설정값
// ══════════════════════════════════════════════════════════════

export const TM_MODEL_URL = 'https://teachablemachine.withgoogle.com/models/VVpWDxtXv/'
export const TM_THRESHOLD = 0.85;
export const TM_ENABLED   = !TM_MODEL_URL.includes('3B70MNM8c')

export const STABLE   = 3     // 동작 확정 더 빠르게 (6→3)
export const COOLDOWN = 1500  // 같은 동작 재인식 대기
export const FLUSH    = 6000  // 6초 침묵 후 자막 생성
export const MAX_TOKS = 10

export const PLACE_LABEL = {
    personal:    '개인 사용자',
    immigration: '출입국관리소',
    airport:     '공항',
    hospital:    '병원',
    police:      '경찰서',
}

// animType → pose 매핑
// TM 학습 클래스명 → POSE_CFG 키 연결
export const A2P = {
    // TM 클래스명 (한글 포함) → pose 키
    '안녕하세요':       'hello',
    '만나서반갑습니다':  'point',
    '만나서 반갑습니다': 'point',
    '고맙습니다':       'thanks',
    '좋아합니다':       'thumbUp',
    '미안합니다':       'fist',
    // 영문 별칭
    hello:      'hello',
    nice:       'point',
    thanks:     'thanks',
    thumbUp:    'thumbUp',
    sorry:      'fist',
    thumbDown:  'thumbDown',
    love:       'love',
}

// 포즈별 색상·라벨 — TM 학습 5종 + idle
export const POSE_CFG = {
    idle:      { c: '#7c6fff', l: '' },
    hello:     { c: '#7c6fff', l: '안녕하세요!' },
    point:     { c: '#06b6d4', l: '만나서 반갑습니다!' },
    thanks:    { c: '#10b981', l: '고맙습니다!' },
    thumbUp:   { c: '#10b981', l: '좋아합니다!' },
    fist:      { c: '#f59e0b', l: '미안합니다!' },
    // 추가 보조 포즈
    thumbDown: { c: '#ef4444', l: '싫어합니다' },
    love:      { c: '#e11d48', l: '사랑합니다' },
}

// 유효 animType Set
export const VAT = new Set([
    'hello','point','thanks','thumbUp','fist',
    'thumbDown','love',
])

// ── 엔진 모드 ─────────────────────────────────────────────
// 'mediapipe' : Rule-based (정적 손 모양 — 학습 불필요)
// 'tm'        : Teachable Machine (복잡한 동작 — TM에서 미리 학습)
export const ENGINE_DEFAULT = 'mediapipe'