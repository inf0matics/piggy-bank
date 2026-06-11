<template>
  <div>
    <header class="flex items-center gap-2 bg-elevated px-7 py-4 border-b border-default">
      <NuxtLink
        to="/admin/piggy-banks"
        aria-label="Back"
        class="text-dimmed hover:text-highlighted"
      >
        <UIcon name="i-tabler-arrow-left" />
      </NuxtLink>
      <h1 class="font-bold text-xl text-highlighted">
        Add piggy bank
      </h1>
    </header>

    <div class="px-7 py-5">
      <AdminPiggyBankForm
        :initial="initial"
        submit-label="Create"
        :submit-fn="create"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PiggyBankFormValues } from '~/components/AdminPiggyBankForm.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

// Pre-fill the LNBits URL with the configured default from Settings.
const { data: settings } = await useFetch<{ defaultLnbitsUrl: string }>('/api/admin/settings')

const initial: PiggyBankFormValues = {
  name: '',
  accessKey: '',
  lnbitsUrl: settings.value?.defaultLnbitsUrl ?? '',
  invoiceKey: '',
}

const create = async (values: PiggyBankFormValues) => {
  await $fetch('/api/admin/piggy-banks', { method: 'POST', body: values })
  await navigateTo('/admin/piggy-banks')
}
</script>
