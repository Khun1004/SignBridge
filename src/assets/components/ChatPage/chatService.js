import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

const DEFAULT_BASE_URL = 'http://localhost:8080'

class ChatService {
  constructor() {
    this.client       = null
    this.connected    = false
    this.pendingQueue = []
    this._globalListeners = []   // ← 전역 메시지 리스너 목록
  }

  connect(baseUrl = DEFAULT_BASE_URL) {
    if (this.connected) return

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${baseUrl}/ws-chat`),
      reconnectDelay: 3000,

      onConnect: () => {
        console.log('[ChatService] Connected')
        this.connected = true
        this.pendingQueue.forEach(fn => fn())
        this.pendingQueue = []
      },

      onDisconnect: () => {
        console.log('[ChatService] Disconnected')
        this.connected = false
      },

      onStompError: (frame) => {
        console.error('[ChatService] STOMP error', frame)
      },
    })

    this.client.activate()
  }

  disconnect() {
    this.client?.deactivate()
    this.connected = false
  }

  // ── 방 구독 (기존) ──
  subscribeToRoom(roomId, onMessage) {
    if (!this.client) {
      console.warn('[ChatService] Not connected yet')
      return () => {}
    }

    const subscription = this.client.subscribe(
        `/topic/room/${roomId}`,
        (stompMsg) => {
          const msg = JSON.parse(stompMsg.body)
          // 방 구독 콜백
          onMessage(msg)
          // 전역 리스너에도 알림 ← 추가
          this._globalListeners.forEach(fn => fn(msg))
        }
    )

    return () => subscription.unsubscribe()
  }

  // ── 전역 메시지 리스너 등록/해제 ──
  // App.jsx에서 채팅창 닫혔을 때 새 메시지 감지용
  onMessage(callback) {
    this._globalListeners.push(callback)
    // 해제 함수 반환
    return () => {
      this._globalListeners = this._globalListeners.filter(fn => fn !== callback)
    }
  }

  // ── 메시지 전송 ──
  sendMessage(payload) {
    this._publish('/app/chat.send', payload)
  }

  editMessage(id, roomId, newText) {
    this._publish('/app/chat.edit', { id, roomId, text: newText, type: 'EDIT' })
  }

  deleteMessage(id, roomId) {
    this._publish('/app/chat.delete', { id, roomId, type: 'DELETE' })
  }

  _publish(destination, body) {
    const send = () => {
      this.client.publish({
        destination,
        body: JSON.stringify(body),
      })
    }

    if (this.connected) {
      send()
    } else {
      this.pendingQueue.push(send)
    }
  }

  // ── REST helpers ──
  async getRooms(email, baseUrl = DEFAULT_BASE_URL) {
    const res = await fetch(`${baseUrl}/api/chat/rooms?email=${encodeURIComponent(email)}`)
    if (!res.ok) throw new Error('Failed to load rooms')
    return res.json()
  }

  async getMessages(roomId, baseUrl = DEFAULT_BASE_URL) {
    const res = await fetch(`${baseUrl}/api/chat/rooms/${roomId}/messages`)
    if (!res.ok) throw new Error('Failed to load messages')
    return res.json()
  }

  async createRoom(room, baseUrl = DEFAULT_BASE_URL) {
    const res = await fetch(`${baseUrl}/api/chat/rooms`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(room),
    })
    if (!res.ok) throw new Error('Failed to create room')
    return res.json()
  }
}

const chatService = new ChatService()
export default chatService