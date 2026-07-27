<template>
  <UButton
    v-if="runtimeConfig.public.devBase.githubLink"
    variant="link"
    :to="runtimeConfig.public.devBase.githubLink"
    target="_blank"
    class="flex items-center gap-1 hover:underline"
    color="footer"
  >
    <UIcon name="i-tabler-brand-github" /> Github
  </UButton>
  <slot v-if="runtimeConfig.public.devBase.githubLink" />
</template>

<script setup>
const runtimeConfig = useRuntimeConfig()
</script>
