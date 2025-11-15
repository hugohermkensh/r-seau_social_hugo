// Authentication utilities with secure password hashing
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const isAdmin = (userId: string): boolean => {
  const users = JSON.parse(localStorage.getItem('reseau_potes_users') || '[]');
  const user = users.find((u: any) => u.id === userId);
  return user?.role === 'admin';
};
