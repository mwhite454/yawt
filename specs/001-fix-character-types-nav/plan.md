# Implementation Plan: Fix Character Types Navigation

**Branch**: `001-fix-character-types-nav` | **Date**: 2026-02-17 | **Spec**: /specs/001-fix-character-types-nav/spec.md
**Input**: Feature specification from `/specs/001-fix-character-types-nav/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: TypeScript 5.9.2 / Deno 2.6.4+  
**Framework**: Fresh 1.6.1 (SSR with islands), Preact 10.19.2  
**Styling**: Tailwind CSS + daisyUI (yawt theme)  
**Storage**: Deno KV (key-value database), optional R2 (images)  
**Authentication**: GitHub OAuth2 via @deno/kv-oauth  
**Testing**: Manual (browser + curl) - no automated tests currently  
**Target Platform**: Web (mobile-first responsive), Deno Deploy  
**Performance Goals**: SSR <200ms, FCP <1s on 3G, island hydration <100ms  
**Constraints**: Deno Deploy size limits, mobile-first UX, SSR-first architecture  
**Scale/Scope**: Single-user data isolation, thousands of scenes/characters per user

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                         | Check                                                                                                            | Status                       |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| **I. Agent-Assisted Development** | Feature leverages AI agents for implementation? Agent instructions updated in `.github/copilot-instructions.md`? | ✅ PASS |
| **II. SSR-First Architecture**    | New routes use server-side rendering? Interactive components go in `islands/`? No SPA patterns?                  | ✅ PASS |
| **III. Minimal Dependencies**     | New dependencies justified? Deno built-ins checked first? Large npm packages use dynamic imports?                | ✅ PASS |
| **IV. Mobile-First UX**           | All layouts responsive with Tailwind breakpoints? Touch targets ≥44px? Mobile input types correct?               | ✅ PASS |
| **V. Code Quality Standards**     | Code will pass `deno fmt`, `deno lint`, type checking? TypeScript used? Path aliases used?                       | ✅ PASS |
| **VI. Data Ownership & Privacy**  | User data stored with user ID prefix? No tracking/analytics added? Export capability maintained?                 | ✅ PASS |

**Overall Gate**: ✅ ALL PASS → Proceed | ⚠ REVIEW → Document justification below | ❌ ANY FAIL → Revise spec

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

YAWT uses Fresh framework's file-based routing structure. Place feature code as follows:

```text
routes/
├── [feature]/
│   ├── index.tsx           # Main feature page (SSR)
│   ├── [id].tsx           # Dynamic route (SSR)
│   └── _layout.tsx        # Layout wrapper (optional)
└── api/
    └── [feature]/
        ├── index.ts        # GET/POST collection
        └── [id].ts         # GET/PUT/DELETE individual

islands/
└── [FeatureName].tsx       # Client-side interactive components

components/
└── [FeatureName].tsx       # Server-side components

utils/
├── [feature]/
│   ├── types.ts           # TypeScript types
│   ├── keys.ts            # Deno KV key helpers
│   └── validation.ts      # Business logic
└── http.ts                # Shared HTTP utilities (existing)

static/
└── [feature]/
    └── *.svg              # Feature-specific assets
```

**Structure Notes**:

- Routes are file-based: `routes/books/index.tsx` → `/books`
- API routes follow REST: `routes/api/books/[id].ts` handles `/api/books/:id`
- Islands hydrate on client: `islands/BookEditor.tsx`
- Components render on server: `components/BookCard.tsx`
- Utils contain business logic, not UI
- No test directory currently (manual testing via browser/curl)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
