# Contributing to Renaissance

Welcome! This guide will help you understand our codebase and contribute effectively.

## Quick Start

1. **Read the Development Guide**: See [`docs/DEVELOPMENT-GUIDE.md`](docs/DEVELOPMENT-GUIDE.md) for comprehensive patterns and standards
2. **Follow the Code Review Checklist**: Found at the end of the Development Guide

## Core Principles

### 1. Store Access Patterns

**Domain components** (pages, features) access stores directly. **Generic UI components** (cards, buttons) use props. Don't prop-drill domain data through feature components.

```vue
✅ Domain: const abilities = computed(() => abilitiesStore.abilities) ✅ UI
Component: defineProps({ ability: Object }) ❌ Prop drilling: Parent → Child →
Grandchild with store data
```

### 2. Script Setup Everywhere

All components use `<script setup>` syntax, not Options API.

### 3. Design Tokens Always

Never hardcode colors, spacing, or other design values. Always use CSS variables from `design-tokens.css`.

```css
✅ padding: var(--space-md);
❌ padding: 16px;
```

### 4. Composables for Reusable Logic

Extract common patterns to composables, but avoid over-abstraction. See examples in [`packages/frontend/src/composables/`](packages/frontend/src/composables/).

### 5. Cleanup Side Effects

Always cleanup listeners, observers, and timers in `onUnmounted`.

## Code Standards

- **No wrapper functions**: Don't wrap functions that just call another function
- **Computed for derived state**: Not methods
- **HeroIcons preferred**: Over Unicode/emojis where practical
- **Semantic events**: Emit actions, not implementation details
- **Self-documenting code**: Minimal comments, no JSDoc (except types)
- **Semantic HTML**: Use `<button>` over `<div @click>` when appropriate

## Project Structure

```
packages/
  frontend/
    src/
      components/
        ui/              # Reusable UI primitives
        features/        # Feature-specific components
        editModals/      # Modal components
      pages/             # Route pages
      stores/            # Pinia stores
      composables/       # Reusable composition functions
      styles/            # Global styles and design tokens
```

## Before Submitting PR

Run through the [Code Review Checklist](docs/DEVELOPMENT-GUIDE.md#code-review-checklist):

- Architecture patterns followed (store access, modal ownership)
- No anti-patterns present (wrapper functions, duplicate state)
- Design tokens used consistently
- Code is self-documenting with minimal comments
- Side effects cleaned up in onUnmounted

## Learning Resources

**Pattern Examples**:

- Modal patterns: `EditAbilityModal.vue`, `SkillCheckModal.vue`
- Store patterns: `abilitiesStore.js`, `rulesStore.js`
- Composables: `useEditModalForm.js`, `useTooltip.js`
- Pages: `AbilitiesPage.vue`, `ArtPage.vue`

**Detailed Documentation**:

- [`docs/DEVELOPMENT-GUIDE.md`](docs/DEVELOPMENT-GUIDE.md) - Complete standards reference
- [`component-review-tracker.md`](component-review-tracker.md) - Component architecture notes

## Questions?

Check existing implementations first - they follow the patterns. The component review tracker documents architectural decisions and refactoring rationale for every component.
