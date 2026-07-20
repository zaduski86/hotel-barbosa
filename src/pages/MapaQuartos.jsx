import { useState, useEffect, useCallback } from 'react'
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { supabase } from '../lib/supabase'
import { Calendar, Plus, Eye, LogOut, Check, X, MoreHorizontal, ArrowUpDown } from 'lucide-react'
import { RoomIcon, statusColors } from '../components/ui/RoomIcon'
import { fmt, statusQuartoMap } from '../utils/format'
import { ModalNovaReserva, ModalCheckout, ModalDetalhesReserva } from './Pages'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

function DraggableRoom({ quarto, onAction }) {
  const status = quarto.status_efetivo || quarto.status
  const color = statusColors[status] || statusColors.disponivel
  const s = statusQuartoMap[status] || statusQuartoMap.disponivel
  const reserva = quarto.reserva_ativa

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: quarto.id,
    disabled: !['ocupado', 'checkin'].includes(status),
    data: { quarto }
  })

  return (
    <div
      ref={setNodeRef}
      className={`room-card status-${status} ${isDragging ? 'dragging' : ''}`}
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <div className="room-card-header">
        <span className="room-number">Quarto {quarto.numero}</span>
        <span className={`badge ${s.badge}`} style={{ fontSize: '10px', padding: '2px 7px' }}>{s.label}</span>
      </div>

      <div
        className="room-card-icon"
        {...(reserva ? { ...attributes, ...listeners, style: { cursor: 'grab', touchAction: 'none' } } : {})}
        title={reserva ? 'Arraste para trocar de quarto' : ''}
      >
        <RoomIcon tipo={quarto.tipo} color={color} size={58} />
      </div>

      <div className="room-card-info">
        {reserva ? (
          <>
            <div className="room-guest-name">{reserva.hospedes?.nome || '—'}</div>
            <div className="room-guest-dates">
              <Calendar size={11} />
              {fmt.date(reserva.data_entrada)} → {fmt.date(reserva.data_saida)}
            </div>
            <div className="pag-indicator" style={{ marginTop: 4 }}>
              <span className={`pag-dot ${reserva.status_pagamento}`}></span>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                {reserva.status_pagamento === 'pago' ? 'Pago' : reserva.status_pagamento === 'parcial' ? 'Parcial' : 'Pendente'}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="room-guest-name" style={{ color: 'var(--text3)', fontWeight: 400 }}>
              {status === 'limpeza' ? 'Em limpeza' : status === 'manutencao' ? 'Manutenção' : status === 'bloqueado' ? 'Bloqueado' : 'Disponível'}
            </div>
            <div className="room-guest-dates" style={{ color: 'var(--text3)' }}>
              {fmt.money(quarto.preco_diaria)}/noite
            </div>
          </>
        )}
      </div>

      <div className="room-card-footer">
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{quarto.tipo?.toUpperCase()}</div>
        <div className="room-actions">
          {status === 'disponivel' && (
            <div className="room-action-btn" title="Nova reserva" onClick={() => onAction('nova_reserva', quarto)}>
              <Plus size={13} />
            </div>
          )}
          {(status === 'ocupado' || status === 'checkin') && (
            <>
              <div className="room-action-btn" title="Ver detalhes" onClick={() => onAction('ver', quarto)}>
                <Eye size={13} />
              </div>
              <div className="room-action-btn" title="Check-out" onClick={() => onAction('checkout', quarto)}>
                <LogOut size={13} />
              </div>
            </>
          )}
          {status === 'pre_reserva' && (
            <>
              <div className="room-action-btn" title="Confirmar reserva" onClick={() => onAction('confirmar', quarto)}>
                <Check size={13} />
              </div>
              <div className="room-action-btn" title="Cancelar" onClick={() => onAction('cancelar', quarto)}>
                <X size={13} />
              </div>
            </>
          )}
          {status === 'limpeza' && (
            <div className="room-action-btn" title="Marcar como disponível" onClick={() => onAction('disponivel', quarto)}>
              <Check size={13} />
            </div>
          )}
          <div className="room-action-btn" title="Editar status" onClick={() => onAction('status', quarto)}>
            <MoreHorizontal size={13} />
          </div>
        </div>
      </div>
    </div>
  )
}

function DroppableRoom({ quarto, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'drop-' + quarto.id, data: { quarto } })
  const canDrop = quarto.status === 'disponivel'

  return (
    <div ref={setNodeRef} style={{ outline: isOver && canDrop ? '2px dashed var(--accent)' : 'none', borderRadius: 14, transition: 'outline .15s' }}>
      {children}
    </div>
  )
}

export default function MapaQuartos() {
  const [quartos, setQuartos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [dragAtivo, setDragAtivo] = useState(null)
  const [modalStatus, setModalStatus] = useState(null)
  const [modalNovaReserva, setModalNovaReserva] = useState(null)
  const [modalDetalhes, setModalDetalhes] = useState(null)
  const [modalCheckout, setModalCheckout] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const load = useCallback(async () => {
    const hoje = dayjs().format('YYYY-MM-DD')
    const { data: quartosData } = await supabase.from('quartos').select('*').eq('ativo', true).order('ordem')
    const { data: reservasData } = await supabase
      .from('reservas')
      .select('*, hospedes(nome, telefone)')
      .in('status', ['confirmada', 'checkin', 'pre_reserva'])
      .lte('data_entrada', hoje)
      .gte('data_saida', hoje)

    const quartosComReserva = (quartosData || []).map(q => {
      const reserva = (reservasData || []).find(r => r.quarto_id === q.id)
      return {
        ...q,
        reserva_ativa: reserva || null,
        status_efetivo: reserva ? (reserva.status === 'checkin' ? 'ocupado' : reserva.status === 'pre_reserva' ? 'pre_reserva' : 'ocupado') : q.status
      }
    })
    setQuartos(quartosComReserva)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const counts = {
    todos: quartos.length,
    disponivel: quartos.filter(q => q.status_efetivo === 'disponivel').length,
    ocupado: quartos.filter(q => q.status_efetivo === 'ocupado').length,
    limpeza: quartos.filter(q => q.status === 'limpeza').length,
    pre_reserva: quartos.filter(q => q.status_efetivo === 'pre_reserva').length,
  }

  const quartosFiltrados = filtro === 'todos' ? quartos : quartos.filter(q => (q.status_efetivo || q.status) === filtro)

  const handleAction = async (action, quarto) => {
    if (action === 'nova_reserva') { setModalNovaReserva(quarto); return }
    if (action === 'ver') { setModalDetalhes({ ...quarto.reserva_ativa, quartos: { numero: quarto.numero } }); return }
    if (action === 'status') { setModalStatus(quarto); return }
    if (action === 'disponivel') {
      await supabase.from('quartos').update({ status: 'disponivel' }).eq('id', quarto.id)
      toast.success('Quarto marcado como disponível')
      load()
      return
    }
    if (action === 'checkout') { setModalCheckout(quarto.reserva_ativa); return }
    if (action === 'confirmar') {
      await supabase.from('reservas').update({ status: 'confirmada' }).eq('id', quarto.reserva_ativa?.id)
      toast.success('Reserva confirmada!')
      load()
      return
    }
    if (action === 'cancelar') {
      if (!confirm('Cancelar esta reserva?')) return
      await supabase.from('reservas').update({ status: 'cancelada' }).eq('id', quarto.reserva_ativa?.id)
      await supabase.from('quartos').update({ status: 'disponivel' }).eq('id', quarto.id)
      toast.success('Reserva cancelada')
      load()
    }
  }

  const handleDragEnd = async ({ active, over }) => {
    setDragAtivo(null)
    if (!over) return
    const quartoOrigem = active.data.current?.quarto
    const quartoDestino = over.data.current?.quarto
    if (!quartoOrigem || !quartoDestino) return
    if (quartoDestino.status !== 'disponivel') { toast.error('Quarto de destino não está disponível'); return }
    if (quartoOrigem.id === quartoDestino.id) return

    const reserva = quartoOrigem.reserva_ativa
    if (!reserva) return

    await supabase.from('reservas').update({ quarto_id: quartoDestino.id }).eq('id', reserva.id)
    await supabase.from('quartos').update({ status: 'disponivel' }).eq('id', quartoOrigem.id)
    toast.success(`${reserva.hospedes?.nome} movido para o quarto ${quartoDestino.numero}!`)
    load()
  }

  if (loading) return <div className="loading-center"><div className="spinner"></div> Carregando quartos...</div>

  return (
    <div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 16 }}>
        {[
          { label: 'Total', val: counts.todos, color: 'var(--text)' },
          { label: 'Disponíveis', val: counts.disponivel, color: 'var(--green)' },
          { label: 'Ocupados', val: counts.ocupado, color: 'var(--blue)' },
          { label: 'Limpeza', val: counts.limpeza, color: 'var(--amber)' },
          { label: 'Pré-reserva', val: counts.pre_reserva, color: 'var(--purple)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: '12px 14px' }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: 22, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="filters-bar">
        {[
          { key: 'todos', label: `Todos (${counts.todos})` },
          { key: 'disponivel', label: `Disponíveis (${counts.disponivel})`, cls: 'green' },
          { key: 'ocupado', label: `Ocupados (${counts.ocupado})`, cls: 'blue' },
          { key: 'limpeza', label: `Limpeza (${counts.limpeza})`, cls: 'amber' },
          { key: 'pre_reserva', label: `Pré-reserva (${counts.pre_reserva})`, cls: 'purple' },
        ].map(f => (
          <button key={f.key} className={`filter-chip ${f.cls || ''} ${filtro === f.key ? 'active' : ''}`} onClick={() => setFiltro(f.key)}>{f.label}</button>
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={e => setDragAtivo(e.active.data.current?.quarto)} onDragEnd={handleDragEnd}>
        <div className="rooms-grid">
          {quartosFiltrados.map(quarto => (
            <DroppableRoom key={quarto.id} quarto={quarto}>
              <DraggableRoom quarto={quarto} onAction={handleAction} />
            </DroppableRoom>
          ))}
        </div>

        <DragOverlay>
          {dragAtivo && (
            <div style={{ opacity: .9, transform: 'scale(1.05)', boxShadow: 'var(--shadow-lg)' }}>
              <DraggableRoom quarto={dragAtivo} onAction={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <ArrowUpDown size={16} color="var(--text3)" />
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>Arraste o ícone da casinha para trocar o hóspede de quarto instantaneamente</span>
      </div>

      {modalStatus && <ModalAlterarStatus quarto={modalStatus} onClose={() => setModalStatus(null)} onSave={() => { setModalStatus(null); load() }} />}
      {modalNovaReserva && <ModalNovaReserva quartoInicial={modalNovaReserva} onClose={() => setModalNovaReserva(null)} onSave={() => { setModalNovaReserva(null); load() }} />}
      {modalDetalhes && <ModalDetalhesReserva reserva={modalDetalhes} onClose={() => setModalDetalhes(null)} />}
      {modalCheckout && <ModalCheckout reserva={modalCheckout} onClose={() => setModalCheckout(null)} onSave={() => { setModalCheckout(null); load() }} />}
    </div>
  )
}

function ModalAlterarStatus({ quarto, onClose, onSave }) {
  const [status, setStatus] = useState(quarto.status)
  const [loading, setLoading] = useState(false)

  const salvar = async () => {
    setLoading(true)
    await supabase.from('quartos').update({ status }).eq('id', quarto.id)
    toast.success('Status atualizado!')
    setLoading(false)
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Quarto {quarto.numero} — Status</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {['disponivel', 'limpeza', 'manutencao', 'bloqueado'].map(s => {
            const info = statusQuartoMap[s]
            return (
              <div key={s} onClick={() => setStatus(s)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 6, background: status === s ? 'var(--accent-light)' : 'var(--surface2)', border: `1px solid ${status === s ? 'var(--accent)' : 'var(--border)'}` }}>
                <span className={`badge ${info.badge}`}>{info.label}</span>
              </div>
            )
          })}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={loading}>{loading ? <span className="spinner"></span> : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}
