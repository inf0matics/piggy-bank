<template>
  <div class="px-4 sm:px-6 py-8 text-text">
    <NuxtLink
      to="/"
      class="inline-flex items-center gap-1 text-sm font-bold rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text transition-opacity active:opacity-70"
    >
      <UIcon name="i-tabler-arrow-left" /> Back
    </NuxtLink>

    <article class="bg-white rounded-2xl shadow-md p-6 sm:p-8 mt-4 leading-relaxed">
      <h1 class="text-4xl font-heading font-semibold mb-1 text-balance">
        Privacy Policy
      </h1>
      <p class="text-sm text-text/70 mb-8">
        Last updated: 9 November 2026
      </p>

      <section class="space-y-3 mb-8">
        <h2 class="text-xl font-heading font-semibold">
          Controller
        </h2>
        <p>
          Philipp Horwath<br>
          Schemerlhöhe 377, 8076 Vasoldsberg, Austria<br>
          <a
            href="mailto:hello@thespielplatz.com"
            class="font-bold hover:underline"
          >hello@thespielplatz.com</a>
        </p>
      </section>

      <section class="space-y-3 mb-8">
        <h2 class="text-xl font-heading font-semibold">
          Data processed
        </h2>
        <h3 class="font-bold">
          Access credentials
        </h3>
        <p>
          Each piggy bank has a PIN and a display name, stored in a local SQLite
          database. No email address or personal name is required. Legal basis:
          Art. 6(1)(b) GDPR.
        </p>
        <h3 class="font-bold">
          LNbits connection
        </h3>
        <p>
          The LNbits instance URL and a read-only API key are stored in the local
          SQLite database to fetch balance and transaction data. No payment data
          is stored by Piggy Bank itself — all Lightning Network data lives in
          LNbits. Legal basis: Art. 6(1)(b) GDPR.
        </p>
        <h3 class="font-bold">
          Balance and transaction data
        </h3>
        <p>
          For piggy banks connected to LNbits, the balance and the most recent
          payment are fetched live from LNbits on each dashboard load and are not
          stored by Piggy Bank. The LNbits instance operator is responsible for
          that data.
        </p>
        <h3 class="font-bold">
          Manual balances
        </h3>
        <p>
          For piggy banks whose balance is kept by hand, the balance and its last
          change (time, amount and optional comment), as entered by the
          administrator, are stored in the local SQLite database. Legal basis:
          Art. 6(1)(b) GDPR.
        </p>
        <h3 class="font-bold">
          Admin accounts
        </h3>
        <p>
          Administrators sign in via Logto, for example with LNURL-auth. We
          process a pseudonymous account ID, stored with each piggy bank the
          administrator owns, and, where the identity provider supplies one, a
          name, username or email address. Legal basis: Art. 6(1)(b) GDPR.
        </p>
        <h3 class="font-bold">
          Server logs
        </h3>
        <p>
          IP address, timestamp, requested URL and browser information are
          collected automatically by the hosting provider. Legal basis:
          Art. 6(1)(f) GDPR (legitimate interest).
        </p>
      </section>

      <section class="space-y-3 mb-8">
        <h2 class="text-xl font-heading font-semibold">
          Cookies
        </h2>
        <p>
          We set only strictly necessary cookies: one to keep you signed in to a
          piggy bank, the administrator sign-in session, and the administrator's
          light/dark mode preference. We do not use tracking, analytics or
          advertising cookies.
        </p>
      </section>

      <section class="space-y-3 mb-8">
        <h2 class="text-xl font-heading font-semibold">
          Third-party services
        </h2>
        <ul class="list-disc pl-5 space-y-2">
          <li>
            <strong>LNbits</strong> — the configured LNbits instance processes all
            Lightning Network transactions. Piggy Bank only reads balance and
            payment data via a read-only key. The LNbits instance operator's
            privacy policy applies.
          </li>
          <li>
            <strong>Logto</strong> (logto.tsp.tools) — handles administrator
            sign-in.
          </li>
          <li>
            <strong>Kraken</strong> — our server fetches the current BTC/EUR
            exchange rate from Kraken's public ticker. The request comes from our
            server only; no data about you is sent.
          </li>
        </ul>
      </section>

      <section class="space-y-3 mb-8">
        <h2 class="text-xl font-heading font-semibold">
          Hosting
        </h2>
        <p>
          netcup GmbH, Daimlerstraße 25, 76185 Karlsruhe, Germany.
        </p>
      </section>

      <section class="space-y-3 mb-8">
        <h2 class="text-xl font-heading font-semibold">
          Retention
        </h2>
        <p>
          We keep piggy bank and account data until the piggy bank is deleted or
          you ask us to delete it; server logs are kept by the hosting provider
          for a limited period.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-heading font-semibold">
          Your rights
        </h2>
        <p>
          You have the right to access, rectification, erasure, restriction and
          objection — contact
          <a
            href="mailto:hello@thespielplatz.com"
            class="font-bold hover:underline"
          >hello@thespielplatz.com</a>. You also have the right to lodge a
          complaint with the Austrian Data Protection Authority
          (<a
            href="https://dsb.gv.at"
            target="_blank"
            rel="noopener"
            class="font-bold hover:underline"
          >dsb.gv.at</a>).
        </p>
      </section>
    </article>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Privacy Policy — Piggy Bank',
  // Re-enable touch scrolling for this long content page (the app globally sets
  // touch-action: none for its fixed-viewport UI). See assets/css/global.css.
  htmlAttrs: { class: 'allow-scroll' },
  meta: [
    { name: 'robots', content: 'noindex' },
  ],
})
</script>
