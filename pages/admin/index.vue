<template>
  <div class="px-5 pt-8 pb-12">
    <!-- Top bar -->
    <div class="flex justify-end mb-5">
      <NuxtLink
        to="/"
        aria-label="Back to Piggy Bank"
        class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-text/10 text-text hover:bg-text/20"
      >
        <UIcon
          name="i-tabler-arrow-left"
          class="text-lg"
        />
      </NuxtLink>
    </div>

    <!-- Badge -->
    <div class="inline-flex items-center gap-2 bg-text text-background-yellow font-heading font-medium text-xl px-5 py-2 rounded-full mb-6">
      <UIcon name="i-tabler-bolt" />Piggy Bank Admin
    </div>

    <!-- Hero -->
    <h1 class="font-heading font-semibold text-4xl leading-tight mb-3">
      Give your kids &amp; friends<br>
      their own <span class="text-dodgerblue-700">Bitcoin</span> piggy bank 🐷
    </h1>
    <p class="text-[15px] leading-relaxed text-text/80 max-w-[480px] mb-6">
      You're a Bitcoiner — they're not. Yet. Set up a read-only piggy bank for each of them,
      link their LNBits wallet, and let them watch their sats grow.
    </p>

    <!-- CTA -->
    <div class="flex flex-wrap items-center gap-3 mb-8">
      <a
        href="/admin/sign-in"
        class="inline-flex items-center gap-2 bg-dodgerblue-600 hover:bg-dodgerblue-700 text-white font-heading font-medium text-[17px] px-7 py-3 rounded-[10px]"
      >
        <UIcon name="i-tabler-login" />
        Login as admin
      </a>
      <!-- Dev-only shortcut: bypasses Logto via the e2e auth shim. Stripped from
           production builds (import.meta.dev is false there). -->
      <button
        v-if="isDev"
        type="button"
        class="inline-flex items-center gap-2 border border-dashed border-dodgerblue-400 text-dodgerblue-700 hover:bg-dodgerblue-50 font-heading font-medium text-[15px] px-5 py-3 rounded-[10px]"
        @click="devLogin"
      >
        <UIcon name="i-tabler-flask" />
        Dev login (skip Logto)
      </button>
    </div>

    <hr class="border-t border-text/20 mb-6">

    <!-- What you can do -->
    <p class="font-heading font-medium text-lg mb-3.5">
      What you can do
    </p>
    <div class="grid grid-cols-3 gap-3 mb-5">
      <div
        v-for="card in features"
        :key="card.title"
        class="bg-white rounded-xl px-3.5 py-4"
      >
        <UIcon
          :name="card.icon"
          class="text-xl text-dodgerblue-700 mb-2"
        />
        <p class="font-heading font-medium text-[15px] mb-1.5">
          {{ card.title }}
        </p>
        <p class="text-xs leading-relaxed text-text/65">
          {{ card.desc }}
        </p>
      </div>
    </div>

    <!-- LNURL-auth row -->
    <div class="flex items-center flex-wrap gap-2.5 mb-8">
      <UIcon
        name="i-tabler-bolt"
        class="text-dodgerblue-700 shrink-0"
      />
      <span class="text-xs text-text/80">Login via LNURL-auth — scan with your Lightning wallet, no password or email needed</span>
      <span class="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/60 border border-text/20">🕵️ Anonymous</span>
      <span class="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/60 border border-text/20">🔒 Non-custodial</span>
    </div>

    <hr class="border-t border-text/20 mb-6">

    <!-- What you need -->
    <p class="font-heading font-medium text-lg mb-3.5">
      What you need
    </p>
    <div class="bg-white rounded-xl px-5 py-4.5">
      <div class="flex items-start gap-2.5 text-[13px] leading-relaxed text-text/65 mb-4">
        <UIcon
          name="i-tabler-server"
          class="text-base text-dodgerblue-700 shrink-0 mt-0.5"
        />
        <div>
          <strong class="font-medium text-text">A LNBits wallet per person</strong> — one LNBits account for each piggy bank you want to create.
          <div class="bg-dodgerblue-50 border border-dodgerblue-200 rounded-[10px] px-4 py-3.5 mt-2.5">
            <p class="text-xs font-medium text-text/80 mb-2.5">
              Ways to get a LNBits instance
            </p>
            <div class="grid grid-cols-3 gap-2">
              <div
                v-for="opt in lnbitsOptions"
                :key="opt.label"
                class="bg-white rounded-lg p-2.5 text-center border border-dodgerblue-200"
              >
                <span class="font-heading text-[13px] font-medium block mb-1">{{ opt.label }}</span>
                <span
                  class="text-[10px] font-medium px-2 py-0.5 rounded-full inline-block mb-1.5"
                  :class="opt.tagClass"
                >{{ opt.tag }}</span>
                <span class="text-[11px] leading-snug text-text/65 block">
                  <template v-if="opt.link">{{ opt.desc }} <a
                    :href="opt.link"
                    target="_blank"
                    class="text-dodgerblue-700 hover:underline"
                  >{{ opt.linkText }}</a></template>
                  <template v-else>{{ opt.desc }}</template>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-start gap-2.5 text-[13px] leading-relaxed text-text/65">
        <UIcon
          name="i-tabler-wallet"
          class="text-base text-dodgerblue-700 shrink-0 mt-0.5"
        />
        <span><strong class="font-medium text-text">A Lightning wallet with LNURL-auth</strong> — to log in to this admin panel. Works with most modern Lightning wallets.</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Dev-only shortcut to enter the admin area without Logto. Sets the e2e auth
// shim cookie, then hard-navigates so the cookie reaches the server. Only works
// when the app runs with NUXT_PUBLIC_ADMIN_AUTH_MODE=e2e.
const isDev = import.meta.dev
const devLogin = () => {
  document.cookie = 'e2e_admin=1; path=/'
  window.location.href = '/admin/piggy-banks'
}

const features = [
  { icon: 'i-tabler-users', title: 'Manage accounts', desc: 'Add people, set their PIN, link their LNBits wallet' },
  { icon: 'i-tabler-plug', title: 'Check setup', desc: 'See if LNURL-p is active so others can send sats to them' },
  { icon: 'i-tabler-eye', title: 'Read only', desc: 'They see their balance — no sending, no risk' },
]

const lnbitsOptions = [
  { label: 'Hosted', tag: 'Easy', tagClass: 'bg-[#e8f8ee] text-[#1a6b3a]', desc: 'Fully managed —', link: 'https://my.lnbits.com', linkText: 'my.lnbits.com' },
  { label: 'LNbitsBox', tag: 'Hardware', tagClass: 'bg-[#fff7e0] text-[#8a5a00]', desc: 'Plug & play, runs locally' },
  { label: 'Self-hosted', tag: 'Advanced', tagClass: 'bg-[#fdecea] text-[#9c2d25]', desc: 'Full control —', link: 'https://github.com/lnbits/lnbits', linkText: 'github.com/lnbits' },
]
</script>
