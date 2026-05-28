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
      athlete_benchmark_summary: {
        Row: {
          benchmark_definition_id: string
          contact_id: string
          created_at: string
          current_pr_weight: number | null
          date_pr_achieved: string | null
          id: string
          updated_at: string
        }
        Insert: {
          benchmark_definition_id: string
          contact_id: string
          created_at?: string
          current_pr_weight?: number | null
          date_pr_achieved?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          benchmark_definition_id?: string
          contact_id?: string
          created_at?: string
          current_pr_weight?: number | null
          date_pr_achieved?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_benchmark_summary_benchmark_definition_id_fkey"
            columns: ["benchmark_definition_id"]
            isOneToOne: false
            referencedRelation: "benchmark_definition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_benchmark_summary_benchmark_definition_id_fkey"
            columns: ["benchmark_definition_id"]
            isOneToOne: false
            referencedRelation: "benchmark_definition_display"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_benchmark_summary_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_offering_subscription: {
        Row: {
          auto_renew: boolean
          claimed_from_track_link_id: string | null
          contact_id: string
          created_at: string
          currency: string
          end_date: string | null
          fitness_membership_id: string | null
          gym_id: string
          id: string
          membership_offering_id: string
          membership_offering_term_id: string
          sold_commitment_total_cents: number
          sold_price_cents: number
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          claimed_from_track_link_id?: string | null
          contact_id: string
          created_at?: string
          currency?: string
          end_date?: string | null
          fitness_membership_id?: string | null
          gym_id: string
          id?: string
          membership_offering_id: string
          membership_offering_term_id: string
          sold_commitment_total_cents: number
          sold_price_cents: number
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          claimed_from_track_link_id?: string | null
          contact_id?: string
          created_at?: string
          currency?: string
          end_date?: string | null
          fitness_membership_id?: string | null
          gym_id?: string
          id?: string
          membership_offering_id?: string
          membership_offering_term_id?: string
          sold_commitment_total_cents?: number
          sold_price_cents?: number
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_offering_subscription_claimed_from_track_link_id_fkey"
            columns: ["claimed_from_track_link_id"]
            isOneToOne: false
            referencedRelation: "fitness_track_link"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_offering_subscription_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_offering_subscription_fitness_membership_id_fkey"
            columns: ["fitness_membership_id"]
            isOneToOne: false
            referencedRelation: "fitness_membership"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_offering_subscription_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gym"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_offering_subscription_membership_offering_id_fkey"
            columns: ["membership_offering_id"]
            isOneToOne: false
            referencedRelation: "membership_offering"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_offering_subscription_membership_offering_term_id_fkey"
            columns: ["membership_offering_term_id"]
            isOneToOne: false
            referencedRelation: "membership_offering_term"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_segment_completion: {
        Row: {
          id: string
          contact_id: string
          programming_id: string | null
          segment_group_id: string | null
          performance_date: string
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          programming_id?: string | null
          segment_group_id?: string | null
          performance_date: string
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          programming_id?: string | null
          segment_group_id?: string | null
          performance_date?: string
          completed_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_segment_completion_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_segment_completion_programming_id_fkey"
            columns: ["programming_id"]
            isOneToOne: false
            referencedRelation: "programming"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_performance: {
        Row: {
          benchmark_definition_id: string | null
          benchmark_type_id: string | null
          contact_id: string
          created_at: string
          id: string
          is_pr: boolean
          performance_date: string | null
          prescribed_percentage: number | null
          programming_id: string | null
          programming_line_item_id: string | null
          segment_group_id: string | null
          reps_prescribed: number | null
          result_value: number | null
          rpe: number | null
          score: string | null
          score_meta: Json
          status: string | null
          updated_at: string
          weight_lifted: number | null
          workout_scale: Database["public"]["Enums"]["workout_scale"] | null
        }
        Insert: {
          benchmark_definition_id?: string | null
          benchmark_type_id?: string | null
          contact_id: string
          created_at?: string
          id?: string
          is_pr?: boolean
          performance_date?: string | null
          prescribed_percentage?: number | null
          programming_id?: string | null
          programming_line_item_id?: string | null
          segment_group_id?: string | null
          reps_prescribed?: number | null
          result_value?: number | null
          rpe?: number | null
          score?: string | null
          score_meta?: Json
          status?: string | null
          updated_at?: string
          weight_lifted?: number | null
          workout_scale?: Database["public"]["Enums"]["workout_scale"] | null
        }
        Update: {
          benchmark_definition_id?: string | null
          benchmark_type_id?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          is_pr?: boolean
          performance_date?: string | null
          prescribed_percentage?: number | null
          programming_id?: string | null
          programming_line_item_id?: string | null
          segment_group_id?: string | null
          reps_prescribed?: number | null
          result_value?: number | null
          rpe?: number | null
          score?: string | null
          score_meta?: Json
          status?: string | null
          updated_at?: string
          weight_lifted?: number | null
          workout_scale?: Database["public"]["Enums"]["workout_scale"] | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_performance_benchmark_definition_id_fkey"
            columns: ["benchmark_definition_id"]
            isOneToOne: false
            referencedRelation: "benchmark_definition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_performance_benchmark_definition_id_fkey"
            columns: ["benchmark_definition_id"]
            isOneToOne: false
            referencedRelation: "benchmark_definition_display"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_performance_benchmark_type_id_fkey"
            columns: ["benchmark_type_id"]
            isOneToOne: false
            referencedRelation: "benchmark_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_performance_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_performance_programming_id_fkey"
            columns: ["programming_id"]
            isOneToOne: false
            referencedRelation: "programming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_performance_programming_id_fkey"
            columns: ["programming_id"]
            isOneToOne: false
            referencedRelation: "programming_with_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_performance_programming_line_item_id_fkey"
            columns: ["programming_line_item_id"]
            isOneToOne: false
            referencedRelation: "programming_line_item"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_subscription: {
        Row: {
          access_level: string | null
          contact_id: string
          created_at: string
          end_date: string | null
          fitness_membership_id: string | null
          gym_id: string
          id: string
          program_library_id: string | null
          start_date: string | null
          status: string | null
          subscription_scope: string
          updated_at: string
        }
        Insert: {
          access_level?: string | null
          contact_id: string
          created_at?: string
          end_date?: string | null
          fitness_membership_id?: string | null
          gym_id: string
          id?: string
          program_library_id?: string | null
          start_date?: string | null
          status?: string | null
          subscription_scope?: string
          updated_at?: string
        }
        Update: {
          access_level?: string | null
          contact_id?: string
          created_at?: string
          end_date?: string | null
          fitness_membership_id?: string | null
          gym_id?: string
          id?: string
          program_library_id?: string | null
          start_date?: string | null
          status?: string | null
          subscription_scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_subscription_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_subscription_fitness_membership_id_fkey"
            columns: ["fitness_membership_id"]
            isOneToOne: false
            referencedRelation: "fitness_membership"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_subscription_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gym"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_subscription_program_library_id_fkey"
            columns: ["program_library_id"]
            isOneToOne: false
            referencedRelation: "program_library"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmark_definition: {
        Row: {
          benchmark_type_id: string
          created_at: string
          id: string
          rep_count: number
          updated_at: string
        }
        Insert: {
          benchmark_type_id: string
          created_at?: string
          id?: string
          rep_count: number
          updated_at?: string
        }
        Update: {
          benchmark_type_id?: string
          created_at?: string
          id?: string
          rep_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_definition_benchmark_type_id_fkey"
            columns: ["benchmark_type_id"]
            isOneToOne: false
            referencedRelation: "benchmark_type"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmark_type: {
        Row: {
          created_at: string
          id: string
          name: string
          purpose_variation: string | null
          stimulus: string | null
          sub_stimulus: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          purpose_variation?: string | null
          stimulus?: string | null
          sub_stimulus?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          purpose_variation?: string | null
          stimulus?: string | null
          sub_stimulus?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contact_gym_capability_grant: {
        Row: {
          athlete_offering_subscription_id: string | null
          capability_code: string
          contact_id: string
          created_at: string
          end_date: string | null
          fitness_membership_id: string | null
          gym_id: string
          id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          athlete_offering_subscription_id?: string | null
          capability_code: string
          contact_id: string
          created_at?: string
          end_date?: string | null
          fitness_membership_id?: string | null
          gym_id: string
          id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          athlete_offering_subscription_id?: string | null
          capability_code?: string
          contact_id?: string
          created_at?: string
          end_date?: string | null
          fitness_membership_id?: string | null
          gym_id?: string
          id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_gym_capability_grant_athlete_offering_subscription_fkey"
            columns: ["athlete_offering_subscription_id"]
            isOneToOne: false
            referencedRelation: "athlete_offering_subscription"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_gym_capability_grant_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_gym_capability_grant_fitness_membership_id_fkey"
            columns: ["fitness_membership_id"]
            isOneToOne: false
            referencedRelation: "fitness_membership"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_gym_capability_grant_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gym"
            referencedColumns: ["id"]
          },
        ]
      }
      fitness_membership: {
        Row: {
          contact_id: string
          created_at: string
          end_date: string | null
          gym_id: string
          id: string
          join_date: string | null
          membership_status: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          end_date?: string | null
          gym_id: string
          id?: string
          join_date?: string | null
          membership_status?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          end_date?: string | null
          gym_id?: string
          id?: string
          join_date?: string | null
          membership_status?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fitness_membership_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fitness_membership_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gym"
            referencedColumns: ["id"]
          },
        ]
      }
      fitness_track_link: {
        Row: {
          created_at: string
          created_by_contact_id: string | null
          expires_at: string | null
          gym_id: string
          id: string
          label: string | null
          max_redemptions: number | null
          redemption_count: number
          revoked_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_contact_id?: string | null
          expires_at?: string | null
          gym_id: string
          id?: string
          label?: string | null
          max_redemptions?: number | null
          redemption_count?: number
          revoked_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_contact_id?: string | null
          expires_at?: string | null
          gym_id?: string
          id?: string
          label?: string | null
          max_redemptions?: number | null
          redemption_count?: number
          revoked_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fitness_track_link_created_by_contact_id_fkey"
            columns: ["created_by_contact_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fitness_track_link_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gym"
            referencedColumns: ["id"]
          },
        ]
      }
      fitness_track_link_option: {
        Row: {
          created_at: string
          link_id: string
          membership_offering_term_id: string
        }
        Insert: {
          created_at?: string
          link_id: string
          membership_offering_term_id: string
        }
        Update: {
          created_at?: string
          link_id?: string
          membership_offering_term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fitness_track_link_option_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "fitness_track_link"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fitness_track_link_option_membership_offering_term_id_fkey"
            columns: ["membership_offering_term_id"]
            isOneToOne: false
            referencedRelation: "membership_offering_term"
            referencedColumns: ["id"]
          },
        ]
      }
      gym: {
        Row: {
          created_at: string
          id: string
          name: string
          subscription_plan: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gym_onboarding_request: {
        Row: {
          created_account_id: string | null
          created_at: string
          created_contact_id: string | null
          error_message: string | null
          gym_name: string | null
          gym_phone: string | null
          gym_website: string | null
          id: string
          owner_email: string | null
          owner_first_name: string | null
          owner_last_name: string | null
          owner_phone: string | null
          requested_tracks: string[] | null
          status: string | null
          subscription_plan: string | null
          updated_at: string
        }
        Insert: {
          created_account_id?: string | null
          created_at?: string
          created_contact_id?: string | null
          error_message?: string | null
          gym_name?: string | null
          gym_phone?: string | null
          gym_website?: string | null
          id?: string
          owner_email?: string | null
          owner_first_name?: string | null
          owner_last_name?: string | null
          owner_phone?: string | null
          requested_tracks?: string[] | null
          status?: string | null
          subscription_plan?: string | null
          updated_at?: string
        }
        Update: {
          created_account_id?: string | null
          created_at?: string
          created_contact_id?: string | null
          error_message?: string | null
          gym_name?: string | null
          gym_phone?: string | null
          gym_website?: string | null
          id?: string
          owner_email?: string | null
          owner_first_name?: string | null
          owner_last_name?: string | null
          owner_phone?: string | null
          requested_tracks?: string[] | null
          status?: string | null
          subscription_plan?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_onboarding_request_created_account_id_fkey"
            columns: ["created_account_id"]
            isOneToOne: false
            referencedRelation: "gym"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_onboarding_request_created_contact_id_fkey"
            columns: ["created_contact_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_offering: {
        Row: {
          created_at: string
          created_by_contact_id: string | null
          description: string | null
          gym_id: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_contact_id?: string | null
          description?: string | null
          gym_id: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_contact_id?: string | null
          description?: string | null
          gym_id?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_offering_created_by_contact_id_fkey"
            columns: ["created_by_contact_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_offering_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gym"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_offering_component: {
        Row: {
          capability_code: string | null
          component_type: string
          created_at: string
          id: string
          membership_offering_id: string
          program_library_id: string | null
        }
        Insert: {
          capability_code?: string | null
          component_type: string
          created_at?: string
          id?: string
          membership_offering_id: string
          program_library_id?: string | null
        }
        Update: {
          capability_code?: string | null
          component_type?: string
          created_at?: string
          id?: string
          membership_offering_id?: string
          program_library_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_offering_component_membership_offering_id_fkey"
            columns: ["membership_offering_id"]
            isOneToOne: false
            referencedRelation: "membership_offering"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_offering_component_program_library_id_fkey"
            columns: ["program_library_id"]
            isOneToOne: false
            referencedRelation: "program_library"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_offering_term: {
        Row: {
          billing_type: string
          created_at: string
          currency: string
          id: string
          is_active: boolean
          membership_offering_id: string
          price_cents: number
          term_months: number
          updated_at: string
        }
        Insert: {
          billing_type?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          membership_offering_id: string
          price_cents: number
          term_months: number
          updated_at?: string
        }
        Update: {
          billing_type?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          membership_offering_id?: string
          price_cents?: number
          term_months?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_offering_term_membership_offering_id_fkey"
            columns: ["membership_offering_id"]
            isOneToOne: false
            referencedRelation: "membership_offering"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          contact_id: string
          created_at: string
          display_name: string | null
          id: string
          last_active_gym_at: string | null
          last_active_gym_id: string | null
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          display_name?: string | null
          id: string
          last_active_gym_at?: string | null
          last_active_gym_id?: string | null
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          display_name?: string | null
          id?: string
          last_active_gym_at?: string | null
          last_active_gym_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_last_active_gym_id_fkey"
            columns: ["last_active_gym_id"]
            isOneToOne: false
            referencedRelation: "gym"
            referencedColumns: ["id"]
          },
        ]
      }
      program_library: {
        Row: {
          created_at: string
          description: string | null
          gym_id: string
          id: string
          is_active: boolean
          is_platform_template: boolean
          is_public: boolean
          name: string
          sport_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          gym_id: string
          id?: string
          is_active?: boolean
          is_platform_template?: boolean
          is_public?: boolean
          name: string
          sport_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          gym_id?: string
          id?: string
          is_active?: boolean
          is_platform_template?: boolean
          is_public?: boolean
          name?: string
          sport_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_library_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gym"
            referencedColumns: ["id"]
          },
        ]
      }
      programming: {
        Row: {
          athlete_notes: string | null
          coaches_notes: string | null
          created_at: string
          created_by_contact_id: string | null
          description: string | null
          display_order: number | null
          group_score_anchor: boolean
          gym_id: string | null
          id: string
          is_completed: boolean
          metcon_format: string | null
          name: string | null
          prescribed_scale: Database["public"]["Enums"]["workout_scale"]
          program_library_id: string | null
          programming_segment: string | null
          programming_subtype: string | null
          published_at: string | null
          segment_group_id: string | null
          source: string
          updated_at: string
          wod_date: string
          workout_scheme: Json
        }
        Insert: {
          athlete_notes?: string | null
          coaches_notes?: string | null
          created_at?: string
          created_by_contact_id?: string | null
          description?: string | null
          display_order?: number | null
          group_score_anchor?: boolean
          gym_id?: string | null
          id?: string
          is_completed?: boolean
          metcon_format?: string | null
          name?: string | null
          prescribed_scale?: Database["public"]["Enums"]["workout_scale"]
          program_library_id?: string | null
          programming_segment?: string | null
          programming_subtype?: string | null
          published_at?: string | null
          segment_group_id?: string | null
          source?: string
          updated_at?: string
          wod_date: string
          workout_scheme?: Json
        }
        Update: {
          athlete_notes?: string | null
          coaches_notes?: string | null
          created_at?: string
          created_by_contact_id?: string | null
          description?: string | null
          display_order?: number | null
          group_score_anchor?: boolean
          gym_id?: string | null
          id?: string
          is_completed?: boolean
          metcon_format?: string | null
          name?: string | null
          prescribed_scale?: Database["public"]["Enums"]["workout_scale"]
          program_library_id?: string | null
          programming_segment?: string | null
          programming_subtype?: string | null
          published_at?: string | null
          segment_group_id?: string | null
          source?: string
          updated_at?: string
          wod_date?: string
          workout_scheme?: Json
        }
        Relationships: [
          {
            foreignKeyName: "programming_created_by_contact_id_fkey"
            columns: ["created_by_contact_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programming_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gym"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programming_program_library_id_fkey"
            columns: ["program_library_id"]
            isOneToOne: false
            referencedRelation: "program_library"
            referencedColumns: ["id"]
          },
        ]
      }
      programming_library_assignment: {
        Row: {
          created_at: string
          program_library_id: string
          programming_id: string
        }
        Insert: {
          created_at?: string
          program_library_id: string
          programming_id: string
        }
        Update: {
          created_at?: string
          program_library_id?: string
          programming_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programming_library_assignment_program_library_id_fkey"
            columns: ["program_library_id"]
            isOneToOne: false
            referencedRelation: "program_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programming_library_assignment_programming_id_fkey"
            columns: ["programming_id"]
            isOneToOne: false
            referencedRelation: "programming"
            referencedColumns: ["id"]
          },
        ]
      }
      programming_intake_stage: {
        Row: {
          coach_contact_id: string
          committed_programming_id: string | null
          contains_errors: boolean
          correction_applied: boolean
          created_at: string
          gym_id: string
          id: string
          latency_ms: number | null
          parsed_payload: Json
          parser_mode: string
          program_library_id: string
          raw_text: string
          status: string
          token_count: number | null
          updated_at: string
          wod_date: string
        }
        Insert: {
          coach_contact_id: string
          committed_programming_id?: string | null
          contains_errors?: boolean
          correction_applied?: boolean
          created_at?: string
          gym_id: string
          id?: string
          latency_ms?: number | null
          parsed_payload?: Json
          parser_mode?: string
          program_library_id: string
          raw_text: string
          status?: string
          token_count?: number | null
          updated_at?: string
          wod_date: string
        }
        Update: {
          coach_contact_id?: string
          committed_programming_id?: string | null
          contains_errors?: boolean
          correction_applied?: boolean
          created_at?: string
          gym_id?: string
          id?: string
          latency_ms?: number | null
          parsed_payload?: Json
          parser_mode?: string
          program_library_id?: string
          raw_text?: string
          status?: string
          token_count?: number | null
          updated_at?: string
          wod_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "programming_intake_stage_coach_contact_id_fkey"
            columns: ["coach_contact_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programming_intake_stage_committed_programming_id_fkey"
            columns: ["committed_programming_id"]
            isOneToOne: false
            referencedRelation: "programming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programming_intake_stage_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gym"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programming_intake_stage_program_library_id_fkey"
            columns: ["program_library_id"]
            isOneToOne: false
            referencedRelation: "program_library"
            referencedColumns: ["id"]
          },
        ]
      }
      programming_line_item: {
        Row: {
          actual_weight_lifted: number | null
          athlete_current_pr: number | null
          benchmark_definition_id: string | null
          benchmark_type_id: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          id: string
          intensity_percentage: number | null
          line_item_kind: string
          movement_components: Json
          movement_label: string | null
          prescribed_percentage: number | null
          prescribed_score: string | null
          prescribed_weight: number | null
          prescription_unit: string | null
          programming_id: string
          reps_prescribed: number | null
          sequence_number: number | null
          status: string | null
          target_weight: number | null
          updated_at: string
        }
        Insert: {
          actual_weight_lifted?: number | null
          athlete_current_pr?: number | null
          benchmark_definition_id?: string | null
          benchmark_type_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          intensity_percentage?: number | null
          line_item_kind?: string
          movement_components?: Json
          movement_label?: string | null
          prescribed_percentage?: number | null
          prescribed_score?: string | null
          prescribed_weight?: number | null
          prescription_unit?: string | null
          programming_id: string
          reps_prescribed?: number | null
          sequence_number?: number | null
          status?: string | null
          target_weight?: number | null
          updated_at?: string
        }
        Update: {
          actual_weight_lifted?: number | null
          athlete_current_pr?: number | null
          benchmark_definition_id?: string | null
          benchmark_type_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          intensity_percentage?: number | null
          line_item_kind?: string
          movement_components?: Json
          movement_label?: string | null
          prescribed_percentage?: number | null
          prescribed_score?: string | null
          prescribed_weight?: number | null
          prescription_unit?: string | null
          programming_id?: string
          reps_prescribed?: number | null
          sequence_number?: number | null
          status?: string | null
          target_weight?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programming_line_item_benchmark_definition_id_fkey"
            columns: ["benchmark_definition_id"]
            isOneToOne: false
            referencedRelation: "benchmark_definition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programming_line_item_benchmark_definition_id_fkey"
            columns: ["benchmark_definition_id"]
            isOneToOne: false
            referencedRelation: "benchmark_definition_display"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programming_line_item_benchmark_type_id_fkey"
            columns: ["benchmark_type_id"]
            isOneToOne: false
            referencedRelation: "benchmark_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programming_line_item_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programming_line_item_programming_id_fkey"
            columns: ["programming_id"]
            isOneToOne: false
            referencedRelation: "programming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programming_line_item_programming_id_fkey"
            columns: ["programming_id"]
            isOneToOne: false
            referencedRelation: "programming_with_counts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      benchmark_definition_display: {
        Row: {
          benchmark_name: string | null
          benchmark_type_id: string | null
          benchmark_type_name: string | null
          created_at: string | null
          id: string | null
          rep_count: number | null
          stimulus: string | null
          sub_stimulus: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_definition_benchmark_type_id_fkey"
            columns: ["benchmark_type_id"]
            isOneToOne: false
            referencedRelation: "benchmark_type"
            referencedColumns: ["id"]
          },
        ]
      }
      programming_with_counts: {
        Row: {
          all_sets_completed: boolean | null
          athlete_notes: string | null
          coaches_notes: string | null
          completed_sets: number | null
          created_at: string | null
          description: string | null
          display_order: number | null
          gym_id: string | null
          id: string | null
          is_completed: boolean | null
          metcon_format: string | null
          name: string | null
          program_library_id: string | null
          programming_segment: string | null
          total_sets: number | null
          updated_at: string | null
          wod_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programming_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gym"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programming_program_library_id_fkey"
            columns: ["program_library_id"]
            isOneToOne: false
            referencedRelation: "program_library"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auth_contact_id: { Args: never; Returns: string }
      auth_is_staff_admin_anywhere: { Args: never; Returns: boolean }
      claim_fitness_track_link: {
        Args: { p_link_id: string; p_membership_offering_term_id: string }
        Returns: Json
      }
      get_fitness_track_link_public: {
        Args: { p_link_id: string }
        Returns: Json
      }
      has_active_capability: {
        Args: { p_capability_code: string; p_gym_id: string }
        Returns: boolean
      }
      has_active_fm_any: {
        Args: { p_gym_id: string; p_roles: string[] }
        Returns: boolean
      }
      has_active_fm_role: {
        Args: { p_gym_id: string; p_role: string }
        Returns: boolean
      }
      has_athlete_track_access: {
        Args: { p_gym_id: string; p_program_library_id: string }
        Returns: boolean
      }
      has_gym_staff_entitlement: {
        Args: { p_gym_id: string; p_scope: string }
        Returns: boolean
      }
      has_staff_library_scope: {
        Args: {
          p_gym_id: string
          p_program_library_id: string
          p_scope: string
        }
        Returns: boolean
      }
      staff_can_manage_programming_libraries: {
        Args: { p_gym_id: string; p_library_ids: string[] }
        Returns: boolean
      }
      staff_can_manage_programming: {
        Args: { p_programming_id: string }
        Returns: boolean
      }
      is_gym_admin_scoped: { Args: { p_gym_id: string }; Returns: boolean }
      delete_gym_programming_segment: {
        Args: { p_programming_id: string }
        Returns: undefined
      }
      sync_programming_library_assignments: {
        Args: { p_programming_id: string; p_library_ids: string[] }
        Returns: undefined
      }
      user_contact_id: { Args: never; Returns: string }
      user_gym_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      workout_scale: "rx_plus" | "rx" | "fx" | "scaled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      workout_scale: ["rx_plus", "rx", "fx", "scaled"],
    },
  },
} as const
