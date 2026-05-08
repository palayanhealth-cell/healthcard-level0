import { supabase } from '../lib/supabase';
import type { HealthCardFormValues, HealthCardRecord } from '../types/domain';

const parseNullable = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const calculateAge = (dateOfBirth: string) => {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
};

const calculateBmi = (heightCm: number, weightKg: number) => {
  const heightM = heightCm / 100;
  if (!heightM) {
    return 0;
  }
  return Number((weightKg / (heightM * heightM)).toFixed(2));
};

const toFullName = (input: HealthCardFormValues) => {
  return [input.first_name, input.middle_name, input.last_name, input.suffix]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
};

const buildCardNumber = () => {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(100000 + Math.random() * 900000);
  return `PCH-${stamp}-${random}`;
};

export const supabaseHealthCardService = {
  toComputedFields(input: HealthCardFormValues) {
    return {
      age: calculateAge(input.date_of_birth),
      bmi: calculateBmi(input.height_cm, input.weight_kg),
    };
  },

  async upsertHealthCard(encoderId: string, input: HealthCardFormValues): Promise<HealthCardRecord> {
    // Generate a new client_id if one isn't provided (for new registrations)
    let clientId = input.client_id;
    if (!clientId) {
      // Create new client profile in Supabase
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: input.email_address || `${Date.now()}@placeholder.local`,
          full_name: toFullName(input),
          username: `client_${Date.now()}`,
          role: 'client',
          account_status: 'active',
          must_change_password: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (profileError || !newProfile) {
        throw new Error('Failed to create client profile');
      }

      clientId = newProfile.id;
    }

    const computed = this.toComputedFields(input);
    const cardNumber = buildCardNumber();
    const qrPayload = JSON.stringify({
      cardNumber,
      clientId,
      fullName: toFullName(input),
      timestamp: new Date().toISOString(),
    });

    const payload = {
      client_id: clientId,
      encoder_id: encoderId,
      full_name: toFullName(input),
      first_name: input.first_name.trim(),
      middle_name: parseNullable(input.middle_name),
      last_name: input.last_name.trim(),
      suffix: parseNullable(input.suffix),
      sex: input.sex,
      date_of_birth: input.date_of_birth,
      age: computed.age,
      civil_status: input.civil_status,
      nationality: input.nationality,
      blood_type: parseNullable(input.blood_type),
      contact_number: input.contact_number,
      email_address: parseNullable(input.email_address),
      complete_address: input.complete_address,
      barangay: input.barangay,
      city: input.city,
      province: input.province,
      years_of_residency: input.years_of_residency,
      residency_status: input.residency_status,
      gps_coordinates: parseNullable(input.gps_coordinates),
      philhealth_number: input.philhealth_number,
      national_id_number: parseNullable(input.national_id_number),
      guardian_national_id_number: parseNullable(input.guardian_national_id_number),
      yakap_number: parseNullable(input.yakap_number),
      voter_status: parseNullable(input.voter_status),
      senior_citizen_id: parseNullable(input.senior_citizen_id),
      pwd_id: parseNullable(input.pwd_id),
      household_id: parseNullable(input.household_id),
      household_head_name: input.household_head_name,
      relationship_to_head: input.relationship_to_head,
      household_members_count: input.household_members_count,
      guardian_name: parseNullable(input.guardian_name),
      emergency_contact_name: input.emergency_contact_name,
      emergency_contact_number: input.emergency_contact_number,
      height_cm: input.height_cm,
      weight_kg: input.weight_kg,
      bmi: computed.bmi,
      blood_pressure: input.blood_pressure,
      medical_conditions: parseNullable(input.medical_conditions),
      allergies: parseNullable(input.allergies),
      maintenance_medicines: parseNullable(input.maintenance_medicines),
      is_senior: input.is_senior,
      is_pwd: input.is_pwd,
      is_pregnant: input.is_pregnant,
      is_child_0_5: input.is_child_0_5,
      is_4ps_beneficiary: input.is_4ps_beneficiary,
      is_indigent: input.is_indigent,
      philhealth_membership_type: input.philhealth_membership_type,
      vaccination_status: input.vaccination_status,
      tb_hiv_program_notes: parseNullable(input.tb_hiv_program_notes),
      photo_url: parseNullable(input.photo_url),
      valid_id_url: parseNullable(input.valid_id_url),
      barangay_certificate_url: parseNullable(input.barangay_certificate_url),
      medical_records_url: parseNullable(input.medical_records_url),
      card_qr_value: qrPayload,
      card_number: cardNumber,
      updated_at: new Date().toISOString()
    };

    // Upsert health card
    const { data: existingData } = await supabase
      .from('health_cards')
      .select('id')
      .eq('client_id', clientId)
      .single();

    let result: HealthCardRecord;

    if (existingData) {
      // Update existing
      const { data, error } = await supabase
        .from('health_cards')
        .update(payload)
        .eq('client_id', clientId)
        .select()
        .single();

      if (error) throw error;
      result = data as HealthCardRecord;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('health_cards')
        .insert({
          ...payload,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      result = data as HealthCardRecord;
    }

    return result;
  },

  async getClientCard(clientId: string): Promise<HealthCardRecord> {
    const { data, error } = await supabase
      .from('health_cards')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error || !data) {
      throw new Error('Health card not found');
    }

    return data as HealthCardRecord;
  },

  async getCardByCardNumber(cardNumber: string): Promise<HealthCardRecord | null> {
    const { data, error } = await supabase
      .from('health_cards')
      .select('*')
      .eq('card_number', cardNumber)
      .single();

    if (error || !data) {
      return null;
    }

    return data as HealthCardRecord;
  },

  async listHealthCards(limit: number = 100, offset: number = 0): Promise<HealthCardRecord[]> {
    const { data, error } = await supabase
      .from('health_cards')
      .select('*')
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []) as HealthCardRecord[];
  },

  async getHealthCardsByEncoder(encoderId: string): Promise<HealthCardRecord[]> {
    const { data, error } = await supabase
      .from('health_cards')
      .select('*')
      .eq('encoder_id', encoderId);

    if (error) throw error;

    return (data || []) as HealthCardRecord[];
  }
};
