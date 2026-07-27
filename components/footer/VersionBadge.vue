<template>
  <UButton
    v-if="tagLink"
    :to="tagLink"
    target="_blank"
    variant="link"
  >
    <UBadge
      variant="outline"
      color="footer"
      class="px-2 rounded-full bg-transparent hover:text-[var(--ui-footer-hover)]"
    >
      {{ version }}
    </UBadge>
  </UButton>
  <UBadge
    v-else
    class="px-2"
  >
    {{ version }}
  </UBadge>
</template>

<script setup>
const runtimeConfig = useRuntimeConfig()
const devBase = runtimeConfig.public.devBase
const version = ref(devBase.version ? `v${devBase.version}` : 'undefined')
const releasedVersion = ref(devBase.releasedVersion ? `v${devBase.releasedVersion}` : 'undefined')
const tagLink = ref(devBase.githubLink ? `${devBase.githubLink}/releases/tag/${releasedVersion.value}` : '')
</script>
