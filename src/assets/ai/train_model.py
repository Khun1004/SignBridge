import os, json, numpy as np, matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from tensorflow.keras.utils import to_categorical

# ── 설정 ───────────────────────────────────────────────────────
DATA_DIR   = 'data/raw'
MODEL_DIR  = 'models'
SEQ_LEN    = 30
# [중요] server.py와 동일하게 131로 수정 (63 위치 + 63 속도 + 5 각도)
N_FEATURES = 131
EPOCHS     = 100
BATCH_SIZE = 32
os.makedirs(MODEL_DIR, exist_ok=True)

# ── 데이터 로드 ────────────────────────────────────────────────
def load_dataset():
    X, y = [], []
    classes = sorted(set(
        f.rsplit('_', 1)[0]
        for f in os.listdir(DATA_DIR)
        if f.endswith('.npy')
    ))
    label_map = {cls: i for i, cls in enumerate(classes)}

    print(f'클래스 ({len(classes)}개): {classes}')
    for cls in classes:
        files = [f for f in os.listdir(DATA_DIR) if f.startswith(cls+'_') and f.endswith('.npy')]
        print(f'  {cls:<16} {len(files):>3}개 샘플')
        for fn in files:
            seq = np.load(os.path.join(DATA_DIR, fn))  # 수집 시 (30, 131)로 저장됨
            if seq.shape != (SEQ_LEN, N_FEATURES):
                # 만약 기존 63차원 데이터가 섞여있다면 건너뜁니다.
                continue
            X.append(seq)
            y.append(label_map[cls])

    return np.array(X), np.array(y), classes, label_map

# ── 데이터 증강 (131차원 전용) ──────────────────────────────────
def augment(X, y):
    X_aug, y_aug = [], []
    for seq, label in zip(X, y):
        X_aug.append(seq); y_aug.append(label) # 원본

        # 1. 노이즈 추가
        noisy = seq + np.random.normal(0, 0.003, seq.shape)
        X_aug.append(noisy); y_aug.append(label)

        # 2. 시간축으로 약간 밀기 (Time Shift)
        shift = np.roll(seq, shift=np.random.randint(-2, 3), axis=0)
        X_aug.append(shift); y_aug.append(label)

    return np.array(X_aug), np.array(y_aug)

# ── 모델 구성 ──────────────────────────────────────────────────
def build_model(n_classes):
    model = Sequential([
        LSTM(128, return_sequences=True, input_shape=(SEQ_LEN, N_FEATURES)),
        BatchNormalization(),
        Dropout(0.2),

        LSTM(64, return_sequences=False),
        BatchNormalization(),
        Dropout(0.2),

        Dense(64, activation='relu'),
        Dense(n_classes, activation='softmax'),
    ])
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy'],
    )
    return model

# ── 메인 실행 ──────────────────────────────────────────────────
def main():
    X, y, classes, label_map = load_dataset()
    if len(X) == 0:
        print("❌ 유효한 131차원 데이터를 찾을 수 없습니다. 수집기를 먼저 실행하세요.")
        return

    # 증강 및 분할
    X_aug, y_aug = augment(X, y)
    y_cat = to_categorical(y_aug, num_classes=len(classes))
    X_tr, X_val, y_tr, y_val = train_test_split(X_aug, y_cat, test_size=0.2, stratify=y_aug)

    # 모델 학습
    model = build_model(len(classes))
    callbacks = [
        EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True),
        ModelCheckpoint(os.path.join(MODEL_DIR, 'sign_lstm.h5'), save_best_only=True)
    ]

    print(f"\n🚀 {len(classes)}개 클래스 학습 시작...")
    model.fit(X_tr, y_tr, validation_data=(X_val, y_val),
              epochs=EPOCHS, batch_size=BATCH_SIZE, callbacks=callbacks)

    # 결과 저장
    label_path = os.path.join(MODEL_DIR, 'label_map.json')
    with open(label_path, 'w', encoding='utf-8') as f:
        json.dump({'classes': classes, 'label_map': label_map}, f, ensure_ascii=False, indent=2)

    print("\n✅ 학습 완료! 모델과 레이블이 저장되었습니다.")

if __name__ == '__main__':
    main()