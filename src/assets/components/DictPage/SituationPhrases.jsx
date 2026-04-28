import { useState } from 'react'
import { HandIllustration } from '../Practice/SignLearnCard'

/* ═══════════════════════════════════════════
   TOOL 3 — 상황별 수어 모음
   Usage: <SituationPhrases />
   Note: each phrase's `ksl` is an array of { word, shape } objects
═══════════════════════════════════════════ */

export const SITUATIONS = [
  {
    id: 'hospital', label: '병원', icon: '🏥', color: '#ef4444',
    phrases: [
      { kr: '아프다',           ksl: [{ word: '나', shape: 'point1' }, { word: '몸', shape: 'open' }, { word: '아프다', shape: 'fist' }],                         tip: '표정: 찡그리기' },
      { kr: '도와주세요',       ksl: [{ word: '도움', shape: 'open' }, { word: '요청', shape: 'bhand' }],                                                          tip: '눈썹 올리기 필수' },
      { kr: '약 주세요',        ksl: [{ word: '약', shape: 'flato' }, { word: '달라', shape: 'open' }],                                                            tip: '손바닥 위로 내밀기' },
      { kr: '어디가 아프세요?', ksl: [{ word: '어디', shape: 'point1' }, { word: '아프다', shape: 'fist' }, { word: '질문', shape: 'point2' }],                    tip: '의문 표정 유지' },
      { kr: '빨리 와 주세요',   ksl: [{ word: '빨리', shape: 'open' }, { word: '오다', shape: 'bhand' }, { word: '부탁', shape: 'fist' }],                         tip: '빠른 동작으로 긴박감 표현' },
    ],
  },
  {
    id: 'restaurant', label: '식당', icon: '🍽️', color: '#f59e0b',
    phrases: [
      { kr: '메뉴 주세요',    ksl: [{ word: '메뉴', shape: 'bhand' }, { word: '달라', shape: 'open' }],                                                            tip: '손바닥을 위로' },
      { kr: '맛있다',         ksl: [{ word: '맛', shape: 'flato' }, { word: '좋다', shape: 'thumb' }],                                                             tip: '표정으로 강조' },
      { kr: '물 주세요',      ksl: [{ word: '물', shape: 'point1' }, { word: '달라', shape: 'open' }],                                                             tip: '마시는 동작 후 달라' },
      { kr: '계산해 주세요',  ksl: [{ word: '계산', shape: 'point2' }, { word: '부탁', shape: 'fist' }],                                                           tip: '두 손으로 교차 동작' },
      { kr: '주문할게요',     ksl: [{ word: '주문', shape: 'point1' }, { word: '하다', shape: 'bhand' }],                                                          tip: '손가락 하나 세우기' },
    ],
  },
  {
    id: 'transport', label: '교통', icon: '🚌', color: '#3b82f6',
    phrases: [
      { kr: '어디로 가세요?',  ksl: [{ word: '어디', shape: 'point1' }, { word: '가다', shape: 'bhand' }, { word: '질문', shape: 'point2' }],                      tip: '눈썹 올리기' },
      { kr: '버스 정류장',     ksl: [{ word: '버스', shape: 'bhand' }, { word: '정류장', shape: 'point1' }],                                                       tip: '버스 모양 수형' },
      { kr: '길을 잃었어요',   ksl: [{ word: '나', shape: 'point1' }, { word: '길', shape: 'bhand' }, { word: '잃다', shape: 'open' }],                            tip: '당황한 표정' },
      { kr: '지하철역',        ksl: [{ word: '지하철', shape: 'point2' }, { word: '역', shape: 'bhand' }],                                                         tip: '손으로 땅 아래 가리키기' },
      { kr: '얼마나 걸려요?',  ksl: [{ word: '시간', shape: 'point1' }, { word: '얼마', shape: 'open' }, { word: '질문', shape: 'point2' }],                       tip: '손목 시계 가리키기' },
    ],
  },
  {
    id: 'school', label: '학교', icon: '🏫', color: '#8b5cf6',
    phrases: [
      { kr: '모르겠어요',          ksl: [{ word: '나', shape: 'point1' }, { word: '모르다', shape: 'open' }],                                                      tip: '고개 좌우로 흔들기' },
      { kr: '다시 설명해 주세요',  ksl: [{ word: '다시', shape: 'point2' }, { word: '설명', shape: 'bhand' }, { word: '부탁', shape: 'fist' }],                    tip: '손을 크게 원형으로' },
      { kr: '이해했어요',          ksl: [{ word: '이해', shape: 'open' }, { word: '완료', shape: 'thumb' }],                                                       tip: '고개 끄덕이기' },
      { kr: '질문 있어요',         ksl: [{ word: '나', shape: 'point1' }, { word: '질문', shape: 'point2' }, { word: '있다', shape: 'fist' }],                     tip: '손 들기 후 질문 수어' },
      { kr: '도움이 필요해요',     ksl: [{ word: '나', shape: 'point1' }, { word: '도움', shape: 'open' }, { word: '필요', shape: 'bhand' }],                      tip: '눈썹 올리며 요청' },
    ],
  },
  {
    id: 'shopping', label: '쇼핑', icon: '🛍️', color: '#10b981',
    phrases: [
      { kr: '얼마예요?',      ksl: [{ word: '가격', shape: 'flato' }, { word: '얼마', shape: 'open' }, { word: '질문', shape: 'point2' }],                         tip: '눈썹 올리기' },
      { kr: '이거 주세요',    ksl: [{ word: '이것', shape: 'point1' }, { word: '달라', shape: 'open' }],                                                           tip: '물건 가리키기 후' },
      { kr: '너무 비싸요',    ksl: [{ word: '가격', shape: 'flato' }, { word: '높다', shape: 'open' }, { word: '너무', shape: 'thumb' }],                          tip: '표정으로 강조' },
      { kr: '할인 되나요?',   ksl: [{ word: '할인', shape: 'bhand' }, { word: '가능', shape: 'thumb' }, { word: '질문', shape: 'point2' }],                        tip: '의문 표정' },
      { kr: '환불해 주세요',  ksl: [{ word: '환불', shape: 'bhand' }, { word: '부탁', shape: 'fist' }],                                                            tip: '물건 돌려주는 동작' },
    ],
  },
]

export default function SituationPhrases() {
  const [sitId,   setSitId]   = useState('hospital')
  const [openIdx, setOpenIdx] = useState(null)
  const sit = SITUATIONS.find(s => s.id === sitId)

  return (
    <div className="tool-panel">
      <div className="tool-header">
        <span className="tool-icon-lg">📍</span>
        <div>
          <h3 className="tool-title">상황별 수어 모음</h3>
          <p className="tool-desc">병원·식당·교통 등 실생활 필수 표현</p>
        </div>
      </div>

      {/* 상황 탭 */}
      <div className="sit-tabs">
        {SITUATIONS.map(s => (
          <button
            key={s.id}
            className={`sit-tab ${sitId === s.id ? 'active' : ''}`}
            style={{ '--sc': s.color }}
            onClick={() => { setSitId(s.id); setOpenIdx(null) }}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* 표현 아코디언 */}
      <div className="sit-phrases">
        {sit?.phrases.map((p, i) => (
          <div
            key={i}
            className={`sit-phrase ${openIdx === i ? 'open' : ''}`}
            style={{ '--sc': sit.color }}
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
          >
            <div className="sit-phrase-top">
              <span className="sit-kr">{p.kr}</span>
              <span className="sit-arrow">{openIdx === i ? '▲' : '▼'}</span>
            </div>

            {openIdx === i && (
              <div className="sit-phrase-detail">
                {/* 손 제스처 시각화 */}
                <div className="sit-gesture-row">
                  {p.ksl.map((item, j) => (
                    <div key={j} className="sit-gesture-item">
                      <div className="sit-gesture-hand">
                        <HandIllustration shapeKey={item.shape} color={sit.color} size={72} />
                      </div>
                      <div className="sit-gesture-word">{item.word}</div>
                      {j < p.ksl.length - 1 && (
                        <div className="sit-gesture-arrow">→</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="sit-tip">💡 {p.tip}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}