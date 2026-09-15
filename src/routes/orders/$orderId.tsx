import { useState } from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { CheckCircle2, Smartphone } from 'lucide-react'
import { getOrder, submitMpesaCode, MPESA_NUMBER } from '@/lib/orders'
import { formatKES } from '@/lib/format'

export const Route = createFileRoute('/orders/$orderId')({
  component: OrderConfirmation,
  loader: async ({ params }) => {
    const result = await getOrder({ data: Number(params.orderId) })
    if (!result) {
      throw notFound()
    }
    return result
  },
})

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Awaiting Payment',
  pending_confirmation: 'Pending Confirmation',
  confirmed: 'Payment Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
}

function OrderConfirmation() {
  const { order: initialOrder, items } = Route.useLoaderData()
  const [order, setOrder] = useState(initialOrder)
  const [mpesaCode, setMpesaCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(order.status !== 'pending_payment')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mpesaCode.trim()) return
    setSubmitting(true)
    try {
      const updated = await submitMpesaCode({ data: { orderId: order.id, mpesaCode } })
      setOrder(updated)
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-5 py-10">
      <div className="text-center mb-8">
        <CheckCircle2 className="mx-auto text-green-500 mb-3" size={56} />
        <h1 className="text-3xl font-extrabold mb-2">Order #{order.id} Placed!</h1>
        <p className="text-gray-600">
          Status:{' '}
          <span className="font-semibold text-pink-600">
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </p>
      </div>

      <div className="bg-white border border-pink-100 rounded-2xl p-6 mb-6">
        <h2 className="font-bold mb-4">Order Summary</h2>
        <div className="flex flex-col gap-2 mb-4">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.name} &times; {item.quantity}
              </span>
              <span className="font-semibold">{formatKES(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xl font-extrabold border-t border-pink-200 pt-4">
          <span>Total Due</span>
          <span className="text-pink-600">{formatKES(order.total)}</span>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="text-green-600" size={22} />
          <h2 className="font-bold text-green-800">Pay via M-Pesa</h2>
        </div>
        <ol className="list-decimal list-inside text-sm text-green-900 flex flex-col gap-1 mb-4">
          <li>
            Go to <strong>M-Pesa</strong> on your phone and select{' '}
            <strong>Send Money</strong>.
          </li>
          <li>
            Enter the number <strong className="text-lg">{MPESA_NUMBER}</strong>.
          </li>
          <li>
            Enter the amount <strong>{formatKES(order.total)}</strong> and confirm.
          </li>
          <li>Copy the M-Pesa confirmation code from the SMS you receive.</li>
          <li>Paste the code below so we can confirm your order.</li>
        </ol>

        {submitted ? (
          <p className="text-green-800 font-semibold">
            Thanks! We received your M-Pesa code
            {order.mpesaCode ? ` (${order.mpesaCode})` : ''}. We'll confirm your
            payment and prepare your order for delivery shortly.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              value={mpesaCode}
              onChange={(e) => setMpesaCode(e.target.value)}
              placeholder="e.g. QCD7X8YZ12"
              className="flex-1 border border-green-300 rounded-lg px-4 py-2"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Code'}
            </button>
          </form>
        )}
      </div>

      <div className="text-center">
        <Link to="/" className="text-pink-600 font-semibold underline">
          Continue shopping
        </Link>
      </div>
    </div>
  )
}
