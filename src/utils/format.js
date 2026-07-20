import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)
dayjs.locale('pt-br')

export const fmt = {
  money: (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  date: (d) => d ? dayjs(d).format('DD/MM/YYYY') : '—',
  datetime: (d) => d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—',
  time: (d) => d ? dayjs(d).format('HH:mm') : '—',
  cpf: (v) => v?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || v || '—',
  tel: (v) => v || '—',
  relative: (d) => d ? dayjs(d).fromNow() : '—',
}

export const statusReservaMap = {
  pre_reserva: { label: 'Pré-reserva', badge: 'badge-purple' },
  confirmada: { label: 'Confirmada', badge: 'badge-blue' },
  checkin: { label: 'Hospedado', badge: 'badge-green' },
  checkout: { label: 'Check-out', badge: 'badge-gray' },
  cancelada: { label: 'Cancelada', badge: 'badge-red' },
}

export const statusQuartoMap = {
  disponivel: { label: 'Disponível', badge: 'badge-green' },
  ocupado: { label: 'Ocupado', badge: 'badge-blue' },
  limpeza: { label: 'Limpeza', badge: 'badge-amber' },
  manutencao: { label: 'Manutenção', badge: 'badge-red' },
  bloqueado: { label: 'Bloqueado', badge: 'badge-gray' },
  pre_reserva: { label: 'Pré-reserva', badge: 'badge-purple' },
}

export const tipoQuartoMap = {
  single: 'Single',
  duplo: 'Duplo',
  triplo: 'Triplo',
  suite: 'Suíte',
  suite_master: 'Suíte Master',
}

export const metodoPagMap = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  transferencia: 'Transferência',
}

export const dayjs_ = dayjs
