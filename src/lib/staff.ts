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
export function payroll(
  monthlySalary: number,
  month: string,
  attendance: { status: AttendanceStatus }[],
  payments: { pay_type: "salary" | "advance" | "bonus"; amount: number }[],
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
    present: count("present"),
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
