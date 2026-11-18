import Joi from "joi";

export const validateInitIntroVideo = (data: unknown) =>
  Joi.object({
    title: Joi.string().trim().min(1).max(200).required(),
  }).validate(data, { abortEarly: false, stripUnknown: true });

export const validateCompleteIntroVideo = (data: unknown) =>
  Joi.object({
    videoGuid: Joi.string().trim().min(1).required(),
    title: Joi.string().trim().min(1).max(200).required(),
    fileSize: Joi.number().integer().min(0).required(),
  }).validate(data, { abortEarly: false, stripUnknown: true });
