<template>
  <footer class="w-full mt-8 border-t border-footer-400/40">
    <UContainer class="py-5">
      <div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <!-- Brand mark, links home. -->
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1.5 font-heading font-semibold text-text/90 rounded-md transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text/50"
        >
          <UIcon
            name="i-uil-bitcoin"
            class="text-xl"
          />
          Piggy Bank
        </NuxtLink>

        <!--
          Legal + meta. Imprint (Impressum) links to the central tsp.tools
          imprint, which carries the postal address required by the Austrian
          ECG / German TMG. The Privacy Policy is an in-app page.
        -->
        <nav class="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-medium text-footer-700">
          <a
            href="https://tsp.tools/imprint"
            target="_blank"
            rel="noopener"
            :class="linkClass"
          >Imprint</a>
          <span
            aria-hidden="true"
            class="text-footer-500"
          >·</span>
          <NuxtLink
            to="/privacy-policy"
            :class="linkClass"
          >Privacy Policy</NuxtLink>
          <template v-if="githubLink">
            <span
              aria-hidden="true"
              class="text-footer-500"
            >·</span>
            <a
              :href="githubLink"
              target="_blank"
              rel="noopener"
              :class="[linkClass, 'inline-flex items-center gap-1']"
            ><UIcon name="i-tabler-brand-github" /> GitHub</a>
          </template>
          <a
            v-if="version"
            :href="versionLink || undefined"
            :target="versionLink ? '_blank' : undefined"
            rel="noopener"
            class="ml-1 inline-flex items-center rounded-full border border-footer-400/70 px-2 py-0.5 text-xs text-footer-600 transition-colors hover:border-footer-600 hover:text-footer-900"
          >{{ version }}</a>
        </nav>
      </div>
    </UContainer>
  </footer>
</template>

<script setup lang="ts">
// Version + GitHub link come from runtimeConfig.public.devBase (set by
// modules/dev-base.ts from package.json), the same source layouts/admin.vue uses.
const devBase = useRuntimeConfig().public.devBase as {
  githubLink?: string
  version?: string
  releasedVersion?: string
}
const githubLink = devBase.githubLink
const version = devBase.version ? `v${devBase.version}` : ''
const versionLink = githubLink && devBase.releasedVersion
  ? `${githubLink}/releases/tag/v${devBase.releasedVersion}`
  : ''

const linkClass = 'rounded-sm underline-offset-4 transition-colors hover:text-footer-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-footer-600'
</script>
