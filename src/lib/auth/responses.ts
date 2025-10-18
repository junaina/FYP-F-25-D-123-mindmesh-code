import { NextResponse } from "next/server";

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}
export function ok<T>(data: T) {
  return NextResponse.json(data, { status: 200 });
}
export function badRequest(message = "bad_request", issues?: unknown) {
  return NextResponse.json({ error: message, issues }, { status: 400 });
}
export function conflict(message = "conflict") {
  return NextResponse.json({ error: message }, { status: 409 });
}
export function serverError(message = "server_error") {
  return NextResponse.json({ error: message }, { status: 500 });
}
