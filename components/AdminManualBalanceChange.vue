<template>
  <form
    class="mt-5 pt-4 border-t border-default"
    @submit.prevent="confirmChange"
  >
    <label
      for="balanceChange"
      class="block text-xs font-bold text-muted mb-1.5"
    >Change balance (EUR)</label>
    <input
      id="balanceChange"
      v-model="amount"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      placeholder="25, +10 or -10"
      class="w-full px-3 py-2 border border-default rounded-lg text-sm bg-default text-default focus:outline-none focus:border-primary"
    >
    <p class="text-[11px] text-dimmed mt-1">
      An amount sets the balance, +10 adds and -10 subtracts.
    </p>

    <label
      for="balanceComment"
      class="block text-xs font-bold text-muted mt-3 mb-1.5"
    >Comment (optional)</label>
    <input
      id="balanceComment"
      v-model="comment"
      type="text"
      :maxlength="MAX_COMMENT_LENGTH"
      placeholder="e.g. Pocket money"
      class="w-full px-3 py-2 border border-default rounded-lg text-sm bg-default text-default focus:outline-none focus:border-primary"
    >

    <p
      v-if="rate === null"
      data-testid="rate-unavailable"
      class="text-sm text-error mt-3"
    >
      No BTC/EUR rate is available right now, so the balance cannot be changed. Try again in a moment.
    </p>
    <p
      v-else-if="pending && 'error' in pending"
      data-testid="balance-change-error"
      class="text-sm text-error mt-3"
    >
      {{ pending.error }}
    </p>
    <p
      v-else-if="pending"
      data-testid="balance-preview"
      class="text-sm text-highlighted mt-3 tabular-nums"
    >
      {{ pending.preview }}
    </p>
    <p
      v-if="submitError"
      class="text-sm text-error mt-3"
    >
      {{ submitError }}
    </p>

    <div class="flex justify-end mt-3">
      <UButton
        type="submit"
        label="Update balance"
        :disabled="!pending || 'error' in pending"
        :loading="submitting"
      />
    </div>
  </form>
</template>

<script setup lang="ts">
import {
  applyManualChange,
  eurChangeToSats,
  MAX_COMMENT_LENGTH,
  parseEurChange,
  satsToEur,
  type ManualChange,
} from '~/utils/manualBalanceChange'

const props = defineProps<{
  piggyBankId: string
  sats: number
}>()

const emit = defineEmits<{
  changed: []
}>()

// Kept current while the view is open, so a change converts at today's rate.
const RATE_REFRESH_MS = 30_000

// undefined: still loading; null: no rate available, so no change is possible.
const rate = ref<number | null | undefined>(undefined)
const amount = ref('')
const comment = ref('')
const submitting = ref(false)
const submitError = ref<string | null>(null)

const loadRate = async () => {
  try {
    rate.value = (await $fetch<{ rate: number | null }>('/api/admin/btc-rate')).rate
  } catch {
    rate.value = null
  }
}

let rateTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  loadRate()
  rateTimer = setInterval(loadRate, RATE_REFRESH_MS)
})
onUnmounted(() => clearInterval(rateTimer))

const eur = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' })
const signedEur = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', signDisplay: 'exceptZero' })
const rateEur = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const satsCount = new Intl.NumberFormat('en-US')
const signedSats = new Intl.NumberFormat('en-US', { signDisplay: 'exceptZero' })

// What confirming would do, with the preview the custodian sees, or why it is
// refused. Null while there is nothing to confirm.
const pending = computed((): { change: ManualChange, preview: string } | { error: string } | null => {
  if (typeof rate.value !== 'number' || !amount.value.trim()) return null
  const typed = parseEurChange(amount.value)
  if (!typed) return { error: 'Enter an amount like 25, +10 or -10' }

  const change = eurChangeToSats(typed, rate.value)
  const result = applyManualChange(props.sats, change)
  if ('error' in result) return result

  const atRate = `at ${rateEur.format(rate.value)} / BTC`
  const preview = change.mode === 'set'
    ? `New balance ${eur.format(typed.eur)} ≈ ${satsCount.format(result.sats)} sats ${atRate} (${signedSats.format(result.delta)} sats)`
    : `${signedEur.format(typed.eur)} ≈ ${signedSats.format(change.sats)} sats ${atRate} → new balance ${satsCount.format(result.sats)} sats (≈ ${eur.format(satsToEur(result.sats, rate.value))})`
  return { change, preview }
})

const confirmChange = async () => {
  const confirmed = pending.value
  if (!confirmed || 'error' in confirmed) return
  submitError.value = null
  submitting.value = true
  try {
    await $fetch(`/api/admin/piggy-banks/${props.piggyBankId}/balance`, {
      method: 'POST',
      body: { ...confirmed.change, comment: comment.value },
    })
    amount.value = ''
    comment.value = ''
    emit('changed')
  } catch (e) {
    const err = e as { data?: { statusMessage?: string } }
    submitError.value = err?.data?.statusMessage || 'Could not change the balance. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>
