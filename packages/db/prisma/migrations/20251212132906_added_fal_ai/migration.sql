-- CreateEnum
CREATE TYPE "ModelStatusEnum" AS ENUM ('Pending', 'Generated', 'Failed');

-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "falAiRequest" TEXT,
ADD COLUMN     "tensorPath" TEXT,
ADD COLUMN     "trainingStatus" "ModelStatusEnum" NOT NULL DEFAULT 'Pending',
ADD COLUMN     "triggerWord" TEXT;

-- AlterTable
ALTER TABLE "OutputImages" ADD COLUMN     "falAiRequest" TEXT,
ALTER COLUMN "imageUrl" SET DEFAULT '';
