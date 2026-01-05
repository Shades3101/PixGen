/*
  Warnings:

  - You are about to drop the `TrainingImages` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[falAiRequest]` on the table `Model` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[falAiRequest]` on the table `OutputImages` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `zipUrl` to the `Model` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TrainingImages" DROP CONSTRAINT "TrainingImages_modelId_fkey";

-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "zipUrl" TEXT NOT NULL;

-- DropTable
DROP TABLE "TrainingImages";

-- CreateIndex
CREATE UNIQUE INDEX "Model_falAiRequest_key" ON "Model"("falAiRequest");

-- CreateIndex
CREATE UNIQUE INDEX "OutputImages_falAiRequest_key" ON "OutputImages"("falAiRequest");
