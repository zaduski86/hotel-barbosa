export function RoomIcon({ tipo, color = 'currentColor', size = 60 }) {
  const h = Math.round(size * 0.93)

  if (tipo === 'single') return (
    <svg width={size} height={h} viewBox="0 0 60 56" fill="none">
      <path d="M30 4L56 20V52H4V20L30 4Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <rect x="20" y="32" width="20" height="20" rx="1" stroke={color} strokeWidth="1.5"/>
      <rect x="23" y="36" width="14" height="10" rx="1" stroke={color} strokeWidth="1.5"/>
      <path d="M20 40h20" stroke={color} strokeWidth="1.5"/>
      <circle cx="30" cy="15" r="3" stroke={color} strokeWidth="1.5"/>
    </svg>
  )

  if (tipo === 'duplo') return (
    <svg width={size} height={h} viewBox="0 0 60 56" fill="none">
      <path d="M30 4L56 20V52H4V20L30 4Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <rect x="10" y="32" width="40" height="20" rx="1" stroke={color} strokeWidth="1.5"/>
      <rect x="13" y="36" width="15" height="10" rx="1" stroke={color} strokeWidth="1.5"/>
      <rect x="32" y="36" width="15" height="10" rx="1" stroke={color} strokeWidth="1.5"/>
      <path d="M10 40h40" stroke={color} strokeWidth="1.5"/>
      <circle cx="30" cy="15" r="3" stroke={color} strokeWidth="1.5"/>
    </svg>
  )

  if (tipo === 'triplo') return (
    <svg width={size} height={h} viewBox="0 0 60 56" fill="none">
      <path d="M30 4L56 20V52H4V20L30 4Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <rect x="6" y="34" width="48" height="18" rx="1" stroke={color} strokeWidth="1.5"/>
      <rect x="9" y="37" width="12" height="9" rx="1" stroke={color} strokeWidth="1.5"/>
      <rect x="24" y="37" width="12" height="9" rx="1" stroke={color} strokeWidth="1.5"/>
      <rect x="39" y="37" width="12" height="9" rx="1" stroke={color} strokeWidth="1.5"/>
      <path d="M6 41h48" stroke={color} strokeWidth="1.5"/>
      <circle cx="30" cy="15" r="3" stroke={color} strokeWidth="1.5"/>
    </svg>
  )

  if (tipo === 'suite' || tipo === 'suite_master') return (
    <svg width={size} height={h} viewBox="0 0 60 56" fill="none">
      <path d="M30 4L56 20V52H4V20L30 4Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <rect x="10" y="30" width="40" height="22" rx="1" stroke={color} strokeWidth="1.5"/>
      <rect x="13" y="34" width="15" height="12" rx="1" stroke={color} strokeWidth="1.5"/>
      <rect x="32" y="34" width="15" height="12" rx="1" stroke={color} strokeWidth="1.5"/>
      <path d="M10 38h40" stroke={color} strokeWidth="1.5"/>
      <path d="M22 30v-4a8 8 0 0116 0v4" stroke={color} strokeWidth="1.5"/>
      <circle cx="30" cy="15" r="3" stroke={color} strokeWidth="1.5"/>
      {tipo === 'suite_master' && <path d="M26 16.5l1.5 1.5L31 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>}
    </svg>
  )

  return (
    <svg width={size} height={h} viewBox="0 0 60 56" fill="none">
      <path d="M30 4L56 20V52H4V20L30 4Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <rect x="10" y="32" width="40" height="20" rx="1" stroke={color} strokeWidth="1.5"/>
      <rect x="13" y="36" width="15" height="10" rx="1" stroke={color} strokeWidth="1.5"/>
      <rect x="32" y="36" width="15" height="10" rx="1" stroke={color} strokeWidth="1.5"/>
      <path d="M10 40h40" stroke={color} strokeWidth="1.5"/>
    </svg>
  )
}

export const statusColors = {
  disponivel: '#16a34a',
  ocupado: '#1d4ed8',
  limpeza: '#b45309',
  manutencao: '#dc2626',
  bloqueado: '#6b7280',
  pre_reserva: '#7c3aed',
}
