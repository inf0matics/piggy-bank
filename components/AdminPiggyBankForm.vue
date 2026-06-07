<template>
  <form
    class="bg-white rounded-[10px] border border-text/10 p-6 max-w-[480px]"
    @submit.prevent="onSubmit"
  >
    <div
      v-for="field in fields"
      :key="field.key"
      class="mb-4"
    >
      <label
        :for="field.key"
        class="block text-xs font-medium text-[#3a6080] mb-1.5"
      >{{ field.label }}</label>
      <input
        :id="field.key"
        v-model="form[field.key]"
        :type="field.type"
        :placeholder="field.placeholder"
        class="w-full px-3 py-2 border border-text/20 rounded-lg text-sm bg-[#f7f9fb] text-text"
      >
      <p
        v-if="field.hint"
        class="text-[11px] text-[#7fa0b8] mt-1.5"
      >
        {{ field.hint }}
      </p>
    </div>

    <p
      v-if="error"
      class="text-sm text-error mb-3"
    >
      {{ error }}
    </p>

    <div class="flex items-center gap-3 mt-2">
      <button
        type="submit"
        :disabled="submitting"
        class="inline-flex items-center gap-1.5 bg-dodgerblue-600 hover:bg-dodgerblue-700 disabled:opacity-60 text-white font-heading font-medium text-sm px-4 py-1.5 rounded-lg"
      >
        <UIcon name="i-tabler-device-floppy" />
        {{ submitLabel }}
      </button>
      <NuxtLink
        to="/admin/piggy-banks"
        class="text-sm text-text/60 hover:text-text"
      >
        Cancel
      </NuxtLink>
    </div>
  </form>
</template>

<script setup lang="ts">
export interface PiggyBankFormValues {
  name: string
  accessKey: string
  lnbitsUrl: string
  invoiceKey: string
}

const props = defineProps<{
  initial: PiggyBankFormValues
  submitLabel: string
  submitFn: (values: PiggyBankFormValues) => Promise<void>
}>()

const form = reactive<PiggyBankFormValues>({ ...props.initial })
const error = ref<string | null>(null)
const submitting = ref(false)

const fields: Array<{ key: keyof PiggyBankFormValues, label: string, type: string, placeholder?: string, hint?: string }> = [
  { key: 'name', label: 'Name', type: 'text', placeholder: 'e.g. Anna' },
  { key: 'accessKey', label: 'PIN', type: 'text', placeholder: 'Login PIN' },
  { key: 'lnbitsUrl', label: 'LNBits URL', type: 'text', placeholder: 'https://your-lnbits.com' },
  { key: 'invoiceKey', label: 'LNBits invoice key', type: 'text', placeholder: 'Invoice / read key' },
]

const onSubmit = async () => {
  error.value = null
  submitting.value = true
  try {
    await props.submitFn({ ...form })
  } catch (e) {
    const err = e as { statusMessage?: string, data?: { statusMessage?: string, message?: string } }
    error.value = err?.data?.statusMessage || err?.data?.message || err?.statusMessage || 'Something went wrong'
  } finally {
    submitting.value = false
  }
}
</script>
