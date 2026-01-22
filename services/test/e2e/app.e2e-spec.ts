import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const API_URL = 'http://localhost:3000';
const prisma = new PrismaClient();

describe('End-to-End Flow: Image Generation with Retry', () => {
  jest.setTimeout(50000);

  let targetGenerationId: string;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a generation and verify retry mechanism', async () => {
    const response = await axios.post(`${API_URL}/api/generation`, {
      prompt: 'force_error', 
    });

    expect(response.status).toBe(201);
    targetGenerationId = response.data.generationId;
    expect(targetGenerationId).toBeDefined();

    const initialRecord = await prisma.generations.findUnique({
      where: { generationId: targetGenerationId },
    });
    expect(initialRecord?.status).toBe('PENDING');
    expect(initialRecord?.retryCount).toBe(0);

    console.log('Waiting for background processing with retries...');
    await new Promise((resolve) => setTimeout(resolve, 15000));

    const finalRecord = await prisma.generations.findUnique({
      where: { generationId: targetGenerationId },
    });

    console.log(`Final status: ${finalRecord?.status}`);
    console.log(`Retries attempted: ${finalRecord?.retryCount}`);

    expect(finalRecord).not.toBeNull();
    expect(finalRecord?.retryCount).toBeGreaterThan(0);
    expect(['FAILED', 'COMPLETED']).toContain(finalRecord?.status);
  });

  it('should successfully generate an image after retries', async () => {
    const response = await axios.post(`${API_URL}/api/generation`, {
      prompt: 'A robot playing piano on the Moon',
    });

    expect(response.status).toBe(201);
    const generationId = response.data.generationId;
    expect(generationId).toBeDefined();

    console.log('Waiting for background processing...');
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const record = await prisma.generations.findUnique({
      where: { generationId },
    });

    expect(record).not.toBeNull();
    expect(record?.status).toBe('COMPLETED');
    expect(record?.images?.length).toBeGreaterThan(0);
  });
});
