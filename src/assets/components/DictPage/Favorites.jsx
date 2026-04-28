import { useState } from 'react'
import { SIGNS, CATEGORIES } from '../Practice/signs'
import { HandIllustration } from '../Practice/SignLearnCard'

/* ═══════════════════════════════════════════
   TOOL 4 — 즐겨찾기 & 저장
   Usage: <Favorites />
═══════════════════════════════════════════ */

const safeSigns      = SIGNS      || []
const safeCategories = CATEGORIES || []

const DEFAULT_FAVS = new Set(['g01', 'g02', 'e01', 'e02', 'fd01'])

export default function Favorites() {
  const [favIds,    setFavIds]    = useState(DEFAULT_FAVS)
  const [catFilter, setCatFilter] = useState('all')
  const [search,    setSearch]    = useState('')
  const [note,      setNote]      = useState({})
  const [editId,    setEditId]    = useState(null)

  const favSigns = safeSigns.filter(s => favIds.has(s.id))
  const filtered = favSigns
    .filter(s => catFilter === 'all' || s.cat === catFilter)
    .filter(s => !search || s.label.includes(search))

  const toggleFav = (id) =>
    setFavIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const cats = ['all', ...new Set(favSigns.map(s => s.cat))]

  return (
    <div className="tool-panel">
      <div className="tool-header">
        <span className="tool-icon-lg">🔖</span>
        <div>
          <h3 className="tool-title">즐겨찾기 수어</h3>
          <p className="tool-desc">자주 쓰는 수어를 저장하고 메모를 남겨보세요</p>
        </div>
      </div>

      {/* 검색 + 카테고리 필터 */}
      <div className="fav-controls">
        <input
          className="fav-search"
          type="text"
          placeholder="🔍 수어 이름 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="fav-cats">
          {cats.map(c => {
            const cat = safeCategories.find(x => x.id === c)
            return (
              <button
                key={c}
                className={`fav-cat-btn ${catFilter === c ? 'active' : ''}`}
                onClick={() => setCatFilter(c)}
              >
                {c === 'all' ? '전체' : `${cat?.icon} ${cat?.label}`}
              </button>
            )
          })}
        </div>
      </div>

      {/* 즐겨찾기 카드 목록 */}
      {filtered.length === 0 ? (
        <div className="fav-empty">
          <div className="fav-empty-icon">🔖</div>
          <p>즐겨찾기한 수어가 없습니다.</p>
          <p className="fav-empty-sub">학습 모드에서 수어를 저장해보세요</p>
        </div>
      ) : (
        <div className="fav-grid">
          {filtered.map(s => (
            <div key={s.id} className="fav-card" style={{ '--fc': s.color }}>
              <div className="fav-card-top">
                <HandIllustration
                  shapeKey={s.params?.수형 || 'open'}
                  color={s.color}
                  size={44}
                />
                <div className="fav-card-info">
                  <div className="fav-card-label">{s.label}</div>
                  <div className="fav-card-cat">
                    {safeCategories.find(c => c.id === s.cat)?.icon}{' '}
                    {safeCategories.find(c => c.id === s.cat)?.label}
                  </div>
                </div>
                <button
                  className="fav-remove-btn"
                  onClick={() => toggleFav(s.id)}
                  title="즐겨찾기 해제"
                >
                  ✕
                </button>
              </div>

              <div className="fav-card-move">{s.params?.수동}</div>

              {/* 메모 편집 */}
              {editId === s.id ? (
                <div className="fav-note-edit">
                  <textarea
                    className="fav-note-input"
                    placeholder="메모를 입력하세요..."
                    value={note[s.id] || ''}
                    onChange={e => setNote(n => ({ ...n, [s.id]: e.target.value }))}
                    rows={2}
                  />
                  <button className="fav-note-save" onClick={() => setEditId(null)}>저장</button>
                </div>
              ) : (
                <div className="fav-note-row" onClick={() => setEditId(s.id)}>
                  {note[s.id]
                    ? <span className="fav-note-text">{note[s.id]}</span>
                    : <span className="fav-note-placeholder">+ 메모 추가</span>
                  }
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 추가 섹션 */}
      <div className="fav-add-section">
        <div className="fav-add-title">➕ 수어 추가하기</div>
        <div className="fav-add-grid">
          {safeSigns
            .filter(s => !favIds.has(s.id))
            .filter(s => catFilter === 'all' || s.cat === catFilter)
            .slice(0, 8)
            .map(s => (
              <button
                key={s.id}
                className="fav-add-btn"
                style={{ '--fc': s.color }}
                onClick={() => toggleFav(s.id)}
              >
                + {s.label}
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}