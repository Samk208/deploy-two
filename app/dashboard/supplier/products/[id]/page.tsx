import { Suspense } from "react"
import { EditProductClient } from "./EditProductClient"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params
  
  // Mock product data - in real app, fetch from API based on id
  const mockProduct = {
    id: "1",
    title: "Sustainable Cotton Tee",
    description:
      "Made from 100% organic cotton, this comfortable tee is perfect for everyday wear. Features a relaxed fit and comes in multiple colors.",
    category: "Clothing",
    basePrice: 37.5, // Base price before commission
    commissionPct: 20,
    inventory: 15,
    regions: ["Global", "KR", "JP"],
    active: true,
    images: ["/cotton-tee.png", "/cotton-tee-back.png", "/cotton-tee-detail.png"],
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditProductClient product={mockProduct} />
    </Suspense>
  )
}
