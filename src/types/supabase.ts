export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      modules: {
        Row: {
          id: string
          created_at?: string
          name: string
          description: string
          type: string
          type_module: string
          icon: string | null
          slug: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string
          type: string
          type_module: string
          icon?: string | null
          slug?: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string
          type?: string
          type_module?: string
          icon?: string | null
          slug?: string
        }
      }
      test_series: {
        Row: {
          id: string
          created_at?: string
          title: string
          description: string
          module_id: string
          is_free: boolean
          is_published: boolean
          slug: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description?: string
          module_id: string
          is_free?: boolean
          is_published?: boolean
          slug?: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          module_id?: string
          is_free?: boolean
          is_published?: boolean
          slug?: string
        }
      }
      questions: {
        Row: {
          id: string
          created_at?: string
          test_series_id: string
          question_text: string
          type: string
          order: number
          media_url?: string | null
          media_type?: string | null
          options?: Json | null
          answers?: Json | null
          pairs?: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          test_series_id: string
          question_text: string
          type: string
          order?: number
          media_url?: string | null
          media_type?: string | null
          options?: Json | null
          answers?: Json | null
          pairs?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          test_series_id?: string
          question_text?: string
          type?: string
          order?: number
          media_url?: string | null
          media_type?: string | null
          options?: Json | null
          answers?: Json | null
          pairs?: Json | null
        }
      }
      profiles: {
        Row: {
          id: string
          created_at?: string
          email: string
          full_name?: string
          role: string
          avatar_url?: string | null
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          full_name?: string
          role?: string
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          full_name?: string
          role?: string
          avatar_url?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
