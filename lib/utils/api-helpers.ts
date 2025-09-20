// API utility functions with retry mechanisms and error handling

interface RetryOptions {
  maxRetries?: number
  delay?: number
  backoff?: boolean
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = true } = retryOptions
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        )
      }

      const data = await response.json()
      
      if (!data.ok) {
        throw new ApiError(data.message || 'API request failed', 400, data)
      }

      return data.data || data
    } catch (error) {
      const isLastAttempt = attempt === maxRetries
      
      if (isLastAttempt || !shouldRetry(error)) {
        throw error
      }

      // Calculate delay with exponential backoff
      const currentDelay = backoff ? delay * Math.pow(2, attempt) : delay
      await new Promise(resolve => setTimeout(resolve, currentDelay))
    }
  }

  throw new Error('Max retries exceeded')
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function shouldRetry(error: any): boolean {
  // Retry on network errors or 5xx server errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true // Network error
  }
  
  if (error instanceof ApiError) {
    return error.status >= 500 || error.status === 429 // Server errors or rate limiting
  }
  
  return false
}

// Specific API functions for influencer shop
export const shopApi = {
  async getShopData(filters: Record<string, any>) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    return apiRequest(`/api/influencer/shop?${params}`, {
      method: 'GET'
    })
  },

  async addProduct(productId: string, customizations: any = {}) {
    return apiRequest('/api/influencer/shop', {
      method: 'POST',
      body: JSON.stringify({ productId, ...customizations })
    })
  },

  async updateProduct(shopProductId: string, updates: any) {
    return apiRequest(`/api/influencer/shop/${shopProductId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  },

  async removeProduct(shopProductId: string) {
    return apiRequest(`/api/influencer/shop/${shopProductId}`, {
      method: 'DELETE'
    })
  },

  async reorderProducts(productIds: string[]) {
    const updates = productIds.map((id, index) => ({
      id,
      order: index
    }))

    // Update products in parallel with error handling
    const results = await Promise.allSettled(
      updates.map(update => 
        this.updateProduct(update.id, { order: update.order })
      )
    )

    const failures = results
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => result.status === 'rejected')

    if (failures.length > 0) {
      console.error('Some reorder operations failed:', failures)
      throw new Error(`Failed to reorder ${failures.length} products`)
    }

    return results
  }
}
