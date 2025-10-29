<template>
    <div class="user-card">
        <div class="user-header">
            <div class="user-info">
                <div class="user-details">
                    <h4 class="user-name">{{ user.name || 'No name' }}</h4>
                    <p class="user-email">{{ user.email }}</p>
                </div>
            </div>
            <div class="user-badges">
                <span class="status-badge" :class="user.status">{{ user.status }}</span>
                <span class="role-badge" :class="user.role">{{ user.role }}</span>
            </div>
        </div>

        <div class="user-meta">
            <div class="meta-item">
                <span class="meta-label">Joined:</span>
                <span class="meta-value">{{ formatDate(user.createdAt) }}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Last Login:</span>
                <span class="meta-value">{{ formatDate(user.lastLoginAt) }}</span>
            </div>
        </div>

        <div class="user-actions">
            <!-- Pending user actions -->
            <template v-if="user.status === 'pending'">
                <ActionButton variant="success" size="small" text="Approve" @click="$emit('approve', user.id)" />
                <ActionButton variant="danger" size="small" text="Reject" @click="$emit('reject', user.id)" />
            </template>

            <!-- Approved user actions -->
            <template v-else-if="user.status === 'approved'">
                <ActionButton variant="danger" size="small" text="Suspend" @click="$emit('suspend', user.id)" />
                <select v-model="selectedRole" @change="handleRoleChange" class="role-select">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </template>

            <!-- Admin user actions -->
            <template v-else-if="user.role === 'admin'">
                <select v-model="selectedRole" @change="handleRoleChange" class="role-select">
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                </select>
            </template>

            <!-- Delete action (for non-current user) -->
            <ActionButton v-if="!isCurrentUser" variant="danger" size="small" text="Delete"
                @click="$emit('delete', user.id)" />
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const props = defineProps({
    user: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['approve', 'reject', 'suspend', 'update-role', 'delete'])

const authStore = useAuthStore()
const selectedRole = ref(props.user.role)

const isCurrentUser = computed(() => {
    return authStore.user?.uid === props.user.id
})

const handleRoleChange = () => {
    if (selectedRole.value !== props.user.role) {
        emit('update-role', props.user.id, selectedRole.value)
    }
}

const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
}
</script>

<style scoped>
.user-card {
    background: var(--color-bg-secondary);
    padding: 1.5rem;
    border-radius: var(--radius-10);
}

.user-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
}

.user-avatar-placeholder {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--color-gray-medium);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-20);
    font-weight: bold;
    color: var(--color-white);
}

.user-details {
    flex: 1;
}

.user-name {
    font-size: var(--font-size-18);
    color: var(--color-white);
    margin: 0 0 0.25rem 0;
}

.user-email {
    font-size: var(--font-size-14);
    color: var(--color-gray-light);
    margin: 0;
}

.user-badges {
    display: flex;
    gap: 0.5rem;
    flex-direction: column;
    align-items: flex-end;
}

.status-badge,
.role-badge {
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-3);
    font-size: var(--font-size-12);
    font-weight: bold;
    text-transform: uppercase;
}

.status-badge.pending {
    background: var(--color-warning);
    color: var(--color-black);
}

.status-badge.approved {
    background: var(--color-success);
    color: var(--color-white);
}

.status-badge.suspended {
    background: var(--color-danger);
    color: var(--color-white);
}

.role-badge.user {
    background: var(--color-primary);
    color: var(--color-white);
}

.role-badge.admin {
    background: var(--color-secondary);
    color: var(--color-white);
}

.user-meta {
    margin-bottom: 1rem;
    padding: 1rem;
    background: var(--color-gray-dark);
    border-radius: var(--radius-5);
}

.meta-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
}

.meta-item:last-child {
    margin-bottom: 0;
}

.meta-label {
    font-size: var(--font-size-14);
    color: var(--color-gray-light);
}

.meta-value {
    font-size: var(--font-size-14);
    color: var(--color-white);
    font-weight: 500;
}

.user-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
}

.role-select {
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-3);
    border: 1px solid var(--color-gray-medium);
    background: var(--color-bg-primary);
    color: var(--color-white);
    font-size: var(--font-size-12);
}

@media (max-width: 640px) {
    .user-header {
        flex-direction: column;
        gap: 1rem;
    }

    .user-badges {
        flex-direction: row;
        align-items: center;
    }

    .user-actions {
        justify-content: center;
    }
}
</style>