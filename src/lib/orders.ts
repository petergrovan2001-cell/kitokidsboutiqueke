import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { orders, orderItems } from '../../db/schema.js'
import { isStkConfigured, normalizePhone, stkPush } from './mpesa.js'
import { refreshPendingPayment } from './mpesa-orders.js'

export const MPESA_NUMBER = '0143279060'

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'kito2024'

export const createOrder = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      customerName: string
      phone: string
      address: string
      items: Array<{ productId: number; name: string; price: number; quantity: number }>
    }) => data,
  )
  .handler(async ({ data }) => {
    if (!data.items.length) {
      throw new Error('Cart is empty')
    }
    const total = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const [order] = await db
      .insert(orders)
      .values({
        customerName: data.customerName,
        phone: data.phone,
        address: data.address,
        total,
        status: 'pending_payment',
      })
      .returning()

    await db.insert(orderItems).values(
      data.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    )

    return order
  })

type OrderRow = typeof orders.$inferSelect

// Daraja request IDs stay server-side; they are what callbacks are matched against.
function publicOrder({ checkoutRequestId, merchantRequestId, ...order }: OrderRow) {
  return order
}

export const getOrder = createServerFn({ method: 'GET' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    const [order] = await db.select().from(orders).where(eq(orders.id, id))
    if (!order) return null
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))
    return { order: publicOrder(order), items, stkEnabled: isStkConfigured() }
  })

export const requestStkPush = createServerFn({ method: 'POST' })
  .inputValidator((data: { orderId: number; phone: string }) => data)
  .handler(async ({ data }) => {
    if (!isStkConfigured()) {
      throw new Error('M-Pesa STK Push is not set up yet')
    }
    const phone = normalizePhone(data.phone)
    if (!phone) {
      throw new Error('Enter a valid Safaricom number, e.g. 0712 345 678')
    }
    const [order] = await db.select().from(orders).where(eq(orders.id, data.orderId))
    if (!order) throw new Error('Order not found')
    if (order.paymentStatus === 'paid') return publicOrder(order)

    const lastRequest = order.paymentRequestedAt?.getTime() ?? 0
    if (order.paymentStatus === 'pending' && Date.now() - lastRequest < 30_000) {
      throw new Error('A payment prompt was just sent. Check your phone or wait a moment to retry.')
    }

    const { getRequest } = await import('@tanstack/react-start/server')
    const origin = new URL(getRequest().url).origin
    const result = await stkPush({
      phone,
      amount: order.total,
      accountReference: `KITO${order.id}`,
      description: `Order ${order.id}`,
      callbackUrl: `${origin}/api/mpesa/callback`,
    })

    if (!result.ok) {
      const [failed] = await db
        .update(orders)
        .set({ paymentStatus: 'failed', paymentMessage: result.message })
        .where(eq(orders.id, order.id))
        .returning()
      return publicOrder(failed)
    }

    const [updated] = await db
      .update(orders)
      .set({
        paymentStatus: 'pending',
        paymentMessage: result.customerMessage,
        mpesaPhone: phone,
        checkoutRequestId: result.checkoutRequestId,
        merchantRequestId: result.merchantRequestId,
        paymentRequestedAt: new Date(),
      })
      .where(eq(orders.id, order.id))
      .returning()
    return publicOrder(updated)
  })

export const getPaymentStatus = createServerFn({ method: 'POST' })
  .inputValidator((orderId: number) => orderId)
  .handler(async ({ data: orderId }) => {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId))
    if (!order) throw new Error('Order not found')
    return publicOrder(await refreshPendingPayment(order))
  })

export const submitMpesaCode = createServerFn({ method: 'POST' })
  .inputValidator((data: { orderId: number; mpesaCode: string }) => data)
  .handler(async ({ data }) => {
    const [order] = await db
      .update(orders)
      .set({ mpesaCode: data.mpesaCode.trim().toUpperCase(), status: 'pending_confirmation' })
      .where(eq(orders.id, data.orderId))
      .returning()
    return publicOrder(order)
  })

export const getOrders = createServerFn({ method: 'POST' })
  .inputValidator((passcode: string) => passcode)
  .handler(async ({ data: passcode }) => {
    if (passcode !== ADMIN_PASSCODE) {
      throw new Error('Invalid admin passcode')
    }
    return db.select().from(orders).orderBy(orders.id)
  })

export const updateOrderStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: { passcode: string; id: number; status: string }) => data)
  .handler(async ({ data }) => {
    if (data.passcode !== ADMIN_PASSCODE) {
      throw new Error('Invalid admin passcode')
    }
    const [order] = await db
      .update(orders)
      .set({ status: data.status })
      .where(eq(orders.id, data.id))
      .returning()
    return order
  })
