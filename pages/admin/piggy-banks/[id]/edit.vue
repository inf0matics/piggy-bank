<template>
  <div>
    <div class="flex items-center gap-2 mb-6">
      <NuxtLink
        to="/admin/piggy-banks"
        aria-label="Back"
        class="text-dimmed hover:text-highlighted"
      >
        <UIcon
          name="i-tabler-arrow-left"
          class="text-lg"
        />
      </NuxtLink>
      <h1 class="font-bold text-2xl text-highlighted">
        Edit piggy bank
      </h1>
    </div>

    <AdminBalanceSource
      v-if="record"
      :piggy-bank-id="id"
      :balance="record.balance"
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
import type { AdminBalance } from '~/components/AdminBalanceSource.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const id = useRoute().params.id as string

const { data: record, refresh } = await useFetch<{
  id: string
  name: string
  accessKey: string
  lnbitsUrl: string
  invoiceKey: string
  balance: AdminBalance
}>(`/api/admin/piggy-banks/${id}`)

if (!record.value) {
  throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
}

const initial: PiggyBankFormValues = {
  name: record.value.name,
  accessKey: record.value.accessKey,
  lnbitsUrl: record.value.lnbitsUrl,
  invoiceKey: record.value.invoiceKey,
}

const save = async (values: PiggyBankFormValues) => {
  await $fetch(`/api/admin/piggy-banks/${id}`, { method: 'PUT', body: values })
  await navigateTo('/admin/piggy-banks')
}
</script>
