export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          wallet_address: string
          twitter_handle: string
          circle_wallet_id: string
          created_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          twitter_handle?: string
          circle_wallet_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          twitter_handle?: string
          circle_wallet_id?: string
          created_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          intent: string | null
          role: string
          session_id: string
          status: string | null
          token_in: string | null
          token_out: string | null
          tx_hash: string | null
          tx_id: string | null
          wallet_address: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          intent?: string | null
          role: string
          session_id: string
          status?: string | null
          token_in?: string | null
          token_out?: string | null
          tx_hash?: string | null
          tx_id?: string | null
          wallet_address: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          intent?: string | null
          role?: string
          session_id?: string
          status?: string | null
          token_in?: string | null
          token_out?: string | null
          tx_hash?: string | null
          tx_id?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
      transaction_logs: {
        Row: {
          amount: string | null
          blockchain: string | null
          circle_wallet_id: string | null
          confirmed_at: string | null
          created_at: string
          id: string
          intent: string
          message: string | null
          status: string
          token_in: string | null
          token_out: string | null
          tx_hash: string | null
          tx_id: string | null
          wallet_address: string
          exact_principal?: number | null
        }
        Insert: {
          amount?: string | null
          blockchain?: string | null
          circle_wallet_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          intent: string
          message?: string | null
          status?: string
          token_in?: string | null
          token_out?: string | null
          tx_hash?: string | null
          tx_id?: string | null
          wallet_address: string
          exact_principal?: number | null
        }
        Update: {
          amount?: string | null
          blockchain?: string | null
          circle_wallet_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          intent?: string
          message?: string | null
          status?: string
          token_in?: string | null
          token_out?: string | null
          tx_hash?: string | null
          tx_id?: string | null
          wallet_address?: string
          exact_principal?: number | null
        }
        Relationships: []
      }
      credits_balances: {
        Row: {
          wallet_address: string
          balance: number
          updated_at: string
        }
        Insert: {
          wallet_address: string
          balance?: number
          updated_at?: string
        }
        Update: {
          wallet_address?: string
          balance?: number
          updated_at?: string
        }
        Relationships: []
      }
      credits_ledger: {
        Row: {
          id: string
          wallet_address: string
          type: string
          amount: number
          balance_after: number
          description: string | null
          tx_hash: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          type: string
          amount: number
          balance_after: number
          description?: string | null
          tx_hash?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          type?: string
          amount?: number
          balance_after?: number
          description?: string | null
          tx_hash?: string | null
          created_at?: string
        }
        Relationships: []
      }
      yield_positions: {
        Row: {
          id: string
          wallet_address: string
          protocol: string
          chain: string
          principal_amount: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          protocol: string
          chain: string
          principal_amount: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          protocol?: string
          chain?: string
          principal_amount?: number
          status?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits_atomic: {
        Args: {
          p_wallet: string
          p_amount: number
        }
        Returns: number
      }
      deduct_credits_atomic: {
        Args: {
          p_wallet: string
          p_cost: number
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
