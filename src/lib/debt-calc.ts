/**
 * Calculate remaining interest via month-by-month amortization simulation.
 * annualRateDecimal: DB-native decimal (e.g. 0.0238 for 2.38%).
 * Falls back to simple formula when rate is 0.
 */
export function calcRemainingInterest(
  remainingBalance: number,
  annualRateDecimal: number,
  monthlyPayment: number,
  remainingTerms: number
): number {
  if (annualRateDecimal <= 0) {
    return Math.max(0, monthlyPayment * remainingTerms - remainingBalance);
  }
  const monthlyRate = annualRateDecimal / 12;
  let totalInterest = 0;
  let balance = remainingBalance;
  for (let i = 0; i < remainingTerms && balance > 0.01; i++) {
    const interest = balance * monthlyRate;
    // Clamp principal ≥ 0: if payment doesn't cover interest, balance doesn't decrease.
    const principal = Math.min(Math.max(0, monthlyPayment - interest), balance);
    totalInterest += interest;
    balance -= principal;
  }
  return Math.max(0, totalInterest);
}

/**
 * Calculate how many payments have been made since the loan start date,
 * based on a fixed day-of-month payment schedule.
 *
 * For each calendar month from startDate to today, we check whether the
 * payment date (year, month, paymentDay) falls within [startDate, today].
 * Interest is not re-amortised — this is a simplified linear model suitable
 * for personal tracking.
 */
export function calcPaymentsMade(
  startDate: Date,
  paymentDay: number,
  today: Date
): number {
  let count = 0;
  let year = startDate.getFullYear();
  let month = startDate.getMonth();

  while (
    year < today.getFullYear() ||
    (year === today.getFullYear() && month <= today.getMonth())
  ) {
    // Clamp paymentDay to the last day of the month (e.g. Feb 30 → Feb 28/29)
    const lastDay = new Date(year, month + 1, 0).getDate();
    const day = Math.min(paymentDay, lastDay);
    const payDate = new Date(year, month, day);

    if (payDate >= startDate && payDate <= today) {
      count++;
    }

    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return count;
}

export interface AutoCalcResult {
  remainingBalance: number;
  remainingTerms: number;
  paymentsMade: number;
  nextPaymentDate: Date;
}

/**
 * Given a debt record with paymentDay and startDate set, derive the
 * current remaining balance and terms automatically.
 * Returns null when the required fields are missing.
 */
export function autoCalcDebt(debt: {
  principalTotal: number;
  monthlyPayment: number;
  paymentDay: number | null;
  startDate: string | null;
  totalTerms?: number;
}): AutoCalcResult | null {
  if (!debt.paymentDay || !debt.startDate) return null;

  const today = new Date();
  const startDate = new Date(debt.startDate);
  if (isNaN(startDate.getTime())) return null;

  const rawPaymentsMade = calcPaymentsMade(startDate, debt.paymentDay, today);
  // Clamp paymentsMade to totalTerms so we don't show "已繳 40 / 36 期"
  // and so remainingBalance math doesn't drift past zero.
  const paymentsMade =
    debt.totalTerms && debt.totalTerms > 0
      ? Math.min(rawPaymentsMade, debt.totalTerms)
      : rawPaymentsMade;
  const remainingTerms =
    debt.totalTerms && debt.totalTerms > 0
      ? Math.max(0, debt.totalTerms - paymentsMade)
      : debt.monthlyPayment > 0
        ? Math.ceil(Math.max(0, debt.principalTotal - paymentsMade * debt.monthlyPayment) / debt.monthlyPayment)
        : 0;
  const remainingBalance = Math.max(0, debt.principalTotal - paymentsMade * debt.monthlyPayment);

  // Next payment date
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const lastDay = new Date(todayYear, todayMonth + 1, 0).getDate();
  const dayThisMonth = Math.min(debt.paymentDay, lastDay);
  const thisMonthPayDate = new Date(todayYear, todayMonth, dayThisMonth);
  let nextPaymentDate: Date;
  if (thisMonthPayDate >= today) {
    nextPaymentDate = thisMonthPayDate;
  } else {
    const nm = todayMonth + 1;
    const ny = nm > 11 ? todayYear + 1 : todayYear;
    const nMonth = nm > 11 ? 0 : nm;
    const nLastDay = new Date(ny, nMonth + 1, 0).getDate();
    nextPaymentDate = new Date(ny, nMonth, Math.min(debt.paymentDay, nLastDay));
  }

  return { remainingBalance, remainingTerms, paymentsMade, nextPaymentDate };
}
