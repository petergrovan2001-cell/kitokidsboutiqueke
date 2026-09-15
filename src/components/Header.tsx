import { Link } from '@tanstack/react-router'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart'

export function Header() {
  const count = useCart((s) => s.count())

  return (
    <header className="sticky top-0 z-40 bg-pink-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🧸</span>
          <span className="text-xl font-extrabold tracking-tight">
            Kito Kids Boutique
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-yellow-200 transition-colors">
            Shop
          </Link>
          <Link to="/admin" className="hover:text-yellow-200 transition-colors">
            Admin
          </Link>
        </nav>

        <Link
          to="/cart"
          className="relative flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-colors rounded-full px-4 py-2"
        >
          <ShoppingBag size={20} />
          <span className="hidden sm:inline font-semibold">Cart</span>
          {count > 0 && (
            <span className="absolute -top-2 -right-2 bg-yellow-300 text-pink-800 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
