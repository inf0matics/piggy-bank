<template>
  <div class="flex flex-col items-center justify-center">
    <div class="text-center font-heading font-semibold text-6xl pt-10 pb-6 text-balance">
      <div>{{ title }}</div>
      <div class="flex justify-center">
        <div>
          <UIcon
            name="i-uil-bitcoin"
            class="text-7xl -mb-4 -mr-3"
          />
          Piggy Bank
        </div>
      </div>
    </div>
    <!--
      Piggy panel: the piggy.png image with the balance overlaid. Fluid down to
      narrow phones (w-full) while capped at the original design size (384px), so
      desktop is unchanged. Overlay offsets are percentages of the box, not fixed
      pixels, so they track the image as it scales.
    -->
    <div class="relative w-full max-w-[384px] aspect-[384/290] bg-[url('/img/piggy.png')] bg-cover bg-center font-numbers">
      <div class="hidden print:flex absolute top-[22.4%] left-[8.33%] w-[83.33%] justify-center">
        <PiggyQRCode />
      </div>
      <div class="absolute top-[41.38%] left-[6.25%] w-[83.33%] flex flex-col justify-center print:hidden">
        <PiggyValue
          ref="piggyValueRef"
          :sats="sats"
          :eur="eur"
          :rate="rate"
          :unavailable="unavailable"
        />
      </div>
    </div>
    <div class="mt-2 w-full max-w-80 print:hidden">
      <InfoBox
        ref="infoBoxRef"
        :lnurl="lnurl"
        :address="address"
        :payment="payment"
        @logout="logout"
      />
    </div>
  </div>
</template>

<script setup lang="ts">

import type { InfoBox, PiggyValue } from '#components'

const POLLING_INTERVAL = 2000

const { $auth } = useNuxtApp()
const toast = useToast()

const infoBoxRef = ref<InstanceType<typeof InfoBox> | null>(null)
const piggyValueRef = ref<InstanceType<typeof PiggyValue> | null>(null)

const lnurl = ref('')
const address = ref('')
const lastUpdate = ref('')
const sats = ref(-1)
const title = ref('')
const rate = ref<number | null>(0)
const eur = ref<number | null>(0)
const unavailable = ref(false)

const payment = ref<{ sats: number, comment: string | null, time: number } | null>(null)

let firstTime = true
let lastSatsValue = 0
// The time of the newest payment the shown balance already includes, so only
// a newer one is announced.
let lastPaymentTime = 0

let intervalId: ReturnType<typeof setInterval> | null = null
// One request at a time: while LNBits is slow to fail, polls must not pile up.
let fetching = false

onMounted(async () => {
  await $auth.redirectIfLoggedOut()
  // When the session has expired (e.g. returning after the refresh token
  // lapsed), redirectIfLoggedOut navigates to the login page. Don't start
  // polling in that case: an authenticated fetch with no access token would
  // 401 and flash a spurious "Error" toast on the page we're leaving.
  if (!(await $auth.isLoggedIn())) return
  startPolling()
})

onUnmounted(async () => {
  stopPolling()
})

const startPolling = () => {
  if (!intervalId) {
    intervalId = setInterval(fetchData, POLLING_INTERVAL)
    fetchData()
  }
}

const stopPolling = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

const fetchData = async () => {
  if (fetching) return
  fetching = true
  try {
    await fetchDashboard()
  } finally {
    fetching = false
  }
}

const fetchDashboard = async () => {
  let response
  try {
    response = await $auth.$fetch('/api/dashboard', {
      method: 'GET',
    })
  } catch (error) {
    const err = error as { statusMessage?: string }
    if (firstTime) {
      toast.add({
        title: 'Error',
        description: err.statusMessage,
        icon: 'i-heroicons-x-circle-16-solid',
        color: 'error',
        duration: 60 * 1000,
        close: false,
      })
      stopPolling()
      console.error(error)
      piggyValueRef.value?.showError(err.statusMessage ?? 'Unknown error')
      firstTime = false
      return
    }
  }
  if (response == undefined) {
    toast.add({
      title: 'Error',
      description: 'No response from backend',
      icon: 'i-heroicons-x-circle-16-solid',
      color: 'error',
      duration: 60 * 1000,
      close: false,
    })
    return
  }

  title.value = `${response.name}'s`
  lastUpdate.value = formatTime()

  // LNBits is unreachable: say so and keep polling until it is back.
  unavailable.value = !response.available
  if (!response.available) {
    infoBoxRef.value?.closePopup()
    lnurl.value = ''
    address.value = ''
    payment.value = null
    return
  }
  lnurl.value = response.lnurl || ''
  address.value = response.address || ''
  payment.value = response.payment

  rate.value = response.rate
  eur.value = response.eur
  sats.value = response.sats

  // The first balance is the baseline, even 0: an empty piggy bank's first
  // top-up is announced like any other.
  if (firstTime) {
    lastSatsValue = response.sats
    lastPaymentTime = response.payment?.time ?? 0
    firstTime = false
  }

  // Only money coming in with a newer payment is announced. A decrease (a
  // manual balance corrected down), a change without a payment to show (a
  // manual piggy bank frozen from a wallet without payments) and a jump with an
  // older payment (switched back to an LNBits wallet holding more) are not. A
  // payment LNBits lists before the balance includes it (a pending invoice) is
  // announced once the balance rises.
  if (response.sats > lastSatsValue && response.payment && response.payment.sats > 0 && response.payment.time > lastPaymentTime) {
    infoBoxRef.value?.closePopup()
    toast.add({
      title: response.payment.comment || 'New Payment',
      description: `+${response.payment.sats} sats`,
      icon: 'i-heroicons-currency-bitcoin-16-solid',
      color: 'success',
      duration: 2000,
    })
  }
  if (response.sats !== lastSatsValue) {
    lastPaymentTime = Math.max(lastPaymentTime, response.payment?.time ?? 0)
  }
  lastSatsValue = response.sats
}

const logout = async () => {
  await $auth.logout()
  await navigateTo('/')
}

</script>
