<template>
  <div class="font-sans flex flex-col min-h-svh bg-background-yellow text-text">
    <UContainer class="flex-grow px-0">
      <slot />
    </UContainer>
    <div class="print:hidden">
      <FooterMain />
    </div>
  </div>
</template>
