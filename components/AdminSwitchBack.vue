<template>
  <div class="mt-5 pt-4 border-t border-default">
    <p class="text-[11px] text-muted mb-3">
      Put the piggy bank back on LNBits with the URL and invoice key saved below. To use another
      LNBits instance, change and save them first.
    </p>
    <button
      type="button"
      class="inline-flex items-center gap-1.5 border border-primary/60 text-primary hover:bg-primary/10 text-sm font-bold px-3 py-1.5 rounded-lg"
      @click="open"
    >
      <UIcon name="i-tabler-lock-open" />
      Switch back to LNBits
    </button>

    <UModal
      v-model:open="dialogOpen"
      title="Switch back to LNBits"
    >
      <template #body>
        <p
          v-if="wallet === undefined"
          class="text-sm text-muted"
        >
          Reading the LNBits balance…
        </p>
        <p
          v-else-if="wallet.sats === null"
          data-testid="switch-back-refused"
          class="text-sm text-error"
        >
          {{ WALLET_UNREADABLE[wallet.reason] }}
        </p>
        <p
          v-else-if="difference === 0"
          data-testid="balances-equal"
          class="text-sm text-muted"
        >
          The LNBits balance is
          <span class="font-bold text-highlighted">{{ withEur(wallet.sats) }}</span>,
          the same as the manual balance. From now on the balance is read from LNBits.
        </p>
        <template v-else>
          <dl
            data-testid="balance-comparison"
            class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm tabular-nums"
          >
            <dt class="text-muted">
              Manual balance
            </dt>
            <dd
              data-testid="compare-manual"
              class="text-highlighted text-right"
            >
              {{ withEur(sats) }}
            </dd>
            <dt class="text-muted">
              LNBits balance
            </dt>
            <dd
              data-testid="compare-lnbits"
              class="text-highlighted text-right"
            >
              {{ withEur(wallet.sats) }}
            </dd>
            <dt class="text-muted font-bold">
              Difference
            </dt>
            <dd
              data-testid="compare-difference"
              class="text-highlighted font-bold text-right"
            >
              {{ withEur(difference ?? 0, true) }}
            </dd>
          </dl>
          <p
            v-if="rate === null"
            class="text-[11px] text-dimmed mt-1"
          >
            EUR values are unavailable right now.
          </p>
          <p class="text-sm text-muted mt-3">
            After switching, the LNBits balance is the balance and the manual balance is no longer
            used. The app moves no money: settle the difference in the wallet yourself.
          </p>
          <UCheckbox
            v-model="acknowledged"
            class="mt-3"
            :label="`Use the LNBits balance of ${satsCount.format(wallet.sats)} sats`"
          />
        </template>
        <p
          v-if="error"
          class="text-sm text-error mt-3"
        >
          {{ error }}
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton
            color="neutral"
            variant="ghost"
            label="Cancel"
            @click="dialogOpen = false"
          />
          <UButton
            label="Switch to LNBits"
            :disabled="!canConfirm"
            :loading="switching"
            @click="confirm"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { satsToEur } from '~/utils/manualBalanceChange'
import { WALLET_UNREADABLE, type WalletRead } from '~/utils/switchBack'

const props = defineProps<{
  piggyBankId: string
  // The manual balance.
  sats: number
}>()

const emit = defineEmits<{
  changed: []
}>()

const dialogOpen = ref(false)
// undefined: still reading.
const wallet = ref<WalletRead | undefined>(undefined)
// undefined: still loading; null: no rate, so sats only.
const rate = ref<number | null | undefined>(undefined)
const acknowledged = ref(false)
const switching = ref(false)
const error = ref<string | null>(null)

const satsCount = new Intl.NumberFormat('en-US')
const signedSats = new Intl.NumberFormat('en-US', { signDisplay: 'exceptZero' })
const eur = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' })
const signedEur = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', signDisplay: 'exceptZero' })

const withEur = (sats: number, signed = false) => {
  const inSats = `${(signed ? signedSats : satsCount).format(sats)} sats`
  if (typeof rate.value !== 'number') return inSats
  return `${inSats} ≈ ${(signed ? signedEur : eur).format(satsToEur(sats, rate.value))}`
}

// LNBits minus manual, null until LNBits gave its balance.
const difference = computed(() => wallet.value?.sats == null ? null : wallet.value.sats - props.sats)

// Equal balances need no more than the button; different ones the checkbox too.
const canConfirm = computed(() => difference.value !== null && (difference.value === 0 || acknowledged.value))

// Only the latest opening counts: a slow read from an earlier one must not
// replace what the custodian is looking at.
let readId = 0

const open = async () => {
  const id = ++readId
  wallet.value = undefined
  rate.value = undefined
  acknowledged.value = false
  error.value = null
  dialogOpen.value = true

  const [read, btcRate] = await Promise.all([
    $fetch<WalletRead>(`/api/admin/piggy-banks/${props.piggyBankId}/lnbits-balance`)
      .catch((): WalletRead => ({ sats: null, reason: 'unreachable' })),
    $fetch<{ rate: number | null }>('/api/admin/btc-rate')
      .then(r => r.rate)
      .catch(() => null),
  ])
  if (id !== readId) return
  wallet.value = read
  rate.value = btcRate
}

const confirm = async () => {
  if (!canConfirm.value || wallet.value?.sats == null) return
  error.value = null
  switching.value = true
  try {
    await $fetch(`/api/admin/piggy-banks/${props.piggyBankId}/lnbits`, {
      method: 'POST',
      body: { manualSats: props.sats, lnbitsSats: wallet.value.sats },
    })
    dialogOpen.value = false
    emit('changed')
  } catch (e) {
    const err = e as { data?: { statusMessage?: string } }
    error.value = err?.data?.statusMessage || 'Could not switch. Please try again.'
  } finally {
    switching.value = false
  }
}
</script>
