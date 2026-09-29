export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'farmer' | 'vet' | 'paravet' | 'lab' | 'admin';
export type PreferredLanguage = 'en' | 'hi' | 'mr';
export type RecordType = 'vaccination' | 'treatment' | 'checkup';
export type ReportStatus = 'pending' | 'triaged' | 'escalated' | 'resolved';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type LabStatus = 'collected' | 'in_transit' | 'received' | 'testing' | 'completed';
export type NotificationChannel = 'inapp' | 'email' | 'sms' | 'whatsapp';
export type SyncStatus = 'pending' | 'applied' | 'conflict';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone: string | null;
          email: string;
          full_name: string;
          role: UserRole;
          preferred_language: PreferredLanguage;
          district: string;
          village?: string;
          is_active: boolean;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone?: string | null;
          email: string;
          full_name: string;
          role?: UserRole;
          preferred_language?: PreferredLanguage;
          district: string;
          village?: string;
          is_active?: boolean;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string | null;
          email?: string;
          full_name?: string;
          role?: UserRole;
          preferred_language?: PreferredLanguage;
          district?: string;
          village?: string;
          is_active?: boolean;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      farmers: {
        Row: {
          id: string;
          user_id: string;
          village: string;
          block: string;
          landline: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          village: string;
          block: string;
          landline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          village?: string;
          block?: string;
          landline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      animals: {
        Row: {
          id: string;
          owner_id: string;
          tag_uid: string;
          species: string;
          breed: string;
          sex: string;
          dob: string | null;
          gps_lat: number;
          gps_lng: number;
          village: string;
          district: string;
          health_status: string;
          qr_code_url: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          tag_uid: string;
          species: string;
          breed: string;
          sex: string;
          dob?: string | null;
          gps_lat: number;
          gps_lng: number;
          village: string;
          district: string;
          health_status?: string;
          qr_code_url?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          tag_uid?: string;
          species?: string;
          breed?: string;
          sex?: string;
          dob?: string | null;
          gps_lat?: number;
          gps_lng?: number;
          village?: string;
          district?: string;
          health_status?: string;
          qr_code_url?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      health_records: {
        Row: {
          id: string;
          animal_id: string;
          record_type: RecordType;
          description: string;
          performed_by: string;
          performed_at: string;
          next_due_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          animal_id: string;
          record_type: RecordType;
          description: string;
          performed_by: string;
          performed_at?: string;
          next_due_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          animal_id?: string;
          record_type?: RecordType;
          description?: string;
          performed_by?: string;
          performed_at?: string;
          next_due_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      symptom_reports: {
        Row: {
          id: string;
          animal_id: string;
          reported_by: string;
          symptoms: Json;
          media_urls: Json;
          gps_lat: number;
          gps_lng: number;
          reported_at: string;
          status: ReportStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          animal_id: string;
          reported_by: string;
          symptoms?: Json;
          media_urls?: Json;
          gps_lat: number;
          gps_lng: number;
          reported_at?: string;
          status?: ReportStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          animal_id?: string;
          reported_by?: string;
          symptoms?: Json;
          media_urls?: Json;
          gps_lat?: number;
          gps_lng?: number;
          reported_at?: string;
          status?: ReportStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      outbreak_flags: {
        Row: {
          id: string;
          symptom_report_id: string;
          predicted_disease: string;
          confidence_pct: number;
          severity_score: number;
          risk_level: RiskLevel;
          district: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          symptom_report_id: string;
          predicted_disease: string;
          confidence_pct: number;
          severity_score: number;
          risk_level: RiskLevel;
          district: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          symptom_report_id?: string;
          predicted_disease?: string;
          confidence_pct?: number;
          severity_score?: number;
          risk_level?: RiskLevel;
          district?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      lab_cases: {
        Row: {
          id: string;
          symptom_report_id: string;
          sample_id: string;
          assigned_lab_id: string | null;
          status: LabStatus;
          result: string | null;
          status_history: Json;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          symptom_report_id: string;
          sample_id: string;
          assigned_lab_id?: string | null;
          status?: LabStatus;
          result?: string | null;
          status_history?: Json;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          symptom_report_id?: string;
          sample_id?: string;
          assigned_lab_id?: string | null;
          status?: LabStatus;
          result?: string | null;
          status_history?: Json;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      advisories: {
        Row: {
          id: string;
          title: string;
          body_en: string;
          body_hi: string;
          body_mr: string;
          district: string;
          disease: string;
          severity: RiskLevel;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body_en: string;
          body_hi: string;
          body_mr: string;
          district: string;
          disease: string;
          severity?: RiskLevel;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body_en?: string;
          body_hi?: string;
          body_mr?: string;
          district?: string;
          disease?: string;
          severity?: RiskLevel;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      notification_log: {
        Row: {
          id: string;
          user_id: string;
          channel: NotificationChannel;
          language: PreferredLanguage;
          message: string;
          status: string;
          sent_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          channel?: NotificationChannel;
          language?: PreferredLanguage;
          message: string;
          status?: string;
          sent_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          channel?: NotificationChannel;
          language?: PreferredLanguage;
          message?: string;
          status?: string;
          sent_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      community_posts: {
        Row: {
          id: string;
          source_symptom_report_id: string | null;
          district: string;
          summary: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source_symptom_report_id?: string | null;
          district: string;
          summary: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source_symptom_report_id?: string | null;
          district?: string;
          summary?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      sync_queue_items: {
        Row: {
          id: string;
          device_id: string;
          user_id: string;
          entity_type: string;
          payload: Json;
          client_created_at: string;
          synced_at: string | null;
          status: SyncStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          user_id: string;
          entity_type: string;
          payload: Json;
          client_created_at: string;
          synced_at?: string | null;
          status?: SyncStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          user_id?: string;
          entity_type?: string;
          payload?: Json;
          client_created_at?: string;
          synced_at?: string | null;
          status?: SyncStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      districts: {
        Row: {
          id: string;
          name: string;
          division: string;
          lat: number;
          lng: number;
          risk_override_level: RiskLevel | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          division: string;
          lat: number;
          lng: number;
          risk_override_level?: RiskLevel | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          division?: string;
          lat?: number;
          lng?: number;
          risk_override_level?: RiskLevel | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      district_staff_assignments: {
        Row: {
          id: string;
          district_id: string;
          user_id: string;
          role: string;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          district_id: string;
          user_id: string;
          role: string;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          district_id?: string;
          user_id?: string;
          role?: string;
          assigned_at?: string;
        };
      };
      district_admin_actions: {
        Row: {
          id: string;
          district_id: string;
          admin_id: string;
          action_type: 'intervention' | 'risk_override';
          notes: string;
          override_level: RiskLevel | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          district_id: string;
          admin_id: string;
          action_type: 'intervention' | 'risk_override';
          notes: string;
          override_level?: RiskLevel | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          district_id?: string;
          admin_id?: string;
          action_type?: 'intervention' | 'risk_override';
          notes?: string;
          override_level?: RiskLevel | null;
          created_at?: string;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

export type UserProfile = Tables<'users'>;
export type FarmerProfile = Tables<'farmers'>;
export type Animal = Tables<'animals'>;
export type HealthRecord = Tables<'health_records'>;
export type SymptomReport = Tables<'symptom_reports'>;
export type OutbreakFlag = Tables<'outbreak_flags'>;
export type LabCase = Tables<'lab_cases'>;
export type Advisory = Tables<'advisories'>;
export type NotificationLog = Tables<'notification_log'>;
export type CommunityPost = Tables<'community_posts'>;
export type SyncQueueItem = Tables<'sync_queue_items'>;
export type District = Tables<'districts'>;
export type DistrictStaffAssignment = Tables<'district_staff_assignments'>;
export type DistrictAdminAction = Tables<'district_admin_actions'>;
