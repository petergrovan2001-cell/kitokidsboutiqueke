import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { products } from '../../db/schema.js'

export const getProducts = createServerFn({ method: 'GET' }).handler(async () => {
  return db.select().from(products).orderBy(products.id)
})

export const getProduct = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const [product] = await db.select().from(products).where(eq(products.slug, slug))
    return product ?? null
  })

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'kito2024'

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export const createProduct = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      passcode: string
      name: string
      description: string
      shortDescription: string
      image: string
      category: string
      price: number
      stock: number
      featured: boolean
    }) => data,
  )
  .handler(async ({ data }) => {
    if (data.passcode !== ADMIN_PASSCODE) {
      throw new Error('Invalid admin passcode')
    }
    const slugBase = slugify(data.name)
    const slug = `${slugBase}-${Date.now().toString(36)}`
    const [product] = await db
      .insert(products)
      .values({
        name: data.name,
        slug,
        description: data.description,
        shortDescription: data.shortDescription,
        image: data.image || '/placeholder.png',
        category: data.category || 'Uncategorized',
        price: data.price,
        stock: data.stock,
        featured: data.featured,
      })
      .returning()
    return product
  })

export const updateProduct = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      passcode: string
      id: number
      name: string
      description: string
      shortDescription: string
      image: string
      category: string
      price: number
      stock: number
      featured: boolean
    }) => data,
  )
  .handler(async ({ data }) => {
    if (data.passcode !== ADMIN_PASSCODE) {
      throw new Error('Invalid admin passcode')
    }
    const [product] = await db
      .update(products)
      .set({
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription,
        image: data.image || '/placeholder.png',
        category: data.category || 'Uncategorized',
        price: data.price,
        stock: data.stock,
        featured: data.featured,
      })
      .where(eq(products.id, data.id))
      .returning()
    return product
  })

export const deleteProduct = createServerFn({ method: 'POST' })
  .inputValidator((data: { passcode: string; id: number }) => data)
  .handler(async ({ data }) => {
    if (data.passcode !== ADMIN_PASSCODE) {
      throw new Error('Invalid admin passcode')
    }
    await db.delete(products).where(eq(products.id, data.id))
    return { ok: true }
  })

export const verifyAdminPasscode = createServerFn({ method: 'POST' })
  .inputValidator((passcode: string) => passcode)
  .handler(async ({ data: passcode }) => passcode === ADMIN_PASSCODE)
