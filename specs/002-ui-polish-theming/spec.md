# Feature Specification: UI Polish & Theming

**Feature Branch**: `002-ui-polish-theming`
**Created**: 2026-04-02
**Status**: Draft
**Input**: User description: "Polish the UI to feel modern, calm, and focused for Chinese learning. Add dark/light mode, custom color scheme, typography (Noto Sans SC + Roboto), mobile-first responsive layout with max-width, auto-growing chat input, whitespace-respecting messages, configurable text size, and a modern icon library."

## Design Tokens

### Color Scheme

The app uses a single set of named color tokens. Brand and functional colors are constant across modes; surface and text colors change per mode.

#### Shared (mode-independent)

| Token              | Value   | Usage                                                  |
|--------------------|---------|--------------------------------------------------------|
| `brand-primary`    | #4F6D7A | Structural elements: user chat bubbles, avatars         |
| `brand-secondary`  | #C0D6DF | Secondary accents, decorative highlights                |
| `accent`           | #5B8A9A | Interactive elements: buttons, links, active/hover states |
| `status-success`   | #91A08D | Success indicators                                     |
| `status-error`     | #DBA8AC | Error indicators                                       |

> **Note**: The `accent` token (#5B8A9A) is a brighter, more saturated variant in the same teal hue family as `brand-primary`, providing clear interactive affordance while maintaining palette cohesion.

#### Light Mode (default)

| Token          | Value   |
|----------------|---------|
| `bg-main`      | #F8F9FA |
| `bg-surface`   | #FFFFFF |
| `text-main`    | #2D3142 |
| `text-muted`   | #4F5D75 |
| `border-color` | #E2E8F0 |

#### Dark Mode

| Token          | Value   |
|----------------|---------|
| `bg-main`      | #1A1D23 |
| `bg-surface`   | #242933 |
| `text-main`    | #E0E1DD |
| `text-muted`   | #9A8C98 |
| `border-color` | #333C4D |

### Typography

| Role              | Font family                    |
|-------------------|--------------------------------|
| Chinese text      | Noto Sans Simplified Chinese   |
| English / UI text | Roboto                         |

### Chat Bubble Token Mapping

| Element             | Background       | Text        |
|---------------------|------------------|-------------|
| User message bubble | `brand-primary`  | white       |
| Assistant message bubble | `bg-surface` | `text-main` |

## Clarifications

### Session 2026-04-02

- Q: How should user vs assistant chat bubbles map to the new color tokens? → A: User bubbles use `brand-primary` background with white text; assistant bubbles use `bg-surface` background with `text-main` text.
- Q: Should all current indigo (#6366f1) usages uniformly become `brand-primary`, or should interactive elements use a distinct token? → A: Add a dedicated `accent` token for interactive elements (buttons, links, highlights); `brand-primary` is used for structural elements (bubbles, avatars).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dark & Light Mode with Cohesive Color Scheme (Priority: P1)

A user opens the app and sees a visually cohesive, calm interface that automatically matches their system's color preference (dark or light). All screens — home, chat, settings, persona management — use the same harmonious color palette with teal-grey brand tones, soft backgrounds, and gentle contrast that keeps focus on the learning content rather than the UI chrome.

**Why this priority**: Color scheme and theming form the visual foundation for every other styling improvement. All subsequent stories depend on the theming system being in place first.

**Independent Test**: Can be fully tested by toggling system dark/light mode preference and verifying that every screen renders with the correct palette. Delivers immediate visual improvement across the entire app.

**Acceptance Scenarios**:

1. **Given** the user's system is set to light mode, **When** they open the app, **Then** they see the Light Mode palette from the Color Scheme
2. **Given** the user's system is set to dark mode, **When** they open the app, **Then** they see the Dark Mode palette from the Color Scheme
3. **Given** the user is on any screen (home, chat, settings, persona list/form), **When** they view the interface, **Then** all elements use the shared color tokens consistently — no hardcoded colors leak through
4. **Given** the user switches their system color preference while the app is open, **When** the system preference changes, **Then** the app reflects the new scheme without requiring a page reload

---

### User Story 2 - Typography with Chinese & English Font Pairing (Priority: P1)

A user reading Chinese text sees it rendered in the designated Chinese font, providing clear and beautiful CJK character display. English text and UI labels use the designated English font for a clean, modern feel. The font pairing creates a visually harmonious experience across both languages.

**Why this priority**: Typography is fundamental to a language-learning app — legible, well-rendered Chinese characters directly impact the learning experience. Equally foundational alongside the color scheme.

**Independent Test**: Can be tested by viewing chat messages containing both Chinese and English text, verifying each language renders in its designated font from the Typography table.

**Acceptance Scenarios**:

1. **Given** a chat message contains Chinese characters, **When** the message is displayed, **Then** the Chinese characters render in the Chinese text font
2. **Given** UI labels and English text are displayed, **When** the user views any screen, **Then** English text renders in the English / UI text font
3. **Given** the user has slow connectivity, **When** fonts are still loading, **Then** the app displays readable text using fallback system fonts without layout shift

---

### User Story 3 - Mobile-First Responsive Layout with Max-Width (Priority: P1)

A user on a mobile device experiences an interface optimized for small screens. On larger screens (tablets, desktops), the main content area has a comfortable maximum width and is centered horizontally, with empty space on the sides, preventing the UI from stretching uncomfortably wide.

**Why this priority**: The app is mobile-first and most users will interact on phones. Layout constraints are foundational and affect every view.

**Independent Test**: Can be tested by resizing the browser window from mobile width to desktop width and verifying that content is constrained and centered on wide viewports.

**Acceptance Scenarios**:

1. **Given** the user is on a mobile device (viewport < 640px), **When** they view any screen, **Then** the content uses the full available width with appropriate padding
2. **Given** the user is on a wide screen (viewport > 640px), **When** they view any screen, **Then** the main interaction area is constrained to a maximum width and centered horizontally with empty space on both sides
3. **Given** the user rotates their device between portrait and landscape, **When** the orientation changes, **Then** the layout adapts smoothly without breaking

---

### User Story 4 - Auto-Growing Chat Input (Priority: P2)

A user typing a longer message in the chat input sees the input field grow vertically to accommodate up to three lines of text. Beyond three lines, the input becomes scrollable, ensuring it never dominates the screen.

**Why this priority**: Improves the core chat interaction experience but depends on the layout foundation from P1 stories.

**Independent Test**: Can be tested by typing text of varying lengths into the chat input and verifying the growth and scroll behavior.

**Acceptance Scenarios**:

1. **Given** the user types a single line of text, **When** they view the chat input, **Then** the input displays as a single-line field
2. **Given** the user types text that wraps to two or three lines, **When** the text grows, **Then** the input field grows vertically to show all lines
3. **Given** the user types text exceeding three lines, **When** the text grows beyond three lines, **Then** the input field stops growing and becomes vertically scrollable
4. **Given** the user deletes text back to a single line, **When** the content shrinks, **Then** the input field shrinks back to single-line height

---

### User Story 5 - Whitespace-Respecting Chat Messages (Priority: P2)

A user (or the AI persona) sends a message containing intentional line breaks, paragraph spacing, or indentation. The displayed message preserves this whitespace formatting, making structured responses and multi-line content readable.

**Why this priority**: Directly impacts readability of chat content, especially for AI-generated responses that often use structured formatting.

**Independent Test**: Can be tested by sending or receiving messages with line breaks and verifying the whitespace is preserved in the rendered output.

**Acceptance Scenarios**:

1. **Given** a message contains explicit line breaks, **When** the message is displayed, **Then** the line breaks are rendered as visible line breaks
2. **Given** a message contains multiple consecutive blank lines, **When** the message is displayed, **Then** paragraph spacing is visually preserved
3. **Given** a message contains indentation or aligned text, **When** the message is displayed, **Then** the whitespace structure is maintained

---

### User Story 6 - Modern Icon Library (Priority: P2)

A user navigates the app and sees clean, consistent vector icons throughout — for settings, navigation, actions, and status indicators. The icons feel modern and cohesive with the overall calm, focused design aesthetic.

**Why this priority**: Replaces the current Unicode emoji/text-symbol approach with a professional look. Important for polish but not blocking core functionality.

**Independent Test**: Can be tested by navigating all screens and verifying that all action points (back buttons, settings, close, send) display crisp vector icons instead of Unicode characters.

**Acceptance Scenarios**:

1. **Given** the user views any navigation element (back button, settings icon, close button), **When** the element is rendered, **Then** it displays a crisp vector icon from the chosen icon library
2. **Given** the user is in dark mode, **When** they view icons, **Then** the icons adapt their color to remain visible and consistent with the dark theme
3. **Given** the user views the app on a high-DPI display, **When** icons are rendered, **Then** they appear sharp and clear at any resolution

---

### User Story 7 - Configurable Text Size (Priority: P3)

A user who finds the default text too small or too large navigates to Settings and adjusts the text size. The change applies across the entire app — chat messages, UI labels, and all text content — allowing comfortable reading at the user's preferred size.

**Why this priority**: Accessibility enhancement that improves comfort. Lower priority because the app should work well at default sizes; this is an optimization for individual preferences.

**Independent Test**: Can be tested by changing the text size setting and verifying that all text across the app scales accordingly.

**Acceptance Scenarios**:

1. **Given** the user opens the Settings screen, **When** they look for text size controls, **Then** they see an option to adjust the app-wide text size
2. **Given** the user selects a larger text size, **When** they navigate to any screen, **Then** all text (messages, labels, buttons) appears at the larger size
3. **Given** the user selects a smaller text size, **When** they navigate to any screen, **Then** all text appears at the smaller size without overlapping or breaking layouts
4. **Given** the user changes the text size, **When** they close and reopen the app, **Then** their text size preference is preserved

---

### Edge Cases

- What happens when the system does not report a color scheme preference? The app defaults to light mode.
- What happens if web fonts fail to load? The app falls back to system fonts (current font stack) without layout breakage.
- What happens on very narrow screens (< 320px)? Content remains usable with horizontal scrolling avoided; elements may stack or truncate gracefully.
- What happens when text size is set to the maximum and messages contain long unbroken strings (e.g., URLs)? Long strings wrap or truncate with ellipsis rather than overflowing the container.
- What happens when the chat input contains pasted text with many lines? The input grows to three lines maximum and becomes scrollable for the rest.

## Requirements *(mandatory)*

### Functional Requirements

**Theming**

- **FR-001**: The app MUST expose the Color Scheme tokens (see Design Tokens) as shared CSS custom properties available to all components, including the `accent` token for interactive elements
- **FR-002**: The app MUST apply the Light Mode token values by default
- **FR-003**: The app MUST apply the Dark Mode token values when the user's system prefers dark mode
- **FR-004**: The Shared (mode-independent) token values MUST remain constant regardless of active mode
- **FR-005**: All existing hardcoded color values across components MUST be replaced with references to the Color Scheme tokens
- **FR-006**: User chat bubbles MUST use `brand-primary` background with white text; assistant chat bubbles MUST use `bg-surface` background with `text-main` text (see Chat Bubble Token Mapping)
- **FR-007**: Interactive elements (buttons, links, active/hover states) MUST use the `accent` token; structural elements (chat bubbles, avatars) MUST use `brand-primary`

**Typography**

- **FR-008**: The app MUST load and apply the fonts specified in the Typography table (see Design Tokens) for their respective roles
- **FR-009**: The app MUST provide fallback font stacks so text is readable while web fonts load

**Layout**

- **FR-010**: The main content area MUST be constrained to a maximum width on viewports wider than the mobile breakpoint, and MUST be centered horizontally
- **FR-011**: On mobile viewports, the content MUST use full available width with appropriate edge padding

**Chat Input**

- **FR-012**: The chat text input MUST grow vertically to accommodate up to three lines of content
- **FR-013**: The chat text input MUST become vertically scrollable when content exceeds three lines
- **FR-014**: The chat text input MUST shrink back when content is reduced

**Chat Messages**

- **FR-015**: Chat messages MUST preserve and display whitespace formatting (line breaks, paragraph spacing) from the original message content

**Icons**

- **FR-016**: The app MUST use a vector icon library for all interactive icons (navigation, actions, status indicators), replacing current Unicode characters
- **FR-017**: Icons MUST inherit their color from the active Color Scheme tokens

**Text Size**

- **FR-018**: The Settings screen MUST include a text size control that allows users to choose from preset size levels
- **FR-019**: The selected text size MUST apply globally across all text in the app (messages, labels, controls)
- **FR-020**: The text size preference MUST be persisted across sessions
- **FR-021**: Layout MUST remain intact and usable at all text size levels without overflow or overlap

### Key Entities

- **Theme**: The active color scheme (light or dark), determined by system preference, expressed through the Color Scheme design tokens
- **Text Size Setting**: A user preference (persisted in settings store) representing the chosen text scale level, applied app-wide

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every screen in the app (home, chat, settings, persona views) renders using only the Color Scheme tokens in both light and dark mode — zero hardcoded color values remain
- **SC-002**: Chinese characters render in the designated Chinese font and English text in the designated English font on all screens
- **SC-003**: On viewports wider than 640px, the main content area does not exceed its maximum width and is visually centered
- **SC-004**: The chat input field grows from one line to three lines as the user types, and scrolls for content beyond three lines
- **SC-005**: Messages containing line breaks display those line breaks visually in the chat
- **SC-006**: All interactive icons render as crisp vector graphics whose color adapts to the active Color Scheme
- **SC-007**: Users can change text size in settings and see the change reflected across all screens immediately, with the preference persisting after app restart

## Assumptions

- The app relies on `prefers-color-scheme` media query for automatic dark/light detection; there is no manual theme toggle in Settings (system preference is respected)
- Google Fonts CDN is used to load the fonts defined in the Typography table; no self-hosting of font files
- The icon library choice will be determined during the planning phase based on bundle size, tree-shakeability, and aesthetic fit (e.g., Lucide, Phosphor, Heroicons)
- Text size presets are a small fixed set (e.g., Small, Default, Large, Extra Large) rather than a free-form slider
- The maximum content width for desktop viewports is approximately 640–768px, matching common mobile-first chat app patterns
- Existing component functionality (chat, persona management, word popups, correction dialogs) is not changed — only visual styling is updated
- The font loading strategy uses `font-display: swap` to prevent invisible text during font loading
