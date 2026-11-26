# React & Design System Component Audit Tracker

- **Target Scope**: `{{DIRECTORY_OR_FEATURE_SCOPE}}`
- **Last Verified Build / Typecheck**: `{{PASS / FAIL — TIMESTAMP}}`

## 1. Coverage Summary
| Metric | Count |
| :--- | :--- |
| **Total Components Identified** | {{0}} |
| **Verified (Compliant & Tested)** | {{0}} |
| **Refactored (Awaiting Verification)** | {{0}} |
| **Needs Changes** | {{0}} |
| **Intentionally Unchanged** | {{0}} |
| **Blocked** | {{0}} |
| **Not Audited** | {{0}} |

---

## 2. Dependency-Ordered Component Inventory

> **Status Definitions**:
> - `not-audited`: Discovered via file/import scan, not yet inspected.
> - `audited`: Inspected; violations documented below.
> - `needs-changes`: Queued for refactoring in upcoming batch.
> - `refactored`: Code updated; awaiting full consumer & typecheck verification.
> - `verified`: Implementation and all downstream consumers pass typecheck, tests, and design rules.
> - `intentionally-unchanged`: Audited and already compliant, or explicitly out of scope (reason required).
> - `blocked`: Cannot refactor due to external dependency or pending product decision (reason required).

| Component / Hook | File Path | Layer (`Primitive` / `Compound` / `Feature`) | Consumers Count | Status | Findings / Action Taken |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `{{Button}}` | `{{src/components/ui/button.tsx}}` | `Primitive` | {{42}} | `verified` | {{Unified height tokens & stripped border}} |
| `{{NumberInput}}` | `{{src/components/ui/number-input.tsx}}` | `Compound` | {{8}} | `needs-changes` | {{Uses hardcoded h-[38px] and derived useEffect}} |

---

## 3. Completed Refactoring Batches Log

### Batch {{N}}: {{Batch Title, e.g., Core Form Control Primitives}}
- **Files Modified**: `{{file1.tsx, file2.tsx}}`
- **Downstream Consumers Inspected**: `{{consumer1.tsx, consumer2.tsx}}`
- **Validation Executed**:
  - Typecheck (`{{CMD}}`): `{{PASS/FAIL}}`
  - Test Suite (`{{CMD}}`): `{{PASS/FAIL}}`
- **Remaining Risks / Follow-ups**: {{None | Specific edge case}}
