<template>
    <BaseModal title="Campaign Questions" :open="true" width="min(640px, 92vw)"
        :body-style="{ padding: '0 var(--space-sm)' }" @close="emit('close')">
        <div class="questions-modal-body">

            <!-- ─── Active ──────────────────────────────────────────────────── -->
            <section class="questions-section">
                <div class="section-header">
                    <span class="section-title">Active</span>
                    <FloatingActionButton v-if="isGM" :variant="FAB_TYPES.ADD" :size="FAB_SIZES.SMALL"
                        :visibility="FAB_VISIBILITIES.ALWAYS" title="Add question" @click="addQuestion" />
                </div>

                <TransitionGroup name="question-list" tag="div" class="question-list">
                    <div v-for="q in activeQuestions" :key="q.id" class="question-item"
                        :class="{ 'is-transitioning': transitioningIds.has(q.id) }">
                        <input type="checkbox" class="question-checkbox" :checked="false" :disabled="!isGM"
                            @change="startComplete(q.id)" />
                        <input v-if="isGM" type="text" class="question-text-input" :value="q.text"
                            placeholder="Enter question…" @blur="e => updateQuestionText(q.id, e.target.value)"
                            @keydown.enter="e => e.target.blur()" @keydown.escape="e => e.target.blur()" />
                        <span v-else class="question-text-readonly">{{ q.text }}</span>
                        <div v-if="isGM" class="question-fabs">
                            <FloatingActionButton :variant="FAB_TYPES.ARCHIVE" :size="FAB_SIZES.SMALL"
                                :visibility="FAB_VISIBILITIES.ON_HOVER" title="Archive question"
                                @click="startArchive(q.id)" />
                            <FloatingActionButton :variant="FAB_TYPES.TRASH" :size="FAB_SIZES.SMALL"
                                :visibility="FAB_VISIBILITIES.ON_HOVER" title="Delete question"
                                @click="deleteQuestion(q.id)" />
                        </div>
                    </div>
                </TransitionGroup>

                <p v-if="activeQuestions.length === 0" class="questions-empty">
                    No active questions.
                </p>
            </section>

            <!-- ─── Completed ─────────────────────────────────────────────── -->
            <section class="questions-section">
                <div class="section-header">
                    <span class="section-title section-title--completed">Completed</span>
                    <button class="section-collapse-btn" @click="completedCollapsed = !completedCollapsed">
                        <ChevronDownIcon v-if="completedCollapsed" class="collapse-icon" />
                        <ChevronUpIcon v-else class="collapse-icon" />
                    </button>
                </div>

                <TransitionGroup v-if="!completedCollapsed" name="question-list" tag="div" class="question-list">
                    <div v-for="q in completedQuestions" :key="q.id" class="question-item question-item--completed"
                        :class="{ 'is-transitioning': transitioningIds.has(q.id) }">
                        <input type="checkbox" class="question-checkbox" :checked="true" :disabled="!isGM"
                            @change="restoreToActive(q.id)" />
                        <input v-if="isGM" type="text" class="question-text-input question-text-input--completed"
                            :value="q.text" placeholder="Enter question…"
                            @blur="e => updateQuestionText(q.id, e.target.value)" @keydown.enter="e => e.target.blur()"
                            @keydown.escape="e => e.target.blur()" />
                        <span v-else class="question-text-readonly question-text-readonly--completed">{{ q.text
                            }}</span>
                        <div v-if="isGM" class="question-fabs">
                            <FloatingActionButton :variant="FAB_TYPES.TRASH" :size="FAB_SIZES.SMALL"
                                :visibility="FAB_VISIBILITIES.ON_HOVER" title="Delete question"
                                @click="deleteQuestion(q.id)" />
                        </div>
                    </div>
                </TransitionGroup>

                <p v-if="!completedCollapsed && completedQuestions.length === 0" class="questions-empty">
                    No completed questions yet.
                </p>
            </section>

            <!-- ─── Archived ───────────────────────────────────────────────── -->
            <section class="questions-section">
                <div class="section-header">
                    <span class="section-title section-title--archived">Archived</span>
                    <button class="section-collapse-btn" @click="archivedCollapsed = !archivedCollapsed">
                        <ChevronDownIcon v-if="archivedCollapsed" class="collapse-icon" />
                        <ChevronUpIcon v-else class="collapse-icon" />
                    </button>
                </div>

                <TransitionGroup v-if="!archivedCollapsed" name="question-list" tag="div" class="question-list">
                    <div v-for="q in archivedQuestions" :key="q.id" class="question-item question-item--archived"
                        :class="{ 'is-transitioning': transitioningIds.has(q.id) }">
                        <ArchiveBoxIcon class="archived-icon" />
                        <input v-if="isGM" type="text" class="question-text-input question-text-input--archived"
                            :value="q.text" placeholder="Enter question…"
                            @blur="e => updateQuestionText(q.id, e.target.value)" @keydown.enter="e => e.target.blur()"
                            @keydown.escape="e => e.target.blur()" />
                        <span v-else class="question-text-readonly question-text-readonly--archived">{{ q.text }}</span>
                        <div v-if="isGM" class="question-fabs">
                            <FloatingActionButton :variant="FAB_TYPES.TRASH" :size="FAB_SIZES.SMALL"
                                :visibility="FAB_VISIBILITIES.ON_HOVER" title="Delete question"
                                @click="deleteQuestion(q.id)" />
                        </div>
                    </div>
                </TransitionGroup>

                <p v-if="!archivedCollapsed && archivedQuestions.length === 0" class="questions-empty">
                    No archived questions.
                </p>
            </section>
        </div>
    </BaseModal>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ChevronDownIcon, ChevronUpIcon, ArchiveBoxIcon } from '@heroicons/vue/24/outline'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { useCampaignStore } from '@/stores/campaignStore'

const props = defineProps({
    campaignId: {
        type: String,
        required: true,
    },
})

const emit = defineEmits(['close'])

const campaignStore = useCampaignStore()

const isGM = computed(() => true)

// All questions from the active campaign
const allQuestions = computed(() =>
    campaignStore.activeCampaign?.campaignQuestions ?? []
)

const activeQuestions = computed(() => allQuestions.value.filter(q => q.status === 'active'))
const completedQuestions = computed(() => allQuestions.value.filter(q => q.status === 'completed'))
const archivedQuestions = computed(() => allQuestions.value.filter(q => q.status === 'archived'))

const completedCollapsed = ref(false)
const archivedCollapsed = ref(true)

// Tracks which question IDs are in the middle of a status transition (graying out)
const transitioningIds = ref(new Set())

// ─── Persistence ──────────────────────────────────────────────────────────────

async function persist(questions) {
    await campaignStore.updateCampaignQuestions(props.campaignId, questions)
}

function buildUpdatedList(mutate) {
    const list = allQuestions.value.map(q => ({ ...q }))
    mutate(list)
    return list
}

// ─── Actions ──────────────────────────────────────────────────────────────────

function addQuestion() {
    const newQuestion = {
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: '',
        status: 'active',
        createdAt: new Date().toISOString(),
        completedAt: null,
    }
    persist([...allQuestions.value, newQuestion])
}

function updateQuestionText(id, text) {
    const list = buildUpdatedList(qs => {
        const q = qs.find(q => q.id === id)
        if (q) q.text = text
    })
    persist(list)
}

function deleteQuestion(id) {
    persist(allQuestions.value.filter(q => q.id !== id))
}

/** Check a question: gray it out briefly, then move it to completed. */
function startComplete(id) {
    const ids = new Set(transitioningIds.value)
    ids.add(id)
    transitioningIds.value = ids

    setTimeout(() => {
        const list = buildUpdatedList(qs => {
            const q = qs.find(q => q.id === id)
            if (q) {
                q.status = 'completed'
                q.completedAt = new Date().toISOString()
            }
        })
        persist(list)
        const next = new Set(transitioningIds.value)
        next.delete(id)
        transitioningIds.value = next
    }, 380)
}

/** Uncheck a completed question: move it back to active. */
function restoreToActive(id) {
    const list = buildUpdatedList(qs => {
        const q = qs.find(q => q.id === id)
        if (q) {
            q.status = 'active'
            q.completedAt = null
        }
    })
    persist(list)
}

/** Archive an active question: gray it out briefly, then move it to archived. */
function startArchive(id) {
    const ids = new Set(transitioningIds.value)
    ids.add(id)
    transitioningIds.value = ids

    setTimeout(() => {
        const list = buildUpdatedList(qs => {
            const q = qs.find(q => q.id === id)
            if (q) q.status = 'archived'
        })
        persist(list)
        const next = new Set(transitioningIds.value)
        next.delete(id)
        transitioningIds.value = next
    }, 380)
}
</script>

<style scoped>
.questions-modal-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    padding-bottom: var(--space-sm);
}

/* ─── Section ─────────────────────────────────────────────────────────────── */
.questions-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.section-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    border-bottom: 1px solid var(--overlay-white-medium);
    padding-bottom: var(--space-xs);
}

.section-title {
    flex: 1;
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-primary);
}

.section-title--completed {
    color: var(--color-success);
}

.section-title--archived {
    color: var(--color-text-muted);
}

.section-collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: 2px;
    border-radius: var(--radius-3);
    transition: color var(--transition-fast);
}

.section-collapse-btn:hover {
    color: var(--color-text-primary);
}

.collapse-icon {
    width: 14px;
    height: 14px;
}

/* ─── Question list ───────────────────────────────────────────────────────── */
.question-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

/* ─── Question item ───────────────────────────────────────────────────────── */
.question-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 0 var(--space-xs);
    border-radius: var(--radius-5);
    border: 1px solid transparent;
    transition: background var(--transition-fast), opacity 350ms ease, filter 350ms ease;
    /* Trigger FAB hover-reveal */
    position: relative;
}

.question-item:hover {
    background: var(--overlay-white-subtle);
    border-color: var(--overlay-white-medium);
}

/* Trigger .fab--on-hover reveal on item hover */
.question-item:hover :deep(.fab--on-hover) {
    opacity: 1;
    pointer-events: auto;
}

/* Mid-transition: gray out before actually moving */
.question-item.is-transitioning {
    opacity: 0.4;
    filter: grayscale(0.6);
    pointer-events: none;
}

.question-item--completed {
    opacity: 0.75;
}

.question-item--archived {
    opacity: 0.55;
}

/* ─── Checkbox ────────────────────────────────────────────────────────────── */
.question-checkbox {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    accent-color: var(--color-primary);
    cursor: pointer;
}

.question-checkbox:disabled {
    cursor: default;
}

/* ─── Archive icon ────────────────────────────────────────────────────────── */
.archived-icon {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    color: var(--color-text-muted);
}

/* ─── Text input (editable) ───────────────────────────────────────────────── */
.question-text-input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
    padding: 8px 0 2px 0;
    color: var(--color-text-primary);
    font-family: var(--font-family-primary);
    font-size: var(--font-size-14);
    outline: none;
    transition: border-color var(--transition-fast);
}

.question-text-input:focus {
    border-bottom-color: var(--color-primary);
}

.question-text-input--completed {
    text-decoration: line-through;
    color: var(--color-text-secondary);
}

.question-text-input--archived {
    color: var(--color-text-muted);
    font-style: italic;
}

/* ─── Text (read-only) ────────────────────────────────────────────────────── */
.question-text-readonly {
    flex: 1;
    min-width: 0;
    font-family: var(--font-family-primary);
    font-size: var(--font-size-14);
    color: var(--color-text-primary);
    line-height: 1.4;
    word-break: break-word;
}

.question-text-readonly--completed {
    text-decoration: line-through;
    color: var(--color-text-secondary);
}

.question-text-readonly--archived {
    color: var(--color-text-muted);
    font-style: italic;
}

/* ─── FABs ────────────────────────────────────────────────────────────────── */
.question-fabs {
    display: flex;
    gap: var(--space-xs);
    flex-shrink: 0;
    /* Always take space so layout doesn't shift on hover */
    visibility: visible;
}

/* ─── Empty states ────────────────────────────────────────────────────────── */
.questions-empty {
    font-size: var(--font-size-12);
    color: var(--color-text-muted);
    font-style: italic;
    text-align: center;
    padding: var(--space-sm) 0;
    margin: 0;
}

/* ─── TransitionGroup animations ─────────────────────────────────────────── */
.question-list-enter-active {
    transition: opacity 250ms ease, transform 250ms ease;
}

.question-list-leave-active {
    transition: opacity 350ms ease, transform 350ms ease;
    position: absolute;
    width: 100%;
}

.question-list-enter-from {
    opacity: 0;
    transform: translateY(-6px);
}

.question-list-leave-to {
    opacity: 0;
    transform: translateX(12px);
}

.question-list-move {
    transition: transform 300ms ease;
}
</style>
