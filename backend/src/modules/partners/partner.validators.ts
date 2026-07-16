import Joi from "joi";

// Required fields differ per partner type — mirrors the `*` markers on the
// /partners apply form (Individual / Institute / Corporate tabs) so the API
// can't be used to bypass what the UI marks as mandatory.
const applySchema = Joi.object({
  type: Joi.string().valid("INDIVIDUAL", "INSTITUTE", "CORPORATE").required().messages({
    "any.required": "Partner type is required",
  }),

  // Institute name / Company name — required for Institute & Corporate, unused for Individual
  organizationName: Joi.string().trim().max(200).when("type", {
    is: Joi.valid("INSTITUTE", "CORPORATE"),
    then: Joi.required().messages({ "any.required": "Name is required" }),
    otherwise: Joi.optional().allow(""),
  }),

  // Full Name (Individual) / Contact Person (Institute, Corporate) — required for all three
  contactPerson: Joi.string().trim().max(150).required().messages({
    "any.required": "Contact person is required",
  }),

  // Required for Institute & Corporate, unused for Individual
  designation: Joi.string().trim().max(150).when("type", {
    is: Joi.valid("INSTITUTE", "CORPORATE"),
    then: Joi.required().messages({ "any.required": "Designation is required" }),
    otherwise: Joi.optional().allow(""),
  }),

  // Institute Type — required for Institute only
  instituteType: Joi.string().trim().max(100).when("type", {
    is: "INSTITUTE",
    then: Joi.required().messages({ "any.required": "Institute type is required" }),
    otherwise: Joi.optional().allow(""),
  }),

  phone: Joi.string().trim().required().messages({ "any.required": "Phone is required" }),
  email: Joi.string().trim().email().required().messages({ "any.required": "Email is required" }),

  // City/Location (Individual, Institute) — optional for all
  location: Joi.string().trim().max(150).optional().allow(""),

  // Current Role/Profession — required for Individual only
  profession: Joi.string().trim().max(100).when("type", {
    is: "INDIVIDUAL",
    then: Joi.required().messages({ "any.required": "Profession is required" }),
    otherwise: Joi.optional().allow(""),
  }),

  // LinkedIn (Individual) — optional
  linkedin: Joi.string().trim().max(300).optional().allow(""),

  // Company website (Corporate) — optional
  website: Joi.string().trim().max(300).optional().allow(""),
});

export const validateApplyPartner = (data: unknown) =>
  applySchema.validate(data, { abortEarly: false });
