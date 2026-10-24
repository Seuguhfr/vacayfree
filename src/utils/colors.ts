export interface ColorOption {
  bg: string;
  text: string;
  border: string;
  ring: string;
}

export const AVATAR_PALETTE: ColorOption[] = [
  { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-600', ring: 'ring-indigo-300' },
  { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700', ring: 'ring-emerald-300' },
  { bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-700', ring: 'ring-amber-300' },
  { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600', ring: 'ring-rose-300' },
  { bg: 'bg-teal-600', text: 'text-white', border: 'border-teal-700', ring: 'ring-teal-300' },
  { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700', ring: 'ring-purple-300' },
  { bg: 'bg-sky-600', text: 'text-white', border: 'border-sky-700', ring: 'ring-sky-300' },
  { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600', ring: 'ring-orange-300' },
];

export function getParticipantColor(name: string, index: number = 0): ColorOption {
  // Deterministic color based on string hash + index
  let hash = index;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const colorIndex = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[colorIndex];
}
