import './DictPage.css'

const DICT = [
  { emoji: '👋', word: '안녕하세요',       en: 'Hello' },
  { emoji: '🙏', word: '감사합니다',       en: 'Thank you' },
  { emoji: '🆘', word: '도와주세요',       en: 'Help me' },
  { emoji: '🚻', word: '화장실 어디예요?',  en: 'Restroom?' },
  { emoji: '😊', word: '괜찮아요',         en: "I'm okay" },
  { emoji: '🍚', word: '밥 먹었어요?',     en: 'Did you eat?' },
  { emoji: '🏠', word: '집에 가요',        en: 'Going home' },
  { emoji: '😷', word: '아파요',           en: "I'm sick" },
]

export default function DictPage({ query = '' }) {
  const filtered = DICT.filter(d =>
    d.word.includes(query) || d.en.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="page">
      <div className="section-tag">수어 사전</div>
      <h2 className="section-title">자주 쓰는 수어 표현</h2>
      {query && (
        <p className="page-sub">"{query}" 검색 결과 — {filtered.length}개</p>
      )}

      <div className="dict-grid">
        {filtered.map(d => (
          <div className="dict-card" key={d.word}>
            <div className="dict-emoji">{d.emoji}</div>
            <div className="dict-word">{d.word}</div>
            <div className="dict-en">{d.en}</div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="dict-empty">검색 결과가 없습니다 😢</div>
        )}
      </div>
    </div>
  )
}