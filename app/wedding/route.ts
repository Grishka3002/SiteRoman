import { readMirroredHtml } from "@/lib/mirror";

export async function GET() {
  const html = await readMirroredHtml("wedding.html");

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}
