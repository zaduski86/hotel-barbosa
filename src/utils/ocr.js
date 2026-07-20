import { createWorker } from 'tesseract.js'

export async function runOCR(imageFile) {
  try {
    const worker = await createWorker('por')
    const { data: { text } } = await worker.recognize(imageFile)
    await worker.terminate()
    if (text && text.trim().length > 10) {
      return parseOCRText(text)
    }
    throw new Error('OCR primário retornou resultado vazio')
  } catch (err) {
    console.warn('Tesseract falhou, usando Claude como fallback:', err)
    return await claudeOCRFallback(imageFile)
  }
}

function parseOCRText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  
  // Extrair valor monetário
  const valorMatch = text.match(/R\$\s*([\d.,]+)/i) || text.match(/([\d]{1,3}[.,][\d]{2})/g)
  const valor = valorMatch ? parseFloat(valorMatch[1]?.replace('.', '').replace(',', '.') || valorMatch[0]?.replace(',', '.')) : null

  // Extrair data
  const dataMatch = text.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})/)
  const data = dataMatch ? `${dataMatch[3].length === 2 ? '20' + dataMatch[3] : dataMatch[3]}-${dataMatch[2]}-${dataMatch[1]}` : null

  // Extrair fornecedor (primeira linha não-vazia geralmente)
  const fornecedor = lines[0] || null

  // Detectar categoria
  let categoria = 'outros'
  const textLower = text.toLowerCase()
  if (textLower.includes('mercado') || textLower.includes('supermercado') || textLower.includes('aliment')) categoria = 'alimentacao'
  else if (textLower.includes('limpeza') || textLower.includes('material')) categoria = 'limpeza'
  else if (textLower.includes('luz') || textLower.includes('energia') || textLower.includes('agua') || textLower.includes('gas')) categoria = 'utilidades'
  else if (textLower.includes('manutencao') || textLower.includes('reparo') || textLower.includes('conserto')) categoria = 'manutencao'

  return { valor, data, fornecedor, categoria, textoCompleto: text, fonte: 'tesseract' }
}

async function claudeOCRFallback(imageFile) {
  try {
    const base64 = await fileToBase64(imageFile)
    const mediaType = imageFile.type || 'image/jpeg'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: 'Analise esta nota fiscal ou comprovante e retorne APENAS um JSON com os campos: valor (número), data (YYYY-MM-DD), fornecedor (string), categoria (alimentacao|limpeza|utilidades|manutencao|servicos|outros). Sem explicações, apenas o JSON.' }
          ]
        }]
      })
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || '{}'
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return { ...parsed, fonte: 'claude' }
  } catch (e) {
    return { valor: null, data: null, fornecedor: null, categoria: 'outros', fonte: 'falhou' }
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
