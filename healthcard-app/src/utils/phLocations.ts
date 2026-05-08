// Philippine location data helpers using ph-locations
import ph from 'ph-locations';

type PhProvince = { code: string; name: string; altName: string | null; region: string };
type PhCity = { name: string; fullName: string; province: string; classification: string };

const provinces: PhProvince[] = (ph as { provinces: PhProvince[] }).provinces;
const cities: PhCity[] = (ph as { citiesMunicipalities: PhCity[] }).citiesMunicipalities;

export const PH_PROVINCES: string[] = [...provinces]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((p) => p.name);

export function getCitiesForProvince(provinceName: string): string[] {
  const prov = provinces.find(
    (p) => p.name.toLowerCase() === provinceName.toLowerCase(),
  );
  if (!prov) return [];
  return [...cities]
    .filter((c) => c.province === prov.code)
    .map((c) => c.name)
    .sort((a, b) => a.localeCompare(b));
}

// Barangay data from PSGC is too large to bundle — we use a representative list
// and allow free-text fallback. For real production, call PSGC API.
export const COMMON_BARANGAYS = [
  'Barangay 1', 'Barangay 2', 'Barangay 3', 'Poblacion', 'San Jose',
  'San Pedro', 'San Juan', 'Santo Niño', 'Bagong Silang', 'Maligaya',
  'Pag-asa', 'Bagumbayan', 'Makiling', 'Maharlika', 'Kalikasan',
];
