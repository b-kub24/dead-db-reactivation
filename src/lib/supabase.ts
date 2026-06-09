import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          business_name: string | null;
          brand_voice: string | null;
          default_market_area: string | null;
          twilio_number: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          business_name?: string | null;
          brand_voice?: string | null;
          default_market_area?: string | null;
          twilio_number?: string | null;
          phone?: string | null;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          last_contact_at: string | null;
          source: string | null;
          notes: string | null;
          segment: string | null;
          status: ContactStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          last_contact_at?: string | null;
          source?: string | null;
          notes?: string | null;
          segment?: string | null;
          status?: ContactStatus;
        };
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>;
      };
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          status: CampaignStatus;
          cadence: CadenceStep[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          status?: CampaignStatus;
          cadence?: CadenceStep[];
        };
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>;
      };
      campaign_contacts: {
        Row: {
          campaign_id: string;
          contact_id: string;
          current_step: number;
          next_send_at: string | null;
          paused: boolean;
        };
        Insert: {
          campaign_id: string;
          contact_id: string;
          current_step?: number;
          next_send_at?: string | null;
          paused?: boolean;
        };
        Update: Partial<Database['public']['Tables']['campaign_contacts']['Insert']>;
      };
      touches: {
        Row: {
          id: string;
          campaign_id: string;
          contact_id: string;
          step: number;
          channel: 'sms' | 'email';
          direction: 'outbound' | 'inbound';
          body: string;
          subject: string | null;
          sent_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          contact_id: string;
          step: number;
          channel: 'sms' | 'email';
          direction: 'outbound' | 'inbound';
          body: string;
          subject?: string | null;
        };
        Update: Partial<Database['public']['Tables']['touches']['Insert']>;
      };
    };
  };
};

export type ContactStatus = 'pending' | 'active' | 'replied' | 'opted_out' | 'reactivated' | 'dead';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type CadenceStep = {
  day: number;
  channel: 'sms' | 'email';
};

export type Contact = Database['public']['Tables']['contacts']['Row'];
export type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type CampaignContact = Database['public']['Tables']['campaign_contacts']['Row'];
export type Touch = Database['public']['Tables']['touches']['Row'];
export type User = Database['public']['Tables']['users']['Row'];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function createBrowserClient(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export function createServerClient(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createAuthenticatedClient(accessToken: string): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export function getUserFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
