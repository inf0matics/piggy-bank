<template>
  <div>
    <header class="flex items-center bg-white px-7 py-4 border-b border-text/10">
      <h1 class="font-heading font-medium text-xl">
        Settings
      </h1>
    </header>

    <div class="px-7 py-5">
      <form
        class="bg-white rounded-[10px] border border-text/10 p-6 max-w-[480px]"
        @submit.prevent="save"
      >
        <p class="font-heading font-medium text-base mb-4">
          LNBits defaults
        </p>

        <div class="mb-2">
          <label
            for="default-lnbits-url"
            class="block text-xs font-medium text-[#3a6080] mb-1.5"
          >Default LNBits URL</label>
          <input
            id="default-lnbits-url"
            v-model="defaultLnbitsUrl"
            type="text"
            placeholder="https://your-lnbits.com"
            class="w-full px-3 py-2 border border-text/20 rounded-lg text-sm bg-[#f7f9fb] text-text"
          >
          <p class="text-[11px] text-[#7fa0b8] mt-1.5">
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
          class="inline-flex items-center gap-1.5 bg-dodgerblue-600 hover:bg-dodgerblue-700 disabled:opacity-60 text-white font-heading font-medium text-sm px-4 py-1.5 rounded-lg mt-4"
        >
          <UIcon name="i-tabler-device-floppy" />
          Save
        </button>
      </form>
    </div>
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
