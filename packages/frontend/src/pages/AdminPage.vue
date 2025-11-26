<template>
    <div class="admin-page">
        <CollapsibleSection title="User Management">
            <UserManager />
        </CollapsibleSection>

        <CollapsibleSection title="Background Images">
            <BackgroundManager />
        </CollapsibleSection>

        <CollapsibleSection title="Expansions">
            <ExpansionManager />
        </CollapsibleSection>

        <CollapsibleSection title="Equipment Types">
            <EquipmentTypeManager />
        </CollapsibleSection>

        <CollapsibleSection title="Equipment Subtypes">
            <EquipmentSubtypeManager />
        </CollapsibleSection>

        <CollapsibleSection title="Equipment Grades">
            <EquipmentGradeManager />
        </CollapsibleSection>

        <CollapsibleSection title="Equipment Ranges">
            <EquipmentRangeManager />
        </CollapsibleSection>

        <CollapsibleSection title="Engagement Successes">
            <EngagementSuccessManager />
        </CollapsibleSection>
    </div>
</template>

<script setup>
import CollapsibleSection from '@/components/features/admin/CollapsibleSection.vue'
import ExpansionManager from '@/components/features/admin/ExpansionManager.vue'
import UserManager from '@/components/features/admin/UserManager.vue'
import BackgroundManager from '@/components/features/admin/BackgroundManager.vue'
import EquipmentTypeManager from '@/components/features/admin/EquipmentTypeManager.vue'
import EquipmentSubtypeManager from '@/components/features/admin/EquipmentSubtypeManager.vue'
import EquipmentGradeManager from '@/components/features/admin/EquipmentGradeManager.vue'
import EquipmentRangeManager from '@/components/features/admin/EquipmentRangeManager.vue'
import EngagementSuccessManager from '@/components/features/admin/EngagementSuccessManager.vue'
</script>

<style scoped>
.admin-page {
    min-width: 700px;
    max-width: 700px;
    margin: var(--space-xl);
    padding: var(--space-xl);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-10);
}
</style>