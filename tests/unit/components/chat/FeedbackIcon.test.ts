import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import FeedbackIcon from '@/components/chat/FeedbackIcon.vue'

describe('FeedbackIcon', () => {
  it('shows loading spinner when feedbackStatus is pending', () => {
    render(FeedbackIcon, {
      props: { feedbackStatus: 'pending', isCorrect: null },
    })

    expect(screen.getByTestId('feedback-loading')).toBeInTheDocument()
  })

  it('shows error icon when feedbackStatus is error', () => {
    render(FeedbackIcon, {
      props: { feedbackStatus: 'error', isCorrect: null },
    })

    expect(screen.getByTestId('feedback-error')).toBeInTheDocument()
  })

  it('shows green checkmark when resolved and isCorrect is true', () => {
    render(FeedbackIcon, {
      props: { feedbackStatus: 'resolved', isCorrect: true },
    })

    expect(screen.getByTestId('feedback-correct')).toBeInTheDocument()
  })

  it('shows red cross when resolved and isCorrect is false', () => {
    render(FeedbackIcon, {
      props: { feedbackStatus: 'resolved', isCorrect: false },
    })

    expect(screen.getByTestId('feedback-incorrect')).toBeInTheDocument()
  })

  it('renders nothing when feedbackStatus is null', () => {
    const { container } = render(FeedbackIcon, {
      props: { feedbackStatus: null, isCorrect: null },
    })

    expect(container.querySelector('button')).not.toBeInTheDocument()
  })

  it('emits click event when clicked', async () => {
    const user = userEvent.setup()
    const { emitted } = render(FeedbackIcon, {
      props: { feedbackStatus: 'resolved', isCorrect: true },
    })

    await user.click(screen.getByRole('button'))

    expect(emitted()).toHaveProperty('click')
    expect(emitted()['click']).toHaveLength(1)
  })
})
