<!-- BEGIN:glidesheet-agent-rules -->
# GlideSheet

Before writing or modifying GlideSheet code, read the skill at `skills/glidesheet/SKILL.md` and the reference docs in `skills/glidesheet/references/`. Your training data may be outdated — the skill files are the source of truth for the API.

Key rules:
- Always import both `BottomSheet` from `'glidesheet'` and `'glidesheet/style.css'`.
- Use the compound component pattern: `Root > Portal > Overlay + Content > Handle + Title + children`.
- Put `className` on `Content`, not `Root` — Root has no DOM output.
- Always include `Title` for accessibility (use `className="sr-only"` to hide visually).
- Overlay only renders in modal mode. Omit it when `modal={false}`.
- For nested sheets, use `NestedRoot` with its own `Portal`, `Overlay`, and `Content`.
- `FloatingBar` is a sibling of `Content` inside `Portal`, not a child of `Content`.
<!-- END:glidesheet-agent-rules -->
