import { useEffect, useState } from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { BadgeCheck, CheckCircle2, ChevronDown, Loader2, Smartphone, XCircle } from 'lucide-react'
import {
  getOrder,
  getPaymentStatus,
  requestStkPush,
  submitMpesaCode,
  MPESA_NUMBER,
} from '@/lib/orders'
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

type PublicOrder = Awaited<ReturnType<typeof getPaymentStatus>>

function OrderConfirmation() {
  const { order: initialOrder, items, stkEnabled } = Route.useLoaderData()
  const [order, setOrder] = useState<PublicOrder>(initialOrder)

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

      {order.paymentStatus === 'paid' ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 text-center">
          <BadgeCheck className="mx-auto text-green-600 mb-2" size={40} />
          <h2 className="font-bold text-green-800 text-lg">Payment received</h2>
          <p className="text-sm text-green-900 mt-1">
            {formatKES(order.total)} paid via M-Pesa
            {order.mpesaCode ? (
              <>
                {' '}&middot; Receipt <strong>{order.mpesaCode}</strong>
              </>
            ) : null}
            . We're preparing your order for delivery.
          </p>
        </div>
      ) : (
        <>
          {stkEnabled && <StkPushPanel order={order} onUpdate={setOrder} />}
          <ManualPayment
            order={order}
            collapsible={stkEnabled}
            onUpdate={setOrder}
          />
        </>
      )}

      <div className="text-center">
        <Link to="/" className="text-pink-600 font-semibold underline">
          Continue shopping
        </Link>
      </div>
    </div>
  )
}

const POLL_INTERVAL_MS = 4000

function StkPushPanel({
  order,
  onUpdate,
}: {
  order: PublicOrder
  onUpdate: (order: PublicOrder) => void
}) {
  const [phone, setPhone] = useState(order.mpesaPhone ? `0${order.mpesaPhone.slice(3)}` : order.phone)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const pending = order.paymentStatus === 'pending'

  useEffect(() => {
    if (!pending) return
    const timer = setInterval(async () => {
      try {
        onUpdate(await getPaymentStatus({ data: order.id }))
      } catch {
        // Keep polling; a transient error shouldn't end the wait.
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [pending, order.id, onUpdate])

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      onUpdate(await requestStkPush({ data: { orderId: order.id, phone } }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start M-Pesa payment')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Smartphone className="text-green-600" size={22} />
        <h2 className="font-bold text-green-800">Pay with M-Pesa</h2>
      </div>
      <p className="text-sm text-green-900 mb-4">
        We'll send a payment request of <strong>{formatKES(order.total)}</strong> straight to your
        phone. Just enter your M-Pesa PIN to complete the order.
      </p>

      {pending ? (
        <div className="flex items-start gap-3 bg-white border border-green-200 rounded-xl p-4">
          <Loader2 className="animate-spin text-green-600 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-semibold text-green-900">Check your phone</p>
            <p className="text-sm text-green-800">
              An M-Pesa prompt was sent to <strong>+{order.mpesaPhone}</strong>. Enter your PIN to
              pay. This page updates automatically once Safaricom confirms the payment.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handlePay} className="flex flex-col gap-3">
          {order.paymentStatus === 'failed' && order.paymentMessage && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              <XCircle size={18} className="shrink-0 mt-0.5" />
              <span>{order.paymentMessage} You can try again below.</span>
            </div>
          )}
          <label className="text-sm font-semibold text-green-900" htmlFor="stk-phone">
            M-Pesa phone number
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="stk-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0712 345 678"
              className="flex-1 border border-green-300 rounded-lg px-4 py-2 bg-white"
            />
            <button
              type="submit"
              disabled={sending || !phone.trim()}
              className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {sending && <Loader2 className="animate-spin" size={18} />}
              {sending
                ? 'Sending prompt...'
                : order.paymentStatus === 'failed'
                  ? 'Retry payment'
                  : `Pay ${formatKES(order.total)}`}
            </button>
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
        </form>
      )}
    </div>
  )
}

function ManualPayment({
  order,
  collapsible,
  onUpdate,
}: {
  order: PublicOrder
  collapsible: boolean
  onUpdate: (order: PublicOrder) => void
}) {
  const [open, setOpen] = useState(!collapsible)
  const [mpesaCode, setMpesaCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submitted = order.status !== 'pending_payment'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mpesaCode.trim()) return
    setSubmitting(true)
    try {
      onUpdate(await submitMpesaCode({ data: { orderId: order.id, mpesaCode } }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white border border-pink-100 rounded-2xl p-6 mb-6">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between font-semibold text-gray-700"
        >
          Prompt not arriving? Pay manually instead
          <ChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} size={18} />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <Smartphone className="text-green-600" size={22} />
          <h2 className="font-bold text-green-800">Pay via M-Pesa</h2>
        </div>
      )}

      {open && (
        <div className="mt-4">
          <ol className="list-decimal list-inside text-sm text-gray-700 flex flex-col gap-1 mb-4">
            <li>
              Go to <strong>M-Pesa</strong> on your phone and select <strong>Send Money</strong>.
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
              {order.mpesaCode ? ` (${order.mpesaCode})` : ''}. We'll confirm your payment and
              prepare your order for delivery shortly.
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
      )}
    </div>
  )
}
