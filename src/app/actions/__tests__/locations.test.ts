import { beforeEach, describe, expect, it } from 'vitest'

import { createLocation } from '../locations'

import { makeChain, makeClients, makeUnauthenticatedClients } from './_helpers'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let chain: ReturnType<typeof makeChain>

beforeEach(() => {
  chain = makeChain()
})

// ---------------------------------------------------------------------------
// createLocation
// ---------------------------------------------------------------------------

describe('createLocation', () => {
  it('returns error when user is not authenticated', async () => {
    const clients = makeUnauthenticatedClients(chain)
    const result = await createLocation('acme-corp', { name: 'Warehouse B' }, clients)
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when viewer tries to create a location', async () => {
    const clients = makeClients(chain, { seedContext: { role: 'viewer' } })

    const result = await createLocation('acme-corp', { name: 'Warehouse B' }, clients)
    expect(result).toEqual({ error: 'Not authorised' })
  })

  it('allows an editor to create a location', async () => {
    const clients = makeClients(chain, { seedContext: { role: 'editor' } })
    chain.maybeSingle.mockResolvedValueOnce({ data: null }) // no existing location
    chain.single.mockResolvedValueOnce({ data: { id: 'loc-00002' }, error: null })

    const result = await createLocation('acme-corp', { name: 'Warehouse B' }, clients)

    expect(result).toEqual({ id: 'loc-00002' })
  })

  it('rejects a duplicate name (case-insensitive)', async () => {
    const clients = makeClients(chain, { seedContext: { role: 'editor' } })
    chain.maybeSingle.mockResolvedValueOnce({ data: { id: 'loc-00001' } })

    const result = await createLocation('acme-corp', { name: 'warehouse a' }, clients)

    expect(result).toEqual({ error: 'A location with that name already exists.' })
  })
})
