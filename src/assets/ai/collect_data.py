import os, cv2, time, numpy as np, mediapipe as mp

# ── 1. 장소별 수어 클래스 정의 (SignBridge 확장형) ──────────────────────
# 공통으로 쓰이는 단어와 각 장소별 핵심 단어를 분리하여 관리합니다.
COMMON = ['안녕하세요', '감사합니다', '저는', '네', '아니요', '도와주세요', '기다려주세요']

PLACES = {
    '출입국': ['비자', '변경', '여권', '서류', '신청', '외국인등록증', '왔습니다'],
    '병원': ['아파요', '머리', '배', '열나요', '약', '처방전', '진료', '예약'],
    '학교': ['선생님', '수업', '질문', '이해안돼요', '숙제', '시험', '공부'],
    '공항': ['티켓', '짐', '탑승구', '환전', '비행기', '연착', '화장실'],
    '경찰서': ['잃어버렸어요', '사고', '신고', '도둑', '피해', '증거']
}

# 전체 학습 리스트 생성 (중복 제거)
CLASSES = sorted(list(set(COMMON + [item for sublist in PLACES.values() for item in sublist])))

# ── 2. 설정 ───────────────────────────────────────────────────────
SEQ_LEN      = 30    # 시퀀스 길이 (프레임 수)
TARGET_SAMP  = 50    # 장소가 많아졌으므로 정확도를 위해 50개로 상향 권장
SAVE_DIR     = 'data/raw'
os.makedirs(SAVE_DIR, exist_ok=True)

# ── 3. MediaPipe 초기화 ───────────────────────────────────────────
mp_hands   = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands_sol  = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.75,
    min_tracking_confidence=0.65,
)

def normalize_landmarks(lm_list):
    """손목 기준 정규화 — 손 크기·위치 불변 (정확도 핵심)"""
    pts = np.array([[l.x, l.y, l.z] for l in lm_list])
    wrist = pts[0]
    mcp   = pts[9]   # 중지 MCP (기준점)
    scale = np.linalg.norm(mcp - wrist) or 1.0
    return (pts - wrist) / scale  # (21, 3)

def count_samples(cls_name):
    prefix = os.path.join(SAVE_DIR, f'{cls_name}_')
    if not os.path.exists(SAVE_DIR): return 0
    return len([f for f in os.listdir(SAVE_DIR) if f.startswith(cls_name+'_') and f.endswith('.npy')])

def save_sequence(cls_name, seq):
    idx = count_samples(cls_name) + 1
    path = os.path.join(SAVE_DIR, f'{cls_name}_{idx:03d}.npy')
    np.save(path, np.array(seq))  # (SEQ_LEN, 21, 3)
    return path

def draw_ui(frame, cls_name, cls_idx, n_saved, recording, buffer_len, countdown):
    h, w = frame.shape[:2]
    # 상단 상태바
    color = (0, 0, 255) if recording else (40, 40, 40)
    cv2.rectangle(frame, (0, 0), (w, 80), color, -1)

    # 현재 녹화 중인 클래스 정보
    cv2.putText(frame, f'Target: {cls_name}', (20, 35),
                cv2.FONT_HERSHEY_飲, 0.8, (255, 255, 255), 2, cv2.LINE_AA)

    # 진행률 바
    progress = min(n_saved / TARGET_SAMP, 1.0)
    cv2.rectangle(frame, (20, 55), (w-20, 70), (100, 100, 100), -1)
    cv2.rectangle(frame, (20, 55), (20 + int((w-40)*progress), 70), (0, 255, 0), -1)
    cv2.putText(frame, f'{n_saved}/{TARGET_SAMP}', (w//2-20, 67),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    # 하단 안내 메시지
    if recording:
        pct = int((buffer_len / SEQ_LEN) * 100)
        cv2.putText(frame, f'RECORDING... {pct}%', (w//2-80, h-30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
    elif countdown > 0:
        cv2.putText(frame, f'READY... {countdown}', (w//2-70, h//2),
                    cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 255), 3)
    else:
        cv2.putText(frame, '[SPACE]: Start  [N/P]: Prev/Next  [D]: Delete All  [Q]: Exit',
                    (20, h-20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

def main():
    cap = cv2.VideoCapture(0)
    cls_idx, recording, buffer, countdown, cd_start = 0, False, [], 0, 0

    print(f'\n[SignBridge] 총 {len(CLASSES)}개의 단어 수집을 시작합니다.')
    print('목표:', ', '.join(CLASSES[:5]), '...등')

    while True:
        ret, frame = cap.read()
        if not ret: break
        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = hands_sol.process(rgb)

        cls_name = CLASSES[cls_idx]
        n_saved = count_samples(cls_name)

        if res.multi_hand_landmarks:
            for hl in res.multi_hand_landmarks:
                mp_drawing.draw_landmarks(frame, hl, mp_hands.HAND_CONNECTIONS)
                lm_norm = normalize_landmarks(hl.landmark)

                if recording:
                    buffer.append(lm_norm)
                    if len(buffer) >= SEQ_LEN:
                        save_sequence(cls_name, buffer)
                        buffer, recording = [], False
                        print(f' >> [{cls_name}] 저장 완료! ({n_saved+1}/{TARGET_SAMP})')

        if countdown > 0:
            elapsed = time.time() - cd_start
            countdown = max(0, 3 - int(elapsed))
            if countdown == 0: recording = True; buffer = []

        draw_ui(frame, cls_name, cls_idx, n_saved, recording, len(buffer), countdown)
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
            # 현재 클래스 데이터만 삭제
            for f in os.listdir(SAVE_DIR):
                if f.startswith(cls_name+'_'): os.remove(os.path.join(SAVE_DIR, f))
            print(f' !! [{cls_name}] 데이터 삭제됨')

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    main()