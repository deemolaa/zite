import { NextResponse } from "next/server";

const RELAYER_BASE = "https://relayer.testnet.zama.org/v1";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(_req: Request, ctx: RouteContext) {
  const { path } = await ctx.params;
  const url = `${RELAYER_BASE}/${path.join("/")}`;

  const r = await fetch(url, { method: "GET" });

  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: {
      "Content-Type": r.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function POST(req: Request, ctx: RouteContext) {
  const { path } = await ctx.params;
  const url = `${RELAYER_BASE}/${path.join("/")}`;
  const body = await req.text();

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": req.headers.get("content-type") ?? "application/json",
    },
    body,
  });

  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: {
      "Content-Type": r.headers.get("content-type") ?? "application/json",
    },
  });
}
