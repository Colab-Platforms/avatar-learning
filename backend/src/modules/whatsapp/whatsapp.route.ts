import prisma from "@root/prisma.js";
import { createWhatsappRouter } from "./whatsapp.router.js";
import { PrismaWhatsappStore } from "./whatsapp.store.js";
import { ContactsService, isOptOutKeyword, type ContactsDb } from "@/modules/business-admin/contacts.service.js";

// Mounted at /api/whatsapp in src/routes.ts → callback URL: /api/whatsapp/webhook
const contacts = new ContactsService(prisma as unknown as ContactsDb);

export default createWhatsappRouter({
  store: new PrismaWhatsappStore(prisma),
  // A customer replying exactly STOP/UNSUBSCRIBE withdraws consent right away; every outbound send then refuses them.
  // Runs for redeliveries too (idempotent), so a STOP whose first attempt failed is repaired when Meta retries.
  onInboundCreated: async (event) => {
    if (event.type === "text" && isOptOutKeyword(event.textBody)) await contacts.registerOptOut(event.from, event.contactName, event.timestamp);
  },
});
