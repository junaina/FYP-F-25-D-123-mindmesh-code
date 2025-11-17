import type { Socket } from "net";

declare module "net" {
  interface Socket {
    server: any & {
      io?: any;
    };
  }
}
