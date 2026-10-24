export interface ColorOption {
  bg: string;
  text: string;
  border: string;
  ring: string;
}

export const AVATAR_PALETTE: ColorOption[] = [
  { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700', ring: 'ring-blue-300' },
  { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700', ring: 'ring-emerald-300' },
  { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600', ring: 'ring-amber-300' },
  { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-700', ring: 'ring-rose-300' },
  { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700', ring: 'ring-purple-300' },
  { bg: 'bg-cyan-600', text: 'text-white', border: 'border-cyan-700', ring: 'ring-cyan-300' },
  { bg: 'bg-lime-600', text: 'text-white', border: 'border-lime-700', ring: 'ring-lime-300' },
  { bg: 'bg-fuchsia-600', text: 'text-white', border: 'border-fuchsia-700', ring: 'ring-fuchsia-300' },
  { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-700', ring: 'ring-indigo-300' },
  { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600', ring: 'ring-orange-300' },
  { bg: 'bg-teal-600', text: 'text-white', border: 'border-teal-700', ring: 'ring-teal-300' },
  { bg: 'bg-pink-600', text: 'text-white', border: 'border-pink-700', ring: 'ring-pink-300' },
];

export function getParticipantColor(name: string, index?: number): ColorOption {
  // If a valid index is provided, use direct palette indexing for guaranteed unique sequential colors
  if (index !== undefined && index >= 0) {
    return AVATAR_PALETTE[index % AVATAR_PALETTE.length];
  }
  // Deterministic color based on string hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const colorIndex = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[colorIndex];
}
