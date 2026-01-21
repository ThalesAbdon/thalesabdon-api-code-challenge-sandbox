import { AiService } from '../ai.service'
import { NotFoundException } from '@nestjs/common'
import axios from 'axios'

jest.mock('axios')

describe('AiService (unit)', () => {
  let service: AiService

  const prismaMock = {
    generations: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    $disconnect: jest.fn(),
  }

  beforeEach(() => {
    service = new AiService()

    // 🔥 sobrescreve o Prisma real pelo mock
    ;(service as any).prisma = prismaMock
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('generateImage', () => {
    it('should create generation and return generationId', async () => {
      prismaMock.generations.create.mockResolvedValue({
        generationId: 'gen-123',
        prompt: 'test',
        status: 'PENDING',
      })

      jest.spyOn<any, any>(service as any, 'processImageGeneration').mockResolvedValue(undefined)

      const result = await service.generateImage('test')

      expect(prismaMock.generations.create).toHaveBeenCalled()
      expect(result).toEqual({ generationId: 'gen-123' })
    })

    it('should handle background failure and update generation', async () => {
      prismaMock.generations.create.mockResolvedValue({
        generationId: 'gen-fail',
        prompt: 'test',
        status: 'PENDING',
      })

      jest
        .spyOn<any, any>(service as any, 'processImageGeneration')
        .mockRejectedValue(new Error('AI failed'))

      await service.generateImage('test')

      // aguarda o Promise.resolve().then()
      await Promise.resolve()

      expect(prismaMock.generations.update).toHaveBeenCalledWith({
        where: { generationId: 'gen-fail' },
        data: { updatedAt: expect.any(Date) },
      })
    })
  })

  describe('processImageGeneration', () => {
    it('should call mock AI successfully', async () => {
      ;(axios.post as jest.Mock).mockResolvedValue({
        data: { images: ['img1'] },
      })

      const result = await (service as any).processImageGeneration(
        'prompt',
        'gen-1',
      )

      expect(axios.post).toHaveBeenCalledWith(
        'http://mock-ai:3001/generate',
        { prompt: 'prompt', generationId: 'gen-1' },
      )

      expect(result).toEqual({ images: ['img1'] })
    })

    it('should update generation status to FAILED on error', async () => {
      ;(axios.post as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(
        (service as any).processImageGeneration('prompt', 'gen-err'),
      ).rejects.toThrow()

      expect(prismaMock.generations.update).toHaveBeenCalledWith({
        where: { generationId: 'gen-err' },
        data: {
          updatedAt: expect.any(Date),
          status: 'FAILED',
        },
      })
    })
  })

  describe('getGenerationById', () => {
    it('should throw NotFoundException if not found', async () => {
      prismaMock.generations.findUnique.mockResolvedValue(null)

      await expect(service.getGenerationById('404')).rejects.toBeInstanceOf(
        NotFoundException,
      )
    })

    it('should return pending generation', async () => {
      prismaMock.generations.findUnique.mockResolvedValue({
        generationId: 'gen-p',
        status: 'PENDING',
        prompt: 'test',
      })

      const result = await service.getGenerationById('gen-p')

      expect(result).toEqual({
        generationId: 'gen-p',
        status: 'PENDING',
        prompt: 'test',
      })
    })

    it('should return failed generation', async () => {
      prismaMock.generations.findUnique.mockResolvedValue({
        generationId: 'gen-f',
        status: 'FAILED',
        prompt: 'test',
      })

      const result = await service.getGenerationById('gen-f')

      expect(result.status).toBe('FAILED')
    })

    it('should return completed generation with images', async () => {
      prismaMock.generations.findUnique.mockResolvedValue({
        generationId: 'gen-ok',
        status: 'COMPLETED',
        prompt: 'test',
        images: ['img1', 'img2'],
      })

      const result = await service.getGenerationById('gen-ok')

      expect(result).toEqual({
        generationId: 'gen-ok',
        status: 'COMPLETED',
        prompt: 'test',
        images: ['img1', 'img2'],
      })
    })
  })
})
