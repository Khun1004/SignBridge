import { useState, useEffect, useRef, useCallback } from 'react'
import './GestureCheck.css'
import SignAnimator from './SignAnimator'

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
    instruction: '왼손을 펴서 가슴 앞에 눕히고, 오른손도 펴서 왼손 위에 올린 뒤 오른손 날로 왼손 등을 두 번 두드립니다.',
    checker: 'thankyou',
    checkParams: {
      수형: '편손 (양손)',
      수위: '가슴 앞',
      수향: '왼손 바닥이 아래',
      수동: '오른손 날로 왼손 등 두드리기 2회',
    },
  },
  {
    id: 'g12', cat: 'greet', label: '죄송합니다', english: 'Sorry',
    color: '#7c6fff', difficulty: 'easy',
    instruction: '오른손 엄지+검지로 O형을 만들어 이마에 댔다가 내리며 왼 손등 위에 얹습니다.',
    checker: 'sorry',
    checkParams: { 수형: 'O형 핀치 (엄지+검지)', 수위: '이마 → 왼 손등', 수향: '손바닥이 앞', 수동: '이마 터치 → 내리며 왼 손등 얹기' },
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
    instruction: '엄지와 검지를 펴서 L형을 만들고, 왼쪽 가슴을 엄지+검지 끝으로 두 번 터치합니다.',
    checker: 'name',
    checkParams: { 수형: 'L형 (엄지+검지)', 수위: '왼쪽 가슴', 수향: '손바닥이 가슴 방향', 수동: '왼쪽 가슴 두 번 터치' },
  },

  /* ── 긴급 ── */
  {
    id: 'e01', cat: 'emergency', label: '도움', english: 'Help',
    color: '#ef4444', difficulty: 'medium',
    instruction: '왼손 엄지만 펴서 오른손 손바닥에 가볍게 두 번 두드립니다.',
    checker: 'help',
    checkParams: { 수형: '왼 엄지 + 오른 편손', 수위: '가슴 앞', 수동: '왼 엄지로 손바닥 두드리기 ×2' },
  },
  {
    id: 'e02', cat: 'emergency', label: '신고', english: 'Report',
    color: '#ef4444', difficulty: 'medium',
    instruction: '검지를 입 앞에 세우고(손등이 밖), 앞쪽으로 내밉니다.',
    checker: 'report',
    checkParams: { 수형: '1형 (검지만)', 수위: '입 앞', 수향: '손등이 밖을 향함', 수동: '앞으로 내밀기' },
  },
  {
    id: 'e03', cat: 'emergency', label: '위험', english: 'Danger',
    color: '#ef4444', difficulty: 'medium',
    instruction: '오른손을 C형으로 구부려 가슴을 가볍게 두 번 두드립니다.',
    checker: 'danger',
    checkParams: { 수형: 'C형 (구형)', 수위: '가슴', 수향: '손바닥이 가슴 방향', 수동: 'C형으로 가슴 두드리기 2회' },
  },

  /* ── 의료 ── */
  {
    id: 'm01', cat: 'medical', label: '의사', english: 'Doctor',
    color: '#10b981', difficulty: 'medium',
    instruction: '왼손 주먹(손등이 밖), 오른 V형으로 손등 한 번 → 손목 두 번 칩니다.',
    checker: 'doctor',
    checkParams: { 수형: 'fist + V형 (검지+중지)', 수위: '왼 손등 → 왼 손목', 수향: '손등이 밖을 향함', 수동: '손등 ×1 → 손목 ×2' },
  },
  {
    id: 'm02', cat: 'medical', label: '아프다', english: 'Pain',
    color: '#10b981', difficulty: 'easy',
    instruction: '손바닥을 위로 하여 살짝 오므리고(C형), 가슴/배 앞에서 좌우로 가볍게 흔듭니다.',
    checker: 'pain',
    checkParams: { 수형: 'C형 (살짝 오므림)', 수위: '가슴/배 앞', 수향: '손바닥이 위', 수동: '좌우로 흔들기' },
  },
  {
    id: 'm03', cat: 'medical', label: '약', english: 'Medicine',
    color: '#10b981', difficulty: 'easy',
    instruction: '왼 손바닥을 위로 펴고, 오른 V형(검지+중지)으로 손바닥 위를 앞뒤로 문지릅니다.',
    checker: 'medicine',
    checkParams: { 수형: 'V형 (검지+중지)', 수위: '왼 손바닥 위', 수향: '손바닥이 아래', 수동: '앞뒤로 문지르기' },
  },
  {
    id: 'm04', cat: 'medical', label: '열', english: 'Fever',
    color: '#10b981', difficulty: 'easy',
    instruction: '오른 손바닥을 이마에 댔다가 떼어 왼 손바닥에 댔다가 빠르게 뗍니다.',
    checker: 'fever',
    checkParams: { 수형: '편손 + 편손 (양손)', 수위: '이마 → 왼 손바닥', 수향: '손바닥이 아래', 수동: '이마 터치 후 왼 손바닥으로 이동' },
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
    id: 'f23', cat: 'feeling', label: '좋다', english: 'Good / Like',
    color: '#ec4899', difficulty: 'easy',
    instruction: '한 손으로 엄지손가락만 위로 세웁니다 👍',
    checker: 'good',
    checkParams: { 수형: '엄지 위로 👍', 수위: '가슴 앞', 수향: '엄지가 위를 향함', 수동: '엄지 세우고 유지' },
  },
  {
    id: 'f24', cat: 'feeling', label: '싫다', english: 'Dislike',
    color: '#ec4899', difficulty: 'easy',
    instruction: '한 손으로 엄지손가락을 아래로 향하게 합니다 👎',
    checker: 'dislike',
    checkParams: { 수형: '엄지 아래로 👎', 수위: '가슴 앞', 수향: '엄지가 아래를 향함', 수동: '엄지 아래로 세우고 유지' },
  },

  /* ── 숫자 1–10 ── */
  {
    id: 'n27', cat: 'number', label: '1', english: 'One',
    color: '#6366f1', difficulty: 'easy',
    instruction: '검지만 세우고 나머지는 주먹. 손등이 밖(상대방)을 향하게.',
    checker: 'one',
    checkParams: { 수형: '검지만', 수동: '정지' },
  },
  {
    id: 'n28', cat: 'number', label: '2', english: 'Two',
    color: '#6366f1', difficulty: 'easy',
    instruction: '엄지와 검지를 펴고 손을 45° 모로 기울여 손등이 밖을 향하게 합니다.',
    checker: 'two',
    checkParams: { 수형: '검지+중지 (엄지 접음)', 수동: '정지' },
  },
  {
    id: 'n29', cat: 'number', label: '3', english: 'Three',
    color: '#6366f1', difficulty: 'easy',
    instruction: '엄지·검지·중지 세 손가락을 펴고 손등이 밖을 향하게 합니다.',
    checker: 'three',
    checkParams: { 수형: '검지+중지+약지 (엄지·소지 접음)', 수동: '정지' },
  },
  {
    id: 'n30', cat: 'number', label: '4', english: 'Four',
    color: '#6366f1', difficulty: 'easy',
    instruction: '엄지·검지·중지·약지 네 손가락을 펴고(소지 접음) 손등이 밖을 향하게 합니다.',
    checker: 'four',
    checkParams: { 수형: '검지+중지+약지+소지 (엄지만 접음)', 수동: '정지' },
  },
  {
    id: 'n31', cat: 'number', label: '5', english: 'Five',
    color: '#6366f1', difficulty: 'easy',
    instruction: '엄지만 위로 세웁니다. 나머지 손가락은 주먹 쥡니다.',
    checker: 'five',
    checkParams: { 수형: '엄지만 (살짝 기울어짐)', 수동: '정지' },
  },
  {
    id: 'n32', cat: 'number', label: '6', english: 'Six',
    color: '#6366f1', difficulty: 'easy',
    instruction: '엄지와 새끼손가락(소지)만 펴서 Y자 모양을 만들고, 손등이 밖을 향하게.',
    checker: 'six',
    checkParams: { 수형: '엄지+검지 수직, 손등이 밖', 수동: '정지' },
  },
  {
    id: 'n33', cat: 'number', label: '7', english: 'Seven',
    color: '#6366f1', difficulty: 'easy',
    instruction: '엄지와 약지를 펴고 나머지는 접습니다.',
    checker: 'seven',
    checkParams: { 수형: '엄지+검지+중지 수직, 손등이 밖', 수동: '정지' },
  },
  {
    id: 'n34', cat: 'number', label: '8', english: 'Eight',
    color: '#6366f1', difficulty: 'easy',
    instruction: '엄지와 중지를 펴고 나머지는 접습니다.',
    checker: 'eight',
    checkParams: { 수형: '엄지+검지+중지+약지 수직, 손등이 밖', 수동: '정지' },
  },
  {
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
    checkParams: { 수형: '1형 검지 (오른손)', 수위: '가슴 앞', 수향: '손등이 밖을 향함', 수동: '좌우로 살짝 흔들기' },
  },

  /* ── 일상 ── */
  {
    id: 'd37', cat: 'daily', label: '물', english: 'Water',
    color: '#3b82f6', difficulty: 'easy',
    instruction: '엄지와 검지를 펴고(나머지 접음), 컵을 잡듯 입 쪽으로 기울입니다.',
    checker: 'water',
    checkParams: { 수형: '엄지+검지 펴기 (나머지 접음)', 수위: '입 주변', 수향: '엄지+검지가 위', 수동: '마시기 동작' },
  },

  /* ── 신체 ── */
  {
    id: 'b38', cat: 'body', label: '머리', english: 'Head',
    color: '#f97316', difficulty: 'easy',
    instruction: '손으로 머리 부분을 가리킵니다.',
    checker: 'head',
    checkParams: { 수형: '검지 (1형)', 수위: '머리', 수동: '머리 가리키기' },
  },
  {
    id: 'b39', cat: 'body', label: '눈', english: 'Eyes',
    color: '#f97316', difficulty: 'easy',
    instruction: '검지로 눈 아래 주변을 가리킵니다.',
    checker: 'eyes',
    checkParams: { 수형: '1형 (검지만)', 수위: '눈', 수동: '눈 가리키기' },
  },
]

/* ══════════════════════════════════════════════════════════
   STATIC CHECKERS
══════════════════════════════════════════════════════════ */
const STATIC_CHECKERS = new Set([
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'eyes', 'why', 'water', 'good', 'dislike',
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

const dist = (a, b) => Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2)  // z removed — unreliable

function isExtended(lm, tipIdx, mcpIdx) {
  return dist(lm[tipIdx], lm[LM.WRIST]) > dist(lm[mcpIdx], lm[LM.WRIST]) * 0.85
}

const indexUp   = lm => isExtended(lm, LM.INDEX_TIP,  LM.INDEX_MCP)
const middleUp  = lm => isExtended(lm, LM.MIDDLE_TIP, LM.MIDDLE_MCP)
const ringUp    = lm => isExtended(lm, LM.RING_TIP,   LM.RING_MCP)
const pinkyUp   = lm => isExtended(lm, LM.PINKY_TIP,  LM.PINKY_MCP)
const thumbUp       = lm => lm[LM.THUMB_TIP].y < lm[LM.THUMB_MCP].y - 0.04
const thumbDown     = lm => lm[LM.THUMB_TIP].y > lm[LM.THUMB_MCP].y + 0.04
const thumbExtended = lm => dist(lm[LM.THUMB_TIP], lm[LM.WRIST]) > dist(lm[LM.THUMB_MCP], lm[LM.WRIST]) * 0.9

function palmFacingCamera(lm) {
  // Primary: z-axis (finger tips closer to camera than wrist = palm facing camera)
  const tips = [LM.INDEX_TIP, LM.MIDDLE_TIP, LM.RING_TIP, LM.PINKY_TIP]
  const avgTipZ = tips.reduce((s, i) => s + (lm[i].z || 0), 0) / 4
  const zCheck = (lm[LM.WRIST].z || 0) > avgTipZ
  // Secondary: thumb position - if thumb is to the LEFT of index MCP, palm faces camera (in mirror)
  const thumbLeft = lm[LM.THUMB_TIP].x < lm[LM.INDEX_MCP].x
  // Accept if either check passes (z unreliable when hand sideways)
  return zCheck || thumbLeft
}

function backFacingCamera(lm) {
  return !palmFacingCamera(lm)
}

function wristZone(lm) {
  const wy = lm[LM.WRIST].y
  if (wy < 0.45) return 'head'   // wide — covers temple, side of head, forehead
  if (wy < 0.62) return 'face'
  if (wy < 0.78) return 'chest'
  return 'low'
}

function tipZone(lm, tipIdx) {
  const ty = lm[tipIdx].y
  if (ty < 0.45) return 'head'
  if (ty < 0.62) return 'face'
  if (ty < 0.78) return 'chest'
  return 'low'
}

const fourFingersUp = lm => indexUp(lm) && middleUp(lm) && ringUp(lm) && pinkyUp(lm)
const isFist        = lm => !indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm)
const isYHand       = lm => thumbUp(lm) && pinkyUp(lm) && !indexUp(lm) && !middleUp(lm) && !ringUp(lm)
const isPinch       = lm => dist(lm[LM.THUMB_TIP], lm[LM.INDEX_TIP]) < 0.06
const isCHand       = lm => {
  // C형: fingers curled but not fist — at least 2 fingers partially extended
  // tip is farther from wrist than MCP (not fist) but closer than fully extended
  const partialIndex  = dist(lm[LM.INDEX_TIP],  lm[LM.WRIST]) > dist(lm[LM.INDEX_MCP],  lm[LM.WRIST]) * 0.7
  const partialMiddle = dist(lm[LM.MIDDLE_TIP], lm[LM.WRIST]) > dist(lm[LM.MIDDLE_MCP], lm[LM.WRIST]) * 0.7
  const partialRing   = dist(lm[LM.RING_TIP],   lm[LM.WRIST]) > dist(lm[LM.RING_MCP],   lm[LM.WRIST]) * 0.7
  const notFist       = !isFist(lm)
  const notOpen       = !fourFingersUp(lm)
  return notFist && notOpen && (partialIndex || partialMiddle || partialRing)
}
const isLooseGather = lm => dist(lm[LM.THUMB_TIP], lm[LM.MIDDLE_TIP]) < 0.10
const isThumbIndex  = lm => thumbUp(lm) && indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm)

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
const detectBackwardSwipe  = h => h.length >= 8 && Math.abs(h.slice(-8).at(-1).x - h.slice(-8)[0].x) > 0.05
const detectStrongDownward = h => h.length >= 6 && (h.slice(-6).at(-1).y - h.slice(-6)[0].y) > 0.08
const detectBackAndForth   = h => { if (h.length < 12) return false; const xs = h.slice(-12).map(p=>p.x); const mid = Math.floor(xs.length/2); return (Math.max(...xs)-Math.min(...xs)) > 0.05 && Math.sign(xs[mid]-xs[0]) !== Math.sign(xs[xs.length-1]-xs[mid]) }
function detectDoubleKnock(h) {
  if (h.length < 10) return false
  const recent = h.slice(-24)
  
  let knocks = 0
  let inKnock = false

  for (let i = 1; i < recent.length; i++) {
    const dy = recent[i].y - recent[i - 1].y
    if (dy > 0.012) {          // moving down fast enough
      if (!inKnock) {
        knocks++               // count each new downstroke
        inKnock = true
      }
    } else if (dy < -0.008) { // moving back up
      inKnock = false          // ready to detect next knock
    }
  }

  // must have 2 knocks AND hand is now still
  const last4 = recent.slice(-4)
  const stillNow = (Math.max(...last4.map(p => p.y)) - Math.min(...last4.map(p => p.y))) < 0.01

  return knocks >= 2 && stillNow
}
/* ══════════════════════════════════════════════════════════
   PHASE DEFINITIONS
══════════════════════════════════════════════════════════ */
const PHASE_DEFS = {
  hello: [
    { label: '① B형(편손) 관자놀이 대기',   check: (lm) => fourFingersUp(lm) && !thumbUp(lm) && (wristZone(lm) === 'head' || wristZone(lm) === 'face' || tipZone(lm, LM.INDEX_TIP) === 'head' || tipZone(lm, LM.INDEX_TIP) === 'face') },
    { label: '② 아래로 쓸어내리기',          check: (lm, h) => detectDownwardSwipe(h) },
    { label: '③ 양손 주먹 가슴 앞 멈춤',    check: (lm, h, lm2) => isFist(lm) && wristZone(lm) === 'chest' && isStill(h) && (!lm2 || isFist(lm2)) },
  ],
  thankyou: [
    {
      label: '① 왼손 편손으로 가슴 앞에',
      check: (lm, h, lm2) => {
        // lm2 = left hand: four fingers up, chest height
        return lm2 != null
          && fourFingersUp(lm2)
          && wristZone(lm2) === 'chest'
      },
    },
    {
      label: '② 오른손 편손을 왼손 위에',
      check: (lm, h, lm2) => {
        // right hand: four fingers up, chest height
        // right wrist lower than left wrist (on top of left hand)
        const rightOk = fourFingersUp(lm) && wristZone(lm) === 'chest'
        const aboveLeft = lm2 != null
          ? lm[LM.WRIST].y > lm2[LM.WRIST].y - 0.08
          : true
        return rightOk && aboveLeft
      },
    },
    {
      label: '③ 오른손 날로 두 번 두드리기',
      check: (lm, h, lm2) => {
        const rightStillOpen = fourFingersUp(lm) && wristZone(lm) === 'chest'
        const knocking = detectDoubleKnock(h)
        return rightStillOpen && knocking
      },
    },
  ],
  sorry: [
    { label: '① O형(엄지+검지) 이마에 대기', check: (lm) => isPinch(lm) && (wristZone(lm) === 'face' || wristZone(lm) === 'head' || tipZone(lm, LM.INDEX_TIP) === 'face' || tipZone(lm, LM.INDEX_TIP) === 'head') },
    { label: '② 가슴 앞으로 내리기',          check: (lm, h) => detectDownwardSwipe(h) },
    { label: '③ 왼 손등 위에 얹기 (멈춤)',    check: (lm, h) => wristZone(lm) === 'chest' && isStill(h) },
  ],
  okay: [
    { label: '① 소지 펴고 턱 아래', check: (lm) => pinkyUp(lm) && !indexUp(lm) && !middleUp(lm) && !ringUp(lm) && (wristZone(lm) === 'face' || wristZone(lm) === 'chest') },
    { label: '② 톡톡 두드리기',     check: (lm, h) => detectNodding(h) },
  ],
  name: [
    { label: '① L형 (엄지+검지) 왼쪽 가슴 앞',
      check: (lm) => thumbUp(lm) && indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm) && wristZone(lm) === 'chest' },
    { label: '② 왼쪽 가슴 두 번 터치',
      check: (lm, h) => detectNodding(h) },
  ],
  help: [
    { label: '① 왼손 엄지만 세우기',
      check: (lm, h, lm2) =>
        lm2 != null && thumbUp(lm2) && !indexUp(lm2) && !middleUp(lm2) && !ringUp(lm2) && !pinkyUp(lm2) &&
        wristZone(lm2) === 'chest'
    },
    { label: '② 오른 손바닥 가슴 앞에 펴기',
      check: (lm) =>
        fourFingersUp(lm) && wristZone(lm) === 'chest'
    },
    { label: '③ 오른 손바닥에 왼 엄지로 톡톡',
      check: (lm, h, lm2) => {
        const tapping   = detectNodding(h)
        const thumbBelow = lm2 != null && lm2[LM.WRIST].y > lm[LM.WRIST].y - 0.05
        return tapping && thumbBelow
      }
    },
  ],
  report: [
    { label: '① 검지 입 앞에 세우기',
      check: (lm) =>
        indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm) &&
        (wristZone(lm) === 'face' || wristZone(lm) === 'chest' ||
         tipZone(lm, LM.INDEX_TIP) === 'face')
    },
    { label: '② 앞으로 내밀기',
      check: (lm, h) => {
        // z unreliable — detect any wrist movement (lateral or depth)
        if (h.length < 6) return false
        const recent = h.slice(-6)
        const dx = Math.abs(recent.at(-1).x - recent[0].x)
        const dy = Math.abs(recent.at(-1).y - recent[0].y)
        const dz = Math.abs((recent[0].z || 0) - (recent.at(-1).z || 0))
        return dx > 0.04 || dy > 0.03 || dz > 0.02
      }
    },
  ],
  danger: [
    { label: '① C형 손 가슴 앞에',
      check: (lm) => isCHand(lm) && wristZone(lm) === 'chest'
    },
    { label: '② 가슴 두드리기 2회',
      check: (lm, h) => detectNodding(h) && wristZone(lm) === 'chest'
    },
  ],
  doctor: [
    { label: '① 왼손 주먹 + 오른 V형 준비', check: (lm, h, lm2) => {
        const rightV  = indexUp(lm) && middleUp(lm) && !ringUp(lm) && !pinkyUp(lm) && wristZone(lm) === 'chest'
        const leftFist = !lm2 || (isFist(lm2) && wristZone(lm2) === 'chest')
        return rightV && leftFist
      }
    },
    { label: '② 왼 손등 한 번 두드리기',  check: (lm, h) => detectNodding(h) },
    { label: '③ 왼 손목 두 번 두드리기',  check: (lm, h) => detectNodding(h) },
  ],
  pain: [
    { label: '① C형, 손바닥 위 (가슴/배 앞)', check: (lm) => !fourFingersUp(lm) && !isFist(lm) && wristZone(lm) === 'chest' },
    { label: '② 좌우로 흔들기',                check: (lm, h) => detectLateralShake(h) },
  ],
  medicine: [
    { label: '① 오른 검지 + 왼 손바닥 위에', check: (lm, h, lm2) => {
        const rightOk = indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm) && wristZone(lm) === 'chest'
        const leftOk  = !lm2 || (fourFingersUp(lm2) && wristZone(lm2) === 'chest')
        return rightOk && leftOk
      }
    },
    { label: '② 앞뒤로 문지르기', check: (lm, h) => detectBackAndForth(h) },
  ],
  fever: [
    { label: '① 오른손 이마 + 왼 손바닥 준비', check: (lm, h, lm2) => {
        const rightFace = fourFingersUp(lm) && (wristZone(lm) === 'head' || wristZone(lm) === 'face' || tipZone(lm, LM.INDEX_TIP) === 'head' || tipZone(lm, LM.INDEX_TIP) === 'face')
        const leftReady = !lm2 || wristZone(lm2) === 'chest'
        return rightFace && leftReady
      }
    },
    { label: '② 왼 손바닥으로 내리기', check: (lm, h) => detectDownwardSwipe(h) },
  ],
  visa: [
    { label: '① 왼손 펴서 위로 + 오른 주먹 준비', check: (lm, h, lm2) => {
        const leftFlat = lm2 && fourFingersUp(lm2) && wristZone(lm2) === 'chest'
        const rightFist = isFist(lm) && wristZone(lm) === 'chest'
        return leftFlat || rightFist  // accept either: some do left dominant
      }
    },
    { label: '② 주먹으로 도장 찍기', check: (lm, h) => detectNodding(h) },
  ],
  travel: [
    { label: '① 양손 검지 어깨 앞', check: (lm, h, lm2) => {
        const rightOk = indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm) && wristZone(lm) === 'chest'
        const leftOk  = !lm2 || (indexUp(lm2) && !middleUp(lm2) && wristZone(lm2) === 'chest')
        return rightOk && leftOk
      }
    },
    { label: '② 빙글빙글 돌리며 전진', check: (lm, h) => detectCircularMotion(h) },
  ],
  what: [
    { label: '① 검지 몸 앞에',  check: (lm) => indexUp(lm) && !middleUp(lm) && wristZone(lm) === 'chest' },
    { label: '② 좌우로 흔들기', check: (lm, h) => detectLateralShake(h) },
  ],
  where: [
    { label: '① 검지 몸 앞에',   check: (lm) => indexUp(lm) && !middleUp(lm) && wristZone(lm) === 'chest' },
    { label: '② 흔든 후 아래로', check: (lm, h) => detectDownwardSwipe(h) },
  ],
  again: [
    { label: '① 편손 앞으로', check: (lm) => fourFingersUp(lm) && wristZone(lm) === 'chest' },
    { label: '② 당기기',      check: (lm, h) => detectBackwardSwipe(h) },
  ],
  yes: [
    { label: '① 주먹 가슴 앞에',    check: (lm) => isFist(lm) && wristZone(lm) === 'chest' },
    { label: '② 위아래로 끄덕이기', check: (lm, h) => detectNodding(h) },
  ],
  no: [
    { label: '① 편손 몸 앞에',  check: (lm) => fourFingersUp(lm) && wristZone(lm) === 'chest' },
    { label: '② 좌우로 흔들기', check: (lm, h) => detectLateralShake(h) },
  ],
  yesterday: [
    { label: '① 검지 어깨 앞에', check: (lm) => indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm) },
    { label: '② 뒤로 넘기기',    check: (lm, h) => detectBackwardSwipe(h) },
  ],
  now: [
    { label: '① 양손 펴서 가슴 앞에', check: (lm, h, lm2) => {
        const rightOk = fourFingersUp(lm) && !thumbUp(lm) && wristZone(lm) === 'chest'
        const leftOk  = !lm2 || (fourFingersUp(lm2) && wristZone(lm2) === 'chest')
        return rightOk && leftOk
      }
    },
    { label: '② 동시에 아래로 내리기', check: (lm, h) => detectStrongDownward(h) },
  ],
  tomorrow: [
    { label: '① 검지 눈 옆에',  check: (lm) => indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm) && (wristZone(lm) === 'face' || wristZone(lm) === 'head' || tipZone(lm, LM.INDEX_TIP) === 'face' || tipZone(lm, LM.INDEX_TIP) === 'head') },
    { label: '② 앞으로 내밀기', check: (lm, h) => detectForwardPush(h) },
  ],
  ten: [
    { label: '① 오른 주먹에서 검지만 펴기',
      check: (lm) => indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm) && wristZone(lm) === 'chest' },
    { label: '② 좌우로 살짝 흔들기',
      check: (lm, h) => detectLateralShake(h) },
  ],
  head: [
    { label: '① 검지 머리 위에',
      check: (lm) => indexUp(lm) &&
                     (wristZone(lm) === 'head' || wristZone(lm) === 'face' ||
                      tipZone(lm, LM.INDEX_TIP) === 'head' || tipZone(lm, LM.INDEX_TIP) === 'face') },
    { label: '② 멈춤', check: (lm, h) => isStill(h) },
  ],
}

/* ══════════════════════════════════════════════════════════
   STATIC CHECKER
══════════════════════════════════════════════════════════ */
function checkStatic(checker, lm, h, lm2 = null) {
  if (!lm || lm.length < 21) return null
  switch (checker) {
    case 'one':
      return { 수형: indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm), 수동: isStill(h) }
    case 'two':
      return { 수형: indexUp(lm) && middleUp(lm) && !ringUp(lm) && !pinkyUp(lm), 수동: isStill(h) }
    case 'three':
      return { 수형: indexUp(lm) && middleUp(lm) && ringUp(lm) && !pinkyUp(lm), 수동: isStill(h) }
    case 'four':
      return { 수형: indexUp(lm) && middleUp(lm) && ringUp(lm) && pinkyUp(lm) && !thumbUp(lm), 수동: isStill(h) }
    case 'five':
      return { 수형: thumbExtended(lm) && !indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm), 수동: isStill(h) }
    case 'six':
      return { 수형: thumbExtended(lm) && indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm), 수동: isStill(h) }
    case 'seven':
      return { 수형: thumbExtended(lm) && indexUp(lm) && middleUp(lm) && !ringUp(lm) && !pinkyUp(lm), 수동: isStill(h) }
    case 'eight':
      return { 수형: thumbExtended(lm) && indexUp(lm) && middleUp(lm) && ringUp(lm) && !pinkyUp(lm), 수동: isStill(h) }
    case 'nine':
      return { 수형: thumbExtended(lm) && indexUp(lm) && middleUp(lm) && ringUp(lm) && pinkyUp(lm), 수동: isStill(h) }
    case 'eyes':
      return {
        수형: indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm),
        수위: wristZone(lm) === 'face' || wristZone(lm) === 'head'
              || tipZone(lm, LM.INDEX_TIP) === 'face' || tipZone(lm, LM.INDEX_TIP) === 'head',
        수동: isStill(h),
      }
    case 'why':
      return {
        수형: indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm),
        수위: wristZone(lm) === 'face' || wristZone(lm) === 'head'
              || tipZone(lm, LM.INDEX_TIP) === 'face' || tipZone(lm, LM.INDEX_TIP) === 'head',
        수동: isStill(h),
      }
    case 'water':
      // 엄지+검지 펴기 (나머지 접음) — isThumbIndex
      return {
        수형: thumbUp(lm) && indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm),
        수위: wristZone(lm) === 'face',
        수동: isStill(h),
      }
    case 'good':
      // 👍 엄지만 위로
      return {
        수형: thumbUp(lm) && !indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm),
        수동: isStill(h),
      }
    case 'dislike':
      // 👎 엄지만 아래로
      return {
        수형: thumbDown(lm) && !indexUp(lm) && !middleUp(lm) && !ringUp(lm) && !pinkyUp(lm),
        수동: isStill(h),
      }
    default:
      return null
  }
}

/* ══════════════════════════════════════════════════════════
   PHASE ENGINE
══════════════════════════════════════════════════════════ */
function runPhaseEngine(checker, lm, motionHistory, phaseRef, lm2 = null) {
  const phases = PHASE_DEFS[checker]
  if (!phases) return null
  const currentPhase = phaseRef.current[checker] || 0
  const phaseDef     = phases[currentPhase]
  if (!phaseDef) return null
  const passed = phaseDef.check(lm, motionHistory, lm2)
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
  const activeRef    = useRef(false)   // ← gate: only process when camera is truly active

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

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { Hands, HAND_CONNECTIONS } = await import('@mediapipe/hands')
        if (cancelled) return
        const hands = new Hands({
          locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        })
        hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 })
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

  const startCamera = useCallback(async () => {
    if (!loaded || !videoRef.current) return
    if (cameraRef.current) return        // ← already running, don't create duplicate
    try {
      const { Camera } = await import('@mediapipe/camera_utils')
      const cam = new Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && videoRef.current && activeRef.current)
            await handsRef.current.send({ image: videoRef.current })
        },
        width: 640, height: 480,
      })
      await cam.start()
      cameraRef.current = cam
      activeRef.current = true         // ← now allow processing
      setCamOn(true)
    } catch {
      setError('카메라 접근 권한이 필요합니다.')
    }
  }, [loaded])

  const stopCamera = useCallback(() => {
    activeRef.current = false          // ← stop processing immediately
    cameraRef.current?.stop()
    cameraRef.current = null
    setCamOn(false)
    setScores(null)
    setPhaseState(null)
    motionRef.current = []
    if (holdRef.current) { cancelAnimationFrame(holdRef.current); holdRef.current = null }
    setHoldPct(0)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

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

    // ── just use index order — [0] = first detected, [1] = second ──
    const lm  = results.multiHandLandmarks[0]
    const lm2 = results.multiHandLandmarks[1] || null

    drawConnections(ctx, lm, HAND_CONNECTIONS, canvas.width, canvas.height)
    drawLandmarks(ctx, lm, canvas.width, canvas.height)
    if (lm2) {
      drawConnections(ctx, lm2, HAND_CONNECTIONS, canvas.width, canvas.height)
      drawLandmarks(ctx, lm2, canvas.width, canvas.height)
    }

    const wrist = lm[LM.WRIST]
    motionRef.current = [...motionRef.current.slice(-29), { x: wrist.x, y: wrist.y, z: wrist.z || 0 }]

    const currentSign = GESTURE_SIGNS[signIdxRef.current]
    if (!currentSign || submittedRef.current) { ctx.restore(); return }

    const checker  = currentSign.checker
    const isStatic = STATIC_CHECKERS.has(checker)
    let allPass    = false

    if (isStatic) {
      const result = checkStatic(checker, lm, motionRef.current, lm2)
      if (!result) { ctx.restore(); return }
      setScores(result)
      setPhaseState(null)
      allPass = Object.values(result).every(v => v === true)
    } else {
      const phaseResult = runPhaseEngine(checker, lm, motionRef.current, phaseRef, lm2)
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

  const resetSign = useCallback((newIdx) => {
    const s = GESTURE_SIGNS[newIdx]
    phaseRef.current = { ...phaseRef.current, [s?.checker]: 0 }
    submittedRef.current = false
    activeRef.current = false           // ← ensure inactive until startCamera
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
    stopCamera()                        // ← always stop (safe even if already stopped)
    resetSign(GESTURE_SIGNS.indexOf(next))
  }

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