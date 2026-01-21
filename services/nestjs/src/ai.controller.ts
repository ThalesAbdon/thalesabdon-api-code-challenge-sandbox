import { Controller, Post, Body, Get, Param } from '@nestjs/common'
import { AiService } from './ai.service'
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AiRequestDto } from './ai.dto'

@ApiTags('images')
@Controller('api/generation')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post()
  @ApiOperation({ summary: 'Generate images based on a text prompt' })
  @ApiResponse({
    status: 200,
    description: 'The image generation request has been accepted',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async generateImage(@Body() aiRequest: AiRequestDto) {
    const generation = await this.aiService.generateImage(aiRequest.prompt)
    return generation
  }

  @Get(':generationId')
  @ApiOperation({
    summary: 'Get image generation status and result',
    description: `
    Retrieves the current status of an image generation request.

    Possible statuses:
    - **PENDING**: Generation still in progress
    - **FAILED**: Generation failed
    - **COMPLETED**: Generation finished successfully
        `,
      })
  @ApiParam({
    name: 'generationId',
    description: 'Unique identifier returned when the generation was requested',
    example: 'c8c1c6b4-7f2c-4f3d-9f93-1b9e7a9f1c2a',
  })
  @ApiResponse({
    status: 200,
    description: 'Generation status retrieved successfully',
    examples: {
      pending: {
        summary: 'Generation in progress',
        value: {
          generationId: 'c8c1c6b4-7f2c-4f3d-9f93-1b9e7a9f1c2a',
          status: 'PENDING',
          prompt:
            'A futuristic city at sunset, ultra realistic, cinematic lighting, 4k',
        },
      },
      completed: {
        summary: 'Generation completed',
        value: {
          generationId: 'c8c1c6b4-7f2c-4f3d-9f93-1b9e7a9f1c2a',
          status: 'COMPLETED',
          prompt:
            'A futuristic city at sunset, ultra realistic, cinematic lighting, 4k',
          images: [
            'https://cdn.example.com/images/image1.png',
            'https://cdn.example.com/images/image2.png',
          ],
        },
      },
      failed: {
        summary: 'Generation failed',
        value: {
          generationId: 'c8c1c6b4-7f2c-4f3d-9f93-1b9e7a9f1c2a',
          status: 'FAILED',
          prompt:
            'A futuristic city at sunset, ultra realistic, cinematic lighting, 4k',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Generation not found',
  })
  async getGeneration(
    @Param('generationId') generationId: string,
  ) {
    return this.aiService.getGenerationById(generationId)
  }
}