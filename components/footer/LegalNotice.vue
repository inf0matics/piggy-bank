<template>
  <UModal title="Legal Notice">
    <UButton
      v-if="content != null"
      variant="link"
      color="footer"
      class="hover:underline"
    >
      Legal Notice
    </UButton>
    <template #body>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-html="content" />
    </template>
  </UModal>
  <slot v-if="content" />
</template>

<script setup>
const content = ref(null)
onMounted(async () => {
  try {
    content.value = await $fetch('/api/dev-base/content?file=legal-notice')
  } catch {
    content.value = null
  }
})
</script>
