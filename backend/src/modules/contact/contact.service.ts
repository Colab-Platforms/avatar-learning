import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { CreateContactBody } from "./contact.types.js";

export class ContactService {
  async submit(data: CreateContactBody) {
    return prisma.contact.create({ data });
  }
}

export class AdminContactService {
  async getAll(take?: number, skip?: number) {
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
      ...(take !== undefined && { take }),
      ...(skip !== undefined && { skip }),
    });

    const totalRecords = await prisma.contact.count();
    return { contacts, totalRecords };
  }

  async getUnreadCount() {
    return prisma.contact.count({ where: { isRead: false } });
  }

  async markRead(id: string) {
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new ApiError("Contact message not found", STATUS_CODES.NOT_FOUND);

    return prisma.contact.update({ where: { id }, data: { isRead: true } });
  }

  async delete(id: string) {
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new ApiError("Contact message not found", STATUS_CODES.NOT_FOUND);

    return prisma.contact.delete({ where: { id } });
  }
}
