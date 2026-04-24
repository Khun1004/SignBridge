// ══════════════════════════════════════════════════════════════
//  API 호출 함수 (수정: 문장 분해 + 단어별 고유 포즈 매핑)
// ══════════════════════════════════════════════════════════════
import { translateApi } from '../../../assets/components/api/api.jsx'
import { fixAnim } from './utils.js'

// ── 로컬 수어 사전 ───────────────────────────────────────────
// 각 단어별 고유한 animType 명확히 분리
const LOCAL_SIGN_DICT = [

    // ══ 인사 ══════════════════════════════════════════════════
    {
        keys: ['안녕하세요', '안녕'],
        word: '안녕하세요',
        animType: 'hello',
        handShape: '손 펼침',
        movement: '손바닥을 보이며 좌우로 흔든다',
        description: '오른손을 들어 손바닥을 정면으로 보이고 손목을 좌우로 가볍게 흔드세요. 한국 수어의 기본 인사 동작입니다.',
    },
    {
        keys: ['고마워요', '고맙습니다', '감사합니다', '감사'],
        word: '고맙습니다',
        animType: 'thanks', // 이 값이 Constants.js의 A2P 키와 일치해야 함
        handShape: '양손 사용',
        movement: '왼손 등 위를 오른손 날로 탭한다',
        description: '왼손을 가슴 앞에 눕히고 오른손 날로 두 번 치세요.',
    },
    {
        keys: ['처음 뵙겠습니다', '처음 뵙겠어요'],
        word: '처음 뵙겠습니다',
        animType: 'wave',
        handShape: '손 펼침',
        movement: '손바닥을 보이며 좌우로 흔든다',
        description: '오른손을 들어 손바닥을 보이며 흔들어 처음 인사를 하세요.',
    },
    {
        keys: ['반갑습니다', '반가워요', '만나서 반갑습니다', '만나서 반가워요', '만나서 반가'],
        word: '반갑습니다',
        animType: 'peace',
        handShape: '검지·중지 V',
        movement: '검지와 중지를 V자로 펴고 앞으로 내민다',
        description: '오른손 검지와 중지를 V자로 펴서 앞으로 내밀어 반가움을 표현하세요.',
    },
    {
        keys: ['만나서', '처음 만나', '만나뵙게 되어'],
        word: '만나서',
        animType: 'peace',
        handShape: '검지·중지 V',
        movement: '검지와 중지를 V자로 펴고 앞으로 내민다',
        description: '오른손 검지와 중지를 V자로 펴서 앞으로 내밀어 "만남"을 표현하세요.',
    },

    // ══ 긍정 / 괜찮음 ════════════════════════════════════════
    {
        keys: ['괜찮아요', '괜찮습니다', '괜찮아', '문제없어요', '이상없어요'],
        word: '괜찮아요',
        animType: 'ok',
        handShape: '엄지·검지 원 (OK)',
        movement: '엄지와 검지 끝을 붙여 원을 만들고 가볍게 흔든다',
        description: '오른손 엄지와 검지 끝을 붙여 O자 모양을 만드세요. 나머지 손가락은 위로 펴면 됩니다.',
    },
    {
        keys: ['좋아요', '좋습니다', '좋아', '좋네요', '최고예요'],
        word: '좋아요',
        animType: 'thumbUp',
        handShape: '엄지 위로',
        movement: '주먹을 쥐고 엄지만 위로 세운다',
        description: '오른손으로 주먹을 쥐고 엄지손가락만 위로 세우세요. "좋다/찬성"을 뜻합니다.',
    },
    {
        keys: ['감사합니다', '고맙습니다', '감사해요', '고마워요', '감사드립니다'],
        word: '감사합니다',
        animType: 'thumbUp',
        handShape: '엄지 위로',
        movement: '엄지를 위로 세우고 앞으로 살짝 내민다',
        description: '오른손 엄지를 위로 세우고 상대방 쪽으로 살짝 내밀어 감사를 표현하세요.',
    },
    {
        keys: ['네', '예', '그렇습니다', '알겠습니다', '알겠어요', '물론이죠', '맞습니다'],
        word: '네',
        animType: 'thumbUp',
        handShape: '엄지 위로',
        movement: '엄지를 위로 세운다',
        description: '오른손 엄지를 위로 세우세요. 동의/긍정을 표현합니다.',
    },

    // ══ 부정 ═════════════════════════════════════════════════
    {
        keys: ['아니요', '아니오', '아닙니다', '아니에요', '아니야', '틀렸어요'],
        word: '아니요',
        animType: 'thumbDown',
        handShape: '엄지 아래로',
        movement: '주먹 쥐고 엄지만 아래로 내린다',
        description: '오른손으로 주먹을 쥐고 엄지손가락만 아래로 내리세요. "아니다/반대"를 뜻합니다.',
    },
    {
        keys: ['싫어요', '싫습니다', '싫어'],
        word: '싫어요',
        animType: 'thumbDown',
        handShape: '엄지 아래로',
        movement: '엄지를 아래로 내린다',
        description: '오른손 엄지를 아래로 내리세요. 거부/반대를 표현합니다.',
    },
    {
        keys: ['금지', '안됩니다', '안 됩니다', '안돼요', '안 돼요', '불가'],
        word: '안 됩니다',
        animType: 'cross',
        handShape: '양팔 X자 교차',
        movement: '양팔을 앞에서 X자로 교차한다',
        description: '양팔을 앞에서 X자로 교차하세요. 강하게 "불가/금지"를 표현합니다.',
    },

    // ══ 확인 / 동의 ══════════════════════════════════════════
    {
        keys: ['확인합니다', '확인해요', '확인'],
        word: '확인',
        animType: 'ok',
        handShape: '엄지·검지 원',
        movement: '엄지와 검지 끝을 붙인다',
        description: '엄지와 검지 끝을 붙여 OK 모양을 만드세요. 확인/이해를 표현합니다.',
    },
    {
        keys: ['맞아요', '정확해요', '맞습니다', '옳습니다'],
        word: '맞아요',
        animType: 'peace',
        handShape: '검지·중지 V',
        movement: '검지와 중지를 V자로 편다',
        description: '오른손 검지와 중지를 V자로 펼치세요. "맞다/정확하다"를 표현합니다.',
    },

    // ══ 가리키기 / 안내 ══════════════════════════════════════
    {
        keys: ['이름', '성함', '성명'],
        word: '이름',
        animType: 'point',
        handShape: '검지 펴기',
        movement: '오른손 검지로 앞을 가리킨다',
        description: '오른손 검지를 펴서 앞을 가리키세요. 이름/신원을 묻는 표현입니다.',
    },
    {
        keys: ['어디예요', '어디입니까', '어디에', '어디'],
        word: '어디',
        animType: 'point',
        handShape: '검지 펴기',
        movement: '검지로 주위를 가리키며 돌린다',
        description: '오른손 검지를 펴서 주위를 돌리며 장소를 묻는 표현을 하세요.',
    },
    {
        keys: ['위치', '장소'],
        word: '위치',
        animType: 'point',
        handShape: '검지 펴기',
        movement: '검지로 해당 방향을 가리킨다',
        description: '오른손 검지를 펴서 위치를 표시하세요.',
    },
    {
        keys: ['여기', '저기', '이쪽', '저쪽'],
        word: '여기',
        animType: 'point',
        handShape: '검지 펴기',
        movement: '검지로 해당 방향을 가리킨다',
        description: '오른손 검지를 펴서 원하는 방향을 가리키세요.',
    },

    // ══ 멈춤 / 기다림 ════════════════════════════════════════
    {
        keys: ['잠깐만요', '잠시만요', '잠깐', '잠시', '기다려 주세요', '기다려주세요'],
        word: '잠깐만요',
        animType: 'stop',
        handShape: '손바닥 앞으로',
        movement: '오른손 손바닥 전체를 정면으로 내민다',
        description: '오른손 손바닥 전체를 앞으로 내밀어 STOP 자세를 취하세요. "잠깐/기다려"를 표현합니다.',
    },

    // ══ 연락 ═════════════════════════════════════════════════
    {
        keys: ['전화해요', '전화번호', '전화', '연락주세요', '연락해주세요', '연락'],
        word: '전화해요',
        animType: 'call',
        handShape: '엄지·새끼 펴기',
        movement: '엄지와 새끼손가락만 펴고 귀에 댄다',
        description: '엄지와 새끼손가락만 펴서 귀에 대는 전화 손 모양을 만드세요.',
    },

    // ══ 감정 / 관계 ══════════════════════════════════════════
    {
        keys: ['사랑해요', '사랑합니다', '좋아해요', '좋아합니다', '사랑'],
        word: '사랑해요',
        animType: 'love',
        handShape: 'ILY (엄지·검지·새끼)',
        movement: '엄지·검지·새끼손가락을 편다',
        description: '엄지, 검지, 새끼손가락을 펴서 ILY(I Love You) 손 모양을 만드세요.',
    },

    // ══ 사과 ═════════════════════════════════════════════════
    {
        keys: ['미안합니다', '미안해요', '죄송합니다', '죄송해요', '사과드립니다'],
        word: '미안합니다',
        animType: 'fist',
        handShape: '주먹',
        movement: '주먹을 가슴 앞에서 원을 그린다',
        description: '오른손 주먹을 가슴 앞에 대고 원을 그리세요. 사과/미안함을 표현합니다.',
    },

    // ══ 긍정 감정 ════════════════════════════════════════════
    {
        keys: ['좋아합니다', '좋아해요', '좋아합니다'],
        word: '좋아합니다',
        animType: 'thumbUp',
        handShape: '엄지 위로',
        movement: '엄지를 세우고 위아래로 끄덕인다',
        description: '오른손 엄지를 세우고 위아래로 가볍게 끄덕이세요. 좋아함을 표현합니다.',
    },
    {
        keys: ['힘내요', '파이팅', '화이팅', '힘내세요', '응원해요'],
        word: '힘내요',
        animType: 'fist',
        handShape: '주먹',
        movement: '손을 꽉 쥐어 주먹을 앞으로 내민다',
        description: '손을 꽉 쥐어 주먹을 만들고 앞으로 내미세요. 힘내라는 응원을 표현합니다.',
    },

    // ══ 천천히 / 반복 ════════════════════════════════════════
    {
        keys: ['천천히', '느리게', '다시 한번', '다시', '반복'],
        word: '천천히',
        animType: 'flat',
        handShape: '손 수평',
        movement: '손을 수평으로 천천히 앞으로 민다',
        description: '손을 수평으로 펼쳐 천천히 앞으로 미는 동작을 하세요. "천천히/반복"을 표현합니다.',
    },

    // ══ 도움 ═════════════════════════════════════════════════
    {
        keys: ['도와주세요', '도움 요청', '부탁드립니다', '부탁해요', '도움'],
        word: '도와주세요',
        animType: 'open',
        handShape: '손 펼침',
        movement: '양손을 펼쳐 앞으로 내민다',
        description: '양손을 펼쳐 앞으로 내밀며 도움을 요청하세요.',
    },

    // ══ 모름 / 불확실 ════════════════════════════════════════
    {
        keys: ['모르겠어요', '모르겠습니다', '잘 모르겠어요', '모르겠어', '불확실'],
        word: '모르겠어요',
        animType: 'cup',
        handShape: '손 오목하게',
        movement: '손을 오목하게 오므리며 어깨를 살짝 올린다',
        description: '손을 오목하게 오므리며 어깨를 살짝 올리세요. "모르겠다"는 표현입니다.',
    },

    // ══ 숫자 / 번호 ══════════════════════════════════════════
    {
        keys: ['번호', '숫자', '몇 번', '몇번'],
        word: '숫자',
        animType: 'number',
        handShape: '검지 들기',
        movement: '검지만 세워 숫자를 나타낸다',
        description: '검지만 세워 숫자를 나타내세요.',
    },

    // ══ 선택 / 집기 ══════════════════════════════════════════
    {
        keys: ['선택해주세요', '선택하세요', '골라', '선택'],
        word: '선택',
        animType: 'pinch',
        handShape: '엄지·검지 집기',
        movement: '엄지와 검지로 집는 동작',
        description: '엄지와 검지를 모아 집는 듯한 동작을 하세요.',
    },

    // ══ 비자/서류 관련 (출입국 컨텍스트) ════════════════════
    {
        keys: ['여권', '신분증', '비자', '서류'],
        word: '여권',
        animType: 'point',
        handShape: '검지 펴기',
        movement: '검지로 앞을 가리킨다',
        description: '오른손 검지를 펴서 앞을 가리키세요. 서류/여권을 요청하는 표현입니다.',
    },
]

// ── 문장을 어절/단어 단위로 분리하여 각 부분에 사전 매칭 ────────
// 핵심 개선: 문장 전체 매칭 + 어절별 매칭을 함께 사용
function buildLocalGuide(text) {
    const lower = text.toLowerCase().trim()
    const matched = []
    const usedEntryIndices = new Set() // 이미 사용한 사전 항목 인덱스

    // ─ Step 1: 문장 전체에서 가장 긴 키 순으로 매칭 ─────────────
    // "만나서 반갑습니다" 같은 복합 표현 우선 처리
    const sortedDict = LOCAL_SIGN_DICT.map((entry, idx) => ({ entry, idx }))
        .sort((a, b) => {
            // 가장 긴 키를 가진 항목을 우선 (더 구체적인 표현 우선)
            const maxA = Math.max(...a.entry.keys.map(k => k.length))
            const maxB = Math.max(...b.entry.keys.map(k => k.length))
            return maxB - maxA
        })

    // ─ Step 2: 문자열 내 출현 위치 기준으로 매칭 후 정렬 ─────────
    const posMatches = [] // { position, entryIdx, word, animType, ... }

    for (const { entry, idx } of sortedDict) {
        for (const key of entry.keys) {
            const pos = lower.indexOf(key.toLowerCase())
            if (pos !== -1) {
                // 이미 같은 위치 근처에 더 긴 키로 매칭된 게 있으면 스킵
                const overlaps = posMatches.some(m =>
                    Math.abs(m.position - pos) < key.length && m.entryIdx !== idx
                )
                if (!overlaps && !usedEntryIndices.has(idx)) {
                    posMatches.push({
                        position: pos,
                        entryIdx: idx,
                        word:        entry.word,
                        animType:    entry.animType,
                        handShape:   entry.handShape,
                        movement:    entry.movement,
                        description: entry.description,
                    })
                    usedEntryIndices.add(idx)
                    break // 해당 entry의 첫 번째 매칭 키만 사용
                }
            }
        }
    }

    // ─ Step 3: 출현 위치 순으로 정렬 (문장 순서 = 동작 순서) ─────
    posMatches.sort((a, b) => a.position - b.position)

    for (const m of posMatches) {
        matched.push({
            word:        m.word,
            animType:    m.animType,
            handShape:   m.handShape,
            movement:    m.movement,
            description: m.description,
        })
    }

    // ─ Step 4: 아무것도 매칭되지 않으면 기본 wave ────────────────
    if (!matched.length) {
        matched.push({
            word:        text.slice(0, 15) || '인사',
            animType:    'hello',
            handShape:   '손 펼침',
            movement:    '손을 들어 흔든다',
            description: '오른손을 들어 손바닥을 보이며 흔드세요.',
        })
    }

    return {
        summary: `"${text}" 수어 표현 방법`,
        steps: matched,
    }
}

// ── 로컬 결과가 충분한지 판단 ────────────────────────────────
// "wave만 한 개"이고 원문에 '안녕'이 없을 때만 API 시도
function isLocalInsufficient(guide, originalText) {
    // 1. 가이드에 단계가 아예 없으면 부족한 것으로 판단
    if (!guide || !guide.steps || guide.steps.length === 0) return true;

    // 2. 결과가 1개뿐인데, 그게 'hello'이고 원문에 인사 관련 단어가 없을 때
    // (즉, 아무것도 못 찾아서 기본값으로 팅겨져 나왔을 때를 체크)
    if (guide.steps.length === 1 &&
        guide.steps[0].animType === 'hello' && // ✅ wave에서 hello로 변경
        !originalText.includes('안녕') &&
        !originalText.includes('인사')) {
        return true;
    }

    return false;
}

// ── 공개 API ─────────────────────────────────────────────────

/** 수어 토큰 배열 → 자연어 문장 생성
 *  /api/subtitle 엔드포인트가 없으므로 로컬에서 처리
 *  단어들을 자연스럽게 연결해서 반환
 */
export async function buildSubtitle(words, place = 'immigration', prevSentence = '') {
    if (!words?.length) return null
    try {
        // 서버 호출 대신 로컬에서 단어 연결
        const clean = words.map(w => w.replace(/\p{Emoji}/gu, '').trim()).filter(Boolean)
        if (!clean.length) return null
        // 중복 단어 제거 후 연결
        const deduped = clean.filter((w, i) => clean.indexOf(w) === i)
        return deduped.join(' ')
    } catch {
        return words.join(' ')
    }
}

/**
 * 텍스트 → 수어 가이드 (steps 포함)
 *
 * 개선 사항:
 *  1) 로컬 사전 매칭을 "문장 내 출현 위치" 기준으로 정렬 → 문장 순서대로 동작
 *  2) 동일 문장이라도 입력 텍스트가 다르면 다른 단어 매칭 → 다른 동작
 *  3) 로컬 결과가 불충분할 때만 API 호출 (비용 절감)
 *  4) API 응답 animType 검증 강화
 */
export async function fetchSignGuide(text) {
    if (!text?.trim()) return null

    // 1) 로컬 사전 우선 시도
    const localGuide = buildLocalGuide(text)

    // 2) 로컬 결과가 충분하면 바로 반환
    if (!isLocalInsufficient(localGuide, text)) {
        return localGuide
    }

    // 3) 로컬 매칭 불충분 → API 호출
    try {
        const data = await translateApi.getSignGuide(text)
        if (!data?.steps?.length) throw new Error('no steps')
        // API 응답의 animType 검증 + 보정
        data.steps = data.steps.map(fixAnim)
        return data
    } catch {
        // 4) API 실패 → 로컬 fallback
        return localGuide
    }
}