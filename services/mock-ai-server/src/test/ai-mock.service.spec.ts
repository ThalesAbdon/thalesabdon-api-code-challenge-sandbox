import { jest } from '@jest/globals'
import request from 'supertest'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { app } from '../index.js'

jest.setTimeout(30000) // precisa ser > 8000ms

describe('POST /generate', () => {
  let mockAxios: MockAdapter

  beforeAll(() => {
    mockAxios = new MockAdapter(axios as unknown as any)
  })

  afterEach(() => {
    mockAxios.reset()
  })

  it('should process the generation and call the callback', async () => {
    mockAxios.onPost(/.*/).reply(200)

    const response = await request(app)
      .post('/generate')
      .send({ prompt: 'Test', generationId: '123' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ generationId: '123' })
  })

  it('should handle callback failure', async () => {
    mockAxios.onPost(/.*/).networkError()

    const response = await request(app)
      .post('/generate')
      .send({ prompt: 'Erro', generationId: 'fail' })

    expect(response.status).toBe(500)
    expect(response.body).toHaveProperty('error')
  })
})
