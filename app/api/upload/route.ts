import { put } from "@vercel/blob";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: { code: "file_required", message: "file required" } }, { status: 400 });
  }
  const blob = await put(`proofs/${Date.now()}-${file.name}`, file, { access: "public" });
  return Response.json({ url: blob.url, pathname: blob.pathname });
}
