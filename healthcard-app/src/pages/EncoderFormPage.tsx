import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { supabaseHealthCardService } from '../services/supabaseHealthCardService';
import { draftService } from '../services/draftService';
import EncoderSidebar from '../components/EncoderSidebar';
import { PH_PROVINCES, getCitiesForProvince } from '../utils/phLocations';
import type { HealthCardFormValues } from '../types/domain';
import './EncoderPortal.css';

const STEPS = [
  { label: 'Personal Info' },
  { label: 'Address' },
  { label: 'Emergency' },
  { label: 'Medical History' },
  { label: 'Employment' },
  { label: 'Insurance' },
  { label: 'Requirements' },
  { label: 'Review' },
];

const defaultValues: HealthCardFormValues = {
  client_id: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  suffix: '',
  sex: 'Male',
  date_of_birth: '',
  civil_status: 'Single',
  nationality: 'Filipino',
  blood_type: '',
  contact_number: '',
  email_address: '',
  complete_address: '',
  barangay: '',
  city: '',
  province: '',
  years_of_residency: 0,
  residency_status: 'Permanent',
  gps_coordinates: '',
  philhealth_number: '',
  national_id_number: '',
  guardian_national_id_number: '',
  yakap_number: '',
  voter_status: '',
  senior_citizen_id: '',
  pwd_id: '',
  household_id: '',
  household_head_name: '',
  relationship_to_head: '',
  household_members_count: 1,
  guardian_name: '',
  emergency_contact_name: '',
  emergency_contact_number: '',
  height_cm: 0,
  weight_kg: 0,
  blood_pressure: '',
  medical_conditions: '',
  allergies: '',
  maintenance_medicines: '',
  is_senior: false,
  is_pwd: false,
  is_pregnant: false,
  is_child_0_5: false,
  is_4ps_beneficiary: false,
  is_indigent: false,
  philhealth_membership_type: 'Sponsored',
  vaccination_status: 'Unknown',
  tb_hiv_program_notes: '',
  photo_url: '',
  valid_id_url: '',
  barangay_certificate_url: '',
  medical_records_url: '',
};

const EncoderFormPage: React.FC = () => {
  const { profile } = useAuth();
  const history = useHistory();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const { register, handleSubmit, watch, reset, trigger, setValue, formState: { errors } } = useForm<HealthCardFormValues>({
    defaultValues,
    mode: 'onTouched',
  });

  const dateOfBirth = watch('date_of_birth');
  const heightCm = watch('height_cm');
  const weightKg = watch('weight_kg');
  const province = watch('province');

  const cities = useMemo(() => getCitiesForProvince(province), [province]);

  // Auto-reset city selection when province changes
  useEffect(() => { setValue('city', ''); }, [province, setValue]);

  // Keep a ref to the current location.search so useIonViewWillEnter can read it
  const locationSearchRef = useRef(location.search);
  useEffect(() => { locationSearchRef.current = location.search; }, [location.search]);

  const loadFormState = useCallback(() => {
    if (!profile) return;
    const draftIdFromQuery = new URLSearchParams(locationSearchRef.current).get('draft');
    if (!draftIdFromQuery) {
      setCurrentDraftId(null);
      reset(defaultValues);
      setStep(0);
      setSubmitErr(null);
      return;
    }
    const draft = draftService.getDraftById(profile.id, draftIdFromQuery);
    if (!draft) {
      setSubmitErr('Draft not found. It may have been deleted.');
      setCurrentDraftId(null);
      reset(defaultValues);
      setStep(0);
      return;
    }
    reset({ ...defaultValues, ...draft.values });
    setStep(Math.min(Math.max(draft.step, 0), STEPS.length - 1));
    setCurrentDraftId(draft.id);
  }, [profile, reset]);

  // Runs every time Ionic shows this page (including back-navigation)
  useIonViewWillEnter(() => {
    loadFormState();
  });

  // Also run on first mount and when query changes (e.g. Resume link)
  useEffect(() => {
    loadFormState();
  }, [loadFormState, location.search]);

  const computed = useMemo(() => {
    if (!dateOfBirth) return { age: '' };
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 0 || age > 150) return { age: '' };
    return { age: String(age) };
  }, [dateOfBirth]);

  const bmi = useMemo(() => {
    if (!heightCm || !weightKg) return '';
    const h = Number(heightCm) / 100;
    return h > 0 ? (Number(weightKg) / (h * h)).toFixed(1) : '';
  }, [heightCm, weightKg]);

  // Fields required per step â€” used for step validation before advancing
  const STEP_REQUIRED_FIELDS: Array<Array<keyof HealthCardFormValues>> = [
    // Step 1 â€” Personal Info
    ['first_name', 'last_name', 'sex', 'date_of_birth', 'civil_status', 'nationality', 'blood_type', 'contact_number', 'email_address'],
    // Step 2 â€” Address
    ['complete_address', 'barangay', 'city', 'province', 'residency_status'],
    // Step 3 â€” Emergency
    ['emergency_contact_name', 'emergency_contact_number', 'relationship_to_head', 'household_head_name', 'household_members_count'],
    // Step 4 â€” Medical History
    ['height_cm', 'weight_kg', 'vaccination_status'],
    // Step 5 â€” Employment (no required fields yet)
    [],
    // Step 6 â€” Insurance
    ['philhealth_number', 'philhealth_membership_type'],
    // Step 7 â€” Requirements
    ['national_id_number'],
    // Step 8 â€” Review
    [],
  ];

  const handleNext = useCallback(async () => {
    const fields = STEP_REQUIRED_FIELDS[step];
    if (fields.length === 0) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      return;
    }
    const valid = await trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, trigger]);

  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  const onSaveDraft = async () => {
    if (!profile) {
      setSubmitErr('Your profile is still loading. Please try again in a moment.');
      return;
    }
    setSavingDraft(true);
    setSubmitErr(null);
    try {
      const nextDraftId = draftService.saveDraft(profile.id, { ...defaultValues, ...watch() }, step, currentDraftId ?? undefined);
      setCurrentDraftId(nextDraftId);
      history.push('/encoder/clients');
    } catch (error) {
      setSubmitErr(error instanceof Error ? error.message : 'Failed to save draft locally.');
    } finally {
      setSavingDraft(false);
    }
  };

  const onFinalSubmit = async (values: HealthCardFormValues) => {
    if (!profile) return;
    setSaving(true);
    setSubmitErr(null);
    try {
      const data = await supabaseHealthCardService.upsertHealthCard(profile.id, values);
      if (!data) throw new Error('Failed to save health card');
      if (currentDraftId) {
        draftService.deleteDraft(profile.id, currentDraftId);
        setCurrentDraftId(null);
      }
      reset(defaultValues);
      setStep(0);
      history.replace('/encoder/register');
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : 'Failed to save health card.');
    } finally {
      setSaving(false);
    }
  };

  // Today's date string for max date validation
  const todayStr = new Date().toISOString().split('T')[0];

  // Philippine mobile: digits only after +63, must be 10 digits starting with 9
  const phPhonePattern = /^9\d{9}$/;

  const Req = () => <span style={{ color: '#ba1a1a', marginLeft: 2 }}>*</span>;
  const ErrMsg = ({ msg }: { msg?: string }) =>
    msg ? <span className="ep-field-error">{msg}</span> : null;

  return (
    <IonPage>
      <IonContent fullscreen scrollY={false}>
        <div className="ep-page">

          {/* â”€â”€ Sidebar â”€â”€ */}
          <EncoderSidebar active="clients" />

          {/* â”€â”€ Main â”€â”€ */}
          <main className="ep-main" style={{ overflowY: 'auto', height: '100vh' }}>
            <div className="ep-reg-wrap">

              {/* Step Progress */}
              <div className="ep-stepper">
                {STEPS.map((s, i) => (
                  <div key={i} className={`ep-step${i === step ? ' active' : i < step ? ' done' : ''}`}>
                    <div className="ep-step-circle" onClick={() => i < step && setStep(i)}>
                      {i < step
                        ? <span className="msym" style={{ fontSize: 16 }}>check</span>
                        : <span>{i + 1}</span>}
                    </div>
                    {i < STEPS.length - 1 && <div className="ep-step-line" />}
                    <span className="ep-step-label">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Form Card */}
              <form className="ep-form-card" onSubmit={handleSubmit(onFinalSubmit)}>

                {/* â”€â”€ Step 1 â€” Personal Info â”€â”€ */}
                {step === 0 && (
                  <>
                    <div className="ep-form-head">
                      <h2>Personal Information</h2>
                      <p>Please provide accurate identification details as they appear on your government IDs. Fields marked <span style={{ color: '#ba1a1a' }}>*</span> are required.</p>
                    </div>
                    <div className="ep-form-grid">
                      <div className="ep-field">
                        <label>First Name <Req /></label>
                        <input
                          placeholder="John"
                          className={errors.first_name ? 'ep-input-err' : ''}
                          {...register('first_name', { required: 'First name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
                        />
                        <ErrMsg msg={errors.first_name?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Last Name <Req /></label>
                        <input
                          placeholder="Doe"
                          className={errors.last_name ? 'ep-input-err' : ''}
                          {...register('last_name', { required: 'Last name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
                        />
                        <ErrMsg msg={errors.last_name?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Middle Name</label>
                        <input placeholder="Quincy" {...register('middle_name')} />
                      </div>
                      <div className="ep-field">
                        <label>Suffix</label>
                        <select {...register('suffix')}>
                          <option value="">None</option>
                          <option>Jr.</option><option>Sr.</option>
                          <option>II</option><option>III</option><option>IV</option>
                        </select>
                      </div>
                      <div className="ep-field">
                        <label>Gender <Req /></label>
                        <select
                          className={errors.sex ? 'ep-input-err' : ''}
                          {...register('sex', { required: 'Gender is required' })}
                        >
                          <option value="">Select</option>
                          <option>Male</option>
                          <option>Female</option>
                        </select>
                        <ErrMsg msg={errors.sex?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Date of Birth <Req /></label>
                        <input
                          type="date"
                          max={todayStr}
                          className={errors.date_of_birth ? 'ep-input-err' : ''}
                          {...register('date_of_birth', {
                            required: 'Date of birth is required',
                            validate: (v) => {
                              const dob = new Date(v);
                              const today = new Date();
                              if (dob >= today) return 'Date of birth must be in the past';
                              let age = today.getFullYear() - dob.getFullYear();
                              const m = today.getMonth() - dob.getMonth();
                              if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
                              if (age > 120) return 'Please enter a valid date of birth';
                              return true;
                            },
                          })}
                        />
                        <ErrMsg msg={errors.date_of_birth?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Age</label>
                        <input readOnly value={computed.age} placeholder="Auto-calculated" className="ep-readonly" />
                      </div>
                      <div className="ep-field">
                        <label>Civil Status <Req /></label>
                        <select
                          className={errors.civil_status ? 'ep-input-err' : ''}
                          {...register('civil_status', { required: 'Civil status is required' })}
                        >
                          <option value="">Select</option>
                          <option>Single</option><option>Married</option>
                          <option>Widowed</option><option>Separated</option>
                        </select>
                        <ErrMsg msg={errors.civil_status?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Nationality <Req /></label>
                        <input
                          className={errors.nationality ? 'ep-input-err' : ''}
                          {...register('nationality', { required: 'Nationality is required' })}
                        />
                        <ErrMsg msg={errors.nationality?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Blood Type <Req /></label>
                        <select
                          className={errors.blood_type ? 'ep-input-err' : ''}
                          {...register('blood_type', { required: 'Blood type is required' })}
                        >
                          <option value="">Select</option>
                          {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t}>{t}</option>)}
                        </select>
                        <ErrMsg msg={errors.blood_type?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Contact Number <Req /></label>
                        <div className={`ep-input-prefix${errors.contact_number ? ' ep-input-prefix-err' : ''}`}>
                          <span>+63</span>
                          <input
                            placeholder="935 035 3134"
                            maxLength={10}
                            {...register('contact_number', {
                              required: 'Contact number is required',
                              pattern: { value: phPhonePattern, message: 'Must be a valid PH mobile number (e.g. 9350353134)' },
                            })}
                          />
                        </div>
                        <ErrMsg msg={errors.contact_number?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Email Address <Req /></label>
                        <input
                          type="email"
                          placeholder="john.doe@example.com"
                          className={errors.email_address ? 'ep-input-err' : ''}
                          {...register('email_address', {
                            required: 'Email is required',
                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
                          })}
                        />
                        <ErrMsg msg={errors.email_address?.message} />
                      </div>
                    </div>
                  </>
                )}

                {/* â”€â”€ Step 2 â€” Address â”€â”€ */}
                {step === 1 && (
                  <>
                    <div className="ep-form-head">
                      <h2>Address & Residency</h2>
                      <p>Provide the client's current residential address and residency details.</p>
                    </div>
                    <div className="ep-form-grid">
                      <div className="ep-field ep-field-full">
                        <label>Complete Address <Req /></label>
                        <input
                          placeholder="House No., Street, Subdivision"
                          className={errors.complete_address ? 'ep-input-err' : ''}
                          {...register('complete_address', { required: 'Complete address is required' })}
                        />
                        <ErrMsg msg={errors.complete_address?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Province <Req /></label>
                        <select
                          className={errors.province ? 'ep-input-err' : ''}
                          {...register('province', { required: 'Province is required' })}
                        >
                          <option value="">Select Province</option>
                          {PH_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <ErrMsg msg={errors.province?.message} />
                      </div>
                      <div className="ep-field">
                        <label>City / Municipality <Req /></label>
                        <select
                          className={errors.city ? 'ep-input-err' : ''}
                          {...register('city', { required: 'City / Municipality is required' })}
                          disabled={cities.length === 0}
                        >
                          <option value="">{cities.length === 0 ? 'Select Province first' : 'Select City / Municipality'}</option>
                          {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ErrMsg msg={errors.city?.message} />
                      </div>
                      <div className="ep-field ep-field-full">
                        <label>Barangay <Req /></label>
                        <input
                          placeholder="Enter barangay name"
                          className={errors.barangay ? 'ep-input-err' : ''}
                          {...register('barangay', { required: 'Barangay is required', minLength: { value: 2, message: 'Enter a valid barangay' } })}
                        />
                        <ErrMsg msg={errors.barangay?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Years of Residency</label>
                        <input
                          type="number" min={0} max={120}
                          {...register('years_of_residency', { min: { value: 0, message: 'Cannot be negative' } })}
                        />
                        <ErrMsg msg={errors.years_of_residency?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Residency Status <Req /></label>
                        <select
                          className={errors.residency_status ? 'ep-input-err' : ''}
                          {...register('residency_status', { required: 'Residency status is required' })}
                        >
                          <option>Permanent</option>
                          <option>Temporary</option>
                          <option>Transient</option>
                        </select>
                        <ErrMsg msg={errors.residency_status?.message} />
                      </div>
                      <div className="ep-field ep-field-full">
                        <label>GPS Coordinates <span style={{ color: '#727784', fontWeight: 400 }}>(optional)</span></label>
                        <input
                          placeholder="e.g. 15.5447, 121.0837"
                          {...register('gps_coordinates', {
                            pattern: { value: /^-?\d{1,3}\.\d+,\s*-?\d{1,3}\.\d+$/, message: 'Format: latitude, longitude (e.g. 15.5447, 121.0837)' },
                          })}
                        />
                        <ErrMsg msg={errors.gps_coordinates?.message} />
                      </div>
                    </div>
                  </>
                )}

                {/* â”€â”€ Step 3 â€” Emergency â”€â”€ */}
                {step === 2 && (
                  <>
                    <div className="ep-form-head">
                      <h2>Emergency Contact & Household</h2>
                      <p>Provide emergency contact details and household information.</p>
                    </div>
                    <div className="ep-form-grid">
                      <div className="ep-field">
                        <label>Emergency Contact Name <Req /></label>
                        <input
                          className={errors.emergency_contact_name ? 'ep-input-err' : ''}
                          {...register('emergency_contact_name', { required: 'Emergency contact name is required' })}
                        />
                        <ErrMsg msg={errors.emergency_contact_name?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Emergency Contact Number <Req /></label>
                        <div className={`ep-input-prefix${errors.emergency_contact_number ? ' ep-input-prefix-err' : ''}`}>
                          <span>+63</span>
                          <input
                            placeholder="935 035 3134"
                            maxLength={10}
                            {...register('emergency_contact_number', {
                              required: 'Emergency contact number is required',
                              pattern: { value: phPhonePattern, message: 'Must be a valid PH mobile number' },
                            })}
                          />
                        </div>
                        <ErrMsg msg={errors.emergency_contact_number?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Guardian Name</label>
                        <input {...register('guardian_name')} />
                      </div>
                      <div className="ep-field">
                        <label>Relationship to Head <Req /></label>
                        <input
                          placeholder="e.g. Son, Daughter, Spouse"
                          className={errors.relationship_to_head ? 'ep-input-err' : ''}
                          {...register('relationship_to_head', { required: 'Relationship to head is required' })}
                        />
                        <ErrMsg msg={errors.relationship_to_head?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Household Head Name <Req /></label>
                        <input
                          className={errors.household_head_name ? 'ep-input-err' : ''}
                          {...register('household_head_name', { required: 'Household head name is required' })}
                        />
                        <ErrMsg msg={errors.household_head_name?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Household ID</label>
                        <input {...register('household_id')} />
                      </div>
                      <div className="ep-field">
                        <label>Household Members Count <Req /></label>
                        <input
                          type="number" min={1} max={50}
                          className={errors.household_members_count ? 'ep-input-err' : ''}
                          {...register('household_members_count', {
                            required: 'Required',
                            min: { value: 1, message: 'At least 1 member' },
                            max: { value: 50, message: 'Maximum 50 members' },
                          })}
                        />
                        <ErrMsg msg={errors.household_members_count?.message} />
                      </div>
                    </div>
                  </>
                )}

                {/* â”€â”€ Step 4 â€” Medical History â”€â”€ */}
                {step === 3 && (
                  <>
                    <div className="ep-form-head">
                      <h2>Medical History</h2>
                      <p>Record the client's health profile and medical classification.</p>
                    </div>
                    <div className="ep-form-grid">
                      <div className="ep-field">
                        <label>Height (cm) <Req /></label>
                        <input
                          type="number" step="0.1" min={50} max={250}
                          className={errors.height_cm ? 'ep-input-err' : ''}
                          {...register('height_cm', {
                            required: 'Height is required',
                            min: { value: 50, message: 'Enter a valid height (50â€“250 cm)' },
                            max: { value: 250, message: 'Enter a valid height (50â€“250 cm)' },
                          })}
                        />
                        <ErrMsg msg={errors.height_cm?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Weight (kg) <Req /></label>
                        <input
                          type="number" step="0.1" min={2} max={300}
                          className={errors.weight_kg ? 'ep-input-err' : ''}
                          {...register('weight_kg', {
                            required: 'Weight is required',
                            min: { value: 2, message: 'Enter a valid weight (2â€“300 kg)' },
                            max: { value: 300, message: 'Enter a valid weight (2â€“300 kg)' },
                          })}
                        />
                        <ErrMsg msg={errors.weight_kg?.message} />
                      </div>
                      <div className="ep-field">
                        <label>BMI</label>
                        <input readOnly value={bmi} placeholder="Auto-calculated" className="ep-readonly" />
                      </div>
                      <div className="ep-field">
                        <label>Blood Pressure</label>
                        <input
                          placeholder="e.g. 120/80"
                          {...register('blood_pressure', {
                            pattern: { value: /^\d{2,3}\/\d{2,3}$/, message: 'Format: systolic/diastolic (e.g. 120/80)' },
                          })}
                        />
                        <ErrMsg msg={errors.blood_pressure?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Vaccination Status <Req /></label>
                        <select
                          className={errors.vaccination_status ? 'ep-input-err' : ''}
                          {...register('vaccination_status', { required: 'Vaccination status is required' })}
                        >
                          <option value="">Select</option>
                          <option>Unknown</option>
                          <option>Fully Vaccinated</option>
                          <option>Partially Vaccinated</option>
                          <option>Not Vaccinated</option>
                        </select>
                        <ErrMsg msg={errors.vaccination_status?.message} />
                      </div>
                      <div className="ep-field ep-field-full">
                        <label>Existing Medical Conditions</label>
                        <textarea rows={3} placeholder="List any known conditions or write 'None'" {...register('medical_conditions')} />
                      </div>
                      <div className="ep-field ep-field-full">
                        <label>Allergies</label>
                        <textarea rows={2} placeholder="List allergies or write 'None'" {...register('allergies')} />
                      </div>
                      <div className="ep-field ep-field-full">
                        <label>Maintenance Medicines</label>
                        <textarea rows={2} placeholder="List medicines or write 'None'" {...register('maintenance_medicines')} />
                      </div>
                      <div className="ep-field ep-field-full">
                        <label>TB / HIV Program Notes</label>
                        <textarea rows={2} {...register('tb_hiv_program_notes')} />
                      </div>
                      <div className="ep-field ep-field-full">
                        <label>Medical Classification</label>
                        <div className="ep-checkbox-row">
                          <label className="ep-check"><input type="checkbox" {...register('is_senior')} /> Senior Citizen</label>
                          <label className="ep-check"><input type="checkbox" {...register('is_pwd')} /> PWD</label>
                          <label className="ep-check"><input type="checkbox" {...register('is_pregnant')} /> Pregnant</label>
                          <label className="ep-check"><input type="checkbox" {...register('is_child_0_5')} /> Child (0â€“5)</label>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* â”€â”€ Step 5 â€” Employment â”€â”€ */}
                {step === 4 && (
                  <>
                    <div className="ep-form-head">
                      <h2>Employment Information</h2>
                      <p>Provide the client's current employment or livelihood details.</p>
                    </div>
                    <div className="ep-form-grid">
                      <div className="ep-field ep-field-full ep-placeholder-notice">
                        <span className="msym">info</span>
                        Employment fields will be added in the next update. Proceed to the next step.
                      </div>
                    </div>
                  </>
                )}

                {/* â”€â”€ Step 6 â€” Insurance â”€â”€ */}
                {step === 5 && (
                  <>
                    <div className="ep-form-head">
                      <h2>Insurance & Program Eligibility</h2>
                      <p>Record PhilHealth and government program eligibility information.</p>
                    </div>
                    <div className="ep-form-grid">
                      <div className="ep-field">
                        <label>PhilHealth Number <Req /></label>
                        <input
                          placeholder="00-000000000-0"
                          className={errors.philhealth_number ? 'ep-input-err' : ''}
                          {...register('philhealth_number', {
                            required: 'PhilHealth number is required',
                            pattern: { value: /^\d{2}-\d{9}-\d{1}$/, message: 'Format: 00-000000000-0' },
                          })}
                        />
                        <ErrMsg msg={errors.philhealth_number?.message} />
                      </div>
                      <div className="ep-field">
                        <label>PhilHealth Membership Type <Req /></label>
                        <select
                          className={errors.philhealth_membership_type ? 'ep-input-err' : ''}
                          {...register('philhealth_membership_type', { required: 'Membership type is required' })}
                        >
                          <option value="">Select</option>
                          <option>Sponsored</option>
                          <option>Employed</option>
                          <option>Self-Employed</option>
                          <option>Indigent</option>
                        </select>
                        <ErrMsg msg={errors.philhealth_membership_type?.message} />
                      </div>
                      <div className="ep-field ep-field-full">
                        <label>Program Eligibility</label>
                        <div className="ep-checkbox-row">
                          <label className="ep-check"><input type="checkbox" {...register('is_4ps_beneficiary')} /> 4Ps Beneficiary</label>
                          <label className="ep-check"><input type="checkbox" {...register('is_indigent')} /> Indigent</label>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* â”€â”€ Step 7 â€” Requirements â”€â”€ */}
                {step === 6 && (
                  <>
                    <div className="ep-form-head">
                      <h2>Government IDs & Documents</h2>
                      <p>Enter government ID numbers and document reference URLs.</p>
                    </div>
                    <div className="ep-form-grid">
                      <div className="ep-field">
                        <label>National ID (PSN) <Req /></label>
                        <input
                          placeholder="0000-0000000-0"
                          className={errors.national_id_number ? 'ep-input-err' : ''}
                          {...register('national_id_number', { required: 'National ID is required' })}
                        />
                        <ErrMsg msg={errors.national_id_number?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Guardian National ID <span style={{ color: '#727784', fontWeight: 400 }}>(if minor)</span></label>
                        <input {...register('guardian_national_id_number')} />
                      </div>
                      <div className="ep-field">
                        <label>YAKAP Number</label>
                        <input {...register('yakap_number')} />
                      </div>
                      <div className="ep-field">
                        <label>Voter ID / Status</label>
                        <input {...register('voter_status')} />
                      </div>
                      <div className="ep-field">
                        <label>Senior Citizen ID</label>
                        <input {...register('senior_citizen_id')} />
                      </div>
                      <div className="ep-field">
                        <label>PWD ID</label>
                        <input {...register('pwd_id')} />
                      </div>
                      <div className="ep-field ep-field-full ep-section-sub">Document Attachments (URL references)</div>
                      <div className="ep-field">
                        <label>2Ã—2 Photo URL</label>
                        <input
                          placeholder="https://..."
                          {...register('photo_url', {
                            pattern: { value: /^https?:\/\/.+/, message: 'Must be a valid URL' },
                          })}
                        />
                        <ErrMsg msg={errors.photo_url?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Valid ID URL</label>
                        <input
                          placeholder="https://..."
                          {...register('valid_id_url', {
                            pattern: { value: /^https?:\/\/.+/, message: 'Must be a valid URL' },
                          })}
                        />
                        <ErrMsg msg={errors.valid_id_url?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Barangay Certificate URL</label>
                        <input
                          placeholder="https://..."
                          {...register('barangay_certificate_url', {
                            pattern: { value: /^https?:\/\/.+/, message: 'Must be a valid URL' },
                          })}
                        />
                        <ErrMsg msg={errors.barangay_certificate_url?.message} />
                      </div>
                      <div className="ep-field">
                        <label>Medical Records URL</label>
                        <input
                          placeholder="https://..."
                          {...register('medical_records_url', {
                            pattern: { value: /^https?:\/\/.+/, message: 'Must be a valid URL' },
                          })}
                        />
                        <ErrMsg msg={errors.medical_records_url?.message} />
                      </div>
                    </div>
                  </>
                )}

                {/* â”€â”€ Step 8 â€” Review â”€â”€ */}
                {step === 7 && (
                  <>
                    <div className="ep-form-head">
                      <h2>Review & Submit</h2>
                      <p>Review the information below before submitting the health card record.</p>
                    </div>
                    <div className="ep-review-grid">
                      {[
                        ['Full Name', `${watch('first_name')} ${watch('middle_name')} ${watch('last_name')} ${watch('suffix')}`.trim()],
                        ['Gender', watch('sex')],
                        ['Date of Birth', watch('date_of_birth')],
                        ['Age', computed.age],
                        ['Civil Status', watch('civil_status')],
                        ['Nationality', watch('nationality')],
                        ['Blood Type', watch('blood_type')],
                        ['Contact Number', `+63 ${watch('contact_number')}`],
                        ['Email', watch('email_address')],
                        ['Address', `${watch('complete_address')}, ${watch('barangay')}, ${watch('city')}, ${watch('province')}`],
                        ['Emergency Contact', `${watch('emergency_contact_name')} - +63 ${watch('emergency_contact_number')}`],
                        ['PhilHealth No.', watch('philhealth_number')],
                        ['PhilHealth Type', watch('philhealth_membership_type')],
                        ['National ID', watch('national_id_number')],
                      ].map(([k, v]) => (
                        <div className="ep-review-row" key={k}>
                          <span className="ep-review-key">{k}</span>
                          <span className="ep-review-val">{v || <em style={{ color: '#aaa' }}>â€”</em>}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

              </form>

              {/* Bottom Bar */}
              <div className="ep-form-footer">
                <button type="button" className="ep-btn-draft" onClick={onSaveDraft} disabled={savingDraft}>
                  <span className="msym">save</span>
                  {savingDraft ? 'Saving...' : 'Save as Draft'}
                </button>
                {submitErr && (
                  <div className="ep-form-feedback">
                    <p className="ep-error-msg" style={{ margin: 0 }}>{submitErr}</p>
                  </div>
                )}
                <div className="ep-form-footer-right">
                  {step > 0 && (
                    <button type="button" className="ep-btn-back" onClick={goPrev}>
                      Back
                    </button>
                  )}
                  {step < STEPS.length - 1 ? (
                    <button type="button" className="ep-btn-next" onClick={handleNext}>
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="ep-btn-next"
                      onClick={handleSubmit(onFinalSubmit)}
                      disabled={saving}
                    >
                      {saving ? 'Submitting...' : 'Submit'}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EncoderFormPage;
