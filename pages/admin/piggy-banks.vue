<template>
  <div>
    <h1 class="font-heading font-semibold text-3xl mb-2">
      Piggy Banks
    </h1>
    <p class="text-text/70">
      Manage the piggy banks you've set up for your kids &amp; friends.
    </p>

    <div class="mt-6 bg-white rounded-xl px-5 py-6 text-text/65">
      <p class="flex items-center gap-2">
        <UIcon
          name="i-tabler-pig-money"
          class="text-xl text-dodgerblue-700"
        />
        Piggy bank management is coming soon.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})
</script>
