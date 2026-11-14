// Puts a manual piggy bank on marbles (stored URL, key and wallet), spec admin-13.
export default defineEventHandler(event => switchToWallet(event, 'marbles'))
