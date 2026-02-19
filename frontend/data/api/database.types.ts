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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          allow_resubmission: boolean
          assignment_name: string
          class_id: number
          created_at: string
          deadline: string | null
          description: string
          id: number
          is_active: boolean
          late_penalty_config: Json | null
          late_penalty_enabled: boolean
          max_attempts: number | null
          programming_language: Database["public"]["Enums"]["programming_language"]
          scheduled_date: string | null
          template_code: string | null
          total_score: number
        }
        Insert: {
          allow_resubmission?: boolean
          assignment_name: string
          class_id: number
          created_at?: string
          deadline?: string | null
          description: string
          id?: number
          is_active?: boolean
          late_penalty_config?: Json | null
          late_penalty_enabled?: boolean
          max_attempts?: number | null
          programming_language: Database["public"]["Enums"]["programming_language"]
          scheduled_date?: string | null
          template_code?: string | null
          total_score?: number
        }
        Update: {
          allow_resubmission?: boolean
          assignment_name?: string
          class_id?: number
          created_at?: string
          deadline?: string | null
          description?: string
          id?: number
          is_active?: boolean
          late_penalty_config?: Json | null
          late_penalty_enabled?: boolean
          max_attempts?: number | null
          programming_language?: Database["public"]["Enums"]["programming_language"]
          scheduled_date?: string | null
          template_code?: string | null
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_assignments_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string
          class_code: string
          class_name: string
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          schedule: Json
          semester: number
          teacher_id: number
          year_level: number
        }
        Insert: {
          academic_year: string
          class_code: string
          class_name: string
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          schedule: Json
          semester: number
          teacher_id: number
          year_level: number
        }
        Update: {
          academic_year?: string
          class_code?: string
          class_name?: string
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          schedule?: Json
          semester?: number
          teacher_id?: number
          year_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_classes_teacher"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          class_id: number
          enrolled_at: string
          id: number
          student_id: number
        }
        Insert: {
          class_id: number
          enrolled_at?: string
          id?: number
          student_id: number
        }
        Update: {
          class_id?: number
          enrolled_at?: string
          id?: number
          student_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_enrollments_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_enrollments_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      match_fragments: {
        Row: {
          created_at: string
          id: number
          left_end_col: number
          left_end_row: number
          left_start_col: number
          left_start_row: number
          length: number
          right_end_col: number
          right_end_row: number
          right_start_col: number
          right_start_row: number
          similarity_result_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          left_end_col: number
          left_end_row: number
          left_start_col: number
          left_start_row: number
          length: number
          right_end_col: number
          right_end_row: number
          right_start_col: number
          right_start_row: number
          similarity_result_id: number
        }
        Update: {
          created_at?: string
          id?: number
          left_end_col?: number
          left_end_row?: number
          left_start_col?: number
          left_start_row?: number
          length?: number
          right_end_col?: number
          right_end_row?: number
          right_start_col?: number
          right_start_row?: number
          similarity_result_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_fragments_similarity_result_id_fkey"
            columns: ["similarity_result_id"]
            isOneToOne: false
            referencedRelation: "similarity_results"
            referencedColumns: ["id"]
          },
        ]
      }
      similarity_reports: {
        Row: {
          assignment_id: number
          average_similarity: number | null
          flagged_pairs: number
          generated_at: string
          highest_similarity: number | null
          id: number
          report_file_path: string | null
          teacher_id: number | null
          total_comparisons: number
          total_submissions: number
        }
        Insert: {
          assignment_id: number
          average_similarity?: number | null
          flagged_pairs?: number
          generated_at?: string
          highest_similarity?: number | null
          id?: number
          report_file_path?: string | null
          teacher_id?: number | null
          total_comparisons: number
          total_submissions: number
        }
        Update: {
          assignment_id?: number
          average_similarity?: number | null
          flagged_pairs?: number
          generated_at?: string
          highest_similarity?: number | null
          id?: number
          report_file_path?: string | null
          teacher_id?: number | null
          total_comparisons?: number
          total_submissions?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_similarity_reports_assignment"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_similarity_reports_teacher"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      similarity_results: {
        Row: {
          analyzed_at: string
          hybrid_score: number
          id: number
          is_flagged: boolean
          left_covered: number
          left_total: number
          longest_fragment: number
          overlap: number
          report_id: number
          right_covered: number
          right_total: number
          semantic_score: number
          structural_score: number
          submission1_id: number
          submission2_id: number
        }
        Insert: {
          analyzed_at?: string
          hybrid_score: number
          id?: number
          is_flagged?: boolean
          left_covered?: number
          left_total?: number
          longest_fragment?: number
          overlap?: number
          report_id: number
          right_covered?: number
          right_total?: number
          semantic_score: number
          structural_score: number
          submission1_id: number
          submission2_id: number
        }
        Update: {
          analyzed_at?: string
          hybrid_score?: number
          id?: number
          is_flagged?: boolean
          left_covered?: number
          left_total?: number
          longest_fragment?: number
          overlap?: number
          report_id?: number
          right_covered?: number
          right_total?: number
          semantic_score?: number
          structural_score?: number
          submission1_id?: number
          submission2_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_similarity_results_report"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "similarity_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_similarity_results_submission1"
            columns: ["submission1_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_similarity_results_submission2"
            columns: ["submission2_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          assignment_id: number
          file_name: string
          file_path: string
          file_size: number
          grade: number | null
          id: number
          is_grade_overridden: boolean
          is_latest: boolean
          overridden_at: string | null
          override_feedback: string | null
          student_id: number
          submission_number: number
          submitted_at: string
        }
        Insert: {
          assignment_id: number
          file_name: string
          file_path: string
          file_size: number
          grade?: number | null
          id?: number
          is_grade_overridden?: boolean
          is_latest?: boolean
          overridden_at?: string | null
          override_feedback?: string | null
          student_id: number
          submission_number?: number
          submitted_at?: string
        }
        Update: {
          assignment_id?: number
          file_name?: string
          file_path?: string
          file_size?: number
          grade?: number | null
          id?: number
          is_grade_overridden?: boolean
          is_latest?: boolean
          overridden_at?: string | null
          override_feedback?: string | null
          student_id?: number
          submission_number?: number
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_submissions_assignment"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_submissions_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type"]
          description: string
          id: number
          ip_address: string | null
          timestamp: string
          user_id: number | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type"]
          description: string
          id?: number
          ip_address?: string | null
          timestamp?: string
          user_id?: number | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type"]
          description?: string
          id?: number
          ip_address?: string | null
          timestamp?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_system_logs_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      test_cases: {
        Row: {
          assignment_id: number
          created_at: string
          expected_output: string
          id: number
          input: string
          is_hidden: boolean
          name: string
          sort_order: number
          time_limit: number
        }
        Insert: {
          assignment_id: number
          created_at?: string
          expected_output: string
          id?: number
          input?: string
          is_hidden?: boolean
          name: string
          sort_order?: number
          time_limit?: number
        }
        Update: {
          assignment_id?: number
          created_at?: string
          expected_output?: string
          id?: number
          input?: string
          is_hidden?: boolean
          name?: string
          sort_order?: number
          time_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_cases_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          actual_output: string | null
          created_at: string
          error_message: string | null
          execution_time: number | null
          executor_token: string | null
          id: number
          memory_used: number | null
          status: string
          submission_id: number
          test_case_id: number
        }
        Insert: {
          actual_output?: string | null
          created_at?: string
          error_message?: string | null
          execution_time?: number | null
          executor_token?: string | null
          id?: number
          memory_used?: number | null
          status: string
          submission_id: number
          test_case_id: number
        }
        Update: {
          actual_output?: string | null
          created_at?: string
          error_message?: string | null
          execution_time?: number | null
          executor_token?: string | null
          id?: number
          memory_used?: number | null
          status?: string
          submission_id?: number
          test_case_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_results_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string
          id: number
          is_active: boolean
          last_name: string
          role: Database["public"]["Enums"]["user_role"]
          supabase_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: number
          is_active?: boolean
          last_name: string
          role: Database["public"]["Enums"]["user_role"]
          supabase_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: number
          is_active?: boolean
          last_name?: string
          role?: Database["public"]["Enums"]["user_role"]
          supabase_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      action_type:
        | "login"
        | "logout"
        | "create_class"
        | "create_assignment"
        | "submit_code"
        | "run_detection"
        | "delete_user"
        | "other"
      programming_language: "java" | "python" | "c"
      user_role: "student" | "teacher" | "admin"
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
      action_type: [
        "login",
        "logout",
        "create_class",
        "create_assignment",
        "submit_code",
        "run_detection",
        "delete_user",
        "other",
      ],
      programming_language: ["java", "python", "c"],
      user_role: ["student", "teacher", "admin"],
    },
  },
} as const
