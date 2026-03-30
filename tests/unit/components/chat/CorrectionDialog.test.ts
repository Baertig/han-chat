import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import CorrectionDialog from '@/components/chat/CorrectionDialog.vue'
import type { FeedbackResult } from '@/types'

function renderDialog(overrides: {
  originalContent?: string
  feedback?: FeedbackResult
} = {}) {
  const props = {
    originalContent: overrides.originalContent ?? '我喜欢吃饭',
    feedback: overrides.feedback ?? {
      isCorrect: true,
      translation: 'I like to eat rice.',
      corrected: '我喜欢吃饭',
    },
  }

  return render(CorrectionDialog, { props })
}

describe('CorrectionDialog', () => {
  it('shows translation text in green mode (isCorrect = true)', () => {
    renderDialog({
      feedback: {
        isCorrect: true,
        translation: 'I like to eat rice.',
        corrected: '我喜欢吃饭',
      },
    })

    expect(screen.getByText('Translation')).toBeInTheDocument()
    expect(screen.getByTestId('correction-translation')).toHaveTextContent(
      'I like to eat rice.',
    )
    expect(screen.queryByTestId('correction-original')).not.toBeInTheDocument()
  })

  it('shows original and corrected with diff highlighting in red mode (isCorrect = false)', () => {
    renderDialog({
      originalContent: '我喜欢吃饭',
      feedback: {
        isCorrect: false,
        translation: 'I like to eat noodles.',
        corrected: '我喜欢吃面',
      },
    })

    expect(screen.getByText('Original')).toBeInTheDocument()
    expect(screen.getByTestId('correction-original')).toHaveTextContent(
      '我喜欢吃饭',
    )

    expect(screen.getByText('Corrected')).toBeInTheDocument()
    const correctedEl = screen.getByTestId('correction-corrected')

    // The removed character should have the 'removed' class
    const removedSpan = correctedEl.querySelector('.removed')
    expect(removedSpan).toBeInTheDocument()
    expect(removedSpan).toHaveTextContent('饭')

    // The added character should have the 'added' class
    const addedSpan = correctedEl.querySelector('.added')
    expect(addedSpan).toBeInTheDocument()
    expect(addedSpan).toHaveTextContent('面')

    // Translation section should not be shown
    expect(screen.queryByTestId('correction-translation')).not.toBeInTheDocument()
  })

  it('emits dismiss when overlay is clicked', async () => {
    const user = userEvent.setup()
    const { emitted } = renderDialog()

    await user.click(screen.getByTestId('correction-dialog'))

    expect(emitted()).toHaveProperty('dismiss')
    expect(emitted()['dismiss']).toHaveLength(1)
  })

  it('emits dismiss when close button is clicked', async () => {
    const user = userEvent.setup()
    const { emitted } = renderDialog()

    await user.click(screen.getByTestId('correction-close'))

    expect(emitted()).toHaveProperty('dismiss')
    expect(emitted()['dismiss']).toHaveLength(1)
  })
})
