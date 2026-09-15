import { useState } from 'react'
import { useNavigate, createFileRoute } from '@tanstack/react-router'
import { useCart } from '@/lib/cart'
import { formatKES } from '@/lib/format'
import { createOrder } from '@/lib/orders'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
})

function CheckoutPage() {
  const items = useCart((s) => s.items)
  const total = useCart((s) => s.total())
  const clearCart = useCart((s) => s.clear)
  const navigate = useNavigate()

  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-5 py-24 text-center">
        <p className="text-2xl font-bold mb-4">Your cart is empty</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      setError('Please fill in all fields.')
      return
    }
    setSubmitting(true)
    try {
      const order = await createOrder({
        data: {
          customerName,
          phone,
          address,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        },
      })
      clearCart()
      navigate({ to: '/orders/$orderId', params: { orderId: order.id.toString() } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-5 py-10">
      <h1 className="text-3xl font-extrabold mb-8">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-semibold">Full Name</span>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="border border-pink-200 rounded-lg px-4 py-2"
              placeholder="Jane Wanjiru"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold">Phone Number</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border border-pink-200 rounded-lg px-4 py-2"
              placeholder="07XXXXXXXX"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold">Delivery Address</span>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="border border-pink-200 rounded-lg px-4 py-2"
              placeholder="Estate, street, town"
              rows={3}
            />
          </label>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 px-6 py-3 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold disabled:opacity-60"
          >
            {submitting ? 'Placing order...' : 'Place Order'}
          </button>
        </form>

        <div className="bg-pink-50 rounded-2xl p-6 border border-pink-100 h-fit">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>
          <div className="flex flex-col gap-2 mb-4">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span>
                  {item.name} &times; {item.quantity}
                </span>
                <span className="font-semibold">{formatKES(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xl font-extrabold border-t border-pink-200 pt-4">
            <span>Total</span>
            <span className="text-pink-600">{formatKES(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
