// Server-only helpers for the Safaricom Daraja M-Pesa Express (STK Push) API.
// Only import this from server function handlers or Netlify Functions.

const SANDBOX_SHORTCODE = '174379'
// Public passkey Safaricom publishes for the sandbox test shortcode 174379.
const SANDBOX_PASSKEY = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'

function config() {
  const env = process.env.MPESA_ENV === 'production' ? 'production' : 'sandbox'
  const isSandbox = env === 'sandbox'
  const shortcode = process.env.MPESA_SHORTCODE || (isSandbox ? SANDBOX_SHORTCODE : '')
  const transactionType =
    process.env.MPESA_TRANSACTION_TYPE === 'CustomerBuyGoodsOnline'
      ? 'CustomerBuyGoodsOnline'
      : 'CustomerPayBillOnline'
  return {
    env,
    baseUrl: isSandbox ? 'https://sandbox.safaricom.co.ke' : 'https://api.safaricom.co.ke',
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    shortcode,
    passkey: process.env.MPESA_PASSKEY || (isSandbox ? SANDBOX_PASSKEY : ''),
    transactionType,
    // For Buy Goods (till), PartyB is the till number while BusinessShortCode is the store number.
    partyB: process.env.MPESA_PARTY_B || shortcode,
    callbackUrl: process.env.MPESA_CALLBACK_URL || '',
  }
}

export function isStkConfigured() {
  const c = config()
  return Boolean(c.consumerKey && c.consumerSecret && c.shortcode && c.passkey)
}

/** Normalizes Kenyan numbers (07xx, 01xx, +2547xx, 2547xx) to 2547XXXXXXXX / 2541XXXXXXXX. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  let local: string
  if (digits.startsWith('254')) local = digits.slice(3)
  else if (digits.startsWith('0')) local = digits.slice(1)
  else local = digits
  if (!/^[17]\d{8}$/.test(local)) return null
  return `254${local}`
}

/** Daraja expects YYYYMMDDHHmmss in East Africa Time (UTC+3). */
function timestamp() {
  const eat = new Date(Date.now() + 3 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    eat.getUTCFullYear() +
    pad(eat.getUTCMonth() + 1) +
    pad(eat.getUTCDate()) +
    pad(eat.getUTCHours()) +
    pad(eat.getUTCMinutes()) +
    pad(eat.getUTCSeconds())
  )
}

function password(shortcode: string, passkey: string, ts: string) {
  return Buffer.from(`${shortcode}${passkey}${ts}`).toString('base64')
}

let cachedToken: { value: string; expiresAt: number } | null = null

async function accessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value
  const c = config()
  const auth = Buffer.from(`${c.consumerKey}:${c.consumerSecret}`).toString('base64')
  const res = await fetch(`${c.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  })
  if (!res.ok) {
    throw new Error(`M-Pesa authentication failed (${res.status})`)
  }
  const body = (await res.json()) as { access_token: string; expires_in: string }
  cachedToken = {
    value: body.access_token,
    // Refresh a minute early to avoid using a token right as it expires.
    expiresAt: Date.now() + (Number(body.expires_in) - 60) * 1000,
  }
  return cachedToken.value
}

async function darajaPost<T>(path: string, payload: unknown): Promise<T> {
  const c = config()
  const token = await accessToken()
  const res = await fetch(`${c.baseUrl}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = (await res.json().catch(() => ({}))) as T & { errorMessage?: string; errorCode?: string }
  if (!res.ok && !body.errorCode) {
    throw new Error(`M-Pesa request failed (${res.status})`)
  }
  return body
}

export type StkPushResult =
  | { ok: true; merchantRequestId: string; checkoutRequestId: string; customerMessage: string }
  | { ok: false; message: string }

export async function stkPush(opts: {
  phone: string
  amount: number
  accountReference: string
  description: string
  callbackUrl: string
}): Promise<StkPushResult> {
  const c = config()
  const ts = timestamp()
  const body = await darajaPost<{
    MerchantRequestID?: string
    CheckoutRequestID?: string
    ResponseCode?: string
    ResponseDescription?: string
    CustomerMessage?: string
    errorCode?: string
    errorMessage?: string
  }>('/mpesa/stkpush/v1/processrequest', {
    BusinessShortCode: c.shortcode,
    Password: password(c.shortcode, c.passkey, ts),
    Timestamp: ts,
    TransactionType: c.transactionType,
    Amount: Math.ceil(opts.amount),
    PartyA: opts.phone,
    PartyB: c.partyB,
    PhoneNumber: opts.phone,
    CallBackURL: c.callbackUrl || opts.callbackUrl,
    AccountReference: opts.accountReference.slice(0, 12),
    TransactionDesc: opts.description.slice(0, 13),
  })

  if (body.ResponseCode === '0' && body.CheckoutRequestID && body.MerchantRequestID) {
    return {
      ok: true,
      merchantRequestId: body.MerchantRequestID,
      checkoutRequestId: body.CheckoutRequestID,
      customerMessage: body.CustomerMessage || 'Check your phone to complete payment',
    }
  }
  return {
    ok: false,
    message: body.errorMessage || body.ResponseDescription || 'Could not start M-Pesa payment',
  }
}

export type StkQueryResult =
  | { state: 'pending' }
  | { state: 'success'; message: string }
  | { state: 'failed'; resultCode: string; message: string }

export async function stkQuery(checkoutRequestId: string): Promise<StkQueryResult> {
  const c = config()
  const ts = timestamp()
  const body = await darajaPost<{
    ResultCode?: string
    ResultDesc?: string
    errorCode?: string
    errorMessage?: string
  }>('/mpesa/stkpushquery/v1/query', {
    BusinessShortCode: c.shortcode,
    Password: password(c.shortcode, c.passkey, ts),
    Timestamp: ts,
    CheckoutRequestID: checkoutRequestId,
  })

  // Daraja answers with an error while the customer has not yet responded to the prompt.
  if (body.errorCode) return { state: 'pending' }
  if (body.ResultCode === undefined) return { state: 'pending' }
  if (String(body.ResultCode) === '0') {
    return { state: 'success', message: body.ResultDesc || 'Payment received' }
  }
  return {
    state: 'failed',
    resultCode: String(body.ResultCode),
    message: friendlyResult(String(body.ResultCode), body.ResultDesc),
  }
}

/** Maps common STK result codes to messages a shopper understands. */
export function friendlyResult(code: string, fallback?: string) {
  switch (code) {
    case '1032':
      return 'You cancelled the M-Pesa prompt.'
    case '1037':
      return 'The M-Pesa prompt timed out before you entered your PIN.'
    case '1':
      return 'Your M-Pesa balance is too low for this payment.'
    case '2001':
      return 'The M-Pesa PIN entered was incorrect.'
    case '1025':
    case '9999':
      return 'M-Pesa could not send the prompt to your phone. Please try again.'
    default:
      return fallback || 'The M-Pesa payment was not completed.'
  }
}

export type StkCallback = {
  merchantRequestId: string
  checkoutRequestId: string
  resultCode: string
  resultDesc: string
  amount?: number
  receipt?: string
  phone?: string
}

export function parseCallback(payload: unknown): StkCallback | null {
  const cb = (payload as { Body?: { stkCallback?: Record<string, unknown> } })?.Body?.stkCallback
  if (!cb || typeof cb.CheckoutRequestID !== 'string') return null
  const items =
    ((cb.CallbackMetadata as { Item?: Array<{ Name: string; Value?: unknown }> })?.Item) ?? []
  const value = (name: string) => items.find((i) => i.Name === name)?.Value
  return {
    merchantRequestId: String(cb.MerchantRequestID ?? ''),
    checkoutRequestId: cb.CheckoutRequestID,
    resultCode: String(cb.ResultCode),
    resultDesc: String(cb.ResultDesc ?? ''),
    amount: value('Amount') !== undefined ? Number(value('Amount')) : undefined,
    receipt: value('MpesaReceiptNumber') !== undefined ? String(value('MpesaReceiptNumber')) : undefined,
    phone: value('PhoneNumber') !== undefined ? String(value('PhoneNumber')) : undefined,
  }
}
