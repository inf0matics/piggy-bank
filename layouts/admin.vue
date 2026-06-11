<template>
  <div class="admin-root flex min-h-svh bg-default text-default">
    <aside class="flex flex-col w-56 shrink-0 bg-elevated border-r border-default py-5">
      <div class="px-4 pb-4 mb-3 border-b border-default">
        <div class="font-logo font-bold text-xl tracking-tight text-primary">
          <NuxtLink
            to="/"
            aria-label="Back to Piggy Bank"
            title="Back to Piggy Bank"
            class="hover:opacity-80"
          >🐷</NuxtLink> Piggy Admin
        </div>
      </div>

      <nav class="flex flex-col gap-0.5 px-2">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-bold text-muted hover:text-highlighted hover:bg-default"
          active-class="!text-inverted bg-primary hover:!bg-primary"
        >
          <UIcon
            :name="item.icon"
            class="text-lg"
          />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="mt-auto px-3 pt-3">
        <p class="px-1 mb-1 text-[10px] uppercase tracking-wide text-dimmed">
          User
        </p>
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

        <div class="flex items-center gap-1.5 px-1 pt-2.5 mt-2 border-t border-default text-xs text-muted">
          <a
            v-if="githubLink"
            :href="githubLink"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1 hover:text-highlighted"
          >
            <UIcon name="i-grommet-icons-github" />
            GitHub
          </a>
          <a
            v-if="versionLink"
            :href="versionLink"
            target="_blank"
            rel="noopener noreferrer"
            class="ml-auto rounded-full border border-default px-2 py-0.5 hover:text-highlighted hover:border-accented"
          >
            {{ version }}
          </a>
          <span
            v-else-if="version"
            class="ml-auto rounded-full border border-default px-2 py-0.5"
          >
            {{ version }}
          </span>
        </div>
      </div>
    </aside>

    <main class="flex-1 min-w-0 bg-default">
      <slot />
    </main>
  </div>
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
