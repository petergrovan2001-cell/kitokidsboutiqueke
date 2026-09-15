import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { orders, orderItems } from '../../db/schema.js'

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

export const getOrder = createServerFn({ method: 'GET' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    const [order] = await db.select().from(orders).where(eq(orders.id, id))
    if (!order) return null
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))
    return { order, items }
  })

export const submitMpesaCode = createServerFn({ method: 'POST' })
  .inputValidator((data: { orderId: number; mpesaCode: string }) => data)
  .handler(async ({ data }) => {
    const [order] = await db
      .update(orders)
      .set({ mpesaCode: data.mpesaCode, status: 'pending_confirmation' })
      .where(eq(orders.id, data.orderId))
      .returning()
    return order
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
