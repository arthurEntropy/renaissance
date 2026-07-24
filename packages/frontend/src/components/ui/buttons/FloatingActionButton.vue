<template>
    <button type="button"
        :class="['fab', `fab--${props.variant}`, `fab--${props.size}`, `fab--${props.visibility}`, props.variant === FAB_TYPES.VISIBILITY && !props.isActive ? 'fab--visibility-off' : '', (props.variant === FAB_TYPES.TRAP_DROP || props.variant === FAB_TYPES.TRAP_THROW) && props.isActive ? 'fab--trap-active' : '']"
        :title="variantConfig.tooltip">
        <!-- Auto-calc variants: always show text instead of icon -->
        <span v-if="props.variant === FAB_TYPES.AUTO_CALC_ON" class="auto-text">AUTO</span>
        <span v-else-if="props.variant === FAB_TYPES.AUTO_CALC" class="auto-text auto-text--off">AUTO</span>
        <!-- Trap state variants: text labels, styling driven by isActive prop -->
        <span v-else-if="props.variant === FAB_TYPES.TRAP_DROP" class="trap-text">DROP</span>
        <span v-else-if="props.variant === FAB_TYPES.TRAP_THROW" class="trap-text">THROW</span>
        <component v-else :is="variantConfig.icon"
            :class="props.size === FAB_SIZES.SMALL ? 'fab__icon--small' : 'fab__icon--large'" />
    </button>
</template>

<script setup>
import { computed } from 'vue'
// Heroicons
import { PlusIcon, DocumentDuplicateIcon, PencilIcon, CheckIcon, XMarkIcon, TrashIcon, Bars3Icon, Cog6ToothIcon, ArrowPathIcon, BookOpenIcon, ChevronDoubleDownIcon, ChevronDoubleUpIcon, EyeIcon, EyeSlashIcon, ArrowUpIcon, ArrowDownIcon, BoltIcon, BoltSlashIcon, ArrowRightStartOnRectangleIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'
// Custom icons
import CrossedSwordsIcon from '@/assets/icons/characterSheet/crossed_swords.svg?component'
import DieIcon from '@/assets/icons/characterSheet/die.svg?component'
import InjuryIcon from '@/assets/icons/characterSheet/injury.svg?component'
import MartialTrainingIcon from '@/assets/icons/characterSheet/martial_training.svg?component'
import GratuitiIcon from '@/assets/icons/characterSheet/gratuiti.svg?component'
import SpectateIcon from '@/assets/icons/tabletop/spectate.svg?component'
// Constants
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const props = defineProps({
    variant: {
        type: String,
        required: true,
        validator: (value) => Object.values(FAB_TYPES).includes(value)
    },

    size: {
        type: String,
        default: FAB_SIZES.SMALL,
        validator: (value) => Object.values(FAB_SIZES).includes(value)
    },

    visibility: {
        type: String,
        default: FAB_VISIBILITIES.ON_HOVER,
        validator: (value) => Object.values(FAB_VISIBILITIES).includes(value)
    },

    isActive: {
        type: Boolean,
        default: true
    }
})

const FAB_TYPE_CONFIG = {
    [FAB_TYPES.EDIT]: { icon: PencilIcon, tooltip: 'Enter Edit Mode' },
    [FAB_TYPES.CONFIRM]: { icon: CheckIcon, tooltip: 'Save Changes' },
    [FAB_TYPES.ADD]: { icon: PlusIcon, tooltip: 'Add' },
    [FAB_TYPES.DUPLICATE]: { icon: DocumentDuplicateIcon, tooltip: 'Duplicate' },
    [FAB_TYPES.DELETE]: { icon: XMarkIcon, tooltip: '' }, // This variant is used for close and remove actions
    [FAB_TYPES.TRASH]: { icon: TrashIcon, tooltip: 'Delete permanently' },
    [FAB_TYPES.DRAG]: { icon: Bars3Icon, tooltip: 'Drag to reorder' },
    [FAB_TYPES.SETTINGS]: { icon: Cog6ToothIcon, tooltip: 'Settings' },
    [FAB_TYPES.REFRESH]: { icon: ArrowPathIcon, tooltip: 'Reset to Base Value' },
    [FAB_TYPES.DICE]: { icon: DieIcon, tooltip: 'Custom Dice Roll' },
    [FAB_TYPES.INITIATIVE]: { icon: CrossedSwordsIcon, tooltip: 'Roll Initiative' },
    [FAB_TYPES.INJURY]: { icon: InjuryIcon, tooltip: 'Roll Injury' },
    [FAB_TYPES.NOTES]: { icon: BookOpenIcon, tooltip: 'View GM Notes' },
    [FAB_TYPES.AUTO_CALC]: { tooltip: 'Manual mode (click to switch to auto)' },
    [FAB_TYPES.AUTO_CALC_ON]: { tooltip: 'Auto mode (click to switch to manual)' },
    [FAB_TYPES.EXPAND_ALL]: { icon: ChevronDoubleDownIcon, tooltip: 'Expand all' },
    [FAB_TYPES.COLLAPSE_ALL]: { icon: ChevronDoubleUpIcon, tooltip: 'Collapse all' },
    [FAB_TYPES.MOVE_UP]: { icon: ArrowUpIcon, tooltip: 'Move up' },
    [FAB_TYPES.MOVE_DOWN]: { icon: ArrowDownIcon, tooltip: 'Move down' },
    [FAB_TYPES.MARTIAL_TRAINING]: { icon: MartialTrainingIcon, tooltip: 'View Martial Training' },
    [FAB_TYPES.UNTRAINED]: { icon: MartialTrainingIcon, tooltip: 'You do not have martial training for this equipment item. If the item is a weapon, attack rolls made with it are ill-favored. If the item is armor or a shield, it only provides half its normal Defense bonus, rounded down.' },
    [FAB_TYPES.GRATUITI]: { icon: GratuitiIcon, tooltip: 'View Gratuiti' },
    [FAB_TYPES.ACTIVATE]: { icon: BoltIcon, tooltip: 'Activate' },
    [FAB_TYPES.DEACTIVATE]: { icon: BoltSlashIcon, tooltip: 'Deactivate' },
    [FAB_TYPES.TRANSFER]: { icon: ArrowRightStartOnRectangleIcon, tooltip: 'Transfer to another character' },
    [FAB_TYPES.TRAP_DROP]: { tooltip: 'Drop trap (difficulty set with Stealth)' },
    [FAB_TYPES.TRAP_THROW]: { tooltip: 'Throw trap (difficulty set with Craft)' },
    [FAB_TYPES.EXPAND]: { icon: ArrowTopRightOnSquareIcon, tooltip: 'Open character sheet' },
    [FAB_TYPES.SPECTATE]: { icon: SpectateIcon, tooltip: 'Spectate engagement' },
}

const variantConfig = computed(() => {
    if (props.variant === FAB_TYPES.VISIBILITY) {
        return {
            icon: props.isActive ? EyeIcon : EyeSlashIcon,
            tooltip: props.isActive ? 'Visible to players' : 'Hidden from players',
        }
    }

    return FAB_TYPE_CONFIG[props.variant]
})
</script>

<style scoped>
@import '@/styles/design-tokens.css';

/* === BASE FAB STYLES === */
.fab {
    --fab-size: var(--btn-min-height-sm);
    /* Layout */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    width: var(--fab-size);
    height: var(--fab-size);

    /* Typography */
    font-family: var(--font-family-primary);
    white-space: nowrap;

    /* Appearance */
    background: var(--overlay-black-medium);
    border: 1px solid var(--overlay-black-medium);
    border-radius: var(--radius-full);
    color: var(--color-white);
    cursor: pointer;
    user-select: none;

    /* Transitions */
    transition: var(--transition-normal);
}

.fab:hover {
    background: var(--overlay-black-heavy);
    border-color: var(--overlay-black-heavy);
}

.fab:disabled {
    opacity: 0.45;
    cursor: default;
}

.fab:disabled:hover {
    background: var(--overlay-black-medium);
    border-color: var(--overlay-black-medium);
}

/* === SIZE VARIANTS === */
.fab--small {
    --fab-size: var(--btn-min-height-sm);
}

.fab--large {
    --fab-size: var(--btn-min-height-lg);
}

/* === ICON SIZES === */
.fab__icon--small,
.fab__icon--large {
    width: var(--fab-icon-size);
    height: var(--fab-icon-size);
    font-size: var(--fab-icon-font-size);
}

.fab__icon--small {
    --fab-icon-size: 14px;
    --fab-icon-font-size: 11px;
}

.fab__icon--large {
    --fab-icon-size: 22px;
    --fab-icon-font-size: 14px;
}

/* === TYPE VARIANTS === */
.fab--add,
.fab--dice,
.fab--initiative,
.fab--injury {
    background: var(--color-primary);
    border-color: var(--color-primary);
}

.fab--add:hover,
.fab--dice:hover,
.fab--initiative:hover,
.fab--injury:hover {
    background: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
}

.fab--dice .fab__icon--small,
.fab--dice .fab__icon--large,
.fab--initiative .fab__icon--small,
.fab--initiative .fab__icon--large,
.fab--injury .fab__icon--small,
.fab--injury .fab__icon--large {
    color: var(--color-black);
}

.fab--drag {
    cursor: grab;
}

.auto-text {
    font-size: 7px;
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    letter-spacing: 0.3px;
    display: inline-block;
    position: relative;
}

.auto-text--off {
    color: var(--color-text-secondary);
}

.auto-text--off::after {
    content: '';
    position: absolute;
    top: 50%;
    left: -1px;
    right: -1px;
    height: 1px;
    background: currentColor;
    transform: rotate(-45deg);
    transform-origin: center;
}

.fab--auto-calc .fab__icon--small,
.fab--auto-calc .fab__icon--large,
.fab--auto-calc-on .fab__icon--small,
.fab--auto-calc-on .fab__icon--large {
    color: var(--color-primary);
}

.fab--confirm {
    background: var(--color-success);
    border-color: var(--color-success);
}

.fab--confirm:hover {
    background: var(--color-success-hover);
    border-color: var(--color-success-hover);
}

.fab--trash:hover {
    background: var(--color-danger);
    border-color: var(--color-danger);
}

.fab--activate {
    background: var(--color-primary);
    border-color: var(--color-primary);
}

.fab--activate:hover {
    background: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
}

.fab--activate .fab__icon--small,
.fab--activate .fab__icon--large {
    color: var(--color-black);
}

.fab--transfer:hover {
    background: var(--color-accent-cyan);
    border-color: var(--color-accent-cyan);
}

.fab--untrained {
    background: var(--color-danger);
    border-color: var(--color-danger);
}

.fab--untrained:hover {
    background: var(--color-danger);
    border-color: var(--color-danger);
}

.fab--untrained .fab__icon--small,
.fab--untrained .fab__icon--large {
    color: var(--color-white);
}

.fab--transfer .fab__icon--small,
.fab--transfer .fab__icon--large {
    color: var(--color-white);
}


.fab--visibility .fab__icon--small,
.fab--visibility .fab__icon--large {
    color: var(--color-accent-cyan);
}

.fab--visibility-off .fab__icon--small,
.fab--visibility-off .fab__icon--large {
    color: var(--color-danger);
}

/* === VISIBILITY VARIANTS === */
.fab--on-hover {
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--transition-normal);
}

.fab--always {
    opacity: 0.7;
}

.fab--always:hover {
    opacity: 1;
}

/* === FOCUS STYLES === */
.fab:focus {
    outline: 2px solid var(--color-white);
    outline-offset: 2px;
}

.fab:focus:not(:focus-visible) {
    outline: none;
}

/* === HOVER TRIGGER CLASSES === */
/* Parent containers can use these classes to trigger hover visibility */
:global(:is(.edit-trigger:hover, .edit-hover-area:hover) .fab--on-hover) {
    opacity: 1;
    pointer-events: auto;
}

/* === TRAP STATE FAB VARIANTS (DROP / THROW) === */
.fab--trap-drop,
.fab--trap-throw {
    font-size: 7px;
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.4px;
    background: var(--color-bg-secondary);
    border-color: var(--overlay-white-medium);
    color: var(--color-text-secondary);
    opacity: 1;
}

.fab--trap-drop:hover,
.fab--trap-throw:hover {
    background: var(--overlay-black-heavy);
    border-color: var(--overlay-white-heavy);
    color: var(--color-text-primary);
}

.fab--trap-active {
    background: var(--color-primary) !important;
    border-color: var(--color-primary) !important;
    color: var(--color-black) !important;
}

.fab--trap-active:hover {
    background: var(--color-primary-hover) !important;
    border-color: var(--color-primary-hover) !important;
}

.trap-text {
    font-size: 7px;
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.4px;
    display: inline-block;
}
</style>
