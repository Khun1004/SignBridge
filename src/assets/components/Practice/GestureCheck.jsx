import { useState, useEffect, useRef, useCallback } from 'react'
import './GestureCheck.css'
import SignAnimator from './SignAnimator'

/* ══════════════════════════════════════════════════════════
   GESTURE_SIGNS — aligned to corrected signs.js IDs
   Instructions and checkParams match SignLearnCard + signs.js
══════════════════════════════════════════════════════════ */
export const GESTURE_SIGNS = [
  /* ── 인사 ── */
  {
    id: 'g01', cat: 'greet', label: '안녕하세요', english: 'Hello',
    color: '#7c6fff', difficulty: 'easy',
    instruction: '오른손을 편 채 관자놀이에서 쓸어내린 후, 양손 주먹을 가슴 앞으로 내리세요.',
    checker: 'hello',
    checkParams: { 수형: 'B형(편손) → S형(주먹)', 수위: '관자놀이 → 가슴 앞', 수향: '손바닥이 안쪽 → 손등이 앞', 수동: '쓸어내리기 + 멈춤' },
  },
  {
    id: 'g02', cat: 'greet', label: '감사합니다', english: 'Thank you',
    color: '#7c6fff', difficulty: 'easy',
    instruction: '왼손을 펴서 가슴 앞에 눕히고, 오른손 날로 왼손 등을 두 번 두드립니다.',
    checker: 'thankyou',
    checkParams: { 수형: '편손 양손', 수위: '가슴 앞', 수향: '왼손 바닥이 아래', 수동: '오른손 날로 두드리기 2회' },
  },
  {
    id: 'g12', cat: 'greet', label: '죄송합니다', english: 'Sorry',
    color: '#7c6fff', difficulty: 'easy',
    instruction: '오른손 엄지+검지로 O형을 만들어 이마에 댔다가 내리며 왼 손등 위에 얹습니다.',
    checker: 'sorry',
    checkParams: { 수형: 'O형 핀치 (엄지+검지)', 수위: '이마 → 왼 손등', 수향: '손바닥이 앞', 수동: '이마 터치 → 내리며 왼 손등 얹기', },
  },
  {
    id: 'g13', cat: 'greet', label: '괜찮아요', english: 'Okay',
    color: '#7c6fff', difficulty: 'easy',
    instruction: '새끼손가락만 펴서 턱 아래를 톡톡 두드립니다.',
    checker: 'okay',
    checkParams: { 수형: '소지만 펴기', 수위: '턱 아래', 수향: '손바닥이 옆', 수동: '턱 아래 톡톡 두드리기' },
  },
  {
    id: 'g14', cat: 'greet', label: '이름', english: 'Name',
    color: '#7c6fff', difficulty: 'easy',
    instruction: '엄지·검지를 펴서 L형으로 만들고 가슴 높이에서 아래로 짧게 내립니다.',
    checker: 'name',
    checkParams: { 수형: '엄지+검지 (L형)', 수위: '가슴 높이', 수향: '손가락 끝이 옆', 수동: '짧게 아래로' },
  },

  /* ── 긴급 ── */
  {
    id: 'e01', cat: 'emergency', label: '도움', english: 'Help',
    color: '#ef4444', difficulty: 'medium',
    instruction: '왼손 엄지 위에 오른손을 얹고 두 손을 함께 위로 올리세요.',
    checker: 'help',
    checkParams: { 수형: '엄지 세움 + 편손', 수위: '가슴 앞', 수향: '편손 손바닥이 아래', 수동: '위로 올리기' },
  },
  {
    // FIXED: 손바닥이 옆 → 손등이 밖; motion: 앞으로 내밀기 (forward push)
    id: 'e02', cat: 'emergency', label: '신고', english: 'Report',
    color: '#ef4444', difficulty: 'medium',
    instruction: '검지를 입 앞에 세우고(손등이 밖), 앞쪽으로 내밉니다.',
    checker: 'report',
    checkParams: { 수형: '1형 (검지만)', 수위: '입 앞', 수향: '손등이 밖을 향함', 수동: '앞으로 내밀기' },
  },
  {
    // FIXED: C형으로 가슴 두 번 두드리기 (not head wave)
    id: 'e03', cat: 'emergency', label: '위험', english: 'Danger',
    color: '#ef4444', difficulty: 'medium',
    instruction: '오른손을 C형으로 구부려 가슴을 가볍게 두 번 두드립니다.',
    checker: 'danger',
    checkParams: { 수형: 'C형 (구형)', 수위: '가슴', 수향: '손바닥이 가슴 방향', 수동: 'C형으로 가슴 두드리기 2회' },
  },

  /* ── 의료 ── */
  {
    // FIXED: 두 단계 명시 — 손등 ×2 → 손목 ×2
    id: 'm01', cat: 'medical', label: '의사', english: 'Doctor',
    color: '#10b981', difficulty: 'medium',
    instruction: '왼 손등(손등이 밖)을 V형으로 두 번 친 후, 왼 주먹 손목 옆면을 두 번 칩니다.',
    checker: 'doctor',
    checkParams: { 수형: 'V형 (검지+중지)', 수위: '왼 손등 → 왼 손목', 수향: '손등이 밖을 향함', 수동: '손등 두드리기 ×2 → 손목 두드리기 ×2' },
  },
  {
    // FIXED: 손바닥 위로 오므려 좌우 흔들기 (C형)
    id: 'm02', cat: 'medical', label: '아프다', english: 'Pain',
    color: '#10b981', difficulty: 'easy',
    instruction: '손바닥을 위로 하여 살짝 오므리고(C형), 가슴/배 앞에서 좌우로 가볍게 흔듭니다.',
    checker: 'pain',
    checkParams: { 수형: 'C형 (살짝 오므림)', 수위: '가슴/배 앞', 수향: '손바닥이 위', 수동: '좌우로 흔들기' },
  },
  {
    // FIXED: V형으로 왼 손바닥 위를 앞뒤로 문지르기 (갈기 동작)
    id: 'm03', cat: 'medical', label: '약', english: 'Medicine',
    color: '#10b981', difficulty: 'easy',
    instruction: '왼 손바닥을 위로 펴고, 오른 V형(검지+중지)으로 손바닥 위를 앞뒤로 문지릅니다.',
    checker: 'medicine',
    checkParams: { 수형: 'V형 (검지+중지)', 수위: '왼 손바닥 위', 수향: '손바닥이 아래', 수동: '앞뒤로 문지르기 (갈기 동작)' },
  },
  {
    // FIXED: 이마에 댔다 → 왼 손바닥으로 이동
    id: 'm04', cat: 'medical', label: '열', english: 'Fever',
    color: '#10b981', difficulty: 'easy',
    instruction: '오른 손바닥을 이마에 댔다 뗀 후, 왼 손바닥 위로 내려 대기.',
    checker: 'fever',
    checkParams: { 수형: '편손 (5형)', 수위: '이마 → 왼 손바닥', 수향: '손바닥이 아래', 수동: '이마 터치 후 왼 손바닥으로 이동' },
  },

  /* ── 여행 ── */
  {
    id: 'tr01', cat: 'travel', label: '비자', english: 'Visa',
    color: '#f59e0b', difficulty: 'medium',
    instruction: '왼 손바닥 위에 주먹으로 도장 찍듯이 내립니다.',
    checker: 'visa',
    checkParams: { 수형: '주먹 (S형)', 수위: '왼 손바닥 위', 수향: '손등이 위', 수동: '도장 찍기' },
  },
  {
    // FIXED: 검지 끝 뒤로 향했다가 빙글 돌리며 전진
    id: 'tr02', cat: 'travel', label: '여행', english: 'Travel',
    color: '#f59e0b', difficulty: 'medium',
    instruction: '양손 검지 끝을 어깨 뒤(자기 쪽)로 향했다가, 빙글빙글 돌리며 앞으로 전진합니다.',
    checker: 'travel',
    checkParams: { 수형: '1형 검지 (양손)', 수위: '어깨 앞', 수향: '검지 끝이 뒤(어깨쪽)', 수동: '안쪽 돌리며 앞으로 전진' },
  },

  /* ── 질문 ── */
  {
    id: 'q15', cat: 'question', label: '뭐', english: 'What',
    color: '#8b5cf6', difficulty: 'easy',
    instruction: '손바닥이 밖을 향하게 검지를 좌우로 흔듭니다.',
    checker: 'what',
    checkParams: { 수형: '1형 (검지만)', 수위: '몸 앞', 수향: '손바닥이 밖', 수동: '좌우로 흔들기' },
  },
  {
    id: 'q16', cat: 'question', label: '어디', english: 'Where',
    color: '#8b5cf6', difficulty: 'easy',
    instruction: '검지를 좌우로 흔든 후 아래로 살짝 내립니다.',
    checker: 'where',
    checkParams: { 수형: '1형 (검지만)', 수위: '몸 앞', 수향: '손바닥이 밖', 수동: '흔들기 + 아래로 내리기' },
  },
  {
    id: 'q17', cat: 'question', label: '왜', english: 'Why',
    color: '#8b5cf6', difficulty: 'easy',
    instruction: '검지 끝을 관자놀이에 댑니다.',
    checker: 'why',
    checkParams: { 수형: '1형 (검지만)', 수위: '관자놀이', 수향: '손바닥이 옆', 수동: '관자놀이에 대기' },
  },
  {
    id: 'q18', cat: 'question', label: '다시', english: 'Again',
    color: '#8b5cf6', difficulty: 'easy',
    instruction: '검지와 중지를 펴고 대각선 위에서 앞 아래로 베듯이 내립니다.',
    checker: 'again',
    checkParams: { 수형: 'V형 (검지+중지)', 수위: '몸 앞', 수향: '손등이 위', 수동: '대각선 위→아래 베기' },
  },

  /* ── 대답 ── */
  {
    id: 'a19', cat: 'answer', label: '네', english: 'Yes',
    color: '#10b981', difficulty: 'easy',
    instruction: '고개를 위아래로 한 번 끄덕입니다.',
    checker: 'yes',
    checkParams: { 수형: '고개 끄덕임', 수위: '머리', 수향: '앞을 향함', 수동: '위아래로 끄덕이기' },
  },
  {
    id: 'a26', cat: 'answer', label: '아니다', english: 'No',
    color: '#10b981', difficulty: 'easy',
    instruction: '손바닥이 밖을 보게 하여 좌우로 흔듭니다.',
    checker: 'no',
    checkParams: { 수형: '편손 (5형)', 수위: '몸 앞', 수향: '손바닥이 밖', 수동: '좌우 흔들기' },
  },

  /* ── 시간 ── */
  {
    id: 't20', cat: 'time', label: '어제', english: 'Yesterday',
    color: '#3b82f6', difficulty: 'easy',
    instruction: '검지를 어깨 뒤쪽으로 넘기듯이 움직입니다.',
    checker: 'yesterday',
    checkParams: { 수형: '1형 (검지만)', 수위: '어깨', 수향: '손바닥이 안쪽', 수동: '뒤로 넘기기' },
  },
  {
    id: 't21', cat: 'time', label: '지금', english: 'Now',
    color: '#3b82f6', difficulty: 'easy',
    instruction: '양손을 가슴 앞에 두고 아래로 가볍게 내립니다.',
    checker: 'now',
    checkParams: { 수형: '편손 양손', 수위: '가슴 앞', 수향: '손바닥이 아래', 수동: '동시에 아래로 내리기' },
  },
  {
    id: 't22', cat: 'time', label: '내일', english: 'Tomorrow',
    color: '#3b82f6', difficulty: 'easy',
    instruction: '검지를 눈 옆에 댔다가 앞쪽으로 내밉니다.',
    checker: 'tomorrow',
    checkParams: { 수형: '1형 (검지만)', 수위: '눈 옆 → 앞', 수향: '손바닥이 옆', 수동: '앞으로 내밀기' },
  },

  /* ── 감정 ── */
  {
    id: 'f23', cat: 'feeling', label: '좋다', english: 'Good',
    color: '#ec4899', difficulty: 'easy',
    instruction: '오른 주먹의 엄지 쪽을 코에 가볍게 댑니다.',
    checker: 'good',
    checkParams: { 수형: '주먹 (S형)', 수위: '코', 수향: '엄지 쪽이 코 방향', 수동: '코에 가볍게 대기' },
  },
  {
    id: 'f24', cat: 'feeling', label: '싫다', english: 'Dislike',
    color: '#ec4899', difficulty: 'easy',
    instruction: '손을 가슴 앞에서 바깥쪽으로 밀어냅니다.',
    checker: 'dislike',
    checkParams: { 수형: '편손 (5형)', 수위: '가슴 앞', 수향: '손바닥이 앞', 수동: '밖으로 밀어내기' },
  },

  /* ── 숫자 1–10 ── */
  {
    // 1: 검지만, 손등이 밖
    id: 'n27', cat: 'number', label: '1', english: 'One',
    color: '#6366f1', difficulty: 'easy',
    instruction: '검지만 세우고 나머지는 주먹. 손등이 밖(상대방)을 향하게.',
    checker: 'one',
    checkParams: { 수형: '검지만', 수동: '정지' },
  },
  {
    // FIXED: 2는 엄지+검지 모로(thumbindex), 손등이 밖 — NOT V형
    id: 'n28', cat: 'number', label: '2', english: 'Two',
    color: '#6366f1', difficulty: 'easy',
    instruction: '엄지와 검지를 펴고 손을 45° 모로 기울여 손등이 밖을 향하게 합니다.',
    checker: 'two',
    checkParams: { 수형: '검지+중지 (엄지 접음)', 수동: '정지' },
  },
  {
    // FIXED: 3은 엄지+검지+중지(thumbtwofinger), 손등이 밖 — NOT V형+약지
    id: 'n29', cat: 'number', label: '3', english: 'Three',
    color: '#6366f1', difficulty: 'easy',
    instruction: '엄지·검지·중지 세 손가락을 펴고 손등이 밖을 향하게 합니다.',
    checker: 'three',
    checkParams: { 수형: '검지+중지+약지 (엄지·소지 접음)', 수동: '정지' },
  },
  {
    // FIXED: 4는 엄지+검지+중지+약지(thumbthreefinger), 손등이 밖 — NOT 네손가락 편손
    id: 'n30', cat: 'number', label: '4', english: 'Four',
    color: '#6366f1', difficulty: 'easy',
    instruction: '엄지·검지·중지·약지 네 손가락을 펴고(소지 접음) 손등이 밖을 향하게 합니다.',
    checker: 'four',
    checkParams: { 수형: '검지+중지+약지+소지 (엄지만 접음)', 수동: '정지' },
  },
  {
    // FIXED: 5는 다섯 손가락 전부, 손바닥이 안으로 비스듬히 — NOT 손바닥이 앞
    id: 'n31', cat: 'number', label: '5', english: 'Five',
    color: '#6366f1', difficulty: 'easy',
    instruction: '다섯 손가락을 모두 펴고 손바닥이 안(자기 쪽)을 향하도록 비스듬히 기울입니다.',
    checker: 'five',
    checkParams: { 수형: '엄지만 수직', 수동: '정지' },
  },
  {
    // 6: Y형 엄지+소지, 손등이 밖
    id: 'n32', cat: 'number', label: '6', english: 'Six',
    color: '#6366f1', difficulty: 'easy',
    instruction: '엄지와 새끼손가락(소지)만 펴서 Y자 모양을 만들고, 손등이 밖을 향하게.',
    checker: 'six',
    checkParams: { 수형: '엄지+검지 수직, 손등이 밖', 수동: '정지' },
  },
  {
    // 7: 엄지+약지
    id: 'n33', cat: 'number', label: '7', english: 'Seven',
    color: '#6366f1', difficulty: 'easy',
    instruction: '엄지와 약지를 펴고 나머지는 접습니다.',
    checker: 'seven',
    checkParams: { 수형: '엄지+검지+중지 수직, 손등이 밖', 수동: '정지' },
  },
  {
    // 8: 엄지+중지
    id: 'n34', cat: 'number', label: '8', english: 'Eight',
    color: '#6366f1', difficulty: 'easy',
    instruction: '엄지와 중지를 펴고 나머지는 접습니다.',
    checker: 'eight',
    checkParams: { 수형: '엄지+검지+중지+약지 수직, 손등이 밖', 수동: '정지' },
  },
  {
    // FIXED: 9는 엄지+검지 O형 핀치 (flato/F형) — NOT L형
    id: 'n35', cat: 'number', label: '9', english: 'Nine',
    color: '#6366f1', difficulty: 'easy',
    instruction: '엄지와 검지 끝을 맞대어 O형(핀치)을 만들고, 나머지 손가락은 위로 폅니다.',
    checker: 'nine',
    checkParams: { 수형: '전체 수직, 손등이 밖', 수동: '정지' },
  },
  {
    id: 'n36', cat: 'number', label: '10', english: 'Ten',
    color: '#6366f1', difficulty: 'easy',
    instruction: '오른 주먹에서 검지만 펴서 약간 구부리고, 끝이 밖을 향하게 하여 좌우로 살짝 흔듭니다.',
    checker: 'ten',
    checkParams: {
      수형: '1형 검지 (오른손)',
      수위: '가슴 앞',
      수향: '손등이 밖을 향함',
      수동: '좌우로 살짝 흔들기',
    },
  },

  /* ── 일상 ── */
  {
    // FIXED: 컵 모양(flato/O형)으로 입쪽으로 기울이기
    id: 'd37', cat: 'daily', label: '물', english: 'Water',
    color: '#3b82f6', difficulty: 'easy',
    instruction: '손가락 끝을 모아 컵 모양(O형)을 만들고, 마시는 동작처럼 입 쪽으로 기울입니다.',
    checker: 'water',
    checkParams: { 수형: 'O형/컵 모양 (flato)', 수위: '입 주변', 수향: '손바닥이 위', 수동: '마시기 동작' },
  },

  /* ── 신체 ── */
  {
    id: 'b38', cat: 'body', label: '머리', english: 'Head',
    color: '#f97316', difficulty: 'easy',
    instruction: '손으로 머리 부분을 가리킵니다.',
    checker: 'head',
    checkParams: { 수형: '편손 또는 검지 (1형)', 수위: '머리', 수향: '손바닥이 아래', 수동: '머리 가리키기' },
  },
  {
    id: 'b39', cat: 'body', label: '눈', english: 'Eyes',
    color: '#f97316', difficulty: 'easy',
    instruction: '검지로 눈 아래 주변을 가리킵니다.',
    checker: 'eyes',
    checkParams: { 수형: '1형 (검지만)', 수위: '눈', 수향: '손바닥이 얼굴 방향', 수동: '눈 가리키기' },
  },
]

/* ══════════════════════════════════════════════════════════
   STATIC CHECKERS — signs where 수동 = 정지 (hold shape)
══════════════════════════════════════════════════════════ */
const STATIC_CHECKERS = new Set([
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'eyes', 'why', 'water'
])

/* ══════════════════════════════════════════════════════════
   LANDMARK INDICES
══════════════════════════════════════════════════════════ */
const LM = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
}

const dist = (a, b) => Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2 + ((a.z||0)-(b.z||0))**2)

function isExtended(lm, tipIdx, mcpIdx) {
  return dist(lm[tipIdx], lm[LM.WRIST]) > dist(lm[mcpIdx], lm[LM.WRIST]) * 1.15
}

const indexUp   = lm => isExtended(lm, LM.INDEX_TIP,  LM.INDEX_MCP)
const middleUp  = lm => isExtended(lm, LM.MIDDLE_TIP, LM.MIDDLE_MCP)
const ringUp    = lm => isExtended(lm, LM.RING_TIP,   LM.RING_MCP)
const pinkyUp   = lm => isExtended(lm, LM.PINKY_TIP,  LM.PINKY_MCP)
const thumbUp   = lm => lm[LM.THUMB_TIP].y < lm[LM.THUMB_MCP].y - 0.04
const thumbDown = lm => lm[LM.THUMB_TIP].y > lm[LM.THUMB_MCP].y + 0.04

function palmFacingCamera(lm) {
  const tips = [LM.INDEX_TIP, LM.MIDDLE_TIP, LM.RING_TIP, LM.PINKY_TIP]
  const avgTipZ = tips.reduce((s, i) => s + (lm[i].z || 0), 0) / 4
  return (lm[LM.WRIST].z || 0) > avgTipZ
}

// Back of hand facing camera (opposite of palm-facing)
function backFacingCamera(lm) {
  return !palmFacingCamera(lm)
}

function wristZone(lm) {
  const wy = lm[LM.WRIST].y
  if (wy < 0.25) return 'head'
  if (wy < 0.42) return 'face'
  if (wy < 0.65) return 'chest'
  return 'low'
}

function tipZone(lm, tipIdx) {
  const ty = lm[tipIdx].y
  if (ty < 0.25) return 'head'
  if (ty < 0.42) return 'face'
  if (ty < 0.65) return 'chest'
  return 'low'
}

const fourFingersUp = lm => indexUp(lm) && middleUp(lm) && ringUp(lm) && pinkyUp(lm)
const isFist        = lm => !indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm)
const isYHand       = lm => thumbUp(lm) && pinkyUp(lm) && !indexUp(lm) && !middleUp(lm) && !ringUp(lm)
const isPinch       = lm => dist(lm[LM.THUMB_TIP], lm[LM.INDEX_TIP]) < 0.06
const isLooseGather = lm => dist(lm[LM.THUMB_TIP], lm[LM.MIDDLE_TIP]) < 0.10

// FIXED: thumbindex — thumb + index extended, middle/ring/pinky folded
const isThumbIndex = lm =>
  thumbUp(lm) && indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm)

// FIXED: thumbtwofinger — thumb + index + middle extended
const isThumbTwoFinger = lm =>
  thumbUp(lm) && indexUp(lm) && middleUp(lm) && !ringUp(lm) && !pinkyUp(lm)

// FIXED: thumbthreefinger — thumb + index + middle + ring, pinky folded
const isThumbThreeFinger = lm =>
  thumbUp(lm) && indexUp(lm) && middleUp(lm) && ringUp(lm) && !pinkyUp(lm)

// FIXED: nine (9) — O형 pinch (thumb + index tips touching), others extended
const isNinePinch = lm =>
  isPinch(lm) && middleUp(lm) && ringUp(lm) && pinkyUp(lm)

/* ══════════════════════════════════════════════════════════
   MOTION DETECTORS
══════════════════════════════════════════════════════════ */
function isStill(h) {
  if (h.length < 6) return 'waiting'
  const recent = h.slice(-6)
  const dx = Math.max(...recent.map(p => p.x)) - Math.min(...recent.map(p => p.x))
  const dy = Math.max(...recent.map(p => p.y)) - Math.min(...recent.map(p => p.y))
  return dx < 0.04 && dy < 0.04
}

const detectDownwardSwipe  = h => h.length >= 8 && (h.slice(-8).at(-1).y - h.slice(-8)[0].y) > 0.06
const detectForwardPush    = h => h.length >= 8 && (Math.abs(h.slice(-8).at(-1).x - h.slice(-8)[0].x) > 0.05 || h.slice(-8)[0].z - h.slice(-8).at(-1).z > 0.02)
const detectCircularMotion = h => { if (h.length < 12) return false; const r = h.slice(-12); return (Math.max(...r.map(p=>p.x))-Math.min(...r.map(p=>p.x))) > 0.04 && (Math.max(...r.map(p=>p.y))-Math.min(...r.map(p=>p.y))) > 0.04 }
const detectUpwardMove     = h => h.length >= 8 && (h.slice(-8)[0].y - h.slice(-8).at(-1).y) > 0.05
const detectNodding        = h => { if (h.length < 10) return false; const r = h.slice(-10); return (Math.max(...r.map(p=>p.y))-Math.min(...r.map(p=>p.y))) > 0.04 }
const detectLateralShake   = h => { if (h.length < 10) return false; return (Math.max(...h.slice(-10).map(p=>p.x))-Math.min(...h.slice(-10).map(p=>p.x))) > 0.06 }
const detectLateralSwipe   = h => h.length >= 8 && Math.abs(h.slice(-8).at(-1).x - h.slice(-8)[0].x) > 0.05
const detectBackwardSwipe  = h => h.length >= 8 && Math.abs(h.slice(-8).at(-1).x - h.slice(-8)[0].x) > 0.05
const detectStrongDownward = h => h.length >= 6 && (h.slice(-6).at(-1).y - h.slice(-6)[0].y) > 0.08
const detectBackAndForth   = h => { if (h.length < 12) return false; const xs = h.slice(-12).map(p=>p.x); const mid = Math.floor(xs.length/2); return (Math.max(...xs)-Math.min(...xs)) > 0.05 && Math.sign(xs[mid]-xs[0]) !== Math.sign(xs[xs.length-1]-xs[mid]) }

/* ══════════════════════════════════════════════════════════
   PHASE DEFINITIONS — dynamic signs
══════════════════════════════════════════════════════════ */
const PHASE_DEFS = {
  hello: [
    { label: '① B형(편손) 관자놀이 대기',   check: (lm) => fourFingersUp(lm) && !thumbUp(lm) && (wristZone(lm) === 'head' || wristZone(lm) === 'face') },
    { label: '② 아래로 쓸어내리기',          check: (lm, h) => detectDownwardSwipe(h) },
    { label: '③ 주먹 쥐고 가슴 앞 멈춤',    check: (lm, h) => isFist(lm) && wristZone(lm) === 'chest' && isStill(h) },
  ],
  thankyou: [
    { label: '① 편손 가슴 앞에',     check: (lm) => fourFingersUp(lm) && !thumbUp(lm) && wristZone(lm) === 'chest' && !palmFacingCamera(lm) },
    { label: '② 손등 두드리기',      check: (lm, h) => detectNodding(h) },
  ],
  sorry: [
    { label: '① O형(엄지+검지) 이마에 대기',
      check: (lm) => isPinch(lm) && (wristZone(lm) === 'face' || wristZone(lm) === 'head') },
    { label: '② 가슴 앞으로 내리기',
      check: (lm, h) => detectDownwardSwipe(h) },
    { label: '③ 왼 손등 위에 얹기 (멈춤)',
      check: (lm, h) => wristZone(lm) === 'chest' && isStill(h) },
  ],
  okay: [
    { label: '① 소지 펴고 턱 아래', check: (lm) => pinkyUp(lm) && !indexUp(lm) && !middleUp(lm) && !ringUp(lm) && wristZone(lm) === 'face' },
    { label: '② 톡톡 두드리기',     check: (lm, h) => detectNodding(h) },
  ],
  name: [
    { label: '① L형 가슴 높이에',   check: (lm) => thumbUp(lm) && indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm) && wristZone(lm) === 'chest' },
    { label: '② 짧게 아래로 내리기', check: (lm, h) => detectDownwardSwipe(h) },
  ],
  help: [
    { label: '① 편손 가슴 앞에',    check: (lm) => fourFingersUp(lm) && wristZone(lm) === 'chest' },
    { label: '② 위로 올리기',       check: (lm, h) => detectUpwardMove(h) },
  ],
  // FIXED: e02 신고 — 검지 입 앞, 손등이 밖, 앞으로 내밀기
  report: [
    { label: '① 검지 입 앞 (손등이 밖)', check: (lm) => indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm) && wristZone(lm) === 'face' && backFacingCamera(lm) },
    { label: '② 앞으로 내밀기',          check: (lm, h) => detectForwardPush(h) },
  ],
  // FIXED: e03 위험 — C형으로 가슴 두드리기 (not head wave)
  danger: [
    { label: '① C형 손 가슴에 대기',  check: (lm) => !fourFingersUp(lm) && !isFist(lm) && wristZone(lm) === 'chest' },
    { label: '② 가슴 두드리기 2회',   check: (lm, h) => detectNodding(h) },
  ],
  // FIXED: m01 의사 — V형 손등(손등이 밖) 2회, 그 후 손목 2회
  doctor: [
    { label: '① V형, 왼 손등 앞 (손등이 밖)', check: (lm) => indexUp(lm) && middleUp(lm) && !ringUp(lm) && !pinkyUp(lm) && wristZone(lm) === 'chest' },
    { label: '② 손등 두드리기 →',              check: (lm, h) => detectNodding(h) },
    { label: '③ 왼 손목 두드리기',             check: (lm, h) => detectNodding(h) },
  ],
  // FIXED: m02 아프다 — C형 손바닥 위로, 좌우 흔들기
  pain: [
    { label: '① C형, 손바닥 위 (가슴/배 앞)', check: (lm) => !fourFingersUp(lm) && !isFist(lm) && wristZone(lm) === 'chest' },
    { label: '② 좌우로 흔들기',                check: (lm, h) => detectLateralShake(h) },
  ],
  // FIXED: m03 약 — V형으로 왼 손바닥 위 앞뒤 문지르기
  medicine: [
    { label: '① 검지만, 왼 손바닥 위에', check: (lm) => indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm) && wristZone(lm) === 'chest' },
    { label: '② 앞뒤로 문지르기',        check: (lm, h) => detectBackAndForth(h) },
  ],
  // FIXED: m04 열 — 이마 → 왼손바닥으로 이동
  fever: [
    { label: '① 편손 이마에 대기',    check: (lm) => fourFingersUp(lm) && (wristZone(lm) === 'head' || wristZone(lm) === 'face') },
    { label: '② 왼 손바닥으로 내리기', check: (lm, h) => detectDownwardSwipe(h) },
  ],
  visa: [
    { label: '① 왼손 펴서 위로',        check: (lm) => fourFingersUp(lm) && palmFacingCamera(lm) },
    { label: '② 주먹으로 도장 찍기',    check: (lm, h) => detectNodding(h) },
  ],
  // FIXED: tr02 여행 — 검지 끝 뒤(어깨)로, 빙글 돌리며 전진
  travel: [
    { label: '① 검지 어깨 앞 (끝이 뒤쪽)', check: (lm) => indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm) && wristZone(lm) === 'chest' },
    { label: '② 빙글빙글 돌리며 전진',     check: (lm, h) => detectCircularMotion(h) },
  ],
  what: [
    { label: '① 검지 몸 앞에',     check: (lm) => indexUp(lm) && !middleUp(lm) && wristZone(lm) === 'chest' },
    { label: '② 좌우로 흔들기',    check: (lm, h) => detectLateralShake(h) },
  ],
  where: [
    { label: '① 검지 몸 앞에',     check: (lm) => indexUp(lm) && !middleUp(lm) && wristZone(lm) === 'chest' },
    { label: '② 흔든 후 아래로',   check: (lm, h) => detectDownwardSwipe(h) },
  ],
  again: [
    { label: '① 편손 앞으로',      check: (lm) => fourFingersUp(lm) && wristZone(lm) === 'chest' },
    { label: '② 당기기',           check: (lm, h) => detectBackwardSwipe(h) },
  ],
  yes: [
    { label: '① 주먹 가슴 앞에',       check: (lm) => isFist(lm) && wristZone(lm) === 'chest' },
    { label: '② 위아래로 끄덕이기',    check: (lm, h) => detectNodding(h) },
  ],
  no: [
    { label: '① 편손 몸 앞에',     check: (lm) => fourFingersUp(lm) && wristZone(lm) === 'chest' },
    { label: '② 좌우로 흔들기',    check: (lm, h) => detectLateralShake(h) },
  ],
  yesterday: [
    { label: '① 검지 어깨 앞에',   check: (lm) => indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm) },
    { label: '② 뒤로 넘기기',      check: (lm, h) => detectBackwardSwipe(h) },
  ],
  now: [
    { label: '① 편손 양손 가슴 앞에', check: (lm) => fourFingersUp(lm) && !thumbUp(lm) && wristZone(lm) === 'chest' },
    { label: '② 아래로 내리기',       check: (lm, h) => detectStrongDownward(h) },
  ],
  tomorrow: [
    { label: '① 검지 눈 옆에',     check: (lm) => indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm) && (wristZone(lm) === 'face' || wristZone(lm) === 'head') },
    { label: '② 앞으로 내밀기',    check: (lm, h) => detectForwardPush(h) },
  ],
  good: [
    { label: '① 주먹 코 앞에',         check: (lm) => isFist(lm) && (wristZone(lm) === 'face' || tipZone(lm, LM.THUMB_TIP) === 'face') },
    { label: '② 코에 대기 (멈춤)',     check: (lm, h) => isFist(lm) && isStill(h) },
  ],
  dislike: [
    { label: '① 편손 가슴 앞에',   check: (lm) => fourFingersUp(lm) && wristZone(lm) === 'chest' },
    { label: '② 밖으로 밀어내기',  check: (lm, h) => detectForwardPush(h) },
  ],
  ten: [
    {
      label: '① 오른 주먹에서 검지만 펴기',
      check: (lm) => indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm)
                    && wristZone(lm) === 'chest',
    },
    {
      label: '② 좌우로 살짝 흔들기',
      check: (lm, h) => detectLateralShake(h),
    },
  ],
  head: [
    { label: '① 편손 머리 위에',       check: (lm) => fourFingersUp(lm) && wristZone(lm) === 'head' },
    { label: '② 머리 가리키기 (멈춤)', check: (lm, h) => isStill(h) },
  ],
}

/* ══════════════════════════════════════════════════════════
   STATIC CHECKER
   FIXED: number shapes aligned to KSL standard
══════════════════════════════════════════════════════════ */
function checkStatic(checker, lm, h) {
  if (!lm || lm.length < 21) return null
  switch (checker) {

    case 'one':
      return {
        수형: indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm),
        수동: isStill(h),
      }
    case 'two':
      return {
        수형: indexUp(lm) && middleUp(lm) && !ringUp(lm) && !pinkyUp(lm) && !thumbUp(lm),
        수동: isStill(h),
      }
    case 'three':
      return {
        수형: indexUp(lm) && middleUp(lm) && ringUp(lm) && !pinkyUp(lm) && !thumbUp(lm),
        수동: isStill(h),
      }
    case 'four':
      return {
        수형: indexUp(lm) && middleUp(lm) && ringUp(lm) && pinkyUp(lm) && !thumbUp(lm),
        수동: isStill(h),
      }
    case 'five':
      return {
        수형: thumbUp(lm) && !indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm),
        수동: isStill(h),
      }
    case 'six':
      return {
        수형: thumbUp(lm) && indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm) && backFacingCamera(lm),
        수동: isStill(h),
      }
    case 'seven':
      return {
        수형: thumbUp(lm) && indexUp(lm) && middleUp(lm) && !ringUp(lm) && !pinkyUp(lm) && backFacingCamera(lm),
        수동: isStill(h),
      }
    case 'eight':
      return {
        수형: thumbUp(lm) && indexUp(lm) && middleUp(lm) && ringUp(lm) && !pinkyUp(lm) && backFacingCamera(lm),
        수동: isStill(h),
      }
    case 'nine':
      return {
        수형: thumbUp(lm) && indexUp(lm) && middleUp(lm) && ringUp(lm) && pinkyUp(lm) && backFacingCamera(lm),
        수동: isStill(h),
      }
    case 'eyes':
      return {
        수형: indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm),
        수위: wristZone(lm) === 'face' || tipZone(lm, LM.INDEX_TIP) === 'face',
        수동: isStill(h),
      }
    case 'why':
      return {
        수형: indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm),
        수위: wristZone(lm) === 'face' || wristZone(lm) === 'head',
        수동: isStill(h),
      }
    case 'water':
      return {
        수형: !fourFingersUp(lm) && !isFist(lm) && (isLooseGather(lm) || isPinch(lm)),
        수위: wristZone(lm) === 'face',
        수동: isStill(h),
      }
    default:
      return null
  }
}

/* ══════════════════════════════════════════════════════════
   PHASE ENGINE
══════════════════════════════════════════════════════════ */
function runPhaseEngine(checker, lm, motionHistory, phaseRef) {
  const phases = PHASE_DEFS[checker]
  if (!phases) return null
  const currentPhase = phaseRef.current[checker] || 0
  const phaseDef     = phases[currentPhase]
  if (!phaseDef) return null
  const passed = phaseDef.check(lm, motionHistory)
  if (passed && currentPhase < phases.length - 1) {
    phaseRef.current = { ...phaseRef.current, [checker]: currentPhase + 1 }
  }
  const newPhase = phaseRef.current[checker] || 0
  const complete = newPhase === phases.length - 1 && passed
  const scores   = {}
  phases.forEach((p, i) => {
    if (i < newPhase)        scores[p.label] = true
    else if (i === newPhase) scores[p.label] = passed
    else                     scores[p.label] = false
  })
  return { phase: newPhase, totalPhases: phases.length, phaseLabels: phases.map(p => p.label), scores, complete }
}

/* ══════════════════════════════════════════════════════════
   PARAM SCORE ROW
══════════════════════════════════════════════════════════ */
function ParamRow({ label, value }) {
  const status = value === 'waiting' ? 'wait' : value ? 'pass' : 'fail'
  const icons  = { wait: '⏳', pass: '✓', fail: '✗' }
  return (
    <div className={`param-row ${status}`}>
      <span className="pr-icon">{icons[status]}</span>
      <span className="pr-label">{label}</span>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   PHASE PROGRESS BAR
══════════════════════════════════════════════════════════ */
function PhaseProgress({ phaseLabels, currentPhase, scores }) {
  if (!phaseLabels || phaseLabels.length === 0) return null
  return (
    <div className="phase-progress">
      <div className="phase-progress-title">동작 단계 (Gesture Steps)</div>
      <div className="phase-steps-container">
        {phaseLabels.map((label, i) => {
          const isDone   = i < currentPhase
          const isActive = i === currentPhase
          const score    = scores?.[label]
          let statusClass = 'pending'
          if (isDone) statusClass = 'done'
          else if (isActive) statusClass = score ? 'active-pass' : 'active-waiting'
          return (
            <div key={i} className={`phase-step-item ${statusClass}`}>
              <div className="step-number">{isDone ? '✓' : i + 1}</div>
              <div className="step-text">{label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function GestureCheck() {
  const videoRef     = useRef(null)
  const canvasRef    = useRef(null)
  const handsRef     = useRef(null)
  const cameraRef    = useRef(null)
  const motionRef    = useRef([])
  const holdRef      = useRef(null)
  const signIdxRef   = useRef(0)
  const submittedRef = useRef(false)
  const phaseRef     = useRef({})

  const [loaded,     setLoaded]     = useState(false)
  const [error,      setError]      = useState('')
  const [camOn,      setCamOn]      = useState(false)
  const [signIdx,    setSignIdx]    = useState(0)
  const [scores,     setScores]     = useState(null)
  const [holdPct,    setHoldPct]    = useState(0)
  const [submitted,  setSubmitted]  = useState(false)
  const [aiFb,       setAiFb]       = useState('')
  const [aiLoad,     setAiLoad]     = useState(false)
  const [streak,     setStreak]     = useState(0)
  const [history,    setHistory]    = useState([])
  const [filter,     setFilter]     = useState('all')
  const [phaseState, setPhaseState] = useState(null)

  const sign = GESTURE_SIGNS[signIdx]

  useEffect(() => { signIdxRef.current = signIdx }, [signIdx])
  useEffect(() => { submittedRef.current = submitted }, [submitted])

  /* ── Load MediaPipe ── */
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { Hands, HAND_CONNECTIONS } = await import('@mediapipe/hands')
        if (cancelled) return
        const hands = new Hands({
          locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        })
        hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.6 })
        hands.onResults(results => onResults(results, HAND_CONNECTIONS))
        handsRef.current = hands
        if (!cancelled) setLoaded(true)
      } catch {
        if (!cancelled) setError('MediaPipe를 로드할 수 없습니다.')
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  /* ── Camera ── */
  const startCamera = useCallback(async () => {
    if (!loaded || !videoRef.current) return
    try {
      const { Camera } = await import('@mediapipe/camera_utils')
      const cam = new Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && videoRef.current)
            await handsRef.current.send({ image: videoRef.current })
        },
        width: 640, height: 480,
      })
      await cam.start()
      cameraRef.current = cam
      setCamOn(true)
    } catch {
      setError('카메라 접근 권한이 필요합니다.')
    }
  }, [loaded])

  const stopCamera = useCallback(() => {
    cameraRef.current?.stop()
    setCamOn(false)
    setScores(null)
    setPhaseState(null)
    motionRef.current = []
    if (holdRef.current) { cancelAnimationFrame(holdRef.current); holdRef.current = null }
    setHoldPct(0)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  /* ── Per-frame handler ── */
  const onResults = useCallback((results, HAND_CONNECTIONS) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)

    if (!results.multiHandLandmarks?.length) {
      setScores(null); setPhaseState(null); motionRef.current = []; ctx.restore(); return
    }

    const lm    = results.multiHandLandmarks[0]
    drawConnections(ctx, lm, HAND_CONNECTIONS, canvas.width, canvas.height)
    drawLandmarks(ctx, lm, canvas.width, canvas.height)

    const wrist = lm[LM.WRIST]
    motionRef.current = [...motionRef.current.slice(-29), { x: wrist.x, y: wrist.y, z: wrist.z || 0 }]

    const currentSign = GESTURE_SIGNS[signIdxRef.current]
    if (!currentSign || submittedRef.current) { ctx.restore(); return }

    const checker  = currentSign.checker
    const isStatic = STATIC_CHECKERS.has(checker)
    let allPass    = false

    if (isStatic) {
      const result = checkStatic(checker, lm, motionRef.current)
      if (!result) { ctx.restore(); return }
      setScores(result)
      setPhaseState(null)
      allPass = Object.values(result).every(v => v === true)
    } else {
      const phaseResult = runPhaseEngine(checker, lm, motionRef.current, phaseRef)
      if (!phaseResult) { ctx.restore(); return }
      setPhaseState(phaseResult)
      setScores(phaseResult.scores)
      allPass = phaseResult.complete
    }

    if (allPass) {
      if (!holdRef.current) {
        const start        = Date.now()
        const holdDuration = isStatic ? 1500 : 800
        const tick = () => {
          const pct = Math.min(100, ((Date.now() - start) / holdDuration) * 100)
          setHoldPct(pct)
          if (pct < 100) {
            holdRef.current = requestAnimationFrame(tick)
          } else {
            holdRef.current = null
            autoSubmit(currentSign)
          }
        }
        holdRef.current = requestAnimationFrame(tick)
      }
    } else {
      if (holdRef.current) { cancelAnimationFrame(holdRef.current); holdRef.current = null; setHoldPct(0) }
    }
    ctx.restore()
  }, [])

  /* ── Auto-submit ── */
  const autoSubmit = useCallback(async (currentSign) => {
    setSubmitted(true); setHoldPct(100); stopCamera()
    setStreak(s => s + 1)
    setHistory(h => [{ label: currentSign.label, ts: new Date().toLocaleTimeString('ko-KR'), pass: true }, ...h.slice(0, 7)])
    setAiLoad(true)
    try {
      const body = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `학습자가 한국수어 "${currentSign.label}" (${currentSign.english}) 수어를 성공적으로 수행했습니다. 3가지를 알려주세요: 1) 짧은 격려 메시지 2) 이 수어를 사용하는 실생활 문장 예시 한 개 3) 다음에 배우면 좋을 관련 수어 한 개 추천. 총 3-4문장, 한국어로.`,
        }],
        system: '한국수어 전문 강사. 간결하고 친근하게.',
      }
      const res  = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setAiFb(data.content?.map(b => b.text || '').join('').trim() || '')
    } catch {
      setAiFb('피드백을 불러올 수 없습니다.')
    }
    setAiLoad(false)
  }, [stopCamera])

  /* ── Reset ── */
  const resetSign = useCallback((newIdx) => {
    const s = GESTURE_SIGNS[newIdx]
    phaseRef.current = { ...phaseRef.current, [s?.checker]: 0 }
    setSignIdx(newIdx)
    setScores(null)
    setPhaseState(null)
    setSubmitted(false)
    setAiFb('')
    setHoldPct(0)
    motionRef.current = []
    if (holdRef.current) { cancelAnimationFrame(holdRef.current); holdRef.current = null }
  }, [])

  const nextSign = () => {
    const pool = filter === 'all' ? GESTURE_SIGNS : GESTURE_SIGNS.filter(s => s.difficulty === filter)
    const next = pool[Math.floor(Math.random() * pool.length)]
    if (camOn) stopCamera()
    resetSign(GESTURE_SIGNS.indexOf(next))
  }

  /* ── Draw helpers ── */
  function drawConnections(ctx, lm, CONNECTIONS, w, h) {
    ctx.strokeStyle = 'rgba(124,111,255,0.6)'; ctx.lineWidth = 2
    for (const [a, b] of CONNECTIONS) {
      ctx.beginPath()
      ctx.moveTo(lm[a].x * w, lm[a].y * h)
      ctx.lineTo(lm[b].x * w, lm[b].y * h)
      ctx.stroke()
    }
  }
  function drawLandmarks(ctx, lm, w, h) {
    for (let i = 0; i < lm.length; i++) {
      const isTip = [4, 8, 12, 16, 20].includes(i)
      ctx.beginPath()
      ctx.arc(lm[i].x * w, lm[i].y * h, isTip ? 6 : 4, 0, Math.PI * 2)
      ctx.fillStyle = isTip ? '#7c6fff' : '#ffffff'
      ctx.strokeStyle = '#7c6fff'; ctx.lineWidth = 2
      ctx.fill(); ctx.stroke()
    }
  }

  const isStaticSign = sign && STATIC_CHECKERS.has(sign.checker)
  const passCount    = scores ? Object.values(scores).filter(v => v === true).length : 0
  const totalParams  = scores ? Object.keys(scores).length : 0
  const DIFF_COLORS  = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' }
  const DIFF_LABELS  = { easy: '쉬움', medium: '보통', hard: '어려움' }

  return (
    <div className="gc-wrap">
      <div className="gc-header">
        <div className="gc-title-row">
          <h2 className="gc-title">📷 카메라 제스처 연습</h2>
          <div className="gc-streak">
            <span className="streak-fire">🔥</span>
            <span className="streak-n">{streak}</span>
            <span className="streak-lbl">연속</span>
          </div>
        </div>
        <p className="gc-sub">MediaPipe로 수형·수위·수향·수동을 실시간 감지합니다 ({GESTURE_SIGNS.length}개 수어)</p>
        <div className="gc-filter">
          {[['all','전체'],['easy','쉬움'],['medium','보통']].map(([v, l]) => (
            <button key={v} className={`gc-filter-btn ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      {error && <div className="gc-error">⚠️ {error}</div>}
      {!loaded && !error && (
        <div className="gc-loading"><div className="gc-spinner" /><span>MediaPipe 로딩 중...</span></div>
      )}

      {loaded && (
        <div className="gc-body">
          {/* Sign selector */}
          <div className="sign-selector">
            {GESTURE_SIGNS
              .filter(s => filter === 'all' || s.difficulty === filter)
              .map(s => (
                <button
                  key={s.id}
                  className={`sign-pill ${sign.id === s.id ? 'active' : ''}`}
                  style={{ '--sc': s.color }}
                  onClick={() => { if (camOn) stopCamera(); resetSign(GESTURE_SIGNS.indexOf(s)) }}
                >
                  {s.label}
                  <span className="pill-diff" style={{ color: DIFF_COLORS[s.difficulty] }}>
                    {DIFF_LABELS[s.difficulty]}
                  </span>
                  {!STATIC_CHECKERS.has(s.checker) && (
                    <span className="pill-dynamic">▶</span>
                  )}
                </button>
              ))}
          </div>

          <div className="gc-main">
            {/* Camera column */}
            <div className="gc-cam-col">
              <div className="cam-wrapper">
                <video ref={videoRef} className="cam-video" playsInline muted />
                <canvas ref={canvasRef} className="cam-canvas" width={640} height={480} />
                {!camOn && !submitted && (
                  <div className="cam-overlay">
                    <div className="cam-overlay-inner">
                      <div className="cam-sign-preview">
                        <div className="csp-label">{sign.label}</div>
                        <div className="csp-en">{sign.english}</div>
                        {!isStaticSign && (
                          <div className="csp-dynamic-badge">
                            ▶ 동작 수어 ({(PHASE_DEFS[sign.checker] || []).length}단계)
                          </div>
                        )}
                      </div>
                      <div className="cam-animator-wrap">
                        <SignAnimator signId={sign.id} color={sign.color} compact />
                      </div>
                      <button className="cam-start-btn" onClick={startCamera}>📷 카메라 시작</button>
                    </div>
                  </div>
                )}
                {submitted && (
                  <div className="cam-overlay success-overlay">
                    <div className="success-badge">✓</div>
                    <div className="success-label">완료!</div>
                  </div>
                )}
                {camOn && !submitted && holdPct > 0 && (
                  <div className="hold-ring-wrap">
                    <svg viewBox="0 0 48 48" className="hold-ring">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                      <circle cx="24" cy="24" r="20" fill="none" stroke="#10b981" strokeWidth="4"
                        strokeDasharray={`${2*Math.PI*20}`}
                        strokeDashoffset={`${2*Math.PI*20*(1-holdPct/100)}`}
                        transform="rotate(-90 24 24)" strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                      />
                    </svg>
                    <span className="hold-pct">{Math.round(holdPct)}%</span>
                  </div>
                )}
                {camOn && !submitted && (
                  <div className="live-badge"><span className="live-dot" />감지 중</div>
                )}
              </div>
              {camOn && !submitted && (
                <button className="cam-stop-btn" onClick={stopCamera}>카메라 중지</button>
              )}
            </div>

            {/* Score column */}
            <div className="gc-score-col">
              <SignAnimator signId={sign.id} color={sign.color} />

              {!isStaticSign && phaseState && !submitted && (
                <PhaseProgress
                  phaseLabels={phaseState.phaseLabels}
                  currentPhase={phaseState.phase}
                  scores={phaseState.scores}
                />
              )}

              <div className="param-panel">
                <div className="pp-title">
                  {isStaticSign ? '실시간 5요소 체크' : '실시간 동작 감지'}
                  {scores && (
                    <span className="pp-score" style={{ color: passCount >= Math.ceil(totalParams/2) ? '#10b981' : '#f59e0b' }}>
                      {passCount}/{totalParams}
                    </span>
                  )}
                </div>
                {!scores && !submitted && (
                  <div className="pp-idle">카메라를 시작하면 실시간으로 체크됩니다</div>
                )}
                {scores && !submitted && Object.entries(sign.checkParams).map(([k, desc]) => (
                  <ParamRow key={k} label={`${k}: ${desc}`} value={
                    isStaticSign
                      ? scores[k]
                      : phaseState?.scores[phaseState?.phaseLabels[phaseState?.phase]] || 'waiting'
                  } />
                ))}
                {submitted && Object.entries(sign.checkParams).map(([k, desc]) => (
                  <ParamRow key={k} label={`${k}: ${desc}`} value={true} />
                ))}
              </div>

              {(aiLoad || aiFb) && (
                <div className={`gc-ai-box ${aiFb ? 'has-content' : ''} ${aiLoad ? 'loading' : ''}`}>
                  <div className="gc-ai-header">
                    <span>🤖</span><span>AI 피드백</span>
                    {aiLoad && <span className="ai-dot" />}
                  </div>
                  {aiLoad
                    ? <div className="ai-skel"><div className="sk-line" /><div className="sk-line short" /></div>
                    : <p className="gc-ai-text">{aiFb}</p>}
                </div>
              )}

              {(submitted || !camOn) && (
                <button className="gc-next-btn" onClick={nextSign}>
                  {submitted ? '✓ 다음 수어 →' : '⏭ 다른 수어'}
                </button>
              )}
            </div>
          </div>

          {history.length > 0 && (
            <div className="gc-history">
              <div className="gh-title">🕐 최근 완료</div>
              <div className="gh-list">
                {history.map((h, i) => (
                  <div key={i} className="gh-item">
                    <span className="gh-label">{h.label}</span>
                    <span className="gh-pass">✓</span>
                    <span className="gh-time">{h.ts}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}