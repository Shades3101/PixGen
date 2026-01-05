/*
  Warnings:

  - The values [AsianAmerican,EastAsian,SouthEastAsian,SouthAsian,MiddleEastern] on the enum `EthnicityEnum` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `name` to the `Model` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EthnicityEnum_new" AS ENUM ('White', 'Black', 'Asian American', 'East Asian', 'South East Asian', 'South Asian', 'Middle Eastern', 'Pacific', 'Hispanic');
ALTER TABLE "Model" ALTER COLUMN "ethnicity" TYPE "EthnicityEnum_new" USING ("ethnicity"::text::"EthnicityEnum_new");
ALTER TYPE "EthnicityEnum" RENAME TO "EthnicityEnum_old";
ALTER TYPE "EthnicityEnum_new" RENAME TO "EthnicityEnum";
DROP TYPE "public"."EthnicityEnum_old";
COMMIT;

-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "name" TEXT NOT NULL;
