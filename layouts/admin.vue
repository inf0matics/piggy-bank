<template>
  <TspThemeProvider class="flex min-h-svh">
    <TspSidebar>
      <template #brand>
        <TspWordmark>
          <NuxtLink
            to="/"
            aria-label="Back to Piggy Bank"
            title="Back to Piggy Bank"
            class="hover:opacity-80"
          >🐷</NuxtLink> Piggy Admin
        </TspWordmark>
      </template>

      <template #nav>
        <TspNavItem
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :icon="item.icon"
        >
          {{ item.label }}
        </TspNavItem>
      </template>

      <template #footer>
        <TspSidebarFooter
          :github-link="githubLink"
          :version="version"
          :version-link="versionLink"
        >
          <template #user>
            <NuxtLink
              to="/admin/user"
              data-testid="logto-account"
              class="flex items-center gap-2 px-1 py-1.5 mb-1 rounded-md hover:bg-default"
            >
              <UIcon
                name="i-tabler-user-circle"
                class="text-2xl text-primary shrink-0"
              />
              <p class="min-w-0 text-xs text-default truncate">
                {{ displayName }}
              </p>
            </NuxtLink>
          </template>
          <template #logout>
            <a
              href="/admin/sign-out"
              class="flex items-center gap-2 px-1 py-1.5 rounded-md text-xs text-muted hover:text-highlighted hover:bg-default"
            >
              <UIcon
                name="i-tabler-logout"
                class="text-base"
              />
              Logout
            </a>
          </template>
        </TspSidebarFooter>
      </template>
    </TspSidebar>

    <main class="flex-1 min-w-0 bg-default">
      <TspContainer>
        <slot />
      </TspContainer>
    </main>
  </TspThemeProvider>
</template>

<script setup lang="ts">
const navItems = [
  { label: 'Piggy Banks', to: '/admin/piggy-banks', icon: 'i-tabler-pig-money' },
  { label: 'Settings', to: '/admin/settings', icon: 'i-tabler-settings' },
]

const { data: me } = await useFetch<{ sub: string, name?: string, username?: string, email?: string }>('/api/admin/me')
const displayName = computed(() => me.value?.name || me.value?.username || me.value?.email || 'Unknown')

// GitHub link + version, sourced from the same @thespielplatz/nuxt-dev-base
// runtime config the site footer (FooterGithubLink/FooterVersionBadge) uses.
const devBase = useRuntimeConfig().public.devBase as {
  githubLink?: string
  version?: string
  releasedVersion?: string
}
const githubLink = devBase.githubLink
const version = devBase.version ? `v${devBase.version}` : undefined
const versionLink = computed(() =>
  githubLink && devBase.releasedVersion
    ? `${githubLink}/releases/tag/v${devBase.releasedVersion}`
    : undefined,
)
</script>
