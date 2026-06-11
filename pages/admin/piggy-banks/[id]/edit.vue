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
        Edit piggy bank
      </h1>
    </header>

    <div class="px-7 py-5">
      <AdminPiggyBankForm
        :initial="initial"
        submit-label="Save"
        :submit-fn="save"
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

const id = useRoute().params.id as string

const { data: record } = await useFetch<{
  id: string
  name: string
  accessKey: string
  lnbitsUrl: string
  invoiceKey: string
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
