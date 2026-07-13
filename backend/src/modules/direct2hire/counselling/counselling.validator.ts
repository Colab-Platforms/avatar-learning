import Joi from "joi";

const OTHER = "Other";

const careerFieldOptions = [
  "Technology & Engineering",
  "Medicine & Healthcare",
  "Business, Finance & Management",
  "Arts, Design & Media",
  "Government, Law & Civil Services",
  OTHER,
] as const;

const futureGoalOptions = [
  "Get into a top college / course",
  "Land my first job",
  "Start my own venture",
  "Complete a professional certification",
  "Still figuring it out",
  OTHER,
] as const;

const careerPriorityOptions = [
  "High income potential",
  "Job security & stability",
  "Passion / genuine interest",
  "Social impact & meaning",
  "Work-life balance",
  OTHER,
] as const;

const studyStreamOptions = [
  "Yes — Science",
  "Yes — Commerce",
  "Yes — Arts / Humanities",
  "Yes — a specific skill/vocational path",
  "Not decided yet",
  OTHER,
] as const;

const planningChallengeOptions = [
  "I don't know my own strengths",
  "Family or peer pressure",
  "Too many options, hard to choose",
  "Lack of proper guidance",
  "Financial constraints",
  OTHER,
] as const;

const aiUnderstandingOptions = [
  "I don't really know what AI is",
  "I've heard of it but never used it",
  "I use AI tools sometimes (like ChatGPT)",
  "I use AI tools regularly for study/work",
  "I actively learn about how AI works",
  OTHER,
] as const;

const aiFieldImpactOptions = [
  "Yes, a lot — it'll transform the field",
  "Yes, but only some parts of the job",
  "Not sure / never thought about it",
  "Probably not much",
  "No, my field is untouched by AI",
  OTHER,
] as const;

const aiSkillBuildingOptions = [
  "Prompting / using AI tools well",
  "Basic coding or no-code AI tools",
  "Data or analytics skills",
  "None yet, but I want to learn",
  "Not interested in this area",
  OTHER,
] as const;

const freeTimeOptions = [
  "Reading",
  "Sports & fitness",
  "Music, art or a creative craft",
  "Gaming",
  "Volunteering / community work",
  OTHER,
] as const;

const socialSettingOptions = [
  "Outgoing — love meeting new people",
  "Comfortable in small familiar groups",
  "Prefer one-on-one conversations",
  "Introverted — enjoy my own company",
  "Depends heavily on the setting",
  OTHER,
] as const;

const workEnvironmentOptions = [
  "Quiet and structured",
  "Energetic and collaborative",
  "Flexible and independent",
  "Creative and open-ended",
  "A mix, depending on the task",
  OTHER,
] as const;

const stressHandlingOptions = [
  "Talk it out with friends or family",
  "Take time alone to reflect",
  "Physical activity or exercise",
  "Stay busy and push through",
  "Still working this one out",
  OTHER,
] as const;

const proudMomentOptions = [
  "A skill I taught myself",
  "A leadership role I held",
  "Community or volunteer work",
  "A creative project I made",
  "A personal habit I built",
  OTHER,
] as const;

const aiEverydayUseOptions = [
  "Homework or study help",
  "Just for fun / curiosity / chatting",
  "Planning, organizing or productivity",
  "I don't use AI tools personally",
  "I actively explore new AI tools",
  OTHER,
] as const;

const aiCuriosityOptions = [
  "Very curious — want to master it",
  "Somewhat interested, if it's useful",
  "Neutral — will learn if required",
  "Not particularly interested",
  "A bit intimidated by it",
  OTHER,
] as const;


const baseProfileFields = {
  careerField: Joi.string()
    .valid(...careerFieldOptions)
    .required()
    .messages({ "any.required": "Career field is required" }),
  careerFieldOther: Joi.string()
    .trim()
    .when("careerField", {
      is: OTHER,
      then: Joi.required().messages({
        "any.required": "Please specify your career field",
      }),
      otherwise: Joi.optional().allow(null, ""),
    }),
  futureGoal: Joi.string()
    .valid(...futureGoalOptions)
    .required()
    .messages({ "any.required": "Future goal is required" }),
  futureGoalOther: Joi.string()
    .trim()
    .when("futureGoal", {
      is: OTHER,
      then: Joi.required().messages({
        "any.required": "Please specify your future goal",
      }),
      otherwise: Joi.optional().allow(null, ""),
    }),
  careerPriority: Joi.string()
    .valid(...careerPriorityOptions)
    .required()
    .messages({ "any.required": "Career priority is required" }),
  careerPriorityOther: Joi.string()
    .trim()
    .when("careerPriority", {
      is: OTHER,
      then: Joi.required().messages({
        "any.required": "Please specify your career priority",
      }),
      otherwise: Joi.optional().allow(null, ""),
    }),
  studyStream: Joi.string()
    .valid(...studyStreamOptions)
    .required()
    .messages({ "any.required": "Study stream is required" }),
  studyStreamOther: Joi.string()
    .trim()
    .when("studyStream", {
      is: OTHER,
      then: Joi.required().messages({
        "any.required": "Please specify your study stream",
      }),
      otherwise: Joi.optional().allow(null, ""),
    }),
  planningChallenge: Joi.string()
    .valid(...planningChallengeOptions)
    .required()
    .messages({ "any.required": "Planning challenge is required" }),
  planningChallengeOther: Joi.string()
    .trim()
    .when("planningChallenge", {
      is: OTHER,
      then: Joi.required().messages({
        "any.required": "Please specify your planning challenge",
      }),
      otherwise: Joi.optional().allow(null, ""),
    }),
  freeTimeActivity: Joi.string()
    .valid(...freeTimeOptions)
    .required()
    .messages({ "any.required": "Free time activity is required" }),
  freeTimeOther: Joi.string()
    .trim()
    .when("freeTimeActivity", {
      is: OTHER,
      then: Joi.required().messages({
        "any.required": "Please specify how you spend free time",
      }),
      otherwise: Joi.optional().allow(null, ""),
    }),
  socialSetting: Joi.string()
    .valid(...socialSettingOptions)
    .required()
    .messages({ "any.required": "Social setting is required" }),
  socialSettingOther: Joi.string()
    .trim()
    .when("socialSetting", {
      is: OTHER,
      then: Joi.required().messages({
        "any.required": "Please specify your social setting",
      }),
      otherwise: Joi.optional().allow(null, ""),
    }),
  workEnvironment: Joi.string()
    .valid(...workEnvironmentOptions)
    .required()
    .messages({ "any.required": "Work environment is required" }),
  workEnvironmentOther: Joi.string()
    .trim()
    .when("workEnvironment", {
      is: OTHER,
      then: Joi.required().messages({
        "any.required": "Please specify your work environment",
      }),
      otherwise: Joi.optional().allow(null, ""),
    }),
  stressHandling: Joi.string()
    .valid(...stressHandlingOptions)
    .required()
    .messages({ "any.required": "Stress handling is required" }),
  stressHandlingOther: Joi.string()
    .trim()
    .when("stressHandling", {
      is: OTHER,
      then: Joi.required().messages({
        "any.required": "Please specify how you handle stress",
      }),
      otherwise: Joi.optional().allow(null, ""),
    }),
  proudMoment: Joi.string()
    .valid(...proudMomentOptions)
    .required()
    .messages({ "any.required": "Proud moment is required" }),
  proudMomentOther: Joi.string()
    .trim()
    .when("proudMoment", {
      is: OTHER,
      then: Joi.required().messages({
        "any.required": "Please specify what you are proud of",
      }),
      otherwise: Joi.optional().allow(null, ""),
    }),
  aiUnderstanding: Joi.string()
    .valid(...aiUnderstandingOptions)
    .required()
    .messages({ "any.required": "AI understanding is required" }),
  aiUnderstandingOther: Joi.string()
    .trim()
    .when("aiUnderstanding", {
      is: OTHER,
      then: Joi.required().messages({
        "any.required": "Please specify your AI understanding",
      }),
      otherwise: Joi.optional().allow(null, ""),
    }),
  aiFieldImpact: Joi.string()
    .valid(...aiFieldImpactOptions)
    .required()
    .messages({ "any.required": "AI field impact is required" }),
  aiFieldImpactOther: Joi.string()
    .trim()
    .when("aiFieldImpact", {
      is: OTHER,
      then: Joi.required().messages({
        "any.required": "Please specify how AI impacts your field",
      }),
      otherwise: Joi.optional().allow(null, ""),
    }),
  aiSkillBuilding: Joi.string()
    .valid(...aiSkillBuildingOptions)
    .required()
    .messages({ "any.required": "AI skill building is required" }),
  aiSkillBuildingOther: Joi.string()
    .trim()
    .when("aiSkillBuilding", {
      is: OTHER,
      then: Joi.required().messages({
        "any.required": "Please specify the AI skill you've built",
      }),
      otherwise: Joi.optional().allow(null, ""),
    }),
  aiEverydayUse: Joi.string()
    .valid(...aiEverydayUseOptions)
    .required()
    .messages({ "any.required": "AI everyday use is required" }),
  aiEverydayUseOther: Joi.string()
    .trim()
    .when("aiEverydayUse", {
      is: OTHER,
      then: Joi.required().messages({
        "any.required": "Please specify your everyday AI use",
      }),
      otherwise: Joi.optional().allow(null, ""),
    }),
  aiCuriosity: Joi.string()
    .valid(...aiCuriosityOptions)
    .required()
    .messages({ "any.required": "AI curiosity is required" }),
  aiCuriosityOther: Joi.string()
    .trim()
    .when("aiCuriosity", {
      is: OTHER,
      then: Joi.required().messages({
        "any.required": "Please specify your AI curiosity",
      }),
      otherwise: Joi.optional().allow(null, ""),
    }),
  personalNote: Joi.string().trim().max(600).optional().allow(null, ""),
};

const createSchema = Joi.object(baseProfileFields);
const updateSchema = Joi.object(baseProfileFields).fork(
  Object.keys(baseProfileFields),
  (schema) => schema.optional(),
);

export const validateCreateCounsellingProfile = (data: unknown) =>
  createSchema.validate(data, { abortEarly: false });

export const validateUpdateCounsellingProfile = (data: unknown) =>
  updateSchema.validate(data, { abortEarly: false });

export {
  careerFieldOptions,
  futureGoalOptions,
  careerPriorityOptions,
  studyStreamOptions,
  planningChallengeOptions,
  aiUnderstandingOptions,
  aiFieldImpactOptions,
  aiSkillBuildingOptions,
  freeTimeOptions,
  socialSettingOptions,
  workEnvironmentOptions,
  stressHandlingOptions,
  proudMomentOptions,
  aiEverydayUseOptions,
  aiCuriosityOptions,
  OTHER,
};
