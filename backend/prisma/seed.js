import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // --- Exchanges ---
  const exchanges = [
    {
      exchange_id: "binance",
      exchange_name: "Binance",
      api_base_url: "https://api.binance.com",
      ws_base_url: "wss://stream.binance.com:9443",
      is_active: true,
    },
    {
      exchange_id: "coinbase",
      exchange_name: "Coinbase Pro",
      api_base_url: "https://api.pro.coinbase.com",
      ws_base_url: "wss://ws-feed.pro.coinbase.com",
      is_active: true,
    },
    {
      exchange_id: "kraken",
      exchange_name: "Kraken",
      api_base_url: "https://api.kraken.com",
      ws_base_url: "wss://ws.kraken.com",
      is_active: true,
    },
  ];

  console.log("Creating exchanges...");
  for (const exchange of exchanges) {
    await prisma.exchange.upsert({
      where: { exchange_id: exchange.exchange_id },
      update: exchange,
      create: exchange,
    });
  }

  // --- RBAC Roles ---
  const rolesData = [
    { name: "Admin", description: "Superuser with full system access" },
    {
      name: "Trader",
      description: "Standard user who can trade and manage own bots",
    },
    { name: "Viewer", description: "Read-only access" },
    { name: "Support", description: "Support staff with limited access" },
  ];

  console.log("Creating roles...");
  const roles = {};
  for (const roleData of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: { description: roleData.description },
      create: roleData,
    });
    roles[role.name] = role;
  }

  // --- RBAC Permissions ---
  const permissionsMatrix = [
    { resource: "user", action: "create", roles: ["Admin"] },
    { resource: "user", action: "read", roles: ["Admin", "Support"] },
    { resource: "user", action: "update", roles: ["Admin", "Support"] },
    { resource: "user", action: "delete", roles: ["Admin"] },
    { resource: "user", action: "assign_role", roles: ["Admin"] },

    {
      resource: "profile",
      action: "read:own",
      roles: ["Admin", "Trader", "Support"],
    },
    {
      resource: "profile",
      action: "update:own",
      roles: ["Admin", "Trader", "Support"],
    },

    { resource: "bot", action: "create", roles: ["Admin", "Trader"] },
    {
      resource: "bot",
      action: "read:own",
      roles: ["Admin", "Trader", "Support"],
    },
    { resource: "bot", action: "read:all", roles: ["Admin", "Support"] },
    { resource: "bot", action: "update:own", roles: ["Admin", "Trader"] },
    { resource: "bot", action: "update:all", roles: ["Admin"] },
    { resource: "bot", action: "delete:own", roles: ["Admin", "Trader"] },
    { resource: "bot", action: "delete:all", roles: ["Admin"] },

    { resource: "apikey", action: "create", roles: ["Admin", "Trader"] },
    {
      resource: "apikey",
      action: "read:own",
      roles: ["Admin", "Trader", "Support"],
    },
    { resource: "apikey", action: "read:all", roles: ["Admin", "Support"] },
    { resource: "apikey", action: "update:own", roles: ["Admin", "Trader"] },
    { resource: "apikey", action: "update:all", roles: ["Admin"] },
    { resource: "apikey", action: "delete:own", roles: ["Admin", "Trader"] },
    { resource: "apikey", action: "delete:all", roles: ["Admin"] },

    { resource: "exchange", action: "manage", roles: ["Admin"] },
    { resource: "system_settings", action: "manage", roles: ["Admin"] },

    { resource: "auditlog", action: "read", roles: ["Admin", "Support"] },

    {
      resource: "data",
      action: "read:public",
      roles: ["Admin", "Trader", "Viewer", "Support"],
    },
    {
      resource: "data",
      action: "read:own",
      roles: ["Admin", "Trader", "Support"],
    },
  ];

  console.log("Creating permissions...");
  const permissions = {};
  for (const perm of permissionsMatrix) {
    const permission = await prisma.permission.upsert({
      where: {
        action_resource: {
          action: perm.action,
          resource: perm.resource,
        },
      },
      update: {},
      create: {
        action: perm.action,
        resource: perm.resource,
        description: `${perm.resource} ${perm.action}`,
      },
    });
    permissions[`${perm.resource}:${perm.action}`] = permission;
  }

  console.log("Assigning permissions to roles...");
  for (const perm of permissionsMatrix) {
    const permission = permissions[`${perm.resource}:${perm.action}`];
    for (const roleName of perm.roles) {
      const role = roles[roleName];
      await prisma.rolePermission.upsert({
        where: {
          role_id_permission_id: {
            role_id: role.role_id,
            permission_id: permission.permission_id,
          },
        },
        update: {},
        create: {
          role_id: role.role_id,
          permission_id: permission.permission_id,
        },
      });
    }
  }

  // --- Test User ---
  const testUserData = {
    email: "test@example.com",
    password_hash:
      "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm", // 'password'
    user_name: "testuser",
    full_name: "Test User",
    is_active: true,
    email_verified: true,
  };

  console.log("Creating test user...");
  const testUser = await prisma.user.upsert({
    where: { email: testUserData.email },
    update: testUserData,
    create: testUserData,
  });

  // Optionally assign Admin role to test user
  await prisma.userRole.upsert({
    where: {
      user_id_role_id: {
        user_id: testUser.user_id,
        role_id: roles["Admin"].role_id,
      },
    },
    update: {},
    create: {
      user_id: testUser.user_id,
      role_id: roles["Admin"].role_id,
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error seeding database:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
