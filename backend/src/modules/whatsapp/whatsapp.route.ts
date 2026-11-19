import prisma from "@root/prisma.js";
import { createWhatsappRouter } from "./whatsapp.router.js";
import { PrismaWhatsappStore } from "./whatsapp.store.js";

// Mounted at /api/whatsapp in src/routes.ts → callback URL: /api/whatsapp/webhook
export default createWhatsappRouter({ store: new PrismaWhatsappStore(prisma) });
