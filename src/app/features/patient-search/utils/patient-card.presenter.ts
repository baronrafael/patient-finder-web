const AVATAR_PALETTE: ReadonlyArray<{ readonly background: string; readonly color: string }> = [
  { background: '#ccfbf1', color: '#115e59' },
  { background: '#e0e7ff', color: '#3730a3' },
  { background: '#fce7f3', color: '#9d174d' },
  { background: '#ffedd5', color: '#9a3412' },
  { background: '#dbeafe', color: '#1e40af' },
  { background: '#f3e8ff', color: '#6b21a8' },
];

export function getPatientInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  const first = parts[0][0] ?? '';
  const last = parts[parts.length - 1][0] ?? '';
  return `${first}${last}`.toUpperCase();
}

export function getHospitalAvatarColors(hospitalId: string): { background: string; color: string } {
  let hash = 0;
  for (let index = 0; index < hospitalId.length; index += 1) {
    hash = (hash + hospitalId.charCodeAt(index) * (index + 1)) % AVATAR_PALETTE.length;
  }

  return AVATAR_PALETTE[hash] ?? AVATAR_PALETTE[0];
}
