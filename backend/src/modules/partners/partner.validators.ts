import Joi from "joi";

// Required fields differ per partner type — mirrors the `*` markers on the
// /partners apply form (Individual / Institute / Corporate tabs) so the API
// can't be used to bypass what the UI marks as mandatory.
const applySchema = Joi.object({
  type: Joi.string()
    .valid("INDIVIDUAL", "INSTITUTE", "CORPORATE")
    .required()
    .messages({
      "any.required": "Partner type is required",
    }),

  // Institute name / Company name — required for Institute & Corporate, unused for Individual
  organizationName: Joi.string()
    .trim()
    .max(200)
    .when("type", {
      is: Joi.valid("INSTITUTE", "CORPORATE"),
      then: Joi.required().messages({ "any.required": "Name is required" }),
      otherwise: Joi.optional().allow(""),
    }),

  // Full Name (Individual) / Contact Person (Institute, Corporate) — required for all three
  contactPerson: Joi.string().trim().max(150).required().messages({
    "any.required": "Contact person is required",
  }),

  // Required for Institute & Corporate, unused for Individual
  designation: Joi.string()
    .trim()
    .max(150)
    .when("type", {
      is: Joi.valid("INSTITUTE", "CORPORATE"),
      then: Joi.required().messages({
        "any.required": "Designation is required",
      }),
      otherwise: Joi.optional().allow(""),
    }),

  // Institute Type — required for Institute only
  instituteType: Joi.string()
    .trim()
    .max(100)
    .when("type", {
      is: "INSTITUTE",
      then: Joi.required().messages({
        "any.required": "Institute type is required",
      }),
      otherwise: Joi.optional().allow(""),
    }),

  phone: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.empty": "Phone is required",
      "any.required": "Phone is required",
      "string.pattern.base": "Enter a valid 10-digit mobile number",
    }),
  email: Joi.string()
    .trim()
    .email()
    .required()
    .messages({ "any.required": "Email is required" }),

  // City/Location (Individual, Institute) — optional for all
  location: Joi.string().trim().max(150).optional().allow(""),

  // Current Role/Profession — required for Individual only
  profession: Joi.string()
    .trim()
    .max(100)
    .when("type", {
      is: "INDIVIDUAL",
      then: Joi.required().messages({
        "any.required": "Profession is required",
      }),
      otherwise: Joi.optional().allow(""),
    }),

  // LinkedIn (Individual) — optional
  linkedin: Joi.string().trim().max(300).optional().allow(""),

  // Company website (Corporate) — optional
  website: Joi.string().trim().max(300).optional().allow(""),

  // Why they want to partner — required for all three types, wording on
  // the form differs per type but the field itself is the same.
  purpose: Joi.string().trim().max(500).required().messages({
    "any.required": "Please tell us your purpose for partnering with us",
    "string.empty": "Please tell us your purpose for partnering with us",
  }),

  // KYC onboarding — required for Individual & Institute (drives admin
  // approve/reject), never collected for Corporate (no wallet/payout there).
  aadharNumber: Joi.string()
    .trim()
    .pattern(/^\d{12}$/)
    .when("type", {
      is: Joi.valid("INDIVIDUAL", "INSTITUTE"),
      then: Joi.required().messages({
        "any.required": "Aadhar number is required",
        "string.pattern.base": "Aadhar number must be 12 digits",
      }),
      otherwise: Joi.optional().allow(""),
    }),
  aadharFileUrl: Joi.string()
    .trim()
    .uri()
    .when("type", {
      is: Joi.valid("INDIVIDUAL", "INSTITUTE"),
      then: Joi.required().messages({
        "any.required": "Aadhar file is required",
      }),
      otherwise: Joi.optional().allow(""),
    }),

  panNumber: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
    .when("type", {
      is: Joi.valid("INDIVIDUAL", "INSTITUTE"),
      then: Joi.required().messages({
        "any.required": "PAN number is required",
        "string.pattern.base": "Enter a valid PAN number (e.g. ABCDE1234F)",
      }),
      otherwise: Joi.optional().allow(""),
    }),
  panFileUrl: Joi.string()
    .trim()
    .uri()
    .when("type", {
      is: Joi.valid("INDIVIDUAL", "INSTITUTE"),
      then: Joi.required().messages({ "any.required": "PAN file is required" }),
      otherwise: Joi.optional().allow(""),
    }),

  bankAccountNumber: Joi.string()
    .trim()
    .pattern(/^\d{9,18}$/)
    .when("type", {
      //account numbers can be 9-18 digits long
      is: Joi.valid("INDIVIDUAL", "INSTITUTE"),
      then: Joi.required().messages({
        "any.required": "Bank account number is required",
        "string.pattern.base": "Enter a valid bank account number",
      }),
      otherwise: Joi.optional().allow(""),
    }),
  bankIfsc: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .when("type", {
      //IFSC code is 11 characters long, first 4 are letters, 5th is 0, last 6 can be letters or digits
      is: Joi.valid("INDIVIDUAL", "INSTITUTE"),
      then: Joi.required().messages({
        "any.required": "IFSC code is required",
        "string.pattern.base": "Enter a valid IFSC code",
      }),
      otherwise: Joi.optional().allow(""),
    }),
  bankProofFileUrl: Joi.string()
    .trim()
    .uri()
    .when("type", {
      is: Joi.valid("INDIVIDUAL", "INSTITUTE"),
      then: Joi.required().messages({
        "any.required": "Passbook or cancelled cheque file is required",
      }),
      otherwise: Joi.optional().allow(""),
    }),
});

export const validateApplyPartner = (data: unknown) =>
  applySchema.validate(data, { abortEarly: false });
