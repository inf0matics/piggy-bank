<template>
  <UModal title="Privacy Policy">
    <UButton
      v-if="content"
      variant="link"
      color="footer"
      class="hover:underline"
    >
      Privacy Policy
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
    content.value = await $fetch('/api/dev-base/content?file=privacy-policy')
  } catch {
    content.value = null
  }
})
</script>
