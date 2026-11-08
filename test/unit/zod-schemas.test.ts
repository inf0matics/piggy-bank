// Pins the validation and parsing behaviour of the app's zod schemas, so a zod
// major upgrade cannot silently change what the API accepts or reports.
import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { UserInputSchema } from '../../server/domain/user.ts'
import LnBits from '../../server/utils/LnBits.ts'

const validInput = {
  name: 'Anna',
  accessKey: '1234',
  lnbitsUrl: 'https://legend.lnbits.com',
  invoiceKey: 'inv-key',
}

const firstMessage = (input: unknown) => {
  const result = UserInputSchema.safeParse(input)
  assert.equal(result.success, false)
  return result.error?.issues[0]?.message
}

describe('UserInputSchema', () => {
  it('accepts valid input and trims every field', () => {
    const result = UserInputSchema.parse({
      name: '  Anna ',
      accessKey: ' 1234 ',
      lnbitsUrl: ' https://legend.lnbits.com ',
      invoiceKey: ' inv-key ',
    })
    assert.deepEqual(result, validInput)
  })

  it('accepts the URL forms admins use (plain host, port, path)', () => {
    for (const lnbitsUrl of ['http://lnbits-mock', 'http://localhost:5000', 'https://lnbits.example.com/wallet']) {
      assert.equal(UserInputSchema.safeParse({ ...validInput, lnbitsUrl }).success, true, lnbitsUrl)
    }
  })

  it('reports the field message for empty fields', () => {
    assert.equal(firstMessage({ ...validInput, name: '   ' }), 'Name is required')
    assert.equal(firstMessage({ ...validInput, accessKey: '' }), 'PIN is required')
    assert.equal(firstMessage({ ...validInput, invoiceKey: '' }), 'Invoice key is required')
  })

  it('rejects an LNBits URL without a scheme', () => {
    for (const lnbitsUrl of ['legend.lnbits.com', 'not a url', '']) {
      assert.equal(firstMessage({ ...validInput, lnbitsUrl }), 'A valid LNBits URL is required', lnbitsUrl)
    }
  })

  it('reports the field message when a field is missing or not a string', () => {
    const { name: _name, ...withoutName } = validInput
    assert.equal(firstMessage(withoutName), 'Name is required')
    assert.equal(firstMessage({ ...validInput, accessKey: 1234 }), 'PIN is required')
  })

  it('rejects a body that is not an object', () => {
    assert.equal(UserInputSchema.safeParse(undefined).success, false)
    assert.equal(UserInputSchema.safeParse('x').success, false)
  })
})

describe('LnBits response parsing', () => {
  const realFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = realFetch
  })

  const respondWith = (body: unknown) => {
    globalThis.fetch = async () => new Response(JSON.stringify(body), { status: 200 })
  }

  const lnbits = new LnBits({ apiKey: 'k', url: 'http://lnbits.test' })

  it('parses the last payment, preferring the LNURL comment over the memo', async () => {
    respondWith([{
      amount: 21000,
      memo: 'memo',
      extra: { comment: 'thanks' },
      time: '2024-01-02T03:04:05.123456',
      extraField: 'ignored',
    }])
    assert.deepEqual(await lnbits.getLastPayment(), {
      amount: 21000,
      comment: 'thanks',
      time: new Date('2024-01-02T03:04:05').getTime() / 1000,
    })
  })

  it('falls back to the memo, then null, when there is no comment', async () => {
    respondWith([{ amount: 1, memo: 'memo', extra: {}, time: '2024-01-02T03:04:05' }])
    assert.equal((await lnbits.getLastPayment())?.comment, 'memo')

    respondWith([{ amount: 1, memo: null, extra: { comment: null }, time: '2024-01-02T03:04:05' }])
    assert.equal((await lnbits.getLastPayment())?.comment, null)
  })

  it('returns null when there are no payments', async () => {
    respondWith([])
    assert.equal(await lnbits.getLastPayment(), null)
  })

  it('throws on a malformed payment', async () => {
    respondWith([{ amount: '1', extra: {}, time: '2024-01-02' }])
    await assert.rejects(lnbits.getLastPayment())

    respondWith([{ amount: 1, time: '2024-01-02' }])
    await assert.rejects(lnbits.getLastPayment())
  })

  it('parses LNURL-p links, keeping only username and lnurl', async () => {
    respondWith([{ username: null, lnurl: 'LNURL1', id: 'x' }, { username: 'anna', lnurl: 'LNURL2' }])
    assert.deepEqual(await lnbits.getLnurlPs(), [
      { username: null, lnurl: 'LNURL1' },
      { username: 'anna', lnurl: 'LNURL2' },
    ])
  })

  it('throws on malformed LNURL-p links', async () => {
    respondWith([{ username: 'anna' }])
    await assert.rejects(lnbits.getLnurlPs())
  })
})
