import { Link } from '@tanstack/react-router'
import { formatKES } from '@/lib/format'

export interface ProductCardData {
  id: number
  name: string
  slug: string
  image: string
  price: number
  category: string
  shortDescription: string
  stock: number
}

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      to="/products/$productSlug"
      params={{ productSlug: product.slug }}
      className="group flex flex-col rounded-2xl overflow-hidden bg-white border border-pink-100 shadow-sm hover:shadow-lg transition-shadow"
    >
      <div className="aspect-square w-full overflow-hidden bg-pink-50">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <span className="text-xs uppercase tracking-wide text-pink-500 font-semibold">
          {product.category}
        </span>
        <h3 className="font-bold text-gray-900 leading-snug">{product.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 flex-1">
          {product.shortDescription}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-lg font-extrabold text-pink-600">
            {formatKES(product.price)}
          </span>
          {product.stock <= 0 && (
            <span className="text-xs font-semibold text-red-500">Out of stock</span>
          )}
        </div>
      </div>
    </Link>
  )
}
