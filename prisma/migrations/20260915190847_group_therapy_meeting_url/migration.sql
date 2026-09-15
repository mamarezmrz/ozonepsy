-- AlterTable
ALTER TABLE "CourseTag" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "GroupTherapyProduct" ADD COLUMN     "meetingUrl" VARCHAR(2000);
