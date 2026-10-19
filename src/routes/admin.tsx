import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
  verifyAdminPasscode,
} from '@/lib/products'
import { getOrders, updateOrderStatus } from '@/lib/orders'
import { formatKES } from '@/lib/format'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

type Product = Awaited<ReturnType<typeof getProducts>>[number]
type Order = Awaited<ReturnType<typeof getOrders>>[number]

const EMPTY_FORM = {
  name: '',
  category: '',
  price: '',
  stock: '',
  image: '',
  shortDescription: '',
  description: '',
  featured: false,
}

const ORDER_STATUSES = [
  'pending_payment',
  'pending_confirmation',
  'confirmed',
  'shipped',
  'delivered',
]

function AdminPage() {
  const [passcode, setPasscode] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')

  const [tab, setTab] = useState<'products' | 'orders'>('products')
  const [products, setProducts] = useState<Array<Product>>([])
  const [orders, setOrders] = useState<Array<Order>>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const loadProducts = async () => setProducts(await getProducts())
  const loadOrders = async () => setOrders(await getOrders({ data: passcode }))

  useEffect(() => {
    if (authed) {
      loadProducts()
      loadOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    const ok = await verifyAdminPasscode({ data: passcode })
    if (ok) {
      setAuthed(true)
    } else {
      setAuthError('Incorrect passcode')
    }
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        passcode,
        name: form.name,
        category: form.category,
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        image: form.image,
        shortDescription: form.shortDescription,
        description: form.description,
        featured: form.featured,
      }
      if (editingId) {
        await updateProduct({ data: { ...payload, id: editingId } })
      } else {
        await createProduct({ data: payload })
      }
      resetForm()
      await loadProducts()
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image,
      shortDescription: product.shortDescription,
      description: product.description,
      featured: product.featured,
    })
  }

  const handleDelete = async (id: number) => {
    await deleteProduct({ data: { passcode, id } })
    await loadProducts()
  }

  const handleStatusChange = async (id: number, status: string) => {
    await updateOrderStatus({ data: { passcode, id, status } })
    await loadOrders()
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto p-5 py-24">
        <h1 className="text-2xl font-extrabold mb-6 text-center">Admin Login</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Admin passcode"
            className="border border-pink-200 rounded-lg px-4 py-2"
          />
          {authError && <p className="text-red-500 text-sm">{authError}</p>}
          <button className="px-6 py-2 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold">
            Log in
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-5 py-10">
      <h1 className="text-3xl font-extrabold mb-8">Admin Dashboard</h1>

      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setTab('products')}
          className={`px-5 py-2 rounded-full font-semibold ${tab === 'products' ? 'bg-pink-600 text-white' : 'bg-white border border-pink-200'}`}
        >
          Products
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`px-5 py-2 rounded-full font-semibold ${tab === 'orders' ? 'bg-pink-600 text-white' : 'bg-white border border-pink-200'}`}
        >
          Orders
        </button>
      </div>

      {tab === 'products' && (
        <div className="grid md:grid-cols-2 gap-8">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 bg-white border border-pink-100 rounded-2xl p-6 h-fit"
          >
            <h2 className="font-bold text-lg flex items-center gap-2">
              {editingId ? (
                <>
                  <Pencil size={18} /> Edit Product
                </>
              ) : (
                <>
                  <Plus size={18} /> New Product
                </>
              )}
            </h2>
            <input
              required
              placeholder="Product name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-pink-200 rounded-lg px-4 py-2"
            />
            <input
              required
              placeholder="Category (e.g. Baby Girls, Shoes)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border border-pink-200 rounded-lg px-4 py-2"
            />
            <div className="flex gap-3">
              <input
                required
                type="number"
                placeholder="Price (KES)"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="border border-pink-200 rounded-lg px-4 py-2 w-1/2"
              />
              <input
                required
                type="number"
                placeholder="Stock"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="border border-pink-200 rounded-lg px-4 py-2 w-1/2"
              />
            </div>
            <input
              placeholder="Image URL"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              className="border border-pink-200 rounded-lg px-4 py-2"
            />
            <input
              placeholder="Short description"
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              className="border border-pink-200 rounded-lg px-4 py-2"
            />
            <textarea
              placeholder="Full description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border border-pink-200 rounded-lg px-4 py-2"
              rows={3}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              Featured product
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-2 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-full border border-pink-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="flex flex-col gap-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 bg-white border border-pink-100 rounded-xl p-3"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-14 h-14 object-cover rounded-lg bg-pink-50"
                />
                <div className="flex-1">
                  <p className="font-bold">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    {product.category} &middot; {formatKES(product.price)} &middot; Stock:{' '}
                    {product.stock}
                  </p>
                </div>
                <button
                  onClick={() => handleEdit(product)}
                  className="p-2 text-pink-600 hover:bg-pink-50 rounded-lg"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-gray-500 text-center py-10">No products yet.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-col md:flex-row md:items-center gap-3 bg-white border border-pink-100 rounded-xl p-4"
            >
              <div className="flex-1">
                <p className="font-bold">
                  Order #{order.id} &middot; {order.customerName}
                </p>
                <p className="text-sm text-gray-500">
                  {order.phone} &middot; {order.address}
                </p>
                {order.paymentStatus === 'paid' ? (
                  <p className="text-sm text-green-700 font-semibold">
                    Paid via STK Push{order.mpesaCode ? ` · Receipt ${order.mpesaCode}` : ''}
                    {order.mpesaPhone ? ` · +${order.mpesaPhone}` : ''}
                  </p>
                ) : (
                  <>
                    {order.mpesaCode && (
                      <p className="text-sm text-green-700">
                        M-Pesa code (manual, verify on statement): {order.mpesaCode}
                      </p>
                    )}
                    {order.paymentStatus === 'pending' && (
                      <p className="text-sm text-amber-600">Waiting for buyer to enter M-Pesa PIN</p>
                    )}
                    {order.paymentStatus === 'failed' && order.paymentMessage && (
                      <p className="text-sm text-red-600">STK failed: {order.paymentMessage}</p>
                    )}
                  </>
                )}
              </div>
              <div className="font-bold text-pink-600">{formatKES(order.total)}</div>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                className="border border-pink-200 rounded-lg px-3 py-2 text-sm"
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {orders.length === 0 && (
            <p className="text-gray-500 text-center py-10">No orders yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
