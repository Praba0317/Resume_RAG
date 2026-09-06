import { create } from 'zustand'
import type { Message } from '../../types/chat.types'

interface ChatState {
  messages: Message[]
  addUserMessage: (text: string) => void
  addBotMessage: (text: string) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addUserMessage: (text) => set((state) => ({ messages: [...state.messages, { id: crypto.randomUUID(), type: 'user', text, timestamp: new Date() }] })),
  addBotMessage: (text) => set((state) => ({ messages: [...state.messages, { id: crypto.randomUUID(), type: 'bot', text, timestamp: new Date() }] })),
  clearMessages: () => set({ messages: [] }),
}))
