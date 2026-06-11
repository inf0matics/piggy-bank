<template>
  <div class="admin-root min-h-svh bg-default text-default flex flex-col">
    <div class="max-w-4xl w-full flex-1 mx-auto px-6 sm:px-10 pt-10 pb-16">
      <!-- Top bar: headline badge, with the theme toggle + back button aligned to it -->
      <div class="flex items-center gap-3 mb-6">
        <div class="inline-flex items-center gap-2 bg-primary/15 text-primary font-bold text-xl px-5 py-2 rounded-full">
          <UIcon name="i-tabler-bolt" />Piggy Bank Admin
        </div>
        <span class="flex-1" />
        <button
          type="button"
          data-testid="theme-toggle"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-elevated text-muted hover:bg-accented hover:text-highlighted"
          @click="toggleTheme"
        >
          <UIcon
            :name="isDark ? 'i-tabler-sun' : 'i-tabler-moon'"
            class="text-lg"
          />
        </button>
        <NuxtLink
          to="/"
          aria-label="Back to Piggy Bank"
          class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-elevated text-muted hover:bg-accented hover:text-highlighted"
        >
          <UIcon
            name="i-tabler-arrow-left"
            class="text-lg"
          />
        </NuxtLink>
      </div>

      <!-- Hero -->
      <h1 class="font-extrabold text-4xl leading-tight mb-3 text-highlighted">
        Give your kids &amp; friends<br>
        their own <span class="text-primary">Bitcoin</span> piggy bank 🐷
      </h1>
      <p class="text-[15px] leading-relaxed text-muted max-w-[480px] mb-6">
        You're a Bitcoiner — they're not. Yet. Set up a read-only piggy bank for each of them,
        link their LNBits wallet, and let them watch their sats grow.
      </p>

      <!-- CTA -->
      <div class="flex flex-wrap items-center gap-3 mb-8">
        <a
          href="/admin/sign-in"
          class="inline-flex items-center gap-2 bg-primary hover:bg-primary-600 text-inverted font-bold text-[17px] px-7 py-3 rounded-[10px]"
        >
          <UIcon name="i-tabler-login" />
          Login as admin
        </a>
        <!-- Dev-only shortcut: bypasses Logto via the e2e auth shim. Stripped from
           production builds (import.meta.dev is false there). -->
        <button
          v-if="isDev"
          type="button"
          class="inline-flex items-center gap-2 border border-dashed border-primary/50 text-primary hover:bg-primary/10 font-bold text-[15px] px-5 py-3 rounded-[10px]"
          @click="devLogin"
        >
          <UIcon name="i-tabler-flask" />
          Dev login (skip Logto)
        </button>
      </div>

      <hr class="border-t border-default mb-6">

      <!-- What you can do -->
      <p class="font-bold text-lg mb-3.5 text-highlighted">
        What you can do
      </p>
      <div class="grid grid-cols-3 gap-3 mb-5">
        <div
          v-for="card in features"
          :key="card.title"
          class="bg-elevated border border-default rounded-xl px-3.5 py-4"
        >
          <UIcon
            :name="card.icon"
            class="text-xl text-primary mb-2"
          />
          <p class="font-bold text-[15px] mb-1.5 text-highlighted">
            {{ card.title }}
          </p>
          <p class="text-xs leading-relaxed text-muted">
            {{ card.desc }}
          </p>
        </div>
      </div>

      <!-- LNURL-auth row -->
      <div class="flex items-center flex-wrap gap-2.5 mb-8">
        <UIcon
          name="i-tabler-bolt"
          class="text-primary shrink-0"
        />
        <span class="text-xs text-muted">Login via LNURL-auth — scan with your Lightning wallet, no password or email needed</span>
        <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-elevated border border-default text-muted">🕵️ Anonymous</span>
        <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-elevated border border-default text-muted">🔒 Non-custodial</span>
      </div>

      <hr class="border-t border-default mb-6">

      <!-- What you need -->
      <p class="font-bold text-lg mb-3.5 text-highlighted">
        What you need
      </p>
      <div class="bg-elevated border border-default rounded-xl px-5 py-4.5">
        <div class="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted mb-4">
          <UIcon
            name="i-tabler-server"
            class="text-base text-primary shrink-0 mt-0.5"
          />
          <div>
            <strong class="font-bold text-highlighted">A LNBits wallet per person</strong> — one LNBits account for each piggy bank you want to create.
            <div class="bg-default border border-default rounded-[10px] px-4 py-3.5 mt-2.5">
              <p class="text-xs font-bold text-muted mb-2.5">
                Ways to get a LNBits instance
              </p>
              <div class="grid grid-cols-3 gap-2">
                <div
                  v-for="opt in lnbitsOptions"
                  :key="opt.label"
                  class="bg-elevated rounded-lg p-2.5 text-center border border-default"
                >
                  <span class="text-[13px] font-bold block mb-1 text-highlighted">{{ opt.label }}</span>
                  <span
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1.5"
                    :class="opt.tagClass"
                  >{{ opt.tag }}</span>
                  <span class="text-[11px] leading-snug text-muted block">
                    <template v-if="opt.link">{{ opt.desc }} <a
                      :href="opt.link"
                      target="_blank"
                      class="text-primary hover:underline"
                    >{{ opt.linkText }}</a></template>
                    <template v-else>{{ opt.desc }}</template>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted">
          <UIcon
            name="i-tabler-wallet"
            class="text-base text-primary shrink-0 mt-0.5"
          />
          <span><strong class="font-bold text-highlighted">A Lightning wallet with LNURL-auth</strong> — to log in to this admin panel. Works with most modern Lightning wallets.</span>
        </div>
      </div>
    </div>

    <!-- Same footer elements as the public start page (Legal Notice, GitHub, version). -->
    <div class="print:hidden">
      <FooterMain />
    </div>
  </div>
</template>

<script setup lang="ts">
// Self-contained admin landing: opt out of the public (Piggy) default layout so
// this page renders on the dark admin theme like the rest of /admin. Colour mode
// is set to dark for /admin in plugins/01.colorModeByAreaPlugin.ts.
definePageMeta({
  layout: false,
})

// Light/dark toggle (icon only, in the top bar). Same remembered admin
// preference as the sidebar toggle; applied per-area in the colour-mode plugin.
const { pref: themePref, toggle: toggleTheme } = useAdminColorMode()
const isDark = computed(() => themePref.value === 'dark')

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
  { label: 'Hosted', tag: 'Easy', tagClass: 'bg-success/15 text-success', desc: 'Fully managed —', link: 'https://my.lnbits.com', linkText: 'my.lnbits.com' },
  { label: 'LNbitsBox', tag: 'Hardware', tagClass: 'bg-warning/15 text-warning', desc: 'Plug & play, runs locally' },
  { label: 'Self-hosted', tag: 'Advanced', tagClass: 'bg-error/15 text-error', desc: 'Full control —', link: 'https://github.com/lnbits/lnbits', linkText: 'github.com/lnbits' },
]
</script>
