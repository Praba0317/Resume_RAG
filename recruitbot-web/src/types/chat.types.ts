export type MessageType = 'user' | 'bot'

export interface Message {
  id: string
  type: MessageType
  text: string
  timestamp: Date
}
