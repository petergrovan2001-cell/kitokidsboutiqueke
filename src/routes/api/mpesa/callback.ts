import { createFileRoute } from '@tanstack/react-router'
import { parseCallback } from '@/lib/mpesa'
import { applyStkCallback } from '@/lib/mpesa-orders'

// Safaricom Daraja posts the STK Push result here once the buyer responds to the prompt.
export const Route = createFileRoute('/api/mpesa/callback')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = await request.json().catch(() => null)
        const callback = parseCallback(payload)
        if (callback) {
          try {
            const result = await applyStkCallback(callback)
            if (!result.ok) {
              console.warn('Rejected M-Pesa callback', callback.checkoutRequestId, result.reason)
            }
          } catch (err) {
            // The buyer's page polls Daraja directly, so the order still resolves if this fails.
            console.error('Failed to process M-Pesa callback', err)
          }
        }
        // Always acknowledge so Safaricom does not keep retrying.
        return Response.json({ ResultCode: 0, ResultDesc: 'Accepted' })
      },
    },
  },
})
