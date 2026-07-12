// Shared date-window helpers for period-based revenue/order analytics.
// Used by the admin dashboard and the agent detail activity panel so both
// stay consistent.

export const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Last week' },
  { key: 'month', label: 'Last month' },
  { key: 'year', label: 'Last year' },
  { key: 'custom', label: 'Custom date' },
];

export const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Resolve a selected period into a date window, a comparison window, and labels.
export function rangeFor(period, customDate) {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  switch (period) {
    case 'week':
      return {
        start: addDays(today, -6),
        end: tomorrow,
        prevStart: addDays(today, -13),
        prevEnd: addDays(today, -6),
        label: 'last week',
        compare: 'previous week',
      };
    case 'month':
      return {
        start: addDays(today, -29),
        end: tomorrow,
        prevStart: addDays(today, -59),
        prevEnd: addDays(today, -29),
        label: 'last month',
        compare: 'previous month',
      };
    case 'year':
      return {
        start: addDays(today, -364),
        end: tomorrow,
        prevStart: addDays(today, -729),
        prevEnd: addDays(today, -364),
        label: 'last year',
        compare: 'previous year',
      };
    case 'custom': {
      // A custom date spans from the chosen (past) date up to and including
      // today — not just that single day. Picking an older date automatically
      // widens the window back to it. The comparison window is the equally long
      // stretch immediately before it.
      const start = startOfDay(customDate);
      const end = tomorrow;
      const spanDays = Math.max(1, Math.round((end - start) / 86400000));
      return {
        start,
        end,
        prevStart: addDays(start, -spanDays),
        prevEnd: start,
        label: sameDay(start, today) ? 'today' : `since ${start.toLocaleDateString()}`,
        compare: 'previous period',
      };
    }
    case 'today':
    default:
      return {
        start: today,
        end: tomorrow,
        prevStart: addDays(today, -1),
        prevEnd: today,
        label: 'today',
        compare: 'yesterday',
      };
  }
}

const orderTime = (o) => new Date(o.placedAt || o.createdAt);

// Sum of delivered order totals within [start, end).
export function revenueIn(orders, start, end) {
  return orders.reduce((sum, o) => {
    if (o.status !== 'delivered') return sum;
    const t = orderTime(o);
    return t >= start && t < end ? sum + (o.total || 0) : sum;
  }, 0);
}

// Count of orders (any status) within [start, end).
export function countIn(orders, start, end) {
  return orders.filter((o) => {
    const t = orderTime(o);
    return t >= start && t < end;
  }).length;
}

// Count of delivered orders within [start, end).
export function deliveredIn(orders, start, end) {
  return orders.filter((o) => {
    if (o.status !== 'delivered') return false;
    const t = orderTime(o);
    return t >= start && t < end;
  }).length;
}

// Build the trailing-7-day buckets, accumulating either revenue (delivered
// totals) or order count per day.
export function buildLast7Days(orders, metric = 'revenue') {
  const today = startOfDay(new Date());
  const buckets = [];
  for (let i = 6; i >= 0; i--) {
    const start = addDays(today, -i);
    buckets.push({ start, end: addDays(start, 1), value: 0, dow: start.getDay() });
  }
  for (const o of orders) {
    const t = orderTime(o);
    const b = buckets.find((x) => t >= x.start && t < x.end);
    if (!b) continue;
    if (metric === 'count') {
      b.value += 1;
    } else if (o.status === 'delivered') {
      b.value += o.total || 0;
    }
  }
  return buckets;
}
