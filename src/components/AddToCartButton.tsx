import { useState } from 'react'
import { useCart } from '@/lib/cart'

export function AddToCartButton({
  product,
  className = '',
}: {
  product: { id: number; name: string; price: number; image: string; stock: number }
  className?: string
}) {
  const addItem = useCart((s) => s.addItem)
  const [added, setAdded] = useState(false)

  const handleClick = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  if (product.stock <= 0) {
    return (
      <button
        disabled
        className={`px-6 py-2 rounded-full bg-gray-200 text-gray-500 font-semibold cursor-not-allowed ${className}`}
      >
        Out of stock
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`px-6 py-2 rounded-full font-semibold transition-colors ${
        added ? 'bg-green-500 text-white' : 'bg-pink-600 hover:bg-pink-700 text-white'
      } ${className}`}
    >
      {added ? 'Added ✓' : 'Add to Cart'}
    </button>
  )
}
