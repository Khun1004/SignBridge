import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

const DEFAULT_BASE_URL = 'http://localhost:8080'

class ChatService {
  constructor() {
    this.client       = null
    this.connected    = false
    this.pendingQueue = []
  }

  connect(baseUrl = DEFAULT_BASE_URL) {
    if (this.client) return  // already connecting or connected

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${baseUrl}/ws-chat`),
      reconnectDelay: 3000,
      onConnect: () => {
        console.log('[ChatService] Connected')
        this.connected = true
        // Flush queued subscriptions and publishes
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
    this.client = null
    this.connected = false
  }

  subscribeToRoom(roomId, onMessage) {
    return this.subscribe(`/topic/room/${roomId}`, onMessage)
  }

  // Safe subscribe — queues if not yet connected
  subscribe(topic, onMessage) {
    if (this.connected && this.client) {
      try {
        const sub = this.client.subscribe(topic, (stompMsg) => {
          try { onMessage(JSON.parse(stompMsg.body)) } catch(e) {
            console.error('[ChatService] Parse error', e)
          }
        })
        return () => { try { sub.unsubscribe() } catch(e) {} }
      } catch(e) {
        console.warn('[ChatService] subscribe failed, queuing', e)
      }
    }

    // Not connected yet — queue it
    let sub = null
    let unsubCalled = false
    const doSubscribe = () => {
      if (unsubCalled || !this.client) return
      try {
        sub = this.client.subscribe(topic, (stompMsg) => {
          try { onMessage(JSON.parse(stompMsg.body)) } catch(e) {}
        })
      } catch(e) {
        console.error('[ChatService] Queued subscribe failed', e)
      }
    }
    this.pendingQueue.push(doSubscribe)
    return () => {
      unsubCalled = true
      try { sub?.unsubscribe() } catch(e) {}
    }
  }

  sendMessage({ roomId, senderEmail, senderName, text, type = 'TEXT' }) {
    this._publish('/app/chat.send', { roomId, senderEmail, senderName, text, type })
  }

  editMessage(id, roomId, newText) {
    this._publish('/app/chat.edit', { id, roomId, text: newText, type: 'EDIT' })
  }

  deleteMessage(id, roomId) {
    this._publish('/app/chat.delete', { id, roomId, type: 'DELETE' })
  }

  markRead(roomId, readerEmail) {
    this._publish('/app/chat.read', { roomId, senderEmail: readerEmail, type: 'READ' })
  }

  // Safe publish — queues if not yet connected
  _publish(destination, body) {
    const send = () => {
      if (!this.client) return
      try {
        this.client.publish({ destination, body: JSON.stringify(body) })
      } catch(e) {
        console.error('[ChatService] Publish failed', e)
      }
    }
    if (this.connected && this.client) {
      send()
    } else {
      this.pendingQueue.push(send)
    }
  }

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