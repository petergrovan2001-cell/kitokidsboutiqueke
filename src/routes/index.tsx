import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getProducts } from '@/lib/products'
import { ProductCard } from '@/components/ProductCard'

export const Route = createFileRoute('/')({
  component: ProductsIndex,
  loader: async () => getProducts(),
})

function ProductsIndex() {
  const products = Route.useLoaderData()
  const [category, setCategory] = useState('All')

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  )

  const filtered = useMemo(
    () => (category === 'All' ? products : products.filter((p) => p.category === category)),
    [products, category],
  )

  return (
    <div>
      <section className="bg-gradient-to-br from-pink-500 via-pink-400 to-yellow-300 text-white">
        <div className="max-w-7xl mx-auto px-5 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Kito Kids Boutique
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-pink-50">
            Adorable clothing, shoes & essentials for babies and children.
            Shop online and pay easily with M-Pesa.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 py-10">
        <div className="flex gap-3 overflow-x-auto pb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-5 py-2 rounded-full font-semibold whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-pink-600 text-white'
                  : 'bg-white text-pink-600 border border-pink-200 hover:bg-pink-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <p className="text-lg font-semibold">No products yet.</p>
            <p className="mt-2">
              Visit the{' '}
              <a href="/admin" className="text-pink-600 underline">
                Admin
              </a>{' '}
              page to add your first product.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
