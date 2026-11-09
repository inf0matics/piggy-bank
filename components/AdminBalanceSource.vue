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
      <p class="text-[11px] text-dimmed mt-1">
        Last change {{ formatTime(balance.lastChange.time) }}
      </p>
    </template>

    <template v-else>
      <p class="text-sm font-bold text-highlighted">
        LNBits
      </p>
      <p class="text-[11px] text-muted mt-1.5 mb-3">
        The balance is read from the LNBits wallet. Switch to manual to freeze it and
        manage it here. The LNBits URL and key are kept.
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
          v-if="lnbitsSats === undefined"
          class="text-sm text-muted"
        >
          Reading the LNBits balance…
        </p>
        <p
          v-else-if="lnbitsSats !== null"
          data-testid="lnbits-balance"
          class="text-sm text-muted"
        >
          The LNBits balance is
          <span class="font-bold text-highlighted">{{ formatSatsCount(lnbitsSats) }}</span>.
          It becomes the starting balance, and the balance is no longer read from LNBits.
        </p>
        <template v-else>
          <p class="text-sm text-muted mb-3">
            The balance cannot be read from LNBits right now. Enter the starting balance.
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

const props = defineProps<{
  piggyBankId: string
  balance: Balance
}>()

const emit = defineEmits<{
  changed: []
}>()

const formatSatsCount = (sats: number) => `${sats.toLocaleString('en-US')} sats`

const switchOpen = ref(false)
// undefined: still reading; null: LNBits could not give a balance.
const lnbitsSats = ref<number | null | undefined>(undefined)
const enteredSats = ref('')
const switching = ref(false)
const error = ref<string | null>(null)

const startingSats = computed((): number | null => {
  if (lnbitsSats.value === undefined) return null
  if (lnbitsSats.value !== null) return lnbitsSats.value
  const text = enteredSats.value.trim()
  return /^\d+$/.test(text) ? Number(text) : null
})

// Only the latest read counts: a slow read from an earlier opening must not
// replace the balance the custodian is looking at.
let readId = 0

const openSwitch = async () => {
  const id = ++readId
  lnbitsSats.value = undefined
  enteredSats.value = ''
  error.value = null
  switchOpen.value = true
  let sats: number | null
  try {
    sats = (await $fetch<{ sats: number | null }>(`/api/admin/piggy-banks/${props.piggyBankId}/lnbits-balance`)).sats
  } catch {
    sats = null
  }
  if (id === readId) lnbitsSats.value = sats
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
