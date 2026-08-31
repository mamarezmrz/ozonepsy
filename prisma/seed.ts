import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client.ts";
import { RoleName, UserStatus } from "../lib/generated/prisma/enums.ts";
import { hashPassword } from "../lib/auth/password.ts";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const permissionDescriptions: Record<string, string> = {
  "dashboard.view": "مشاهده داشبورد مدیریتی",
  "users.read": "مشاهده کاربران",
  "users.update": "ویرایش کاربران",
  "users.suspend": "تعلیق کاربران",
  "products.read": "مشاهده محصولات",
  "products.write": "مدیریت محصولات",
  "categories.read": "مشاهده دسته‌بندی‌ها",
  "categories.write": "مدیریت دسته‌بندی‌ها",
  "courses.read": "مشاهده دوره‌ها",
  "courses.write": "مدیریت دوره‌ها",
  "courses.publish": "انتشار دوره‌ها",
  "lessons.read": "مشاهده سرفصل‌ها",
  "lessons.write": "مدیریت سرفصل‌ها",
  "instructors.read": "مشاهده متخصصان",
  "instructors.write": "مدیریت متخصصان",
  "sessions.read": "مشاهده جلسات",
  "sessions.manage": "مدیریت جلسات",
  "reviews.read": "مشاهده نظرات",
  "reviews.moderate": "مدیریت وضعیت نظرات",
  "content.read": "مشاهده محتوای ساختاریافته",
  "content.write": "مدیریت محتوای ساختاریافته",
  "media.read": "مشاهده رسانه‌ها",
  "media.write": "مدیریت رسانه‌ها",
  "reports.read": "مشاهده گزارش‌ها",
  "audit.read": "مشاهده گزارش‌های حسابرسی",
  "admins.manage": "مدیریت ادمین‌ها",
  "settings.manage": "مدیریت تنظیمات امنیتی",
};

const allPermissions = Object.keys(permissionDescriptions);

const rolePermissions: Record<string, string[]> = {
  SUPER_ADMIN: allPermissions,
  ADMIN: allPermissions.filter((permission) => !["admins.manage", "settings.manage"].includes(permission)),
  CONTENT_MANAGER: [
    "dashboard.view",
    "products.read",
    "products.write",
    "categories.read",
    "categories.write",
    "courses.read",
    "courses.write",
    "courses.publish",
    "lessons.read",
    "lessons.write",
    "instructors.read",
    "instructors.write",
    "reviews.read",
    "reviews.moderate",
    "content.read",
    "content.write",
    "media.read",
    "media.write",
  ],
  SUPPORT: ["dashboard.view", "users.read", "users.update", "reviews.read", "sessions.read"],
  INSTRUCTOR: ["courses.read", "lessons.read", "sessions.read", "instructors.read"],
  USER: [],
};

function bootstrapValue(name: string) {
  return process.env[name]?.trim() || undefined;
}

async function seedRolesAndPermissions() {
  const permissions = new Map<string, { id: string }>();

  for (const key of allPermissions) {
    const permission = await prisma.permission.upsert({
      where: { key },
      update: { description: permissionDescriptions[key] },
      create: { key, description: permissionDescriptions[key] },
      select: { id: true },
    });
    permissions.set(key, permission);
  }

  for (const roleName of Object.keys(rolePermissions) as Array<keyof typeof rolePermissions>) {
    const role = await prisma.role.upsert({
      where: { name: RoleName[roleName as keyof typeof RoleName] },
      update: {},
      create: { name: RoleName[roleName as keyof typeof RoleName] },
      select: { id: true },
    });

    const desiredPermissionIds = rolePermissions[roleName]
      .map((permissionKey) => permissions.get(permissionKey)?.id)
      .filter((permissionId): permissionId is string => Boolean(permissionId));

    await prisma.rolePermission.deleteMany({
      where: {
        roleId: role.id,
        ...(desiredPermissionIds.length ? { permissionId: { notIn: desiredPermissionIds } } : {}),
      },
    });

    for (const permissionKey of rolePermissions[roleName]) {
      const permission = permissions.get(permissionKey);
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }
}

async function bootstrapFirstSuperAdmin() {
  const email = bootstrapValue("BOOTSTRAP_ADMIN_EMAIL")?.toLowerCase();
  const password = bootstrapValue("BOOTSTRAP_ADMIN_PASSWORD");
  const firstName = bootstrapValue("BOOTSTRAP_ADMIN_FIRST_NAME");
  const lastName = bootstrapValue("BOOTSTRAP_ADMIN_LAST_NAME");

  if (!email && !password) return;
  if (!email || !password) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be configured together.");
  }
  if (password.length < 12) {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters long.");
  }

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { roles: { some: { role: { name: RoleName.SUPER_ADMIN } } } },
    select: { id: true },
  });
  if (existingSuperAdmin) {
    console.log("SUPER_ADMIN already exists; bootstrap made no account changes.");
    return;
  }

  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { name: RoleName.SUPER_ADMIN },
    select: { id: true },
  });
  const existingUser = await prisma.user.findUnique({ where: { email } });

  await prisma.$transaction(async (tx) => {
    const user = existingUser
      ? await tx.user.update({
          where: { id: existingUser.id },
          data: {
            passwordHash: await hashPassword(password),
            status: UserStatus.ACTIVE,
            profile: {
              upsert: {
                create: { firstName, lastName },
                update: {
                  firstName: firstName ?? undefined,
                  lastName: lastName ?? undefined,
                },
              },
            },
          },
          select: { id: true },
        })
      : await tx.user.create({
          data: {
            email,
            passwordHash: await hashPassword(password),
            status: UserStatus.ACTIVE,
            profile: { create: { firstName, lastName } },
          },
          select: { id: true },
        });

    await tx.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: { userId: user.id, roleId: superAdminRole.id },
    });
  });

  console.log(`Bootstrapped SUPER_ADMIN role for ${email}.`);
}

async function main() {
  await seedRolesAndPermissions();
  await bootstrapFirstSuperAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
