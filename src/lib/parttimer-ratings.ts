import { supabase } from "@/integrations/supabase/client";

/** Fetch average rating and count for part-timer(s). Returns map of user_id -> { avg, count }. */
export async function fetchPartTimerRatings(
  partTimerIds: string[]
): Promise<Map<string, { avg: number; count: number }>> {
  const map = new Map<string, { avg: number; count: number }>();
  if (partTimerIds.length === 0) return map;

  const { data: ordersData } = await supabase
    .from("orders")
    .select("id, assigned_to")
    .in("assigned_to", partTimerIds);
  const orderIds = (ordersData || []).map((o) => o.id);
  if (orderIds.length === 0) return map;

  const { data: ratingsData } = await supabase
    .from("order_ratings")
    .select("order_id, rating")
    .in("order_id", orderIds)
    .not("rating", "is", null);

  const orderToAssignee = new Map((ordersData || []).map((o) => [o.id, o.assigned_to!]));
  const byAssignee = new Map<string, number[]>();
  for (const r of ratingsData || []) {
    const assignee = orderToAssignee.get(r.order_id);
    if (assignee && r.rating != null) {
      const arr = byAssignee.get(assignee) ?? [];
      arr.push(r.rating);
      byAssignee.set(assignee, arr);
    }
  }
  for (const [userId, ratings] of byAssignee) {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    map.set(userId, { avg: Math.round(avg * 10) / 10, count: ratings.length });
  }
  return map;
}
