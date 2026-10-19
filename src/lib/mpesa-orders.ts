// Server-only: applies M-Pesa STK results to orders. Shared by server functions and the callback function.
import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { orders } from '../../db/schema.js'
import { friendlyResult, stkQuery, type StkCallback } from './mpesa.js'

type Order = typeof orders.$inferSelect

// Daraja is given some time to deliver its callback before we start querying it ourselves.
const QUERY_AFTER_MS = 15_000

async function markPaid(order: Order, receipt: string | undefined, phone: string | undefined) {
  if (order.paymentStatus === 'paid') return order
  const advance = order.status === 'pending_payment' || order.status === 'pending_confirmation'
  const [updated] = await db
    .update(orders)
    .set({
      paymentStatus: 'paid',
      paymentMessage: 'Payment received',
      mpesaCode: receipt ?? order.mpesaCode,
      mpesaPhone: phone ?? order.mpesaPhone,
      paidAt: new Date(),
      ...(advance ? { status: 'confirmed' } : {}),
    })
    .where(eq(orders.id, order.id))
    .returning()
  return updated
}

async function markFailed(order: Order, message: string) {
  if (order.paymentStatus === 'paid') return order
  const [updated] = await db
    .update(orders)
    .set({ paymentStatus: 'failed', paymentMessage: message })
    .where(eq(orders.id, order.id))
    .returning()
  return updated
}

export async function applyStkCallback(cb: StkCallback) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.checkoutRequestId, cb.checkoutRequestId))
  if (!order) return { ok: false as const, reason: 'unknown checkout request' }

  if (cb.resultCode !== '0') {
    await markFailed(order, friendlyResult(cb.resultCode, cb.resultDesc))
    return { ok: true as const }
  }

  if (cb.amount !== undefined && cb.amount < order.total) {
    await markFailed(order, `Received ${cb.amount} but the order total is ${order.total}.`)
    return { ok: false as const, reason: 'amount mismatch' }
  }

  // Callbacks are unsigned, so double-check the result with Safaricom before marking the order paid.
  try {
    const check = await stkQuery(cb.checkoutRequestId)
    if (check.state === 'failed') {
      await markFailed(order, check.message)
      return { ok: false as const, reason: 'query disagrees with callback' }
    }
  } catch (err) {
    console.warn('STK query during callback verification failed', err)
  }

  await markPaid(order, cb.receipt, cb.phone)
  return { ok: true as const }
}

/** Asks Daraja for the latest result when an order's STK prompt is still pending. */
export async function refreshPendingPayment(order: Order) {
  if (order.paymentStatus !== 'pending' || !order.checkoutRequestId) return order
  const requestedAt = order.paymentRequestedAt?.getTime() ?? 0
  if (Date.now() - requestedAt < QUERY_AFTER_MS) return order

  try {
    const result = await stkQuery(order.checkoutRequestId)
    if (result.state === 'success') return markPaid(order, undefined, undefined)
    if (result.state === 'failed') return markFailed(order, result.message)
  } catch (err) {
    console.warn('STK status query failed', err)
  }

  // Safaricom expires STK prompts after about a minute; stop waiting well after that.
  if (Date.now() - requestedAt > 3 * 60_000) {
    return markFailed(order, 'We did not get a response from M-Pesa. Please try again.')
  }
  return order
}
