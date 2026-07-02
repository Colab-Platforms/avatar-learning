import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { AdminCourseService, PublicCourseService } from "./course.service.js";
import { getCourseImageUploadSignature } from "@/utils/cloudinary.js";
import {
  getPaginationOptions,
  formatPaginationResponse,
} from "@/utils/paginationUtils.js";
import {
  validateCreateCategory,
  validateCreateCourse,
  validateUpdateCourse,
  validateCreateLesson,
  validateUpdateLesson,
} from "./course.validators.js";

const adminService = new AdminCourseService();
const publicService = new PublicCourseService();

const param = (req: Request, key: string): string => String(req.params[key]);

//ADMIN Endpoints
// Categories

export const createCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateCreateCategory(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const category = await adminService.createCategory(value);
    sendResponse(res, true, category, "Category created", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const getCategories = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const categories = await adminService.getCategories();
    sendResponse(res, true, categories, "Categories fetched");
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

//  Courses
export const adminGetAllCourses = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { page, pageSize, take, skip } = getPaginationOptions(req.query, 10);
    const { courses, totalRecords } = await adminService.getAllCourses(
      take,
      skip,
    );
    const response = formatPaginationResponse(
      courses,
      totalRecords,
      page,
      pageSize,
    );
    sendResponse(res, true, response, "Courses fetched");
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const adminGetCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const course = await adminService.getCourseById(param(req, "id"));
    sendResponse(res, true, course, "Course fetched");
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const createCourse = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateCreateCourse(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const course = await adminService.createCourse(value, req.user!.id);
    sendResponse(res, true, course, "Course created", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const updateCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateUpdateCourse(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const course = await adminService.updateCourse(param(req, "id"), value);
    sendResponse(res, true, course, "Course updated");
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const deleteCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await adminService.deleteCourse(param(req, "id"));
    sendResponse(res, true, null, "Course deleted");
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const togglePublish = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const course = await adminService.togglePublish(param(req, "id"));
    sendResponse(
      res,
      true,
      course,
      `Course ${course.isPublished ? "published" : "unpublished"}`,
    );
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

//  Lessons

export const createLesson = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateCreateLesson(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const lesson = await adminService.createLesson(
      param(req, "courseId"),
      value,
    );
    sendResponse(res, true, lesson, "Lesson created", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const updateLesson = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateUpdateLesson(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const lesson = await adminService.updateLesson(
      param(req, "lessonId"),
      value,
    );
    sendResponse(res, true, lesson, "Lesson updated");
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const deleteLesson = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await adminService.deleteLesson(param(req, "lessonId"));
    sendResponse(res, true, null, "Lesson deleted");
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

// ─── Admin – Video Upload (two-step direct upload) ───────────────────────────

// Step 1: create Bunny slot → return { videoGuid, uploadUrl, accessKey } to client
export const initVideoUpload = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { title } = req.body as { title?: string };
    if (!title?.trim()) {
      sendResponse(
        res,
        false,
        null,
        "title is required",
        STATUS_CODES.BAD_REQUEST,
      );
      return;
    }
    const result = await adminService.initVideoUpload(
      param(req, "lessonId"),
      title.trim(),
    );
    sendResponse(res, true, result, "Video slot created", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

// Step 2: client finished uploading → save Resource record in DB
export const completeVideoUpload = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { videoGuid, title, fileSize } = req.body as {
      videoGuid?: string;
      title?: string;
      fileSize?: number;
    };
    if (!videoGuid || !title) {
      sendResponse(
        res,
        false,
        null,
        "videoGuid and title are required",
        STATUS_CODES.BAD_REQUEST,
      );
      return;
    }
    const resource = await adminService.completeVideoUpload(
      param(req, "lessonId"),
      videoGuid,
      title,
      fileSize ?? 0,
    );
    sendResponse(res, true, resource, "Video saved", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const deleteResource = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await adminService.deleteResource(param(req, "resourceId"));
    sendResponse(res, true, null, "Resource deleted");
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const signCourseImageUpload = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const signData = getCourseImageUploadSignature();
    sendResponse(res, true, signData, "Upload signature generated", STATUS_CODES.OK);
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

// ─── Public Endpoints ─────────────────────────────────────────────────────────

export const getCourses = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { page, pageSize, take, skip } = getPaginationOptions(req.query, 12);
    const { courses, totalRecords } = await publicService.getCourses(
      take,
      skip,
    );
    const response = formatPaginationResponse(
      courses,
      totalRecords,
      page,
      pageSize,
    );
    // console.log("Courses response:", response);
    sendResponse(res, true, response, "Courses fetched");
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const getHeroCourses = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const courses = await publicService.getHeroCourses();

    sendResponse(res, true, courses, "Hero courses fetched");
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const getCourseBySlug = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const course = await publicService.getCourseBySlug(param(req, "slug"));
    sendResponse(res, true, course, "Course fetched");
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const enrollCourse = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const enrollment = await publicService.enrollUser(
      param(req, "courseId"),
      req.user!.id,
    );
    sendResponse(
      res,
      true,
      enrollment,
      "Enrolled successfully",
      STATUS_CODES.CREATED,
    );
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const unenrollCourse = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await publicService.unenrollUser(param(req, "courseId"), req.user!.id);
    sendResponse(res, true, null, "Unenrolled successfully");
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const getMyEnrollments = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { page, pageSize, take, skip } = getPaginationOptions(req.query, 12);
    const { enrollments, totalRecords } = await publicService.getMyEnrollments(
      req.user!.id,
      take,
      skip,
    );
    const response = formatPaginationResponse(
      enrollments,
      totalRecords,
      page,
      pageSize,
    );
    sendResponse(res, true, response, "Enrollments fetched");
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const getEnrolledCourseDetail = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const course = await publicService.getEnrolledCourseDetail(
      param(req, "courseId"),
      req.user!.id,
    );
    sendResponse(res, true, course, "Course fetched");
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const checkEnrollment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const result = await publicService.checkEnrollment(
      param(req, "courseId"),
      req.user!.id,
    );
    sendResponse(res, true, result, "Enrollment status fetched");
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const downloadResource = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { filename, contentType, contentLength, stream } =
      await publicService.streamResourceDownload(
        param(req, "resourceId"),
        req.user!.id,
      );

    const safeFilename = filename.replace(/["\r\n]/g, "");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename}"`,
    );
    res.setHeader("Content-Type", contentType);
    if (contentLength) res.setHeader("Content-Length", contentLength);

    stream.on("error", () => {
      if (!res.headersSent) {
        sendResponse(
          res,
          false,
          null,
          "Download failed",
          STATUS_CODES.SERVER_ERROR,
        );
      } else {
        res.end();
      }
    });

    stream.pipe(res);
  } catch (err: any) {
    if (!res.headersSent) {
      sendResponse(
        res,
        false,
        null,
        err.message,
        err.statusCode ?? STATUS_CODES.SERVER_ERROR,
      );
    }
  }
};
