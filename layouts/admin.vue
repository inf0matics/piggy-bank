<template>
  <div class="font-sans flex min-h-svh text-text">
    <aside class="flex flex-col w-50 shrink-0 bg-text py-5">
      <div class="px-4 pb-4 mb-3 border-b border-background-yellow/20">
        <div class="font-heading font-semibold text-xl text-background-yellow">
          🐷 Piggy Admin
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

      <div class="mt-auto px-4">
        <a
          href="/admin/sign-out"
          class="flex items-center gap-2 py-1.5 text-xs text-white/40 hover:text-white/70"
        >
          <UIcon
            name="i-tabler-logout"
            class="text-base"
          />
          Logout
        </a>
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
</script>
