import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { Header } from '@/components/Header'

import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Kito Kids Boutique — Fashion & Essentials for Little Ones',
      },
      {
        name: 'description',
        content:
          'Kito Kids Boutique — quality clothing, shoes and essentials for babies and children. Shop online and pay via M-Pesa.',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-pink-50 text-gray-900 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="bg-pink-900 text-pink-100 py-8 mt-16">
          <div className="max-w-7xl mx-auto px-5 text-center text-sm">
            <p className="font-semibold text-white mb-1">Kito Kids Boutique</p>
            <p>Quality fashion & essentials for babies and children in Kenya.</p>
            <p className="mt-2">
              Pay via M-Pesa &middot; &copy; {new Date().getFullYear()} Kito Kids Boutique
            </p>
          </div>
        </footer>
        <Scripts />
      </body>
    </html>
  )
}
