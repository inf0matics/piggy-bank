<template>
  <div>
    <TspAccountPage
      title="User"
      :name="displayName"
      :account-id="me?.sub"
      :manage-link="me?.accountCenterUrl ?? undefined"
    />

    <!-- piggybank's own connection status. TspAccountPage has no place for
         it, so it sits below the page, outside the card (no cards in cards). -->
    <div
      v-if="me?.lnurlAuth"
      data-testid="lnurl-auth-status"
      class="flex items-center gap-2 mt-6 text-sm text-default"
    >
      <UIcon
        name="i-tabler-bolt"
        class="text-base tsp-text-brand shrink-0"
      />
      <span>Connected via <strong class="font-bold">LNURL-auth</strong></span>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
  title: 'User',
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
</script>
