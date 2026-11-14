<template>
  <section
    data-testid="balance-source"
    class="bg-elevated rounded-[10px] border border-default p-6 max-w-[480px] mb-4"
  >
    <h2 class="text-xs font-bold text-muted mb-1.5">
      Balance source
    </h2>

    <template v-if="balance.source === 'manual'">
      <p class="text-sm font-bold text-highlighted">
        Manual
      </p>
      <p class="text-sm text-muted mt-3">
        Current balance
      </p>
      <p
        data-testid="manual-balance"
        class="font-bold text-2xl text-highlighted tabular-nums"
      >
        {{ formatSatsCount(balance.sats) }}
      </p>
      <p
        v-if="balance.lastChange"
        class="text-[11px] text-dimmed mt-1"
      >
        Last change {{ formatTime(balance.lastChange.time) }}
      </p>
      <AdminManualBalanceChange
        :piggy-bank-id="piggyBankId"
        :sats="balance.sats"
        @changed="emit('changed')"
      />
      <div class="mt-5 pt-4 border-t border-default">
        <p class="text-[11px] text-muted mb-3">
          Put the piggy bank on LNBits or on marbles with the settings saved below. To use other
          settings, change and save them first.
        </p>
        <div class="flex flex-wrap gap-2">
          <AdminSwitchBack
            :piggy-bank-id="piggyBankId"
            source="lnbits"
            :sats="balance.sats"
            @changed="emit('changed')"
          />
          <AdminSwitchBack
            :piggy-bank-id="piggyBankId"
            source="marbles"
            :sats="balance.sats"
            :disabled="!hasMarbles"
            @changed="emit('changed')"
          />
        </div>
        <p
          v-if="!hasMarbles"
          class="text-[11px] text-dimmed mt-2"
        >
          Save the marbles settings below to switch to marbles.
        </p>
      </div>
    </template>

    <template v-else>
      <p class="text-sm font-bold text-highlighted">
        {{ sourceName }}
      </p>
      <p class="text-[11px] text-muted mt-1.5 mb-3">
        The balance is read from the {{ sourceName }} wallet. Switch to manual to freeze it and
        manage it here. The {{ sourceName }} settings are kept.
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 border border-primary/60 text-primary hover:bg-primary/10 text-sm font-bold px-3 py-1.5 rounded-lg"
        @click="openSwitch"
      >
        <UIcon name="i-tabler-lock" />
        Switch to manual
      </button>
    </template>

    <UModal
      v-model:open="switchOpen"
      title="Switch to manual balance"
    >
      <template #body>
        <p
          v-if="walletSats === undefined"
          class="text-sm text-muted"
        >
          Reading the {{ sourceName }} balance…
        </p>
        <p
          v-else-if="walletSats !== null"
          data-testid="wallet-balance"
          class="text-sm text-muted"
        >
          The {{ sourceName }} balance is
          <span class="font-bold text-highlighted">{{ formatSatsCount(walletSats) }}</span>.
          It becomes the starting balance, and the balance is no longer read from {{ sourceName }}.
        </p>
        <template v-else>
          <p class="text-sm text-muted mb-3">
            The balance cannot be read from {{ sourceName }} right now. Enter the starting balance.
          </p>
          <label
            for="startingSats"
            class="block text-xs font-bold text-muted mb-1.5"
          >Starting balance (sats)</label>
          <input
            id="startingSats"
            v-model="enteredSats"
            type="text"
            inputmode="numeric"
            placeholder="e.g. 100000"
            class="w-full px-3 py-2 border border-default rounded-lg text-sm bg-default text-default focus:outline-none focus:border-primary"
          >
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
            @click="switchOpen = false"
          />
          <UButton
            label="Switch to manual"
            :disabled="startingSats === null"
            :loading="switching"
            @click="confirmSwitch"
          />
        </div>
      </template>
    </UModal>
  </section>
</template>

<script setup lang="ts">
// Explicit import (a Nuxt auto-import at runtime): vue-tsc does not resolve
// auto-imported utils in template scope, only in <script>.
import formatTime from '~/utils/formatTime'
import type { Balance } from '~/server/domain/user'
import { SOURCE_NAMES, type WalletRead } from '~/utils/switchBack'

const props = defineProps<{
  piggyBankId: string
  balance: Balance
  // Whether marbles settings are saved, so the piggy bank can switch to marbles.
  hasMarbles: boolean
}>()

const emit = defineEmits<{
  changed: []
}>()

const formatSatsCount = (sats: number) => `${sats.toLocaleString('en-US')} sats`

const sourceName = computed(() => props.balance.source === 'manual' ? '' : SOURCE_NAMES[props.balance.source])

const switchOpen = ref(false)
// undefined: still reading; null: the wallet could not give a balance.
const walletSats = ref<number | null | undefined>(undefined)
const enteredSats = ref('')
const switching = ref(false)
const error = ref<string | null>(null)

const startingSats = computed((): number | null => {
  if (walletSats.value === undefined) return null
  if (walletSats.value !== null) return walletSats.value
  const text = enteredSats.value.trim()
  return /^\d+$/.test(text) ? Number(text) : null
})

// Only the latest read counts: a slow read from an earlier opening must not
// replace the balance the custodian is looking at.
let readId = 0

const openSwitch = async () => {
  if (props.balance.source === 'manual') return
  const id = ++readId
  walletSats.value = undefined
  enteredSats.value = ''
  error.value = null
  switchOpen.value = true
  let sats: number | null
  try {
    sats = (await $fetch<WalletRead>(`/api/admin/piggy-banks/${props.piggyBankId}/${props.balance.source}-balance`)).sats
  } catch {
    sats = null
  }
  if (id === readId) walletSats.value = sats
}

const confirmSwitch = async () => {
  if (startingSats.value === null) return
  error.value = null
  switching.value = true
  try {
    await $fetch(`/api/admin/piggy-banks/${props.piggyBankId}/manual`, {
      method: 'POST',
      body: { sats: startingSats.value },
    })
    switchOpen.value = false
    emit('changed')
  } catch (e) {
    const err = e as { data?: { statusMessage?: string } }
    error.value = err?.data?.statusMessage || 'Could not switch. Please try again.'
  } finally {
    switching.value = false
  }
}
</script>
