---
name: ionic-stitch-supabase
description: "Build Ionic features with Stitch-style UI composition backed by Supabase. Use when planning or implementing auth, relational data flows, role-aware screens, and normalized data boundaries without duplicating derived state."
argument-hint: "Describe the feature slice to build (for example: enrollment intake, registrar approval, parent linking)."
---

# Ionic + Stitch + Supabase Feature Workflow

## Scope
This skill is workspace-scoped for school operations workflows.
- Treat "Stitch" as a deliberate component-composition style (modular sections, clear seams, reusable primitives), not a requirement for a specific third-party package.
- Apply school-domain constraints by default: admissions, registrar approval, student records, parent linking, class/teacher assignment, requirements tracking, and reporting metadata.
- If asked to generalize outside school operations, keep the same architecture rules but do not loosen persistent-vs-derived data boundaries.

## Outcome
Produce a production-ready feature slice that:
- Uses Ionic UI patterns and reusable view components
- Keeps business logic separate from UI and data access
- Uses Supabase as source of truth for persistent school records
- Avoids storing duplicated derived values
- Includes role-aware authorization and clear completion checks

## When To Use
Use this skill when you need to:
- Add a new feature that touches app UI and Supabase data
- Refactor mixed page logic into services and helpers
- Introduce role-specific behavior (admin, registrar, teacher, parent, student)
- Validate whether data should be persisted or computed on demand

## Inputs
Gather these inputs first:
- Feature goal and user role(s)
- Required persistent entities and relationships
- Non-persistent outputs (suggestions, computed summaries, staged workflow state)
- Acceptance criteria and test scenarios

## Required Outputs
Produce these artifacts for every invocation:
- Feature boundary brief: intent, actors, in/out scope, and success criteria
- Persistence matrix: entity/field list marked as persistent, derived, or transient
- Role-operation matrix: read/write/approve actions by role
- Service contract draft: methods, inputs, outputs, and failure modes
- Validation checklist: done criteria mapped to test scenarios

## Procedure
1. Define the feature slice and boundaries.
- Write one sentence for user intent and one sentence for success criteria.
- List touched entities and mark each as persistent or derived.
- Confirm this slice can ship independently.

2. Design the data contract first.
- Model normalized Supabase tables/relations for source-of-truth records only.
- Keep derived values out of persistence unless there is a proven reporting or audit need.
- Document read/write operations per role.

3. Decide authorization and review gates.
- Map auth state and role checks for each operation.
- If workflow has approvals, define status transitions explicitly.
- Add row-level security expectations before writing UI logic.

4. Implement data access in a dedicated service layer.
- Create feature services for queries, commands, and transactional flows.
- Keep page components free from direct Supabase calls.
- Return typed results shaped for UI consumption.

5. Implement business logic in a separate workflow layer.
- Place validations, branching, and automation rules in reusable helpers.
- Keep side effects explicit and isolated.
- Ensure automation outputs remain transient unless explicitly approved for persistence.

6. Build Ionic screens using Stitch-style composition.
- Compose small, reusable UI sections for forms, status panels, and action bars.
- Keep components stateless where possible and drive behavior from props/state.
- Preserve mobile-first layouts and responsive behavior.

7. Connect UI to services through clear state transitions.
- Represent loading, empty, success, and failure states explicitly.
- Prevent optimistic updates from diverging from Supabase source-of-truth state.
- Surface approval and role errors with actionable messages.

8. Validate with completion checks.
- Data integrity: no duplicate persistent derived data.
- Separation: UI, business logic, and data access remain decoupled.
- Authorization: role checks and approval states enforced end-to-end.
- UX: key path is usable on mobile and desktop.
- Reliability: happy path and failure path tested.

9. Publish implementation packet.
- Output the five required artifacts in a single response sectioned by heading.
- Include explicit assumptions and open risks.
- Provide next actions in priority order.

## Branching Guide
- If data is canonical and auditable: persist in Supabase.
- If data is suggestion, temporary workflow state, or dashboard summary: compute in app logic.
- If operation mutates multiple entities: use a transactional or idempotent workflow strategy.
- If feature crosses many roles: implement role matrix tests before UI polish.

## Definition Of Done
A slice is done when:
- Persistent schema changes (if any) are minimal, normalized, and justified.
- Services expose stable contracts and pages do not directly query Supabase.
- Role/approval constraints are enforced and tested.
- Derived values are computed, not redundantly stored.
- User acceptance scenarios pass for target roles.
- All required output artifacts are complete and internally consistent.

## Example Prompts
- Build an enrollment intake slice with Ionic forms and Supabase persistence rules.
- Refactor registrar approval flow into service and workflow layers.
- Add parent account linking after student approval with role-safe checks.
- Evaluate whether requirement status summary should be persisted or computed.
