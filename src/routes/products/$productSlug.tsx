import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { getProduct } from '@/lib/products'
import { formatKES } from '@/lib/format'
import { AddToCartButton } from '@/components/AddToCartButton'

export const Route = createFileRoute('/products/$productSlug')({
  component: ProductDetail,
  loader: async ({ params }) => {
    const product = await getProduct({ data: params.productSlug })
    if (!product) {
      throw notFound()
    }
    return product
  },
})

function ProductDetail() {
  const product = Route.useLoaderData()

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10 p-5 py-10">
      <div className="w-full md:w-1/2">
        <div className="aspect-square w-full rounded-2xl overflow-hidden bg-pink-50">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="w-full md:w-1/2">
        <Link to="/" className="inline-block mb-4 text-pink-600 hover:underline">
          &larr; Back to all products
        </Link>
        <span className="text-xs uppercase tracking-wide text-pink-500 font-semibold">
          {product.category}
        </span>
        <h1 className="text-3xl font-extrabold mb-3 mt-1">{product.name}</h1>
        <p className="mb-6 text-gray-600 leading-relaxed">{product.description}</p>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="text-3xl font-extrabold text-pink-600">
            {formatKES(product.price)}
          </div>
          <AddToCartButton product={product} />
        </div>
        <p className="text-sm text-gray-500">
          {product.stock > 0 ? `${product.stock} in stock` : 'Currently out of stock'}
        </p>
      </div>
    </div>
  )
}
