<template>
  <div class="border-t border-footer-500 w-full" />
  <UContainer class="w-full flex justify-end py-2 items-center">
    <!--
      Imprint (Impressum) links to the central tsp.tools imprint, which carries
      the postal address required by the Austrian ECG / German TMG once the site
      has commercial elements. The Privacy Policy is an in-app page.
    -->
    <UButton
      variant="link"
      color="footer"
      class="hover:underline"
      to="https://tsp.tools/imprint"
      target="_blank"
      external
    >
      Imprint
    </UButton>
    <div class="border-r border-footer-500 h-6" />
    <UButton
      variant="link"
      color="footer"
      class="hover:underline"
      to="/privacy-policy"
    >
      Privacy Policy
    </UButton>
    <div class="border-r border-footer-500 h-6" />
    <FooterGithubLink>
      <div class="border-r border-footer-500 h-6" />
    </FooterGithubLink>
    <FooterVersionBadge />
  </UContainer>
</template>
