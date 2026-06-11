<template>
  <div>
    <h1 class="font-bold text-2xl text-highlighted mb-6">
      User
    </h1>

    <section
      data-testid="user-account"
      class="bg-elevated rounded-[10px] border border-default p-6 max-w-[480px]"
    >
      <div class="flex items-center gap-3 mb-5">
        <UIcon
          name="i-tabler-user-circle"
          class="text-4xl text-primary shrink-0"
        />
        <div class="min-w-0">
          <p class="font-bold text-base truncate text-highlighted">
            {{ displayName }}
          </p>
          <p class="text-xs text-muted">
            tsp.tools account
          </p>
        </div>
      </div>

      <div v-if="me?.sub">
        <p class="text-xs font-bold text-muted mb-1">
          tsp.tools ID
        </p>
        <div class="flex items-center gap-2">
          <p class="font-mono text-sm text-default break-all">
            {{ revealed ? me.sub : '••••••••••••' }}
          </p>
          <button
            type="button"
            :aria-label="revealed ? 'Hide ID' : 'Show ID'"
            class="flex items-center text-dimmed hover:text-primary shrink-0"
            @click="revealed = !revealed"
          >
            <UIcon :name="revealed ? 'i-tabler-eye-off' : 'i-tabler-eye'" />
          </button>
        </div>
      </div>

      <div
        v-if="me?.lnurlAuth"
        data-testid="lnurl-auth-status"
        class="flex items-center gap-2 mt-5 text-sm text-default"
      >
        <UIcon
          name="i-tabler-bolt"
          class="text-base text-primary shrink-0"
        />
        <span>Connected via <strong class="font-bold">LNURL-auth</strong></span>
      </div>

      <a
        v-if="me?.accountCenterUrl"
        :href="me.accountCenterUrl"
        target="_blank"
        rel="noopener noreferrer"
        data-testid="account-center-link"
        class="inline-flex items-center gap-1.5 mt-5 text-sm font-bold text-primary hover:underline"
      >
        Manage account in LogTo
        <UIcon
          name="i-tabler-external-link"
          class="text-base shrink-0"
        />
      </a>
    </section>
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
