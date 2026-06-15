import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

const DEFAULT_BASE_URL = 'http://localhost:8080'

class ChatService {
  constructor() {
    this.client           = null
    this.connected        = false
    this.pendingQueue     = []
    this._globalListeners = []
    this._roomSubs        = {}
  }

  connect(baseUrl = DEFAULT_BASE_URL) {
    if (this.client) return

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
        this._roomSubs = {}
      },
      onStompError: (frame) => {
        console.error('[ChatService] STOMP error', frame)
      },
    })
    this.client.activate()
  }

  disconnect() {
    this.client?.deactivate()
    this.client = null
    this.connected = false
    this._roomSubs = {}
  }

  // ── roomId당 STOMP 구독 1개만 유지 ──
  _ensureRoomSub(roomId) {
    if (this._roomSubs[roomId]) return
    const entry = { sub: null, roomHandlers: new Set() }
    this._roomSubs[roomId] = entry

    const doSub = () => {
      entry.sub = this.client.subscribe(`/topic/room/${roomId}`, (stompMsg) => {
        const msg = JSON.parse(stompMsg.body)
        entry.roomHandlers.forEach(fn => fn(msg))
        // 새 채팅 메시지만 전역 리스너에 전달 (EDIT/DELETE/TYPING 제외)
        if (!msg.type || msg.type === 'SEND') {
          this._globalListeners.forEach(fn => fn(msg))
        }
      })
    }

    if (this.connected) doSub()
    else this.pendingQueue.push(doSub)
  }

  subscribeToRoom(roomId, onMessage) {
    this._ensureRoomSub(roomId)
    const entry = this._roomSubs[roomId]
    entry.roomHandlers.add(onMessage)
    return () => entry.roomHandlers.delete(onMessage)
  }

  subscribeBackground(roomIds) {
    if (!roomIds?.length) return
    roomIds.forEach(roomId => this._ensureRoomSub(roomId))
  }

  onMessage(callback) {
    this._globalListeners.push(callback)
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

  // ── 타이핑 알림 (WebSocket 브로드캐스트) ──
  sendTyping(roomId, senderEmail, senderName) {
    this._publish('/app/chat.typing', {
      roomId,
      senderEmail,
      senderName,
      type: 'TYPING',
    })
  }

  _publish(destination, body) {
    const send = () => this.client.publish({ destination, body: JSON.stringify(body) })
    if (this.connected) send()
    else this.pendingQueue.push(send)
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(room),
    })
    if (!res.ok) throw new Error('Failed to create room')
    return res.json()
  }
}

const chatService = new ChatService()
export default chatService