export const OTHER_VALUE = "Other";

export type QuestionType = "text" | "textarea" | "radio" | "checkbox" | "select";

export interface QuestionValidation {
  required?: boolean;
  maxLength?: number;
  email?: boolean;
}

export interface CounsellingQuestion {
  id: string;
  name: string;
  label: string;
  type: QuestionType;
  section: string;
  description?: string;
  placeholder?: string;
  inputType?: "text" | "email" | "number" | "tel";
  options?: { value: string; label: string }[];
  otherField?: string;
  questionNumber?: string;
  validation: QuestionValidation;
}

export interface CounsellingSectionMeta {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
}

export const counsellingSectionMeta: CounsellingSectionMeta[] = [
  {
    id: "career-future",
    badge: "C",
    title: "Where you're headed",
    subtitle:
      "Eight questions to help your counsellor understand your direction, priorities, concerns and AI-readiness.",
  },
  {
    id: "about-you",
    badge: "P",
    title: "Who you are outside of grades",
    subtitle:
      "Seven quick ones about your personality, habits, how you spend your time, and your relationship with AI.",
  },
  {
    id: "personal-note",
    badge: "✒",
    title: "Tell us about yourself",
    subtitle:
      "A short, free-form note — anything you'd want your counsellor to know before you sit down together.",
  },
];

const careerFieldOptions = [
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

const futureGoalOptions = [
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

const careerPriorityOptions = [
  { value: "High income potential", label: "High income potential" },
  { value: "Job security & stability", label: "Job security & stability" },
  { value: "Passion / genuine interest", label: "Passion / genuine interest" },
  { value: "Social impact & meaning", label: "Social impact & meaning" },
  { value: "Work-life balance", label: "Work-life balance" },
  { value: OTHER_VALUE, label: "Other — type your own" },
];

const studyStreamOptions = [
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

const planningChallengeOptions = [
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

const aiUnderstandingOptions = [
  {
    value: "I don't really know what AI is",
    label: "I don't really know what AI is",
  },
  {
    value: "I've heard of it but never used it",
    label: "I've heard of it but never used it",
  },
  {
    value: "I use AI tools sometimes (like ChatGPT)",
    label: "I use AI tools sometimes (like ChatGPT)",
  },
  {
    value: "I use AI tools regularly for study/work",
    label: "I use AI tools regularly for study/work",
  },
  {
    value: "I actively learn about how AI works",
    label: "I actively learn about how AI works",
  },
  { value: OTHER_VALUE, label: "Other — type your own" },
];

const aiFieldImpactOptions = [
  {
    value: "Yes, a lot — it'll transform the field",
    label: "Yes, a lot — it'll transform the field",
  },
  {
    value: "Yes, but only some parts of the job",
    label: "Yes, but only some parts of the job",
  },
  {
    value: "Not sure / never thought about it",
    label: "Not sure / never thought about it",
  },
  { value: "Probably not much", label: "Probably not much" },
  {
    value: "No, my field is untouched by AI",
    label: "No, my field is untouched by AI",
  },
  { value: OTHER_VALUE, label: "Other — type your own" },
];

const aiSkillBuildingOptions = [
  {
    value: "Prompting / using AI tools well",
    label: "Prompting / using AI tools well",
  },
  {
    value: "Basic coding or no-code AI tools",
    label: "Basic coding or no-code AI tools",
  },
  { value: "Data or analytics skills", label: "Data or analytics skills" },
  {
    value: "None yet, but I want to learn",
    label: "None yet, but I want to learn",
  },
  {
    value: "Not interested in this area",
    label: "Not interested in this area",
  },
  { value: OTHER_VALUE, label: "Other — type your own" },
];

const freeTimeOptions = [
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

const socialSettingOptions = [
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

const workEnvironmentOptions = [
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

const stressHandlingOptions = [
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

const proudMomentOptions = [
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

const aiEverydayUseOptions = [
  { value: "Homework or study help", label: "Homework or study help" },
  {
    value: "Just for fun / curiosity / chatting",
    label: "Just for fun / curiosity / chatting",
  },
  {
    value: "Planning, organizing or productivity",
    label: "Planning, organizing or productivity",
  },
  {
    value: "I don't use AI tools personally",
    label: "I don't use AI tools personally",
  },
  {
    value: "I actively explore new AI tools",
    label: "I actively explore new AI tools",
  },
  { value: OTHER_VALUE, label: "Other — type your own" },
];

const aiCuriosityOptions = [
  {
    value: "Very curious — want to master it",
    label: "Very curious — want to master it",
  },
  {
    value: "Somewhat interested, if it's useful",
    label: "Somewhat interested, if it's useful",
  },
  {
    value: "Neutral — will learn if required",
    label: "Neutral — will learn if required",
  },
  { value: "Not particularly interested", label: "Not particularly interested" },
  { value: "A bit intimidated by it", label: "A bit intimidated by it" },
  { value: OTHER_VALUE, label: "Other — type your own" },
];

export const counsellingQuestions: CounsellingQuestion[] = [
  {
    id: "career-field",
    name: "careerField",
    type: "radio",
    section: "career-future",
    label: "Which career fields excite you the most right now?",
    description: "Pick the one you feel pulled toward today.",
    questionNumber: "01",
    options: careerFieldOptions,
    otherField: "careerFieldOther",
    validation: { required: true },
  },
  {
    id: "career-field-other",
    name: "careerFieldOther",
    type: "text",
    section: "career-future",
    label: "Specify career field",
    validation: { required: false },
  },
  {
    id: "future-goal",
    name: "futureGoal",
    type: "radio",
    section: "career-future",
    label: "What are you hoping to achieve in the next 3–5 years?",
    description: "Your near-term goal, as you see it right now.",
    questionNumber: "02",
    options: futureGoalOptions,
    otherField: "futureGoalOther",
    validation: { required: true },
  },
  {
    id: "future-goal-other",
    name: "futureGoalOther",
    type: "text",
    section: "career-future",
    label: "Specify future goal",
    validation: { required: false },
  },
  {
    id: "career-priority",
    name: "careerPriority",
    type: "radio",
    section: "career-future",
    label: "What matters most to you when choosing a career?",
    description: "The single biggest factor guiding your decision.",
    questionNumber: "03",
    options: careerPriorityOptions,
    otherField: "careerPriorityOther",
    validation: { required: true },
  },
  {
    id: "career-priority-other",
    name: "careerPriorityOther",
    type: "text",
    section: "career-future",
    label: "Specify career priority",
    validation: { required: false },
  },
  {
    id: "study-stream",
    name: "studyStream",
    type: "radio",
    section: "career-future",
    label: "Have you already chosen a stream or field of study?",
    description: "Where you currently stand on this decision.",
    questionNumber: "04",
    options: studyStreamOptions,
    otherField: "studyStreamOther",
    validation: { required: true },
  },
  {
    id: "study-stream-other",
    name: "studyStreamOther",
    type: "text",
    section: "career-future",
    label: "Specify study stream",
    validation: { required: false },
  },
  {
    id: "planning-challenge",
    name: "planningChallenge",
    type: "radio",
    section: "career-future",
    label: "What's your biggest challenge in career planning right now?",
    description: "What's actually getting in the way.",
    questionNumber: "05",
    options: planningChallengeOptions,
    otherField: "planningChallengeOther",
    validation: { required: true },
  },
  {
    id: "planning-challenge-other",
    name: "planningChallengeOther",
    type: "text",
    section: "career-future",
    label: "Specify planning challenge",
    validation: { required: false },
  },
  {
    id: "ai-understanding",
    name: "aiUnderstanding",
    type: "radio",
    section: "career-future",
    label: "How would you rate your own understanding of AI (Artificial Intelligence)?",
    description: "Be honest — this helps us pitch things at the right level.",
    questionNumber: "06",
    options: aiUnderstandingOptions,
    otherField: "aiUnderstandingOther",
    validation: { required: true },
  },
  {
    id: "ai-understanding-other",
    name: "aiUnderstandingOther",
    type: "text",
    section: "career-future",
    label: "Specify AI understanding",
    validation: { required: false },
  },
  {
    id: "ai-field-impact",
    name: "aiFieldImpact",
    type: "radio",
    section: "career-future",
    label: "Do you think AI will change the career field you're interested in?",
    description: "Your honest read on where things are headed.",
    questionNumber: "07",
    options: aiFieldImpactOptions,
    otherField: "aiFieldImpactOther",
    validation: { required: true },
  },
  {
    id: "ai-field-impact-other",
    name: "aiFieldImpactOther",
    type: "text",
    section: "career-future",
    label: "Specify AI field impact",
    validation: { required: false },
  },
  {
    id: "ai-skill-building",
    name: "aiSkillBuilding",
    type: "radio",
    section: "career-future",
    label: "Have you tried building any AI-related skill so far?",
    description: "Anything from prompting to coding — even a little counts.",
    questionNumber: "08",
    options: aiSkillBuildingOptions,
    otherField: "aiSkillBuildingOther",
    validation: { required: true },
  },
  {
    id: "ai-skill-building-other",
    name: "aiSkillBuildingOther",
    type: "text",
    section: "career-future",
    label: "Specify AI skill building",
    validation: { required: false },
  },
  {
    id: "free-time",
    name: "freeTimeActivity",
    type: "radio",
    section: "about-you",
    label: "How do you usually spend your free time?",
    description: "Your real hobbies, not the ones on a resume.",
    questionNumber: "01",
    options: freeTimeOptions,
    otherField: "freeTimeOther",
    validation: { required: true },
  },
  {
    id: "free-time-other",
    name: "freeTimeOther",
    type: "text",
    section: "about-you",
    label: "Specify free time activity",
    validation: { required: false },
  },
  {
    id: "social-setting",
    name: "socialSetting",
    type: "radio",
    section: "about-you",
    label: "How would you describe yourself in social settings?",
    description: "How you naturally show up around people.",
    questionNumber: "02",
    options: socialSettingOptions,
    otherField: "socialSettingOther",
    validation: { required: true },
  },
  {
    id: "social-setting-other",
    name: "socialSettingOther",
    type: "text",
    section: "about-you",
    label: "Specify social setting",
    validation: { required: false },
  },
  {
    id: "work-environment",
    name: "workEnvironment",
    type: "radio",
    section: "about-you",
    label: "What kind of environment brings out your best work?",
    description: "Think classroom, team project, or workspace.",
    questionNumber: "03",
    options: workEnvironmentOptions,
    otherField: "workEnvironmentOther",
    validation: { required: true },
  },
  {
    id: "work-environment-other",
    name: "workEnvironmentOther",
    type: "text",
    section: "about-you",
    label: "Specify work environment",
    validation: { required: false },
  },
  {
    id: "stress-handling",
    name: "stressHandling",
    type: "radio",
    section: "about-you",
    label: "How do you usually handle stress or setbacks?",
    description: "Your go-to coping habit.",
    questionNumber: "04",
    options: stressHandlingOptions,
    otherField: "stressHandlingOther",
    validation: { required: true },
  },
  {
    id: "stress-handling-other",
    name: "stressHandlingOther",
    type: "text",
    section: "about-you",
    label: "Specify stress handling",
    validation: { required: false },
  },
  {
    id: "proud-moment",
    name: "proudMoment",
    type: "radio",
    section: "about-you",
    label: "What's something you're proud of, outside academics?",
    description: "A moment, skill or role that mattered to you.",
    questionNumber: "05",
    options: proudMomentOptions,
    otherField: "proudMomentOther",
    validation: { required: true },
  },
  {
    id: "proud-moment-other",
    name: "proudMomentOther",
    type: "text",
    section: "about-you",
    label: "Specify proud moment",
    validation: { required: false },
  },
  {
    id: "ai-everyday-use",
    name: "aiEverydayUse",
    type: "radio",
    section: "about-you",
    label: "How do you use AI tools in your everyday life, if at all?",
    description: "Think beyond study — chatting, entertainment, planning, etc.",
    questionNumber: "06",
    options: aiEverydayUseOptions,
    otherField: "aiEverydayUseOther",
    validation: { required: true },
  },
  {
    id: "ai-everyday-use-other",
    name: "aiEverydayUseOther",
    type: "text",
    section: "about-you",
    label: "Specify AI everyday use",
    validation: { required: false },
  },
  {
    id: "ai-curiosity",
    name: "aiCuriosity",
    type: "radio",
    section: "about-you",
    label: "How curious are you to learn more about AI going forward?",
    description: "Your appetite for going deeper into this space.",
    questionNumber: "07",
    options: aiCuriosityOptions,
    otherField: "aiCuriosityOther",
    validation: { required: true },
  },
  {
    id: "ai-curiosity-other",
    name: "aiCuriosityOther",
    type: "text",
    section: "about-you",
    label: "Specify AI curiosity",
    validation: { required: false },
  },
  {
    id: "personal-note",
    name: "personalNote",
    type: "textarea",
    section: "personal-note",
    label: "In your own words",
    placeholder: "e.g. I'm someone who...",
    validation: { required: false, maxLength: 600 },
  },
];

export type FieldType = QuestionType;

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

function questionToField(question: CounsellingQuestion): FormFieldConfig | null {
  if (question.name.endsWith("Other") && question.type === "text") {
    return null;
  }

  return {
    name: question.name,
    type: question.type,
    label: question.label,
    description: question.description,
    placeholder: question.placeholder,
    required: question.validation.required,
    maxLength: question.validation.maxLength,
    inputType: question.inputType,
    options: question.options,
    otherField: question.otherField,
    questionNumber: question.questionNumber,
  };
}

export function buildCounsellingFormSections(): FormSectionConfig[] {
  return counsellingSectionMeta.map((section) => ({
    ...section,
    fields: counsellingQuestions
      .filter((question) => question.section === section.id)
      .map(questionToField)
      .filter((field): field is FormFieldConfig => field !== null),
  }));
}

export const counsellingFormSections = buildCounsellingFormSections();

export type CounsellingFormValues = {
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
  aiUnderstanding: string;
  aiUnderstandingOther: string;
  aiFieldImpact: string;
  aiFieldImpactOther: string;
  aiSkillBuilding: string;
  aiSkillBuildingOther: string;
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
  aiEverydayUse: string;
  aiEverydayUseOther: string;
  aiCuriosity: string;
  aiCuriosityOther: string;
  personalNote: string;
};

export const emptyCounsellingFormValues: CounsellingFormValues = {
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
  aiUnderstanding: "",
  aiUnderstandingOther: "",
  aiFieldImpact: "",
  aiFieldImpactOther: "",
  aiSkillBuilding: "",
  aiSkillBuildingOther: "",
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
  aiEverydayUse: "",
  aiEverydayUseOther: "",
  aiCuriosity: "",
  aiCuriosityOther: "",
  personalNote: "",
};

export const otherFieldPairs: Array<{
  field: keyof CounsellingFormValues;
  other: keyof CounsellingFormValues;
  message: string;
}> = [
  {
    field: "careerField",
    other: "careerFieldOther",
    message: "Please specify your career field",
  },
  {
    field: "futureGoal",
    other: "futureGoalOther",
    message: "Please specify your future goal",
  },
  {
    field: "careerPriority",
    other: "careerPriorityOther",
    message: "Please specify your career priority",
  },
  {
    field: "studyStream",
    other: "studyStreamOther",
    message: "Please specify your study stream",
  },
  {
    field: "planningChallenge",
    other: "planningChallengeOther",
    message: "Please specify your planning challenge",
  },
  {
    field: "aiUnderstanding",
    other: "aiUnderstandingOther",
    message: "Please specify your AI understanding",
  },
  {
    field: "aiFieldImpact",
    other: "aiFieldImpactOther",
    message: "Please specify how AI impacts your field",
  },
  {
    field: "aiSkillBuilding",
    other: "aiSkillBuildingOther",
    message: "Please specify the AI skill you've built",
  },
  {
    field: "freeTimeActivity",
    other: "freeTimeOther",
    message: "Please specify how you spend free time",
  },
  {
    field: "socialSetting",
    other: "socialSettingOther",
    message: "Please specify your social setting",
  },
  {
    field: "workEnvironment",
    other: "workEnvironmentOther",
    message: "Please specify your work environment",
  },
  {
    field: "stressHandling",
    other: "stressHandlingOther",
    message: "Please specify how you handle stress",
  },
  {
    field: "proudMoment",
    other: "proudMomentOther",
    message: "Please specify what you are proud of",
  },
  {
    field: "aiEverydayUse",
    other: "aiEverydayUseOther",
    message: "Please specify your everyday AI use",
  },
  {
    field: "aiCuriosity",
    other: "aiCuriosityOther",
    message: "Please specify your AI curiosity",
  },
];
