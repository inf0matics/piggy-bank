<template>
  <div>
    <button
      type="button"
      :disabled="disabled"
      class="inline-flex items-center gap-1.5 border border-primary/60 text-primary hover:bg-primary/10 disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed text-sm font-bold px-3 py-1.5 rounded-lg"
      @click="open"
    >
      <UIcon name="i-tabler-lock-open" />
      {{ label }}
    </button>

    <UModal
      v-model:open="dialogOpen"
      :title="label"
    >
      <template #body>
        <p
          v-if="wallet === undefined"
          class="text-sm text-muted"
        >
          Reading the {{ name }} balance…
        </p>
        <p
          v-else-if="wallet.sats === null"
          data-testid="switch-back-refused"
          class="text-sm text-error"
        >
          {{ WALLET_UNREADABLE[source][wallet.reason] }}
        </p>
        <p
          v-else-if="wallet.sats === sats"
          data-testid="balances-equal"
          class="text-sm text-muted"
        >
          The {{ name }} balance is
          <span class="font-bold text-highlighted">{{ withEur(wallet.sats) }}</span>,
          the same as the manual balance. From now on the balance is read from {{ name }}.
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
              {{ name }} balance
            </dt>
            <dd
              :data-testid="`compare-${source}`"
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
              {{ withEur(wallet.sats - sats, true) }}
            </dd>
          </dl>
          <p
            v-if="rate === null"
            class="text-[11px] text-dimmed mt-1"
          >
            EUR values are unavailable right now.
          </p>
          <p class="text-sm text-muted mt-3">
            After switching, the {{ name }} balance is the balance and the manual balance is no longer
            used. The app moves no money: settle the difference in the wallet yourself.
          </p>
          <UCheckbox
            v-model="acknowledged"
            class="mt-3"
            :label="`Use the ${name} balance of ${satsCount.format(wallet.sats)} sats`"
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
            :label="`Switch to ${name}`"
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
import { SOURCE_NAMES, WALLET_UNREADABLE, type WalletRead, type WalletSource } from '~/utils/switchBack'

const props = defineProps<{
  piggyBankId: string
  // The wallet the manual piggy bank switches to.
  source: WalletSource
  // The manual balance.
  sats: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  changed: []
}>()

const name = computed(() => SOURCE_NAMES[props.source])
const label = computed(() => props.source === 'lnbits' ? 'Switch back to LNBits' : 'Switch to marbles')

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

// Equal balances need no more than the button; different ones the checkbox too.
const canConfirm = computed(() => wallet.value?.sats != null && (wallet.value.sats === props.sats || acknowledged.value))

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
    $fetch<WalletRead>(`/api/admin/piggy-banks/${props.piggyBankId}/${props.source}-balance`)
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
    await $fetch(`/api/admin/piggy-banks/${props.piggyBankId}/${props.source}`, {
      method: 'POST',
      body: { manualSats: props.sats, [`${props.source}Sats`]: wallet.value.sats },
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
