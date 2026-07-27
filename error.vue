<template>
  <div class="font-sans min-h-svh flex flex-col items-center justify-center bg-background-yellow text-text px-6 text-center">
    <div class="font-heading font-semibold text-7xl sm:text-8xl mb-2 flex items-center gap-1 tabular-nums">
      <UIcon
        name="i-uil-bitcoin"
        class="text-6xl sm:text-7xl -mr-1"
      />
      {{ error?.statusCode || 500 }}
    </div>
    <h1 class="font-heading font-semibold text-3xl mb-3 text-balance">
      {{ is404 ? 'This piggy wandered off' : 'Something broke' }}
    </h1>
    <p class="max-w-md text-text/80 mb-8 text-pretty leading-relaxed">
      {{ is404
        ? 'We could not find the page you were looking for. It may have moved, or the link was mistyped.'
        : 'An unexpected error occurred. Please try again in a moment.' }}
    </p>
    <UButton
      size="lg"
      class="transition-transform duration-100 active:scale-95"
      @click="handleClear"
    >
      Back to Piggy Bank
    </UButton>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ error: { statusCode?: number, message?: string } }>()
const is404 = computed(() => props.error?.statusCode === 404)
const handleClear = () => clearError({ redirect: '/' })

useHead({ title: `${props.error?.statusCode ?? 'Error'} — Piggy Bank` })
</script>
