<template>
  <div class="flex justify-center">
    <div class="flex flex-col items-end tabular-nums">
      <div
        v-if="unavailable"
        class="text-xl font-semibold"
        data-testid="sats-balance"
      >
        Balance currently unavailable
      </div>
      <div
        v-else
        class="text-3xl font-semibold"
        data-testid="sats-balance"
      >
        {{ satsText }}
      </div>
      <div
        v-if="rate && !unavailable"
        class="text-sm font-semibold"
      >
        {{ `1 BTC = ${rate} EUR` }}
      </div>
      <div
        v-if="eur && !unavailable"
        class="text-sm font-semibold"
      >
        {{ `${eur} EUR` }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

let firstTime = true

const satsText = ref('Loading ...')
const satsInternal = ref(-1)

const { sats, eur, rate, unavailable = false } = defineProps<{
  sats: number,
  eur: number,
  rate: number,
  // LNBits cannot be reached right now; the last values are not shown.
  unavailable?: boolean,
}>()

watch(() => sats, (newValue: number) => {
  if (firstTime && newValue > 0) {
    countTo({
      ref: satsInternal,
      endValue: newValue,
      duration: calculateDuration(newValue),
    })
    firstTime = false
  } else {
    satsInternal.value = newValue
  }
})

watch(satsInternal, (value) => {
  satsText.value = `${formatSats(value)} BTC`
})

const calculateDuration = (endValue: number): number => {
  const minSats = 1000
  const maxSats = 1000000
  const minDuration = 500 // 1 second
  const maxDuration = 2000 // 5 seconds

  if (endValue <= minSats) {
    return minDuration
  } else if (endValue >= maxSats) {
    return maxDuration
  }

  const t = (endValue - minSats) / (maxSats - minSats)
  return minDuration + t * (maxDuration - minDuration)
}

const showError = (message: string) => {
  satsText.value = message
}

defineExpose({
  showError,
})

</script>
