// Services using real Supabase backend
// Previously used stub data, now connected to production Supabase

import { supabase } from '../lib/supabase';
import type { Profile, StaffAccount } from '../types/domain';

export interface EncoderDashboardStats {
  todayCount: number;
  yesterdayCount: number;
  weekCount: number;
  lastWeekCount: number;
  monthCount: number;
  last14Days: Array<{ isoDate: string; label: string; count: number }>;
}

export interface ClientRow {
  id: string;
  initials: string;
  tint: 'blue' | 'orange' | 'green' | 'slate';
  name: string;
  email: string;
  barangay: string;
  registrationDate: string;
  cardId: string;
  status: 'Active' | 'Pending' | 'Expired';
}

export const adminService = {
  async getDashboardStats() {
    try {
      // Get total clients count
      const { count: totalClients, error: clientsError } = await supabase
        .from('health_cards')
        .select('*', { count: 'exact', head: true });

      if (clientsError) throw clientsError;

      // Get total encoders count
      const { count: totalEncoders, error: encodersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'encoder');

      if (encodersError) throw encodersError;

      // Get recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentData, error: recentError } = await supabase
        .from('health_cards')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) throw recentError;

      const recentActivity = (recentData || []).map((item: any) => ({
        id: item.created_at,
        type: 'registration',
        description: 'New health card registration',
        timestamp: item.created_at
      }));

      return {
        totalClients: totalClients || 0,
        totalEncoders: totalEncoders || 0,
        pendingApprovals: 0, // Can be updated when you add approval workflow
        recentActivity
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { totalClients: 0, totalEncoders: 0, pendingApprovals: 0, recentActivity: [] };
    }
  },

  async getClients(): Promise<ClientRow[]> {
    return this.listClients();
  },

  async listClients(): Promise<ClientRow[]> {
    try {
      const { data, error } = await supabase
        .from('health_cards')
        .select('id, client_id, full_name, barangay, age, card_number, email_address, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => {
        const nameParts = item.full_name?.split(' ') || ['Unknown'];
        const initials = nameParts.slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();
        return {
          id: item.id,
          initials: initials || '??',
          tint: 'blue' as const,
          name: item.full_name || 'Unknown',
          email: item.email_address || 'No email',
          barangay: item.barangay || 'Unknown',
          registrationDate: new Date(item.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          cardId: item.card_number || item.id.slice(0, 8).toUpperCase(),
          status: 'Active' as const
        };
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  },

  async getStaff(): Promise<Profile[]> {
    return this.listStaff();
  },

  async listStaff(): Promise<StaffAccount[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['encoder', 'admin', 'super_admin'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        created_by: item.created_by || null,
        updated_at: item.updated_at || new Date().toISOString()
      })) as StaffAccount[];
    } catch (error) {
      console.error('Error fetching staff:', error);
      return [];
    }
  },

  async createStaff(data: Partial<Profile>) {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error: any) {
      throw new Error(`Failed to create staff: ${error.message}`);
    }
  },

  async updateStaff(id: string, data: Partial<Profile>) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(`Failed to update staff: ${error.message}`);
    }
  },

  async deleteStaff(id: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(`Failed to delete staff: ${error.message}`);
    }
  }
};

export const clientService = {
  async getClientById(id: string) {
    try {
      const { data, error } = await supabase
        .from('health_cards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching client:', error);
      return null;
    }
  },

  async updateClient(id: string, data: any) {
    try {
      const { error } = await supabase
        .from('health_cards')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(`Failed to update client: ${error.message}`);
    }
  },

  async listClients(): Promise<ClientRow[]> {
    return adminService.listClients();
  }
};

export const encoderDashboardService = {
  async getDashboardStats(encoderId?: string) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      let query = supabase.from('health_cards').select('*', { count: 'exact', head: true });
      if (encoderId) {
        query = query.eq('encoder_id', encoderId);
      }

      const { count: totalRegistrations, error: totalError } = await query;

      if (totalError) throw totalError;

      // Today's registrations
      let todayQuery = supabase
        .from('health_cards')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfDay.toISOString());
      if (encoderId) {
        todayQuery = todayQuery.eq('encoder_id', encoderId);
      }
      const { count: todayRegistrations, error: todayError } = await todayQuery;

      if (todayError) throw todayError;

      // Week registrations
      let weekQuery = supabase
        .from('health_cards')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfWeek.toISOString());
      if (encoderId) {
        weekQuery = weekQuery.eq('encoder_id', encoderId);
      }
      const { count: weekRegistrations, error: weekError } = await weekQuery;

      if (weekError) throw weekError;

      return {
        totalRegistrations: totalRegistrations || 0,
        todayRegistrations: todayRegistrations || 0,
        weekRegistrations: weekRegistrations || 0,
        pendingValidations: 0,
        last14Days: [] as any[]
      };
    } catch (error) {
      console.error('Error fetching encoder dashboard stats:', error);
      return {
        totalRegistrations: 0,
        todayRegistrations: 0,
        weekRegistrations: 0,
        pendingValidations: 0,
        last14Days: [] as any[]
      };
    }
  },

  async getRecentActivity(encoderId?: string, limit: number = 10) {
    try {
      let query = supabase
        .from('health_cards')
        .select('id, full_name, barangay, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (encoderId) {
        query = query.eq('encoder_id', encoderId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        clientName: item.full_name,
        barangay: item.barangay,
        timestamp: item.created_at,
        type: 'registration'
      }));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  },

  async getStats(profileId?: string): Promise<EncoderDashboardStats> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const yesterday = new Date(startOfDay);
      yesterday.setDate(yesterday.getDate() - 1);

      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());

      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const lastWeekEnd = new Date(weekStart);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      // Build queries
      let baseQuery = supabase.from('health_cards').select('*', { count: 'exact', head: true });
      if (profileId) {
        baseQuery = baseQuery.eq('encoder_id', profileId);
      }

      // Today's count
      const { count: todayCount } = await baseQuery.gte('created_at', startOfDay.toISOString());

      // Yesterday's count
      const { count: yesterdayCount } = await supabase
        .from('health_cards')
        .select('*', { count: 'exact', head: true })
        .eq(profileId ? 'encoder_id' : 'id', profileId || 'not-filtering')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', startOfDay.toISOString());

      // This week's count
      const { count: weekCount } = await supabase
        .from('health_cards')
        .select('*', { count: 'exact', head: true })
        .eq(profileId ? 'encoder_id' : 'id', profileId || 'not-filtering')
        .gte('created_at', weekStart.toISOString());

      // Last week's count
      const { count: lastWeekCount } = await supabase
        .from('health_cards')
        .select('*', { count: 'exact', head: true })
        .eq(profileId ? 'encoder_id' : 'id', profileId || 'not-filtering')
        .gte('created_at', lastWeekStart.toISOString())
        .lt('created_at', lastWeekEnd.toISOString());

      // This month's count
      const { count: monthCount } = await supabase
        .from('health_cards')
        .select('*', { count: 'exact', head: true })
        .eq(profileId ? 'encoder_id' : 'id', profileId || 'not-filtering')
        .gte('created_at', monthStart.toISOString());

      // Last 14 days data
      const last14Days: Array<{ isoDate: string; label: string; count: number }> = [];
      for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        let dayQuery = supabase
          .from('health_cards')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString());

        if (profileId) {
          dayQuery = dayQuery.eq('encoder_id', profileId);
        }

        const { count } = await dayQuery;

        last14Days.push({
          isoDate: dayStart.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
          count: count || 0
        });
      }

      return {
        todayCount: todayCount || 0,
        yesterdayCount: yesterdayCount || 0,
        weekCount: weekCount || 0,
        lastWeekCount: lastWeekCount || 0,
        monthCount: monthCount || 0,
        last14Days
      };
    } catch (error) {
      console.error('Error fetching encoder stats:', error);
      return {
        todayCount: 0,
        yesterdayCount: 0,
        weekCount: 0,
        lastWeekCount: 0,
        monthCount: 0,
        last14Days: []
      };
    }
  }
};
