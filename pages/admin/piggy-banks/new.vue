<template>
  <div>
    <!-- Navigation, not title: the back arrow takes its own line above the
         header, which has no slot for it. -->
    <NuxtLink
      to="/admin/piggy-banks"
      aria-label="Back"
      class="inline-flex mb-2 text-dimmed hover:text-highlighted"
    >
      <UIcon
        name="i-tabler-arrow-left"
        class="text-lg"
      />
    </NuxtLink>
    <TspPageHeader title="Add piggy bank" />

    <AdminPiggyBankForm
      :initial="initial"
      submit-label="Create"
      :submit-fn="create"
    />
  </div>
</template>

<script setup lang="ts">
import type { PiggyBankFormValues } from '~/components/AdminPiggyBankForm.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
  title: 'Add piggy bank',
})

// Pre-fill the LNBits and marbles URLs with the configured defaults from Settings.
const { data: settings } = await useFetch<{ defaultLnbitsUrl: string, defaultMarblesUrl: string }>('/api/admin/settings')

const initial: PiggyBankFormValues = {
  name: '',
  accessKey: '',
  lnbitsUrl: settings.value?.defaultLnbitsUrl ?? '',
  invoiceKey: '',
  marblesUrl: settings.value?.defaultMarblesUrl ?? '',
  marblesKey: '',
  marblesWallet: '',
}

const create = async (values: PiggyBankFormValues) => {
  await $fetch('/api/admin/piggy-banks', { method: 'POST', body: values })
  await navigateTo('/admin/piggy-banks')
}
</script>
