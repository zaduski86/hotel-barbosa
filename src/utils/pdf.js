import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { fmt } from './format'

export function gerarReciboPDF(reserva, consumos = [], pagamentos = []) {
  const doc = new jsPDF()

  // Header
  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, 210, 32, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.text('Hotel Barbosa 24 Horas', 14, 14)
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text('Recibo de Hospedagem', 14, 22)
  doc.text(`Código: ${reserva.codigo || '—'}`, 14, 28)

  // Info da reserva
  doc.setTextColor(30, 37, 53)
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.text('Dados da Hospedagem', 14, 44)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)

  const info = [
    ['Hóspede', reserva.hospedes?.nome || '—'],
    ['CPF', fmt.cpf(reserva.hospedes?.cpf)],
    ['Quarto', `${reserva.quartos?.numero || '—'} — ${reserva.quartos?.nome || ''}`],
    ['Check-in', fmt.date(reserva.data_entrada)],
    ['Check-out', fmt.date(reserva.data_saida)],
    ['Total de diárias', `${reserva.total_diarias} noite(s)`],
    ['Valor da diária', fmt.money(reserva.valor_diaria)],
  ]

  let y = 50
  info.forEach(([k, v]) => {
    doc.setTextColor(120, 130, 150)
    doc.text(k + ':', 14, y)
    doc.setTextColor(30, 37, 53)
    doc.text(String(v), 65, y)
    y += 7
  })

  // Consumos
  if (consumos.length > 0) {
    doc.setFont(undefined, 'bold')
    doc.setFontSize(11)
    doc.setTextColor(30, 37, 53)
    doc.text('Consumos', 14, y + 6)

    autoTable(doc, {
      startY: y + 10,
      head: [['Item', 'Qtd', 'Valor Unit.', 'Total']],
      body: consumos.map(c => [c.nome_item, c.quantidade, fmt.money(c.valor_unitario), fmt.money(c.valor_total)]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // Totais
  const totalConsumos = consumos.reduce((s, c) => s + Number(c.valor_total), 0)
  const totalPago = pagamentos.filter(p => p.status === 'pago').reduce((s, p) => s + Number(p.valor), 0)
  const totalGeral = Number(reserva.valor_total) + totalConsumos
  const saldo = totalGeral - totalPago

  doc.setFillColor(248, 250, 252)
  doc.rect(14, y, 182, 38, 'F')
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  doc.setTextColor(90, 100, 120)
  doc.text('Hospedagem:', 18, y + 9)
  doc.text('Consumos:', 18, y + 17)
  doc.setFont(undefined, 'bold')
  doc.text('Total Geral:', 18, y + 27)
  doc.text('Pago:', 18, y + 35)

  doc.setFont(undefined, 'normal')
  doc.setTextColor(30, 37, 53)
  doc.text(fmt.money(reserva.valor_total), 196, y + 9, { align: 'right' })
  doc.text(fmt.money(totalConsumos), 196, y + 17, { align: 'right' })
  doc.setFont(undefined, 'bold')
  doc.text(fmt.money(totalGeral), 196, y + 27, { align: 'right' })
  doc.setTextColor(saldo > 0 ? 220 : 22, saldo > 0 ? 38 : 163, saldo > 0 ? 38 : 74)
  doc.text(fmt.money(totalPago), 196, y + 35, { align: 'right' })

  if (saldo > 0) {
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text(`Saldo devedor: ${fmt.money(saldo)}`, 196, y + 43, { align: 'right' })
  }

  // Footer
  const pageH = doc.internal.pageSize.height
  doc.setFont(undefined, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(150, 160, 180)
  doc.text(`Emitido em ${fmt.datetime(new Date())}`, 14, pageH - 10)
  doc.text('Hotel Barbosa 24 Horas — Sistema de Gestão', 196, pageH - 10, { align: 'right' })

  return doc
}

export function baixarRecibo(reserva, consumos, pagamentos) {
  const doc = gerarReciboPDF(reserva, consumos, pagamentos)
  doc.save(`recibo-${reserva.codigo || reserva.id}.pdf`)
}

export function gerarLinkWhatsApp(telefone, reserva, pdfBlob) {
  const msg = encodeURIComponent(
    `Olá ${reserva.hospedes?.nome?.split(' ')[0] || ''}! Segue o recibo da sua hospedagem no Hotel Barbosa 24 Horas.\n\n` +
    `📋 Código: ${reserva.codigo}\n` +
    `🛏️ Quarto: ${reserva.quartos?.numero}\n` +
    `📅 ${fmt.date(reserva.data_entrada)} → ${fmt.date(reserva.data_saida)}\n` +
    `💰 Total: ${fmt.money(reserva.valor_total)}\n\n` +
    `Obrigado pela preferência! 🏨`
  )
  const num = telefone?.replace(/\D/g, '')
  return `https://wa.me/55${num}?text=${msg}`
}
