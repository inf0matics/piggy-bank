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
      <div class="relative">
        <input
          :id="field.key"
          v-model="form[field.key]"
          :type="field.secret && !revealed[field.key] ? 'password' : 'text'"
          :placeholder="field.placeholder"
          class="w-full px-3 py-2 border border-text/20 rounded-lg text-sm bg-[#f7f9fb] text-text"
          :class="{ 'pr-9': field.secret }"
        >
        <button
          v-if="field.secret"
          type="button"
          :aria-label="`${revealed[field.key] ? 'Hide' : 'Reveal'} ${field.label}`"
          class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center text-[#aac0d0] hover:text-dodgerblue-600"
          @click="revealed[field.key] = !revealed[field.key]"
        >
          <UIcon :name="revealed[field.key] ? 'i-tabler-eye-off' : 'i-tabler-eye'" />
        </button>
      </div>
      <p
        v-if="field.hint"
        class="text-[11px] text-[#7fa0b8] mt-1.5"
      >
        {{ field.hint }}
      </p>
    </div>

    <div class="mb-4">
      <button
        type="button"
        :disabled="testing"
        class="inline-flex items-center gap-1.5 border border-dodgerblue-300 text-dodgerblue-700 hover:bg-dodgerblue-50 disabled:opacity-60 text-sm font-medium px-3 py-1.5 rounded-lg"
        @click="testConnection"
      >
        <UIcon
          :name="testing ? 'i-tabler-loader-2' : 'i-tabler-plug-connected'"
          :class="{ 'animate-spin': testing }"
        />
        Test connection
      </button>
      <p
        v-if="testResult"
        data-testid="connection-result"
        class="mt-2 text-sm"
        :class="testResult.ok ? 'text-success' : 'text-error'"
      >
        <template v-if="testResult.ok">
          ✓ Connected — {{ testResult.lnurlpActive ? 'LNURL-p configured' : 'No LNURL-p configured' }}
        </template>
        <template v-else>
          ✗ {{ testResult.error }}
        </template>
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
const revealed = reactive<Record<string, boolean>>({})

interface ConnectionResult {
  ok: boolean
  lnurlpActive?: boolean
  balanceSats?: number
  error?: string
}
const testing = ref(false)
const testResult = ref<ConnectionResult | null>(null)

// Stale once the connection inputs change.
watch(() => [form.lnbitsUrl, form.invoiceKey], () => {
  testResult.value = null
})

const testConnection = async () => {
  testing.value = true
  testResult.value = null
  try {
    testResult.value = await $fetch<ConnectionResult>('/api/admin/piggy-banks/test-connection', {
      method: 'POST',
      body: { lnbitsUrl: form.lnbitsUrl, invoiceKey: form.invoiceKey },
    })
  } catch {
    testResult.value = { ok: false, error: 'Test failed. Please try again.' }
  } finally {
    testing.value = false
  }
}

const fields: Array<{ key: keyof PiggyBankFormValues, label: string, placeholder?: string, hint?: string, secret?: boolean }> = [
  { key: 'name', label: 'Name', placeholder: 'e.g. Anna' },
  { key: 'accessKey', label: 'PIN', placeholder: 'Login PIN', secret: true },
  { key: 'lnbitsUrl', label: 'LNBits URL', placeholder: 'https://your-lnbits.com' },
  { key: 'invoiceKey', label: 'LNBits invoice key', placeholder: 'Invoice / read key' },
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
