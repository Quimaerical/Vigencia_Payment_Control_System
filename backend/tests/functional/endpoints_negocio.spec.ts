import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Usuario from '#models/usuario'
import {
  RolUsuario,
  AreaProyecto,
  AmbitoProyecto,
  PeriodicidadGrupoPago,
  MetodoPago,
  EstadoSolicitud,
  EstadoPago,
  EstadoCajaChica,
  EstadoValeCaja,
} from '@app/shared'

test.group(
  'Punto B — Endpoints de Catálogos, Causación, Solicitudes, Cajas Chicas y PDFs',
  (group) => {
    group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

    test('flujo integral de catálogos, prorrateo por lote, ciclo de solicitudes, pago FIFO, anulación y PDFs', async ({
      client,
      assert,
    }) => {
      const sufijo = Date.now()

      const admin = await Usuario.create({
        username: `admin_b_${sufijo}`,
        passwordHash: 'PasswordSeguro123!',
        rol: RolUsuario.ADMINISTRADOR,
        estaActivo: true,
      })

      // 1. El Administrador crea Usuarios (Generador y Receptor) y un Grupo de Pago vía API
      const respCrearGen = await client
        .post('/api/v1/usuarios')
        .loginAs(admin)
        .json({
          username: `gen_b_${sufijo}`,
          password: 'PasswordSeguro123!',
          rol: RolUsuario.GENERADOR,
        })
      respCrearGen.assertStatus(201)
      const generador = await Usuario.findOrFail(
        (respCrearGen.body() as { data: { id: number } }).data.id
      )

      const respCrearRec = await client
        .post('/api/v1/usuarios')
        .loginAs(admin)
        .json({
          username: `rec_b_${sufijo}`,
          password: 'PasswordSeguro123!',
          rol: RolUsuario.RECEPTOR,
        })
      respCrearRec.assertStatus(201)
      const receptor = await Usuario.findOrFail(
        (respCrearRec.body() as { data: { id: number } }).data.id
      )

      const respGrupo = await client
        .post('/api/v1/grupos-pago')
        .loginAs(admin)
        .json({
          nombre: `Quincenal-B-${sufijo}`,
          descripcion: 'Quincenal 15 días',
          periodicidad: PeriodicidadGrupoPago.QUINCENAL,
          diaCorte1: 15,
          diaCorte2: 30,
        })
      respGrupo.assertStatus(201)
      const grupoPagoId = (respGrupo.body() as { data: { id: number } }).data.id

      // Segregación RBAC: el Administrador recibe 403 si intenta crear un proyecto o una causación
      const respAdminProy = await client
        .post('/api/v1/proyectos')
        .loginAs(admin)
        .json({
          codigo: `PROY-ADM-${sufijo}`,
          nombre: 'Proyecto Prohibido Admin',
          area: AreaProyecto.FISICA,
          ambito: AmbitoProyecto.INTERNO,
        })
      respAdminProy.assertStatus(403)

      // 2. El Generador crea Persona (beneficiario), Proyecto y Asignación
      const respPersona = await client
        .post('/api/v1/personas')
        .loginAs(generador)
        .json({
          identificacion: `V-BEN-${sufijo}`,
          nombres: 'Gabriela',
          apellidos: 'Mendoza',
          correo: `gmendoza_${sufijo}@uc.edu.ve`,
        })
      respPersona.assertStatus(201)
      const personaId = (respPersona.body() as { data: { id: number } }).data.id

      const respProyecto = await client
        .post('/api/v1/proyectos')
        .loginAs(generador)
        .json({
          codigo: `PROY-FIS-${sufijo}`,
          nombre: 'Óptica Cuántica Experimental',
          area: AreaProyecto.FISICA,
          ambito: AreaProyecto.FISICA ? AmbitoProyecto.INTERNO : AmbitoProyecto.EXTERNO,
          fechaInicio: '2026-01-01',
          fechaFin: '2026-12-31',
        })
      respProyecto.assertStatus(201)
      const proyectoId = (respProyecto.body() as { data: { id: number } }).data.id

      // Asignación con inicio el día 6 del mes para probar prorrateo (10 días activos de 15 días del período = 200 USD de 300 USD)
      const respAsignacion = await client.post('/api/v1/asignaciones').loginAs(generador).json({
        personaId,
        proyectoId,
        grupoPagoId,
        montoPeriodo: 300,
        fechaInicio: '2026-11-06',
      })
      respAsignacion.assertStatus(201)

      // 3. Simulador y Generación de Causación por Lote (del 2026-11-01 al 2026-11-15 -> 15 días totales, 10 activos -> $200.00)
      const respSim = await client.post('/api/v1/causaciones/simular').loginAs(generador).json({
        montoPeriodo: 300,
        diasActivos: 10,
        diasPeriodo: 15,
      })
      respSim.assertStatus(200)
      assert.equal((respSim.body() as { montoCausado: number }).montoCausado, 200)

      const respLote = await client
        .post('/api/v1/causaciones/lote')
        .loginAs(generador)
        .json({
          proyectoId,
          grupoPagoId,
          periodoInicio: '2026-11-01',
          periodoFin: '2026-11-15',
          fechaVencimiento: '2026-11-15',
          crearSolicitud: true,
          codigoSolicitud: `SOL-LOTE-${sufijo}`,
        })
      respLote.assertStatus(201)
      const bodyLote = respLote.body() as {
        cantidadCausaciones: number
        montoTotalLote: number
        solicitudPago: { id: number; estado: string }
        causaciones: Array<{ id: number; diasActivos: number; diasPeriodo: number }>
      }
      assert.equal(bodyLote.cantidadCausaciones, 1)
      assert.equal(bodyLote.montoTotalLote, 200)
      assert.equal(bodyLote.causaciones[0].diasActivos, 10)
      assert.equal(bodyLote.causaciones[0].diasPeriodo, 15)

      const solicitudId = bodyLote.solicitudPago.id
      const deudaId = bodyLote.causaciones[0].id

      // 4. Ciclo de Solicitud de Pago: creacion -> envio (Generador) -> aprobacion (Receptor)
      const respEnviar = await client
        .patch(`/api/v1/solicitudes-pago/${solicitudId}/enviar`)
        .loginAs(generador)
      respEnviar.assertStatus(200)
      assert.equal(
        (respEnviar.body() as { data: { estado: string } }).data.estado,
        EstadoSolicitud.ENVIO
      )

      const respAprobar = await client
        .patch(`/api/v1/solicitudes-pago/${solicitudId}/aprobar`)
        .loginAs(receptor)
      respAprobar.assertStatus(200)
      assert.equal(
        (respAprobar.body() as { data: { estado: string } }).data.estado,
        EstadoSolicitud.APROBACION
      )

      // 5. Pago parcial FIFO (Receptor) -> Anulación justificada (restitución de saldo) -> Pago total -> Cierre de Solicitud
      const respPagoParcial = await client
        .post('/api/v1/pagos')
        .loginAs(receptor)
        .json({
          personaId,
          proyectoId,
          solicitudId,
          montoTotal: 120,
          metodoPago: MetodoPago.TRANSFERENCIA,
          numeroReferencia: `REF-PARCIAL-${sufijo}`,
          fechaPago: '2026-11-15',
        })
      respPagoParcial.assertStatus(201)
      const pagoParcialId = (respPagoParcial.body() as { pagoId: number }).pagoId

      // Anular justificadamente el pago parcial y verificar que el saldo de la deuda vuelve a $200.00
      const respAnularPago = await client
        .post(`/api/v1/pagos/${pagoParcialId}/anular`)
        .loginAs(receptor)
        .json({
          motivoAnulacion: 'Error en cuenta bancaria receptora del comprobante',
        })
      respAnularPago.assertStatus(200)
      const bodyAnular = respAnularPago.body() as {
        data: { estado: string }
        deudasRestituidas: Array<{ deudaId: number; nuevoSaldo: number }>
      }
      assert.equal(bodyAnular.data.estado, EstadoPago.ANULADO)
      assert.equal(bodyAnular.deudasRestituidas[0].deudaId, deudaId)
      assert.equal(bodyAnular.deudasRestituidas[0].nuevoSaldo, 200)

      // Registrar el pago definitivo por los $200.00 completos
      const respPagoFinal = await client
        .post('/api/v1/pagos')
        .loginAs(receptor)
        .json({
          personaId,
          proyectoId,
          solicitudId,
          montoTotal: 200,
          metodoPago: MetodoPago.ZELLE,
          numeroReferencia: `REF-FINAL-${sufijo}`,
          fechaPago: '2026-11-16',
        })
      respPagoFinal.assertStatus(201)
      const pagoFinalId = (respPagoFinal.body() as { pagoId: number }).pagoId

      // Cerrar la solicitud de pago ahora que todas sus deudas están liquidadas
      const respCerrarSol = await client
        .patch(`/api/v1/solicitudes-pago/${solicitudId}/cerrar`)
        .loginAs(receptor)
      respCerrarSol.assertStatus(200)
      assert.equal(
        (respCerrarSol.body() as { data: { estado: string } }).data.estado,
        EstadoSolicitud.CIERRE
      )

      // 6. Descarga de PDFs: Recibo Individual de Pago y Solicitud Consolidada
      const respPdfRecibo = await client
        .get(`/api/v1/reportes/pagos/${pagoFinalId}/recibo.pdf`)
        .loginAs(receptor)
      respPdfRecibo.assertStatus(200)
      assert.include(respPdfRecibo.header('content-type') ?? '', 'application/pdf')
      const pdfReciboStr =
        respPdfRecibo.text() ?? Buffer.from(respPdfRecibo.body() as Buffer).toString('utf8')
      assert.isTrue(pdfReciboStr.startsWith('%PDF-1.4'))

      const respPdfSol = await client
        .get(`/api/v1/reportes/solicitudes/${solicitudId}/consolidado.pdf`)
        .loginAs(generador)
      respPdfSol.assertStatus(200)
      assert.include(respPdfSol.header('content-type') ?? '', 'application/pdf')
      const pdfSolStr =
        respPdfSol.text() ?? Buffer.from(respPdfSol.body() as Buffer).toString('utf8')
      assert.isTrue(pdfSolStr.startsWith('%PDF-1.4'))

      // 7. Reporte Resumen y Visor de Audit Logs
      const respResumen = await client.get('/api/v1/reportes/resumen').loginAs(generador)
      respResumen.assertStatus(200)
      assert.isNumber((respResumen.body() as { kpis: { totalCausado: number } }).kpis.totalCausado)

      const respAudit = await client
        .get('/api/v1/audit-logs?tablaAfectada=solicitudes_pago')
        .loginAs(admin)
      respAudit.assertStatus(200)
      assert.isAbove((respAudit.body() as { data: unknown[] }).data.length, 0)
    })

    test('control de cajas chicas: apertura, vales, aprobación, desembolso, rendición, cierre y arrastre de saldo al mes siguiente', async ({
      client,
      assert,
    }) => {
      const sufijo = Date.now() + 10

      const generador = await Usuario.create({
        username: `gen_cc_${sufijo}`,
        passwordHash: 'PasswordSeguro123!',
        rol: RolUsuario.GENERADOR,
        estaActivo: true,
      })

      const receptor = await Usuario.create({
        username: `rec_cc_${sufijo}`,
        passwordHash: 'PasswordSeguro123!',
        rol: RolUsuario.RECEPTOR,
        estaActivo: true,
      })

      const respPersona = await client
        .post('/api/v1/personas')
        .loginAs(generador)
        .json({
          identificacion: `V-CC-${sufijo}`,
          nombres: 'Roberto',
          apellidos: 'Químico',
        })
      const personaId = (respPersona.body() as { data: { id: number } }).data.id

      const respProyecto = await client
        .post('/api/v1/proyectos')
        .loginAs(generador)
        .json({
          codigo: `PROY-CC-${sufijo}`,
          nombre: 'Bioquímica Aplicada',
          area: AreaProyecto.BIOLOGIA,
          ambito: AmbitoProyecto.INTERNO,
        })
      const proyectoId = (respProyecto.body() as { data: { id: number } }).data.id

      // 1. Abrir Caja Chica Mes 10 con $300.00 asignados
      const respAbrirMes10 = await client
        .post('/api/v1/cajas-chicas')
        .loginAs(generador)
        .json({
          codigo: `CC-M10-${sufijo}`,
          nombre: 'Caja Chica Octubre',
          proyectoId,
          anio: 2026,
          mes: 10,
          montoAsignado: 300,
        })
      respAbrirMes10.assertStatus(201)
      const cajaMes10Id = (respAbrirMes10.body() as { data: { id: number } }).data.id

      // 2. Solicitar un vale por $100.00
      const respVale = await client
        .post(`/api/v1/cajas-chicas/${cajaMes10Id}/vales`)
        .loginAs(generador)
        .json({
          solicitantePersonaId: personaId,
          montoSolicitado: 100,
          concepto: 'Compra de solventes de urgencia',
        })
      respVale.assertStatus(201)
      const valeId = (respVale.body() as { data: { id: number } }).data.id

      // Intentar cerrar la caja con vale pendiente debe fallar con 422
      const respCerrarTemprano = await client
        .patch(`/api/v1/cajas-chicas/${cajaMes10Id}/cerrar`)
        .loginAs(generador)
      respCerrarTemprano.assertStatus(422)

      // 3. Aprobar y desembolsar el vale (Receptor) -> Saldo en caja baja a $200.00
      const respAprobarVale = await client
        .patch(`/api/v1/vales-caja/${valeId}/aprobar`)
        .loginAs(receptor)
      respAprobarVale.assertStatus(200)

      const respDesembolsar = await client
        .patch(`/api/v1/vales-caja/${valeId}/desembolsar`)
        .loginAs(receptor)
      respDesembolsar.assertStatus(200)
      assert.equal((respDesembolsar.body() as { saldoCajaRestante: number }).saldoCajaRestante, 200)

      // 4. Rendir el vale con comprobante por $85.00 (solo Receptor; el Generador recibe 403)
      const respRendirGen = await client
        .patch(`/api/v1/vales-caja/${valeId}/rendir`)
        .loginAs(generador)
        .json({
          montoRendido: 85,
          comprobanteReferencia: `FACT-CC-${sufijo}`,
        })
      respRendirGen.assertStatus(403)

      const respRendir = await client
        .patch(`/api/v1/vales-caja/${valeId}/rendir`)
        .loginAs(receptor)
        .json({
          montoRendido: 85,
          comprobanteReferencia: `FACT-CC-${sufijo}`,
        })
      respRendir.assertStatus(200)
      const bodyRendir = respRendir.body() as {
        data: { estado: string }
        saldoCajaActualizado: number
      }
      assert.equal(bodyRendir.data.estado, EstadoValeCaja.RENDIDO)
      assert.equal(bodyRendir.saldoCajaActualizado, 215)

      // 5. Cerrar Caja Chica Mes 10
      const respCerrarMes10 = await client
        .patch(`/api/v1/cajas-chicas/${cajaMes10Id}/cerrar`)
        .loginAs(generador)
      respCerrarMes10.assertStatus(200)
      assert.equal(
        (respCerrarMes10.body() as { data: { estado: string } }).data.estado,
        EstadoCajaChica.CERRADA
      )

      // 6. Abrir Caja Chica Mes 11 arrastrando los $215.00 del Mes 10 + $100.00 nuevos = $315.00 disponibles
      const respAbrirMes11 = await client
        .post('/api/v1/cajas-chicas')
        .loginAs(generador)
        .json({
          codigo: `CC-M11-${sufijo}`,
          nombre: 'Caja Chica Noviembre con Arrastre',
          proyectoId,
          cajaOrigenId: cajaMes10Id,
          anio: 2026,
          mes: 11,
          montoAsignado: 100,
        })
      respAbrirMes11.assertStatus(201)
      const cajaMes11 = (
        respAbrirMes11.body() as {
          data: { saldoInicial: number; montoAsignado: number; saldoActual: number }
        }
      ).data
      assert.equal(Number(cajaMes11.saldoInicial), 215)
      assert.equal(Number(cajaMes11.montoAsignado), 100)
      assert.equal(Number(cajaMes11.saldoActual), 315)
    })
  }
)

/**
 * [concurrencia] Sin transacción global (ADR 0010 §4): las dos causaciones por lote
 * simultáneas deben competir en conexiones distintas; dentro de una transacción global
 * compartirían conexión y la prueba pasaría aunque el bloqueo estuviera roto.
 */
test.group('[concurrencia] Seguridad y causación por lote simultánea', () => {
  test('seguridad: sin registro público, tokens revocados al desactivar usuario, audit-logs solo admin y concurrencia en causación por lote', async ({
    client,
    assert,
  }) => {
    const sufijo = Date.now() + 20

    // 1. Verificar que no existe registro público
    const respRegPublico = await client.post('/api/v1/auth/registro').json({
      username: `atacante_${sufijo}`,
      password: 'PasswordSeguro123!',
    })
    respRegPublico.assertStatus(404)

    const admin = await Usuario.create({
      username: `admin_sec_${sufijo}`,
      passwordHash: 'PasswordSeguro123!',
      rol: RolUsuario.ADMINISTRADOR,
      estaActivo: true,
    })

    const generador = await Usuario.create({
      username: `gen_sec_${sufijo}`,
      passwordHash: 'PasswordSeguro123!',
      rol: RolUsuario.GENERADOR,
      estaActivo: true,
    })

    // 2. Audit logs restringidos a Administrador (Generador recibe 403)
    const respAuditGen = await client.get('/api/v1/audit-logs').loginAs(generador)
    respAuditGen.assertStatus(403)

    // 3. Concurrencia en causaciones/lote: dos peticiones simultáneas no deben duplicar causaciones
    const respGrupo = await client
      .post('/api/v1/grupos-pago')
      .loginAs(admin)
      .json({
        nombre: `Conc-Grupo-${sufijo}`,
        periodicidad: PeriodicidadGrupoPago.MENSUAL,
        diaCorte1: 30,
      })
    const grupoPagoId = (respGrupo.body() as { data: { id: number } }).data.id

    const respPersona = await client
      .post('/api/v1/personas')
      .loginAs(generador)
      .json({
        identificacion: `V-CONC-${sufijo}`,
        nombres: 'Lucía',
        apellidos: 'Física',
      })
    const personaId = (respPersona.body() as { data: { id: number } }).data.id

    const respProyecto = await client
      .post('/api/v1/proyectos')
      .loginAs(generador)
      .json({
        codigo: `PROY-CONC-${sufijo}`,
        nombre: 'Física Nuclear',
        area: AreaProyecto.FISICA,
        ambito: AmbitoProyecto.INTERNO,
      })
    const proyectoId = (respProyecto.body() as { data: { id: number } }).data.id

    await client.post('/api/v1/asignaciones').loginAs(generador).json({
      personaId,
      proyectoId,
      grupoPagoId,
      montoPeriodo: 500,
      fechaInicio: '2026-11-01',
    })

    const [lote1, lote2] = await Promise.all([
      client.post('/api/v1/causaciones/lote').loginAs(generador).json({
        proyectoId,
        grupoPagoId,
        periodoInicio: '2026-11-01',
        periodoFin: '2026-11-30',
      }),
      client.post('/api/v1/causaciones/lote').loginAs(generador).json({
        proyectoId,
        grupoPagoId,
        periodoInicio: '2026-11-01',
        periodoFin: '2026-11-30',
      }),
    ])

    const statuses = [lote1.status(), lote2.status()].sort()
    assert.deepEqual(statuses, [201, 422])

    // 4. Desactivar usuario revoca sus tokens activos
    const tokenGen = await Usuario.accessTokens.create(generador)
    const bearer = tokenGen.value!.release()

    const respAntes = await client.get('/api/v1/proyectos').bearerToken(bearer)
    respAntes.assertStatus(200)

    const respDesactivar = await client
      .patch(`/api/v1/usuarios/${generador.id}/estado`)
      .loginAs(admin)
      .json({ estaActivo: false })
    respDesactivar.assertStatus(200)

    const respDespues = await client.get('/api/v1/proyectos').bearerToken(bearer)
    respDespues.assertStatus(401)
  })

  test('impide anular pagos de solicitudes cerradas y vales de cajas chicas cerradas', async ({
    client,
    assert,
  }) => {
    const sufijo = Date.now()
    const admin = await Usuario.create({
      username: `adm_cierre_${sufijo}`,
      passwordHash: 'PasswordSeguro123!',
      rol: RolUsuario.ADMINISTRADOR,
      estaActivo: true,
    })
    const generador = await Usuario.create({
      username: `gen_cierre_${sufijo}`,
      passwordHash: 'PasswordSeguro123!',
      rol: RolUsuario.GENERADOR,
      estaActivo: true,
    })
    const receptor = await Usuario.create({
      username: `rec_cierre_${sufijo}`,
      passwordHash: 'PasswordSeguro123!',
      rol: RolUsuario.RECEPTOR,
      estaActivo: true,
    })

    const respGrupo = await client
      .post('/api/v1/grupos-pago')
      .loginAs(admin)
      .json({
        nombre: `Mensual-Cierre-${sufijo}`,
        periodicidad: PeriodicidadGrupoPago.MENSUAL,
        diaCorte1: 30,
      })
    respGrupo.assertStatus(201)
    const grupoPagoId = (respGrupo.body() as { data: { id: number } }).data.id

    const respPersona = await client
      .post('/api/v1/personas')
      .loginAs(generador)
      .json({
        identificacion: `V-CIE-${sufijo}`,
        nombres: 'Lucia',
        apellidos: 'Ramos',
      })
    respPersona.assertStatus(201)
    const personaId = (respPersona.body() as { data: { id: number } }).data.id

    const respProyecto = await client
      .post('/api/v1/proyectos')
      .loginAs(generador)
      .json({
        codigo: `PROY-CIE-${sufijo}`,
        nombre: 'Proyecto Cierre Contable',
        area: AreaProyecto.FISICA,
        ambito: AmbitoProyecto.INTERNO,
      })
    respProyecto.assertStatus(201)
    const proyectoId = (respProyecto.body() as { data: { id: number } }).data.id

    await client.post('/api/v1/asignaciones').loginAs(generador).json({
      personaId,
      proyectoId,
      grupoPagoId,
      montoPeriodo: 100,
      fechaInicio: '2026-06-01',
    })

    const respLote = await client
      .post('/api/v1/causaciones/lote')
      .loginAs(generador)
      .json({
        proyectoId,
        grupoPagoId,
        periodoInicio: '2026-06-01',
        periodoFin: '2026-06-30',
        crearSolicitud: true,
        codigoSolicitud: `SOL-CIE-${sufijo}`,
      })
    respLote.assertStatus(201)
    const solicitudId = (respLote.body() as { solicitudPago: { id: number } }).solicitudPago.id

    await client.patch(`/api/v1/solicitudes-pago/${solicitudId}/enviar`).loginAs(generador)
    await client.patch(`/api/v1/solicitudes-pago/${solicitudId}/aprobar`).loginAs(receptor)

    const respPago = await client.post('/api/v1/pagos').loginAs(receptor).json({
      personaId,
      proyectoId,
      solicitudId,
      montoTotal: 100,
      metodoPago: MetodoPago.TRANSFERENCIA,
      fechaPago: '2026-06-30',
    })
    respPago.assertStatus(201)
    const pagoId = (respPago.body() as { pagoId: number }).pagoId

    const respCerrarSol = await client
      .patch(`/api/v1/solicitudes-pago/${solicitudId}/cerrar`)
      .loginAs(generador)
    respCerrarSol.assertStatus(200)

    const respAnularPagoCerrado = await client
      .post(`/api/v1/pagos/${pagoId}/anular`)
      .loginAs(receptor)
      .json({ motivoAnulacion: 'Intento de reverso sobre solicitud ya cerrada' })
    respAnularPagoCerrado.assertStatus(422)
    assert.equal(
      (respAnularPagoCerrado.body() as { codigo: string }).codigo,
      'SOLICITUD_YA_CERRADA'
    )

    // Caja chica cerrada impide anular sus vales
    const respCaja = await client
      .post('/api/v1/cajas-chicas')
      .loginAs(generador)
      .json({
        codigo: `CAJA-CIE-${sufijo}`,
        nombre: 'Caja Cierre',
        proyectoId,
        anio: 2026,
        mes: 6,
        montoAsignado: 150,
      })
    respCaja.assertStatus(201)
    const cajaId = (respCaja.body() as { data: { id: number } }).data.id

    const respVale = await client
      .post(`/api/v1/cajas-chicas/${cajaId}/vales`)
      .loginAs(generador)
      .json({ solicitantePersonaId: personaId, montoSolicitado: 50, concepto: 'Insumos' })
    respVale.assertStatus(201)
    const valeId = (respVale.body() as { data: { id: number } }).data.id

    await client.patch(`/api/v1/vales-caja/${valeId}/aprobar`).loginAs(receptor)
    await client.patch(`/api/v1/vales-caja/${valeId}/desembolsar`).loginAs(receptor)
    await client.patch(`/api/v1/vales-caja/${valeId}/rendir`).loginAs(receptor).json({
      montoRendido: 40,
      comprobanteReferencia: 'FAC-CIE-01',
    })

    const respCerrarCaja = await client
      .patch(`/api/v1/cajas-chicas/${cajaId}/cerrar`)
      .loginAs(generador)
    respCerrarCaja.assertStatus(200)

    const respAnularValeCerrado = await client
      .post(`/api/v1/vales-caja/${valeId}/anular`)
      .loginAs(receptor)
      .json({ motivoAnulacion: 'Intento de anular vale tras cierre y arrastre' })
    respAnularValeCerrado.assertStatus(422)
    assert.equal((respAnularValeCerrado.body() as { codigo: string }).codigo, 'CAJA_CHICA_CERRADA')
  })
})
