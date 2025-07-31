<template>
    <div class="floating-comparisons">
        <div v-for="(comparison, index) in comparisons" :key="index" class="comparison-indicator"
            :class="getComparisonClasses(comparison)" :style="{ top: `${190 + (comparison.index * 48)}px` }">
            <div class="indicator-circle"
                :class="{ 'winner': comparison.leftWins, 'loser': !comparison.leftWins && !comparison.tie }">
            </div>
            <div class="indicator-caret" @click.stop="canEdit ? $emit('toggle-result', index) : null"
                :class="getCaretClasses(comparison)">
                <span v-if="comparison.tie">◉</span>
                <span v-else-if="comparison.leftWins">◀</span>
                <span v-else>▶</span>
            </div>
            <div class="indicator-circle"
                :class="{ 'winner': comparison.rightWins, 'loser': !comparison.rightWins && !comparison.tie }">
            </div>
        </div>
    </div>
</template>

<script>
import EngagementWinnerTypes from '@/constants/engagementWinnerTypes'

export default {
    name: 'ResultIndicators',
    props: {
        comparisons: {
            type: Array,
            default: () => []
        },
        canEdit: {
            type: Boolean,
            default: false
        },
        engagementWinner: {
            type: String,
            default: null // 'user', 'opponent', 'tie'
        }
    },

    emits: ['toggle-result'],

    methods: {
        getComparisonClasses(comparison) {
            const classes = [];

            if (comparison.leftWins && this.engagementWinner === EngagementWinnerTypes.USER) {
                classes.push('user-wins-pair');
            } else if (comparison.rightWins && this.engagementWinner === EngagementWinnerTypes.OPPONENT) {
                classes.push('opponent-wins-pair');
            } else if (comparison.leftWins && this.engagementWinner === EngagementWinnerTypes.OPPONENT) {
                classes.push('user-loses-pair');
            } else if (comparison.rightWins && this.engagementWinner === EngagementWinnerTypes.USER) {
                classes.push('opponent-loses-pair');
            } else if (comparison.tie) {
                classes.push('tie-pair');
            }

            return classes;
        },

        getCaretClasses(comparison) {
            const classes = [];

            if (this.canEdit) {
                classes.push('clickable');
            }

            if (comparison.tie) {
                classes.push('tie');
            } else if (comparison.leftWins) {
                classes.push('left-wins');
            } else if (comparison.rightWins) {
                classes.push('right-wins');
            }

            return classes;
        }
    }
}
</script>

<style scoped>
.floating-comparisons {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    pointer-events: none;
    width: 100px;
    margin-top: 12px;
}

.comparison-indicator {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 80px;
    background-color: #000000;
    border: 2px solid #666;
    border-radius: 15px;
    padding: 3px 15px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    height: 28px;
    left: -7px;
    margin-top: 7px;
}

.comparison-indicator.user-wins-pair,
.comparison-indicator.opponent-wins-pair {
    border: 2px solid #4caf50;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.4);
}

.comparison-indicator.user-loses-pair,
.comparison-indicator.opponent-loses-pair {
    border: 2px solid #f44336;
    box-shadow: 0 0 10px rgba(244, 67, 54, 0.4);
}

.comparison-indicator.tie-pair {
    border: 2px solid #ffeb3b;
    box-shadow: 0 0 10px rgba(255, 235, 59, 0.4);
}

.indicator-circle {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid #ffffff;
}

.indicator-circle.winner {
    background-color: #4caf50;
    box-shadow: 0 0 12px rgba(76, 175, 80, 0.9);
    animation: pulse-win 1.5s infinite;
}

.indicator-circle.loser {
    background-color: transparent;
    box-shadow: none;
}

.indicator-caret {
    padding: 0px 5px;
    color: #ffffff;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-top: 2px;
}

.indicator-caret.clickable {
    cursor: pointer;
    pointer-events: auto;
}

.indicator-caret.clickable:hover {
    transform: scale(1.2);
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
}

.indicator-caret.tie {
    color: #ffeb3b;
    text-shadow: 0 0 5px rgba(255, 235, 59, 0.8);
}

.indicator-caret.left-wins {
    color: #ffffff;
}

.indicator-caret.right-wins {
    color: #ffffff;
}

@keyframes pulse-win {
    0% {
        box-shadow: 0 0 5px rgba(76, 175, 80, 0.7);
    }

    50% {
        box-shadow: 0 0 15px rgba(76, 175, 80, 1);
    }

    100% {
        box-shadow: 0 0 5px rgba(76, 175, 80, 0.7);
    }
}
</style>
