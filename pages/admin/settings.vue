<template>
  <div>
    <h1 class="font-bold text-2xl text-highlighted mb-6">
      Settings
    </h1>

    <form
      class="bg-elevated rounded-[10px] border border-default p-6 max-w-[480px]"
      @submit.prevent="save"
    >
      <p class="font-bold text-base mb-4 text-highlighted">
        LNBits defaults
      </p>

      <div class="mb-2">
        <label
          for="default-lnbits-url"
          class="block text-xs font-bold text-muted mb-1.5"
        >Default LNBits URL</label>
        <input
          id="default-lnbits-url"
          v-model="defaultLnbitsUrl"
          type="text"
          placeholder="https://your-lnbits.com"
          class="w-full px-3 py-2 border border-default rounded-lg text-sm bg-default text-default focus:outline-none focus:border-primary"
        >
        <p class="text-[11px] text-muted mt-1.5">
          Pre-filled when adding a new piggy bank. Can be overridden per record.
        </p>
      </div>

      <p
        v-if="saved"
        class="text-sm text-success mt-3"
      >
        Saved.
      </p>

      <button
        type="submit"
        :disabled="submitting"
        class="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-600 disabled:opacity-60 text-inverted font-bold text-sm px-4 py-1.5 rounded-lg mt-4"
      >
        <UIcon name="i-tabler-device-floppy" />
        Save
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const { data: settings } = await useFetch<{ defaultLnbitsUrl: string }>('/api/admin/settings')

const defaultLnbitsUrl = ref(settings.value?.defaultLnbitsUrl ?? '')
const submitting = ref(false)
const saved = ref(false)

const save = async () => {
  submitting.value = true
  saved.value = false
  try {
    await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: { defaultLnbitsUrl: defaultLnbitsUrl.value },
    })
    saved.value = true
  } finally {
    submitting.value = false
  }
}
</script>
