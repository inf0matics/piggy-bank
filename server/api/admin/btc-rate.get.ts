import { fetchKrakenBtcRate } from '~/server/utils/getKrakenBtcRate'

// The current BTC/EUR rate for changing a manual balance in EUR, or
// `rate: null` when none is available (then no change is possible). Asked
// fresh, not from the dashboard's cache: the conversion is booked for good.
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  return { rate: await fetchKrakenBtcRate() }
})
