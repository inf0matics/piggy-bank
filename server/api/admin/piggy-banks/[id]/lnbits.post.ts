// Puts a manual piggy bank back on LNBits (stored URL and key), spec admin-12.
export default defineEventHandler(event => switchToWallet(event, 'lnbits'))
