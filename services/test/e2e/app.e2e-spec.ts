import axios from 'axios'
import { PrismaClient } from '@prisma/client'

const API_URL = 'http://localhost:3000'
const prisma = new PrismaClient()

/**
 * End-to-End tests validate observable system behavior.
 * Internal mechanisms (e.g. retry counters) are validated
 * in unit or integration tests, not strictly in E2E.
 */
describe('E2E: Image generation lifecycle', () => {
  jest.setTimeout(50000)

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should create a generation and allow querying its status while pending', async () => {
    const createResponse = await axios.post(`${API_URL}/api/generation`, {
      prompt: 'A futuristic city at night',
    })

    expect(createResponse.status).toBe(201)

    const generationId = createResponse.data.generationId
    expect(generationId).toBeDefined()

    /**
     * Immediately query the GET endpoint.
     * At this point, the generation should still be PENDING.
     */
    const getResponse = await axios.get(
      `${API_URL}/api/generation/${generationId}`,
    )

    expect(getResponse.status).toBe(200)
    expect(getResponse.data.generationId).toBe(generationId)
    expect(getResponse.data.status).toBe('PENDING')
    expect(getResponse.data.prompt).toBeDefined()
    expect(getResponse.data.images).toBeUndefined()
  })

  it('should handle failures gracefully and reach a terminal state', async () => {
    const response = await axios.post(`${API_URL}/api/generation`, {
      prompt: 'force_error',
    })

    expect(response.status).toBe(201)

    const generationId = response.data.generationId
    expect(generationId).toBeDefined()

    console.log('Waiting for background processing...')
    await new Promise((resolve) => setTimeout(resolve, 15000))

    const getResponse = await axios.get(
      `${API_URL}/api/generation/${generationId}`,
    )

    expect(getResponse.status).toBe(200)
    expect(['FAILED', 'COMPLETE']).toContain(getResponse.data.status)

    /**
     * In failure scenarios, images must not be returned.
     */
    if (getResponse.data.status === 'FAILED') {
      expect(getResponse.data.images).toBeUndefined()
    }
  })

  it('should return generated images once the generation is complete', async () => {
    const response = await axios.post(`${API_URL}/api/generation`, {
      prompt: 'A robot playing piano on the Moon',
    })

    expect(response.status).toBe(201)

    const generationId = response.data.generationId
    expect(generationId).toBeDefined()

    console.log('Waiting for background processing...')
    await new Promise((resolve) => setTimeout(resolve, 10000))

    const getResponse = await axios.get(
      `${API_URL}/api/generation/${generationId}`,
    )

    expect(getResponse.status).toBe(200)
    expect(getResponse.data.status).toBe('COMPLETE')
    expect(getResponse.data.images).toBeDefined()
    expect(getResponse.data.images.length).toBeGreaterThan(0)
  })

  it('should return 404 when querying a non-existent generation', async () => {
    await expect(
      axios.get(`${API_URL}/api/generation/3c1dfcd7-0751-4ff6-9d87-27e6b6830ff4`),
    ).rejects.toMatchObject({
      response: {
        status: 404,
      },
    })
  })

  it('should return 400 when querying with an invalid generationId', async () => {
    const invalidId = 'not-a-uuid'
    await expect(
      axios.get(`${API_URL}/api/generation/${invalidId}`)
    ).rejects.toMatchObject({
      response: {
        status: 400,
      },
    })
  })
})
