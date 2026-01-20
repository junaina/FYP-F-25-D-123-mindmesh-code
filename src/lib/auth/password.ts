import bcrypt from "bcryptjs";
const COST = Number(process.env.BCRYPT_COST ?? 12);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, COST);
}
export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
