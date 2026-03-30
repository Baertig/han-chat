import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/vue'
import ChatInput from '@/components/chat/ChatInput.vue'

describe('ChatInput', () => {
  it('emits send with trimmed text when submitted', async () => {
    const { emitted } = render(ChatInput)

    const textarea = screen.getByTestId('chat-input')
    await fireEvent.update(textarea, '  Hello world  ')
    await fireEvent.submit(screen.getByTestId('chat-input-form'))

    expect(emitted()['send']).toBeTruthy()
    expect(emitted()['send']![0]).toEqual(['Hello world'])
  })

  it('clears input after send', async () => {
    render(ChatInput)

    const textarea = screen.getByTestId<HTMLTextAreaElement>('chat-input')
    await fireEvent.update(textarea, 'Hello')
    await fireEvent.submit(screen.getByTestId('chat-input-form'))

    expect(textarea.value).toBe('')
  })

  it('send button is disabled when input is empty', () => {
    render(ChatInput)

    const button = screen.getByTestId('send-btn')
    expect(button).toBeDisabled()
  })

  it('send button is disabled when disabled prop is true', async () => {
    render(ChatInput, { props: { disabled: true } })

    const textarea = screen.getByTestId('chat-input')
    await fireEvent.update(textarea, 'Hello')

    const button = screen.getByTestId('send-btn')
    expect(button).toBeDisabled()
  })
})
