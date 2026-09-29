// Alert radius constant in km for spatial neighborhood and containment analysis
export const ALERT_RADIUS_KM = 150;

// 36 Maharashtra Districts locked spellings grouped by 6 administrative divisions
export interface DistrictInfo {
  name: string;
  division: 'Konkan' | 'Pune' | 'Nashik' | 'Chhatrapati Sambhajinagar' | 'Amravati' | 'Nagpur';
  aliases?: string[];
  lat: number;
  lng: number;
  risk_override_level?: 'low' | 'medium' | 'high' | 'critical' | null;
}

export const MAHARASHTRA_DIVISIONS = [
  'Konkan',
  'Pune',
  'Nashik',
  'Chhatrapati Sambhajinagar',
  'Amravati',
  'Nagpur',
] as const;

export type DivisionName = (typeof MAHARASHTRA_DIVISIONS)[number];

export const MAHARASHTRA_DISTRICTS: DistrictInfo[] = [
  // Konkan Division (7)
  { name: 'Mumbai City', division: 'Konkan', lat: 18.96, lng: 72.82 },
  { name: 'Mumbai Suburban', division: 'Konkan', lat: 19.13, lng: 72.87 },
  { name: 'Thane', division: 'Konkan', lat: 19.21, lng: 72.97 },
  { name: 'Palghar', division: 'Konkan', lat: 19.69, lng: 72.76 },
  { name: 'Raigad', division: 'Konkan', lat: 18.51, lng: 73.18 },
  { name: 'Ratnagiri', division: 'Konkan', lat: 16.99, lng: 73.30 },
  { name: 'Sindhudurg', division: 'Konkan', lat: 16.12, lng: 73.72 },

  // Pune Division (5)
  { name: 'Pune', division: 'Pune', lat: 18.52, lng: 73.85 },
  { name: 'Satara', division: 'Pune', lat: 17.68, lng: 73.99 },
  { name: 'Sangli', division: 'Pune', lat: 16.85, lng: 74.57 },
  { name: 'Solapur', division: 'Pune', lat: 17.66, lng: 75.90 },
  { name: 'Kolhapur', division: 'Pune', lat: 16.70, lng: 74.24 },

  // Nashik Division (5)
  { name: 'Nashik', division: 'Nashik', lat: 19.99, lng: 73.78 },
  { name: 'Dhule', division: 'Nashik', lat: 20.90, lng: 74.77 },
  { name: 'Nandurbar', division: 'Nashik', lat: 21.37, lng: 74.24 },
  { name: 'Jalgaon', division: 'Nashik', lat: 21.00, lng: 75.56 },
  { name: 'Ahmednagar', division: 'Nashik', lat: 19.09, lng: 74.74 },

  // Chhatrapati Sambhajinagar Division (8)
  {
    name: 'Chhatrapati Sambhajinagar',
    division: 'Chhatrapati Sambhajinagar',
    aliases: ['Aurangabad'],
    lat: 19.87,
    lng: 75.34,
  },
  { name: 'Jalna', division: 'Chhatrapati Sambhajinagar', lat: 19.83, lng: 75.88 },
  { name: 'Beed', division: 'Chhatrapati Sambhajinagar', lat: 18.98, lng: 75.76 },
  { name: 'Latur', division: 'Chhatrapati Sambhajinagar', lat: 18.40, lng: 76.56 },
  {
    name: 'Dharashiv',
    division: 'Chhatrapati Sambhajinagar',
    aliases: ['Osmanabad'],
    lat: 18.18,
    lng: 76.04,
  },
  { name: 'Nanded', division: 'Chhatrapati Sambhajinagar', lat: 19.15, lng: 77.30 },
  { name: 'Parbhani', division: 'Chhatrapati Sambhajinagar', lat: 19.26, lng: 76.77 },
  { name: 'Hingoli', division: 'Chhatrapati Sambhajinagar', lat: 19.72, lng: 77.14 },

  // Amravati Division (5)
  { name: 'Amravati', division: 'Amravati', lat: 20.93, lng: 77.75 },
  { name: 'Akola', division: 'Amravati', lat: 20.70, lng: 77.00 },
  { name: 'Washim', division: 'Amravati', lat: 20.10, lng: 77.13 },
  { name: 'Buldhana', division: 'Amravati', lat: 20.52, lng: 76.18 },
  { name: 'Yavatmal', division: 'Amravati', lat: 20.39, lng: 78.12 },

  // Nagpur Division (6)
  { name: 'Nagpur', division: 'Nagpur', lat: 21.14, lng: 79.08 },
  { name: 'Wardha', division: 'Nagpur', lat: 20.74, lng: 78.60 },
  { name: 'Bhandara', division: 'Nagpur', lat: 21.17, lng: 79.65 },
  { name: 'Gondia', division: 'Nagpur', lat: 21.45, lng: 80.20 },
  { name: 'Chandrapur', division: 'Nagpur', lat: 19.96, lng: 79.29 },
  { name: 'Gadchiroli', division: 'Nagpur', lat: 20.18, lng: 79.99 },
];

export const DISTRICT_NAMES = MAHARASHTRA_DISTRICTS.map((d) => d.name);

export function findDistrict(query: string): DistrictInfo | undefined {
  const q = query.trim().toLowerCase();
  return MAHARASHTRA_DISTRICTS.find(
    (d) =>
      d.name.toLowerCase() === q ||
      (d.aliases && d.aliases.some((a) => a.toLowerCase() === q))
  );
}

export function isValidDistrict(name: string): boolean {
  return findDistrict(name) !== undefined;
}

