<template>
  <div>
    <header class="flex items-center bg-white px-7 py-4 border-b border-text/10">
      <h1 class="font-heading font-medium text-xl">
        User
      </h1>
    </header>

    <div class="px-7 py-5">
      <section
        data-testid="user-account"
        class="bg-white rounded-[10px] border border-text/10 p-6 max-w-[480px]"
      >
        <div class="flex items-center gap-3 mb-5">
          <UIcon
            name="i-tabler-user-circle"
            class="text-4xl text-dodgerblue-600 shrink-0"
          />
          <div class="min-w-0">
            <p class="font-medium text-base truncate">
              {{ displayName }}
            </p>
            <p class="text-xs text-[#7fa0b8]">
              tsp.tools account
            </p>
          </div>
        </div>

        <div v-if="me?.sub">
          <p class="text-xs font-medium text-[#3a6080] mb-1">
            ID
          </p>
          <div class="flex items-center gap-2">
            <p class="font-mono text-sm text-text break-all">
              {{ revealed ? me.sub : '••••••••••••' }}
            </p>
            <button
              type="button"
              :aria-label="revealed ? 'Hide ID' : 'Show ID'"
              class="flex items-center text-[#aac0d0] hover:text-dodgerblue-600 shrink-0"
              @click="revealed = !revealed"
            >
              <UIcon :name="revealed ? 'i-tabler-eye-off' : 'i-tabler-eye'" />
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const { data: me } = await useFetch<{ sub: string, name?: string, username?: string, email?: string }>('/api/admin/me')
const displayName = computed(() => me.value?.name || me.value?.username || me.value?.email || 'Unknown')

const revealed = ref(false)
</script>
