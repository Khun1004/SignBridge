# ══════════════════════════════════════════════════════════════
#  server.py  v4 — 앱(모바일) + 웹 동시 지원
#
#  필수 패키지 (최초 1회):
#    pip install fastapi uvicorn websockets numpy httpx
#    pip install tensorflow tf-keras
#    pip install mediapipe opencv-python
# ══════════════════════════════════════════════════════════════
import os, json, asyncio, base64, numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import tensorflow as tf
import httpx
from difflib import SequenceMatcher
import cv2
import mediapipe as mp

# ── 설정 ───────────────────────────────────────────────────────
MODEL_PATH  = 'models/sign_lstm.h5'
LABEL_PATH  = 'models/label_map.json'
SEQ_LEN     = 30
CONF_THRESH = 0.75
FLUSH_SEC   = 4.0

# ★ FBX 파일 경로 — assets/animations 폴더 절대경로
#   server.py 위치 기준으로 상대경로도 가능
FBX_DIR = r"D:\SignBridge_App\assets\animations"

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')

app = FastAPI(title='수어 인식 서버', version='4.0.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

# ── FBX 파일 정적 서빙 (아바타용) ────────────────────────────
# http://서버IP:8000/animations/Idle.fbx 로 접근 가능
if os.path.exists(FBX_DIR):
    app.mount("/animations", StaticFiles(directory=FBX_DIR), name="animations")
    print(f'[server] FBX 서빙: {FBX_DIR}')
else:
    print(f'[server] ⚠ FBX 폴더 없음: {FBX_DIR}')

# ══════════════════════════════════════════════════════════════
#  MediaPipe Hands 초기화
# ══════════════════════════════════════════════════════════════
mp_hands = mp.solutions.hands
hands_detector = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.6,
)
print('[server] MediaPipe Hands 초기화 완료')

# ══════════════════════════════════════════════════════════════
#  모델 & 레이블 로드
# ══════════════════════════════════════════════════════════════
print('[server] 모델 로드 중...')
try:
    model   = tf.keras.models.load_model(MODEL_PATH)
    with open(LABEL_PATH, encoding='utf-8') as f:
        lmap = json.load(f)
    CLASSES = lmap['classes']
    print(f'[server] 모델 로드 완료 — {len(CLASSES)}개 클래스: {CLASSES}')
except Exception as e:
    print(f'[server] ⚠ 모델 로드 실패 (데모 모드): {e}')
    model   = None
    CLASSES = []

# ══════════════════════════════════════════════════════════════
#  정규화 (train_model.py 와 동일 — 131차원)
# ══════════════════════════════════════════════════════════════
def normalize(lm: list, prev_lm: list = None) -> np.ndarray:
    if lm and isinstance(lm[0], dict):
        lm = [[p['x'], p['y'], p['z']] for p in lm]
    if prev_lm and isinstance(prev_lm[0], dict):
        prev_lm = [[p['x'], p['y'], p['z']] for p in prev_lm]

    pts   = np.array(lm, dtype=np.float32)
    wrist = pts[0]
    mcp   = pts[9]
    scale = float(np.linalg.norm(mcp - wrist)) or 1.0
    pos   = ((pts - wrist) / scale).reshape(-1)  # 63차원

    if prev_lm is not None:
        prev_pts = np.array(prev_lm, dtype=np.float32)
        vel = ((pts - prev_pts) / scale).reshape(-1)
    else:
        vel = np.zeros(63, dtype=np.float32)

    finger_tips = [4, 8, 12, 16, 20]
    finger_mcps = [2, 5,  9, 13, 17]
    angles = []
    for tip, base in zip(finger_tips, finger_mcps):
        v1  = pts[tip] - pts[base]
        v2  = pts[0]   - pts[base]
        cos = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
        angles.append(float(np.clip(cos, -1, 1)))

    return np.concatenate([pos, vel, angles])  # (131,)

# ══════════════════════════════════════════════════════════════
#  JPEG base64 → MediaPipe 랜드마크 추출
# ══════════════════════════════════════════════════════════════
def extract_landmarks_from_frame(b64_image: str):
    try:
        img_bytes = base64.b64decode(b64_image)
        nparr     = np.frombuffer(img_bytes, np.uint8)
        frame     = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return None, None

        rgb    = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = hands_detector.process(rgb)

        if not result.multi_hand_landmarks:
            return None, None

        hand      = result.multi_hand_landmarks[0]
        lm_list   = [[l.x, l.y, l.z] for l in hand.landmark]
        lm_client = [{'x': l.x, 'y': l.y, 'z': l.z} for l in hand.landmark]
        return lm_list, lm_client

    except Exception as e:
        print(f'[frame] 추출 오류: {e}')
        return None, None

# ══════════════════════════════════════════════════════════════
#  SignSession — 클라이언트별 상태
# ══════════════════════════════════════════════════════════════
class SignSession:
    def __init__(self):
        self.seq_buf   = []
        self.tok_buf   = []
        self.last_det  = 0.0
        self.last_word = ''
        self.prev_lm   = None
        self.lock      = asyncio.Lock()
        self.place     = 'personal'

    def push_frame(self, lm_norm: np.ndarray):
        self.seq_buf.append(lm_norm)
        if len(self.seq_buf) > SEQ_LEN:
            self.seq_buf.pop(0)

    def predict(self):
        if model is None or len(self.seq_buf) < SEQ_LEN:
            return None
        X     = np.array(self.seq_buf, dtype=np.float32)[np.newaxis]
        probs = model.predict(X, verbose=0)[0]
        idx   = int(np.argmax(probs))
        conf  = float(probs[idx])
        return (CLASSES[idx], conf) if conf >= CONF_THRESH else None

# ══════════════════════════════════════════════════════════════
#  자막 생성 (Claude API)
# ══════════════════════════════════════════════════════════════
PLACE_CONTEXT = {
    'personal':    ('개인 사용자', '청각장애인 개인 사용자와의 대화 상황.'),
    'hospital':    ('병원', '의사·간호사에게 증상을 설명하는 상황.'),
    'immigration': ('출입국관리사무소', '비자·체류·여권 업무를 요청하는 상황.'),
    'school':      ('학교', '선생님·교직원과 대화하는 상황.'),
    'airport':     ('공항', '탑승·수화물·이동을 문의하는 상황.'),
    'police':      ('경찰서', '경찰관에게 사건·신고·피해를 전달하는 상황.'),
    '개인':                ('개인 사용자', '일상적인 대화 상황.'),
    '출입국관리사무소':     ('출입국관리사무소', '비자·체류 업무 상황.'),
    '출입국외국인사무소':   ('출입국관리사무소', '비자·체류 업무 상황.'),
    '공항':                ('공항', '항공 관련 상황.'),
    '병원':                ('병원', '진료 상황.'),
    '경찰서':              ('경찰서', '신고 상황.'),
}

ORG_TYPE_NORMALIZE = {
    '개인': 'personal', '출입국관리사무소': 'immigration',
    '출입국외국인사무소': 'immigration', '공항': 'airport',
    '병원': 'hospital', '경찰서': 'police',
}

def normalize_place(place: str) -> str:
    if not place:
        return 'personal'
    return ORG_TYPE_NORMALIZE.get(place, place)

async def build_sentence(words: list, place: str = 'immigration') -> str:
    if not words:
        return ''
    clean_words = words if isinstance(words[0], str) else [w for w, _ in words]
    if not ANTHROPIC_API_KEY:
        return ' '.join(clean_words)

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
                        f'수어 인식 자막 시스템. 장소: {place_name}. {place_desc}\n'
                        '규칙: 인식된 단어로 자연스러운 존댓말 문장 생성.\n'
                        'JSON만 출력: {"sentence":"..."}'
                    ),
                    'messages': [{'role': 'user', 'content': f'인식된 단어: [{", ".join(clean_words)}]'}],
                },
            )
        raw    = res.json()['content'][0]['text']
        parsed = json.loads(raw.replace('```json', '').replace('```', '').strip())
        return parsed.get('sentence', ' '.join(clean_words))
    except Exception as e:
        print(f'[sentence] fallback: {e}')
        return ' '.join(clean_words)

# ══════════════════════════════════════════════════════════════
#  공통 인식 처리
# ══════════════════════════════════════════════════════════════
async def process_landmarks(ws: WebSocket, session: SignSession, lm: list):
    lm_norm = normalize(lm, session.prev_lm)
    session.prev_lm = lm
    session.push_frame(lm_norm)

    result = session.predict()
    if result:
        name, conf = result
        now = asyncio.get_event_loop().time()
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
            session.seq_buf.clear()

# ══════════════════════════════════════════════════════════════
#  ① 웹용 WebSocket — 랜드마크 직접 수신
#  ws://서버IP:8000/ws/sign
# ══════════════════════════════════════════════════════════════
@app.websocket('/ws/sign')
async def ws_sign(ws: WebSocket):
    await ws.accept()
    session = SignSession()
    print('[ws/sign] 웹 클라이언트 연결')

    async def auto_flush():
        while True:
            await asyncio.sleep(1.0)
            async with session.lock:
                idle = asyncio.get_event_loop().time() - session.last_det
                if session.tok_buf and idle >= FLUSH_SEC:
                    words    = session.tok_buf.copy()
                    session.tok_buf.clear()
                    sentence = await build_sentence(words, place=session.place)
                    await ws.send_json({'type': 'subtitle', 'sentence': sentence, 'words': words})

    flush_task = asyncio.create_task(auto_flush())
    try:
        while True:
            data = await ws.receive_json()
            if data.get('type') == 'set_place':
                session.place = normalize_place(data.get('place', 'personal'))
                continue
            lm = data.get('landmarks')
            if not lm or len(lm) != 21:
                continue
            await process_landmarks(ws, session, lm)
    except WebSocketDisconnect:
        print('[ws/sign] 웹 연결 종료')
    finally:
        flush_task.cancel()

# ══════════════════════════════════════════════════════════════
#  ② 앱용 WebSocket — JPEG base64 이미지 수신
#  ws://서버IP:8000/ws/sign/frame
# ══════════════════════════════════════════════════════════════
@app.websocket('/ws/sign/frame')
async def ws_sign_frame(ws: WebSocket):
    await ws.accept()
    session = SignSession()
    print('[ws/sign/frame] 앱 클라이언트 연결')

    async def auto_flush():
        while True:
            await asyncio.sleep(1.0)
            async with session.lock:
                idle = asyncio.get_event_loop().time() - session.last_det
                if session.tok_buf and idle >= FLUSH_SEC:
                    words    = session.tok_buf.copy()
                    session.tok_buf.clear()
                    sentence = await build_sentence(words, place=session.place)
                    await ws.send_json({'type': 'subtitle', 'sentence': sentence, 'words': words})

    flush_task = asyncio.create_task(auto_flush())
    try:
        while True:
            data     = await ws.receive_json()
            msg_type = data.get('type', 'frame')

            if msg_type == 'set_place':
                session.place = normalize_place(data.get('place', 'personal'))
                continue

            if msg_type == 'frame':
                b64 = data.get('image', '')
                if not b64:
                    continue

                loop = asyncio.get_event_loop()
                lm_list, lm_client = await loop.run_in_executor(
                    None, extract_landmarks_from_frame, b64
                )

                if lm_list is None:
                    await ws.send_json({'type': 'no_hand'})
                    session.prev_lm = None
                    continue

                # 랜드마크 오버레이용으로 앱에 전송
                await ws.send_json({
                    'type':  'landmarks',
                    'hands': [lm_client],
                })

                # LSTM 추론
                await process_landmarks(ws, session, lm_list)

    except WebSocketDisconnect:
        print('[ws/sign/frame] 앱 연결 종료')
    except Exception as e:
        print(f'[ws/sign/frame] 오류: {e}')
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
        'fbx_dir': FBX_DIR,
        'endpoints': {
            'web':        'ws://HOST:8000/ws/sign',
            'app':        'ws://HOST:8000/ws/sign/frame',
            'animations': 'http://HOST:8000/animations/Idle.fbx',
        }
    }

# ══════════════════════════════════════════════════════════════
#  실행
# ══════════════════════════════════════════════════════════════
if __name__ == '__main__':
    import uvicorn
    print('\n=== 수어 인식 서버 v4 시작 ===')
    print('  웹  WebSocket: ws://0.0.0.0:8000/ws/sign')
    print('  앱  WebSocket: ws://0.0.0.0:8000/ws/sign/frame')
    print('  FBX 서빙:      http://0.0.0.0:8000/animations/')
    print('  헬스체크:      http://localhost:8000/')
    print('  종료:          Ctrl+C\n')
    uvicorn.run(app, host='0.0.0.0', port=8000, log_level='warning')