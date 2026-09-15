import { Link, createFileRoute } from '@tanstack/react-router'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { formatKES } from '@/lib/format'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function CartPage() {
  const items = useCart((s) => s.items)
  const setQuantity = useCart((s) => s.setQuantity)
  const removeItem = useCart((s) => s.removeItem)
  const total = useCart((s) => s.total())

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-5 py-24 text-center">
        <p className="text-2xl font-bold mb-4">Your cart is empty</p>
        <Link to="/" className="text-pink-600 font-semibold underline">
          Continue shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-5 py-10">
      <h1 className="text-3xl font-extrabold mb-8">Your Cart</h1>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-4 bg-white rounded-2xl border border-pink-100 p-4"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-20 h-20 object-cover rounded-xl bg-pink-50"
            />
            <div className="flex-1">
              <p className="font-bold">{item.name}</p>
              <p className="text-pink-600 font-semibold">{formatKES(item.price)}</p>
            </div>
            <div className="flex items-center gap-2 border border-pink-200 rounded-full px-2 py-1">
              <button
                onClick={() => setQuantity(item.productId, item.quantity - 1)}
                className="p-1 hover:text-pink-600"
              >
                <Minus size={16} />
              </button>
              <span className="w-6 text-center font-semibold">{item.quantity}</span>
              <button
                onClick={() =>
                  setQuantity(item.productId, Math.min(item.quantity + 1, item.stock || 99))
                }
                className="p-1 hover:text-pink-600"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="w-24 text-right font-bold">
              {formatKES(item.price * item.quantity)}
            </div>
            <button
              onClick={() => removeItem(item.productId)}
              className="text-gray-400 hover:text-red-500 p-2"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-pink-50 rounded-2xl p-6 border border-pink-100">
        <div className="text-2xl font-extrabold">
          Total: <span className="text-pink-600">{formatKES(total)}</span>
        </div>
        <Link
          to="/checkout"
          className="w-full md:w-auto text-center px-8 py-3 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  )
}
