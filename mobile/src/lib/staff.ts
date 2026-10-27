// Copied from the website (src/lib/staff.ts) so both show the same numbers; change both together.
// Salary maths for farm workers. Pure functions (no I/O) so the rules are
// easy to test and to reuse in a mobile app.

export type AttendanceStatus = "present" | "absent" | "half_day" | "leave";

export function daysInMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function isMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export type Payroll = {
  present: number;
  absent: number;
  halfDays: number;
  leave: number;
  /** Salary withheld for absences (a half day counts half). */
  deduction: number;
  /** Salary owed for the month after deductions. */
  payable: number;
  /** Salary + advances already paid for the month. */
  paid: number;
  bonus: number;
  /** payable − paid; negative means paid ahead. */
  balance: number;
};

/**
 * Days without an attendance mark count as worked, so a farm that only notes
 * exceptions (absent / half day) still gets the right figure. Leave is paid.
 */
/**
 * Days of `month` the worker could have worked so far: from the 1st (or their
 * joining date) up to today (or the month's last day).
 */
export function workDaysSoFar(month: string, today: string, joinDate?: string | null) {
  const first = `${month}-01`;
  const last = `${month}-${String(daysInMonth(month)).padStart(2, "0")}`;
  const from = joinDate && joinDate > first ? joinDate : first;
  const to = today < last ? today : last;
  if (to < from) return 0;
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
}

export function payroll(
  monthlySalary: number,
  month: string,
  attendance: { status: AttendanceStatus }[],
  payments: { pay_type: "salary" | "advance" | "bonus"; amount: number }[],
  /** Days counted so far (see workDaysSoFar); unmarked days among them are present. */
  daysSoFar?: number,
): Payroll {
  const count = (s: AttendanceStatus) => attendance.filter((a) => a.status === s).length;
  const absent = count("absent");
  const halfDays = count("half_day");
  const perDay = monthlySalary / daysInMonth(month);
  const deduction = Math.round(perDay * (absent + halfDays * 0.5) * 100) / 100;
  const payable = Math.max(0, Math.round((monthlySalary - deduction) * 100) / 100);
  const paid = payments.filter((p) => p.pay_type !== "bonus").reduce((s, p) => s + Number(p.amount), 0);
  const bonus = payments.filter((p) => p.pay_type === "bonus").reduce((s, p) => s + Number(p.amount), 0);
  return {
    // Nobody marks "present": every day so far without a mark counts as present.
    present:
      daysSoFar === undefined
        ? count("present")
        : Math.max(0, daysSoFar - count("absent") - count("half_day") - count("leave")),
    absent,
    halfDays,
    leave: count("leave"),
    deduction,
    payable,
    paid,
    bonus,
    balance: Math.round((payable - paid) * 100) / 100,
  };
}
