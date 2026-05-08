export type UserRole = 'super_admin' | 'admin' | 'encoder' | 'client';

export type StaffRole = Extract<UserRole, 'super_admin' | 'admin' | 'encoder'>;

export type AccountStatus = 'active' | 'inactive' | 'suspended';

export interface Profile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  account_status: AccountStatus;
  must_change_password: boolean;
  created_at: string;
  created_by?: string | null;
  updated_at?: string;
}

export interface StaffAccount extends Profile {
  created_by: string | null;
  updated_at: string;
}

export interface NewStaffInput {
  username: string;
  email: string;
  fullName: string;
  role: Extract<StaffRole, 'admin' | 'encoder'>;
  adminPassword: string; // Admin must verify with their own password
}

export interface UpdateStaffInput {
  userId: string;
  username: string;
  fullName: string;
  role: Extract<StaffRole, 'admin' | 'encoder'>;
  accountStatus: Extract<AccountStatus, 'active' | 'inactive'>;
}

export interface HealthCardRecord {
  id?: string;
  client_id: string;
  encoder_id: string;
  full_name: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  sex: string;
  date_of_birth: string;
  age: number;
  civil_status: string;
  nationality: string;
  blood_type: string | null;
  contact_number: string;
  email_address: string | null;
  complete_address: string;
  barangay: string;
  city: string;
  province: string;
  years_of_residency: number;
  residency_status: string;
  gps_coordinates: string | null;
  philhealth_number: string;
  national_id_number: string | null;
  guardian_national_id_number: string | null;
  yakap_number: string | null;
  voter_status: string | null;
  senior_citizen_id: string | null;
  pwd_id: string | null;
  household_id: string | null;
  household_head_name: string;
  relationship_to_head: string;
  household_members_count: number;
  guardian_name: string | null;
  emergency_contact_name: string;
  emergency_contact_number: string;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  blood_pressure: string;
  medical_conditions: string | null;
  allergies: string | null;
  maintenance_medicines: string | null;
  is_senior: boolean;
  is_pwd: boolean;
  is_pregnant: boolean;
  is_child_0_5: boolean;
  is_4ps_beneficiary: boolean;
  is_indigent: boolean;
  philhealth_membership_type: string;
  vaccination_status: string;
  tb_hiv_program_notes: string | null;
  photo_url: string | null;
  valid_id_url: string | null;
  barangay_certificate_url: string | null;
  medical_records_url: string | null;
  card_qr_value: string;
  card_number: string;
  created_at?: string;
  updated_at?: string;
}

export interface HealthCardFormValues {
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  sex: string;
  date_of_birth: string;
  civil_status: string;
  nationality: string;
  blood_type: string;
  contact_number: string;
  email_address: string;
  complete_address: string;
  barangay: string;
  city: string;
  province: string;
  years_of_residency: number;
  residency_status: string;
  gps_coordinates: string;
  philhealth_number: string;
  national_id_number: string;
  guardian_national_id_number: string;
  yakap_number: string;
  voter_status: string;
  senior_citizen_id: string;
  pwd_id: string;
  household_id: string;
  household_head_name: string;
  relationship_to_head: string;
  household_members_count: number;
  guardian_name: string;
  emergency_contact_name: string;
  emergency_contact_number: string;
  height_cm: number;
  weight_kg: number;
  blood_pressure: string;
  medical_conditions: string;
  allergies: string;
  maintenance_medicines: string;
  is_senior: boolean;
  is_pwd: boolean;
  is_pregnant: boolean;
  is_child_0_5: boolean;
  is_4ps_beneficiary: boolean;
  is_indigent: boolean;
  philhealth_membership_type: string;
  vaccination_status: string;
  tb_hiv_program_notes: string;
  photo_url: string;
  valid_id_url: string;
  barangay_certificate_url: string;
  medical_records_url: string;
  client_id: string;
}
