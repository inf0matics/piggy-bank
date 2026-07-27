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
        Last updated: 27 July 2026
      </p>

      <section class="space-y-3 mb-8">
        <h2 class="text-xl font-heading font-semibold">
          1. Who is responsible
        </h2>
        <p>
          The controller responsible for processing your personal data under the
          EU General Data Protection Regulation (GDPR / DSGVO) is the operator
          named in our
          <a
            href="https://tsp.tools/imprint"
            target="_blank"
            rel="noopener"
            class="font-bold hover:underline"
          >Imprint</a>. Please refer to the Imprint for the full name and contact
          details.
        </p>
      </section>

      <section class="space-y-3 mb-8">
        <h2 class="text-xl font-heading font-semibold">
          2. What data we process and why
        </h2>
        <p>
          Piggy Bank is a Bitcoin/Lightning savings tool. We process only the
          data needed to operate it:
        </p>
        <ul class="list-disc pl-5 space-y-2">
          <li>
            <strong>Admin authentication.</strong> Administrators sign in via
            our authentication provider (Logto, hosted at logto.tsp.tools) using
            LNURL-auth or another supported method. We process a pseudonymous
            account identifier and, where your identity provider supplies it, a
            name, username or e-mail address, so we can identify you and secure
            your account.
          </li>
          <li>
            <strong>Piggy bank configuration.</strong> When an administrator
            creates a piggy bank we store its display name, an access code (PIN),
            and the connection details of the associated Lightning wallet (LNbits
            URL and API key). This is stored on our server so the piggy bank can
            be operated.
          </li>
          <li>
            <strong>Balance &amp; payment display.</strong> To show a balance we
            query the connected Lightning wallet in real time and display its
            balance and the most recent payment’s amount, timestamp and optional
            comment. We do not build a payment history beyond what the wallet
            itself returns.
          </li>
          <li>
            <strong>Session cookies.</strong> We set strictly necessary cookies
            to keep you signed in and to remember your display preferences (such
            as light/dark mode). We do not use tracking, advertising or analytics
            cookies.
          </li>
          <li>
            <strong>Server logs.</strong> Our hosting provider processes standard
            technical log data (e.g. IP address, timestamp, requested URL, user
            agent) to operate and secure the service.
          </li>
        </ul>
      </section>

      <section class="space-y-3 mb-8">
        <h2 class="text-xl font-heading font-semibold">
          3. Legal basis
        </h2>
        <p>
          We process this data on the basis of Art. 6(1)(b) GDPR (performance of
          the service you request) and Art. 6(1)(f) GDPR (our legitimate interest
          in operating the service securely and reliably).
        </p>
      </section>

      <section class="space-y-3 mb-8">
        <h2 class="text-xl font-heading font-semibold">
          4. Recipients and third parties
        </h2>
        <p>
          Data is shared only with providers that help us run the service:
          our authentication provider (Logto), the Lightning wallet backend you
          connect (LNbits / your Lightning node), and our hosting provider. We do
          not sell your data or share it for advertising.
        </p>
      </section>

      <section class="space-y-3 mb-8">
        <h2 class="text-xl font-heading font-semibold">
          5. Retention
        </h2>
        <p>
          We keep account and piggy bank data for as long as the account exists
          or as needed to provide the service. You can ask us to delete it at any
          time (see below). Technical server logs are retained by our hosting
          provider for a limited period for security purposes.
        </p>
      </section>

      <section class="space-y-3 mb-8">
        <h2 class="text-xl font-heading font-semibold">
          6. Your rights
        </h2>
        <p>
          Under the GDPR you have the right to access, rectify, erase, restrict
          and port your data, and to object to processing. You also have the
          right to lodge a complaint with a supervisory authority — in Austria,
          the Datenschutzbehörde (dsb.gv.at). To exercise any of these rights,
          contact us via the details in our
          <a
            href="https://tsp.tools/imprint"
            target="_blank"
            rel="noopener"
            class="font-bold hover:underline"
          >Imprint</a>.
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
