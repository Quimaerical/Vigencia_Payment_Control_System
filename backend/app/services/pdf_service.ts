import { createHash } from 'node:crypto'

/**
 * Escapa caracteres especiales de texto para literales PDF y normaliza acentos
 * al mapa WinAnsiEncoding de las fuentes estándar Type1 (Helvetica / Courier).
 */
function escaparTextoPdf(texto: string): string {
  const mapaAcentos: Record<string, string> = {
    á: 'a',
    é: 'e',
    í: 'i',
    ó: 'o',
    ú: 'u',
    Á: 'A',
    É: 'E',
    Í: 'I',
    Ó: 'O',
    Ú: 'U',
    ñ: 'n',
    Ñ: 'N',
    ü: 'u',
    Ü: 'U',
  }
  const limpio = texto.replace(/[áéíóúÁÉÍÓÚñÑüÜ]/g, (ch) => mapaAcentos[ch] ?? ch)
  return limpio.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

/**
 * Construye un documento binario PDF 1.4 estándar a partir de una lista de líneas
 * estructuradas, sin requerir dependencias externas ni acceso a red.
 */
export function construirDocumentoPdf14(titulo: string, lineas: string[]): Buffer {
  const comandosContenido: string[] = [
    'BT',
    '/F2 13 Tf',
    '50 760 Td',
    `(${escaparTextoPdf('UNIVERSIDAD DE CARABOBO - FACYT - ESCUELA DE COMPUTACION')}) Tj`,
    '0 -18 Td',
    '/F2 11 Tf',
    `(${escaparTextoPdf('VIGENCIA PAYMENT CONTROL SYSTEM (CONTROL DE PAGOS Y ASIGNACIONES)')}) Tj`,
    '0 -22 Td',
    '/F2 12 Tf',
    `(${escaparTextoPdf(titulo)}) Tj`,
    '0 -18 Td',
    '/F1 9 Tf',
  ]

  for (const linea of lineas) {
    comandosContenido.push(`(${escaparTextoPdf(linea)}) Tj`)
    comandosContenido.push('0 -13 Td')
  }

  comandosContenido.push('ET')
  const streamTexto = comandosContenido.join('\n')
  const streamBytes = Buffer.byteLength(streamTexto, 'utf8')

  const objetos: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    `6 0 obj\n<< /Length ${streamBytes} >>\nstream\n${streamTexto}\nendstream\nendobj\n`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]

  for (const obj of objetos) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += obj
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objetos.length + 1}\n`
  pdf += '0000000000 65535 f \n'

  for (let i = 1; i < offsets.length; i++) {
    const offStr = String(offsets[i]).padStart(10, '0')
    pdf += `${offStr} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  return Buffer.from(pdf, 'utf8')
}

export interface DatosReciboPagoPdf {
  pagoId: number
  fechaPago: string
  estado: string
  metodoPago: string
  numeroReferencia: string | null
  montoTotal: number
  beneficiarioNombre: string
  beneficiarioIdentificacion: string
  operadorUsername: string
  solicitudCodigo: string | null
  amortizaciones: Array<{
    deudaId: number
    proyectoCodigo: string
    fechaVencimiento: string
    montoAplicado: number
  }>
}

export function generarReciboPagoPdf(datos: DatosReciboPagoPdf): Buffer {
  const huella = createHash('sha256')
    .update(
      `PAGO:${datos.pagoId}:${datos.beneficiarioIdentificacion}:${datos.montoTotal}:${datos.fechaPago}`
    )
    .digest('hex')
    .slice(0, 24)

  const lineas: string[] = [
    '------------------------------------------------------------------------',
    `Recibo Individual Nro : #REC-${String(datos.pagoId).padStart(5, '0')}`,
    `Fecha de Pago         : ${datos.fechaPago}`,
    `Estado del Registro   : ${datos.estado.toUpperCase()}`,
    `Beneficiario          : ${datos.beneficiarioNombre} (${datos.beneficiarioIdentificacion})`,
    `Metodo de Pago        : ${datos.metodoPago.toUpperCase()}`,
    `Referencia Comprobante: ${datos.numeroReferencia ?? 'N/A'}`,
    `Solicitud Asociada    : ${datos.solicitudCodigo ?? 'PAGO DIRECTO FIFO'}`,
    `Registrado por (Rec.) : ${datos.operadorUsername}`,
    '------------------------------------------------------------------------',
    'DETALLE DE IMPUTACION FIFO SOBRE DEUDAS / CAUSACIONES:',
    'ID Deuda   Proyecto       Vencimiento      Monto Aplicado (USD)',
    '------------------------------------------------------------------------',
  ]

  for (const item of datos.amortizaciones) {
    const colId = `#${item.deudaId}`.padEnd(10, ' ')
    const colProy = item.proyectoCodigo.slice(0, 13).padEnd(14, ' ')
    const colVenc = item.fechaVencimiento.padEnd(16, ' ')
    const colMonto = `$ ${item.montoAplicado.toFixed(2)} USD`
    lineas.push(`${colId} ${colProy} ${colVenc} ${colMonto}`)
  }

  lineas.push('------------------------------------------------------------------------')
  lineas.push(`MONTO TOTAL ENTREGADO : $ ${datos.montoTotal.toFixed(2)} USD (SIN DEDUCCIONES)`)
  lineas.push('------------------------------------------------------------------------')
  lineas.push(`Huella Forense SHA-256: ${huella}`)
  lineas.push(`Generado en           : ${new Date().toISOString()}`)

  return construirDocumentoPdf14('RECIBO INDIVIDUAL DE PAGO DE ASIGNACIONES (USD)', lineas)
}

export interface DatosSolicitudConsolidadaPdf {
  solicitudId: number
  codigo: string
  proyectoCodigo: string
  proyectoNombre: string
  proyectoArea: string
  periodoInicio: string
  periodoFin: string
  estado: string
  montoTotal: number
  creadoPorUsername: string
  revisadoPorUsername: string | null
  causaciones: Array<{
    deudaId: number
    beneficiarioIdentificacion: string
    beneficiarioNombre: string
    diasActivos: number | null
    diasPeriodo: number | null
    montoOriginal: number
    saldoPendiente: number
    estado: string
  }>
}

export function generarSolicitudConsolidadaPdf(datos: DatosSolicitudConsolidadaPdf): Buffer {
  const huella = createHash('sha256')
    .update(`SOL:${datos.solicitudId}:${datos.codigo}:${datos.montoTotal}:${datos.estado}`)
    .digest('hex')
    .slice(0, 24)

  const lineas: string[] = [
    '------------------------------------------------------------------------',
    `Codigo de Solicitud   : ${datos.codigo} (ID #${datos.solicitudId})`,
    `Proyecto              : [${datos.proyectoCodigo}] ${datos.proyectoNombre}`,
    `Area Cientifica       : ${datos.proyectoArea.toUpperCase()}`,
    `Periodo Consolidado   : ${datos.periodoInicio} al ${datos.periodoFin}`,
    `Estado de Solicitud   : ${datos.estado.toUpperCase()}`,
    `Generado por          : ${datos.creadoPorUsername}`,
    `Revisado / Aprob. por : ${datos.revisadoPorUsername ?? 'PENDIENTE DE REVISION'}`,
    '------------------------------------------------------------------------',
    'RELACION CONSOLIDADA DE CAUSACIONES Y PRORRATEO POR BENEFICIARIO:',
    'Identificacion  Beneficiario           Dias    Causado (USD)  Saldo (USD)',
    '------------------------------------------------------------------------',
  ]

  for (const c of datos.causaciones) {
    const colId = c.beneficiarioIdentificacion.slice(0, 14).padEnd(15, ' ')
    const colNom = c.beneficiarioNombre.slice(0, 21).padEnd(22, ' ')
    const colDias = `${c.diasActivos ?? '-'}/${c.diasPeriodo ?? '-'}`.padEnd(7, ' ')
    const colCausado = `$${c.montoOriginal.toFixed(2)}`.padEnd(14, ' ')
    const colSaldo = `$${c.saldoPendiente.toFixed(2)}`
    lineas.push(`${colId} ${colNom} ${colDias} ${colCausado} ${colSaldo}`)
  }

  lineas.push('------------------------------------------------------------------------')
  lineas.push(`MONTO TOTAL CONSOLIDADO DE LA SOLICITUD: $ ${datos.montoTotal.toFixed(2)} USD`)
  lineas.push('------------------------------------------------------------------------')
  lineas.push(`Huella Forense SHA-256: ${huella}`)
  lineas.push(`Generado en           : ${new Date().toISOString()}`)

  return construirDocumentoPdf14('SOLICITUD CONSOLIDADA DE PAGO Y CAUSACION (USD)', lineas)
}
