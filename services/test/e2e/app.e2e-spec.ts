import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const API_URL = 'http://localhost:3000'; 
const prisma = new PrismaClient();

describe('Fluxo End-to-End: Geração de Imagem', () => {
  jest.setTimeout(20000);

  let targetGenerationId: string;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Deve iniciar a geração e verificar a mudança de status no banco', async () => {
    const response = await axios.post(`${API_URL}/api/generation`, {
      prompt: 'Um astronauta tocando guitarra em Marte',
    });

    expect(response.status).toBe(201);
    targetGenerationId = response.data.generationId;
    expect(targetGenerationId).toBeDefined();

    const initialRecord = await prisma.generations.findUnique({
      where: { generationId: targetGenerationId },
    });
    expect(initialRecord?.status).toBe('PENDING');

    console.log('Aguardando processamento do Mock AI...');
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const finalRecord = await prisma.generations.findUnique({
      where: { generationId: targetGenerationId },
    });

    console.log(`Status final: ${finalRecord?.status}`);
    expect(finalRecord?.status).not.toBe('PENDING');
  });
});