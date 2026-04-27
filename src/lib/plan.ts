/**
 * Shared plan resolution logic.
 * Effective plan = max(paid plan, trial, level reward)
 */

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, ultima: 2 };

export type PlanTier = "free" | "pro" | "ultima";

export interface PlanFields {
  plan?: string | null;
  trial_expires_at?: string | null;
  reward_plan?: string | null;
  reward_expires_at?: string | null;
}

export function getEffectivePlan(user: PlanFields): PlanTier {
  const now = new Date();
  const base = (user.plan ?? "free") as PlanTier;

  // Trial / gift Pro (streak reward, June 1 gift, etc.)
  const trialActive = user.trial_expires_at
    ? new Date(user.trial_expires_at) > now
    : false;

  // Level reward (temporary Pro or Ultima)
  const rewardActive = user.reward_expires_at
    ? new Date(user.reward_expires_at) > now
    : false;
  const rewardPlan = rewardActive ? (user.reward_plan as PlanTier | null) : null;

  const candidates: PlanTier[] = [
    base,
    trialActive ? "pro" : null,
    rewardPlan,
  ].filter((p): p is PlanTier => !!p);

  return candidates.sort(
    (a, b) => (PLAN_RANK[b] ?? 0) - (PLAN_RANK[a] ?? 0)
  )[0] ?? "free";
}

export function isPro(user: PlanFields): boolean {
  const p = getEffectivePlan(user);
  return p === "pro" || p === "ultima";
}

export function isUltima(user: PlanFields): boolean {
  return getEffectivePlan(user) === "ultima";
}

/** Level reward table */
export const LEVEL_REWARDS: Record<string, { plan: PlanTier; days: number }> = {
  "Исследователь": { plan: "pro",    days: 7  },
  "Знаток":        { plan: "pro",    days: 14 },
  "Историк":       { plan: "ultima", days: 3  },
  "Эксперт":       { plan: "ultima", days: 7  },
};

/**
 * Compute new reward_plan / reward_expires_at when user earns a level reward.
 * Stacks correctly: higher tier takes priority, same tier extends.
 */
export function computeNewReward(
  reward: { plan: PlanTier; days: number },
  current: { reward_plan?: string | null; reward_expires_at?: string | null }
): { reward_plan: string; reward_expires_at: string } {
  const now = new Date();
  const currentActive =
    current.reward_expires_at &&
    new Date(current.reward_expires_at) > now;
  const currentRank = currentActive
    ? (PLAN_RANK[current.reward_plan ?? "free"] ?? 0)
    : -1;
  const newRank = PLAN_RANK[reward.plan] ?? 0;

  // If current reward is strictly higher tier and still active → just extend it
  if (currentActive && currentRank > newRank) {
    const base = new Date(current.reward_expires_at!);
    base.setDate(base.getDate() + reward.days);
    return {
      reward_plan: current.reward_plan!,
      reward_expires_at: base.toISOString(),
    };
  }

  // New reward is same or higher tier → use new tier, extend from current expiry or now
  const base =
    currentActive && currentRank === newRank
      ? new Date(current.reward_expires_at!)
      : now;
  const expiry = new Date(base.getTime() + reward.days * 86_400_000);
  return {
    reward_plan: reward.plan,
    reward_expires_at: expiry.toISOString(),
  };
}
