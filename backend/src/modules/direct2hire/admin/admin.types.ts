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
}
