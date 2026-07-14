import Joi from "joi";

const selectCourseSchema = Joi.object({
  courseId: Joi.string().trim().required().messages({
    "string.empty": "courseId is required",
    "any.required": "courseId is required",
  }),
});

export const validateSelectCourse = (data: unknown) =>
  selectCourseSchema.validate(data, { abortEarly: false });
