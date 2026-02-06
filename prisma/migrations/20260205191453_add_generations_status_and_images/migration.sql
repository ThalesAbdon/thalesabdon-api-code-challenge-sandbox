-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'COMPLETE', 'FAILED');

-- AlterTable
ALTER TABLE "generations" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING';
