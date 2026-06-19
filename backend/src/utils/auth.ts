import bcrypt from 'bcrypt';

export const hashPassword = async (password: string): Promise<string> => {
    // Use cost directly instead of generating salt separately - saves ~50-100ms per operation
    return await bcrypt.hash(password, 8);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};