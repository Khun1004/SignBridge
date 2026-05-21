# ══════════════════════════════════════════════════════════════
#  필수 패키지 설치 (최초 1회)
#  pip install fastapi uvicorn websockets numpy httpx
#  pip install tensorflow   (CUDA 없으면 CPU 버전)
#  pip install tf-keras     ← "No module named 'keras'" 오류 해결
# ══════════════════════════════════════════════════════════════
import os, json, asyncio, numpy as np
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import httpx                    # Claude API 호출용
from difflib import SequenceMatcher

# ── 설정 ───────────────────────────────────────────────────────
MODEL_PATH  = 'models/sign_lstm.h5'
LABEL_PATH  = 'models/label_map.json'
SEQ_LEN     = 30
N_FEATURES  = 21 * 3          # 63
CONF_THRESH = 0.75             # LSTM 신뢰도 임계값
FLUSH_SEC   = 4.0              # 침묵 N초 후 자막 생성

# Claude API (선택 — 없으면 단순 단어 연결로 fallback)
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')

app = FastAPI(title='수어 인식 서버', version='3.0.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

# ══════════════════════════════════════════════════════════════
#  모델 & 레이블 로드 (서버 시작 시 1회)
# ══════════════════════════════════════════════════════════════
print('[server] 모델 로드 중...')
try:
    model     = tf.keras.models.load_model(MODEL_PATH)
    with open(LABEL_PATH, encoding='utf-8') as f:
        lmap  = json.load(f)
    CLASSES   = lmap['classes']
    print(f'[server] 모델 로드 완료 — {len(CLASSES)}개 클래스: {CLASSES}')
except Exception as e:
    print(f'[server] ⚠ 모델 로드 실패: {e}')
    model   = None
    CLASSES = []

# ══════════════════════════════════════════════════════════════
#  정규화 (train_model.py 와 동일한 로직)
# ══════════════════════════════════════════════════════════════
def normalize(lm: list, prev_lm: list = None) -> np.ndarray:
    """랜드마크 + velocity + 손가락 굴곡각 → (63+63+5,) = 131차원"""
    # 딕셔너리 형태 {x, y, z} 또는 배열 형태 [x, y, z] 모두 처리
    if lm and isinstance(lm[0], dict):
        lm = [[p['x'], p['y'], p['z']] for p in lm]
    if prev_lm and prev_lm[0] and isinstance(prev_lm[0], dict):
        prev_lm = [[p['x'], p['y'], p['z']] for p in prev_lm]
    pts   = np.array(lm, dtype=np.float32)   # (21, 3)
    wrist = pts[0]
    mcp   = pts[9]
    scale = float(np.linalg.norm(mcp - wrist)) or 1.0
    pos   = ((pts - wrist) / scale).reshape(-1)  # 63차원

    # velocity: 이전 프레임과의 차이 (없으면 0)
    if prev_lm is not None:
        prev_pts = np.array(prev_lm, dtype=np.float32)
        vel = ((pts - prev_pts) / scale).reshape(-1)
    else:
        vel = np.zeros(63, dtype=np.float32)

    # 손가락 굴곡각 (5개 손가락의 MCP-PIP-DIP 각도)
    finger_tips  = [4, 8, 12, 16, 20]
    finger_mcps  = [2, 5, 9,  13, 17]
    angles = []
    for tip, base in zip(finger_tips, finger_mcps):
        v1 = pts[tip] - pts[base]
        v2 = pts[0]   - pts[base]
        cos = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
        angles.append(float(np.clip(cos, -1, 1)))

    return np.concatenate([pos, vel, angles])

# ══════════════════════════════════════════════════════════════
#  LSTM 시퀀스 버퍼 (클라이언트 연결별)
# ══════════════════════════════════════════════════════════════
class SignSession:
    def __init__(self):
        self.seq_buf   = []
        self.tok_buf   = []      # [(단어, 신뢰도)] 튜플로 변경
        self.last_det  = 0.0
        self.last_word = ''
        self.prev_lm   = None   # velocity 계산용 이전 프레임
        self.lock      = asyncio.Lock()
        self.place     = 'personal'     # 로그인 시 선택한 장소 (기본값: 개인)

    def push_frame(self, lm_norm: np.ndarray):
        self.seq_buf.append(lm_norm)
        if len(self.seq_buf) > SEQ_LEN:
            self.seq_buf.pop(0)

    def is_duplicate(self, word: str) -> bool:
        """최근 3개 단어와 유사도 0.85 이상이면 중복으로 판단"""
        recent = [w for w, _ in self.tok_buf[-3:]]
        return any(
            SequenceMatcher(None, word, w).ratio() > 0.85
            for w in recent
        )

    def predict(self):
        if model is None or len(self.seq_buf) < SEQ_LEN:
            return None
        X = np.array(self.seq_buf, dtype=np.float32)[np.newaxis]
        probs = model.predict(X, verbose=0)[0]
        idx   = int(np.argmax(probs))
        conf  = float(probs[idx])
        return (CLASSES[idx], conf) if conf >= CONF_THRESH else None

# ══════════════════════════════════════════════════════════════
#  자막 생성 — Claude API
# ══════════════════════════════════════════════════════════════
PLACE_CONTEXT = {
    # ── 영문 키 (SignupPage orgType 값) ──────────────────────
    'personal':    ('개인 사용자', '청각장애인 개인 사용자와의 대화 상황. 일상적이고 친근한 어휘를 사용하세요.'),
    'hospital':    ('병원', '의사·간호사에게 증상을 설명하는 상황. 진료, 처방, 통증 관련 어휘를 우선 사용하세요.'),
    'immigration': ('출입국관리사무소', '담당자에게 비자·체류·여권 업무를 요청하는 상황. 행정 용어를 명확하게 사용하세요.'),
    'school':      ('학교', '선생님·교직원과 대화하는 상황. 학습·수업·학교생활 관련 어휘를 우선 사용하세요.'),
    'airport':     ('공항', '항공사·출입국 직원에게 탑승·수화물·이동을 문의하는 상황. 항공 용어를 명확하게 사용하세요.'),
    'police':      ('경찰서', '경찰관에게 사건·신고·피해를 전달하는 상황. 정확하고 간결하게 사실을 전달하세요.'),
    # ── 한글 키 fallback (DB에 한글로 저장된 경우 대비) ──────
    '개인':            ('개인 사용자', '청각장애인 개인 사용자와의 대화 상황. 일상적이고 친근한 어휘를 사용하세요.'),
    '출입국관리사무소': ('출입국관리사무소', '담당자에게 비자·체류·여권 업무를 요청하는 상황. 행정 용어를 명확하게 사용하세요.'),
    '출입국외국인사무소': ('출입국관리사무소', '담당자에게 비자·체류·여권 업무를 요청하는 상황. 행정 용어를 명확하게 사용하세요.'),
    '공항':            ('공항', '항공사·출입국 직원에게 탑승·수화물·이동을 문의하는 상황. 항공 용어를 명확하게 사용하세요.'),
    '병원':            ('병원', '의사·간호사에게 증상을 설명하는 상황. 진료, 처방, 통증 관련 어휘를 우선 사용하세요.'),
    '경찰서':          ('경찰서', '경찰관에게 사건·신고·피해를 전달하는 상황. 정확하고 간결하게 사실을 전달하세요.'),
}

# ── orgType 정규화 (한글 → 영문) ─────────────────────────────
ORG_TYPE_NORMALIZE = {
    '개인':              'personal',
    '출입국관리사무소':   'immigration',
    '출입국외국인사무소': 'immigration',
    '공항':              'airport',
    '병원':              'hospital',
    '경찰서':            'police',
}

def normalize_place(place: str) -> str:
    """한글 orgType을 영문 키로 변환. 이미 영문이면 그대로 반환."""
    if not place:
        return 'personal'
    return ORG_TYPE_NORMALIZE.get(place, place)

async def build_sentence(words: list[str], place: str = 'immigration', prev_sentence: str = '') -> str:
    if not words:
        return ''
    if not ANTHROPIC_API_KEY:
        return ' '.join(words)

    # 신뢰도 낮은 단어 필터링 (옵션)
    clean_words = [w for w, c in words] if isinstance(words[0], tuple) else words

    context_hint = f'이전 문장: "{prev_sentence}"\n' if prev_sentence else ''

    place_name, place_desc = PLACE_CONTEXT.get(place, PLACE_CONTEXT['immigration'])

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(
                'https://api.anthropic.com/v1/messages',
                headers={
                    'Content-Type': 'application/json',
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                },
                json={
                    'model': 'claude-sonnet-4-20250514',
                    'max_tokens': 300,
                    'system': (
                        f'수어 인식 실시간 자막 시스템. 현재 장소: {place_name}.\n'
                        f'상황: {place_desc}\n'
                        '규칙:\n'
                        '1. 인식된 단어들로 자연스러운 존댓말 한국어 문장 생성\n'
                        '2. 단어 순서가 바뀌어도 문맥상 자연스럽게 재배열\n'
                        '3. 중복 단어 제거\n'
                        '4. 이전 문장과 이어지는 내용이면 연결해서 작성\n'
                        '5. JSON만 출력: {"sentence":"...", "confidence": 0.0~1.0}'
                    ),
                    'messages': [{
                        'role': 'user',
                        'content': f'{context_hint}인식된 단어: [{", ".join(clean_words)}]',
                    }],
                },
            )
        data = res.json()
        raw  = data['content'][0]['text']
        parsed = json.loads(raw.replace('```json', '').replace('```', '').strip())
        return parsed.get('sentence', ' '.join(clean_words))
    except Exception as e:
        print(f'[sentence] fallback: {e}')
        return ' '.join(clean_words)

# ══════════════════════════════════════════════════════════════
#  WebSocket 엔드포인트
# ══════════════════════════════════════════════════════════════
@app.websocket('/ws/sign')
async def ws_sign(ws: WebSocket):
    await ws.accept()
    session = SignSession()
    print(f'[ws] 클라이언트 연결')

    # 자동 flush 태스크 — FLUSH_SEC 침묵 후 자막 생성
    async def auto_flush():
        while True:
            await asyncio.sleep(1.0)
            async with session.lock:
                idle = asyncio.get_event_loop().time() - session.last_det
                if session.tok_buf and idle >= FLUSH_SEC:
                    words = session.tok_buf.copy()
                    session.tok_buf.clear()
                    sentence = await build_sentence(words, place=session.place)
                    await ws.send_json({
                        'type':     'subtitle',
                        'sentence': sentence,
                        'words':    words,
                    })
                    print(f'[auto-flush] [{session.place}] 자막: "{sentence}"')

    flush_task = asyncio.create_task(auto_flush())

    try:
        while True:
            data = await ws.receive_json()

            # 장소 변경 메시지 처리
            if data.get('type') == 'set_place':
                raw_place = data.get('place', 'personal')
                new_place = normalize_place(raw_place)   # 한글→영문 정규화
                # personal은 PLACE_CONTEXT에 있으므로 get으로 안전하게
                session.place = new_place if new_place in PLACE_CONTEXT else 'personal'
                label = PLACE_CONTEXT.get(session.place, ('알 수 없음',))[0]
                print(f'[ws] 장소 설정: {label} (raw={raw_place} → {session.place})')
                continue

            lm   = data.get('landmarks')   # [[x,y,z] × 21]
            if not lm or len(lm) != 21:
                continue

            # 정규화 + 버퍼 추가
            lm_norm = normalize(lm)
            session.push_frame(lm_norm)

            # LSTM 추론
            result = session.predict()
            if result:
                name, conf = result
                now = asyncio.get_event_loop().time()
                # 같은 단어가 2.5초 내 반복되면 무시
                if name != session.last_word or (now - session.last_det) > 1.5:
                    session.last_word = name
                    session.last_det  = now
                    async with session.lock:
                        session.tok_buf.append(name)
                    print(f'[lstm] {name}  ({conf*100:.0f}%)  버퍼: {session.tok_buf}')
                    await ws.send_json({
                        'type':       'gesture',
                        'gesture':    name,
                        'confidence': round(conf, 3),
                        'source':     'lstm',
                        'tokens':     session.tok_buf.copy(),
                    })
                    session.seq_buf.clear()   # 확정 후 버퍼 리셋

    except WebSocketDisconnect:
        print('[ws] 클라이언트 연결 종료')
    finally:
        flush_task.cancel()

# ══════════════════════════════════════════════════════════════
#  헬스체크
# ══════════════════════════════════════════════════════════════
@app.get('/')
async def health():
    return {
        'status':  'ok',
        'model':   'loaded' if model else 'not loaded',
        'classes': CLASSES,
    }

# ══════════════════════════════════════════════════════════════
#  실행
# ══════════════════════════════════════════════════════════════
if __name__ == '__main__':
    import uvicorn
    print('\n=== 수어 인식 서버 시작 ===')
    print('  WebSocket: ws://localhost:8000/ws/sign')
    print('  헬스체크:  http://localhost:8000/')
    print('  종료:      Ctrl+C\n')
    uvicorn.run(app, host='0.0.0.0', port=8000, log_level='warning')