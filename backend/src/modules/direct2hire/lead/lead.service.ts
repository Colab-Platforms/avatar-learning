import prisma from "@root/prisma.js";
import { googleSheetsService } from "@/services/googleSheets.service.js";
import type { UpsertDirect2HireLeadInput } from "./lead.types.js";

export class LeadService {
  async getByUserId(userId: string) {
    return prisma.direct2HireLead.findUnique({
      where: { userId },
    });
  }

  async upsert(userId: string, data: UpsertDirect2HireLeadInput) {
    const existing = await prisma.direct2HireLead.findUnique({
      where: { userId },
      select: { id: true },
    });

    const lead = await prisma.direct2HireLead.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    // Sync only on first create — never on lead updates
    if (!existing) {
      void googleSheetsService.appendLead(lead);
    }

    return lead;
  }

  async markPaymentCompleted(userId: string) {
    const lead = await prisma.direct2HireLead.findUnique({
      where: { userId },
    });
    if (!lead) return null;

    return prisma.direct2HireLead.update({
      where: { userId },
      data: { paymentCompleted: true },
    });
  }
}
