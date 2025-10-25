// Temporary placeholder - will regenerate from database
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      translations: {
        Row: {
          key_hash: string
          source_lang: string
          target_lang: string
          namespace: string | null
          source_text: string
          translated_text: string
          hits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          key_hash: string
          source_lang: string
          target_lang: string
          namespace?: string | null
          source_text: string
          translated_text: string
          hits?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          key_hash?: string
          source_lang?: string
          target_lang?: string
          namespace?: string | null
          source_text?: string
          translated_text?: string
          hits?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
