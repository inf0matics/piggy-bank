<template>
  <div>
    <header class="flex items-center justify-between bg-elevated px-7 py-4 border-b border-default">
      <h1 class="font-bold text-xl text-highlighted">
        Piggy Banks
      </h1>
      <NuxtLink
        to="/admin/piggy-banks/new"
        class="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-600 text-inverted font-bold text-sm px-4 py-1.5 rounded-lg"
      >
        <UIcon name="i-tabler-plus" />
        Add piggy bank
      </NuxtLink>
    </header>

    <div class="px-7 py-5">
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
            <span v-if="pb.lastPaymentTime">Last tx {{ formatTime(pb.lastPaymentTime) }}</span>
            <span v-else>No transactions yet</span>
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
          :data-lnurlp="pb.lnurlpActive ? 'active' : 'inactive'"
          :aria-label="`LNURL-p ${pb.lnurlpActive ? 'active' : 'inactive'}`"
          class="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
          :class="pb.lnurlpActive ? 'bg-success/15 text-success' : 'bg-accented text-muted'"
        >
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="pb.lnurlpActive ? 'bg-success' : 'bg-[#6d6e70]'"
          />
          LNURL-p
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <UTooltip
            :text="pb.lnurlpActive ? 'Show deposit QR code' : 'No LNURLp configured'"
            :delay-duration="0"
          >
            <button
              type="button"
              aria-label="Deposit"
              :aria-disabled="!pb.lnurlpActive"
              class="w-7 h-7 flex items-center justify-center rounded-md"
              :class="pb.lnurlpActive ? 'text-muted hover:bg-primary/10 hover:text-primary' : 'text-dimmed cursor-not-allowed'"
              @click="pb.lnurlpActive && openDeposit(pb)"
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
          :key="depositTarget?.id"
          :lnurl="depositTarget?.lnurl ?? ''"
          :address="depositTarget?.address ?? ''"
          @close="depositOpen = false"
        />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

interface PiggyBankListItem {
  id: string
  name: string
  accessKey: string
  lnbitsUrl: string
  lnurlpActive: boolean
  lnurl: string | null
  address: string | null
  lastPaymentTime: number | null
}

const { data: piggyBanks, refresh } = await useFetch<PiggyBankListItem[]>('/api/admin/piggy-banks', {
  default: () => [],
})

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
const depositTarget = ref<PiggyBankListItem | null>(null)
const openDeposit = (pb: PiggyBankListItem) => {
  depositTarget.value = pb
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
