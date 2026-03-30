import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/vue'
import AvatarPlaceholder from '@/components/common/AvatarPlaceholder.vue'

describe('AvatarPlaceholder', () => {
  it('renders initials when avatarDataUri is null', () => {
    render(AvatarPlaceholder, {
      props: { name: 'Li Wei', avatarDataUri: null },
    })

    const placeholder = screen.getByTestId('avatar-placeholder')
    expect(placeholder).toBeInTheDocument()
    expect(placeholder.textContent?.trim()).toBe('LW')
    expect(screen.queryByTestId('avatar-img')).not.toBeInTheDocument()
  })

  it('renders img when avatarDataUri is provided', () => {
    const dataUri = 'data:image/png;base64,abc123'
    render(AvatarPlaceholder, {
      props: { name: 'Li Wei', avatarDataUri: dataUri },
    })

    const img = screen.getByTestId('avatar-img')
    expect(img).toBeInTheDocument()
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('src', dataUri)
    expect(screen.queryByTestId('avatar-placeholder')).not.toBeInTheDocument()
  })

  it('shows correct initials for multi-word name', () => {
    render(AvatarPlaceholder, {
      props: { name: 'Li Wei', avatarDataUri: null },
    })
    expect(screen.getByTestId('avatar-placeholder').textContent?.trim()).toBe('LW')
  })

  it('shows single initial for single-word name', () => {
    render(AvatarPlaceholder, {
      props: { name: 'Zhang', avatarDataUri: null },
    })
    expect(screen.getByTestId('avatar-placeholder').textContent?.trim()).toBe('Z')
  })
})
