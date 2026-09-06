import { rewritePath } from "fumadocs-core/negotiation";
import { type NextRequest, NextResponse } from "next/server";
import { docsContentRoute, docsRoute } from "@/lib/shared";

const { rewrite: rewriteSuffix } = rewritePath(
  `${docsRoute}{/*path}.mdx`,
  `${docsContentRoute}{/*path}/content.md`,
);

export default function proxy(request: NextRequest) {
  const destination = rewriteSuffix(request.nextUrl.pathname);
  return destination
    ? NextResponse.rewrite(new URL(destination, request.nextUrl))
    : NextResponse.next();
}

export const config = {
  matcher: ["/docs/:path*", "/docs.mdx"],
};
