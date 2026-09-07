-- Add the optional meeting link without changing any existing appointment data.
ALTER TABLE "Appointment" ADD COLUMN "meetingUrl" VARCHAR(2000);
