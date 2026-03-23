---
name: Angular migration completed
description: The daterangepicker project was fully converted from a jQuery UMD plugin to an Angular v21 component library
type: project
---

The jQuery daterangepicker has been converted to an Angular v21 component library (`ng-daterangepicker`).

**Why:** User requested conversion per CreatePlan.md requirements.

**How to apply:** The project is now an Angular workspace. Use `ng build ng-daterangepicker` and `ng serve demo` — not the old `npm start`.

Key facts:
- Library lives in `projects/ng-daterangepicker/`
- Demo app lives in `projects/demo/`
- jQuery is fully removed
- Bootstrap + dayjs retained
- No Angular CDK — native Renderer2 positioning used
- `ViewEncapsulation.None` on the host component is intentional
- Built to `dist/ng-daterangepicker/` via ng-packagr
