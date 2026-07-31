import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createCategory, deleteCategory } from '../categories'

import { makeChain, makeClients, makeUnauthenticatedClients } from './_helpers'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CATEGORY_ID = 'cat-00001'

let chain: ReturnType<typeof makeChain>

beforeEach(() => {
  chain = makeChain()
})

// ---------------------------------------------------------------------------
// deleteCategory
// ---------------------------------------------------------------------------

describe('deleteCategory', () => {
  it('returns error when user is not authenticated', async () => {
    const clients = makeUnauthenticatedClients(chain)
    const result = await deleteCategory('acme-corp', CATEGORY_ID, clients)
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when viewer tries to delete a category', async () => {
    const clients = makeClients(chain, { seedContext: { role: 'viewer' } })

    const result = await deleteCategory('acme-corp', CATEGORY_ID, clients)
    expect(result).toEqual({ error: 'Not authorised' })
  })

  it('returns error when the rpc call fails', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: { message: 'function failed' } })
    const clients = makeClients(chain, { rpc, seedContext: { role: 'admin' } })
    chain.maybeSingle.mockResolvedValueOnce({ data: { name: 'Electronics' } })

    const result = await deleteCategory('acme-corp', CATEGORY_ID, clients)
    expect(result).toEqual({ error: 'function failed' })
  })

  it('calls rpc with the correct parameters on success', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null })
    const clients = makeClients(chain, { rpc, seedContext: { orgId: 'org-0001', role: 'admin' } })
    chain.maybeSingle.mockResolvedValueOnce({ data: { name: 'Electronics' } })

    const result = await deleteCategory('acme-corp', CATEGORY_ID, clients)

    expect(result).toBeNull()
    expect(rpc).toHaveBeenCalledWith('soft_delete_with_cascade', {
      p_entity_table: 'categories',
      p_entity_id: CATEGORY_ID,
      p_org_id: 'org-0001',
      p_asset_fk_col: 'category_id',
    })
  })

  it('still returns null when name fetch finds no row (audit falls back to Unknown)', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null })
    const clients = makeClients(chain, { rpc, seedContext: { role: 'admin' } })
    chain.maybeSingle.mockResolvedValueOnce({ data: null }) // name row not found

    const result = await deleteCategory('acme-corp', CATEGORY_ID, clients)
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// createCategory
// ---------------------------------------------------------------------------

describe('createCategory', () => {
  it('returns error when user is not authenticated', async () => {
    const clients = makeUnauthenticatedClients(chain)
    const result = await createCategory('acme-corp', { name: 'Power Tools' }, clients)
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when viewer tries to create a category', async () => {
    const clients = makeClients(chain, { seedContext: { role: 'viewer' } })

    const result = await createCategory('acme-corp', { name: 'Power Tools' }, clients)
    expect(result).toEqual({ error: 'Not authorised' })
  })

  it('allows an editor to create a category', async () => {
    const clients = makeClients(chain, { seedContext: { role: 'editor' } })
    chain.maybeSingle.mockResolvedValueOnce({ data: null }) // no existing category
    chain.single.mockResolvedValueOnce({ data: { id: 'cat-00002' }, error: null })

    const result = await createCategory('acme-corp', { name: 'Power Tools' }, clients)

    expect(result).toEqual({ id: 'cat-00002' })
  })

  it('allows an admin to create a category', async () => {
    const clients = makeClients(chain, { seedContext: { role: 'admin' } })
    chain.maybeSingle.mockResolvedValueOnce({ data: null })
    chain.single.mockResolvedValueOnce({ data: { id: 'cat-00003' }, error: null })

    const result = await createCategory('acme-corp', { name: 'Hand Tools' }, clients)

    expect(result).toEqual({ id: 'cat-00003' })
  })

  it('rejects a duplicate name (case-insensitive)', async () => {
    const clients = makeClients(chain, { seedContext: { role: 'editor' } })
    chain.maybeSingle.mockResolvedValueOnce({ data: { id: 'cat-00001' } })

    const result = await createCategory('acme-corp', { name: 'electronics' }, clients)

    expect(result).toEqual({ error: 'A category with that name already exists.' })
  })
})
