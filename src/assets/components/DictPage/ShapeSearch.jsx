import { useState } from 'react'
import { SIGNS, CATEGORIES } from '../Practice/signs'
import { HandIllustration } from '../Practice/SignLearnCard'

/* ═══════════════════════════════════════════
   TOOL 2 — 수형 검색 사전
   Usage: <ShapeSearch />
═══════════════════════════════════════════ */

const safeSigns      = SIGNS      || []
const safeCategories = CATEGORIES || []

export const SHAPE_OPTIONS = [
  { key: 'point1', label: '검지 (1형)' },
  { key: 'point2', label: 'V형 (2형)'  },
  { key: 'whand',  label: 'W형 (3형)'  },
  { key: 'bhand',  label: 'B형 (편손)' },
  { key: 'open',   label: '편손 (5형)' },
  { key: 'fist',   label: '주먹 (S형)' },
  { key: 'thumb',  label: '엄지 (A형)' },
  { key: 'flato',  label: 'F형 (집기)' },
  { key: 'chand',  label: 'C형 (구형)' },
  { key: 'yhand',  label: 'Y형'        },
]

export default function ShapeSearch() {
  const [selected, setSelected] = useState(null)

  const matches  = selected ? safeSigns.filter(s => s.params?.수형 === selected) : []
  const catLabel = (catId) => safeCategories.find(c => c.id === catId)?.label || catId

  return (
    <div className="tool-panel">
      <div className="tool-header">
        <span className="tool-icon-lg">🖐</span>
        <div>
          <h3 className="tool-title">수형으로 검색</h3>
          <p className="tool-desc">손 모양을 선택하면 해당 수어를 모두 찾아줍니다</p>
        </div>
      </div>

      {/* 수형 선택 그리드 */}
      <div className="ss-shape-grid">
        {SHAPE_OPTIONS.map(s => (
          <button
            key={s.key}
            className={`ss-shape-btn ${selected === s.key ? 'active' : ''}`}
            onClick={() => setSelected(prev => prev === s.key ? null : s.key)}
          >
            <HandIllustration
              shapeKey={s.key}
              color={selected === s.key ? '#fff' : '#7c6fff'}
              size={48}
            />
            <span className="ss-shape-label">{s.label}</span>
          </button>
        ))}
      </div>

      {/* 결과 목록 */}
      {selected && (
        <div className="ss-results">
          <div className="ss-results-title">
            <span className="ss-results-count">{matches.length}개</span> 수어 발견
          </div>
          {matches.length === 0 ? (
            <div className="ss-empty">이 수형을 쓰는 수어가 데이터베이스에 없습니다.</div>
          ) : (
            <div className="ss-cards">
              {matches.map(sign => (
                <div key={sign.id} className="ss-card" style={{ '--sc': sign.color }}>
                  <div className="ss-card-left">
                    <HandIllustration
                      shapeKey={sign.params?.수형 || 'open'}
                      color={sign.color}
                      size={52}
                    />
                  </div>
                  <div className="ss-card-right">
                    <div className="ss-card-label">{sign.label}</div>
                    <div className="ss-card-cat">{catLabel(sign.cat)}</div>
                    <div className="ss-card-move">{sign.params?.수동}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 빈 상태 */}
      {!selected && (
        <div className="ss-placeholder">
          <div className="ss-ph-icon">☝️</div>
          <p>위에서 손 모양을 선택하세요</p>
        </div>
      )}
    </div>
  )
}