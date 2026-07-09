import { NextResponse } from "next/server";
import { createStruggle } from "@/lib/actions";

/**
 * POST /api/tickets — create a Struggle ticket (same path the Submit
 * Struggle form uses via server action). Body: JSON with title,
 * author_name, and optional description / lesson_id / author_email /
 * image_url. Locked down to authenticated users in the Sprint 7 lockdown.
 */
export async function POST(request: Request) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const formData = new FormData();
  for (const key of ["title", "description", "lesson_id", "author_name", "author_email", "image_url"]) {
    if (body[key]) formData.set(key, body[key]);
  }
  const result = await createStruggle(formData);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }
  return NextResponse.json(
    { message: result.message, ticket: result.data },
    { status: 201 },
  );
}
