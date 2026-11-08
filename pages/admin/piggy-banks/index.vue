<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <h1 class="font-bold text-2xl text-highlighted">
        Piggy Banks
      </h1>
      <span class="flex-1" />
      <NuxtLink
        to="/admin/piggy-banks/new"
        class="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-600 text-inverted font-bold text-sm px-4 py-1.5 rounded-lg"
      >
        <UIcon name="i-tabler-plus" />
        Add piggy bank
      </NuxtLink>
    </div>

    <p
      v-if="piggyBanks.length === 0"
      class="text-muted text-sm"
    >
      No piggy banks yet. Click "Add piggy bank" to create one.
    </p>

    <div
      v-for="pb in piggyBanks"
      :key="pb.id"
      data-testid="pb-row"
      class="flex items-center gap-3 bg-elevated rounded-[10px] border border-default px-4 py-3 mb-2.5"
    >
      <div class="flex-1 min-w-0">
        <NuxtLink
          :to="`/admin/piggy-banks/${pb.id}/edit`"
          class="block truncate group"
        >
          <span class="font-bold text-sm text-highlighted group-hover:underline">{{ pb.name }}</span>
          <span class="text-dimmed mx-1">@</span>
          <span class="text-sm text-muted group-hover:underline">{{ hostOf(pb.lnbitsUrl) }}</span>
        </NuxtLink>
        <div class="flex items-center gap-1 mt-0.5 text-[11px] text-dimmed">
          <UIcon name="i-tabler-clock" />
          <span>{{ lastTxText(statuses.get(pb.id)) }}</span>
        </div>
      </div>

      <div class="flex items-center gap-1 bg-default border border-default rounded-md px-2 py-1 shrink-0">
        <span class="font-mono text-xs tracking-widest min-w-9 text-center">
          {{ revealed.has(pb.id) ? pb.accessKey : '•'.repeat(pb.accessKey.length) }}
        </span>
        <button
          type="button"
          :aria-label="revealed.has(pb.id) ? 'Hide PIN' : 'Reveal PIN'"
          class="flex items-center text-dimmed hover:text-primary"
          @click="togglePin(pb.id)"
        >
          <UIcon :name="revealed.has(pb.id) ? 'i-tabler-eye-off' : 'i-tabler-eye'" />
        </button>
      </div>

      <div
        :data-lnurlp="stateOf(pb.id)"
        :aria-label="BADGES[stateOf(pb.id)].ariaLabel"
        class="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
        :class="BADGES[stateOf(pb.id)].pill"
      >
        <span
          class="w-1.5 h-1.5 rounded-full"
          :class="BADGES[stateOf(pb.id)].dot"
        />
        {{ BADGES[stateOf(pb.id)].label }}
      </div>

      <div class="flex items-center gap-1 shrink-0">
        <UTooltip
          :text="BADGES[stateOf(pb.id)].depositHint"
          :delay-duration="0"
        >
          <button
            type="button"
            aria-label="Deposit"
            :aria-disabled="stateOf(pb.id) !== 'active'"
            class="w-7 h-7 flex items-center justify-center rounded-md"
            :class="stateOf(pb.id) === 'active' ? 'text-muted hover:bg-primary/10 hover:text-primary' : 'text-dimmed cursor-not-allowed'"
            @click="openDeposit(pb.id)"
          >
            <UIcon name="i-tabler-qrcode" />
          </button>
        </UTooltip>
        <button
          type="button"
          aria-label="Delete"
          class="w-7 h-7 flex items-center justify-center rounded-md text-muted hover:bg-primary/10 hover:text-highlighted"
          @click="askDelete(pb)"
        >
          <UIcon name="i-tabler-trash" />
        </button>
      </div>
    </div>
    <UModal
      v-model:open="confirmOpen"
      title="Delete piggy bank"
    >
      <template #body>
        <p class="text-sm text-muted">
          Are you sure? Do you want to delete
          <span class="font-bold text-highlighted">"{{ target?.name }}"</span>
          connected to
          <span class="font-bold text-highlighted break-all">{{ target?.lnbitsUrl }}</span>?
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton
            color="neutral"
            variant="ghost"
            label="Cancel"
            @click="confirmOpen = false"
          />
          <UButton
            color="error"
            label="Yes, delete"
            :loading="deleting"
            @click="confirmDelete"
          />
        </div>
      </template>
    </UModal>

    <UModal v-model:open="depositOpen">
      <template #content>
        <InfoBoxPopupContent
          :key="depositId ?? ''"
          :lnurl="depositStatus?.lnurl ?? ''"
          :address="depositStatus?.address ?? ''"
          @close="depositOpen = false"
        />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// Explicit import (a Nuxt auto-import at runtime): vue-tsc does not resolve
// auto-imported utils in template scope, only in <script>.
import formatTime from '~/utils/formatTime'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

interface PiggyBankListItem {
  id: string
  name: string
  accessKey: string
  lnbitsUrl: string
}

type LnurlpState = 'checking' | 'active' | 'inactive' | 'unreachable'

interface PiggyBankStatus {
  lnurlp: Exclude<LnurlpState, 'checking'>
  lnurl: string | null
  address: string | null
  lastPaymentTime: number | null
}

const { data: piggyBanks, refresh } = await useFetch<PiggyBankListItem[]>('/api/admin/piggy-banks', {
  default: () => [],
})

// LNBits state per row, loaded after the list renders — one request per row, so
// a slow or dead LNBits only holds up its own row.
const statuses = reactive(new Map<string, PiggyBankStatus>())
const UNREACHABLE: PiggyBankStatus = { lnurlp: 'unreachable', lnurl: null, address: null, lastPaymentTime: null }

const loadStatus = async (id: string) => {
  try {
    statuses.set(id, await $fetch<PiggyBankStatus>(`/api/admin/piggy-banks/${id}/status`))
  } catch {
    statuses.set(id, UNREACHABLE)
  }
}

onMounted(() => {
  for (const pb of piggyBanks.value) loadStatus(pb.id)
})

const stateOf = (id: string): LnurlpState => statuses.get(id)?.lnurlp ?? 'checking'

const BADGES: Record<LnurlpState, { label: string, ariaLabel: string, pill: string, dot: string, depositHint: string }> = {
  checking: { label: 'LNURL-p', ariaLabel: 'LNURL-p checking', pill: 'bg-accented text-dimmed', dot: 'bg-[#6d6e70] animate-pulse', depositHint: 'Checking LNBits…' },
  active: { label: 'LNURL-p', ariaLabel: 'LNURL-p active', pill: 'bg-success/15 text-success', dot: 'bg-success', depositHint: 'Show deposit QR code' },
  inactive: { label: 'LNURL-p', ariaLabel: 'LNURL-p inactive', pill: 'bg-accented text-muted', dot: 'bg-[#6d6e70]', depositHint: 'No LNURLp configured' },
  unreachable: { label: 'Unreachable', ariaLabel: 'LNBits unreachable', pill: 'bg-error/15 text-error', dot: 'bg-error', depositHint: 'LNBits unreachable' },
}

const lastTxText = (status: PiggyBankStatus | undefined): string => {
  if (!status) return 'Checking…'
  if (status.lnurlp === 'unreachable') return 'Last tx unknown'
  return status.lastPaymentTime ? `Last tx ${formatTime(status.lastPaymentTime)}` : 'No transactions yet'
}

const revealed = reactive(new Set<string>())
const togglePin = (id: string) => {
  if (revealed.has(id)) {
    revealed.delete(id)
  } else {
    revealed.add(id)
  }
}

const hostOf = (url: string): string => {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

const depositOpen = ref(false)
const depositId = ref<string | null>(null)
const depositStatus = computed(() => depositId.value ? statuses.get(depositId.value) : undefined)
const openDeposit = (id: string) => {
  if (stateOf(id) !== 'active') return
  depositId.value = id
  depositOpen.value = true
}

const confirmOpen = ref(false)
const target = ref<PiggyBankListItem | null>(null)
const deleting = ref(false)

const askDelete = (pb: PiggyBankListItem) => {
  target.value = pb
  confirmOpen.value = true
}

const confirmDelete = async () => {
  if (!target.value) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/piggy-banks/${target.value.id}`, { method: 'DELETE' })
    confirmOpen.value = false
    await refresh()
  } finally {
    deleting.value = false
  }
}
</script>
