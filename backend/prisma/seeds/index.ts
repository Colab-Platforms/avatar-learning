import prisma from "../../prisma.js";

const roles = ["USER", "ADMIN", "SUPERADMIN"];

async function main() {
    console.log("Seeding roles...");

    await Promise.all(
        roles.map((name) =>
            prisma.role.upsert({
                where: { name },
                update: {},
                create: { name },
            })
        )
    );

    console.log("✓ Roles seeded successfully");
}

main()
    .catch((e) => {
        console.error("Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });