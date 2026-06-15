import './Noti.css'

const CATEGORY_COLORS = {
    system:    '#7c6fff',
    update:    '#10b981',
    community: '#3b82f6',
    translate: '#f59e0b',
}
const CATEGORY_LABELS = {
    system:    '시스템',
    update:    '업데이트',
    community: '커뮤니티',
    translate: '번역',
}

export default function NotiPage({ notifications, setNotifications, onBack }) {
    const markRead = (id) =>
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))

    const markAll = () =>
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })))

    const remove = (id, e) => {
        e.stopPropagation()
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    const unreadCount = notifications.filter(n => n.unread).length

    return (
        <div className="np-page" onClick={onBack}>
            <div className="np-card-wrap" onClick={e => e.stopPropagation()}>
                {/* ── 상단 바 ── */}
                <div className="np-topbar">
                    <button className="np-back" onClick={onBack}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6"/>
                        </svg>
                        뒤로
                    </button>
                    <div className="np-topbar-center">
                        <span className="np-title">알림</span>
                        {unreadCount > 0 && <span className="np-unread-pill">{unreadCount}</span>}
                    </div>
                    {unreadCount > 0 && (
                        <button className="np-mark-all" onClick={markAll}>모두 읽음</button>
                    )}
                </div>

                {/* ── 본문 ── */}
                <div className="np-body">
                    {notifications.length === 0 ? (
                        <div className="np-empty">
                            <div className="np-empty-icon">🔔</div>
                            <div className="np-empty-title">알림이 없습니다</div>
                            <div className="np-empty-sub">새로운 알림이 오면 여기에 표시됩니다.</div>
                        </div>
                    ) : notifications.map(n => {
                        const color = CATEGORY_COLORS[n.category ?? 'system'] ?? '#7c6fff'
                        const label = CATEGORY_LABELS[n.category ?? 'system'] ?? '시스템'
                        return (
                            <div
                                key={n.id}
                                className={`np-item ${n.unread ? 'np-item-unread' : ''}`}
                                style={n.unread ? { borderLeft: `4px solid ${color}` } : {}}
                                onClick={() => markRead(n.id)}
                            >
                                <div className="np-item-icon" style={{ background: color + '22' }}>
                                    <span>{n.icon}</span>
                                </div>
                                <div className="np-item-body">
                                    <div className="np-item-top">
                                        <span className="np-cat" style={{ background: color + '22', color }}>{label}</span>
                                        <span className="np-time">{n.time}</span>
                                    </div>
                                    <div className={`np-text ${n.unread ? 'np-text-bold' : ''}`}>{n.text}</div>
                                </div>
                                <button className="np-remove" onClick={e => remove(n.id, e)} title="삭제">✕</button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}