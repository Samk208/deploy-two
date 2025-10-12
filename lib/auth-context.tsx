'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { User, UserRole } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientSupabaseClient()
  const router = useRouter()

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      // Use proper type inference with query
      const query = supabase
        .from('profiles')
        .select('id, name, role, avatar, verified, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle()
      
      const { data, error } = await query

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      if (!data) {
        return null
      }

      return {
        id: (data as any).id,
        name: (data as any).name,
        role: (data as any).role as UserRole,
        avatar: (data as any).avatar,
        verified: (data as any).verified,
        createdAt: (data as any).created_at,
        updatedAt: (data as any).updated_at,
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      return null
    }
  }

  const refreshUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const userProfile = await fetchUserProfile(authUser.id)
        setUser(userProfile)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  useEffect(() => {
    // Initial user fetch
    refreshUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userProfile = await fetchUserProfile(session.user.id)
        setUser(userProfile)
        setLoading(false)
        router.refresh()
        return
      }

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
        router.refresh()
        return
      }

      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await refreshUser()
        router.refresh()
        return
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Alias for consistency with server-side getUserWithRoles
export const useUser = useAuth

// Mock data for development
const mockUsers = {
  'supplier@onelink.com': {
    id: '1',
    email: 'supplier@onelink.com',
    name: 'Jane Doe',
    role: UserRole.SUPPLIER,
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  'influencer@onelink.com': {
    id: '2',
    email: 'influencer@onelink.com',
    name: 'John Smith',
    role: UserRole.INFLUENCER,
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  'customer@onelink.com': {
    id: '3',
    email: 'customer@onelink.com',
    name: 'Alice Johnson',
    role: UserRole.CUSTOMER,
    verified: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  'admin@onelink.com': {
    id: '4',
    email: 'admin@onelink.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
}
