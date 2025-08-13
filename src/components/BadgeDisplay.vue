<template>
    <div v-if="showBadge" :class="badgeClass" :title="title">
        {{ displayText }}
    </div>
</template>

<script>
import { computed } from 'vue'

export default {
    name: 'BadgeDisplay',
    props: {
        type: {
            type: String,
            required: true,
            validator: (value) => ['xp', 'sol', 'custom'].includes(value)
        },
        value: {
            type: [String, Number],
            required: true
        },
        condition: {
            type: Boolean,
            default: true
        },
        position: {
            type: String,
            default: 'bottom-left',
            validator: (value) => ['bottom-left', 'bottom-right', 'top-left', 'top-right'].includes(value)
        },
        customClass: {
            type: String,
            default: ''
        },
        title: {
            type: String,
            default: ''
        }
    },

    setup(props) {
        const showBadge = computed(() => {
            return props.condition && props.value
        })

        const displayText = computed(() => {
            switch (props.type) {
                case 'xp':
                    return `${props.value} XP`
                case 'sol':
                    return `${props.value} 🪙`
                default:
                    return props.value
            }
        })

        const badgeClass = computed(() => {
            const baseClass = 'badge-display'
            const typeClass = `badge-${props.type}`
            const positionClass = `badge-${props.position}`

            return [
                baseClass,
                typeClass,
                positionClass,
                props.customClass
            ].filter(Boolean).join(' ')
        })

        return {
            showBadge,
            displayText,
            badgeClass
        }
    }
}
</script>

<style scoped>
.badge-display {
    position: absolute;
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-bold);
    padding: 2px 8px;
    border-top-right-radius: var(--radius-10);
    box-shadow: var(--shadow-md);
    pointer-events: none;
    z-index: 10;
}

/* Badge types */
.badge-xp {
    background-color: var(--color-primary);
    color: var(--color-black);
}

.badge-sol {
    background-color: var(--color-primary);
    color: var(--color-text-inverse);
    padding: 2px 8px 4px 8px;
}

.badge-custom {
    background-color: var(--color-gray-medium);
    color: var(--color-white);
}

/* Positioning */
.badge-bottom-left {
    bottom: 0px;
    left: 0px;
    border-top-right-radius: var(--radius-10);
    border-bottom-left-radius: var(--radius-5);
}

.badge-bottom-right {
    bottom: 0px;
    right: 0px;
    border-top-left-radius: var(--radius-10);
    border-bottom-right-radius: var(--radius-5);
}

.badge-top-left {
    top: 0px;
    left: 0px;
    border-bottom-right-radius: var(--radius-10);
    border-top-left-radius: var(--radius-5);
}

.badge-top-right {
    top: 0px;
    right: 0px;
    border-bottom-left-radius: var(--radius-10);
    border-top-right-radius: var(--radius-5);
}

/* Special styling for improvement badges */
.badge-bottom-left.improvement-badge {
    bottom: -5px;
    border-bottom-left-radius: var(--radius-5);
}
</style>
