<template>
    <div class="auth-component">
        <!-- Loading state -->
        <div v-if="authStore.isLoading" class="auth-loading">
            <p>Loading...</p>
        </div>

        <!-- Not authenticated -->
        <div v-else-if="!authStore.isAuthenticated" class="auth-login">
            <ActionButton @click="handleGoogleSignIn" variant="outline" size="large" :disabled="signingIn">
                <template v-if="signingIn">Signing In...</template>
                <template v-else>
                    Sign In <img :src="GOOGLE_ICON_URL" alt="Google" class="google-icon" />
                </template>
            </ActionButton>
        </div>

        <!-- Authenticated but pending approval -->
        <div v-else-if="authStore.isPending" class="auth-pending">
            <div class="user-info">
                <span class="user-name">{{ displayName }}</span>
            </div>
            <p class="pending-message">
                Your account is pending approval. Please wait for an administrator to approve your access.
            </p>
            <ActionButton @click="handleSignOut" variant="outline" :disabled="signingOut">
                {{ signingOut ? 'Signing Out...' : 'Sign Out' }}
            </ActionButton>
        </div>

        <!-- Authenticated and approved (or needs username, but we show user info) -->
        <div v-else class="auth-user">
            <div class="user-dropdown" @click="toggleDropdown" ref="dropdownTrigger">
                <!-- Chevron icon (shown on hover) -->
                <ChevronDownIcon class="chevron-icon" />

                <span class="user-name">{{ displayName }}</span>

                <!-- Dropdown menu -->
                <div v-if="dropdownOpen" class="dropdown-menu">
                    <button @click.stop="openPreferences" class="dropdown-item">
                        Preferences
                    </button>
                    <router-link v-if="authStore.isAdmin" to="/admin" class="dropdown-item" @click.stop="closeDropdown">
                        Admin Panel
                    </router-link>
                    <router-link v-if="authStore.isAdmin" to="/design-lab" class="dropdown-item"
                        @click.stop="closeDropdown">
                        Design Lab
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
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

const GOOGLE_ICON_URL = 'https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp=s48-fcrop64=1,00000000ffffffff-rw'

const authStore = useAuthStore()
const userStore = useUserStore()
const signingIn = ref(false)
const signingOut = ref(false)
const dropdownOpen = ref(false)
const dropdownTrigger = ref(null)

const emit = defineEmits(['openPreferences'])

const displayName = computed(() => {
    if (userStore.isLoading) return 'Loading...'
    return userStore.userProfile?.name || authStore.user?.email || 'User'
})

const toggleDropdown = () => {
    dropdownOpen.value = !dropdownOpen.value
}

const closeDropdownMenu = (event) => {
    if (dropdownTrigger.value && !dropdownTrigger.value.contains(event.target)) {
        dropdownOpen.value = false
    }
}

watch(dropdownOpen, (isOpen) => {
    if (isOpen) {
        document.addEventListener('click', closeDropdownMenu)
    } else {
        document.removeEventListener('click', closeDropdownMenu)
    }
})

const closeDropdown = () => {
    dropdownOpen.value = false
}

const openPreferences = () => {
    emit('openPreferences')
    dropdownOpen.value = false
}

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
        signingOut.value = true
        await authStore.signOut()
    } catch (error) {
        console.error('Sign out failed:', error)
    } finally {
        signingOut.value = false
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
    filter: var(--glow-gold-lg);
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