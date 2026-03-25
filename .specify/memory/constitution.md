# han-chat Constitution

## Core Principles

### I. Client-Only Architecture (NON-NEGOTIABLE)

The application MUST run entirely in the client (browser). There MUST be no
server-side components, no backend services, and no server-rendered pages
owned by this project. All data processing, state management, and logic MUST
execute in the user's browser.

- External third-party APIs (e.g., AI inference endpoints) are permitted; However, the app MUST remain functional (or degrade gracefully) when such endpoints are unavailable.
- Deployment MUST be achievable as a set of static files (HTML, CSS, JS,
  assets) served from any static host or opened directly from the filesystem.

**Rationale**: The client-only constraint is the defining architectural
boundary of this project. Violating it introduces operational complexity
(hosting, scaling, auth, cost)

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

- E2E tests MUST simulate real browser behaviour and MUST NOT mock the DOM or application logic.
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

## Technology Constraints

- **Runtime target**: Modern evergreen browsers (Chrome, Firefox, Safari,
  Edge — current and one prior major version).
- **Build output**: Static files only 
- **Storage**: Browser-native APIs only (localStorage, IndexedDB,
  sessionStorage, Cache API).
- **Testing stack**: Unit/integration tests and E2E tests. Test framework choice MUST be made at project initialisation and MUST NOT be changed mid-feature without a
  constitution amendment.
- **Network**: Fetch/WebSocket to third-party endpoints is permitted; any
  custom backend endpoint is prohibited.

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
verifies compliance with all four Core Principles before implementation begins.
Any violation requires a justification entry in the Complexity Tracking table.

The development workflow (self-review step) MUST be followed for every feature.
Complexity MUST be justified 

**Version**: 1.0.0 | **Ratified**: 2026-03-25 | **Last Amended**: 2026-03-25
