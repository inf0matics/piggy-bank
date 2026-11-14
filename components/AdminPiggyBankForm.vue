<template>
  <form
    class="bg-elevated rounded-[10px] border border-default p-6 max-w-[480px]"
    @submit.prevent="onSubmit"
  >
    <section
      v-for="section in sections"
      :key="section.key"
      :data-testid="`form-${section.key}`"
      :class="{ 'border-t border-default pt-4 mt-2': section.title }"
    >
      <h3
        v-if="section.title"
        class="text-xs font-bold uppercase tracking-wide text-muted mb-3"
      >
        {{ section.title }}
      </h3>
      <div
        v-for="field in section.fields"
        :key="field.key"
        class="mb-4"
      >
        <label
          :for="field.key"
          class="block text-xs font-bold text-muted mb-1.5"
        >{{ field.label }}</label>
        <div class="relative">
          <input
            :id="field.key"
            v-model="form[field.key]"
            :type="field.secret && !revealed[field.key] ? 'password' : 'text'"
            :placeholder="field.placeholder"
            class="w-full px-3 py-2 border border-default rounded-lg text-sm bg-default text-default focus:outline-none focus:border-primary"
            :class="{ 'pr-9': field.secret }"
          >
          <button
            v-if="field.secret"
            type="button"
            :aria-label="`${revealed[field.key] ? 'Hide' : 'Reveal'} ${field.label}`"
            class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center text-dimmed hover:text-primary"
            @click="revealed[field.key] = !revealed[field.key]"
          >
            <UIcon :name="revealed[field.key] ? 'i-tabler-eye-off' : 'i-tabler-eye'" />
          </button>
        </div>
        <p
          v-if="field.hint"
          class="text-[11px] text-muted mt-1.5"
        >
          {{ field.hint }}
        </p>
      </div>

      <div
        v-if="section.key === 'lnbits'"
        class="mb-4"
      >
        <button
          type="button"
          :disabled="testing"
          :class="TEST_BUTTON"
          @click="testConnection"
        >
          <UIcon
            :name="testing ? 'i-tabler-loader-2' : 'i-tabler-plug-connected'"
            :class="{ 'animate-spin': testing }"
          />
          Test LNBits connection
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

      <div
        v-if="section.key === 'marbles'"
        class="mb-4"
      >
        <button
          type="button"
          :disabled="testingMarbles"
          :class="TEST_BUTTON"
          @click="testMarbles"
        >
          <UIcon
            :name="testingMarbles ? 'i-tabler-loader-2' : 'i-tabler-plug-connected'"
            :class="{ 'animate-spin': testingMarbles }"
          />
          Test marbles connection
        </button>
        <div
          v-if="marblesResult"
          data-testid="marbles-connection-result"
          class="mt-2 text-sm"
        >
          <template v-if="marblesResult.ok">
            <p class="text-success">
              ✓ Connected to the wallet “{{ marblesResult.walletName }}”
            </p>
            <ul class="text-muted mt-1 text-[13px] space-y-0.5">
              <li>Balance {{ marblesResult.balanceSats.toLocaleString('en-US') }} sats</li>
              <li>{{ marblesResult.payLinkActive ? 'Active pay link' : 'No active pay link' }}</li>
              <li>Key expires {{ formatExpiry(marblesResult.expiresAt) }}</li>
            </ul>
            <p
              v-if="marblesResult.riskyRights.length > 0"
              data-testid="marbles-risky-rights"
              class="text-warning mt-2"
            >
              ⚠ This key has the right{{ marblesResult.riskyRights.length > 1 ? 's' : '' }}
              {{ marblesResult.riskyRights.join(' and ') }}, which can move money out of the wallet.
              The piggy bank never needs that: make a key with only read and pay_links.
            </p>
          </template>
          <p
            v-else
            class="text-error"
          >
            ✗ {{ marblesResult.error }}
          </p>
        </div>
      </div>
    </section>

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
        class="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-600 disabled:opacity-60 text-inverted font-bold text-sm px-4 py-1.5 rounded-lg"
      >
        <UIcon name="i-tabler-device-floppy" />
        {{ submitLabel }}
      </button>
      <NuxtLink
        to="/admin/piggy-banks"
        class="text-sm text-muted hover:text-highlighted"
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
  marblesUrl: string
  marblesKey: string
  marblesWallet: string
}

const props = defineProps<{
  initial: PiggyBankFormValues
  submitLabel: string
  submitFn: (values: PiggyBankFormValues) => Promise<void>
}>()

const TEST_BUTTON = 'inline-flex items-center gap-1.5 border border-primary/60 text-primary hover:bg-primary/10 disabled:opacity-60 text-sm font-bold px-3 py-1.5 rounded-lg'

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

type MarblesResult
  = | { ok: true, walletName: string, balanceSats: number, payLinkActive: boolean, expiresAt: string | null, riskyRights: string[] }
    | { ok: false, error: string }
const testingMarbles = ref(false)
const marblesResult = ref<MarblesResult | null>(null)

watch(() => [form.marblesUrl, form.marblesKey, form.marblesWallet], () => {
  marblesResult.value = null
})

const testMarbles = async () => {
  testingMarbles.value = true
  marblesResult.value = null
  try {
    marblesResult.value = await $fetch<MarblesResult>('/api/admin/piggy-banks/marbles-test-connection', {
      method: 'POST',
      body: { marblesUrl: form.marblesUrl, marblesKey: form.marblesKey, marblesWallet: form.marblesWallet },
    })
  } catch {
    marblesResult.value = { ok: false, error: 'Test failed. Please try again.' }
  } finally {
    testingMarbles.value = false
  }
}

const formatExpiry = (expiresAt: string | null) =>
  expiresAt === null ? 'never' : new Date(expiresAt).toLocaleDateString('en-US', { dateStyle: 'medium' })

interface Field {
  key: keyof PiggyBankFormValues
  label: string
  placeholder?: string
  hint?: string
  secret?: boolean
}

const sections: Array<{ key: string, title?: string, fields: Field[] }> = [
  {
    key: 'general',
    fields: [
      { key: 'name', label: 'Name', placeholder: 'e.g. Anna' },
      { key: 'accessKey', label: 'PIN', placeholder: 'Login PIN', secret: true },
    ],
  },
  {
    key: 'lnbits',
    title: 'LNBits',
    fields: [
      { key: 'lnbitsUrl', label: 'LNBits URL', placeholder: 'https://your-lnbits.com' },
      { key: 'invoiceKey', label: 'LNBits invoice key', placeholder: 'Invoice / read key' },
    ],
  },
  {
    key: 'marbles',
    title: 'marbles',
    fields: [
      { key: 'marblesUrl', label: 'marbles URL', placeholder: 'https://marbles.example.com' },
      {
        key: 'marblesKey',
        label: 'marbles API key',
        placeholder: 'mbl_…',
        secret: true,
        hint: 'Make the key in marbles (Account → API keys) with only the rights read and pay_links. The piggy bank never needs pay or withdraw_links.',
      },
      { key: 'marblesWallet', label: 'marbles wallet id', placeholder: '16 characters' },
    ],
  },
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
