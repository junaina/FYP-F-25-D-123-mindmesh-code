import type { SignupInput } from "@/lib/auth/z";
export type SignupDTO = SignupInput;

export type UserSafe = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
};

export type SignupResult = { user: UserSafe };
