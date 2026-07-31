import { beforeEach, describe, expect, it } from 'vitest'

import { createVendor } from '../vendors'

import { makeChain, makeClients, makeUnauthenticatedClients } from './_helpers'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let chain: ReturnType<typeof makeChain>

beforeEach(() => {
  chain = makeChain()
})

// ---------------------------------------------------------------------------
// createVendor
// ---------------------------------------------------------------------------

describe('createVendor', () => {
  it('returns error when user is not authenticated', async () => {
    const clients = makeUnauthenticatedClients(chain)
    const result = await createVendor('acme-corp', { name: 'Acme Supply Co' }, clients)
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when viewer tries to create a vendor', async () => {
    const clients = makeClients(chain, { seedContext: { role: 'viewer' } })

    const result = await createVendor('acme-corp', { name: 'Acme Supply Co' }, clients)
    expect(result).toEqual({ error: 'Not authorised' })
  })

  it('allows an editor to create a vendor', async () => {
    const clients = makeClients(chain, { seedContext: { role: 'editor' } })
    chain.maybeSingle.mockResolvedValueOnce({ data: null }) // no existing vendor
    chain.single.mockResolvedValueOnce({ data: { id: 'vendor-00002' }, error: null })

    const result = await createVendor('acme-corp', { name: 'Acme Supply Co' }, clients)

    expect(result).toEqual({ id: 'vendor-00002' })
  })

  it('rejects a duplicate name (case-insensitive)', async () => {
    const clients = makeClients(chain, { seedContext: { role: 'editor' } })
    chain.maybeSingle.mockResolvedValueOnce({ data: { id: 'vendor-00001' } })

    const result = await createVendor('acme-corp', { name: 'acme supply co' }, clients)

    expect(result).toEqual({ error: 'A vendor with that name already exists.' })
  })
})
