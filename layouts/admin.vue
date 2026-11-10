<template>
  <TspAppShell
    app-name="piggybank"
    :top-title="topTitle"
  >
    <template #brand>
      <NuxtLink
        to="/"
        aria-label="Back to Piggy Bank"
        title="Back to Piggy Bank"
      >
        <TspWordmark name="piggybank" />
      </NuxtLink>
    </template>

    <template #nav>
      <TspNavItem
        to="/admin/piggy-banks"
        icon="i-tabler-pig-money"
      >
        Piggy Banks
      </TspNavItem>
    </template>

    <template #footer>
      <TspSidebarFooter
        :user="displayName"
        user-to="/admin/user"
        settings-to="/admin/settings"
        logout-href="/admin/sign-out"
        app-name="piggybank"
        :github-link="githubLink"
        :version="version"
        :version-link="versionLink"
      />
    </template>

    <slot />
  </TspAppShell>
</template>

<script setup lang="ts">
// The mobile top bar's title is each page's `definePageMeta({ title })`, not
// one derived from the URL (`/admin/piggy-banks/new` → "New").
const route = useRoute()
const topTitle = computed(() => route.meta.title)

const { data: me } = await useFetch<{ sub: string, name?: string, username?: string, email?: string }>('/api/admin/me')
const displayName = computed(() => me.value?.name || me.value?.username || me.value?.email || 'Unknown')

// GitHub link + version, sourced from the same runtimeConfig.public.devBase
// (set by modules/dev-base.ts) the public site footer (FooterMain) uses.
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
