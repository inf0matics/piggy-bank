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
    <TspPageHeader title="Edit piggy bank" />

    <AdminBalanceSource
      v-if="record"
      :piggy-bank-id="id"
      :balance="record.balance"
      :has-marbles="record.marblesKey !== ''"
      @changed="refresh"
    />

    <AdminPiggyBankForm
      :initial="initial"
      submit-label="Save"
      :submit-fn="save"
    />
  </div>
</template>

<script setup lang="ts">
import type { PiggyBankFormValues } from '~/components/AdminPiggyBankForm.vue'
import type { Balance } from '~/server/domain/user'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
  title: 'Edit piggy bank',
})

const id = useRoute().params.id as string

const [{ data: record, refresh }, { data: settings }] = await Promise.all([
  useFetch<PiggyBankFormValues & { id: string, balance: Balance }>(`/api/admin/piggy-banks/${id}`),
  useFetch<{ defaultMarblesUrl: string }>('/api/admin/settings'),
])

if (!record.value) {
  throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
}

const initial: PiggyBankFormValues = {
  name: record.value.name,
  accessKey: record.value.accessKey,
  lnbitsUrl: record.value.lnbitsUrl,
  invoiceKey: record.value.invoiceKey,
  // Without marbles settings yet, the default marbles URL pre-fills the field.
  marblesUrl: record.value.marblesUrl || settings.value?.defaultMarblesUrl || '',
  marblesKey: record.value.marblesKey,
  marblesWallet: record.value.marblesWallet,
}

const save = async (values: PiggyBankFormValues) => {
  await $fetch(`/api/admin/piggy-banks/${id}`, { method: 'PUT', body: values })
  await navigateTo('/admin/piggy-banks')
}
</script>
