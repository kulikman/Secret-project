export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_role_assignments: {
        Row: {
          created_at: string;
          granted_by: string | null;
          id: string;
          reason: string | null;
          role: Database["public"]["Enums"]["admin_role"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          granted_by?: string | null;
          id?: string;
          reason?: string | null;
          role: Database["public"]["Enums"]["admin_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          granted_by?: string | null;
          id?: string;
          reason?: string | null;
          role?: Database["public"]["Enums"]["admin_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      ai_jobs: {
        Row: {
          created_at: string;
          created_by: string | null;
          error: string | null;
          finished_at: string | null;
          id: string;
          input: Json;
          job_type: string;
          model: string | null;
          output: Json;
          presentation_id: string | null;
          provider: string | null;
          started_at: string | null;
          status: string;
          topic_node_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          error?: string | null;
          finished_at?: string | null;
          id?: string;
          input?: Json;
          job_type: string;
          model?: string | null;
          output?: Json;
          presentation_id?: string | null;
          provider?: string | null;
          started_at?: string | null;
          status?: string;
          topic_node_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          error?: string | null;
          finished_at?: string | null;
          id?: string;
          input?: Json;
          job_type?: string;
          model?: string | null;
          output?: Json;
          presentation_id?: string | null;
          provider?: string | null;
          started_at?: string | null;
          status?: string;
          topic_node_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_jobs_presentation_id_fkey";
            columns: ["presentation_id"];
            isOneToOne: false;
            referencedRelation: "presentations";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_prompt_templates: {
        Row: {
          body: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          prompt_type: string;
          title: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          body: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          prompt_type: string;
          title: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          prompt_type?: string;
          title?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      api_keys: {
        Row: {
          created_at: string;
          expires_at: string | null;
          id: string;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          name: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          key_hash?: string;
          key_prefix?: string;
          last_used_at?: string | null;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          city_id: string | null;
          created_at: string;
          email: string;
          event_id: string | null;
          full_name: string;
          id: string;
          motivation: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          selected_topic: string | null;
          status: string;
          telegram: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          city_id?: string | null;
          created_at?: string;
          email: string;
          event_id?: string | null;
          full_name: string;
          id?: string;
          motivation?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          selected_topic?: string | null;
          status?: string;
          telegram?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          city_id?: string | null;
          created_at?: string;
          email?: string;
          event_id?: string | null;
          full_name?: string;
          id?: string;
          motivation?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          selected_topic?: string | null;
          status?: string;
          telegram?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "applications_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "bureau_cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "bureau_events";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          id: number;
          metadata: Json;
          resource: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          id?: never;
          metadata?: Json;
          resource?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          id?: never;
          metadata?: Json;
          resource?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      awakening_topic_suggestions: {
        Row: {
          created_at: string;
          decision_reason: string | null;
          description: string | null;
          id: string;
          promoted_node_projection_id: string | null;
          related_node_refs: Json;
          reviewed_at: string | null;
          reviewed_by: string | null;
          slug: string | null;
          source_refs: Json;
          status: string;
          suggested_by: string | null;
          summary: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          decision_reason?: string | null;
          description?: string | null;
          id?: string;
          promoted_node_projection_id?: string | null;
          related_node_refs?: Json;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          slug?: string | null;
          source_refs?: Json;
          status?: string;
          suggested_by?: string | null;
          summary?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          decision_reason?: string | null;
          description?: string | null;
          id?: string;
          promoted_node_projection_id?: string | null;
          related_node_refs?: Json;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          slug?: string | null;
          source_refs?: Json;
          status?: string;
          suggested_by?: string | null;
          summary?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "awakening_topic_suggestions_promoted_node_projection_id_fkey";
            columns: ["promoted_node_projection_id"];
            isOneToOne: false;
            referencedRelation: "node_projection";
            referencedColumns: ["id"];
          },
        ];
      };
      bureau_cities: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bureau_events: {
        Row: {
          city_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          slug: string;
          starts_at: string | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          city_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          slug: string;
          starts_at?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          city_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          slug?: string;
          starts_at?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bureau_events_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "bureau_cities";
            referencedColumns: ["id"];
          },
        ];
      };
      dossiers: {
        Row: {
          created_at: string;
          created_by: string | null;
          edited_content: Json;
          id: string;
          parent_version: string | null;
          raw_output: Json;
          source_refs: Json;
          status: string;
          topic_node_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          edited_content?: Json;
          id?: string;
          parent_version?: string | null;
          raw_output?: Json;
          source_refs?: Json;
          status?: string;
          topic_node_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          edited_content?: Json;
          id?: string;
          parent_version?: string | null;
          raw_output?: Json;
          source_refs?: Json;
          status?: string;
          topic_node_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dossiers_parent_version_fkey";
            columns: ["parent_version"];
            isOneToOne: false;
            referencedRelation: "dossiers";
            referencedColumns: ["id"];
          },
        ];
      };
      graph_edges: {
        Row: {
          created_at: string;
          from_node_id: string;
          id: string;
          relation_type: string;
          source_refs: Json;
          status: string;
          strength: number;
          to_node_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          from_node_id: string;
          id?: string;
          relation_type: string;
          source_refs?: Json;
          status?: string;
          strength?: number;
          to_node_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          from_node_id?: string;
          id?: string;
          relation_type?: string;
          source_refs?: Json;
          status?: string;
          strength?: number;
          to_node_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "graph_edges_from_node_id_fkey";
            columns: ["from_node_id"];
            isOneToOne: false;
            referencedRelation: "node_projection";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "graph_edges_to_node_id_fkey";
            columns: ["to_node_id"];
            isOneToOne: false;
            referencedRelation: "node_projection";
            referencedColumns: ["id"];
          },
        ];
      };
      node_projection: {
        Row: {
          brain_node_id: string;
          claim_status: string | null;
          content: Json;
          created_at: string;
          credibility: string | null;
          id: string;
          is_stale: boolean;
          node_type: string;
          published_at: string | null;
          slug: string | null;
          source_refs: Json;
          status: string;
          summary: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          brain_node_id: string;
          claim_status?: string | null;
          content?: Json;
          created_at?: string;
          credibility?: string | null;
          id?: string;
          is_stale?: boolean;
          node_type: string;
          published_at?: string | null;
          slug?: string | null;
          source_refs?: Json;
          status?: string;
          summary?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          brain_node_id?: string;
          claim_status?: string | null;
          content?: Json;
          created_at?: string;
          credibility?: string | null;
          id?: string;
          is_stale?: boolean;
          node_type?: string;
          published_at?: string | null;
          slug?: string | null;
          source_refs?: Json;
          status?: string;
          summary?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          href: string | null;
          id: string;
          kind: string;
          read: boolean;
          title: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          href?: string | null;
          id?: string;
          kind?: string;
          read?: boolean;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          href?: string | null;
          id?: string;
          kind?: string;
          read?: boolean;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      org_invites: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          org_id: string;
          role: Database["public"]["Enums"]["org_role"];
          token: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          invited_by: string;
          org_id: string;
          role?: Database["public"]["Enums"]["org_role"];
          token?: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string;
          org_id?: string;
          role?: Database["public"]["Enums"]["org_role"];
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "org_invites_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      org_members: {
        Row: {
          created_at: string;
          id: string;
          org_id: string;
          role: Database["public"]["Enums"]["org_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          org_id: string;
          role?: Database["public"]["Enums"]["org_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          org_id?: string;
          role?: Database["public"]["Enums"]["org_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          id: string;
          logo_url: string | null;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      photo_reports: {
        Row: {
          body: Json;
          city_id: string | null;
          created_at: string;
          created_by: string | null;
          event_id: string | null;
          id: string;
          media: Json;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          body?: Json;
          city_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          event_id?: string | null;
          id?: string;
          media?: Json;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          body?: Json;
          city_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          event_id?: string | null;
          id?: string;
          media?: Json;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "photo_reports_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "bureau_cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "photo_reports_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "bureau_events";
            referencedColumns: ["id"];
          },
        ];
      };
      presentations: {
        Row: {
          artifact_mime_type: string | null;
          artifact_storage_path: string | null;
          artifact_url: string | null;
          cache_key: string | null;
          created_at: string;
          created_by: string | null;
          dossier_id: string | null;
          exported_at: string | null;
          generated_at: string | null;
          generation_input: Json;
          id: string;
          narrative_text: string | null;
          page_count: number;
          parent_version: string | null;
          prompt_template_id: string | null;
          prompt_template_version: number | null;
          status: string;
          text_model: string | null;
          text_provider: string;
          title: string;
          topic_node_id: string;
          updated_at: string;
          visual_model: string | null;
          visual_provider: string;
        };
        Insert: {
          artifact_mime_type?: string | null;
          artifact_storage_path?: string | null;
          artifact_url?: string | null;
          cache_key?: string | null;
          created_at?: string;
          created_by?: string | null;
          dossier_id?: string | null;
          exported_at?: string | null;
          generated_at?: string | null;
          generation_input?: Json;
          id?: string;
          narrative_text?: string | null;
          page_count?: number;
          parent_version?: string | null;
          prompt_template_id?: string | null;
          prompt_template_version?: number | null;
          status?: string;
          text_model?: string | null;
          text_provider?: string;
          title: string;
          topic_node_id: string;
          updated_at?: string;
          visual_model?: string | null;
          visual_provider?: string;
        };
        Update: {
          artifact_mime_type?: string | null;
          artifact_storage_path?: string | null;
          artifact_url?: string | null;
          cache_key?: string | null;
          created_at?: string;
          created_by?: string | null;
          dossier_id?: string | null;
          exported_at?: string | null;
          generated_at?: string | null;
          generation_input?: Json;
          id?: string;
          narrative_text?: string | null;
          page_count?: number;
          parent_version?: string | null;
          prompt_template_id?: string | null;
          prompt_template_version?: number | null;
          status?: string;
          text_model?: string | null;
          text_provider?: string;
          title?: string;
          topic_node_id?: string;
          updated_at?: string;
          visual_model?: string | null;
          visual_provider?: string;
        };
        Relationships: [
          {
            foreignKeyName: "presentations_dossier_id_fkey";
            columns: ["dossier_id"];
            isOneToOne: false;
            referencedRelation: "dossiers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "presentations_parent_version_fkey";
            columns: ["parent_version"];
            isOneToOne: false;
            referencedRelation: "presentations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "presentations_prompt_template_id_fkey";
            columns: ["prompt_template_id"];
            isOneToOne: false;
            referencedRelation: "ai_prompt_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          onboarding_completed: boolean;
          onboarding_step: number;
          updated_at: string;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          onboarding_completed?: boolean;
          onboarding_step?: number;
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          onboarding_completed?: boolean;
          onboarding_step?: number;
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      slides: {
        Row: {
          body: Json;
          created_at: string;
          id: string;
          layout: Json;
          position: number;
          presentation_id: string;
          source_refs: Json;
          speaker_notes: string | null;
          title: string;
          updated_at: string;
          visual_asset: Json;
          visual_prompt: string | null;
        };
        Insert: {
          body?: Json;
          created_at?: string;
          id?: string;
          layout?: Json;
          position: number;
          presentation_id: string;
          source_refs?: Json;
          speaker_notes?: string | null;
          title: string;
          updated_at?: string;
          visual_asset?: Json;
          visual_prompt?: string | null;
        };
        Update: {
          body?: Json;
          created_at?: string;
          id?: string;
          layout?: Json;
          position?: number;
          presentation_id?: string;
          source_refs?: Json;
          speaker_notes?: string | null;
          title?: string;
          updated_at?: string;
          visual_asset?: Json;
          visual_prompt?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "slides_presentation_id_fkey";
            columns: ["presentation_id"];
            isOneToOne: false;
            referencedRelation: "presentations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      admin_role: "super_admin" | "admin" | "editor" | "curator" | "support" | "viewer";
      org_role: "owner" | "admin" | "member";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      admin_role: ["super_admin", "admin", "editor", "curator", "support", "viewer"],
      org_role: ["owner", "admin", "member"],
    },
  },
} as const;
