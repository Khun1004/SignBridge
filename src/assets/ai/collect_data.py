import os, cv2, time, numpy as np

# mediapipe 0.10.30+ 새로운 import 방식
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision
import mediapipe as mp

# ── 1. 장소별 수어 클래스 정의 (SignBridge 확장형) ──────────────────────
COMMON = ['안녕하세요', '감사합니다', '저는', '네', '아니요', '도와주세요', '기다려주세요']

PLACES = {
    '출입국': ['비자', '변경', '여권', '서류', '신청', '외국인등록증', '왔습니다'],
    '병원': ['아파요', '머리', '배', '열나요', '약', '처방전', '진료', '예약'],
    '학교': ['선생님', '수업', '질문', '이해안돼요', '숙제', '시험', '공부'],
    '공항': ['티켓', '짐', '탑승구', '환전', '비행기', '연착', '화장실'],
    '경찰서': ['잃어버렸어요', '사고', '신고', '도둑', '피해', '증거']
}

CLASSES = sorted(list(set(COMMON + [item for sublist in PLACES.values() for item in sublist])))

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


def normalize_landmarks(landmarks):
    """손목 기준 정규화"""
    pts = np.array([[l.x, l.y, l.z] for l in landmarks])
    wrist = pts[0]
    mcp   = pts[9]
    scale = np.linalg.norm(mcp - wrist) or 1.0
    return (pts - wrist) / scale  # (21, 3)

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

def draw_ui(frame, cls_name, n_saved, recording, buffer_len, countdown):
    h, w = frame.shape[:2]
    color = (0, 0, 255) if recording else (40, 40, 40)
    cv2.rectangle(frame, (0, 0), (w, 80), color, -1)
    cv2.putText(frame, f'Target: {cls_name}', (20, 35),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2, cv2.LINE_AA)
    progress = min(n_saved / TARGET_SAMP, 1.0)
    cv2.rectangle(frame, (20, 55), (w-20, 70), (100, 100, 100), -1)
    cv2.rectangle(frame, (20, 55), (20 + int((w-40)*progress), 70), (0, 255, 0), -1)
    cv2.putText(frame, f'{n_saved}/{TARGET_SAMP}', (w//2-20, 67),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    if recording:
        pct = int((buffer_len / SEQ_LEN) * 100)
        cv2.putText(frame, f'RECORDING... {pct}%', (w//2-80, h-30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
    elif countdown > 0:
        cv2.putText(frame, f'READY... {countdown}', (w//2-70, h//2),
                    cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 255), 3)
    else:
        cv2.putText(frame, '[SPACE]: Start  [N/P]: Prev/Next  [D]: Delete  [Q]: Exit',
                    (20, h-20), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)

def main():
    cap = cv2.VideoCapture(0)
    cls_idx, recording, buffer, countdown, cd_start = 0, False, [], 0, 0

    print(f'\n[SignBridge] 총 {len(CLASSES)}개의 단어 수집을 시작합니다.')
    print('목표:', ', '.join(CLASSES[:5]), '...등')

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
            lm_norm = normalize_landmarks(landmarks)

            if recording:
                buffer.append(lm_norm)
                if len(buffer) >= SEQ_LEN:
                    save_sequence(cls_name, buffer)
                    buffer, recording = [], False
                    print(f' >> [{cls_name}] 저장 완료! ({n_saved+1}/{TARGET_SAMP})')

        if countdown > 0:
            elapsed = time.time() - cd_start
            countdown = max(0, 3 - int(elapsed))
            if countdown == 0:
                recording = True
                buffer = []

        draw_ui(frame, cls_name, n_saved, recording, len(buffer), countdown)
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