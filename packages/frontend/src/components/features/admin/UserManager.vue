<template>
    <CollapsibleAdminSection title="User Management">
        <div class="user-manager">

            <!-- Loading state -->
            <div v-if="loading" class="loading">
                <p>Loading users...</p>
            </div>

            <!-- Error state -->
            <div v-else-if="error" class="error">
                <p>Error loading users: {{ error }}</p>
                <ActionButton variant="primary" text="Retry" @click="loadUsers" />
            </div>

            <!-- User list -->
            <div v-else class="users-list">
                <!-- Pending users -->
                <div v-if="pendingUsers.length > 0" class="user-section">
                    <h3>Pending Approval ({{ pendingUsers.length }})</h3>
                    <div class="user-cards">
                        <div v-for="user in pendingUsers" :key="user.id" class="user-card pending">
                            <UserCard :user="user" @approve="approveUser" @reject="rejectUser"
                                @update-role="updateUserRole" />
                        </div>
                    </div>
                </div>

                <!-- Approved users -->
                <div v-if="approvedUsers.length > 0" class="user-section">
                    <h3>Approved Users ({{ approvedUsers.length }})</h3>
                    <div class="user-cards">
                        <div v-for="user in approvedUsers" :key="user.id" class="user-card approved">
                            <UserCard :user="user" @suspend="suspendUser" @update-role="updateUserRole"
                                @delete="deleteUser" />
                        </div>
                    </div>
                </div>

                <!-- Admin users -->
                <div v-if="adminUsers.length > 0" class="user-section">
                    <h3>Administrators ({{ adminUsers.length }})</h3>
                    <div class="user-cards">
                        <div v-for="user in adminUsers" :key="user.id" class="user-card admin">
                            <UserCard :user="user" @update-role="updateUserRole" @delete="deleteUser" />
                        </div>
                    </div>
                </div>

                <!-- No users message -->
                <div v-if="users.length === 0" class="no-users">
                    <p>No users found.</p>
                </div>
            </div>
        </div>
    </CollapsibleAdminSection>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import CollapsibleAdminSection from './CollapsibleAdminSection.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import UserCard from './UserCard.vue'
import UserService from '@/services/entities/userService'
import { USER_STATUS, USER_ROLE } from '@shared/constants/userConstants'
import { useConfirm } from '@/composables/useConfirm'

const users = ref([])
const loading = ref(true)
const error = ref(null)

// Computed user groups
const pendingUsers = computed(() => users.value.filter(user => user.status === USER_STATUS.PENDING))
const approvedUsers = computed(() => users.value.filter(user => user.status === USER_STATUS.APPROVED && user.role === USER_ROLE.USER))
const adminUsers = computed(() => users.value.filter(user => user.role === USER_ROLE.ADMIN))

const loadUsers = async () => {
    try {
        loading.value = true
        error.value = null
        users.value = await UserService.getAllUsers()
    } catch (err) {
        error.value = err.message
        console.error('Error loading users:', err)
    } finally {
        loading.value = false
    }
}

const approveUser = async (userId) => {
    try {
        await UserService.approveUser(userId)
        await loadUsers()
    } catch (err) {
        console.error('Error approving user:', err)
        alert('Failed to approve user: ' + err.message)
    }
}

const rejectUser = async (userId) => {
    const { confirm } = useConfirm()
    if (!await confirm('Are you sure you want to reject this user? This will delete their account.')) {
        return
    }

    try {
        await UserService.deleteUser(userId)
        await loadUsers()
    } catch (err) {
        console.error('Error rejecting user:', err)
        alert('Failed to reject user: ' + err.message)
    }
}

const suspendUser = async (userId) => {
    const { confirm } = useConfirm()
    if (!await confirm('Are you sure you want to suspend this user?')) {
        return
    }

    try {
        await UserService.updateUser(userId, { status: USER_STATUS.SUSPENDED })
        await loadUsers()
    } catch (err) {
        console.error('Error suspending user:', err)
        alert('Failed to suspend user: ' + err.message)
    }
}

const updateUserRole = async (userId, role) => {
    try {
        await UserService.setUserRole(userId, role)
        await loadUsers()
    } catch (err) {
        console.error('Error updating user role:', err)
        alert('Failed to update user role: ' + err.message)
    }
}

const deleteUser = async (userId) => {
    const { confirm } = useConfirm()
    if (!await confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return
    }

    try {
        await UserService.deleteUser(userId)
        await loadUsers()
    } catch (err) {
        console.error('Error deleting user:', err)
        alert('Failed to delete user: ' + err.message)
    }
}

onMounted(() => {
    loadUsers()
})
</script>
<style scoped>
.loading,
.error {
    text-align: center;
    padding: 2rem;
    color: var(--color-white);
}

.error {
    color: var(--color-danger);
}

.user-section {
    margin-bottom: 2.5rem;
}

.user-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1rem;
}

.user-card {
    border-radius: var(--radius-10);
    overflow: hidden;
}

.user-card.pending {
    border: 2px solid var(--color-warning);
}

.user-card.approved {
    border: 2px solid var(--color-success);
}

.user-card.admin {
    border: 2px solid var(--color-primary);
}

.no-users {
    text-align: center;
    padding: 2rem;
    color: var(--color-gray-light);
    font-style: italic;
}

@media (max-width: 768px) {
    .user-cards {
        grid-template-columns: 1fr;
    }
}
</style>