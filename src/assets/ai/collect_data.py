import os, cv2, time, numpy as np
from PIL import ImageFont, ImageDraw, Image

# mediapipe 0.10.30+ 새로운 import 방식
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision
import mediapipe as mp

# ── 1. 장소별 수어 클래스 정의 (SignBridge) ─────────────────────────
PLACES = {
    '개인':    ['안녕하세요', '만나서반갑습니다', '좋아합니다', '고맙습니다', '미안합니다'],
    '출입국':  ['비자', '변경', '여권', '서류', '신청', '외국인등록증', '왔습니다'],
    '병원':    ['아파요', '머리', '배', '열나요', '약', '처방전', '진료', '예약'],
    '학교':    ['선생님', '수업', '질문', '이해안돼요', '숙제', '시험', '공부'],
    '공항':    ['티켓', '짐', '탑승구', '환전', '비행기', '연착', '화장실'],
    '경찰서':  ['잃어버렸어요', '사고', '신고', '도둑', '피해', '증거'],
}

# 수집할 장소 선택 — 원하는 장소만 주석 해제
CURRENT_PLACE = '개인'       # ← 지금 수집할 장소

CLASSES = PLACES[CURRENT_PLACE]

print(f'\n[SignBridge] 현재 장소: {CURRENT_PLACE}')
print(f'[SignBridge] 수집할 단어 ({len(CLASSES)}개): {CLASSES}')

# ── 2. 설정 ───────────────────────────────────────────────────────
SEQ_LEN     = 30
TARGET_SAMP = 50
SAVE_DIR    = 'data/raw'
os.makedirs(SAVE_DIR, exist_ok=True)

# ── 3. MediaPipe Hands 초기화 (0.10.30+ 방식) ─────────────────────
# hand_landmarker.task 파일이 필요합니다. 없으면 자동 다운로드합니다.
TASK_FILE = 'hand_landmarker.task'

def download_task_file():
    import urllib.request
    url = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task'
    print(f'[초기화] hand_landmarker.task 다운로드 중...')
    urllib.request.urlretrieve(url, TASK_FILE)
    print('[초기화] 다운로드 완료!')

if not os.path.exists(TASK_FILE):
    download_task_file()

# HandLandmarker 설정
BaseOptions = mp_python.BaseOptions
HandLandmarker = vision.HandLandmarker
HandLandmarkerOptions = vision.HandLandmarkerOptions
VisionRunningMode = vision.RunningMode

options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=TASK_FILE),
    running_mode=VisionRunningMode.IMAGE,
    num_hands=1,
    min_hand_detection_confidence=0.75,
    min_hand_presence_confidence=0.65,
    min_tracking_confidence=0.65,
)
detector = HandLandmarker.create_from_options(options)


def normalize_landmarks(landmarks, prev_pts=None):
    """server.py와 동일한 131차원 정규화
    위치(63) + velocity(63) + 굴곡각(5) = 131차원
    """
    pts   = np.array([[l.x, l.y, l.z] for l in landmarks], dtype=np.float32)  # (21,3)
    wrist = pts[0]
    mcp   = pts[9]
    scale = float(np.linalg.norm(mcp - wrist)) or 1.0

    # 위치 정규화 (63차원)
    pos = ((pts - wrist) / scale).reshape(-1)

    # velocity (63차원) — 이전 프레임 없으면 0
    if prev_pts is not None:
        vel = ((pts - prev_pts) / scale).reshape(-1)
    else:
        vel = np.zeros(63, dtype=np.float32)

    # 손가락 굴곡각 (5차원)
    finger_tips  = [4, 8, 12, 16, 20]
    finger_bases = [2, 5,  9, 13, 17]
    angles = []
    for tip, base in zip(finger_tips, finger_bases):
        v1 = pts[tip]  - pts[base]
        v2 = pts[0]    - pts[base]
        cos = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
        angles.append(float(np.clip(cos, -1, 1)))

    return np.concatenate([pos, vel, np.array(angles)]), pts  # (131,), pts for next frame

def draw_hand_landmarks(frame, landmarks):
    """새 API 랜드마크를 화면에 그리기"""
    h, w = frame.shape[:2]
    for lm in landmarks:
        cx, cy = int(lm.x * w), int(lm.y * h)
        cv2.circle(frame, (cx, cy), 4, (0, 255, 0), -1)
    # 손가락 연결선 (HAND_CONNECTIONS)
    connections = [
        (0,1),(1,2),(2,3),(3,4),
        (0,5),(5,6),(6,7),(7,8),
        (5,9),(9,10),(10,11),(11,12),
        (9,13),(13,14),(14,15),(15,16),
        (13,17),(17,18),(18,19),(19,20),
        (0,17)
    ]
    for a, b in connections:
        ax, ay = int(landmarks[a].x * w), int(landmarks[a].y * h)
        bx, by = int(landmarks[b].x * w), int(landmarks[b].y * h)
        cv2.line(frame, (ax, ay), (bx, by), (0, 200, 0), 2)

def count_samples(cls_name):
    if not os.path.exists(SAVE_DIR): return 0
    return len([f for f in os.listdir(SAVE_DIR) if f.startswith(cls_name+'_') and f.endswith('.npy')])

def save_sequence(cls_name, seq):
    idx  = count_samples(cls_name) + 1
    path = os.path.join(SAVE_DIR, f'{cls_name}_{idx:03d}.npy')
    np.save(path, np.array(seq))
    return path

def put_korean(frame, text, pos, size=28, color=(255,255,255)):
    """PIL로 한국어 텍스트를 OpenCV 프레임에 그리기"""
    img_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    draw    = ImageDraw.Draw(img_pil)
    # Windows 기본 한국어 폰트 경로
    font_paths = [
        'C:/Windows/Fonts/malgun.ttf',       # 맑은 고딕
        'C:/Windows/Fonts/gulim.ttc',         # 굴림
        'C:/Windows/Fonts/NanumGothic.ttf',   # 나눔고딕 (설치된 경우)
    ]
    font = None
    for fp in font_paths:
        if os.path.exists(fp):
            font = ImageFont.truetype(fp, size)
            break
    if font is None:
        font = ImageFont.load_default()
    draw.text(pos, text, font=font, fill=color[::-1])  # RGB
    return cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)

def draw_ui(frame, cls_name, n_saved, recording, buffer_len, countdown):
    h, w = frame.shape[:2]
    frame = frame.copy()
    color = (0, 0, 255) if recording else (40, 40, 40)
    cv2.rectangle(frame, (0, 0), (w, 80), color, -1)

    # 한국어 단어 표시
    frame = put_korean(frame, f'수어: {cls_name}', (20, 8), size=32, color=(255,255,255))

    # 진행률 바
    progress = min(n_saved / TARGET_SAMP, 1.0)
    cv2.rectangle(frame, (20, 55), (w-20, 70), (100, 100, 100), -1)
    cv2.rectangle(frame, (20, 55), (20 + int((w-40)*progress), 70), (0, 255, 0), -1)
    frame = put_korean(frame, f'{n_saved}/{TARGET_SAMP}', (w//2-25, 52), size=18, color=(255,255,255))

    if recording:
        pct = int((buffer_len / SEQ_LEN) * 100)
        frame = put_korean(frame, f'녹화 중... {pct}%', (w//2-70, h-50), size=28, color=(0,0,255))
    elif countdown > 0:
        frame = put_korean(frame, f'준비... {countdown}', (w//2-60, h//2-30), size=60, color=(0,255,255))
    else:
        frame = put_korean(frame, 'SPACE:녹화  N:다음  P:이전  D:삭제  Q:종료',
                           (20, h-35), size=18, color=(200,200,200))
    return frame

def main():
    cap = cv2.VideoCapture(0)
    cls_idx, recording, buffer, countdown, cd_start = 0, False, [], 0, 0
    prev_pts = None  # velocity 계산용

    print(f'\n[SignBridge] {CURRENT_PLACE} 수어 {len(CLASSES)}개 수집 시작!')
    print('단어:', ', '.join(CLASSES))

    while True:
        ret, frame = cap.read()
        if not ret: break
        frame = cv2.flip(frame, 1)

        cls_name = CLASSES[cls_idx]
        n_saved  = count_samples(cls_name)

        # 새 API: mp.Image로 변환 후 detect
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB,
                            data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        result = detector.detect(mp_image)

        if result.hand_landmarks:
            landmarks = result.hand_landmarks[0]  # 첫 번째 손
            draw_hand_landmarks(frame, landmarks)
            lm_norm, prev_pts_val = normalize_landmarks(landmarks, prev_pts if 'prev_pts' in dir() else None)
            prev_pts = prev_pts_val

            if recording:
                buffer.append(lm_norm)
                if len(buffer) >= SEQ_LEN:
                    save_sequence(cls_name, buffer)
                    buffer, recording = [], False
                    prev_pts = None
                    print(f' >> [{cls_name}] 저장 완료! ({n_saved+1}/{TARGET_SAMP})')

        if countdown > 0:
            elapsed = time.time() - cd_start
            countdown = max(0, 3 - int(elapsed))
            if countdown == 0:
                recording = True
                buffer = []

        frame = draw_ui(frame, cls_name, n_saved, recording, len(buffer), countdown)
        cv2.imshow('SignBridge Data Collector', frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'): break
        elif key == ord(' '):
            if not recording and countdown == 0:
                countdown, cd_start = 3, time.time()
        elif key == ord('n'):
            cls_idx = (cls_idx + 1) % len(CLASSES)
            recording = False; buffer = []
        elif key == ord('p'):
            cls_idx = (cls_idx - 1) % len(CLASSES)
            recording = False; buffer = []
        elif key == ord('d'):
            for f in os.listdir(SAVE_DIR):
                if f.startswith(cls_name+'_'):
                    os.remove(os.path.join(SAVE_DIR, f))
            print(f' !! [{cls_name}] 데이터 삭제됨')

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    main()