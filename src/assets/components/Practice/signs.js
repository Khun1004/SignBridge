/* ─── signs.js — Fixed KSL Data ─── */

export const CATEGORIES = [
  { id: 'all',       label: '전체',  icon: '🗂️', desc: '모든 수어' },
  { id: 'emergency', label: '긴급',  icon: '🚨', desc: '위급 상황 표현' },
  { id: 'medical',   label: '의료',  icon: '🏥', desc: '의료·건강 표현' },
  { id: 'travel',    label: '여행',  icon: '✈️', desc: '여행·이동 표현' },
  { id: 'greet',     label: '인사',  icon: '👋', desc: '일상 인사 표현' },
  { id: 'question',  label: '질문',  icon: '❓', desc: '의문·질문 표현' },
  { id: 'time',      label: '시간',  icon: '⏰', desc: '시간·날짜 표현' },
  { id: 'feeling',   label: '감정',  icon: '😊', desc: '감정·상태 표현' },
  { id: 'answer',    label: '대답',  icon: '💬', desc: '응답 표현' },
  { id: 'number',    label: '숫자',  icon: '🔢', desc: '1–10 기본 숫자' },
  { id: 'daily',     label: '일상',  icon: '🌿', desc: '일상 기본 표현' },
  { id: 'body',      label: '신체',  icon: '🫀', desc: '신체 부위' },
]

export const HANDSHAPES = {
  fist:         { label: '주먹 (S형)',              desc: '네 손가락 모두 접음' },
  open:         { label: '편손 (5형)',               desc: '다섯 손가락 모두 펴기' },
  point1:       { label: '검지 (1형)',               desc: '검지만 펴기, 손등이 밖' },
  point2:       { label: 'V형 (검지+중지)',           desc: '검지·중지 펴기, 나머지 접음' },
  threefinger:  { label: '3형 (검지+중지+약지)',      desc: '검지·중지·약지 펴기, 엄지·소지 접음' },
  fourfinger:   { label: '4형 (검지+중지+약지+소지)', desc: '엄지만 접음, 나머지 네 손가락 펴기' },
  thumb:        { label: '엄지 (A형)',               desc: '엄지만 세우기' },
  ily:          { label: 'I♡U형',                   desc: '엄지·검지·소지 펴기' },
  bhand:        { label: 'B형 (편손)',               desc: '네 손가락 붙여 펴기' },
  chand:        { label: 'C형 (구형)',               desc: '손가락을 둥글게 굽히기' },
  flato:        { label: 'F형 (O형 핀치)',           desc: '엄지·검지 끝을 맞댐' },
  yhand:        { label: 'Y형 (엄지+소지)',          desc: '엄지·소지 펴기' },
  lhand:        { label: 'L형 (엄지+검지)',          desc: '엄지·검지 펴기, L자 모양' },
  thumbring:    { label: '엄지+약지',                desc: '엄지와 약지만 펴기' },
  thumbmiddle:  { label: '엄지+중지',                desc: '엄지와 중지만 펴기' },
  pinky:        { label: '소지 (새끼손가락)',         desc: '새끼손가락만 펴기' },
}

export const SIGNS = [
  /* ─── 인사 ─── */
  {
    id: 'g01',
    cat: 'greet',
    label: '안녕하세요',
    korean: '인사',
    english: 'Hello',
    color: '#7c6fff',
    params: {
      수형: 'bhand → fist',
      수위: '관자놀이 → 가슴 앞',
      수동: '손을 쓸어내린 후 두 주먹을 가슴 앞으로 내리기',
    },
    steps: [
      '오른손 바닥을 펴서 왼쪽 관자놀이 부근에서 아래로 부드럽게 쓸어내립니다.',
      '양손을 주먹 쥐고 가슴 앞에서 가볍게 아래로 내리며 멈춥니다.',
    ],
  },
  {
    id: 'g02',
    cat: 'greet',
    label: '감사합니다',
    korean: '고마움',
    english: 'Thank you',
    color: '#7c6fff',
    params: {
      수형: 'open (양손)',
      수위: '가슴 앞',
      수동: '왼 손등을 오른 손날로 두 번 두드리기',
    },
    steps: [
      '왼손을 가슴 높이에서 손바닥이 아래로 향하게 눕힙니다.',
      '오른손 날을 세워 왼 손등 위를 가볍게 두 번 두드립니다.',
    ],
  },
  {
    id: 'g12',
    cat: 'greet',
    label: '죄송합니다',
    korean: '미안함',
    english: 'Sorry',
    color: '#7c6fff',
    params: {
      수형: 'flato → open',
      수위: '이마 → 왼 손등',
      수동: '엄지+검지 O형으로 이마 터치 후 가슴 앞으로 내리며 왼 손등 위에 얹기',
    },
    steps: [
      '오른손 엄지와 검지를 붙여 O형(OK 모양)을 만들고 이마에 댑니다.',
      '손을 떼어 가슴 앞쪽 아래로 내립니다.',
      '왼손등 위를 오른손으로 톡톡 두드리거나 살짝 얹습니다.',
    ],
  },
  {
    id: 'g13',
    cat: 'greet',
    label: '괜찮아요',
    korean: '괜찮음·양호',
    english: "It's okay",
    color: '#7c6fff',
    params: {
      수형: 'pinky',
      수위: '턱 아래',
      수동: '새끼손가락 끝으로 턱 아래쪽을 가볍게 톡톡 대기',
      비수지: '편안하고 긍정적인 표정',
    },
    steps: [
      '오른손의 주먹을 쥔 상태에서 새끼손가락만 폅니다.',
      '핀 새끼손가락 끝을 턱 아래쪽에 위치시킵니다.',
      '턱 아래를 가볍게 두 번 톡톡 건드립니다.',
      '상대방에게 안심을 주는 부드러운 미소를 함께 짓습니다.',
    ],
    notes: '상태가 괜찮거나 양호함을 나타내는 대표적인 표현입니다.',
  },
  {
    id: 'g14',
    cat: 'greet',
    label: '이름',
    korean: '이름',
    english: 'Name',
    color: '#7c6fff',
    params: {
      수형: 'lhand',
      수위: '가슴 높이',
      수동: '엄지가 아래를 향하게 짧게 내리기',
    },
    steps: [
      '엄지와 검지를 펴고 가슴 높이에서 엄지를 아래로 향합니다.',
      '손을 짧게 아래로 내립니다.',
    ],
  },

  /* ─── 긴급 ─── */
  {
    id: 'e01',
    cat: 'emergency',
    label: '도움',
    korean: '도움·도와주다',
    english: 'Help',
    color: '#ef4444',
    params: {
      수형: 'thumb + open',
      수위: '가슴 앞',
      수동: '왼 엄지 세운 손등에 오른 손바닥을 두 번 대기',
      비수지: '절박한 표정',
    },
    steps: [
      '왼 주먹의 엄지를 펴서 바닥이 밖으로 향하게 세웁니다.',
      '오른 손바닥을 세워 왼 손등에 두 번 댑니다.',
    ],
  },
  {
    id: 'e02',
    cat: 'emergency',
    label: '신고',
    korean: '경찰·신고',
    english: 'Report',
    color: '#ef4444',
    params: {
      수형: 'point1',
      수위: '입 앞',
      수동: '검지를 입 앞에 세웠다가 앞쪽으로 내밀며 정보 전달',
      비수지: '심각한 표정',
    },
    steps: [
      '오른손 검지를 펴서 입 앞에 세웁니다. 손등이 밖을 향하게 합니다.',
      '앞쪽으로 내밀며 정보를 전달하는 느낌으로 움직입니다.',
    ],
  },
  {
    id: 'e03',
    cat: 'emergency',
    label: '위험',
    korean: '위험·경고',
    english: 'Danger',
    color: '#ef4444',
    params: {
      수형: 'chand',
      수위: '가슴',
      수동: 'C형 손가락 끝으로 가슴을 두 번 두드리기',
      비수지: '긴장한 표정',
    },
    steps: [
      '오른손을 C자 모양으로 구부립니다.',
      '구부린 손가락 끝으로 가슴을 가볍게 두 번 두드립니다.',
    ],
  },
  {
    id: 'e04',
    cat: 'emergency',
    label: '경찰',
    korean: '경찰',
    english: 'Police',
    color: '#ef4444',
    params: {
      수형: 'open',
      수위: '가슴 왼쪽',
      수동: '왼쪽 가슴 배지 위치를 가리키기',
    },
    steps: [
      '왼쪽 가슴 배지 위치에 손을 대어 가리킵니다.',
    ],
  },
  {
    id: 'e05',
    cat: 'emergency',
    label: '불',
    korean: '화재',
    english: 'Fire',
    color: '#ef4444',
    params: {
      수형: 'open (양손)',
      수위: '아래에서 위로',
      수동: '양손을 아래에서 위로 올려 불꽃 모양 표현',
      비수지: '긴박한 표정',
    },
    steps: [
      '양손을 허리 아래에서 시작합니다.',
      '손가락을 펼친 채로 위로 올리며 불꽃이 타오르는 모양을 표현합니다.',
    ],
  },

  /* ─── 의료 ─── */
  {
    id: 'm01',
    cat: 'medical',
    label: '의사',
    korean: '의사·의료인',
    english: 'Doctor',
    color: '#10b981',
    params: {
      수형: 'point2',
      수위: '왼 손등/손목',
      수동: '왼 손등을 V형으로 두 번 친 후, 왼 주먹 손목 옆면을 V형으로 두 번 치기',
    },
    steps: [
      '왼손 손등이 밖을 향하게 세웁니다.',
      '오른손 V형(검지+중지)으로 왼 손등을 두 번 칩니다.',
      '왼손을 주먹으로 바꿉니다.',
      '오른손 V형으로 왼 손목 옆면을 두 번 칩니다.',
    ],
    notes: '두 단계 동작입니다: 손등 타격 → 손목 타격.',
  },
  {
    id: 'm02',
    cat: 'medical',
    label: '아프다',
    korean: '통증',
    english: 'Pain / Hurt',
    color: '#10b981',
    params: {
      수형: 'chand',
      수위: '가슴/배 앞',
      수동: '손바닥을 위로 향하게 살짝 오므려 좌우로 가볍게 흔들기',
      비수지: '찡그린 표정',
    },
    steps: [
      '오른 손바닥을 위로 향하게 하여 가볍게 오므립니다.',
      '가슴이나 배 앞에서 좌우로 가볍게 흔듭니다.',
    ],
  },
  {
    id: 'm03',
    cat: 'medical',
    label: '약',
    korean: '약·의약품',
    english: 'Medicine',
    color: '#10b981',
    params: {
      수형: 'point1+open',
      수위: '왼 손바닥 위',
      수동: '왼 손바닥 위를 오른 검지(1형)로 앞뒤로 문지르기 (갈기 동작)',
    },
    steps: [
      '왼 손바닥을 펴서 위로 향하게 합니다.',
      '오른손 검지(1형)로 손바닥 위를 앞뒤로 문지릅니다.',
    ],
  },
  {
    id: 'm04',
    cat: 'medical',
    label: '열',
    korean: '발열',
    english: 'Fever',
    color: '#10b981',
    params: {
      수형: 'open',
      수위: '이마 → 왼 손바닥',
      수동: '오른 손바닥을 이마에 댔다 뗀 후 왼 손바닥 위에 대기',
    },
    steps: [
      '오른 손바닥을 이마에 가볍게 댔다 뗍니다.',
      '그대로 이동해 왼 손바닥 위에 가볍게 댑니다.',
    ],
  },

  /* ─── 여행 ─── */
  {
    id: 'tr01',
    cat: 'travel',
    label: '비자',
    korean: '비자·여권',
    english: 'Visa',
    color: '#f59e0b',
    params: {
      수형: 'fist + open',
      수위: '왼 손바닥 위',
      수동: '왼 손바닥 위에 주먹으로 도장 찍기',
    },
    steps: [
      '왼 손바닥을 펴서 위로 향하게 합니다.',
      '오른손을 주먹 쥐어 도장을 찍듯 톡 내립니다.',
    ],
  },
  {
    id: 'tr02',
    cat: 'travel',
    label: '여행',
    korean: '여행·관광',
    english: 'Travel',
    color: '#f59e0b',
    params: {
      수형: 'point1 (양손)',
      수위: '양 어깨 뒤쪽',
      수동: '양손 검지를 양 어깨 뒤에 두고, 원을 그리듯 앞으로 돌리며 내미는 동작 2회 반복',
    },
    steps: [
      '양손 검지를 펴서 손가락 끝이 각각 양 어깨 뒤쪽을 향하게 위치시킵니다.',
      '양손을 동시에 바깥쪽 원을 그리듯 앞으로 돌립니다.',
      '검지를 앞쪽으로 내밀며 마무리합니다.',
      '이 동작을 2번 반복합니다.',
    ],
  },

  /* ─── 질문 ─── */
  {
    id: 'q15',
    cat: 'question',
    label: '뭐',
    korean: '무엇',
    english: 'What',
    color: '#8b5cf6',
    params: {
      수형: 'point1',
      수위: '몸 앞',
      수동: '손바닥이 밖을 향하게 검지를 좌우로 흔들기',
    },
    steps: [
      '오른손 검지를 펴서 손바닥이 밖을 향하게 합니다.',
      '좌우로 가볍게 두 번 흔듭니다.',
    ],
  },
  {
    id: 'q16',
    cat: 'question',
    label: '어디',
    korean: '장소',
    english: 'Where',
    color: '#8b5cf6',
    params: {
      수형: 'point1',
      수위: '몸 앞',
      수동: '검지를 좌우로 흔든 후 아래로 살짝 내리기',
    },
    steps: [
      '검지를 좌우로 움직인 후 손을 아래로 살짝 내립니다.',
    ],
  },
  {
    id: 'q17',
    cat: 'question',
    label: '왜',
    korean: '이유',
    english: 'Why',
    color: '#8b5cf6',
    params: {
      수형: 'point1',
      수위: '관자놀이',
      수동: '검지 끝을 관자놀이에 대기',
      비수지: '의문스러운 표정',
    },
    steps: [
      '검지 끝을 관자놀이에 갖다 댑니다.',
      '의문스러운 표정을 함께 짓습니다.',
    ],
  },
  {
    id: 'q18',
    cat: 'question',
    label: '다시',
    korean: '반복',
    english: 'Again',
    color: '#8b5cf6',
    params: {
      수형: 'fist+point2',
      수위: '몸 앞',
      수동: '검지+중지 펴고 대각선 위에서 아래 앞으로 베듯이 내리기',
    },
    steps: [
      '주먹을 쥔 상태에서 검지와 중지만 펴서 V형을 만듭니다.',
      '손을 대각선 위 뒤쪽에서 앞 아래쪽으로 칼로 베듯이 가볍게 내립니다.',
    ],
  },

  /* ─── 대답 ─── */
  {
    id: 'a19',
    cat: 'answer',
    label: '네',
    korean: '긍정',
    english: 'Yes',
    color: '#10b981',
    params: {
      수형: '고개 끄덕임',
      수동: '고개를 위아래로 한 번 끄덕이기',
    },
    steps: [
      '고개를 위아래로 한 번 끄덕입니다.',
    ],
  },
  {
    id: 'a26',
    cat: 'answer',
    label: '아니다',
    korean: '부정',
    english: 'No',
    color: '#10b981',
    params: {
      수형: 'open',
      수위: '몸 앞',
      수동: '손바닥이 밖을 보게 하여 좌우로 흔들기',
    },
    steps: [
      '손바닥이 밖을 향하게 세우고 좌우로 흔듭니다.',
    ],
  },

  /* ─── 시간 ─── */
  {
    id: 't20',
    cat: 'time',
    label: '어제',
    korean: '과거',
    english: 'Yesterday',
    color: '#3b82f6',
    params: {
      수형: 'point1',
      수위: '어깨',
      수동: '검지를 어깨 뒤쪽으로 넘기듯이 움직이기',
    },
    steps: [
      '검지를 펴서 어깨 뒤쪽 방향으로 움직입니다.',
    ],
  },
  {
    id: 't21',
    cat: 'time',
    label: '지금',
    korean: '현재',
    english: 'Now',
    color: '#3b82f6',
    params: {
      수형: 'thumbtwofinger (양손)',
      수위: '가슴 앞',
      수향: '손등이 위, 손끝이 밖으로',
      수동: '엄지·검지·중지를 펴고 두 손을 아래로 약간 내리기',
    },
    steps: [
      '양손의 엄지·검지·중지 세 손가락을 폅니다.',
      '손등이 위를, 손끝이 바깥(상대방 방향)을 향하게 합니다.',
      '두 손을 가슴 앞에서 아래로 약간 내립니다.',
    ],
  },
  {
    id: 't22',
    cat: 'time',
    label: '내일',
    korean: '미래',
    english: 'Tomorrow',
    color: '#3b82f6',
    params: {
      수형: 'point1',
      수위: '눈 옆',
      수동: '검지를 눈 옆에 댔다가 앞으로 내밀기',
    },
    steps: [
      '검지를 눈 옆에 댔다가 앞쪽으로 내밉니다.',
    ],
  },

  /* ─── 감정 ─── */
  {
    id: 'f23',
    cat: 'feeling',
    label: '좋다',
    korean: '좋음',
    english: 'Good',
    color: '#ec4899',
    params: {
      수형: 'fist',
      수위: '코',
      수동: '주먹의 엄지 쪽을 코에 가볍게 대기',
    },
    steps: [
      '오른 주먹의 엄지 부분을 코에 가볍게 갖다 댑니다.',
    ],
  },
  {
    id: 'f24',
    cat: 'feeling',
    label: '싫다',
    korean: '싫음·거부',
    english: 'Dislike',
    color: '#ec4899',
    params: {
      수형: 'lhand',
      수위: '턱',
      수동: '엄지·검지를 약간 구부려 끝을 턱에 댔다가 밖으로 살짝 흔들며 떼기',
      비수지: '찡그린 표정 또는 고개 젓기',
    },
    steps: [
      '오른손의 엄지와 검지를 펴서 약간 구부립니다.',
      '구부린 손가락 끝을 턱에 갖다 댑니다.',
      '손을 밖으로 살짝 흔들거나 떼며 거부·불만을 표현합니다.',
      '찡그린 표정이나 고개를 살짝 젓는 동작을 함께 합니다.',
    ],
    notes: '거부·거절·불만을 나타내는 표현입니다. 턱 접촉 후 흔들어 떼는 것이 핵심입니다.',
  },

  /* ─── 숫자 ─── */
  // ════════════════════════════════════════
  // KSL 수 체계 (한국수어 표준)
  //  1 = 검지만, 손등이 밖
  //  2 = 검지+중지 V형, 손등이 밖
  //  3 = 검지+중지+약지, 엄지·소지 접음, 손등이 밖
  //  4 = 검지+중지+약지+소지, 엄지만 접음, 손등이 밖
  //  5 = 다섯 손가락, 손바닥이 앞(상대방)
  //  6 = 엄지+검지 겹치기, 손등이 밖
  //  7 = 엄지+검지+중지 겹치기, 손등이 밖
  //  8 = 엄지+검지+중지+약지 겹치기, 손등이 밖
  //  9 = 다섯 손가락, 손등이 밖(상대방)
  // 10 = 양손 검지 X자 교차
  // ════════════════════════════════════════
  {
    id: 'n27', cat: 'number', label: '1', korean: '일', color: '#6366f1',
    params: { 수형: 'point1', 수위: '가슴 앞', 수동: '정지' },
    steps: ['검지만 위로 폅니다. 나머지는 접습니다.'],
  },
  {
    id: 'n28', cat: 'number', label: '2', korean: '이', color: '#6366f1',
    params: { 수형: 'point2', 수위: '가슴 앞', 수동: '정지' },
    steps: ['검지와 중지를 폅니다. 엄지·약지·소지는 접습니다.'],
    notes: '엄지를 펴지 않는 것이 포인트입니다.',
  },
  {
    id: 'n29', cat: 'number', label: '3', korean: '삼', color: '#6366f1',
    params: { 수형: 'threefinger', 수위: '가슴 앞', 수동: '정지' },
    steps: ['검지·중지·약지를 폅니다. 엄지와 소지는 접습니다.'],
  },
  {
    id: 'n30', cat: 'number', label: '4', korean: '사', color: '#6366f1',
    params: { 수형: 'fourfinger', 수위: '가슴 앞', 수동: '정지' },
    steps: ['검지·중지·약지·소지를 모두 폅니다. 엄지만 접습니다.'],
  },
  {
    id: 'n31', cat: 'number', label: '5', korean: '오', color: '#6366f1',
    params: { 수형: 'thumb', 수위: '가슴 앞', 수동: '정지' },
    steps: ['엄지만 위로 세웁니다. 나머지 손가락은 주먹 쥡니다.'],
  },
  {
    id: 'n32', cat: 'number', label: '6', korean: '육', color: '#6366f1',
    params: { 수형: 'sixhand', 수위: '가슴 앞', 수향: '손등이 밖(상대방)', 수동: '정지' },
    steps: ['엄지와 검지를 수직으로 폅니다.', '손등이 상대방을 향하게 합니다. 나머지는 접습니다.'],
  },
  {
    id: 'n33', cat: 'number', label: '7', korean: '칠', color: '#6366f1',
    params: { 수형: 'sevenhand', 수위: '가슴 앞', 수향: '손등이 밖(상대방)', 수동: '정지' },
    steps: ['엄지·검지·중지를 수직으로 폅니다.', '손등이 상대방을 향하게 합니다.'],
  },
  {
    id: 'n34', cat: 'number', label: '8', korean: '팔', color: '#6366f1',
    params: { 수형: 'eighthand', 수위: '가슴 앞', 수향: '손등이 밖(상대방)', 수동: '정지' },
    steps: ['엄지·검지·중지·약지를 수직으로 폅니다.', '손등이 상대방을 향하게 합니다. 소지는 접습니다.'],
  },
  {
    id: 'n35', cat: 'number', label: '9', korean: '구', color: '#6366f1',
    params: { 수형: 'ninehand', 수위: '가슴 앞', 수향: '손등이 밖(상대방)', 수동: '정지' },
    steps: ['다섯 손가락을 모두 수직으로 폅니다.', '손등이 상대방을 향하게 합니다.'],
  },
  {
    id: 'n36',
    cat: 'number',
    label: '10',
    korean: '십',
    color: '#6366f1',
    params: {
      수형: 'point1',        // new shape key
      수위: '가슴 앞',
      수향: '손등이 밖을 향함',
      수동: '검지 끝이 밖을 향하게 하여 좌우로 살짝 흔들기',
    },
    steps: [
      '오른손 주먹을 쥡니다.',
      '검지만 펴서 약간 구부립니다. 손가락 끝이 밖(상대방)을 향하게 합니다.',
      '손을 좌우로 살짝 흔듭니다.',
    ],
  },

  /* ─── 일상 ─── */
  {
    id: 'd37',
    cat: 'daily',
    label: '물',
    korean: '음용수',
    english: 'Water',
    color: '#3b82f6',
    params: {
      수형: 'flato',
      수위: '입 앞',
      수동: '손가락 끝을 모아 컵 모양을 만들고 입쪽으로 기울이기',
    },
    steps: [
      '손가락 끝을 모아 컵 모양을 만듭니다.',
      '컵을 마시는 동작처럼 입 쪽으로 기울입니다.',
    ],
  },

  /* ─── 신체 ─── */
  {
    id: 'b38',
    cat: 'body',
    label: '머리',
    korean: '신체-머리',
    english: 'Head',
    color: '#f97316',
    params: {
      수형: 'point1',
      수위: '머리',
      수동: '검지로 머리 부분을 가리키기',
    },
    steps: [
      '검지로 머리 부분을 가리킵니다.',
    ],
  },
  {
    id: 'b39',
    cat: 'body',
    label: '눈',
    korean: '신체-눈',
    english: 'Eyes',
    color: '#f97316',
    params: {
      수형: 'point1',
      수위: '눈 아래',
      수동: '검지로 눈 주변을 가리키기',
    },
    steps: [
      '검지로 눈 아래 또는 눈 주변을 가리킵니다.',
    ],
  },
]