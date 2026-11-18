import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from './ApiError.js';
import STATUS_CODES from './statusCodes.js';

// Configuration placeholder
// You can add your credentials here later
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


export const uploadToCloudinary = async (
    fileBuffer: Buffer,
    folder: string = 'ai-marketplace',
    resourceType: 'auto' | 'image' | 'raw' | 'video' = 'auto',
): Promise<{ url: string; public_id: string }> => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.warn('Cloudinary credentials missing in .env. Falling back to placeholder.');
            return {
                url: `https://res.cloudinary.com/dummy/image/upload/v12345/placeholder.png`,
                public_id: `dummy_${Date.now()}`
            };
        }

        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder, resource_type: resourceType },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        reject(new ApiError('File upload failed', STATUS_CODES.SERVER_ERROR));
                    } else {
                        resolve({
                            url: result?.secure_url ?? '',
                            public_id: result?.public_id ?? '',
                        });
                    }
                }
            ).end(fileBuffer);
        });
    } catch (error) {
        console.error('Cloudinary setup error:', error);
        throw new ApiError('Cloudinary service unavailable', STATUS_CODES.SERVER_ERROR);
    }
};

export const RESUME_FOLDER = 'resumes';
export const PROFILE_IMAGES_FOLDER = 'profile-images';
export const COURSE_IMAGES_FOLDER = 'course-images';
export const INVESTOR_DOCS_FOLDER = 'investor-documents';
export const COURSE_FILES_FOLDER = 'course-files';
export const D2H_INTERNSHIP_FOLDER = 'direct2hire-internships';
export const PARTNER_KYC_FOLDER = 'partner-kyc';

export const getCourseImageUploadSignature = () => {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = COURSE_IMAGES_FOLDER;
    const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        process.env.CLOUDINARY_API_SECRET!
    );
    return {
        timestamp,
        signature,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
        folder,
    };
};

export const getResumeUploadSignature = () => {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = RESUME_FOLDER;
    // Sign only the params that go in the form body (not file, cloud_name, resource_type, api_key)
    const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        process.env.CLOUDINARY_API_SECRET!
    );
    return {
        timestamp,
        signature,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
        folder,
    };
};

export const getInvestorDocUploadSignature = () => {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = INVESTOR_DOCS_FOLDER;
    // Signed for resource_type 'raw' (PDFs) — only params sent in the form body are signed
    const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        process.env.CLOUDINARY_API_SECRET!
    );
    return {
        timestamp,
        signature,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
        folder,
    };
};

export const getCourseFileUploadSignature = () => {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = COURSE_FILES_FOLDER;
    // Signed for resource_type 'auto' — Cloudinary picks image vs raw per file
    // (pdf/jpg/png as image, docx/zip/pptx as raw) — only form-body params are signed
    const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        process.env.CLOUDINARY_API_SECRET!
    );
    return {
        timestamp,
        signature,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
        folder,
    };
};

export const getD2HInternshipUploadSignature = () => {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = D2H_INTERNSHIP_FOLDER;
    const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        process.env.CLOUDINARY_API_SECRET!
    );
    return {
        timestamp,
        signature,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
        folder,
    };
};

export const getPartnerKycUploadSignature = () => {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = PARTNER_KYC_FOLDER;
    // Signed for resource_type 'auto' — Aadhar/PAN/bank proof come in as image or PDF scans
    const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        process.env.CLOUDINARY_API_SECRET!
    );
    return {
        timestamp,
        signature,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
        folder,
    };
};

export const deleteFromCloudinary = async (publicId: string, resourceType?: 'image' | 'raw' | 'video') => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.warn('Cloudinary credentials missing — skipping delete.');
            return;
        }
        if (resourceType) {
            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        } else {
            //delete 
            await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        }
    } catch (error) {
        console.error('Cloudinary delete error:', error);
    }
};

export default cloudinary;