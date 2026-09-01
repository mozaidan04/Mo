import { redirect } from "next/navigation";

/** رابط مختصر لكل فتوى: /f/1001 يحوّل إلى /fatwas/1001 */
export async function GET(_request: Request, ctx: RouteContext<"/f/[number]">) {
  const { number } = await ctx.params;
  redirect(`/fatwas/${encodeURIComponent(number)}`);
}
