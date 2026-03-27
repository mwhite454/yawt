<!--
  Sync Impact Report:
  - Version: initial → 1.0.0
  - Ratification: 2026-02-17
  - Principles Established:
    * I. Agent-Assisted Development
    * II. SSR-First Architecture
    * III. Minimal Dependencies
    * IV. Mobile-First UX
    * V. Code Quality Standards (NON-NEGOTIABLE)
    * VI. Data Ownership & Privacy
  - Templates Status:
    ✅ .specify/templates/plan-template.md (verified compatible)
    ✅ .specify/templates/spec-template.md (verified compatible)
    ✅ .specify/templates/tasks-template.md (not modified - compatible)
  - Follow-up: None
-->

# YAWT Constitution

## Core Principles

### I. Agent-Assisted Development

This is a single-developer project where AI agents (GitHub Copilot, Claude, etc.)
perform the majority of code generation, refactoring, and implementation work.

**Rules:**

- All agent-generated code MUST pass Deno's built-in formatter and linter
- Agent instructions MUST be documented in `.github/copilot-instructions.md`
- Agents MUST follow the coding patterns established in existing codebase
- Human developer reviews and validates agent outputs before merging
- Complex features SHOULD use spec-driven development workflow (specify → plan → tasks → implement)

**Rationale:** Maximize development velocity while maintaining code quality through
automated checks. The single developer focuses on architecture, design decisions,
and validation rather than writing boilerplate.

### II. SSR-First Architecture

All pages MUST render on the server by default. Client-side interactivity is added
selectively through Fresh framework's island architecture.

**Rules:**

- New routes MUST use server-side rendering (Fresh's default)
- Interactive components MUST be placed in `islands/` directory
- Islands MUST be small, focused, and independently functional
- Server components go in `components/` directory
- NO single-page application (SPA) patterns - each route serves HTML
- State management MUST prefer URL parameters and form submissions over client-side state

**Rationale:** SSR provides fast initial page loads, better SEO, works without
JavaScript, and reduces complexity. Island architecture allows progressive enhancement
where needed while maintaining server-first principles.

### III. Minimal Dependencies

Prefer Deno's built-in capabilities and standard library over external packages.
When external packages are needed, prefer Deno-native solutions over npm packages.

**Rules:**

- MUST justify any new dependency with clear rationale
- MUST check Deno standard library (`$std/`) before adding external package
- For npm packages, MUST use dynamic imports for large dependencies (>1MB)
- MUST document why Deno built-ins are insufficient before adding dependency
- NO framework-of-the-month chasing - stick with established choices (Fresh, Preact, Tailwind, daisyUI)

**Rationale:** Reduce build size for Deno Deploy, minimize maintenance burden,
improve security posture, and leverage Deno's modern standard library.

### IV. Mobile-First UX

All interfaces MUST work seamlessly on mobile devices. The application is designed
for authors who write from anywhere, often on phones or tablets.

**Rules:**

- All layouts MUST be responsive (mobile → tablet → desktop)
- Touch targets MUST be minimum 44px for interactive elements
- Forms MUST use appropriate mobile input types (`type="email"`, etc.)
- Navigation MUST be thumb-friendly on mobile devices
- CSS MUST use Tailwind's responsive breakpoints (`sm:`, `md:`, `lg:`)
- daisyUI components MUST render correctly on mobile viewports
- Test on actual mobile devices, not just browser DevTools

**Rationale:** Authors need to capture ideas anywhere, anytime. Mobile-first ensures
the core experience works on the most constrained devices.

### V. Code Quality Standards (NON-NEGOTIABLE)

All code MUST pass automated quality checks before commit. No exceptions.

**Rules:**

- MUST run and pass `deno fmt` before every commit
- MUST run and pass `deno lint` before every commit
- MUST pass TypeScript type checking (`deno check`)
- MUST use TypeScript for all new code (no JavaScript files)
- MUST follow Deno's style guide (enforced by formatter)
- MUST use path aliases from `deno.json` (`@components/`, `@islands/`, `@utils/`)
- Build artifacts (`_fresh/`, `static/styles.css`) MUST be gitignored

**Rationale:** Automated enforcement prevents bikeshedding and ensures consistency.
Single developer must maintain high standards to avoid technical debt accumulation.

### VI. Data Ownership & Privacy

Users MUST own their data. The application is a tool, not a data silo.

**Rules:**

- Authentication MUST use GitHub OAuth (external identity provider)
- User data MUST be stored in Deno KV with user ID as key prefix
- Users MUST be able to export all their data
- Images (optional) stored in R2 MUST use user-scoped paths
- NO analytics or tracking beyond error logging
- NO selling or sharing user data
- Session cookies MUST be HTTP-only and secure

**Rationale:** Authors need to trust their creative work is private and portable.
Align with user interests, not advertising or surveillance capitalism.

## Technology Stack Constraints

The following technologies are foundational and MUST NOT be replaced without
constitutional amendment:

**Runtime & Framework:**

- Deno 2.6.4+ (JavaScript/TypeScript runtime)
- Fresh 1.6.1+ (server-side rendering framework)
- Preact 10.19.2+ (lightweight React alternative for islands)

**UI & Styling:**

- Tailwind CSS (utility-first CSS)
- daisyUI (Tailwind component library) with "yawt" custom theme
- NO custom CSS frameworks or CSS-in-JS solutions

**Data & Authentication:**

- Deno KV (built-in key-value database)
- GitHub OAuth2 via @deno/kv-oauth
- Cloudflare R2 (optional, images only)

**Deployment:**

- Deno Deploy (primary production platform)
- MUST keep build artifacts under Deno Deploy size limits

**Rationale:** These choices are well-integrated, actively maintained, and align
with the minimal dependencies and SSR-first principles.

## Development Workflow

This section defines how features are developed and deployed.

**Branching Strategy:**

- `main` branch is production-ready and deployed automatically
- Feature branches named `feature-name` or `###-feature-name` for spec-driven features
- Breaking changes require `breaking-change-*` prefix in branch name

**Quality Gates (Pre-Commit):**

1. Code MUST pass `deno task check` (format, lint, type check)
2. Manual testing on `localhost:8000` (no automated tests currently)
3. For UI changes, test on mobile device or DevTools mobile view

**Deployment:**

- Deno Deploy monitors `main` branch and deploys automatically
- Production OAuth credentials configured in Deno Deploy dashboard
- NO manual deployment steps required

**Spec-Driven Development (for complex features):**

1. Create feature spec with `/speckit.specify` command
2. Generate implementation plan with `/speckit.plan` command
3. Optional: use `/speckit.clarify` to resolve ambiguities
4. Break down into tasks with `/speckit.tasks` command
5. Execute with `/speckit.implement` command or manual implementation
6. Optional: verify with `/speckit.analyze` for consistency checks

**Agent Guidance:**

- Primary agent instructions in `.github/copilot-instructions.md`
- Spec-kit commands available in `.github/agents/speckit.*.agent.md`
- daisyUI component rules in `.github/instructions/daisyui.instructions.md`

## Governance

**Authority:**

- This constitution supersedes all other development practices
- When constitution conflicts with external guidance, constitution wins
- Agent instructions in `.github/copilot-instructions.md` MUST align with constitution

**Amendment Process:**

- Constitutional changes require explicit version bump
- Use `/speckit.constitution` command to update constitution
- Version follows semantic versioning:
  - MAJOR: backward incompatible changes (remove/redefine principles)
  - MINOR: new principles or sections added
  - PATCH: clarifications, wording improvements, non-semantic changes
- All amendments MUST update "Last Amended" date
- Amendment MUST include sync impact report

**Enforcement:**

- Code quality standards enforced by `deno task check` (automated)
- Architecture principles enforced by code review (human)
- Complexity violations MUST be documented and justified in implementation plans
- When in doubt, refer to constitution first, then copilot-instructions.md

**Documentation References:**

- Runtime development guidance: `.github/copilot-instructions.md`
- Setup instructions: `SETUP.md`
- Contributing guidelines: `CONTRIBUTING.md`
- Feature specifications: `specs/###-feature-name/spec.md` (when using spec-driven development)

**Version**: 1.0.0 | **Ratified**: 2026-02-17 | **Last Amended**: 2026-02-17
