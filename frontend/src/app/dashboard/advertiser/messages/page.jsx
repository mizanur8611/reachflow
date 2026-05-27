'use client'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, MessageSquare, Search } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function MessagesPage() {
  const { user } = useAuthStore()
  const [conversations, setConversations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  //  const token = typeof window !== 'undefined' ? localStorage.getItem('rf_token') : null

  // Fetch all users to message
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('rf_token')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setUsers(data.users || [])
      } catch (err) {}
    }

    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('rf_token')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        // Get unique users from conversations
        const seen = new Set()
        const convUsers = []
        ;(data.messages || []).forEach(m => {
          const other = m.senderId === user?.id ? m.receiver : m.sender
          if (other && !seen.has(other.id)) {
            seen.add(other.id)
            convUsers.push({ ...other, lastMessage: m.content, lastTime: m.createdAt })
          }
        })
        setConversations(convUsers)
      } catch (err) {}
    }

    fetchUsers()
    fetchConversations()
  }, [])

  // Fetch messages with selected user
  useEffect(() => {
    if (!selectedUser) return
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/${selectedUser.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setMessages(data.messages || [])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      } catch (err) {}
    }
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [selectedUser])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId: selectedUser.id, content: newMessage })
      })
      const data = await res.json()
      if (data.message) {
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    } catch (err) {}
    setLoading(false)
  }

  const filteredUsers = users.filter(u =>
    u.id !== user?.id &&
    u.name?.toLowerCase().includes(search.toLowerCase())
  )

  const displayUsers = search ? filteredUsers : conversations.length > 0 ? conversations : filteredUsers

  return (
    <div className="h-screen bg-[#0a0b0f] text-white flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h2 className="font-bold text-lg mb-3">Messages</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {displayUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No users found</div>
          ) : (
            displayUsers.map(u => (
              <div
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors ${selectedUser?.id === u.id ? 'bg-violet-600/10 border-r-2 border-violet-500' : ''}`}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-sm font-bold shrink-0">
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.name}</p>
                  {u.lastMessage && (
                    <p className="text-xs text-gray-500 truncate">{u.lastMessage}</p>
                  )}
                  <p className="text-xs text-gray-600 capitalize">{u.role?.toLowerCase()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                {selectedUser.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-white">{selectedUser.name}</p>
                <p className="text-xs text-gray-500 capitalize">{selectedUser.role?.toLowerCase()}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {messages.map((m, i) => {
                const isMe = m.senderId === user?.id
                return (
                  <motion.div
                    key={m.id || i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-violet-600 text-white rounded-br-sm'
                        : 'bg-white/10 text-white rounded-bl-sm'
                    }`}>
                      <p>{m.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-violet-200' : 'text-gray-500'}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-white/5 flex items-center gap-3">
              <input
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 text-sm"
                placeholder="Type a message..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !newMessage.trim()}
                className="p-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 font-medium">Select a user to start messaging</p>
              <p className="text-gray-600 text-sm mt-1">Search for users on the left</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
