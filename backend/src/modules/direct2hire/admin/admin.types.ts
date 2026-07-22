import type { AdminStudentInternshipProgressDto } from "../internship/internship.types.js";

export interface AdminD2HPaymentInfo {
  provider: string;
  gatewayOrderId: string;
  gatewayPaymentId: string | null;
  amount: number;
  status: string;
  paidAt: Date | null;
}

export interface AdminD2HStudentListItem {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  institutionName: string | null;
  currentEducation: string | null;
  city: string | null;
  state: string | null;
  paymentCompleted: boolean;
  enrollmentStatus: string;
  joinedAt: Date;
  hasSubmittedCounselling: boolean;
  hasRecommendation: boolean;
  recommendedCourseTitle: string | null;
  bookingStatus: string | null;
  bookingMode: string | null;
  payment: AdminD2HPaymentInfo | null;
}

export interface AdminD2HStudentProfile {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNo: string | null;
    profileImage: string | null;
    gender: string | null;
    address: string | null;
    state: string | null;
    country: string | null;
    currentStudyLevel: string | null;
    createdAt: Date;
  };
  lead: {
    fullName: string;
    email: string;
    phoneNumber: string;
    institutionName: string;
    currentEducation: string;
    city: string;
    state: string;
    paymentCompleted: boolean;
    createdAt: Date;
  } | null;
  enrollment: {
    status: string;
    createdAt: Date;
  } | null;
  counselling: Record<string, unknown> | null;
  booking: {
    preferredMode: string;
    notes: string | null;
    status: string;
    counsellorName: string | null;
    meetingLink: string | null;
    scheduledAt: Date | null;
    createdAt: Date;
    counsellingCompleted: boolean;
    counsellingCompletedAt: Date | null;
    selectedCourseId: string | null;
    selectedCourseAt: Date | null;
    selectedCourse: { id: string; title: string; slug: string } | null;
  } | null;
  recommendation: {
    recommendedCourseTitle: string;
    recommendedCourseSlug: string;
    confidenceScore: number | null;
    reasoning: string;
    studentStrengths: unknown;
    growthAreas: unknown;
    summary: string | null;
    generatedAt: Date;
  } | null;
  feedback: {
    assessmentAlignment: string;
    recommendedCourse: string;
    communicationRating: string;
    motivationLevel: string;
    overallPotential: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  payment: AdminD2HPaymentInfo | null;
  internship: AdminStudentInternshipProgressDto;
}
