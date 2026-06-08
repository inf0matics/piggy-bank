<template>
  <div class="font-sans flex min-h-svh text-text">
    <aside class="flex flex-col w-50 shrink-0 bg-text py-5">
      <div class="px-4 pb-4 mb-3 border-b border-background-yellow/20">
        <div class="font-heading font-semibold text-xl text-background-yellow">
          <NuxtLink
            to="/"
            aria-label="Back to Piggy Bank"
            title="Back to Piggy Bank"
            class="hover:opacity-80"
          >🐷</NuxtLink> Piggy Admin
        </div>
      </div>

      <nav class="flex flex-col">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 px-4 py-2 text-sm text-white/55 border-l-2 border-transparent hover:text-white/80"
          active-class="!text-white bg-white/8 !border-background-yellow"
        >
          <UIcon
            :name="item.icon"
            class="text-base"
          />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="mt-auto px-3 pt-3">
        <p class="px-1 mb-1 text-[10px] uppercase tracking-wide text-white/30">
          User
        </p>
        <NuxtLink
          to="/admin/user"
          data-testid="logto-account"
          class="flex items-center gap-2 px-1 py-1.5 mb-1 rounded-md hover:bg-white/8"
        >
          <UIcon
            name="i-tabler-user-circle"
            class="text-2xl text-background-yellow/80 shrink-0"
          />
          <p class="min-w-0 text-xs text-white/85 truncate">
            {{ displayName }}
          </p>
        </NuxtLink>
        <a
          href="/admin/sign-out"
          class="flex items-center gap-2 px-1 py-1.5 text-xs text-white/40 hover:text-white/70"
        >
          <UIcon
            name="i-tabler-logout"
            class="text-base"
          />
          Logout
        </a>

        <div class="flex items-center gap-1.5 px-1 pt-2.5 mt-2 border-t border-white/10 text-xs text-white/40">
          <a
            v-if="githubLink"
            :href="githubLink"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1 hover:text-white/70"
          >
            <UIcon name="i-grommet-icons-github" />
            GitHub
          </a>
          <a
            v-if="versionLink"
            :href="versionLink"
            target="_blank"
            rel="noopener noreferrer"
            class="ml-auto rounded-full border border-white/20 px-2 py-0.5 hover:text-white/70 hover:border-white/40"
          >
            {{ version }}
          </a>
          <span
            v-else-if="version"
            class="ml-auto rounded-full border border-white/20 px-2 py-0.5"
          >
            {{ version }}
          </span>
        </div>
      </div>
    </aside>

    <main class="flex-1 min-w-0 bg-[#f7f9fb]">
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
