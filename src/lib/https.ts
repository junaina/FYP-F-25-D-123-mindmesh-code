export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
export const jsonOk = (data: unknown) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
export const jsonErr = (e: unknown) => {
  if (e instanceof HttpError) {
    return new Response(
      JSON.stringify({
        error: { code: e.code, message: e.message, details: e.details },
      }),
      { status: e.status, headers: { "Content-Type": "application/json" } }
    );
  }
  console.error(e);
  return new Response(
    JSON.stringify({
      error: { code: "INTERNAL", message: "Unexpected error" },
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
};
