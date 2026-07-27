export default defineAppConfig({
  ui: {
    colors: {
      primary: 'dodgerblue',
    },
    // Narrow the public-area UContainer to max-w-2xl. In Nuxt UI v4 the
    // container has a single `base` slot (default `max-w-(--ui-container)`, 80rem);
    // overriding it tailwind-merges, keeping the padding/centering. The admin
    // area uses <TspContainer> from the theme layer, so it is unaffected.
    container: {
      base: 'max-w-2xl',
    },
    // Underline `variant="link"` buttons by default (removed on hover). In v4
    // the button `link` variant lives under `variants.variant`.
    button: {
      variants: {
        variant: {
          link: 'underline hover:no-underline',
        },
      },
    },
  },
})
