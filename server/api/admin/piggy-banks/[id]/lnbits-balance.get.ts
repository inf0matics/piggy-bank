// The piggy bank's current LNBits wallet balance (specs admin-10, admin-12).
export default defineEventHandler(event => walletBalance(event, 'lnbits'))
