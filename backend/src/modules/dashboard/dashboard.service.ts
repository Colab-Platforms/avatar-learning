import prisma from "@root/prisma.js";
import { AdminContactService } from "../contact/contact.service.js";

const adminContactService = new AdminContactService();

export class AdminDashboardService {
  async getOverview() {
    const [
      revenueByProduct,
      totalUsers,
      activeUsers,
      d2hByStatus,
      partnersByStatus,
      pendingClaims,
      internshipAppsByStatus,
      unreadContacts,
    ] = await Promise.all([
      prisma.paymentOrder.groupBy({
        by: ["productType"],
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { isDeleted: false, isActive: true } }),
      prisma.direct2HireEnrollment.groupBy({ by: ["status"], _count: true }),
      prisma.partner.groupBy({ by: ["status"], _count: true }),
      prisma.partnerClaim.aggregate({
        where: { status: "PENDING" },
        _count: true,
        _sum: { amount: true },
      }),
      prisma.internshipApplication.groupBy({ by: ["status"], _count: true }),
      adminContactService.getUnreadCount(),
    ]);

    const courseRevenue =
      revenueByProduct.find((r) => r.productType === "COURSE")?._sum.amount ?? 0;
    const direct2hireRevenue =
      revenueByProduct.find((r) => r.productType === "DIRECT2HIRE")?._sum.amount ?? 0;

    const d2hCounts = { PENDING: 0, PAID: 0, REFUNDED: 0 };
    for (const row of d2hByStatus) d2hCounts[row.status] = row._count;

    const partnerCounts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const row of partnersByStatus) partnerCounts[row.status] = row._count;

    const internshipAppCounts = { PENDING: 0, ACCEPTED: 0, REJECTED: 0 };
    for (const row of internshipAppsByStatus) internshipAppCounts[row.status] = row._count;

    return {
      revenue: {
        courseInPaise: courseRevenue,
        direct2hireInPaise: direct2hireRevenue,
        totalInPaise: courseRevenue + direct2hireRevenue,
      },
      users: { total: totalUsers, active: activeUsers },
      d2h: {
        pending: d2hCounts.PENDING,
        paid: d2hCounts.PAID,
        refunded: d2hCounts.REFUNDED,
      },
      partners: {
        pending: partnerCounts.PENDING,
        approved: partnerCounts.APPROVED,
        rejected: partnerCounts.REJECTED,
      },
      pendingClaims: {
        count: pendingClaims._count,
        totalAmountRupees: pendingClaims._sum.amount ?? 0,
      },
      internshipApps: {
        pending: internshipAppCounts.PENDING,
        accepted: internshipAppCounts.ACCEPTED,
        rejected: internshipAppCounts.REJECTED,
      },
      contacts: { unread: unreadContacts },
    };
  }
}
