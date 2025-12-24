# Renaissance Development Guide

**Last Updated**: December 23, 2025  
**Purpose**: Document architectural patterns and code standards established during comprehensive codebase review

---

## Table of Contents

1. [Architecture Patterns](#architecture-patterns)
2. [Component Standards](#component-standards)
3. [State Management](#state-management)
4. [Composable Patterns](#composable-patterns)
5. [Styling Standards](#styling-standards)
6. [Code Quality Guidelines](#code-quality-guidelines)
7. [Accessibility Requirements](#accessibility-requirements)
8. [Common Anti-Patterns](#common-anti-patterns)

---

## Architecture Patterns

### Domain-Driven Component Design

**Domain components** (pages, features) should access their domain stores directly rather than receiving data through props.

✅ **Good - Direct Store Access (Domain Components)**:

```vue
<script setup>
import { useAbilitiesStore } from '@/stores/abilitiesStore'

const abilitiesStore = useAbilitiesStore()
const abilities = computed(() => abilitiesStore.abilities)
</script>
```

❌ **Avoid - Unnecessary Prop Drilling (Domain Components)**:

```vue
<script setup>
// Parent fetches from store, passes as prop
defineProps({ abilities: Array })
</script>
```

**Generic UI components** (cards, buttons, dropdowns) use the traditional prop/emit pattern for maximum reusability:

```vue
<!-- Generic UI component receives data as props -->
<AbilityCard :ability="ability" @click="handleClick" />
```

**When to use props**: Pass down **configuration**, **behavior flags**, or **data to generic UI components**. Don't prop-drill domain data through multiple feature components.

### Component Communication Patterns

**Parent-Child Communication**:

- **Props down**: Configuration, behavior flags, IDs
- **Events up**: User actions that require parent coordination
- **Stores**: Shared data access

✅ **Good - Semantic Events**:

```vue
// Child emits semantic event emit('card-click', ability.id) // Parent decides
what to do function handleAbilityCardClick(id) { openEditModal(id) }
```

❌ **Avoid - Implementation Events**:

```vue
// Child emits implementation detail emit('open-edit-modal', ability)
```

### Modal Ownership

Components that contain modals should own them completely.

✅ **Good - Modal Self-Contained**:

```vue
<template>
  <button @click="openModal">Edit</button>
  <EditModal v-if="showModal" @close="closeModal" />
</template>

<script setup>
const showModal = ref(false)
const openModal = () => (showModal.value = true)
const closeModal = () => (showModal.value = false)
</script>
```

❌ **Avoid - Modal State in Parent**:

```vue
<!-- Parent manages child's modal -->
<Child @open-modal="showModal = true" />
<Modal v-if="showModal" />
```

---

## Component Standards

### Script Setup Syntax

All components use `<script setup>` syntax (not Options API).

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'

// Props and emits at top
const props = defineProps({
  /* ... */
})
const emit = defineEmits(['update', 'close'])

// Composables
const store = useMyStore()

// Local state
const count = ref(0)

// Computed properties
const doubled = computed(() => count.value * 2)

// Methods
const increment = () => count.value++

// Lifecycle hooks last
onMounted(() => {
  // initialization
})
</script>
```

### Component Organization

**Standard order**:

1. Imports (Vue, stores, composables, components, utilities)
2. Props and emits definitions
3. Composable usage
4. Local reactive state (ref, reactive)
5. Computed properties
6. Methods/functions
7. Lifecycle hooks (onMounted, onUnmounted, watch)

### Template Formatting

Prettier handles all formatting automatically. Long component tags with many props will be formatted based on line length - trust Prettier's decisions rather than manually formatting.

### Computed Properties vs Methods

Use computed for derived state, methods for actions.

✅ **Good - Computed for Derived State**:

```vue
const filteredItems = computed(() => { return items.value.filter(item =>
item.active) })
```

❌ **Avoid - Method Returning Derived State**:

```vue
function getFilteredItems() { return items.value.filter(item => item.active) }
// Called in template: {{ getFilteredItems() }}
```

### No Wrapper Functions

Don't create wrapper functions that just call another function.

✅ **Good - Direct Binding**:

```vue
<button @click="store.deleteItem(id)">Delete</button>
```

❌ **Avoid - Unnecessary Wrapper**:

```vue
<button @click="handleDelete">Delete</button>

<script setup>
const handleDelete = () => store.deleteItem(id)
</script>
```

**Exception**: Wrapper is needed when adding logic (validation, confirmation, etc.).

---

## State Management

### Pinia Store Patterns

**Singleton Stores** (require fetch):

```javascript
export const useAbilitiesStore = defineStore('abilities', () => {
  const abilities = ref([])

  async function fetchAbilities() {
    if (abilities.value.length > 0) return // Already loaded
    const data = await api.getAbilities()
    abilities.value = data
  }

  return { abilities, fetchAbilities }
})
```

**User Stores** (load on auth):

```javascript
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  function setUser(userData) {
    user.value = userData
  }

  return { user, setUser }
})
```

### Store Selection Patterns

For stores managing a collection, use `selectedItem` + `selectItem(id)` pattern:

```javascript
export const useRulesStore = defineStore('rules', () => {
  const sections = ref([])
  const selectedSection = ref(null)

  function selectSection(id) {
    selectedSection.value = sections.value.find((s) => s.id === id)
  }

  function deselectSection() {
    selectedSection.value = null
  }

  return { sections, selectedSection, selectSection, deselectSection }
})
```

### When to Use Props vs Store

| Use Props                           | Use Store                              |
| ----------------------------------- | -------------------------------------- |
| Component configuration             | Application data                       |
| Parent-specific behavior            | Shared across features                 |
| Display flags (canEdit, isSelected) | Domain entities (abilities, equipment) |
| One-time IDs                        | Collections that change                |

---

## Composable Patterns

### Singleton vs Instance Composables

**Singleton Composables** (shared state):

```javascript
// Shared state across all components
const dicePool = ref([])

export function useEngagementRoll() {
  // State is shared - all components see same dicePool
  return { dicePool }
}
```

**Instance Composables** (separate state):

```javascript
export function useEditModal() {
  // Each component gets its own state
  const showModal = ref(false)
  const openModal = () => (showModal.value = true)
  const closeModal = () => (showModal.value = false)

  return { showModal, openModal, closeModal }
}
```

### Composable Responsibilities

Good composables:

- **Encapsulate reusable logic** (not just state)
- **Have clear, single purpose** (useTooltip, useUnsavedChanges)
- **Return minimal API** (only what consumers need)
- **Handle cleanup** (remove listeners in onUnmounted)

❌ **Avoid creating composables that**:

- Just wrap a single ref
- Are only used once
- Mix unrelated concerns

### Common Composable Patterns

**Modal Management**:

```javascript
export function useModal() {
  const showModal = ref(false)

  const openModal = () => (showModal.value = true)
  const closeModal = () => (showModal.value = false)

  return { showModal, openModal, closeModal }
}
```

**Unsaved Changes**:

```javascript
export function useUnsavedChanges() {
  const hasChanges = computed(() => {
    return JSON.stringify(original) !== JSON.stringify(edited)
  })

  const confirmIfUnsaved = (callback) => {
    if (hasChanges.value && !confirm('Discard changes?')) return
    callback()
  }

  return { hasChanges, confirmIfUnsaved }
}
```

**Edit Mode**:

```javascript
export function useEditMode() {
  const isEditMode = ref(false)
  const toggleEditMode = () => (isEditMode.value = !isEditMode.value)

  return { isEditMode, toggleEditMode }
}
```

---

## Styling Standards

### Design Tokens

**Always use CSS variables** from `design-tokens.css`, never hardcoded values.

✅ **Good - Design Tokens**:

```css
.card {
  background-color: var(--color-bg-primary);
  padding: var(--space-md);
  border-radius: var(--radius-5);
  font-size: var(--font-size-14);
  transition: var(--transition-background);
}
```

❌ **Avoid - Hardcoded Values**:

```css
.card {
  background-color: #1a1a1a;
  padding: 16px;
  border-radius: 5px;
  font-size: 14px;
  transition: background-color 0.2s;
}
```

### Design Token Categories

- **Colors**: `--color-bg-primary`, `--color-text-primary`, `--color-accent`
- **Spacing**: `--space-xs`, `--space-sm`, `--space-md`, `--space-lg`
- **Radii**: `--radius-5`, `--radius-10`, `--radius-15`
- **Typography**: `--font-size-12`, `--font-size-14`, `--font-family-primary`
- **Shadows**: `--shadow-elevation-sm`, `--shadow-elevation-md`
- **Transitions**: `--transition-background`, `--transition-transform`
- **Z-Index**: `--z-dropdown`, `--z-modal`, `--z-tooltip`

### Scoped Styles

All component styles should be scoped unless genuinely global.

```vue
<style scoped>
/* Component-specific styles */
.card {
  /* ... */
}
</style>
```

**When to use `:deep()`**: Only when styling slotted content or third-party components you can't control.

### Shared Styles

Extract common patterns to shared CSS files:

- `character-sheet-item-table.css` - Table layouts used by equipment/abilities
- `rich-text-content.css` - Rich text editor display styles

---

## Code Quality Guidelines

### Lifecycle and Cleanup

Always cleanup side effects in `onUnmounted`:

✅ **Good - Cleanup**:

```vue
<script setup>
const observer = new IntersectionObserver(callback)

onMounted(() => {
  observer.observe(element.value)
})

onUnmounted(() => {
  observer.disconnect()
})
</script>
```

❌ **Avoid - Memory Leaks**:

```vue
<script setup>
onMounted(() => {
  // Starts observer but never stops it
  new IntersectionObserver(callback).observe(element.value)
})
</script>
```

### Watch-Based Listeners

Use `watch` to manage event listeners that should only be active conditionally:

✅ **Good - Conditional Listener**:

```vue
<script setup>
const isOpen = ref(false)

watch(isOpen, (open) => {
  if (open) {
    document.addEventListener('click', handleClickOutside)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
```

❌ **Avoid - Always-On Listener**:

```vue
<script setup>
onMounted(() => {
  // Listener runs even when dropdown is closed
  document.addEventListener('click', handleClickOutside)
})
</script>
```

### Error Handling

Stores handle error logging. Components don't need try/catch unless handling errors differently.

✅ **Good - Let Store Handle**:

```vue
async function saveAbility() { await abilitiesStore.updateAbility(ability) //
Store logs errors }
```

❌ **Avoid - Redundant Try/Catch**:

```vue
async function saveAbility() { try { await abilitiesStore.updateAbility(ability)
} catch (error) { console.error(error) // Store already does this } }
```

### Constants Over Magic Numbers

Extract magic numbers to named constants:

✅ **Good - Named Constants**:

```javascript
const MAX_VISIBLE_DICE = 10
const DICE_ANIMATION_DURATION = 2000

if (dice.length > MAX_VISIBLE_DICE) {
  // Show modal
}
```

❌ **Avoid - Magic Numbers**:

```javascript
if (dice.length > 10) {
  // Why 10? What does this mean?
}
```

### Comments and Documentation

**Philosophy**: Code should be self-documenting. Write clear, readable code that explains itself.

#### No JSDoc Comments

❌ **Avoid JSDoc** (except in type definition files):

```javascript
/**
 * Calculates the total of all dice
 * @param {Array} dice - Array of dice values
 * @returns {number} The sum
 */
function calculateTotal(dice) {
  return dice.reduce((sum, die) => sum + die, 0)
}
```

✅ **Write Self-Documenting Code**:

```javascript
// Function name and clear logic explain themselves
function calculateDiceTotal(dice) {
  return dice.reduce((sum, die) => sum + die, 0)
}
```

#### When to Comment

Comments are appropriate for:

1. **Explaining non-obvious logic**:

```javascript
// Engagement dice are marked as expended after being committed to an attack
// This prevents them from being used again in the same round
function markDiceExpended(diceIds) {
  // ...
}
```

2. **Game-specific rules or mechanics**:

```javascript
// Per Renaissance rules, Novizio characters start with 3 abilities
const NOVIZIO_STARTING_ABILITIES = 3
```

3. **Template organization** (for clarity):

```vue
<template>
  <div class="character-sheet">
    <!-- Character Profile -->
    <CharacterProfile />

    <!-- Core Abilities -->
    <CoreAbilityColumns />

    <!-- Equipment & Abilities -->
    <EquipmentTable />
  </div>
</template>
```

4. **Organizing large style blocks**:

```css
/* ==================== */
/* Layout */
/* ==================== */

.container {
  /* ... */
}

/* ==================== */
/* Typography */
/* ==================== */

.heading {
  /* ... */
}
```

❌ **Avoid Redundant Comments**:

```javascript
// Set count to 0
const count = ref(0)

// Increment the count
function increment() {
  count.value++
}
```

---

## Accessibility (Future Enhancement)

Accessibility features are being implemented progressively. Current focus is on core functionality, with comprehensive accessibility improvements planned for future iterations.

### Current Best Practices

**Semantic HTML** - Use when possible:

```vue
✅
<button @click="handleClick">Submit</button>
❌
<div @click="handleClick">Submit</div>
```

**ARIA Labels** - Added to some icon-only buttons:

```vue
<button @click="close" aria-label="Close modal">
  <XMarkIcon />
</button>
```

### Planned Improvements

The following will be implemented in future development phases:

- Comprehensive keyboard navigation for all interactive elements
- Consistent focus indicators across all components
- ARIA labels for all icon-only controls
- Screen reader announcements for dynamic content
- Color contrast compliance
- Reduced motion preferences

**Note**: When adding new interactive elements, prefer semantic HTML (`<button>`, `<a>`) over `<div>` with click handlers where practical.

---

## Common Anti-Patterns

### ❌ Props Destructuring Without toRefs

```javascript
// WRONG - Loses reactivity
const { ability } = defineProps(['ability'])

// RIGHT - Maintains reactivity
const props = defineProps(['ability'])
// Access as props.ability in script, ability in template
```

### ❌ Creating Duplicate State

```javascript
// WRONG - Duplicates store state
const abilities = ref([])
onMounted(async () => {
  abilities.value = await abilitiesStore.fetchAbilities()
})

// RIGHT - Use store directly
const abilities = computed(() => abilitiesStore.abilities)
```

### ❌ Template Logic That Should Be Computed

```vue
<!-- WRONG - Complex logic in template -->
<div v-if="items.filter(i => i.active && i.count > 0).length > 5">

<!-- RIGHT - Extract to computed -->
<div v-if="hasMultipleActiveItems">

<script setup>
const hasMultipleActiveItems = computed(() => {
  return items.value.filter(i => i.active && i.count > 0).length > 5
})
</script>
```

### ❌ Using Unicode/Emoji Icons

Prefer HeroIcons for consistency and scalability:

```vue
<!-- Avoid -->
<button>✓</button>
<button>☰</button>

<!-- Better -->
<button><CheckIcon /></button>
<button><Bars3Icon /></button>
```

**Exception**: Unicode symbols are acceptable in pseudo-elements (::before, ::after) where components can't be used.

### ❌ Inline Styles for Design System Values

```vue
<!-- WRONG -->
<div style="padding: 16px; background: #1a1a1a">

<!-- RIGHT -->
<div class="card">
<style scoped>
.card {
  padding: var(--space-md);
  background: var(--color-bg-primary);
}
</style>
```

### ❌ Over-Abstraction

```javascript
// WRONG - Unnecessary wrapper component
<LeftColumn><Content /></LeftColumn>

// RIGHT - Direct structure
<div class="left-column"><Content /></div>
```

### ❌ Unnecessary Wrappers for Third-Party Components

```vue
<!-- WRONG - Just wrapping a library -->
<template>
  <VueDraggable v-model="items">
    <slot />
  </VueDraggable>
</template>

<!-- RIGHT - Use library directly -->
<VueDraggable v-model="items">
  <Component />
</VueDraggable>
```

---

## Code Review Checklist

When reviewing code or writing new features, check:

**Architecture**:

- [ ] Domain components access stores directly (no prop drilling through features)
- [ ] Generic UI components use prop/emit pattern
- [ ] Modal ownership is clear and self-contained
- [ ] Events are semantic, not implementation-specific
- [ ] Composables have single, clear purpose

**Code Quality**:

- [ ] No wrapper functions without added logic
- [ ] Computed properties used for derived state
- [ ] No magic numbers (use named constants)
- [ ] Cleanup in onUnmounted for side effects
- [ ] Code is self-documenting (minimal comments)
- [ ] No JSDoc comments (except type definitions)

**Styling**:

- [ ] All values use design tokens
- [ ] Styles are scoped appropriately
- [ ] HeroIcons preferred over Unicode/emoji

**State Management**:

- [ ] Props used appropriately (config for domain, data for UI components)
- [ ] No duplicate state
- [ ] Proper computed vs ref usage

---

## Getting Help

**Questions about patterns?** Check existing implementations:

- **Modal patterns**: `EditAbilityModal.vue`, `SkillCheckModal.vue`
- **Composable patterns**: `useEditModalForm.js`, `useTooltip.js`, `useUnsavedChanges.js`
- **Store patterns**: `abilitiesStore.js`, `rulesStore.js`, `rollsStore.js`
- **Layout patterns**: `ConceptsLayout.vue`, `ItemCardsLayout.vue`

**Component examples by type**:

- **UI Primitives**: `ActionButton.vue`, `FloatingActionButton.vue`, `ChipTag.vue`
- **Cards**: `AbilityCard.vue`, `EquipmentCard.vue`, `ConceptCard.vue`
- **Tables**: `AbilitiesTable.vue`, `EquipmentTable.vue`, `EngagementTable.vue`
- **Pages**: `AbilitiesPage.vue`, `RulesPage.vue`, `ArtPage.vue`

See `component-review-tracker.md` for detailed notes on every component's architecture and refactoring history.
