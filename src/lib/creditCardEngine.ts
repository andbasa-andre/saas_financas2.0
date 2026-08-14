import { 
  CreditCard, CreditCardInvoice, CreditCardPurchase, CreditCardPayment, InvoiceStatus 
} from '@/types/finance';

/**
 * Determina o mês, ano, data de fechamento e data de vencimento da fatura correspondente a uma compra.
 * Regra: Se dia da compra <= dia de fechamento, entra na fatura do mês atual.
 * Se dia da compra > dia de fechamento, entra na fatura do próximo mês.
 */
export function getInvoicePeriodForPurchase(
  purchaseDateStr: string,
  closingDay: number,
  dueDay: number
): { month: number; year: number; closingDate: string; dueDate: string; periodStart: string; periodEnd: string } {
  const purchaseDate = new Date(purchaseDateStr + 'T00:00:00');
  let year = purchaseDate.getFullYear();
  let month = purchaseDate.getMonth() + 1; // 1-12
  const day = purchaseDate.getDate();

  if (day > closingDay) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  // Data de fechamento
  const maxDaysClosing = new Date(year, month, 0).getDate();
  const actualClosingDay = Math.min(closingDay, maxDaysClosing);
  const closingDate = `${year}-${String(month).padStart(2, '0')}-${String(actualClosingDay).padStart(2, '0')}`;

  // Data de vencimento (se dueDay < closingDay, vence no mês seguinte ao fechamento)
  let dueMonth = month;
  let dueYear = year;
  if (dueDay <= closingDay) {
    dueMonth += 1;
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear += 1;
    }
  }
  const maxDaysDue = new Date(dueYear, dueMonth, 0).getDate();
  const actualDueDay = Math.min(dueDay, maxDaysDue);
  const dueDate = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(actualDueDay).padStart(2, '0')}`;

  // Período da fatura
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }
  const periodStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(closingDay + 1).padStart(2, '0')}`;
  const periodEnd = closingDate;

  return { month, year, closingDate, dueDate, periodStart, periodEnd };
}

/**
 * Gera as parcelas para uma compra parcelada (ex: 12x de R$ 300).
 */
export function generateInstallmentPurchases(
  card: CreditCard,
  description: string,
  totalAmount: number,
  totalInstallments: number,
  firstPurchaseDateStr: string,
  categoryId?: string,
  userId: string = 'user-id'
): Omit<CreditCardPurchase, 'id'>[] {
  const installmentAmount = Math.round((totalAmount / totalInstallments) * 100) / 100;
  const purchases: Omit<CreditCardPurchase, 'id'>[] = [];

  const baseDate = new Date(firstPurchaseDateStr + 'T00:00:00');

  for (let i = 1; i <= totalInstallments; i++) {
    const installmentDate = new Date(baseDate);
    installmentDate.setMonth(baseDate.getMonth() + (i - 1));
    const dateStr = installmentDate.toISOString().split('T')[0];

    purchases.push({
      user_id: userId,
      credit_card_id: card.id,
      category_id: categoryId,
      description: `${description} (${i}/${totalInstallments})`,
      total_amount: totalAmount,
      installment_number: i,
      total_installments: totalInstallments,
      installment_amount: installmentAmount,
      purchase_date: dateStr,
      created_at: new Date().toISOString()
    });
  }

  return purchases;
}

/**
 * Calcula o limite comprometido e limite disponível de um cartão de crédito.
 */
export function calculateCardLimits(
  card: CreditCard,
  purchases: CreditCardPurchase[],
  payments: CreditCardPayment[]
): { totalLimit: number; committedLimit: number; availableLimit: number; totalUnpaidInvoices: number } {
  const totalLimit = Number(card.limit_amount) || 0;

  // Soma de todas as parcelas/compras realizadas no cartão
  const totalPurchases = purchases.reduce((acc, p) => acc + (Number(p.installment_amount) || 0), 0);

  // Soma de todos os pagamentos efetuados nas faturas do cartão
  const totalPayments = payments.reduce((acc, pay) => acc + (Number(pay.amount) || 0), 0);

  // Limite comprometido = Compras pendentes de quitação
  const committedLimit = Math.max(0, Math.round((totalPurchases - totalPayments) * 100) / 100);
  const availableLimit = Math.max(0, Math.round((totalLimit - committedLimit) * 100) / 100);

  return {
    totalLimit,
    committedLimit,
    availableLimit,
    totalUnpaidInvoices: committedLimit
  };
}

/**
 * Atualiza o status de uma fatura com base no valor pago e data de vencimento.
 */
export function determineInvoiceStatus(
  totalAmount: number,
  paidAmount: number,
  dueDateStr: string,
  todayStr: string = new Date().toISOString().split('T')[0]
): InvoiceStatus {
  if (paidAmount >= totalAmount && totalAmount > 0) {
    return 'paid';
  }
  if (paidAmount > 0 && paidAmount < totalAmount) {
    return 'partially_paid';
  }
  if (todayStr > dueDateStr && paidAmount < totalAmount) {
    return 'overdue';
  }
  return 'open';
}
