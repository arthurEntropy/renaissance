<template>
    <div class="auth-component">
        <!-- Loading state -->
        <div v-if="authStore.isLoading" class="auth-loading">
            <p>Loading...</p>
        </div>

        <!-- Not authenticated -->
        <div v-else-if="!authStore.isAuthenticated" class="auth-login">
            <ActionButton @click="handleGoogleSignIn" variant="outline" size="large" :loading="signingIn"
                :disabled="signingIn">
                Sign In <img
                    src="https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp=s48-fcrop64=1,00000000ffffffff-rw"
                    alt="Google" class="google-icon" />
            </ActionButton>
        </div>

        <!-- Authenticated but pending approval -->
        <div v-else-if="authStore.isPending" class="auth-pending">
            <div class="user-info">
                <img v-if="authStore.user?.photoURL" :src="authStore.user.photoURL" class="user-avatar" />
                <span class="user-name">{{ userStore.displayName }}</span>
            </div>
            <p class="pending-message">
                Your account is pending approval. Please wait for an administrator to approve your access.
            </p>
            <button @click="handleSignOut" class="signout-btn">Sign Out</button>
        </div>

        <!-- Authenticated and approved (or needs username, but we show user info) -->
        <div v-else class="auth-user">
            <div class="user-dropdown" @click="toggleDropdown" ref="dropdownTrigger">
                <!-- Chevron icon (shown on hover) -->
                <svg class="chevron-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clip-rule="evenodd" />
                </svg>

                <span class="user-name">{{ userStore.userProfile?.name || authStore.user?.displayName ||
                    authStore.user?.email || 'User' }}</span>

                <!-- Dropdown menu -->
                <div v-if="dropdownOpen" class="dropdown-menu">
                    <button @click.stop="openPreferences" class="dropdown-item">
                        Preferences
                    </button>
                    <router-link v-if="authStore.isAdmin" to="/admin" class="dropdown-item" @click.stop="closeDropdown">
                        Admin Panel
                    </router-link>
                    <button @click.stop="handleSignOut" class="dropdown-item">
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const authStore = useAuthStore()
const userStore = useUserStore()
const signingIn = ref(false)
const dropdownOpen = ref(false)
const dropdownTrigger = ref(null)

const emit = defineEmits(['openPreferences'])

const toggleDropdown = () => {
    dropdownOpen.value = !dropdownOpen.value
}

const closeDropdownMenu = (event) => {
    if (dropdownTrigger.value && !dropdownTrigger.value.contains(event.target)) {
        dropdownOpen.value = false
    }
}

const closeDropdown = () => {
    dropdownOpen.value = false
}

const openPreferences = () => {
    emit('openPreferences')
    dropdownOpen.value = false
}

onMounted(() => {
    document.addEventListener('click', closeDropdownMenu)
})

onUnmounted(() => {
    document.removeEventListener('click', closeDropdownMenu)
})

const handleGoogleSignIn = async () => {
    try {
        signingIn.value = true
        await authStore.signInWithGoogle()
    } catch (error) {
        console.error('Sign in failed:', error)
    } finally {
        signingIn.value = false
    }
}

const handleSignOut = async () => {
    dropdownOpen.value = false
    try {
        await authStore.signOut()
    } catch (error) {
        console.error('Sign out failed:', error)
    }
}
</script>

<style scoped>
.auth-loading {
    text-align: center;
    color: var(--color-white);
}

.auth-login {
    text-align: center;
}

.google-icon {
    display: inline-block;
    width: 16px;
    height: 16px;
    margin-left: 0.25rem;
    vertical-align: middle;
}

.auth-pending {
    text-align: center;
}

.pending-message {
    color: var(--color-warning);
    margin: var(--space-md) 0;
    font-size: var(--font-size-14);
    line-height: 1.4;
}

.auth-user {
    position: relative;
}

.user-dropdown {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    cursor: pointer;
    user-select: none;
}

.chevron-icon {
    width: 16px;
    height: 16px;
    color: var(--color-primary);
    opacity: 0;
    transition: opacity var(--duration-fast);
}

.user-dropdown:hover .chevron-icon {
    opacity: 1;
}

.user-name {
    color: var(--color-primary);
    font-size: var(--font-size-14);
    font-weight: 500;
    transition: filter var(--duration-fast);
}

.user-dropdown:hover .user-name {
    filter: var(--shadow-glow-gold-md);
}

.dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: var(--space-sm);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-gray-medium);
    border-radius: var(--radius-5);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    width: 120px;
    z-index: 1000;
}

.dropdown-item {
    display: block;
    min-width: 120px;
    max-width: 120px;
    padding: var(--space-sm) var(--space-md);
    background: none;
    border: none;
    color: var(--color-white);
    font-size: var(--font-size-14);
    font-family: var(--font-family-primary);
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    transition: background-color var(--duration-fast);
}
</style>