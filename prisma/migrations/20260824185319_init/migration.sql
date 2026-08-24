-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AuthTokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('CONSULTATION', 'PACKAGE', 'GROUP', 'COURSE');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SpecialistStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CourseDeliveryMode" AS ENUM ('RECORDED', 'LIVE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'AWAITING_PAYMENT', 'PAID', 'FAILED', 'CANCELED', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'AWAITING_VERIFICATION', 'VERIFIED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'EXHAUSTED', 'EXPIRED', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELED', 'NO_SHOW', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "SessionUsageStatus" AS ENUM ('COMPLETED', 'REVERSED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "passwordHash" VARCHAR(255),
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "userId" UUID NOT NULL,
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "displayName" VARCHAR(200),
    "phone" VARCHAR(40),
    "country" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "name" "RoleName" NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" VARCHAR(500),
    "ipAddress" VARCHAR(64),

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "AuthTokenType" NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialist" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "displayName" VARCHAR(200) NOT NULL,
    "bio" TEXT,
    "imageUrl" TEXT,
    "status" "SpecialistStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Specialist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT NOT NULL,
    "kind" "ProductKind" NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "priceMinor" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "accent" VARCHAR(120),
    "label" VARCHAR(120),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationProduct" (
    "productId" UUID NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 50,
    "specialistId" UUID,

    CONSTRAINT "ConsultationProduct_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "SessionPackage" (
    "productId" UUID NOT NULL,
    "includedSessions" INTEGER NOT NULL,
    "expiresAfterDays" INTEGER,
    "cancellationPolicy" TEXT,

    CONSTRAINT "SessionPackage_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "GroupTherapyProduct" (
    "productId" UUID NOT NULL,
    "cohortLabel" VARCHAR(200),
    "capacity" INTEGER,
    "schedulePolicy" TEXT,

    CONSTRAINT "GroupTherapyProduct_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "CourseProduct" (
    "productId" UUID NOT NULL,
    "deliveryMode" "CourseDeliveryMode" NOT NULL DEFAULT 'RECORDED',
    "accessDays" INTEGER,
    "curriculum" JSONB,

    CONSTRAINT "CourseProduct_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "orderNumber" VARCHAR(40) NOT NULL,
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalMinor" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "productTitleSnapshot" VARCHAR(240) NOT NULL,
    "snapshot" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "provider" VARCHAR(80) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "amountMinor" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "providerTransactionId" VARCHAR(255),
    "authority" VARCHAR(255),
    "referenceId" VARCHAR(255),
    "failureCode" VARCHAR(120),
    "failureMessage" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entitlement" (
    "id" UUID NOT NULL,
    "purchaseId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalSessions" INTEGER,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" UUID NOT NULL,
    "entitlementId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "courseProductId" UUID NOT NULL,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "entitlementId" UUID,
    "specialistId" UUID,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionUsage" (
    "id" UUID NOT NULL,
    "entitlementId" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "status" "SessionUsageStatus" NOT NULL DEFAULT 'COMPLETED',
    "recordedById" UUID,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversedById" UUID,
    "reversedAt" TIMESTAMP(3),
    "reason" TEXT,

    CONSTRAINT "SessionUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productId" UUID,
    "rating" INTEGER,
    "body" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" VARCHAR(120) NOT NULL,
    "targetType" VARCHAR(80) NOT NULL,
    "targetId" VARCHAR(80) NOT NULL,
    "beforeState" JSONB,
    "afterState" JSONB,
    "reason" TEXT,
    "requestId" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthSession_userId_expiresAt_idx" ON "AuthSession"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthToken_userId_type_expiresAt_idx" ON "AuthToken"("userId", "type", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Specialist_slug_key" ON "Specialist"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_kind_status_idx" ON "Product"("kind", "status");

-- CreateIndex
CREATE INDEX "Product_categoryId_status_idx" ON "Product"("categoryId", "status");

-- CreateIndex
CREATE INDEX "Product_featured_status_idx" ON "Product"("featured", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_productId_idx" ON "Order"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerTransactionId_key" ON "Payment"("providerTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_authority_key" ON "Payment"("authority");

-- CreateIndex
CREATE INDEX "Payment_provider_status_idx" ON "Payment"("provider", "status");

-- CreateIndex
CREATE INDEX "Payment_orderId_status_idx" ON "Payment"("orderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_attempt_key" ON "Payment"("orderId", "attempt");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_orderId_key" ON "Purchase"("orderId");

-- CreateIndex
CREATE INDEX "Purchase_userId_createdAt_idx" ON "Purchase"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Purchase_productId_idx" ON "Purchase"("productId");

-- CreateIndex
CREATE INDEX "Entitlement_userId_status_idx" ON "Entitlement"("userId", "status");

-- CreateIndex
CREATE INDEX "Entitlement_productId_status_idx" ON "Entitlement"("productId", "status");

-- CreateIndex
CREATE INDEX "Entitlement_purchaseId_idx" ON "Entitlement"("purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_entitlementId_key" ON "Enrollment"("entitlementId");

-- CreateIndex
CREATE INDEX "Enrollment_userId_enrolledAt_idx" ON "Enrollment"("userId", "enrolledAt");

-- CreateIndex
CREATE INDEX "Enrollment_courseProductId_idx" ON "Enrollment"("courseProductId");

-- CreateIndex
CREATE INDEX "Appointment_userId_startsAt_idx" ON "Appointment"("userId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_status_startsAt_idx" ON "Appointment"("status", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_specialistId_startsAt_idx" ON "Appointment"("specialistId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_entitlementId_idx" ON "Appointment"("entitlementId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionUsage_appointmentId_key" ON "SessionUsage"("appointmentId");

-- CreateIndex
CREATE INDEX "SessionUsage_entitlementId_status_idx" ON "SessionUsage"("entitlementId", "status");

-- CreateIndex
CREATE INDEX "SessionUsage_recordedById_recordedAt_idx" ON "SessionUsage"("recordedById", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SessionUsage_entitlementId_appointmentId_key" ON "SessionUsage"("entitlementId", "appointmentId");

-- CreateIndex
CREATE INDEX "Review_status_createdAt_idx" ON "Review"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Review_userId_createdAt_idx" ON "Review"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_productId_status_idx" ON "Review"("productId", "status");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetType_targetId_createdAt_idx" ON "AdminAuditLog"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_actorId_createdAt_idx" ON "AdminAuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthToken" ADD CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationProduct" ADD CONSTRAINT "ConsultationProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationProduct" ADD CONSTRAINT "ConsultationProduct_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "Specialist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPackage" ADD CONSTRAINT "SessionPackage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupTherapyProduct" ADD CONSTRAINT "GroupTherapyProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProduct" ADD CONSTRAINT "CourseProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "Entitlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseProductId_fkey" FOREIGN KEY ("courseProductId") REFERENCES "CourseProduct"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "Entitlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "Specialist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionUsage" ADD CONSTRAINT "SessionUsage_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "Entitlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionUsage" ADD CONSTRAINT "SessionUsage_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionUsage" ADD CONSTRAINT "SessionUsage_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionUsage" ADD CONSTRAINT "SessionUsage_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
