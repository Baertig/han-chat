import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/vue'
import ChatMessage from '@/components/chat/ChatMessage.vue'
import type { UserMessage, PersonaMessage } from '@/types'

function makeUserMessage(overrides?: Partial<UserMessage>): UserMessage {
  return {
    id: 'msg-user-1',
    conversationId: 'conv-1',
    role: 'user',
    content: 'Hello, teacher!',
    timestamp: new Date('2026-03-29T10:00:00.000Z'),
    feedback: null,
    feedbackStatus: null,
    ...overrides,
  }
}

function makePersonaMessage(overrides?: Partial<PersonaMessage>): PersonaMessage {
  return {
    id: 'msg-assistant-1',
    conversationId: 'conv-1',
    role: 'assistant',
    content: '你好，同学！',
    timestamp: new Date('2026-03-29T10:01:00.000Z'),
    annotatedWords: null,
    wordTranslationStatus: null,
    ...overrides,
  }
}

describe('ChatMessage', () => {
  it('renders user message with data-testid="message-user"', () => {
    render(ChatMessage, {
      props: { message: makeUserMessage() },
    })

    expect(screen.getByTestId('message-user')).toBeInTheDocument()
    expect(screen.queryByTestId('message-assistant')).not.toBeInTheDocument()
  })

  it('renders assistant message with data-testid="message-assistant"', () => {
    render(ChatMessage, {
      props: { message: makePersonaMessage(), personaName: 'Li Wei' },
    })

    expect(screen.getByTestId('message-assistant')).toBeInTheDocument()
    expect(screen.queryByTestId('message-user')).not.toBeInTheDocument()
  })

  it('shows message content for user message', () => {
    const content = 'This is my test message'
    render(ChatMessage, {
      props: { message: makeUserMessage({ content }) },
    })

    expect(screen.getByText(content)).toBeInTheDocument()
  })

  it('shows message content for assistant message', () => {
    const content = '今天天气很好'
    render(ChatMessage, {
      props: { message: makePersonaMessage({ content }), personaName: 'Li Wei' },
    })

    expect(screen.getByText(content)).toBeInTheDocument()
  })
})
