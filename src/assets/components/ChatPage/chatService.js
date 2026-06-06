/**
 * chatService.js
 *
 * Drop-in replacement for the localStorage helpers in ChatRoom.jsx.
 * Uses SockJS + STOMP to talk to your Spring Boot WebSocket server.
 *
 * Usage:
 *   import chatService from './chatService'
 *
 *   // Connect once (e.g. in App.jsx or when ChatRoom mounts)
 *   chatService.connect('http://192.168.0.80:8080')
 *
 *   // Subscribe to a room
 *   const unsub = chatService.subscribeToRoom(roomId, (msg) => {
 *     setMessages(prev => [...prev, msg])
 *   })
 *
 *   // Send a message
 *   chatService.sendMessage({ roomId, senderEmail, senderName, text })
 *
 *   // Unsubscribe when leaving a room
 *   unsub()
 *
 *   // Disconnect on logout
 *   chatService.disconnect()
 */

import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

// Change this to match your Spring Boot server IP/URL
// In development use your local IP, in production use your ngrok/Railway URL
const DEFAULT_BASE_URL = 'http://localhost:8080'
class ChatService {
  constructor() {
    this.client     = null
    this.connected  = false
    this.pendingQueue = []   // messages queued before connection is ready
  }

  connect(baseUrl = DEFAULT_BASE_URL) {
    if (this.connected) return

    this.client = new Client({
      // SockJS fallback — matches your WebSocketConfig endpoint
      webSocketFactory: () => new SockJS(`${baseUrl}/ws-chat`),

      reconnectDelay: 3000,   // auto-reconnect every 3s if disconnected

      onConnect: () => {
        console.log('[ChatService] Connected')
        this.connected = true
        // Flush any messages sent before connection was ready
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

  // Subscribe to messages for a specific room.
  // Returns an unsubscribe function — call it when leaving the room.
  subscribeToRoom(roomId, onMessage) {
    if (!this.client) {
      console.warn('[ChatService] Not connected yet')
      return () => {}
    }

    const subscription = this.client.subscribe(
      `/topic/room/${roomId}`,
      (stompMsg) => {
        const msg = JSON.parse(stompMsg.body)
        onMessage(msg)
      }
    )

    // Return unsubscribe fn
    return () => subscription.unsubscribe()
  }

  // Send a new message
  sendMessage(payload) {
    this._publish('/app/chat.send', payload)
  }

  // Edit an existing message
  editMessage(id, roomId, newText) {
    this._publish('/app/chat.edit', { id, roomId, text: newText, type: 'EDIT' })
  }

  // Delete a message
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
      // Queue it — will be flushed on connect
      this.pendingQueue.push(send)
    }
  }

  // -------------------------------------------------------
  // REST helpers — these replace your localStorage reads
  // -------------------------------------------------------

  // Load a user's room list (replaces load(ROOMS_KEY, []))
  async getRooms(email, baseUrl = DEFAULT_BASE_URL) {
    const res = await fetch(`${baseUrl}/api/chat/rooms?email=${encodeURIComponent(email)}`)
    if (!res.ok) throw new Error('Failed to load rooms')
    return res.json()
  }

  // Load message history for a room (replaces loadM(roomId))
  async getMessages(roomId, baseUrl = DEFAULT_BASE_URL) {
    const res = await fetch(`${baseUrl}/api/chat/rooms/${roomId}/messages`)
    if (!res.ok) throw new Error('Failed to load messages')
    return res.json()
  }

  // Create a new 1:1 room (replaces the startChat localStorage logic)
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

// Export a singleton so the same connection is reused across components
const chatService = new ChatService()
export default chatService