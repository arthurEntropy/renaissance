<template>
    <div class="auth-component">
        <!-- Loading state -->
        <div v-if="shouldShowAuthLoading" class="auth-loading">
            <p>Signing In...</p>
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
                <span v-if="campaignStore.pendingInviteCount > 0" class="invite-dot"
                    :title="`${campaignStore.pendingInviteCount} pending invite(s)`" />

                <!-- Dropdown menu -->
                <div v-if="dropdownOpen" class="dropdown-menu">

                    <div v-if="authStore.isAdmin" class="dropdown-menu-section-label">Admin</div>
                    <router-link v-if="authStore.isAdmin" to="/admin" class="dropdown-item dropdown-item--admin"
                        @click.stop="closeDropdown">
                        Admin Panel
                    </router-link>
                    <router-link v-if="authStore.isAdmin" to="/design-lab" class="dropdown-item dropdown-item--admin"
                        @click.stop="closeDropdown">
                        Design Lab
                    </router-link>
                    <router-link v-if="authStore.isAdmin" to="/modal-lab" class="dropdown-item dropdown-item--admin"
                        @click.stop="closeDropdown">
                        Modal Lab
                    </router-link>
                    <div v-if="authStore.isAdmin" class="dropdown-menu-divider" />

                    <button @click.stop="openPreferences" class="dropdown-item">
                        Preferences
                    </button>
                    <button v-if="campaignStore.pendingInviteCount > 0" @click.stop="openInvites"
                        class="dropdown-item dropdown-item--highlight">
                        Invites ({{ campaignStore.pendingInviteCount }})
                    </button>


                    <div class="dropdown-menu-divider" />
                    <button @click.stop="handleSignOut" class="dropdown-item dropdown-item--signout">
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
import { useCampaignStore } from '@/stores/campaignStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

const GOOGLE_ICON_URL = 'https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp=s48-fcrop64=1,00000000ffffffff-rw'

const authStore = useAuthStore()
const userStore = useUserStore()
const campaignStore = useCampaignStore()
const signingIn = ref(false)
const signingOut = ref(false)
const dropdownOpen = ref(false)
const dropdownTrigger = ref(null)

const emit = defineEmits(['openPreferences', 'openInvites'])

const isAuthProfilePending = computed(() => {
    return authStore.isAuthenticated && (!userStore.userProfile || userStore.isLoading)
})

const isCompletingUsernameSetup = computed(() => {
    return authStore.isAuthenticated && userStore.userProfile?.needsUsername
})

const shouldShowAuthLoading = computed(() => {
    return authStore.isLoading || isAuthProfilePending.value || isCompletingUsernameSetup.value
})

const displayName = computed(() => {
    if (shouldShowAuthLoading.value) return 'Signing In...'
    return userStore.userProfile?.name || 'User'
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

const openInvites = () => {
    emit('openInvites')
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
    color: var(--color-text-primary);
    font-size: var(--font-size-14);
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
    top: calc(100% + var(--space-lg));
    right: 0;
    background: var(--color-bg-secondary);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-10);
    box-shadow: var(--shadow-elevation-md, var(--shadow-lg));
    width: 120px;
    z-index: var(--z-dropdown);
    overflow: hidden;
}

.dropdown-item {
    display: block;
    min-width: 120px;
    max-width: 120px;
    padding: var(--space-md) var(--space-lg);
    background: none;
    border: none;
    color: var(--color-text-primary);
    font-size: var(--font-size-14);
    font-family: var(--font-family-primary);
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    transition: background var(--transition-fast);
}

.dropdown-item:hover {
    background: var(--overlay-white-subtle);
}

.dropdown-item--highlight {
    color: var(--color-primary);
}

.dropdown-item--admin {
    color: var(--color-accent-cyan);
}

.dropdown-item--signout {
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
}

.dropdown-menu-divider {
    height: 1px;
    background: var(--overlay-white-medium);
    margin: var(--space-sm) 0;
}

.dropdown-menu-section-label {
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: var(--space-sm) var(--space-lg);
}

/* Adjustment for active route underline in auth dropdown */
.top-nav a.router-link-active::after {
    right: 45px;
}

.invite-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: var(--color-danger, #e74c3c);
    border-radius: 50%;
    flex-shrink: 0;
}
</style>