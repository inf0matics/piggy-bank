<template>
  <div class="font-sans flex min-h-svh bg-background-yellow text-text">
    <aside class="flex flex-col w-60 shrink-0 bg-white shadow-md">
      <div class="px-5 py-6">
        <div class="font-heading font-semibold text-2xl leading-none flex items-center gap-1">
          <UIcon
            name="i-uil-bitcoin"
            class="text-3xl"
          />Piggy Bank
        </div>
        <div class="font-heading text-dodgerblue-600 text-sm mt-1 ml-1">
          Admin
        </div>
      </div>

      <nav class="flex flex-col gap-1 px-3 mt-2">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-dodgerblue-50"
          active-class="bg-dodgerblue-50 text-dodgerblue-700"
        >
          <UIcon
            :name="item.icon"
            class="text-lg"
          />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <a
        href="/admin/sign-out"
        class="mt-auto m-3 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-text/70 hover:bg-dodgerblue-50"
      >
        <UIcon
          name="i-tabler-logout"
          class="text-lg"
        />
        Logout
      </a>
    </aside>

    <main class="flex-grow p-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const navItems = [
  { label: 'Piggy Banks', to: '/admin/piggy-banks', icon: 'i-tabler-pig-money' },
]
</script>
