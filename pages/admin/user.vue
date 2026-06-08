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
            tsp.tools ID
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

        <div
          v-if="me?.lnurlAuth"
          data-testid="lnurl-auth-status"
          class="flex items-center gap-2 mt-5 text-sm text-text"
        >
          <UIcon
            name="i-tabler-bolt"
            class="text-base text-dodgerblue-600 shrink-0"
          />
          <span>Connected via <strong class="font-medium">LNURL-auth</strong></span>
        </div>

        <a
          v-if="me?.accountCenterUrl"
          :href="me.accountCenterUrl"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="account-center-link"
          class="inline-flex items-center gap-1.5 mt-5 text-sm font-medium text-dodgerblue-700 hover:underline"
        >
          Manage account in LogTo
          <UIcon
            name="i-tabler-external-link"
            class="text-base shrink-0"
          />
        </a>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const { data: me } = await useFetch<{
  sub: string
  name?: string
  username?: string
  email?: string
  accountCenterUrl: string | null
  lnurlAuth: boolean | null
}>('/api/admin/me')
const displayName = computed(() => me.value?.name || me.value?.username || me.value?.email || 'Unknown')

const revealed = ref(false)
</script>
