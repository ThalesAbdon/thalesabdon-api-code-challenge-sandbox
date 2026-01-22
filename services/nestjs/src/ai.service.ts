import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

@Injectable()
export class AiService implements OnModuleDestroy {
  private prisma: PrismaClient
  private readonly mockAiUrl = 'http://mock-ai:3001'

  private readonly MAX_RETRIES = 3
  private readonly BASE_DELAY_MS = 2000

  constructor() {
    this.prisma = new PrismaClient()
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect()
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async processImageGeneration(prompt: string, generationId: string) {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log('processImageGeneration for prompt', prompt)
        console.log('processImageGeneration for generationId', generationId)
        console.log(`${this.mockAiUrl}/generate`)

        console.log(`Attempt ${attempt}/${this.MAX_RETRIES}`)

        const response = await axios.post(`${this.mockAiUrl}/generate`, {
          prompt,
          generationId,
        })

        console.log('response in NestJS service', response)

        return response.data
      } catch (error) {
        console.error('Error in processImageGeneration:', error)

        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
          })
        }

        if (axios.isAxiosError(error)) {
          console.error('Axios error details:', {
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers,
          })
        }

        await this.prisma.generations.update({
          where: { generationId },
          data: {
            retryCount: attempt,
            updatedAt: new Date(),
          },
        })

        if (attempt < this.MAX_RETRIES) {
          const delayMs = this.BASE_DELAY_MS * Math.pow(2, attempt - 1)
          console.log(`Retrying in ${delayMs}ms...`)
          await this.delay(delayMs)
          continue
        }

        await this.prisma.generations.update({
          where: { generationId },
          data: {
            status: 'FAILED',
            updatedAt: new Date(),
          },
        })

        throw error
      }
    }
  }

  async generateImage(prompt: string) {
    try {
      const generation = await this.prisma.generations.create({
        data: {
          prompt,
          imageHeight: 1024,
          imageWidth: 1024,
          coreModel: 'SDXL',
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const generationId = generation.generationId
      console.log('generationId', generationId)

      // Start the image generation process in the background
      // Using Promise.resolve().then() to ensure it runs in the next tick
      Promise.resolve().then(async () => {
        try {
          await this.processImageGeneration(prompt, generationId)
        } catch (error) {
          console.error('Background processing failed:', error)

          await this.prisma.generations.update({
            where: { generationId },
            data: {
              updatedAt: new Date(),
            },
          })
        }
      })
      
      // Return the generationId immediately
      return { generationId }
    } catch (error) {
      throw new Error(`Failed to initiate image generation: ${error}`)
    }
  }

  async getGenerationById(generationId: string) {
  const generation = await this.prisma.generations.findUnique({
    where: { generationId },
  })

  if (!generation) {
    throw new NotFoundException('Generation not found')
  }
  
  if (generation.status === 'PENDING' || generation.status === 'FAILED') {
    return {
      generationId,
      status: generation.status,
      prompt: generation.prompt,
    }
  }

  return {
    generationId,
    status: generation.status,
    prompt: generation.prompt,
    images: generation.images ?? [],
  }
}
}
