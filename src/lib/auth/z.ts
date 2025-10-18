import { z } from "zod";

export const SignupZ = z.object({
  firstName: z.string().min(1, "first name required"),
  lastName: z.string().min(1, "last name required"),
  email: z.string().email(),
  password: z.string().min(8, "password too short"),
});

export type SignupInput = z.infer<typeof SignupZ>;

export const LoginZ = z.object({
  email: z.string().email(),
  password: z.string().min(8, "password too short"),
});
export type LoginInput = z.infer<typeof LoginZ>;
