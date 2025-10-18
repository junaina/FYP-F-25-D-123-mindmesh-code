import { UserSafe } from "./signup.dto";
export type LoginInput = { email: string; password: string };
export type LoginResult = { user: UserSafe };
