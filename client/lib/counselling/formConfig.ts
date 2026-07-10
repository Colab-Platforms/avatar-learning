export const OTHER_VALUE = "Other";

export const careerFieldOptions = [
  { value: "Technology & Engineering", label: "Technology & Engineering" },
  { value: "Medicine & Healthcare", label: "Medicine & Healthcare" },
  {
    value: "Business, Finance & Management",
    label: "Business, Finance & Management",
  },
  { value: "Arts, Design & Media", label: "Arts, Design & Media" },
  {
    value: "Government, Law & Civil Services",
    label: "Government, Law & Civil Services",
  },
  { value: OTHER_VALUE, label: "Other — type your own" },
];

export const futureGoalOptions = [
  {
    value: "Get into a top college / course",
    label: "Get into a top college / course",
  },
  { value: "Land my first job", label: "Land my first job" },
  { value: "Start my own venture", label: "Start my own venture" },
  {
    value: "Complete a professional certification",
    label: "Complete a professional certification",
  },
  { value: "Still figuring it out", label: "Still figuring it out" },
  { value: OTHER_VALUE, label: "Other — type your own" },
];

export const careerPriorityOptions = [
  { value: "High income potential", label: "High income potential" },
  { value: "Job security & stability", label: "Job security & stability" },
  { value: "Passion / genuine interest", label: "Passion / genuine interest" },
  { value: "Social impact & meaning", label: "Social impact & meaning" },
  { value: "Work-life balance", label: "Work-life balance" },
  { value: OTHER_VALUE, label: "Other — type your own" },
];

export const studyStreamOptions = [
  { value: "Yes — Science", label: "Yes — Science" },
  { value: "Yes — Commerce", label: "Yes — Commerce" },
  { value: "Yes — Arts / Humanities", label: "Yes — Arts / Humanities" },
  {
    value: "Yes — a specific skill/vocational path",
    label: "Yes — a specific skill/vocational path",
  },
  { value: "Not decided yet", label: "Not decided yet" },
  { value: OTHER_VALUE, label: "Other — type your own" },
];

export const planningChallengeOptions = [
  {
    value: "I don't know my own strengths",
    label: "I don't know my own strengths",
  },
  { value: "Family or peer pressure", label: "Family or peer pressure" },
  {
    value: "Too many options, hard to choose",
    label: "Too many options, hard to choose",
  },
  { value: "Lack of proper guidance", label: "Lack of proper guidance" },
  { value: "Financial constraints", label: "Financial constraints" },
  { value: OTHER_VALUE, label: "Other — type your own" },
];

export const freeTimeOptions = [
  { value: "Reading", label: "Reading" },
  { value: "Sports & fitness", label: "Sports & fitness" },
  {
    value: "Music, art or a creative craft",
    label: "Music, art or a creative craft",
  },
  { value: "Gaming", label: "Gaming" },
  {
    value: "Volunteering / community work",
    label: "Volunteering / community work",
  },
  { value: OTHER_VALUE, label: "Other — type your own" },
];

export const socialSettingOptions = [
  {
    value: "Outgoing — love meeting new people",
    label: "Outgoing — love meeting new people",
  },
  {
    value: "Comfortable in small familiar groups",
    label: "Comfortable in small familiar groups",
  },
  {
    value: "Prefer one-on-one conversations",
    label: "Prefer one-on-one conversations",
  },
  {
    value: "Introverted — enjoy my own company",
    label: "Introverted — enjoy my own company",
  },
  {
    value: "Depends heavily on the setting",
    label: "Depends heavily on the setting",
  },
  { value: OTHER_VALUE, label: "Other — type your own" },
];

export const workEnvironmentOptions = [
  { value: "Quiet and structured", label: "Quiet and structured" },
  {
    value: "Energetic and collaborative",
    label: "Energetic and collaborative",
  },
  { value: "Flexible and independent", label: "Flexible and independent" },
  { value: "Creative and open-ended", label: "Creative and open-ended" },
  {
    value: "A mix, depending on the task",
    label: "A mix, depending on the task",
  },
  { value: OTHER_VALUE, label: "Other — type your own" },
];

export const stressHandlingOptions = [
  {
    value: "Talk it out with friends or family",
    label: "Talk it out with friends or family",
  },
  { value: "Take time alone to reflect", label: "Take time alone to reflect" },
  {
    value: "Physical activity or exercise",
    label: "Physical activity or exercise",
  },
  { value: "Stay busy and push through", label: "Stay busy and push through" },
  {
    value: "Still working this one out",
    label: "Still working this one out",
  },
  { value: OTHER_VALUE, label: "Other — type your own" },
];

export const proudMomentOptions = [
  { value: "A skill I taught myself", label: "A skill I taught myself" },
  { value: "A leadership role I held", label: "A leadership role I held" },
  {
    value: "Community or volunteer work",
    label: "Community or volunteer work",
  },
  { value: "A creative project I made", label: "A creative project I made" },
  { value: "A personal habit I built", label: "A personal habit I built" },
  { value: OTHER_VALUE, label: "Other — type your own" },
];

export type FieldType = "text" | "textarea" | "radio" | "checkbox" | "select";

export interface FormFieldConfig {
  name: string;
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  inputType?: "text" | "email" | "number" | "tel";
  options?: { value: string; label: string }[];
  otherField?: string;
  questionNumber?: string;
}

export interface FormSectionConfig {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  fields: FormFieldConfig[];
}

export const counsellingFormSections: FormSectionConfig[] = [
  {
    id: "candidate-details",
    badge: "•",
    title: "A little bit of paperwork first",
    subtitle:
      "Just the basics — so we can match your report to the right file.",
    fields: [
      {
        name: "fullName",
        type: "text",
        label: "Full Name",
        placeholder: "Your full name",
        required: true,
      },
      {
        name: "age",
        type: "text",
        label: "Age",
        placeholder: "e.g. 17",
        inputType: "number",
        required: true,
      },
      {
        name: "gradeYear",
        type: "text",
        label: "Grade / Year of Study",
        placeholder: "e.g. Class 12 / 2nd Year B.Com",
        required: true,
      },
      {
        name: "institutionName",
        type: "text",
        label: "School / College",
        placeholder: "Institution name",
        required: true,
      },
      {
        name: "contactNumber",
        type: "text",
        label: "Contact Number",
        placeholder: "+91",
        inputType: "tel",
        required: true,
      },
      {
        name: "email",
        type: "text",
        label: "Email",
        placeholder: "you@example.com",
        inputType: "email",
        required: true,
      },
    ],
  },
  {
    id: "career-future",
    badge: "C",
    title: "Where you're headed",
    subtitle:
      "Five questions to help your counsellor understand your direction, priorities and concerns.",
    fields: [
      {
        name: "careerField",
        type: "radio",
        label: "Which career fields excite you the most right now?",
        description: "Pick the one you feel pulled toward today.",
        questionNumber: "01",
        options: careerFieldOptions,
        otherField: "careerFieldOther",
        required: true,
      },
      {
        name: "futureGoal",
        type: "radio",
        label: "What are you hoping to achieve in the next 3–5 years?",
        description: "Your near-term goal, as you see it right now.",
        questionNumber: "02",
        options: futureGoalOptions,
        otherField: "futureGoalOther",
        required: true,
      },
      {
        name: "careerPriority",
        type: "radio",
        label: "What matters most to you when choosing a career?",
        description: "The single biggest factor guiding your decision.",
        questionNumber: "03",
        options: careerPriorityOptions,
        otherField: "careerPriorityOther",
        required: true,
      },
      {
        name: "studyStream",
        type: "radio",
        label: "Have you already chosen a stream or field of study?",
        description: "Where you currently stand on this decision.",
        questionNumber: "04",
        options: studyStreamOptions,
        otherField: "studyStreamOther",
        required: true,
      },
      {
        name: "planningChallenge",
        type: "radio",
        label: "What's your biggest challenge in career planning right now?",
        description: "What's actually getting in the way.",
        questionNumber: "05",
        options: planningChallengeOptions,
        otherField: "planningChallengeOther",
        required: true,
      },
    ],
  },
  {
    id: "about-you",
    badge: "P",
    title: "Who you are outside of grades",
    subtitle:
      "Five quick ones about your personality, habits and how you spend your time.",
    fields: [
      {
        name: "freeTimeActivity",
        type: "radio",
        label: "How do you usually spend your free time?",
        description: "Your real hobbies, not the ones on a resume.",
        questionNumber: "01",
        options: freeTimeOptions,
        otherField: "freeTimeOther",
        required: true,
      },
      {
        name: "socialSetting",
        type: "radio",
        label: "How would you describe yourself in social settings?",
        description: "How you naturally show up around people.",
        questionNumber: "02",
        options: socialSettingOptions,
        otherField: "socialSettingOther",
        required: true,
      },
      {
        name: "workEnvironment",
        type: "radio",
        label: "What kind of environment brings out your best work?",
        description: "Think classroom, team project, or workspace.",
        questionNumber: "03",
        options: workEnvironmentOptions,
        otherField: "workEnvironmentOther",
        required: true,
      },
      {
        name: "stressHandling",
        type: "radio",
        label: "How do you usually handle stress or setbacks?",
        description: "Your go-to coping habit.",
        questionNumber: "04",
        options: stressHandlingOptions,
        otherField: "stressHandlingOther",
        required: true,
      },
      {
        name: "proudMoment",
        type: "radio",
        label: "What's something you're proud of, outside academics?",
        description: "A moment, skill or role that mattered to you.",
        questionNumber: "05",
        options: proudMomentOptions,
        otherField: "proudMomentOther",
        required: true,
      },
    ],
  },
  {
    id: "personal-note",
    badge: "✒",
    title: "Tell us about yourself",
    subtitle:
      "A short, free-form note — anything you'd want your counsellor to know before you sit down together.",
    fields: [
      {
        name: "personalNote",
        type: "textarea",
        label: "In your own words",
        placeholder: "e.g. I'm someone who...",
        maxLength: 600,
        required: false,
      },
    ],
  },
];

export const counsellingFieldNames = [
  "fullName",
  "age",
  "gradeYear",
  "institutionName",
  "contactNumber",
  "email",
  "careerField",
  "careerFieldOther",
  "futureGoal",
  "futureGoalOther",
  "careerPriority",
  "careerPriorityOther",
  "studyStream",
  "studyStreamOther",
  "planningChallenge",
  "planningChallengeOther",
  "freeTimeActivity",
  "freeTimeOther",
  "socialSetting",
  "socialSettingOther",
  "workEnvironment",
  "workEnvironmentOther",
  "stressHandling",
  "stressHandlingOther",
  "proudMoment",
  "proudMomentOther",
  "personalNote",
] as const;

export type CounsellingFieldName = (typeof counsellingFieldNames)[number];

export interface CounsellingFormValues {
  fullName: string;
  age: string;
  gradeYear: string;
  institutionName: string;
  contactNumber: string;
  email: string;
  careerField: string;
  careerFieldOther: string;
  futureGoal: string;
  futureGoalOther: string;
  careerPriority: string;
  careerPriorityOther: string;
  studyStream: string;
  studyStreamOther: string;
  planningChallenge: string;
  planningChallengeOther: string;
  freeTimeActivity: string;
  freeTimeOther: string;
  socialSetting: string;
  socialSettingOther: string;
  workEnvironment: string;
  workEnvironmentOther: string;
  stressHandling: string;
  stressHandlingOther: string;
  proudMoment: string;
  proudMomentOther: string;
  personalNote: string;
}

export const emptyCounsellingFormValues: CounsellingFormValues = {
  fullName: "",
  age: "",
  gradeYear: "",
  institutionName: "",
  contactNumber: "",
  email: "",
  careerField: "",
  careerFieldOther: "",
  futureGoal: "",
  futureGoalOther: "",
  careerPriority: "",
  careerPriorityOther: "",
  studyStream: "",
  studyStreamOther: "",
  planningChallenge: "",
  planningChallengeOther: "",
  freeTimeActivity: "",
  freeTimeOther: "",
  socialSetting: "",
  socialSettingOther: "",
  workEnvironment: "",
  workEnvironmentOther: "",
  stressHandling: "",
  stressHandlingOther: "",
  proudMoment: "",
  proudMomentOther: "",
  personalNote: "",
};
