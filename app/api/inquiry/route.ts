import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type InquiryPayload = Record<string, string | string[]>;

function firstMatch(payload: InquiryPayload, patterns: string[]) {
  for (const [key, value] of Object.entries(payload)) {
    const normalized = key.toLowerCase();
    if (patterns.some((pattern) => normalized.includes(pattern))) {
      return Array.isArray(value) ? value.join(", ") : value;
    }
  }

  return "";
}

export async function POST(request: Request) {
  const body = await request.json();
  const pageSlug = String(body.pageSlug || "home");
  const payload = (body.payload || {}) as InquiryPayload;

  const name =
    firstMatch(payload, ["имя", "name"]) ||
    `Lead from ${pageSlug}`;
  const contact =
    firstMatch(payload, ["тел", "phone", "telegram", "whatsapp", "контакт", "связ"]) ||
    "not-provided";

  if (process.env.DATABASE_URL) {
    try {
      await prisma.inquiry.create({
        data: {
          pageSlug,
          pageKind: "mirrored",
          name,
          contact,
          message: JSON.stringify(payload),
        },
      });
    } catch {
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
