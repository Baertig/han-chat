<!--
SYNC IMPACT REPORT
==================
Version change: [PLACEHOLDER] → 1.0.0
Bump rationale: Initial constitution creation from blank template (MINOR baseline).

Modified principles:
  - [PRINCIPLE_1_NAME] → I. Client-Only Architecture (new)
  - [PRINCIPLE_2_NAME] → II. Test-First Development (new)
  - [PRINCIPLE_3_NAME] → III. E2E Tests for User Interaction (new)
  - [PRINCIPLE_4_NAME] → IV. Simplicity & YAGNI (new)
  - [PRINCIPLE_5_NAME] → V. Offline-First & Privacy (new)

Added sections:
  - Technology Constraints (client-side stack boundaries)
  - Development Workflow (solo TDD cycle)

Removed sections: none

Templates requiring updates:
  ✅ .specify/memory/constitution.md — this file (updated now)
  ⚠ .specify/templates/plan-template.md — Constitution Check section references
      generic gates; review that "no backend/server tasks" is enforced as a gate
      when plan.md is generated for this project.
  ⚠ .specify/templates/tasks-template.md — "Parallel Team Strategy" section
      references multiple developers; solo-project context should be noted when
      generating tasks.md (no parallel-team sections needed).
  ⚠ .specify/templates/spec-template.md — Assumptions section placeholder
      "Users have stable internet connectivity" may be misleading for an
      offline-capable client-only app; adjust when generating spec.md.

Deferred TODOs:
  - TODO(RATIFICATION_DATE): Date set to today (2026-03-25) as initial creation.
    If project was started earlier, update to the actual project inception date.
-->

# han-chat Constitution

## Core Principles

### I. Client-Only Architecture (NON-NEGOTIABLE)

The application MUST run entirely in the client (browser). There MUST be no
server-side components, no backend services, and no server-rendered pages
owned by this project. All data processing, state management, and logic MUST
execute in the user's browser.

- External third-party APIs (e.g., AI inference endpoints) are permitted only
  as optional runtime integrations; the app MUST remain functional (or
  degrade gracefully) when such endpoints are unavailable.
- No build-time or runtime dependency on a custom server process is allowed.
- Deployment MUST be achievable as a set of static files (HTML, CSS, JS,
  assets) served from any static host or opened directly from the filesystem.

**Rationale**: The client-only constraint is the defining architectural
boundary of this project. Violating it introduces operational complexity
(hosting, scaling, auth, cost) incompatible with a solo client-side app.

### II. Test-First Development (NON-NEGOTIABLE)

Tests MUST be written and confirmed to fail before any implementation code is
written. The Red-Green-Refactor cycle is strictly enforced:

1. **Red**: Write a failing test that specifies the desired behaviour.
2. **Green**: Write the minimum implementation to make it pass.
3. **Refactor**: Clean up without breaking the test.

- No production code may be written without a corresponding failing test
  already committed.
- Unit tests MUST cover all pure functions, state transformations, and
  business logic.
- Tests MUST be run before every commit; a failing test suite blocks merge.

**Rationale**: TDD is the primary quality gate for this solo project, replacing
the review process that would exist in a team setting. It also serves as
living documentation of intended behaviour.

### III. E2E Tests for User Interaction

Every distinct user-facing interaction flow (as defined in spec.md user
stories) MUST have at least one end-to-end (E2E) test covering the happy path.

- E2E tests MUST simulate real browser behaviour (e.g., via Playwright or
  Cypress) and MUST NOT mock the DOM or application logic.
- E2E tests for a user story MUST be written before the story's implementation
  begins (consistent with Principle II).
- E2E tests MUST pass against the built/bundled output, not just the dev
  server, before a feature is considered complete.
- Critical error paths (e.g., invalid input, empty state) MUST also have E2E
  coverage where the scenario is user-visible.

**Rationale**: Client-side apps can silently break at the integration layer
(component wiring, routing, state propagation). E2E tests are the only reliable
guard against regressions that unit tests cannot catch in a browser context.

### IV. Simplicity & YAGNI

The simplest solution that satisfies the current requirement MUST be chosen.
Speculative abstractions, premature generalisation, and unused configurability
are prohibited.

- Features MUST NOT be added in anticipation of future requirements.
- Dependencies MUST be justified; each new library MUST solve a concrete
  present problem that cannot be addressed with platform APIs in
  a reasonably simple way.
- Components, modules, and utilities MUST NOT be created solely for
  organisational purposes without a functional justification.
- Solo context: there is no team to maintain complexity; every abstraction
  incurs a maintenance cost borne by one person.

**Rationale**: Solo projects accumulate entropy faster than team projects
because there is no peer pressure to keep things simple. YAGNI is a hard rule,
not a guideline.

### V. Offline-First & Privacy

The application MUST function fully without a network connection (aside from
optional third-party integrations covered by Principle I).

- All persistent state MUST be stored in browser-native storage
  (localStorage, IndexedDB, or similar client APIs). No remote persistence
  is permitted.
- No user data MUST be transmitted to any server controlled by this project.
- If third-party integrations are used, the privacy implications MUST be
  clearly disclosed in the UI before any data is sent.

**Rationale**: Client-only architecture implies that user data stays on the
device. This is both a technical constraint (no server) and a trust commitment
to users.

## Technology Constraints

- **Runtime target**: Modern evergreen browsers (Chrome, Firefox, Safari,
  Edge — current and one prior major version).
- **Build output**: Static files only; no SSR, no edge functions, no
  server-side rendering step.
- **Storage**: Browser-native APIs only (localStorage, IndexedDB,
  sessionStorage, Cache API).
- **Testing stack**: Unit/integration tests via Vitest (or Jest); E2E via
  Playwright (preferred) or Cypress. Test framework choice MUST be made at
  project initialisation and MUST NOT be changed mid-feature without a
  constitution amendment.
- **Network**: Fetch/WebSocket to third-party endpoints is permitted; any
  custom backend endpoint is prohibited.
- **No native app wrappers** (Electron, Capacitor) unless a constitution
  amendment is ratified.

## Development Workflow

This is a solo project. The workflow below replaces team-based review gates
with self-review checkpoints.

1. **Specify**: Create or update `spec.md` for the feature.
2. **Plan**: Run `/speckit.plan` to produce `plan.md`; verify Constitution
   Check passes (no server components, TDD gates met).
3. **Test first**: Write failing unit tests and E2E tests before any
   implementation. Commit the failing tests.
4. **Implement**: Write minimum code to pass tests (Green).
5. **Refactor**: Clean up while keeping tests green.
6. **E2E validation**: Run E2E suite against the production build.
7. **Self-review**: Check the Constitution Check section of `plan.md` before
   merging. Any violation MUST be documented in the Complexity Tracking table
   with justification.
8. **Commit**: One logical unit of work per commit; tests MUST pass.

**Solo exception**: The "Parallel Team Strategy" section in task templates is
not applicable; tasks are executed sequentially in priority order (P1 → P2
→ P3).

## Governance

This constitution supersedes all other development practices for this project.
Amendments MUST be made via the `/speckit.constitution` command and MUST
increment the version according to semantic versioning rules defined below.

- **MAJOR**: Backward-incompatible removal or redefinition of a Core Principle
  (e.g., removing the client-only constraint).
- **MINOR**: Addition of a new principle or material expansion of an existing
  one.
- **PATCH**: Clarifications, wording improvements, or non-semantic refinements.

All feature `plan.md` files MUST include a Constitution Check section that
verifies compliance with all five Core Principles before implementation begins.
Any violation requires a justification entry in the Complexity Tracking table.

The development workflow (self-review step) MUST be followed for every feature.
Complexity MUST be justified; unsupported complexity is a constitution
violation.

**Version**: 1.0.0 | **Ratified**: 2026-03-25 | **Last Amended**: 2026-03-25
