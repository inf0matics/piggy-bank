import consola from 'consola'

export default defineNitroPlugin(() => {
  consola.info('Init User Store')
  initUserStore()
})
