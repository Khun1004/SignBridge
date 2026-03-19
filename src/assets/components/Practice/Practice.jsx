import { useState, useEffect, useRef, useCallback } from 'react'
import './Practice.css'
import GestureCheck from './GestureCheck'
import SignLearnCard from './SignLearnCard'

/* ══════════════════════════════════════════════════════════
   REAL KOREAN SIGN LANGUAGE DATABASE
   Sources: 국립국어원 한국수어사전, 한국농아인협회

   Each sign documents the 5 parameters (수어의 5요소):
   1. 수형 (handshape)   — which fingers are extended/bent
   2. 수위 (location)    — where on/near the body
   3. 수동 (movement)    — path, direction, repetition
   4. 수향 (orientation) — which way the palm faces
   5. 비수지 (NMS)       — facial expression, mouth, head

   hand SVG shapes: 'fist'|'open'|'point1'|'point2'|'thumb'
                    |'ily'|'b-hand'|'c-hand'|'flat-o'|'v-hand'
══════════════════════════════════════════════════════════ */

export const CATEGORIES = [
  { id: 'all',      label: '전체',      icon: '🗂️', desc: '모든 수어' },
  { id: 'greet',    label: '인사',      icon: '👋', desc: '일상 인사 표현' },
  { id: 'family',   label: '가족',      icon: '👨‍👩‍👧', desc: '가족 관계 호칭' },
  { id: 'number',   label: '숫자',      icon: '🔢', desc: '1–10 기본 숫자' },
  { id: 'color',    label: '색깔',      icon: '🎨', desc: '기본 색깔' },
  { id: 'food',     label: '음식',      icon: '🍚', desc: '식사·음식·음료' },
  { id: 'body',     label: '신체',      icon: '🫀', desc: '신체 부위' },
  { id: 'time',     label: '시간',      icon: '⏰', desc: '시간·날짜 표현' },
  { id: 'emergency',label: '긴급',      icon: '🚨', desc: '위급 상황 표현' },
]

// SVG hand shape paths — simplified but accurate finger configurations
const HANDSHAPES = {
  fist:   { label: '주먹 (S형)', desc: '네 손가락 모두 접고 엄지를 손가락 위에 얹음' },
  open:   { label: '편손 (5형)', desc: '다섯 손가락 모두 펴고 손바닥을 앞으로' },
  point1: { label: '검지 (1형)', desc: '검지만 펴고 나머지는 주먹' },
  point2: { label: 'V형 (2형)',  desc: '검지·중지를 펴고 나머지는 접음' },
  thumb:  { label: '엄지 (A형)', desc: '주먹에서 엄지만 세움' },
  ily:    { label: 'I♡U형',     desc: '엄지·검지·소지를 펴고 중지·약지는 접음' },
  bhand:  { label: 'B형 (편손)', desc: '네 손가락 붙여 펴고 엄지는 손바닥 쪽으로' },
  chand:  { label: 'C형 (구형)', desc: '손가락 모두 살짝 굽혀 C자 모양' },
  flato:  { label: 'F형 (집기)', desc: '엄지와 검지가 O자, 나머지 셋은 펴서 위' },
  vhand:  { label: 'V형 (승리)', desc: '검지·중지 펴고 벌림, 나머지 접음' },
  whand:  { label: 'W형',       desc: '검지·중지·약지 펴고 벌림, 나머지 접음' },
  yhand:  { label: 'Y형',       desc: '엄지·소지를 펴고 나머지 세 손가락 접음' },
}

export const SIGNS = [
  /* ─── 인사 ─── */
  {
    id:'g01', cat:'greet', label:'안녕하세요', english:'Hello / How are you?',
    color:'#7c6fff',
    params: {
      수형: 'bhand',
      수위: '이마 옆 (관자놀이)',
      수동: '손을 이마 옆에서 앞·아래로 내리며 살짝 끄덕임',
      수향: '손바닥이 바깥쪽(상대방) 방향',
      비수지: '자연스러운 미소, 가벼운 고개 인사',
    },
    steps: [
      '오른손을 B형(편손)으로 만드세요 — 네 손가락 붙여 펴고 엄지는 손바닥 쪽.',
      '손끝을 오른쪽 관자놀이 옆에 가져다 댑니다. 손바닥은 바깥(상대방) 방향.',
      '손을 이마 옆에서 앞쪽·아래쪽 방향으로 부드럽게 내립니다.',
      '동시에 가볍게 고개를 끄덕입니다. 표정은 자연스러운 미소.',
    ],
    notes: '일상에서 가장 많이 쓰는 첫 번째 수어. B형 손 모양은 존칭 인사의 기본.',
    commonMistake: '손을 세게 흔들지 마세요. 흔들면 "빠이빠이"처럼 보입니다.',
    videoNote: '🔗 국립국어원 수어사전: 안녕하세요',
  },
  {
    id:'g02', cat:'greet', label:'감사합니다', english:'Thank you',
    color:'#7c6fff',
    params: {
      수형: 'bhand',
      수위: '턱 아래',
      수동: '손을 턱 아래에서 앞으로 내밀며 살짝 고개 숙임',
      수향: '손바닥이 위를 향함',
      비수지: '진심 어린 표정, 고개 숙임',
    },
    steps: [
      '오른손을 B형으로 만드세요. 손바닥이 위를 향하게 합니다.',
      '손끝을 턱 아래 가까이 가져다 댑니다.',
      '손을 앞으로 밀어냅니다. 마치 감사함을 상대방에게 드리는 느낌.',
      '동시에 가볍게 고개를 숙입니다.',
    ],
    notes: '한국수어에서 감사 표현은 두 손을 모으지 않습니다. 한 손으로 턱에서 앞으로 내밉니다.',
    commonMistake: '두 손을 합장하면 "기도" 또는 "부탁"처럼 보일 수 있습니다.',
    videoNote: '🔗 국립국어원 수어사전: 감사',
  },
  {
    id:'g03', cat:'greet', label:'미안합니다', english:'Sorry / I apologize',
    color:'#7c6fff',
    params: {
      수형: 'fist',
      수위: '가슴 중앙',
      수동: '주먹 쥔 손으로 가슴을 원을 그리며 문지름 (시계 방향, 1–2회)',
      수향: '손등이 앞을 향함',
      비수지: '미안한 표정, 입꼬리 내림, 가볍게 눈썹 올림',
    },
    steps: [
      '오른손을 주먹(S형)으로 쥡니다.',
      '손등이 앞을 향하게 한 뒤, 가슴 중앙에 가져다 댑니다.',
      '가슴 위에서 시계 방향으로 천천히 원을 그립니다 (1–2회).',
      '표정은 진심으로 미안한 느낌 — 입꼬리를 살짝 내리세요.',
    ],
    notes: '원을 그리는 크기와 속도로 미안함의 정도를 표현할 수 있습니다.',
    commonMistake: '원이 너무 작으면 잘 보이지 않습니다. 가슴 전체를 쓰듯 크게.',
    videoNote: '🔗 국립국어원 수어사전: 미안',
  },
  {
    id:'g04', cat:'greet', label:'이름', english:'Name',
    color:'#7c6fff',
    params: {
      수형: 'point2',
      수위: '이마 앞',
      수동: '검지·중지를 이마 앞에서 아래로 탁 내림',
      수향: '손바닥이 아래를 향함',
      비수지: '의문 표정 시 눈썹을 올림 (질문일 때)',
    },
    steps: [
      '오른손 검지와 중지만 펴고 나머지는 접습니다 (V형).',
      '손바닥이 아래를 향하게 하여 이마 앞 10cm 위치에 놓습니다.',
      '손을 아래로 짧게 탁 내립니다.',
      '"이름이 뭐예요?"라고 물을 때는 눈썹을 올리고 상대방을 봅니다.',
    ],
    notes: '질문할 때는 반드시 눈썹을 올리는 비수지 신호가 함께 와야 합니다.',
    commonMistake: '손가락을 폈다 접었다 하지 마세요. 한 번에 내립니다.',
    videoNote: '🔗 국립국어원 수어사전: 이름',
  },
  {
    id:'g05', cat:'greet', label:'반갑습니다', english:'Nice to meet you',
    color:'#7c6fff',
    params: {
      수형: 'open',
      수위: '가슴 앞',
      수동: '양손을 가슴 앞에서 서로 교차하듯 흔들기',
      수향: '손바닥이 가슴 방향',
      비수지: '밝은 표정, 눈맞춤',
    },
    steps: [
      '양손을 펴서(5형) 손바닥이 가슴을 향하게 합니다.',
      '양손을 가슴 앞에서 서로 엇갈리듯 가볍게 교차합니다.',
      '기쁜 표정과 함께 상대방과 눈을 마주칩니다.',
    ],
    notes: '처음 만나는 상황에서 씁니다. 표정이 매우 중요합니다.',
    commonMistake: '손만 움직이고 표정이 없으면 어색합니다.',
    videoNote: '🔗 국립국어원 수어사전: 반갑다',
  },

  /* ─── 가족 ─── */
  {
    id:'f01', cat:'family', label:'엄마', english:'Mother / Mom',
    color:'#ec4899',
    params: {
      수형: 'yhand',
      수위: '왼쪽 가슴',
      수동: '엄지·소지 편 Y형 손을 가슴에 댐 (여성 쪽)',
      수향: '손바닥이 가슴 방향',
      비수지: '부드러운 표정',
    },
    steps: [
      '오른손 엄지와 소지를 펴고 나머지 세 손가락을 접습니다 (Y형).',
      '손바닥이 가슴을 향하게 한 채, 왼쪽 가슴(심장 쪽)에 댑니다.',
      '손을 떼지 않고 잠깐 유지하거나 가볍게 두드립니다.',
    ],
    notes: '여성 가족은 왼쪽(심장) 위치. 남성 가족은 오른쪽 위치를 씁니다.',
    commonMistake: '위치를 오른쪽으로 하면 아빠처럼 보일 수 있습니다.',
    videoNote: '🔗 국립국어원 수어사전: 어머니',
  },
  {
    id:'f02', cat:'family', label:'아빠', english:'Father / Dad',
    color:'#ec4899',
    params: {
      수형: 'yhand',
      수위: '오른쪽 가슴',
      수동: 'Y형 손을 오른쪽 가슴에 댐',
      수향: '손바닥이 가슴 방향',
      비수지: '자연스러운 표정',
    },
    steps: [
      '오른손을 Y형으로 만듭니다 (엄지·소지 펴기).',
      '손바닥이 가슴을 향하게 한 채, 오른쪽 가슴에 댑니다.',
      '잠깐 유지하거나 가볍게 두드립니다.',
    ],
    notes: '엄마와 손 모양은 같고 위치만 다릅니다. 오른쪽 = 남성 가족 위치.',
    commonMistake: '손 모양을 다르게 만드는 실수. 엄마와 같은 Y형입니다.',
    videoNote: '🔗 국립국어원 수어사전: 아버지',
  },
  {
    id:'f03', cat:'family', label:'형제 / 오빠', english:'Brother / Older brother',
    color:'#ec4899',
    params: {
      수형: 'point1',
      수위: '오른쪽 어깨 앞',
      수동: '검지를 세우고 오른쪽 어깨 앞에서 앞쪽으로 내밈',
      수향: '손바닥이 안쪽을 향함',
      비수지: '중립 표정',
    },
    steps: [
      '오른손 검지만 세우고 나머지는 주먹 쥡니다 (1형).',
      '검지 끝이 위를 향하게 하여 오른쪽 어깨 앞에 놓습니다.',
      '손을 약간 앞쪽으로 내밉니다.',
    ],
    notes: '남성 위치(오른쪽)에서 표현. 여동생/언니는 왼쪽에서 같은 동작.',
    commonMistake: '손가락 방향이 잘못되면 다른 단어처럼 보입니다.',
    videoNote: '🔗 국립국어원 수어사전: 형제',
  },
  {
    id:'f04', cat:'family', label:'언니 / 누나', english:'Older sister',
    color:'#ec4899',
    params: {
      수형: 'point1',
      수위: '왼쪽 어깨 앞',
      수동: '검지를 세우고 왼쪽 어깨 앞에서 앞쪽으로 내밈',
      수향: '손바닥이 안쪽을 향함',
      비수지: '부드러운 표정',
    },
    steps: [
      '오른손 검지만 세웁니다.',
      '왼쪽 어깨 앞에 놓고 앞으로 살짝 내밉니다.',
    ],
    notes: '오빠/형은 오른쪽, 언니/누나는 왼쪽. 같은 손 모양, 위치가 다름.',
    commonMistake: '위치를 오른쪽으로 하면 오빠/형이 됩니다.',
    videoNote: '🔗 국립국어원 수어사전: 언니',
  },

  /* ─── 숫자 ─── */
  {
    id:'n01', cat:'number', label:'1 (일)', english:'One',
    color:'#3b82f6',
    params: {
      수형: 'point1',
      수위: '몸 앞 중앙 (가슴 높이)',
      수동: '정지 (움직임 없음)',
      수향: '손바닥이 상대방 방향 (또는 바깥)',
      비수지: '중립',
    },
    steps: [
      '오른손 검지만 세우고 나머지 손가락은 주먹을 쥡니다.',
      '손바닥(손등이 아닌 안쪽)이 상대방을 향하게 합니다.',
      '가슴 앞에서 정지. 손을 흔들지 않습니다.',
    ],
    notes: 'KSL 숫자는 ASL과 약간 다릅니다. 손바닥 방향을 정확히 지키세요.',
    commonMistake: '손등이 앞을 향하면 다른 의미가 될 수 있습니다.',
    videoNote: '🔗 국립국어원 수어사전: 숫자 일',
  },
  {
    id:'n02', cat:'number', label:'2 (이)', english:'Two',
    color:'#3b82f6',
    params: {
      수형: 'point2',
      수위: '몸 앞 중앙',
      수동: '정지',
      수향: '손바닥이 상대방 방향',
      비수지: '중립',
    },
    steps: [
      '검지와 중지를 펴고 나머지 손가락은 접습니다.',
      '두 손가락을 붙이거나 살짝 벌립니다.',
      '손바닥이 앞을 향하게 가슴 앞에서 정지.',
    ],
    notes: 'V자 모양이지만 승리 표시가 아닌 숫자 2입니다. 문맥이 중요.',
    commonMistake: '손가락을 너무 벌리면 V자와 혼동될 수 있습니다.',
    videoNote: '🔗 국립국어원 수어사전: 숫자 이',
  },
  {
    id:'n03', cat:'number', label:'3 (삼)', english:'Three',
    color:'#3b82f6',
    params: {
      수형: 'whand',
      수위: '몸 앞 중앙',
      수동: '정지',
      수향: '손바닥이 상대방 방향',
      비수지: '중립',
    },
    steps: [
      '검지·중지·약지를 펴고 나머지(엄지·소지)는 접습니다.',
      '세 손가락을 자연스럽게 약간 벌립니다.',
      '손바닥이 앞을 향하도록 가슴 앞에서 정지.',
    ],
    notes: '엄지를 함께 펴면 다른 숫자처럼 보입니다. 엄지를 접으세요.',
    commonMistake: '엄지를 함께 펴는 실수가 많습니다.',
    videoNote: '🔗 국립국어원 수어사전: 숫자 삼',
  },
  {
    id:'n04', cat:'number', label:'5 (오)', english:'Five',
    color:'#3b82f6',
    params: {
      수형: 'open',
      수위: '몸 앞 중앙',
      수동: '정지',
      수향: '손바닥이 상대방 방향',
      비수지: '중립',
    },
    steps: [
      '다섯 손가락 모두 펴고 약간 자연스럽게 벌립니다.',
      '손바닥이 상대방을 향하게 합니다.',
      '가슴 앞 중앙에서 정지.',
    ],
    notes: '숫자 5는 가장 간단합니다. 손을 팽팽하게 하지 않아도 됩니다.',
    commonMistake: '손가락을 너무 힘주어 펴면 어색합니다. 자연스럽게.',
    videoNote: '🔗 국립국어원 수어사전: 숫자 오',
  },
  {
    id:'n05', cat:'number', label:'10 (십)', english:'Ten',
    color:'#3b82f6',
    params: {
      수형: 'thumb',
      수위: '가슴 앞',
      수동: '엄지를 세운 주먹을 옆으로 흔들기 (1–2회)',
      수향: '엄지가 위를 향함',
      비수지: '중립',
    },
    steps: [
      '주먹을 쥐고 엄지만 세웁니다 (A+엄지형).',
      '엄지가 위를 향하게 가슴 앞에 놓습니다.',
      '손목을 이용해 좌우로 1–2회 살짝 흔듭니다.',
    ],
    notes: '10은 정지가 아닌 움직임이 있는 숫자입니다.',
    commonMistake: '팔 전체를 흔들지 마세요. 손목만 움직입니다.',
    videoNote: '🔗 국립국어원 수어사전: 숫자 십',
  },

  /* ─── 색깔 ─── */
  {
    id:'c01', cat:'color', label:'빨간색', english:'Red',
    color:'#ef4444',
    params: {
      수형: 'point1',
      수위: '입술',
      수동: '검지를 입술에 댄 뒤 아래로 내리기',
      수향: '손바닥이 아래를 향함',
      비수지: '중립',
    },
    steps: [
      '검지만 펴고 나머지는 접습니다.',
      '검지 끝을 입술(아랫입술)에 가볍게 댑니다.',
      '검지를 아래로 짧게 내립니다. 입술의 붉은색을 가리키는 동작.',
    ],
    notes: '빨간색의 기원: 입술의 붉은색에서 유래. 자연 발생적 아이콘.',
    commonMistake: '손가락을 세게 입술에 대지 마세요. 가볍게 터치.',
    videoNote: '🔗 국립국어원 수어사전: 빨간색',
  },
  {
    id:'c02', cat:'color', label:'파란색', english:'Blue',
    color:'#3b82f6',
    params: {
      수형: 'bhand',
      수위: '관자놀이 옆',
      수동: 'B형 손을 관자놀이 옆에서 앞으로 짧게 내밈',
      수향: '손바닥이 바깥을 향함',
      비수지: '중립',
    },
    steps: [
      '오른손을 B형(편손)으로 만듭니다.',
      '관자놀이(오른쪽 이마 옆)에 손끝을 댑니다.',
      '손을 앞으로 짧게 내밉니다.',
    ],
    notes: '파란 하늘 방향(위)에서 유래한 수어.',
    commonMistake: '위치가 이마 위로 올라가면 다른 수어처럼 보입니다.',
    videoNote: '🔗 국립국어원 수어사전: 파란색',
  },
  {
    id:'c03', cat:'color', label:'흰색', english:'White',
    color:'#888',
    params: {
      수형: 'open',
      수위: '가슴 앞',
      수동: '손바닥을 가슴에 댄 뒤 앞으로 내밀며 손가락 오므리기',
      수향: '손바닥이 가슴 방향 → 앞 방향',
      비수지: '중립',
    },
    steps: [
      '펴진 손(5형)을 가슴 중앙에 손바닥이 닿게 댑니다.',
      '손을 앞으로 끌어내면서 동시에 손가락을 오므려 O형으로 만듭니다.',
      '흰 셔츠를 잡아당기는 느낌의 동작.',
    ],
    notes: '흰 옷을 잡아당기는 아이콘에서 유래.',
    commonMistake: '손을 너무 빠르게 움직이면 다른 동작처럼 보입니다.',
    videoNote: '🔗 국립국어원 수어사전: 흰색',
  },
  {
    id:'c04', cat:'color', label:'검은색', english:'Black',
    color:'#1a1a2e',
    params: {
      수형: 'point1',
      수위: '눈썹',
      수동: '검지를 눈썹을 따라 옆으로 긁기',
      수향: '손바닥이 아래를 향함',
      비수지: '중립',
    },
    steps: [
      '검지만 세웁니다.',
      '검지 옆면을 오른쪽 눈썹 위에 댑니다.',
      '눈썹을 따라 바깥쪽으로 긁듯 이동합니다.',
    ],
    notes: '검은 눈썹에서 유래한 수어. 한국수어의 직관적인 아이콘 원칙.',
    commonMistake: '눈썹을 실제로 긁으면 안 됩니다. 가볍게 스치는 정도.',
    videoNote: '🔗 국립국어원 수어사전: 검은색',
  },

  /* ─── 음식 ─── */
  {
    id:'fd01', cat:'food', label:'밥 / 식사', english:'Rice / Meal',
    color:'#10b981',
    params: {
      수형: 'flato',
      수위: '입 앞',
      수동: '손가락 끝을 모아 입 방향으로 반복적으로 가져감 (2–3회)',
      수향: '손바닥이 위를 향함',
      비수지: '자연스러운 표정',
    },
    steps: [
      '손가락 다섯 개의 끝을 모아 가볍게 집습니다 (O형).',
      '손바닥이 위를 향하게 합니다.',
      '입 쪽으로 짧게 가져갑니다. 이 동작을 2–3회 반복.',
      '숟가락으로 밥을 떠먹는 동작에서 유래.',
    ],
    notes: '"밥을 먹다", "식사하다" 모두 이 수어로 표현 가능.',
    commonMistake: '손 모양이 너무 열려 있으면 다른 음식처럼 보입니다.',
    videoNote: '🔗 국립국어원 수어사전: 밥',
  },
  {
    id:'fd02', cat:'food', label:'물', english:'Water',
    color:'#10b981',
    params: {
      수형: 'whand',
      수위: '입 앞',
      수동: 'W형 손을 입 앞으로 가져와 기울이기',
      수향: '손바닥이 안쪽을 향함',
      비수지: '자연스러운 표정',
    },
    steps: [
      '검지·중지·약지를 펴고 나머지는 접습니다 (W형).',
      '손을 입 앞으로 가져옵니다.',
      '컵에서 물을 마시는 것처럼 손을 살짝 기울입니다.',
    ],
    notes: '영어 Water의 첫 글자 W 손 모양에서 유래 (차용 수어).',
    commonMistake: '손가락 세 개를 정확하게 펴야 합니다. 더 펴면 다른 뜻.',
    videoNote: '🔗 국립국어원 수어사전: 물',
  },
  {
    id:'fd03', cat:'food', label:'커피', english:'Coffee',
    color:'#10b981',
    params: {
      수형: 'fist',
      수위: '가슴 앞',
      수동: '양손 주먹을 위아래로 겹치고 윗손을 돌리기',
      수향: '손등이 위를 향함',
      비수지: '중립',
    },
    steps: [
      '양손을 주먹으로 쥡니다.',
      '한 손 위에 다른 손을 올립니다.',
      '윗손을 시계 방향으로 돌립니다 — 커피 그라인더/필터 동작.',
    ],
    notes: '커피를 갈거나 커피 필터를 돌리는 동작에서 유래.',
    commonMistake: '한 손만 쓰면 다른 뜻이 됩니다. 반드시 양손.',
    videoNote: '🔗 국립국어원 수어사전: 커피',
  },
  {
    id:'fd04', cat:'food', label:'빵', english:'Bread',
    color:'#10b981',
    params: {
      수형: 'bhand',
      수위: '비우세손 등 위',
      수동: '한 손 등 위를 다른 손으로 썰기 동작',
      수향: '우세손 손바닥이 아래를 향함',
      비수지: '중립',
    },
    steps: [
      '왼손을 B형으로 펴서 앞에 놓습니다 (빵 덩어리 역할).',
      '오른손을 B형으로 펴고 왼손 등 위에서 앞뒤로 썰기 동작을 합니다.',
      '빵을 자르는 동작에서 유래.',
    ],
    notes: '두 손을 쓰는 수어. 비우세손이 "물체"를 나타냅니다.',
    commonMistake: '한 손만 쓰거나 위치가 허공에 있으면 다릅니다.',
    videoNote: '🔗 국립국어원 수어사전: 빵',
  },

  /* ─── 신체 ─── */
  {
    id:'b01', cat:'body', label:'머리', english:'Head',
    color:'#f97316',
    params: {
      수형: 'open',
      수위: '머리',
      수동: '손바닥으로 머리 위를 가볍게 두드리기',
      수향: '손바닥이 아래를 향함',
      비수지: '중립',
    },
    steps: [
      '오른손을 펴고 손바닥이 아래를 향하게 합니다.',
      '손바닥으로 자신의 머리 위를 가볍게 1–2회 두드립니다.',
    ],
    notes: '신체 부위는 대부분 해당 부위를 가리키거나 두드려서 표현합니다.',
    commonMistake: '너무 세게 두드리지 마세요.',
    videoNote: '🔗 국립국어원 수어사전: 머리',
  },
  {
    id:'b02', cat:'body', label:'눈', english:'Eye(s)',
    color:'#f97316',
    params: {
      수형: 'point2',
      수위: '눈 아래',
      수동: '검지·중지 끝을 눈 아래 향하게 가리키기',
      수향: '손바닥이 얼굴 방향',
      비수지: '중립',
    },
    steps: [
      '검지와 중지를 펴고 나머지는 접습니다.',
      '두 손가락 끝이 자신의 눈 아래를 향하게 가리킵니다.',
      '잠깐 유지 후 내립니다.',
    ],
    notes: '두 손가락으로 "두 눈"을 가리킵니다. 자연스러운 아이콘.',
    commonMistake: '손가락 끝이 눈에 너무 가까이 가지 않도록.',
    videoNote: '🔗 국립국어원 수어사전: 눈',
  },
  {
    id:'b03', cat:'body', label:'귀', english:'Ear',
    color:'#f97316',
    params: {
      수형: 'point1',
      수위: '귀',
      수동: '검지로 귀 앞 이개를 가볍게 가리킴',
      수향: '손바닥이 얼굴 방향',
      비수지: '중립',
    },
    steps: [
      '검지만 펴고 나머지는 접습니다.',
      '검지 끝으로 자신의 귀(이개 부분)를 가볍게 가리킵니다.',
    ],
    notes: '청각장애 관련 문맥에서 자주 쓰이는 기본 단어.',
    commonMistake: '귀를 만지는 게 아니라 가리키는 동작입니다.',
    videoNote: '🔗 국립국어원 수어사전: 귀',
  },
  {
    id:'b04', cat:'body', label:'손', english:'Hand',
    color:'#f97316',
    params: {
      수형: 'open',
      수위: '몸 앞',
      수동: '한 손 등을 다른 손 손바닥으로 쓸기',
      수향: '아래 손 손바닥이 위를 향함',
      비수지: '중립',
    },
    steps: [
      '왼손을 펴서 손바닥이 위를 향하게 합니다.',
      '오른손을 펴서 왼손 등 위에 올립니다.',
      '오른손을 왼손 등 위로 가볍게 쓸어냅니다.',
      '"손"을 나타내는 수어 — 손 자체를 보여주는 아이콘.',
    ],
    notes: '수어에서 손 자체를 나타낼 때 씁니다.',
    commonMistake: '한 손만 쓰면 다른 의미가 됩니다.',
    videoNote: '🔗 국립국어원 수어사전: 손',
  },

  /* ─── 시간 ─── */
  {
    id:'t01', cat:'time', label:'오늘', english:'Today',
    color:'#8b5cf6',
    params: {
      수형: 'bhand',
      수위: '몸 옆 (아래쪽)',
      수동: 'B형 양손을 아래로 동시에 내리기',
      수향: '손바닥이 아래를 향함',
      비수지: '중립',
    },
    steps: [
      '양손을 B형으로 만듭니다.',
      '손바닥이 아래를 향하게 하여 허리 옆에 놓습니다.',
      '양손을 동시에 아래로 짧게 내립니다.',
      '"지금 이 시점, 현재"를 나타내는 수어.',
    ],
    notes: '현재 시제를 나타낼 때도 사용됩니다. "지금"과 유사.',
    commonMistake: '한 손만 쓰거나 위로 올리면 다른 뜻이 됩니다.',
    videoNote: '🔗 국립국어원 수어사전: 오늘',
  },
  {
    id:'t02', cat:'time', label:'내일', english:'Tomorrow',
    color:'#8b5cf6',
    params: {
      수형: 'thumb',
      수위: '볼/뺨 옆',
      수동: '엄지 세운 손을 볼 옆에서 앞으로 내밈',
      수향: '엄지가 위를 향함',
      비수지: '중립',
    },
    steps: [
      '오른손 주먹에서 엄지만 세웁니다.',
      '엄지 옆면을 오른쪽 볼(뺨)에 가져다 댑니다.',
      '손을 앞으로 밀어냅니다 (미래 방향).',
    ],
    notes: '수어의 시간 축: 앞 = 미래, 뒤 = 과거. 내일은 앞으로 냅니다.',
    commonMistake: '손을 위로 올리면 "좋다"처럼 보입니다. 앞으로 내밉니다.',
    videoNote: '🔗 국립국어원 수어사전: 내일',
  },
  {
    id:'t03', cat:'time', label:'어제', english:'Yesterday',
    color:'#8b5cf6',
    params: {
      수형: 'thumb',
      수위: '볼/뺨 옆',
      수동: '엄지 세운 손을 볼 옆에서 뒤로 넘기기',
      수향: '엄지가 뒤를 향함',
      비수지: '중립',
    },
    steps: [
      '오른손 주먹에서 엄지만 세웁니다.',
      '엄지를 오른쪽 볼 옆에 댑니다.',
      '손을 어깨 뒤쪽으로 넘깁니다 (과거 방향).',
    ],
    notes: '"내일"과 손 모양은 같고, 방향이 반대입니다. 뒤 = 과거.',
    commonMistake: '아래로 내리면 안 됩니다. 뒤쪽(어깨 방향)으로 넘깁니다.',
    videoNote: '🔗 국립국어원 수어사전: 어제',
  },
  {
    id:'t04', cat:'time', label:'지금', english:'Now',
    color:'#8b5cf6',
    params: {
      수형: 'bhand',
      수위: '몸 앞',
      수동: '양 손바닥을 아래로 동시에 탁 내리기',
      수향: '손바닥이 아래를 향함',
      비수지: '입을 살짝 다물거나 "지금"이라고 입모양',
    },
    steps: [
      '양손을 B형으로 만듭니다.',
      '손바닥이 아래를 향하게 몸 앞에 놓습니다.',
      '양손을 동시에 아래로 탁 내립니다. "오늘"보다 더 힘차게.',
    ],
    notes: '"오늘"과 비슷하지만 더 순간적·강조적입니다.',
    commonMistake: '너무 부드럽게 내리면 "오늘"처럼 보입니다.',
    videoNote: '🔗 국립국어원 수어사전: 지금',
  },

  /* ─── 긴급 ─── */
  {
    id:'e01', cat:'emergency', label:'도와주세요', english:'Help me / Please help',
    color:'#ef4444',
    params: {
      수형: 'thumb + open',
      수위: '가슴 앞',
      수동: '한 손 엄지 위에 다른 손 올리고 위로 올리기',
      수향: '아래 손 손바닥이 위를 향함',
      비수지: '긴박한 표정, 눈썹 올림',
    },
    steps: [
      '왼손 주먹에서 엄지를 세웁니다.',
      '오른손(편손)을 왼손 아래에서 받치듯 놓습니다.',
      '두 손을 함께 위로 올립니다.',
      '표정은 긴박하게, 눈썹을 올려 도움을 요청합니다.',
    ],
    notes: '"도움을 받아 위로 올라간다"는 시각적 이미지.',
    commonMistake: '표정 없이 하면 의미가 약해집니다. 비수지 신호가 필수.',
    videoNote: '🔗 국립국어원 수어사전: 도움',
  },
  {
    id:'e02', cat:'emergency', label:'병원', english:'Hospital',
    color:'#ef4444',
    params: {
      수형: 'point2',
      수위: '비우세손 아래팔',
      수동: '검지·중지로 반대편 팔 안쪽에 십자(+) 그리기',
      수향: '손바닥이 아래를 향함',
      비수지: '중립 또는 걱정 표정',
    },
    steps: [
      '왼팔을 앞으로 내밉니다 (아래팔 안쪽이 위를 향함).',
      '오른손 검지·중지를 펴고 왼팔 안쪽 피부 위에서 십자(+) 모양을 그립니다.',
      '적십자(Red Cross) 기호에서 유래.',
    ],
    notes: '"병원", "의사", "간호사" 등 의료 관련 단어의 기본 수어.',
    commonMistake: '십자 모양을 너무 작게 그리면 보이지 않습니다.',
    videoNote: '🔗 국립국어원 수어사전: 병원',
  },
  {
    id:'e03', cat:'emergency', label:'위험', english:'Danger',
    color:'#ef4444',
    params: {
      수형: 'open',
      수위: '몸 앞 위',
      수동: '양손을 머리 위에서 좌우로 크게 흔들기',
      수향: '손바닥이 앞을 향함',
      비수지: '놀란/긴박한 표정, 눈 크게',
    },
    steps: [
      '양손을 펴서 손바닥이 앞을 향하게 합니다.',
      '머리 위로 양손을 올립니다.',
      '좌우로 크게 흔들며 경고 신호를 보냅니다.',
      '표정은 긴박하고 눈을 크게 뜹니다.',
    ],
    notes: '크고 빠른 움직임이 위험의 긴박함을 전달합니다.',
    commonMistake: '작고 조용하게 하면 "인사"처럼 보입니다.',
    videoNote: '🔗 국립국어원 수어사전: 위험',
  },
  {
    id:'e04', cat:'emergency', label:'경찰', english:'Police',
    color:'#ef4444',
    params: {
      수형: 'chand',
      수위: '왼쪽 가슴',
      수동: 'C형 손을 왼쪽 가슴에 배지 달듯 댐',
      수향: '손바닥이 가슴 방향',
      비수지: '중립',
    },
    steps: [
      '손가락을 모두 살짝 굽혀 C자 모양을 만듭니다.',
      '왼쪽 가슴에 경찰 배지를 다는 것처럼 가져다 댑니다.',
      '잠깐 유지합니다.',
    ],
    notes: '경찰 배지(뱃지)를 상징합니다.',
    commonMistake: '오른쪽 가슴에 하면 다른 의미가 될 수 있습니다.',
    videoNote: '🔗 국립국어원 수어사전: 경찰',
  },
  {
    id:'e05', cat:'emergency', label:'불 / 화재', english:'Fire',
    color:'#ef4444',
    params: {
      수형: 'open → 주먹 반복',
      수위: '가슴 앞 아래에서 위로',
      수동: '양손을 아래에서 위로 올리며 손가락을 폈다 접기 반복',
      수향: '손바닥이 앞을 향함',
      비수지: '긴박한 표정',
    },
    steps: [
      '양손 손가락을 펴고 가슴 아래에서 시작합니다.',
      '손을 위로 올리면서 손가락을 폈다 접었다 반복합니다.',
      '불꽃이 타오르는 모습을 표현하는 동작.',
      '긴박한 상황이면 표정도 함께 사용하세요.',
    ],
    notes: '타오르는 불꽃의 모습을 직접 묘사한 수어.',
    commonMistake: '너무 느리게 하면 불꽃이 아닌 다른 것처럼 보입니다.',
    videoNote: '🔗 국립국어원 수어사전: 불',
  },
]

/* ═══════════════════════════════════
   HAND SHAPE SVG COMPONENT
═══════════════════════════════════ */
function HandShapeSVG({ shape, color = '#7c6fff', size = 100 }) {
  const c = color
  const shapes = {
    point1: (
      <svg width={size} height={size} viewBox="0 0 80 100">
        <rect x="30" y="50" width="20" height="40" rx="4" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/>
        <rect x="10" y="60" width="18" height="30" rx="4" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/>
        <rect x="52" y="62" width="18" height="28" rx="4" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/>
        <rect x="10" y="58" width="60" height="18" rx="6" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/>
        <rect x="28" y="5" width="22" height="50" rx="8" fill="#ffd4a8" stroke={c} strokeWidth="2.5"/>
        <rect x="7" y="55" width="12" height="10" rx="4" fill="#ffc890"/>
        <circle cx="39" cy="10" r="3" fill={c} opacity="0.5"/>
      </svg>
    ),
    open: (
      <svg width={size} height={size} viewBox="0 0 80 110">
        <rect x="33" y="45" width="14" height="20" rx="3" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1"/>
        <rect x="20" y="42" width="14" height="22" rx="3" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1"/>
        <rect x="46" y="43" width="14" height="22" rx="3" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1"/>
        <rect x="20" y="58" width="40" height="22" rx="6" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/>
        <rect x="7" y="55" width="15" height="25" rx="5" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/>
        <rect x="18" y="5" width="14" height="42" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/>
        <rect x="31" y="3" width="14" height="44" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/>
        <rect x="44" y="4" width="14" height="44" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/>
        <rect x="57" y="7" width="13" height="40" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/>
      </svg>
    ),
    fist: (
      <svg width={size} height={size} viewBox="0 0 80 90">
        <rect x="15" y="30" width="52" height="50" rx="10" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/>
        <rect x="15" y="28" width="48" height="15" rx="5" fill="#ffc890" stroke="#e0a070" strokeWidth="1"/>
        <rect x="7" y="38" width="15" height="28" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/>
        <line x1="15" y1="43" x2="63" y2="43" stroke="#e0a070" strokeWidth="1" opacity="0.5"/>
        <line x1="15" y1="53" x2="63" y2="53" stroke="#e0a070" strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
    thumb: (
      <svg width={size} height={size} viewBox="0 0 80 100">
        <rect x="18" y="40" width="46" height="48" rx="10" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/>
        <rect x="18" y="38" width="44" height="14" rx="4" fill="#ffc890" stroke="#e0a070" strokeWidth="1"/>
        <rect x="30" y="5" width="18" height="40" rx="8" fill="#ffd4a8" stroke={c} strokeWidth="2.5"/>
        <circle cx="39" cy="10" r="3" fill={c} opacity="0.5"/>
      </svg>
    ),
    ily: (
      <svg width={size} height={size} viewBox="0 0 80 110">
        <rect x="25" y="42" width="14" height="25" rx="4" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1"/>
        <rect x="39" y="44" width="14" height="23" rx="4" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1"/>
        <rect x="22" y="60" width="36" height="22" rx="6" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/>
        <rect x="14" y="5" width="16" height="44" rx="7" fill="#ffd4a8" stroke={c} strokeWidth="2"/>
        <rect x="54" y="12" width="14" height="40" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/>
      </svg>
    ),
    bhand: (
      <svg width={size} height={size} viewBox="0 0 80 110">
        <rect x="20" y="42" width="42" height="22" rx="6" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/>
        <rect x="7" y="50" width="15" height="22" rx="6" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/>
        <rect x="18" y="5" width="14" height="42" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/>
        <rect x="31" y="3" width="14" height="44" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/>
        <rect x="44" y="4" width="14" height="44" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/>
        <rect x="57" y="7" width="13" height="40" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/>
      </svg>
    ),
    chand: (
      <svg width={size} height={size} viewBox="0 0 80 90">
        <path d="M15 45 Q15 25 40 20 Q65 25 65 45 Q65 75 40 80 Q15 75 15 55 Z" fill="#ffd4a8" stroke={c} strokeWidth="2" fillOpacity="0.9"/>
        <path d="M15 45 Q15 35 25 32" fill="none" stroke="#e0a070" strokeWidth="1.5"/>
        <path d="M65 45 Q65 35 55 32" fill="none" stroke="#e0a070" strokeWidth="1.5"/>
      </svg>
    ),
    point2: (
      <svg width={size} height={size} viewBox="0 0 80 110">
        <rect x="28" y="55" width="14" height="28" rx="4" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1"/>
        <rect x="42" y="57" width="14" height="26" rx="4" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1"/>
        <rect x="26" y="68" width="34" height="20" rx="6" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/>
        <rect x="10" y="62" width="18" height="14" rx="5" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1"/>
        <rect x="25" y="5" width="16" height="55" rx="7" fill="#ffd4a8" stroke={c} strokeWidth="2.5"/>
        <rect x="40" y="7" width="15" height="54" rx="7" fill="#ffd4a8" stroke={c} strokeWidth="2.5"/>
      </svg>
    ),
    flato: (
      <svg width={size} height={size} viewBox="0 0 80 100">
        <path d="M38 28 Q38 15 45 12 Q52 15 52 28 Q52 38 45 40 Q38 38 38 28 Z" fill="#ffd4a8" stroke={c} strokeWidth="2"/>
        <rect x="20" y="38" width="42" height="20" rx="6" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/>
        <rect x="10" y="46" width="14" height="20" rx="5" fill="#ffd4a8" stroke={c} strokeWidth="1.5"/>
        <rect x="20" y="52" width="42" height="28" rx="8" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/>
        <line x1="22" y1="58" x2="60" y2="58" stroke="#e0a070" strokeWidth="1" opacity="0.5"/>
        <line x1="22" y1="66" x2="60" y2="66" stroke="#e0a070" strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
    vhand: (
      <svg width={size} height={size} viewBox="0 0 80 110">
        <rect x="30" y="55" width="13" height="26" rx="4" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1"/>
        <rect x="43" y="55" width="13" height="26" rx="4" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1"/>
        <rect x="28" y="68" width="30" height="22" rx="6" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/>
        <rect x="12" y="63" width="18" height="14" rx="5" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1"/>
        <rect x="23" y="5" width="16" height="55" rx="7" fill="#ffd4a8" stroke={c} strokeWidth="2.5"/>
        <rect x="40" y="7" width="15" height="54" rx="7" fill="#ffd4a8" stroke={c} strokeWidth="2.5"/>
        <line x1="23" y1="36" x2="18" y2="10" stroke={c} strokeWidth="1" opacity="0.4" strokeDasharray="3 2"/>
        <line x1="55" y1="36" x2="60" y2="10" stroke={c} strokeWidth="1" opacity="0.4" strokeDasharray="3 2"/>
      </svg>
    ),
    whand: (
      <svg width={size} height={size} viewBox="0 0 80 110">
        <rect x="22" y="58" width="12" height="25" rx="4" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1"/>
        <rect x="34" y="56" width="12" height="27" rx="4" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1"/>
        <rect x="46" y="58" width="12" height="25" rx="4" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1"/>
        <rect x="20" y="70" width="40" height="20" rx="6" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/>
        <rect x="10" y="65" width="14" height="14" rx="5" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1"/>
        <rect x="18" y="5" width="14" height="58" rx="7" fill="#ffd4a8" stroke={c} strokeWidth="2"/>
        <rect x="32" y="3" width="14" height="58" rx="7" fill="#ffd4a8" stroke={c} strokeWidth="2"/>
        <rect x="46" y="5" width="14" height="58" rx="7" fill="#ffd4a8" stroke={c} strokeWidth="2"/>
      </svg>
    ),
    yhand: (
      <svg width={size} height={size} viewBox="0 0 80 110">
        <rect x="25" y="42" width="14" height="25" rx="4" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1"/>
        <rect x="39" y="44" width="14" height="23" rx="4" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1"/>
        <rect x="22" y="60" width="36" height="22" rx="6" fill="#ffd4a8" stroke="#e0a070" strokeWidth="1.5"/>
        <rect x="10" y="5" width="16" height="44" rx="7" fill="#ffd4a8" stroke={c} strokeWidth="2"/>
        <rect x="56" y="20" width="13" height="36" rx="6" fill="#ffd4a8" stroke={c} strokeWidth="2"/>
      </svg>
    ),
  }
  return shapes[shape] || shapes['open']
}

/* ═══════════════════════════════════
   API
═══════════════════════════════════ */
async function callClaude(prompt, system = '') {
  const body = { model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }
  if (system) body.system = system
  const res  = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json()
  return data.content?.map(b => b.text || '').join('') || ''
}

function signsForCat(id) { return id === 'all' ? SIGNS : SIGNS.filter(s => s.cat === id) }

/* ═══════════════════════════════════
   PARAM BADGE
═══════════════════════════════════ */
const PARAM_META = {
  수형: { label: '수형', sub: '손 모양', color: '#7c6fff' },
  수위: { label: '수위', sub: '위치',   color: '#3b82f6' },
  수동: { label: '수동', sub: '움직임', color: '#10b981' },
  수향: { label: '수향', sub: '방향',   color: '#f59e0b' },
  비수지:{ label: '비수지', sub: '표정·입', color: '#ec4899' },
}
function ParamBadge({ k, v }) {
  const m = PARAM_META[k]
  return (
    <div className="param-badge" style={{ '--pc': m.color }}>
      <div className="param-key">{m.label} <span className="param-sub">{m.sub}</span></div>
      <div className="param-val">{v}</div>
    </div>
  )
}

/* ═══════════════════════════════════
   LEARN MODE
═══════════════════════════════════ */
function LearnMode() {
  const [catId,    setCatId]   = useState('all')
  const [idx,      setIdx]     = useState(0)
  const [mastered, setMastered] = useState(new Set())
  const [aiText,   setAiText]  = useState('')
  const [aiLoad,   setAiLoad]  = useState(false)

  const pool = signsForCat(catId)
  const sign = pool[Math.min(idx, pool.length - 1)]

  const go = (d) => {
    setAiText('')
    setTimeout(() => setIdx(i => (i + d + pool.length) % pool.length), 80)
  }

  useEffect(() => { setIdx(0); setAiText('') }, [catId])

  const askAI = async () => {
    setAiLoad(true); setAiText('')
    try {
      const t = await callClaude(
        `한국수어 "${sign.label}" 초보자를 위한 추가 정보:\n1. 손 모양의 기원/이유 (1-2문장)\n2. 실생활 예시 문장 2개 (수어 어순)\n3. 혼동하기 쉬운 수어 1개와 구별법`,
        '한국농아인협회 공인 한국수어 강사. 정확하고 친근하게.'
      )
      setAiText(t.trim())
    } catch { setAiText('AI 설명을 불러올 수 없습니다.') }
    setAiLoad(false)
  }

  const isMastered    = mastered.has(sign?.id)
  const masteredCount = pool.filter(s => mastered.has(s.id)).length
  const toggleMaster  = () => setMastered(p => { const n = new Set(p); n.has(sign.id) ? n.delete(sign.id) : n.add(sign.id); return n })

  return (
    <div className="learn-mode">
      <div className="cat-scroll">
        {CATEGORIES.map(c => (
          <button key={c.id} className={`cat-tab ${catId === c.id ? 'active' : ''}`} onClick={() => setCatId(c.id)}>
            {c.icon} {c.label} <span className="cat-count">{signsForCat(c.id).length}</span>
          </button>
        ))}
      </div>
      <div className="learn-meta-row">
        <span className="learn-counter">{idx + 1} / {pool.length}</span>
        <div className="mastered-bar">
          <div className="mastered-track"><div className="mastered-fill" style={{ width: `${(masteredCount / pool.length) * 100}%` }} /></div>
          <span className="mastered-label">✅ {masteredCount}/{pool.length}</span>
        </div>
      </div>
      <div className="learn-dots">
        {pool.map((s, i) => (
          <span key={s.id} className={`dot ${i === idx ? 'active' : ''} ${mastered.has(s.id) ? 'mastered' : ''}`}
            title={s.label} onClick={() => { setAiText(''); setIdx(i) }} />
        ))}
      </div>
      {sign && <SignLearnCard sign={sign} isMastered={isMastered} onToggleMaster={toggleMaster} />}
      <div className="learn-controls">
        <button className="ctrl-btn" onClick={() => go(-1)}>← 이전</button>
        <span className="lc-nav-label">{sign?.label}</span>
        <button className="ctrl-btn" onClick={() => go(1)}>다음 →</button>
      </div>
      <div className="ai-section">
        <button className="ai-explain-btn" onClick={askAI} disabled={aiLoad}>
          {aiLoad ? '🤖 생성 중...' : '🤖 AI 심화 설명 (기원 · 예문 · 혼동어)'}
        </button>
        {(aiLoad || aiText) && (
          <div className={`ai-feedback-box has-content ${aiLoad ? 'loading' : ''}`}>
            <div className="ai-header"><span className="ai-icon">🤖</span><span>AI 심화 설명</span>{aiLoad && <span className="ai-loading-dot" />}</div>
            {aiLoad ? <div className="ai-skeleton"><div className="skel-line" /><div className="skel-line" /><div className="skel-line short" /></div>
                    : <p className="ai-text">{aiText}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

function PracticeMode() {
  const [catId,   setCatId]   = useState('all')
  const [diff,    setDiff]    = useState('normal')
  const [target,  setTarget]  = useState(null)
  const [choices, setChoices] = useState([])
  const [detected,setDetected]= useState(null)
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [aiFb,    setAiFb]    = useState('')
  const [aiLoad,  setAiLoad]  = useState(false)
  const [history, setHistory] = useState([])
  const [score,   setScore]   = useState({ correct: 0, total: 0 })
  const [showParams, setShowParams] = useState(false)

  const pool = signsForCat(catId)

  const buildChoices = useCallback((t) => {
    const n = diff === 'easy' ? 4 : diff === 'hard' ? 9 : 6
    const others = SIGNS.filter(s => s.id !== t.id).sort(() => Math.random() - 0.5).slice(0, n - 1)
    return [...others, t].sort(() => Math.random() - 0.5)
  }, [diff])

  const next = useCallback(() => {
    const p = signsForCat(catId)
    const t = p[Math.floor(Math.random() * p.length)]
    setTarget(t); setChoices(buildChoices(t))
    setDetected(null); setResult(null); setAiFb(''); setShowParams(false)
  }, [catId, buildChoices])

  useEffect(() => { next() }, [catId, diff])

  const detect = async (sign) => {
    if (loading || aiLoad || result) return
    setLoading(true); setAiFb('')
    await new Promise(r => setTimeout(r, 400))
    const ok = sign.id === target.id
    setDetected(sign); setResult(ok ? 'correct' : 'wrong'); setLoading(false)
    setScore(p => ({ correct: p.correct + (ok ? 1 : 0), total: p.total + 1 }))
    setHistory(h => [{ ...sign, correct: ok, time: new Date().toLocaleTimeString('ko-KR') }, ...h.slice(0, 5)])
    setAiLoad(true)
    try {
      const prompt = ok
        ? `수어 학습자가 "${sign.label}" 한국수어를 맞혔습니다. 이 수어의 실생활 활용 예시와 함께 2문장으로 격려해주세요.`
        : `한국수어 학습자가 "${target.label}"을 해야 했지만 "${sign.label}"을 했습니다. 두 수어의 핵심 차이(수형·수위·수동 중 무엇이 다른지)를 명확히 2-3문장으로 설명해주세요.`
      setAiFb((await callClaude(prompt, '당신은 한국수어 전문 강사입니다.')).trim())
    } catch { setAiFb('피드백을 불러올 수 없습니다.') }
    setAiLoad(false)
  }

  const acc = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0

  return (
    <div className="practice-mode">
      {/* Options */}
      <div className="options-bar">
        <div className="option-group">
          <span className="option-label">카테고리</span>
          <div className="option-pills">
            {CATEGORIES.map(c => (
              <button key={c.id} className={`pill ${catId === c.id ? 'active' : ''}`} onClick={() => setCatId(c.id)}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="option-group">
          <span className="option-label">난이도</span>
          <div className="option-pills">
            {[['easy','쉬움 4개'],['normal','보통 6개'],['hard','어려움 9개']].map(([v,l]) => (
              <button key={v} className={`pill ${diff === v ? 'active' : ''}`} onClick={() => setDiff(v)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Scorebar */}
      <div className="practice-scorebar">
        {[['정답', score.correct], ['시도', score.total], [`${acc}%`, '정확도']].map(([n, l], i) => (
          <div key={i} className={`score-stat ${i > 0 ? 'with-divider' : ''}`}>
            <span className="score-n" style={n === `${acc}%` ? { color: acc >= 70 ? '#10b981' : '#ef4444' } : {}}>{typeof l === 'number' ? l : n}</span>
            <span className="score-l">{typeof l === 'number' ? l : n === `${acc}%` ? '정확도' : l}</span>
          </div>
        ))}
        <div className="score-stat with-divider">
          <span className="score-n" style={{ fontSize: 13, color: '#888' }}>{pool.length}개</span>
          <span className="score-l">현재</span>
        </div>
      </div>

      {/* Target card */}
      {target && (
        <div className="target-card" style={{ '--c': target.color }}>
          <div className="target-tag">이 수어를 선택하세요</div>
          <div className="target-emoji-wrap">
            <HandShapeSVG shape={target.params.수형.split(' ')[0].replace('+','').trim()} color={target.color} size={72} />
          </div>
          <div className="target-label">{target.label}</div>
          <div className="target-en">{target.english}</div>
          <button className="hint-btn" onClick={() => setShowParams(p => !p)}>
            {showParams ? '힌트 숨기기' : '💡 힌트 보기'}
          </button>
          {showParams && (
            <div className="target-hint-params">
              <ParamBadge k="수위" v={target.params.수위} />
              <ParamBadge k="수동" v={target.params.수동} />
            </div>
          )}
        </div>
      )}

      <div className="practice-layout">
        <div className="signs-panel">
          <p className="panel-hint">아래 수어 중 하나를 고르세요</p>
          <div className={`signs-grid cols-${diff === 'easy' ? 2 : 3}`}>
            {choices.map(s => {
              const isChosen  = detected?.id === s.id
              const isCorrect = s.id === target?.id
              let cls = 'sign-btn'
              if (isChosen) cls += result === 'correct' ? ' btn-correct' : ' btn-wrong'
              else if (detected && isCorrect) cls += ' btn-reveal'
              return (
                <button key={s.id} className={cls} style={{ '--c': s.color }}
                  onClick={() => detect(s)} disabled={loading || aiLoad || !!result}>
                  <HandShapeSVG shape={s.params.수형.split(' ')[0].replace('+','').trim()} color={isChosen || (detected && isCorrect) ? '#fff' : s.color} size={44} />
                  <span className="sign-label">{s.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="feedback-panel">
          <div className={`result-card ${result || 'idle'}`}>
            {loading
              ? <div className="detecting"><div className="detect-spinner" /><span>채점 중...</span></div>
              : detected
                ? <>
                    <HandShapeSVG shape={detected.params.수형.split(' ')[0].replace('+','').trim()} color={result === 'correct' ? '#10b981' : '#ef4444'} size={60} />
                    <div className="res-label" style={{ color: detected.color }}>{detected.label}</div>
                    <div className={`res-verdict ${result}`}>{result === 'correct' ? '✔ 정확합니다!' : '✕ 다시 시도하세요'}</div>
                  </>
                : <div className="idle-msg">수어를 선택하세요</div>}
          </div>

          <div className={`ai-feedback-box ${aiFb ? 'has-content' : ''} ${aiLoad ? 'loading' : ''}`}>
            <div className="ai-header"><span className="ai-icon">🤖</span><span>AI 피드백</span>{aiLoad && <span className="ai-loading-dot" />}</div>
            {aiLoad ? <div className="ai-skeleton"><div className="skel-line" /><div className="skel-line short" /></div>
              : aiFb ? <p className="ai-text">{aiFb}</p>
              : <p className="ai-placeholder">선택하면 AI 피드백이 표시됩니다</p>}
          </div>

          <button className="next-btn" onClick={next} disabled={loading}>🔁 다음 문제</button>

          <div className="history-box">
            <div className="history-title">🕐 최근 기록</div>
            {history.length === 0 ? <div className="history-empty">기록 없음</div>
              : history.map((h, i) => (
                <div key={i} className="history-row">
                  <span className="h-label">{h.label}</span>
                  <span className="h-time">{h.time}</span>
                  <span className={`h-result ${h.correct ? 'ok' : 'fail'}`}>{h.correct ? '✔' : '✕'}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════
   AI TEST MODE — conversational
═══════════════════════════════════ */
function AITestMode() {
  const [phase,   setPhase]   = useState('intro')
  const [catId,   setCatId]   = useState('all')
  const [msgs,    setMsgs]    = useState([])
  const [input,   setInput]   = useState('')
  const [sending, setSending] = useState(false)
  const [qNum,    setQNum]    = useState(0)
  const [done,    setDone]    = useState(false)
  const [finalFb, setFinalFb] = useState('')
  const [fbLoad,  setFbLoad]  = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const catSigns  = signsForCat(catId)
  const TOTAL     = Math.min(10, catSigns.length)

  const SYSTEM = `당신은 공인 한국수어(KSL) 시험관입니다.
시험 범위 수어:
${catSigns.map(s => `- ${s.label} (${s.english}): 수형=${s.params.수형}, 수위=${s.params.수위}, 수동=${s.params.수동}`).join('\n')}

규칙:
1. 총 ${TOTAL}문제. 항상 [질문 N/${TOTAL}] 형식으로 번호 표시.
2. 문제 유형 교체: ①수어 동작 설명→이름 맞히기, ②이름→동작 설명, ③수형 설명→해당 수어 2가지.
3. 정답이면 "✅ 정답!" 으로 시작, 오답이면 "❌ 오답:" 으로 시작.
4. 오답 후 반드시 정확한 KSL 동작 설명 제공.
5. ${TOTAL}번째 채점 후 정확히 이 JSON 한 줄을 출력: {"score":N,"total":${TOTAL}}
6. 이후 "🏁 테스트 완료" 출력.
7. 전체 한국어, 친근하고 전문적 어조.`

  const start = async () => {
    setMsgs([]); setQNum(0); setDone(false); setFinalFb(''); setPhase('chat'); setSending(true)
    try {
      const r = await callClaude('한국수어 시험을 시작합니다. 첫 번째 질문을 해주세요.', SYSTEM)
      setMsgs([{ role: 'assistant', content: r }]); setQNum(1)
    } catch { setMsgs([{ role: 'assistant', content: '연결 오류. 잠시 후 다시 시도해 주세요.' }]) }
    setSending(false)
  }

  const send = async () => {
    if (!input.trim() || sending || done) return
    const text = input.trim(); setInput('')
    const history = [...msgs, { role: 'user', content: text }]
    setMsgs(history); setSending(true)
    try {
      const res  = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: SYSTEM, messages: history.map(m => ({ role: m.role, content: m.content })) }),
      })
      const data = await res.json()
      const reply = data.content?.map(b => b.text || '').join('') || ''
      const updated = [...history, { role: 'assistant', content: reply }]
      setMsgs(updated)
      if (reply.includes('🏁 테스트 완료')) {
        setDone(true)
        setFbLoad(true)
        const m = reply.match(/\{"score"\s*:\s*(\d+).*?\}/)
        const scoreVal = m ? parseInt(m[1]) : '?'
        const fb = await callClaude(
          `KSL 시험 결과: ${TOTAL}문제 중 ${scoreVal}개 정답. 학습자에게 구체적인 개선 방향과 격려를 한국어 3-4문장으로.`,
          '한국수어 전문 강사'
        )
        setFinalFb(fb.trim()); setFbLoad(false)
      } else { setQNum(q => q + 1) }
    } catch { setMsgs(m => [...m, { role: 'assistant', content: '오류가 발생했습니다.' }]) }
    setSending(false)
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, sending])
  useEffect(() => { if (phase === 'chat') inputRef.current?.focus() }, [phase])

  if (phase === 'intro') return (
    <div className="test-intro">
      <div className="intro-icon">🤖</div>
      <h3 className="intro-title">AI 한국수어 시험</h3>
      <p className="intro-desc">AI 시험관이 실제 KSL 지식을 평가합니다.<br />수형·수위·수동 등 5요소를 정확히 알아야 합격!</p>
      <div className="option-group" style={{ width: '100%', maxWidth: 520 }}>
        <span className="option-label">시험 범위</span>
        <div className="option-pills" style={{ justifyContent: 'center' }}>
          {CATEGORIES.map(c => (
            <button key={c.id} className={`pill ${catId === c.id ? 'active' : ''}`} onClick={() => setCatId(c.id)}>
              {c.icon} {c.label} <span className="cat-count">{signsForCat(c.id).length}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="intro-rules">
        {[['🤖',`AI가 ${TOTAL}문제 출제`],['💬','수형·위치·동작을 텍스트로 설명'],['✅','즉각 채점 + 정확한 KSL 해설'],['📊','최종 AI 종합 분석']].map(([i,t]) => (
          <div key={t} className="rule"><span>{i}</span><span>{t}</span></div>
        ))}
      </div>
      <button className="start-btn" onClick={start}>시험 시작 →</button>
    </div>
  )

  return (
    <div className="ai-test-wrap">
      <div className="chat-header">
        <div className="chat-header-left">
          <span className="chat-avatar">🤖</span>
          <div>
            <div className="chat-name">한국수어 AI 시험관</div>
            <div className="chat-status">{sending ? '답변 작성 중...' : done ? '시험 완료' : `질문 ${Math.min(qNum, TOTAL)} / ${TOTAL}`}</div>
          </div>
        </div>
        <div className="chat-progress-wrap">
          <div className="chat-progress-track"><div className="chat-progress-fill" style={{ width: `${(Math.min(qNum, TOTAL) / TOTAL) * 100}%` }} /></div>
        </div>
      </div>

      <div className="chat-messages">
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.role === 'assistant' && <span className="msg-avatar">🤖</span>}
            <div className="msg-bubble"><pre className="msg-text">{m.content}</pre></div>
          </div>
        ))}
        {sending && (
          <div className="msg assistant">
            <span className="msg-avatar">🤖</span>
            <div className="msg-bubble typing"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {done && (
        <div className={`ai-feedback-box has-content final-feedback ${fbLoad ? 'loading' : ''}`}>
          <div className="ai-header"><span className="ai-icon">🤖</span><span>AI 종합 분석</span>{fbLoad && <span className="ai-loading-dot" />}</div>
          {fbLoad ? <div className="ai-skeleton"><div className="skel-line" /><div className="skel-line" /><div className="skel-line short" /></div>
                  : <p className="ai-text">{finalFb}</p>}
        </div>
      )}

      <div className="chat-input-wrap">
        {done
          ? <button className="start-btn" style={{ width: '100%' }} onClick={() => setPhase('intro')}>🔁 다시 시작</button>
          : <>
              <textarea ref={inputRef} className="chat-input" rows={2}
                placeholder="수어 동작을 설명하거나 이름을 입력하세요 (Enter 전송)"
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                disabled={sending || done} />
              <button className="chat-send-btn" onClick={send} disabled={sending || !input.trim() || done}>
                {sending ? '⏳' : '전송 ↑'}
              </button>
            </>}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════
   ROOT
═══════════════════════════════════ */
export default function PracticePage() {
  const [mode, setMode] = useState(0)
  return (
    <div className="practice-page">
      <div className="page-header">
        <h2 className="page-title">🤟 한국수어 학습센터</h2>
        <p className="page-sub">국립국어원 한국수어사전 기반 · 5요소 완전 학습 · MediaPipe 카메라 인식 · AI 피드백</p>
      </div>
      <div className="mode-tabs">
        {[['📖','학습'],['🤟','연습'],['📷','카메라'],['🤖','AI 시험']].map(([icon, label], i) => (
          <button key={label} className={`mode-tab ${mode === i ? 'active' : ''}`} onClick={() => setMode(i)}>
            {icon} {label}
          </button>
        ))}
      </div>
      <div className="mode-content">
        {mode === 0 && <LearnMode />}
        {mode === 1 && <PracticeMode />}
        {mode === 2 && <GestureCheck />}
        {mode === 3 && <AITestMode />}
      </div>
    </div>
  )
}