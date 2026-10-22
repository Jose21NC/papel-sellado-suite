// Plantillas notariales para Nicaragua. Son MODELOS DE REFERENCIA: el notario debe revisarlos y adaptarlos a cada caso.
// Base verificada: Ley del Notariado (Arts. 15, 16, 23, 24, 28, 29, 31, 38, 41 y 70), Ley 139 (Arto. 6: testigos instrumentales
// solo en el testamento), Ley 1113 de 2022 (Arto. 15 Nº 10 y 18 de la Ley del Notariado), Código Civil (4ª edición oficial, 2019)
// y Código de Familia (Ley 870, Arts. 83, 84 y 106).
// Cada párrafo es HTML con <b>, <i> o <u>; un "^" al inicio lo centra. {CLAVE}: dato del perfil o de la fecha, se llena solo.
// [TEXTO]: campo que el abogado completa a mano (se resalta en pantalla).
const PLANTILLAS = (() => {
  const REG = 'Registro Público de la Propiedad Inmueble y Mercantil del departamento de [DEPARTAMENTO]';
  const RPI = 'el ' + REG, DEL_RPI = 'del ' + REG;
  const NOT = '<b>{NOTARIO}</b>, {TITULO} de la República de Nicaragua, con domicilio y residencia en la ciudad de {DOMICILIO}, con carné de la Corte Suprema de Justicia número {CARNET}, debidamente {AUTORIZADO} por la Excelentísima Corte Suprema de Justicia para cartular durante el quinquenio que vence el día {QUINQUENIO}';
  // Introducción (Ley del Notariado, Art. 23): número, lugar, hora, día, mes y año en letras, notario y comparecientes.
  const ENC = (acto, comp) => `<b>ESCRITURA PÚBLICA NÚMERO {NUMERO}.- ${acto}.-</b> En la ciudad de {CIUDAD}, {HORA_FECHA}.- ANTE MÍ: ${NOT}, ${comp}`;
  const GEN = (rol) => `<b>[NOMBRE ${rol}]</b>, mayor de edad, [ESTADO CIVIL], [PROFESIÓN U OFICIO], del domicilio de [DOMICILIO], quien se identifica con cédula de identidad número [NÚMERO DE CÉDULA]`;
  const UNO = (rol) => `comparece el señor ${GEN(rol)}.`;
  const DOS = (a, la, b, lb) => `comparecen: por una parte, el señor ${GEN(a)}, que en lo sucesivo se denominará «${la}»; y por otra parte, el señor ${GEN(b)}, que en lo sucesivo se denominará «${lb}».`;
  // Fe de identificación y capacidad (Art. 23 Nº 5 y 6; Ley 139, Arto. 7).
  const FE1 = 'Doy fe de haber identificado plenamente al compareciente por medio del documento de identidad relacionado y de que, a mi juicio, tiene la capacidad civil legal necesaria para obligarse y contratar, en especial para el otorgamiento de este acto, en el que actúa en su propio nombre e interés.';
  const FE2 = 'Doy fe de haber identificado plenamente a los comparecientes por medio de los documentos de identidad relacionados y de que, a mi juicio, tienen la capacidad civil legal necesaria para obligarse y contratar, en especial para el otorgamiento de este acto, en el que actúan en su propio nombre e interés.';
  const INS = (reg) => `la necesidad de inscribir el testimonio de esta escritura en ${reg}`;
  const CARGAS = 'de los gravámenes y cargas que constan en el certificado registral relacionado';
  // Conclusión (Arts. 15 Nº 10, 28 y 29): instrucción del notario, advertencias, lectura, aprobación y firma.
  const INSTR = 'instruí acerca del objeto, valor, alcance y trascendencias legales de este acto, de las cláusulas generales que aseguran su validez, de las especiales que contiene y de las que envuelven renuncias y estipulaciones implícitas y explícitas';
  const FIN1 = (...adv) => `Así se expresó el compareciente, a quien yo, {EL_NOTARIO}, ${INSTR}${adv.length ? ', y advertí de ' + adv.join('; y ') : ''}. Leída que fue por mí, {EL_NOTARIO}, íntegramente esta escritura al compareciente, la encuentra conforme, la aprueba, ratifica y firma junto conmigo, {EL_NOTARIO}, que doy fe de todo lo relacionado.`;
  const FIN2 = (...adv) => `Así se expresaron los comparecientes, a quienes yo, {EL_NOTARIO}, ${INSTR}${adv.length ? ', y advertí de ' + adv.join('; y ') : ''}. Leída que fue por mí, {EL_NOTARIO}, íntegramente esta escritura a los comparecientes, la encuentran conforme, la aprueban, ratifican y firman junto conmigo, {EL_NOTARIO}, que doy fe de todo lo relacionado.`;
  const DOMINIO = (quien) => `<b>PRIMERA (RELACIÓN DE DOMINIO):</b> Habla ${quien} y dice: Que es dueño en dominio y posesión de un bien inmueble ubicado en [DIRECCIÓN, MUNICIPIO Y DEPARTAMENTO], con una extensión superficial de [ÁREA EN LETRAS] metros cuadrados ([ÁREA EN CIFRAS] m²), comprendido dentro de los siguientes linderos: Norte: [LINDERO]; Sur: [LINDERO]; Este: [LINDERO]; y Oeste: [LINDERO]. Lo adquirió por [TÍTULO DE ADQUISICIÓN: escritura pública número ..., autorizada en ... a las ... del día ..., ante el Notario ...], y se encuentra inscrito bajo el número [NÚMERO DE FINCA], tomo [TOMO], folio [FOLIO], asiento [ASIENTO], columna de inscripciones, sección de derechos reales del Libro de Propiedades ${DEL_RPI}.`;
  const CERT = (n) => `<b>${n} (CERTIFICADOS Y SOLVENCIAS):</b> Yo, {EL_NOTARIO}, en cumplimiento del artículo dieciséis de la Ley del Notariado, doy fe de haber tenido a la vista: a) certificado registral extendido por el Registrador Público del departamento de [DEPARTAMENTO] el día [FECHA EN LETRAS], del que consta que la finca [SE ENCUENTRA LIBRE DE GRAVÁMENES / TIENE LOS SIGUIENTES GRAVÁMENES: ...]; b) solvencia municipal número [NÚMERO], extendida por la Alcaldía de [MUNICIPIO]; c) certificado catastral número [NÚMERO], extendido por [AUTORIDAD CATASTRAL]; y d) [OTROS DOCUMENTOS Y COMPROBANTES DE PAGO DE LOS TRIBUTOS QUE EXIJA LA LEY VIGENTE].`;
  const AUTENTICA = (que, quienes, pl) => `<b>AUTENTICACIÓN.</b> En la ciudad de {CIUDAD}, {HORA_FECHA}, yo, ${NOT}, doy fe de que ${que} por haber sido puesta${pl ? 's' : ''} en mi presencia por ${quienes}, a quien${pl ? 'es' : ''} identifiqué por medio de su${pl ? 's' : ''} cédula${pl ? 's' : ''} de identidad.`;
  const VEHICULO = 'marca [MARCA], modelo [MODELO], año [AÑO], color [COLOR], tipo [TIPO], motor número [NÚMERO DE MOTOR], chasis número [NÚMERO DE CHASIS O VIN], placa número [PLACA] y circulación número [NÚMERO DE CIRCULACIÓN]';
  const PRECIO = 'la suma de [PRECIO EN LETRAS] córdobas (C$ [PRECIO EN CIFRAS])';

  return [
    // ---------- Poderes ----------
    { id: 'poder-generalisimo', cat: 'Poderes', title: 'Poder generalísimo', note: 'Código Civil, Arts. 3293 y 3295. Las facultades especiales deben expresarse, no basta citar artículos (Ley del Notariado, Art. 28).', body: [
      `${ENC('PODER GENERALÍSIMO', UNO('DEL PODERDANTE'))} ${FE1} Habla el compareciente y dice:`,
      `<b>PRIMERA (OTORGAMIENTO):</b> Que por medio de este instrumento confiere <b>PODER GENERALÍSIMO</b>, amplio y suficiente cuanto en derecho se requiere, al señor ${GEN('DEL APODERADO')}, para que lo represente en todos sus negocios, presentes y futuros.`,
      '<b>SEGUNDA (FACULTADES):</b> Que en virtud de este poder el apoderado podrá vender, hipotecar y de cualquier otro modo enajenar o gravar toda clase de bienes muebles e inmuebles del poderdante; aceptar o repudiar herencias; gestionar judicial y extrajudicialmente; celebrar toda clase de contratos y ejecutar todos los demás actos jurídicos que podría hacer el poderdante, conforme al artículo tres mil doscientos noventa y cinco del Código Civil, excepto los que conforme a la ley deben ser ejecutados por el mismo dueño en persona y aquellos para los cuales la ley exige expresamente poder especialísimo. Le confiere además expresamente las facultades especiales de [CONFESAR EN ESCRITOS, COMPROMETER EN ÁRBITROS, TRANSIGIR, DESISTIR Y ACEPTAR DESISTIMIENTOS, RECIBIR CUALQUIER CANTIDAD DE DINERO O ESPECIE, INSCRIBIR EN LOS REGISTROS PÚBLICOS, OPERAR NOVACIONES, RECUSAR, GIRAR LETRAS, LIBRANZAS Y PAGARÉS, Y SUSTITUIR ESTE PODER, REVOCAR SUSTITUTOS Y VOLVER A ASUMIRLO].',
      '<b>TERCERA (DURACIÓN Y REVOCACIÓN):</b> Que este poder se otorga por tiempo [INDEFINIDO] y podrá ser revocado en cualquier momento por escritura pública.',
      FIN1(INS('el Registro Público competente')),
    ] },
    { id: 'poder-general-administracion', cat: 'Poderes', title: 'Poder general de administración', note: 'Código Civil, Art. 3296. No faculta para enajenar ni gravar inmuebles.', body: [
      `${ENC('PODER GENERAL DE ADMINISTRACIÓN', UNO('DEL PODERDANTE'))} ${FE1} Habla el compareciente y dice:`,
      `<b>PRIMERA (OTORGAMIENTO):</b> Que por medio de este instrumento confiere <b>PODER GENERAL DE ADMINISTRACIÓN</b> al señor ${GEN('DEL APODERADO')}, para [TODOS SUS NEGOCIOS / LOS NEGOCIOS RELATIVOS A ...].`,
      '<b>SEGUNDA (FACULTADES):</b> Que conforme al artículo tres mil doscientos noventa y seis del Código Civil, el apoderado tendrá amplia y general administración, comprendiendo las facultades de: uno) celebrar los convenios y ejecutar los actos necesarios para la conservación o explotación de los bienes; dos) intentar y sostener judicialmente las acciones posesorias y las que fueren necesarias para interrumpir la prescripción; tres) alquilar o arrendar los bienes muebles o inmuebles hasta por un año; cuatro) vender los frutos y los demás bienes muebles que por su naturaleza están destinados a ser vendidos o se hallan expuestos a perderse o deteriorarse; cinco) exigir judicial o extrajudicialmente el pago de los créditos y dar los correspondientes recibos; y seis) ejecutar todos los actos jurídicos que, según la naturaleza del negocio, se encuentren virtualmente comprendidos en él. Este poder no faculta para enajenar ni gravar bienes inmuebles.',
      '<b>TERCERA (DURACIÓN):</b> Que este poder se otorga por [EL PLAZO DE ... / TIEMPO INDEFINIDO] y podrá ser revocado en cualquier momento por escritura pública.',
      FIN1(INS('el Registro Público competente')),
    ] },
    { id: 'poder-especial', cat: 'Poderes', title: 'Poder especial', note: 'Código Civil, Art. 3297: solo faculta para los actos especificados. Descríbalos con precisión.', body: [
      `${ENC('PODER ESPECIAL', UNO('DEL PODERDANTE'))} ${FE1} Habla el compareciente y dice:`,
      `<b>PRIMERA (OTORGAMIENTO):</b> Que por medio de este instrumento confiere <b>PODER ESPECIAL</b> al señor ${GEN('DEL APODERADO')}, para que en su nombre y representación [DESCRIBA CON PRECISIÓN EL ACTO O ACTOS: por ejemplo, venda el inmueble inscrito bajo el número ..., tomo ..., folio ..., asiento ..., del Registro Público de ..., por el precio y en las condiciones que estime convenientes].`,
      '<b>SEGUNDA (ALCANCE):</b> Que para tal fin el apoderado podrá [FIRMAR LA ESCRITURA CORRESPONDIENTE, RECIBIR EL PRECIO Y OTORGAR RECIBO, SOLICITAR CERTIFICADOS Y SOLVENCIAS, Y REALIZAR LOS TRÁMITES NECESARIOS PARA SU INSCRIPCIÓN]. Conforme al artículo tres mil doscientos noventa y siete del Código Civil, este poder solo faculta para los actos especificados, sin extenderse a otros.',
      '<b>TERCERA (DURACIÓN):</b> Que este poder terminará una vez cumplido su objeto [O AL VENCER EL PLAZO DE ...].',
      FIN1(),
    ] },
    { id: 'poder-judicial', cat: 'Poderes', title: 'Poder general judicial', note: 'Código Civil, Arts. 3357 y 3366. Quite las facultades especiales que no desee conferir.', body: [
      `${ENC('PODER GENERAL JUDICIAL', UNO('DEL PODERDANTE'))} ${FE1} Habla el compareciente y dice:`,
      '<b>PRIMERA (OTORGAMIENTO):</b> Que por medio de este instrumento confiere <b>PODER GENERAL JUDICIAL</b> al Licenciado <b>[NOMBRE DEL APODERADO]</b>, mayor de edad, [ESTADO CIVIL], Abogado y Notario Público, del domicilio de [DOMICILIO], con carné de la Corte Suprema de Justicia número [CARNÉ], para que lo represente en todos los asuntos judiciales, administrativos y extrajudiciales en que tenga interés, como actor o como demandado, ante cualquier autoridad de la República.',
      '<b>SEGUNDA (FACULTADES):</b> Que conforme al artículo tres mil trescientos cincuenta y siete del Código Civil, el apoderado podrá apersonarse como actor o como reo a nombre del poderdante en cualquier negocio que le interese; seguir el juicio, sus incidentes e incidencias, como las tercerías o contrademandas; y usar de todos los recursos ordinarios y extraordinarios que la ley establece. Le confiere además expresamente las facultades especiales de: confesar en escritos; comprometer en árbitros; transigir; desistir y aceptar desistimientos en cualquier instancia; recibir cualquier cantidad de dinero o especie; inscribir en los Registros Públicos; operar cualesquiera novaciones; recusar; sustituir este poder, revocar sustitutos, nombrar otros de nuevo y volver a asumir el poder; y girar letras, libranzas, pagarés y otros documentos de esta clase.',
      '<b>TERCERA (DURACIÓN):</b> Que este poder se otorga por tiempo [INDEFINIDO] y podrá ser revocado en cualquier momento por escritura pública.',
      FIN1(),
    ] },
    { id: 'poder-tramites', cat: 'Poderes', title: 'Poder especial para trámites administrativos', tags: 'DGI alcaldía registro migración INSS', body: [
      `${ENC('PODER ESPECIAL PARA TRÁMITES ADMINISTRATIVOS', UNO('DEL PODERDANTE'))} ${FE1} Habla el compareciente y dice:`,
      `<b>PRIMERA (OTORGAMIENTO):</b> Que por medio de este instrumento confiere <b>PODER ESPECIAL</b> al señor ${GEN('DEL APODERADO')}, para que lo represente ante [INSTITUCIONES: DIRECCIÓN GENERAL DE INGRESOS, ALCALDÍA DE ..., REGISTRO PÚBLICO DE LA PROPIEDAD INMUEBLE Y MERCANTIL, INSTITUTO NICARAGÜENSE DE SEGURIDAD SOCIAL, ENTRE OTRAS] en los siguientes trámites: [DESCRIBA LOS TRÁMITES].`,
      '<b>SEGUNDA (FACULTADES):</b> Que para tal fin el apoderado podrá presentar y firmar solicitudes, formularios y escritos; pagar tributos, tasas y aranceles; retirar documentos, certificados, solvencias y constancias; recibir notificaciones; y realizar las demás gestiones necesarias para los trámites indicados. Este poder no faculta para enajenar ni gravar bienes [NI PARA RECIBIR DINERO].',
      '<b>TERCERA (DURACIÓN):</b> Que este poder tendrá vigencia [HASTA LA CONCLUSIÓN DE LOS TRÁMITES / POR EL PLAZO DE ...].',
      FIN1(),
    ] },
    { id: 'revocacion-poder', cat: 'Poderes', title: 'Revocación de poder', note: 'Código Civil, Art. 3350: el poder otorgado en escritura pública se revoca por escritura pública.', body: [
      `${ENC('REVOCACIÓN DE PODER', UNO('DEL PODERDANTE'))} ${FE1} Habla el compareciente y dice:`,
      '<b>PRIMERA (ANTECEDENTE):</b> Que por escritura pública número [NÚMERO EN LETRAS], autorizada en la ciudad de [CIUDAD], a las [HORA EN LETRAS] del día [FECHA EN LETRAS], ante los oficios del Notario [NOMBRE DEL NOTARIO], otorgó [CLASE DE PODER] a favor del señor [NOMBRE DEL APODERADO][, INSCRITO BAJO EL NÚMERO ..., PÁGINAS ..., TOMO ..., DEL LIBRO ... DEL REGISTRO PÚBLICO DE ...].',
      '<b>SEGUNDA (REVOCACIÓN):</b> Que por medio de este instrumento revoca en todas sus partes el poder relacionado, el cual queda sin ningún valor ni efecto a partir de esta fecha.',
      FIN1('la conveniencia de notificar esta revocación al apoderado y a los terceros interesados', INS('el Registro Público competente')),
    ] },

    // ---------- Inmuebles ----------
    { id: 'compraventa-inmueble', cat: 'Inmuebles', title: 'Compraventa de bien inmueble', note: 'Código Civil, Arts. 2534 y 2558; Ley del Notariado, Art. 16. Verifique los tributos y solvencias vigentes para el traspaso.', body: [
      `${ENC('COMPRAVENTA DE BIEN INMUEBLE', DOS('DEL VENDEDOR', 'el Vendedor', 'DEL COMPRADOR', 'el Comprador'))} ${FE2} Hablan los comparecientes y dicen:`,
      DOMINIO('el Vendedor'),
      CERT('SEGUNDA'),
      `<b>TERCERA (COMPRAVENTA):</b> Sigue hablando el Vendedor y dice: Que por ${PRECIO}, que declara recibidos de manos del Comprador [EN ESTE ACTO / MEDIANTE ...] a su entera satisfacción, vende y transfiere al Comprador el inmueble descrito en la cláusula primera, con todos sus usos, costumbres, servidumbres, mejoras y anexidades, libre de gravámenes, y se obliga al saneamiento conforme a la ley.`,
      '<b>CUARTA (ENTREGA):</b> Que desde esta fecha pone al Comprador en posesión material y jurídica del inmueble vendido.',
      '<b>QUINTA (ACEPTACIÓN):</b> Habla el Comprador y dice: Que acepta la venta que se le hace en los términos relacionados.',
      '<b>SEXTA (GASTOS):</b> Que los gastos de otorgamiento de esta escritura serán por cuenta del Vendedor, y los del primer testimonio y su inscripción por cuenta del Comprador, [SALVO QUE CONVENGAN OTRA COSA].',
      FIN2(INS(RPI), CARGAS),
    ] },
    { id: 'promesa-venta', cat: 'Inmuebles', title: 'Promesa de venta de bien inmueble', note: 'Código Civil, Art. 2541.', body: [
      `${ENC('PROMESA DE VENTA DE BIEN INMUEBLE', DOS('DEL PROMITENTE VENDEDOR', 'el Promitente Vendedor', 'DEL PROMITENTE COMPRADOR', 'el Promitente Comprador'))} ${FE2} Hablan los comparecientes y dicen:`,
      DOMINIO('el Promitente Vendedor'),
      `<b>SEGUNDA (PROMESA):</b> Que el Promitente Vendedor promete vender al Promitente Comprador, y este promete comprar, el inmueble descrito en la cláusula primera, por ${PRECIO}, que se pagará así: [ANTICIPO DE ... EN ESTE ACTO, QUE EL PROMITENTE VENDEDOR DECLARA RECIBIDO, Y EL SALDO AL OTORGARSE LA ESCRITURA DEFINITIVA].`,
      '<b>TERCERA (PLAZO):</b> Que la escritura de compraventa definitiva se otorgará a más tardar el día [FECHA EN LETRAS], ante el Notario que designe [PARTE].',
      '<b>CUARTA (OBLIGACIONES DEL PROMITENTE VENDEDOR):</b> Que mientras se otorga la escritura definitiva, el Promitente Vendedor se obliga a no enajenar ni gravar el inmueble, a mantenerlo al día en el pago de sus impuestos y a entregar los certificados y solvencias necesarios para la venta.',
      '<b>QUINTA (INCUMPLIMIENTO):</b> Que habiendo conformidad en el bien y en el precio, las partes podrán reclamarse recíprocamente el cumplimiento de este contrato, conforme al artículo dos mil quinientos cuarenta y uno del Código Civil; y además convienen en lo siguiente: [PENALIDAD O ARRAS POR INCUMPLIMIENTO DE CADA PARTE].',
      FIN2(),
    ] },
    { id: 'donacion-inmueble', cat: 'Inmuebles', title: 'Donación de bien inmueble', note: 'Código Civil, Art. 2768: la donación de bienes raíces solo vale otorgada en escritura pública debidamente inscrita.', body: [
      `${ENC('DONACIÓN DE BIEN INMUEBLE', DOS('DEL DONANTE', 'el Donante', 'DEL DONATARIO', 'el Donatario'))} ${FE2} Hablan los comparecientes y dicen:`,
      DOMINIO('el Donante'),
      CERT('SEGUNDA'),
      '<b>TERCERA (DONACIÓN):</b> Sigue hablando el Donante y dice: Que por su libre voluntad y a título gratuito dona irrevocablemente al Donatario el inmueble descrito en la cláusula primera, con todos sus usos, costumbres, servidumbres, mejoras y anexidades, [EN CONSIDERACIÓN A ...]. Para efectos fiscales estiman el inmueble en [VALOR EN LETRAS] córdobas (C$ [VALOR EN CIFRAS]).',
      '<b>CUARTA (RESERVAS):</b> Que [SE RESERVA BIENES SUFICIENTES PARA SU SUBSISTENCIA / SE RESERVA EL USUFRUCTO VITALICIO DEL INMUEBLE].',
      '<b>QUINTA (ACEPTACIÓN):</b> Habla el Donatario y dice: Que acepta la donación que se le hace en los términos relacionados.',
      FIN2(INS(RPI) + ', pues conforme al artículo dos mil setecientos sesenta y ocho del Código Civil la donación de bienes raíces no vale si no es otorgada por escritura pública debidamente inscrita', CARGAS),
    ] },
    { id: 'permuta', cat: 'Inmuebles', title: 'Permuta de bienes inmuebles', note: 'Código Civil, Arts. 2748 y 2749.', body: [
      `${ENC('PERMUTA DE BIENES INMUEBLES', DOS('DEL PRIMER PERMUTANTE', 'el Primer Permutante', 'DEL SEGUNDO PERMUTANTE', 'el Segundo Permutante'))} ${FE2} Hablan los comparecientes y dicen:`,
      DOMINIO('el Primer Permutante'),
      `<b>SEGUNDA (DOMINIO DEL SEGUNDO INMUEBLE):</b> Habla el Segundo Permutante y dice: Que es dueño en dominio y posesión de un bien inmueble ubicado en [DIRECCIÓN], con una extensión superficial de [ÁREA EN LETRAS] metros cuadrados, comprendido dentro de los siguientes linderos: Norte: [LINDERO]; Sur: [LINDERO]; Este: [LINDERO]; y Oeste: [LINDERO]; inscrito bajo el número [NÚMERO DE FINCA], tomo [TOMO], folio [FOLIO], asiento [ASIENTO] ${DEL_RPI}.`,
      CERT('TERCERA').replace('la finca', 'cada finca'),
      '<b>CUARTA (PERMUTA):</b> Que por medio de este instrumento permutan los inmuebles descritos: el Primer Permutante transfiere al Segundo Permutante el inmueble de la cláusula primera, y el Segundo Permutante transfiere al Primer Permutante el inmueble de la cláusula segunda, cada uno con sus usos, costumbres, servidumbres, mejoras y anexidades, libres de gravámenes, [SIN DIFERENCIA DE VALOR / PAGANDO EL ... UNA DIFERENCIA DE ...], y ambos se obligan al saneamiento conforme a la ley.',
      '<b>QUINTA (ENTREGA Y ACEPTACIÓN):</b> Que desde esta fecha se ponen recíprocamente en posesión de los inmuebles permutados y aceptan la permuta en los términos relacionados.',
      FIN2(INS(RPI) + ', pues conforme al artículo dos mil setecientos cuarenta y nueve del Código Civil la permuta de bienes raíces requiere escritura pública debidamente inscrita', CARGAS),
    ] },
    { id: 'desmembracion', cat: 'Inmuebles', title: 'Desmembración y compraventa de lote', tags: 'lote desmembrar plano', body: [
      `${ENC('DESMEMBRACIÓN Y COMPRAVENTA DE LOTE DE TERRENO', DOS('DEL VENDEDOR', 'el Vendedor', 'DEL COMPRADOR', 'el Comprador'))} ${FE2} Hablan los comparecientes y dicen:`,
      DOMINIO('el Vendedor'),
      '<b>SEGUNDA (DESMEMBRACIÓN):</b> Sigue hablando el Vendedor y dice: Que de la finca descrita desmembra un lote de terreno con una extensión superficial de [ÁREA EN LETRAS] metros cuadrados ([ÁREA EN CIFRAS] m²), comprendido dentro de los siguientes linderos particulares: Norte: [LINDERO]; Sur: [LINDERO]; Este: [LINDERO]; y Oeste: [LINDERO]; según plano de desmembración número [NÚMERO] aprobado por [AUTORIDAD CATASTRAL] el día [FECHA EN LETRAS], que doy fe de haber tenido a la vista y que agrego a mi protocolo. La finca matriz conserva un área remanente de [ÁREA EN LETRAS] metros cuadrados.',
      CERT('TERCERA'),
      `<b>CUARTA (COMPRAVENTA):</b> Que por ${PRECIO}, que declara recibidos a su entera satisfacción, vende y transfiere al Comprador el lote desmembrado, con sus usos, costumbres, servidumbres, mejoras y anexidades, libre de gravámenes, y se obliga al saneamiento conforme a la ley, poniéndolo desde esta fecha en posesión del lote.`,
      '<b>QUINTA (ACEPTACIÓN):</b> Habla el Comprador y dice: Que acepta la venta que se le hace en los términos relacionados.',
      FIN2(INS(RPI) + ', para que el lote desmembrado se inscriba como finca nueva', CARGAS),
    ] },
    { id: 'hipoteca', cat: 'Inmuebles', title: 'Constitución de hipoteca', note: 'Código Civil, Arts. 3772 y 3811. Las renuncias solo caben si las partes las convienen expresamente (Ley del Notariado, Arts. 27 y 28).', body: [
      `${ENC('CONSTITUCIÓN DE HIPOTECA', DOS('DEL DEUDOR', 'el Deudor', 'DEL ACREEDOR', 'el Acreedor'))} ${FE2} Hablan los comparecientes y dicen:`,
      DOMINIO('el Deudor'),
      '<b>SEGUNDA (OBLIGACIÓN GARANTIZADA):</b> Sigue hablando el Deudor y dice: Que adeuda al Acreedor la suma de [CANTIDAD EN LETRAS] córdobas (C$ [CANTIDAD EN CIFRAS]), [EN CONCEPTO DE PRÉSTAMO QUE RECIBE EN ESTE ACTO / SEGÚN ...], que se obliga a pagar en el plazo de [PLAZO], mediante [NÚMERO Y MONTO DE LAS CUOTAS], con un interés corriente del [TASA EN LETRAS] por ciento anual y un interés moratorio de [TASA EN LETRAS], en [LUGAR DE PAGO].',
      '<b>TERCERA (HIPOTECA):</b> Que en garantía del pago del capital, intereses, costas y gastos, constituye a favor del Acreedor <b>[PRIMERA] HIPOTECA</b> sobre el inmueble descrito en la cláusula primera, la que comprende sus mejoras, accesiones y anexidades.',
      '<b>CUARTA (CERTIFICADO REGISTRAL):</b> Yo, {EL_NOTARIO}, conforme al artículo tres mil ochocientos once del Código Civil, doy fe de haber tenido a la vista el certificado del Registro Público del departamento de [DEPARTAMENTO] extendido el día [FECHA EN LETRAS], en el que consta que la finca [SE ENCUENTRA LIBRE DE GRAVÁMENES / TIENE LOS SIGUIENTES GRAVÁMENES: ...].',
      '<b>QUINTA (VENCIMIENTO ANTICIPADO):</b> Que el Acreedor podrá dar por vencido el plazo y exigir el pago total si el Deudor falta al pago de [NÚMERO] cuotas, si el inmueble sufre deterioro que disminuya la garantía o si es enajenado o gravado sin consentimiento escrito del Acreedor. [RENUNCIAS CONVENIDAS EXPRESAMENTE POR LAS PARTES, SI LAS HUBIERE].',
      '<b>SEXTA (ACEPTACIÓN):</b> Habla el Acreedor y dice: Que acepta la hipoteca constituida a su favor en los términos relacionados.',
      FIN2(INS(RPI) + ', pues conforme al artículo tres mil setecientos setenta y dos del Código Civil la hipoteca debe inscribirse en el competente Registro', CARGAS),
    ] },
    { id: 'cancelacion-hipoteca', cat: 'Inmuebles', title: 'Cancelación de hipoteca', note: 'Código Civil, Art. 3869: renuncia expresa del acreedor en escritura pública.', body: [
      `${ENC('CANCELACIÓN DE HIPOTECA', UNO('DEL ACREEDOR'))} ${FE1} Habla el compareciente y dice:`,
      '<b>PRIMERA (ANTECEDENTE):</b> Que por escritura pública número [NÚMERO EN LETRAS], autorizada en la ciudad de [CIUDAD] a las [HORA EN LETRAS] del día [FECHA EN LETRAS], ante el Notario [NOMBRE DEL NOTARIO], el señor [NOMBRE DEL DEUDOR] constituyó a su favor hipoteca sobre la finca número [NÚMERO DE FINCA], tomo [TOMO], folio [FOLIO], en garantía de [OBLIGACIÓN], la que se encuentra inscrita en el asiento [ASIENTO] de la columna de gravámenes ' + DEL_RPI + '.',
      '<b>SEGUNDA (CANCELACIÓN):</b> Que habiendo recibido el pago total de la obligación garantizada, por medio de este instrumento renuncia expresamente a su derecho hipotecario y consiente en la cancelación de la hipoteca relacionada, liberando la finca de dicho gravamen, y pide al Registrador que cancele el asiento correspondiente.',
      FIN1(INS(RPI) + ', para la cancelación del asiento correspondiente'),
    ] },
    { id: 'usufructo', cat: 'Inmuebles', title: 'Constitución de usufructo', note: 'Código Civil, Arts. 1473 y 1476.', body: [
      `${ENC('CONSTITUCIÓN DE USUFRUCTO', DOS('DEL PROPIETARIO', 'el Propietario', 'DEL USUFRUCTUARIO', 'el Usufructuario'))} ${FE2} Hablan los comparecientes y dicen:`,
      DOMINIO('el Propietario'),
      '<b>SEGUNDA (CONSTITUCIÓN):</b> Sigue hablando el Propietario y dice: Que por medio de este instrumento constituye a favor del Usufructuario <b>DERECHO DE USUFRUCTO</b> sobre el inmueble descrito, [A TÍTULO GRATUITO / POR LA SUMA DE ...], [DE POR VIDA / POR EL PLAZO DE ...], conservando el Propietario la nuda propiedad. Conforme al artículo mil cuatrocientos setenta y tres del Código Civil, el usufructo es el derecho de disfrutar de los bienes que a otro pertenecen, con la obligación de no alterar su forma ni substancia; y conforme al artículo mil cuatrocientos setenta y seis, es vitalicio si en el título no se expresa lo contrario.',
      '<b>TERCERA (OBLIGACIONES DEL USUFRUCTUARIO):</b> Que el Usufructuario recibe el inmueble en el estado en que se encuentra, y se obliga a conservarlo, a pagar [LOS IMPUESTOS Y LAS REPARACIONES ORDINARIAS] y a devolverlo al extinguirse el usufructo.',
      '<b>CUARTA (ACEPTACIÓN):</b> Habla el Usufructuario y dice: Que acepta el usufructo constituido a su favor en los términos relacionados.',
      FIN2(INS(RPI), CARGAS),
    ] },
    { id: 'servidumbre', cat: 'Inmuebles', title: 'Constitución de servidumbre de paso', note: 'Código Civil, Art. 1559.', body: [
      `${ENC('CONSTITUCIÓN DE SERVIDUMBRE DE PASO', DOS('DEL DUEÑO DEL PREDIO SIRVIENTE', 'el Dueño del Predio Sirviente', 'DEL DUEÑO DEL PREDIO DOMINANTE', 'el Dueño del Predio Dominante'))} ${FE2} Hablan los comparecientes y dicen:`,
      DOMINIO('el Dueño del Predio Sirviente'),
      `<b>SEGUNDA (PREDIO DOMINANTE):</b> Habla el Dueño del Predio Dominante y dice: Que es dueño del inmueble colindante ubicado en [DIRECCIÓN], inscrito bajo el número [NÚMERO DE FINCA], tomo [TOMO], folio [FOLIO], asiento [ASIENTO] ${DEL_RPI}.`,
      '<b>TERCERA (CONSTITUCIÓN):</b> Que el Dueño del Predio Sirviente constituye sobre su inmueble, en favor del predio dominante, <b>SERVIDUMBRE DE PASO</b> [PERPETUA] sobre una franja de terreno de [ANCHO EN LETRAS] metros de ancho por [LARGO EN LETRAS] metros de largo, ubicada [UBICACIÓN DE LA FRANJA], para el paso de [PERSONAS, VEHÍCULOS Y SERVICIOS], [A TÍTULO GRATUITO / POR LA SUMA DE ...]. Conforme al artículo mil quinientos cincuenta y nueve del Código Civil, servidumbre es una carga impuesta a un predio en provecho o servicio de otro predio perteneciente a otro dueño.',
      '<b>CUARTA (CONSERVACIÓN Y ACEPTACIÓN):</b> Que la conservación de la franja estará a cargo de [PARTE]. El Dueño del Predio Dominante acepta la servidumbre en los términos relacionados.',
      FIN2(INS(RPI) + ', en las inscripciones de ambos predios', CARGAS),
    ] },
    { id: 'arrendamiento', cat: 'Inmuebles', title: 'Arrendamiento de bien inmueble', tags: 'alquiler renta', note: 'Código Civil, Art. 2824.', body: [
      `${ENC('ARRENDAMIENTO DE BIEN INMUEBLE', DOS('DEL ARRENDADOR', 'el Arrendador', 'DEL ARRENDATARIO', 'el Arrendatario'))} ${FE2} Hablan los comparecientes y dicen:`,
      `<b>PRIMERA (INMUEBLE):</b> Habla el Arrendador y dice: Que es dueño de un inmueble ubicado en [DIRECCIÓN], inscrito bajo el número [NÚMERO DE FINCA], tomo [TOMO], folio [FOLIO], asiento [ASIENTO] ${DEL_RPI}, que consta de [DESCRIPCIÓN].`,
      '<b>SEGUNDA (ARRIENDO Y DESTINO):</b> Que da en arriendo al Arrendatario el inmueble descrito, para destinarlo exclusivamente a [USO HABITACIONAL / USO COMERCIAL: ...].',
      '<b>TERCERA (PLAZO):</b> Que el plazo del arriendo es de [PLAZO EN LETRAS], contado a partir del día [FECHA EN LETRAS], [PRORROGABLE POR ACUERDO ESCRITO DE LAS PARTES].',
      '<b>CUARTA (RENTA Y DEPÓSITO):</b> Que la renta mensual es de [RENTA EN LETRAS] córdobas (C$ [RENTA EN CIFRAS]), pagadera por adelantado dentro de los primeros [NÚMERO] días de cada mes en [LUGAR O CUENTA]. El Arrendatario entrega en este acto un depósito de garantía de [CANTIDAD EN LETRAS], que se le devolverá al finalizar el contrato, deducidos los daños y saldos pendientes.',
      '<b>QUINTA (OBLIGACIONES):</b> Que los servicios de [AGUA, ENERGÍA, TELÉFONO E INTERNET] serán por cuenta del Arrendatario; este no podrá subarrendar ni ceder el contrato sin consentimiento escrito del Arrendador, y las mejoras que haga quedarán a beneficio del inmueble [SALVO PACTO EN CONTRARIO].',
      '<b>SEXTA (ENTREGA Y DEVOLUCIÓN):</b> Que el Arrendatario recibe el inmueble en [ESTADO], según inventario firmado por las partes, y se obliga a devolverlo en el mismo estado, salvo el deterioro por el uso normal.',
      '<b>SÉPTIMA (TERMINACIÓN):</b> Que serán causas de terminación anticipada: [FALTA DE PAGO DE ... MESES DE RENTA, USO DISTINTO DEL CONVENIDO, ...].',
      FIN2(),
    ] },

    // ---------- Muebles y vehículos ----------
    { id: 'compraventa-vehiculo', cat: 'Muebles y vehículos', title: 'Compraventa de vehículo', tags: 'carro auto moto', body: [
      `${ENC('COMPRAVENTA DE VEHÍCULO', DOS('DEL VENDEDOR', 'el Vendedor', 'DEL COMPRADOR', 'el Comprador'))} ${FE2} Hablan los comparecientes y dicen:`,
      `<b>PRIMERA (DOMINIO):</b> Habla el Vendedor y dice: Que es dueño de un vehículo con las siguientes características: ${VEHICULO}; lo que acredita con [TÍTULO: FACTURA, ESCRITURA O CARTA DE VENTA], que doy fe de haber tenido a la vista.`,
      `<b>SEGUNDA (COMPRAVENTA):</b> Que por ${PRECIO}, que declara recibidos a su entera satisfacción, vende y transfiere al Comprador el vehículo descrito, libre de gravámenes, multas y reservas de dominio, y se obliga al saneamiento conforme a la ley.`,
      '<b>TERCERA (ENTREGA):</b> Que en este acto entrega al Comprador el vehículo, sus llaves y [LA TARJETA DE CIRCULACIÓN Y DEMÁS DOCUMENTOS].',
      '<b>CUARTA (RESPONSABILIDAD):</b> Que las multas, infracciones y responsabilidades derivadas del uso del vehículo hasta esta fecha serán por cuenta del Vendedor, y las posteriores por cuenta del Comprador.',
      '<b>QUINTA (ACEPTACIÓN):</b> Habla el Comprador y dice: Que acepta la venta que se le hace en los términos relacionados.',
      FIN2('la necesidad de realizar el traspaso del vehículo ante la autoridad de tránsito competente'),
    ] },
    { id: 'carta-venta', cat: 'Muebles y vehículos', title: 'Carta de venta de vehículo con firmas autenticadas', tags: 'carro auto moto autenticación', note: 'Documento privado; la autenticación va después de las firmas (Ley del Notariado, Art. 41).', body: [
      '^<b>CARTA DE VENTA</b>',
      `Yo, ${GEN('DEL VENDEDOR')}, declaro que he vendido al señor ${GEN('DEL COMPRADOR')}, el vehículo de mi propiedad con las siguientes características: ${VEHICULO}; por ${PRECIO}, que recibo a mi entera satisfacción. Declaro que el vehículo se encuentra libre de gravámenes, multas y reservas de dominio, y me obligo al saneamiento conforme a la ley. Las responsabilidades derivadas del uso del vehículo a partir de esta fecha corresponden al comprador.`,
      'Extiendo la presente en la ciudad de {CIUDAD}, el día {FECHA}.',
      AUTENTICA('las firmas que anteceden, puestas al pie de la carta de venta que precede, son auténticas', '[NOMBRE DEL VENDEDOR] y [NOMBRE DEL COMPRADOR]', true),
    ] },
    { id: 'compraventa-mueble', cat: 'Muebles y vehículos', title: 'Compraventa de bien mueble', body: [
      `${ENC('COMPRAVENTA DE BIEN MUEBLE', DOS('DEL VENDEDOR', 'el Vendedor', 'DEL COMPRADOR', 'el Comprador'))} ${FE2} Hablan los comparecientes y dicen:`,
      '<b>PRIMERA (DOMINIO):</b> Habla el Vendedor y dice: Que es dueño de [DESCRIPCIÓN DETALLADA DEL BIEN: MARCA, MODELO, SERIE Y ESTADO], que adquirió por [TÍTULO DE ADQUISICIÓN].',
      `<b>SEGUNDA (COMPRAVENTA):</b> Que por ${PRECIO}, que declara recibidos a su entera satisfacción, vende y transfiere al Comprador el bien descrito, libre de gravámenes, y se obliga al saneamiento conforme a la ley.`,
      '<b>TERCERA (ENTREGA Y ACEPTACIÓN):</b> Que en este acto entrega el bien al Comprador, quien lo recibe en el estado en que se encuentra y acepta la venta en los términos relacionados.',
      FIN2(),
    ] },

    // ---------- Obligaciones ----------
    { id: 'mutuo', cat: 'Obligaciones', title: 'Contrato de mutuo (préstamo de dinero)', tags: 'préstamo crédito', body: [
      `${ENC('CONTRATO DE MUTUO', DOS('DEL ACREEDOR', 'el Acreedor', 'DEL DEUDOR', 'el Deudor'))} ${FE2} Hablan los comparecientes y dicen:`,
      '<b>PRIMERA (PRÉSTAMO):</b> Que el Acreedor da en préstamo al Deudor la suma de [CANTIDAD EN LETRAS] córdobas (C$ [CANTIDAD EN CIFRAS]), que este declara recibir [EN ESTE ACTO / MEDIANTE ...] a su entera satisfacción.',
      '<b>SEGUNDA (PLAZO Y FORMA DE PAGO):</b> Que el Deudor se obliga a pagar el préstamo en el plazo de [PLAZO EN LETRAS] contado desde esta fecha, mediante [NÚMERO EN LETRAS] cuotas mensuales de [MONTO EN LETRAS] córdobas cada una, pagaderas el día [DÍA] de cada mes en [LUGAR O CUENTA].',
      '<b>TERCERA (INTERESES):</b> Que el préstamo devengará un interés corriente del [TASA EN LETRAS] por ciento anual sobre saldos, y en caso de mora un interés moratorio de [TASA EN LETRAS], dentro de los límites que la ley permite.',
      '<b>CUARTA (VENCIMIENTO ANTICIPADO):</b> Que la falta de pago de [NÚMERO] cuotas dará derecho al Acreedor a dar por vencido el plazo y exigir el pago total del saldo, intereses, costas y gastos.',
      '<b>QUINTA (GARANTÍA):</b> Que en garantía del pago [EL DEUDOR OFRECE ... / NO SE CONSTITUYE GARANTÍA ESPECÍFICA].',
      '<b>SEXTA (ACEPTACIÓN):</b> Que ambas partes aceptan este contrato en los términos relacionados.',
      FIN2(),
    ] },
    { id: 'reconocimiento-deuda', cat: 'Obligaciones', title: 'Reconocimiento de deuda', body: [
      `${ENC('RECONOCIMIENTO DE DEUDA', DOS('DEL DEUDOR', 'el Deudor', 'DEL ACREEDOR', 'el Acreedor'))} ${FE2} Hablan los comparecientes y dicen:`,
      '<b>PRIMERA (RECONOCIMIENTO):</b> Habla el Deudor y dice: Que reconoce adeudar al Acreedor la suma de [CANTIDAD EN LETRAS] córdobas (C$ [CANTIDAD EN CIFRAS]), en concepto de [ORIGEN DE LA DEUDA], suma que es líquida y exigible.',
      '<b>SEGUNDA (FORMA DE PAGO):</b> Que se obliga a pagarla [EN UN SOLO PAGO EL DÍA ... / MEDIANTE ... CUOTAS DE ...], en [LUGAR O CUENTA].',
      '<b>TERCERA (INTERESES E INCUMPLIMIENTO):</b> Que [LA DEUDA NO DEVENGARÁ INTERESES / DEVENGARÁ UN INTERÉS DEL ... POR CIENTO ANUAL], y que la falta de pago de [NÚMERO] cuotas dará derecho al Acreedor a exigir el saldo total.',
      '<b>CUARTA (ACEPTACIÓN):</b> Habla el Acreedor y dice: Que acepta el reconocimiento y la forma de pago relacionados.',
      FIN2(),
    ] },
    { id: 'fianza', cat: 'Obligaciones', title: 'Fianza', tags: 'fiador garantía', note: 'Código Civil, Art. 3683. Si se pactan renuncias (excusión, división), explique su alcance (Ley del Notariado, Art. 28).', body: [
      `${ENC('FIANZA', DOS('DEL FIADOR', 'el Fiador', 'DEL ACREEDOR', 'el Acreedor'))} ${FE2} Hablan los comparecientes y dicen:`,
      '<b>PRIMERA (OBLIGACIÓN PRINCIPAL):</b> Que el señor [NOMBRE DEL DEUDOR] adeuda al Acreedor [OBLIGACIÓN Y MONTO], según [DOCUMENTO: ESCRITURA PÚBLICA NÚMERO ..., AUTORIZADA ...].',
      '<b>SEGUNDA (FIANZA):</b> Habla el Fiador y dice: Que se constituye fiador [SOLIDARIO] del Deudor y se obliga a pagar al Acreedor lo que este no pague, hasta por la suma de [CANTIDAD EN LETRAS] córdobas (C$ [CANTIDAD EN CIFRAS]), más intereses, costas y gastos. [RENUNCIAS CONVENIDAS EXPRESAMENTE, SI LAS HUBIERE].',
      '<b>TERCERA (DURACIÓN):</b> Que la fianza durará hasta la cancelación total de la obligación principal [O HASTA EL DÍA ...].',
      '<b>CUARTA (ACEPTACIÓN):</b> Habla el Acreedor y dice: Que acepta la fianza en los términos relacionados.',
      FIN2(),
    ] },
    { id: 'carta-pago', cat: 'Obligaciones', title: 'Carta de pago y finiquito', tags: 'cancelación pago', body: [
      `${ENC('CARTA DE PAGO Y FINIQUITO', DOS('DEL ACREEDOR', 'el Acreedor', 'DEL DEUDOR', 'el Deudor'))} ${FE2} Hablan los comparecientes y dicen:`,
      '<b>PRIMERA (ANTECEDENTE):</b> Que el Deudor quedó obligado con el Acreedor por [OBLIGACIÓN, DOCUMENTO Y MONTO].',
      '<b>SEGUNDA (PAGO Y FINIQUITO):</b> Habla el Acreedor y dice: Que ha recibido del Deudor el pago total de la obligación relacionada, por lo que la declara cancelada y le otorga el más amplio y total finiquito, sin tener nada más que reclamarle por ese concepto. [SI LA OBLIGACIÓN TENÍA GARANTÍA HIPOTECARIA O PRENDARIA, CANCÉLELA EXPRESAMENTE].',
      '<b>TERCERA (ACEPTACIÓN):</b> Habla el Deudor y dice: Que acepta la carta de pago y el finiquito que se le otorgan.',
      FIN2(),
    ] },

    // ---------- Familia ----------
    { id: 'union-hecho', cat: 'Familia', title: 'Declaración de unión de hecho estable', tags: 'convivientes pareja', note: 'Código de Familia, Arts. 83, 84 y 106. Solo la autorizan notarios autorizados para celebrar matrimonio.', body: [
      `${ENC('DECLARACIÓN DE UNIÓN DE HECHO ESTABLE', `comparecen el señor ${GEN('DEL CONVIVIENTE')}; y la señora ${GEN('DE LA CONVIVIENTE')}.`)} ${FE2} Hablan los comparecientes y dicen:`,
      '<b>PRIMERA (CONVIVENCIA):</b> Que desde el día [FECHA EN LETRAS] hacen vida en común de manera estable, notoria y singular en [DIRECCIÓN DEL HOGAR], por más de dos años consecutivos, sin impedimento legal para contraer matrimonio.',
      '<b>SEGUNDA (APTITUD LEGAL):</b> Que acreditan su aptitud legal con [CERTIFICADOS DE NACIMIENTO Y CONSTANCIAS DE SOLTERÍA O DE DISOLUCIÓN DE VÍNCULO ANTERIOR], que doy fe de haber tenido a la vista y que quedan incorporados a mi protocolo, conforme al artículo ochenta y cuatro del Código de Familia.',
      '<b>TERCERA (DECLARACIÓN):</b> Que de común acuerdo declaran su unión de hecho estable, para que surta los efectos que la ley establece[, Y QUE DE ELLA HAN PROCREADO A: ...].',
      '<b>CUARTA (RÉGIMEN ECONÓMICO):</b> Que conforme al artículo ciento seis del Código de Familia adoptan el régimen de [SEPARACIÓN DE BIENES / PARTICIPACIÓN EN LAS GANANCIAS / COMUNIDAD DE BIENES].',
      FIN2(INS('el Registro del Estado Civil de las Personas competente')),
    ] },
    { id: 'salida-menor', cat: 'Familia', title: 'Autorización de salida del país de menor', tags: 'viaje migración permiso hijo', note: 'Antes de otorgarla, verifique con la Dirección General de Migración y Extranjería los requisitos vigentes: puede exigir que ambos padres se presenten.', body: [
      `${ENC('AUTORIZACIÓN PARA SALIDA DEL PAÍS DE MENOR DE EDAD', UNO('DEL PADRE O MADRE'))} ${FE1} Habla el compareciente y dice:`,
      '<b>PRIMERA (FILIACIÓN):</b> Que es [PADRE / MADRE] del menor <b>[NOMBRE DEL MENOR]</b>, de [EDAD EN LETRAS] años de edad, según certificado de nacimiento [DATOS DE LA INSCRIPCIÓN EN EL REGISTRO DEL ESTADO CIVIL], que doy fe de haber tenido a la vista, portador del pasaporte número [NÚMERO DE PASAPORTE].',
      '<b>SEGUNDA (AUTORIZACIÓN):</b> Que autoriza a su menor hijo para salir del territorio nacional con destino a [PAÍS Y CIUDAD], [EN COMPAÑÍA DE / BAJO EL CUIDADO DE] [NOMBRE Y DOCUMENTO DE IDENTIDAD DEL ACOMPAÑANTE], a partir del día [FECHA EN LETRAS], y regresar a más tardar el día [FECHA EN LETRAS].',
      '<b>TERCERA (ALCANCE):</b> Que esta autorización es válida únicamente para el viaje indicado.',
      FIN1(),
    ] },
    { id: 'capitulaciones', cat: 'Familia', title: 'Capitulaciones matrimoniales', tags: 'régimen económico separación bienes gananciales', note: 'Código de Familia, Art. 106; Ley del Notariado, Art. 70 (bienes aportados y deudas).', body: [
      `${ENC('CAPITULACIONES MATRIMONIALES', `comparecen el señor ${GEN('DEL CÓNYUGE')}; y la señora ${GEN('DE LA CÓNYUGE')}.`)} ${FE2} Hablan los comparecientes y dicen:`,
      '<b>PRIMERA (ANTECEDENTE):</b> Que [HAN CONVENIDO EN CONTRAER MATRIMONIO / CONTRAJERON MATRIMONIO EL DÍA ..., SEGÚN ...].',
      '<b>SEGUNDA (RÉGIMEN):</b> Que conforme al artículo ciento seis del Código de Familia convienen en adoptar para su matrimonio el régimen económico de [SEPARACIÓN DE BIENES / PARTICIPACIÓN EN LAS GANANCIAS / COMUNIDAD DE BIENES].',
      '<b>TERCERA (BIENES Y DEUDAS):</b> Que cada uno aporta los siguientes bienes, con expresión de su valor: [BIENES DE CADA CÓNYUGE]; y declaran las siguientes deudas: [DEUDAS DE CADA CÓNYUGE]. Yo, {EL_NOTARIO}, les hice saber lo dispuesto en el artículo setenta de la Ley del Notariado.',
      '<b>CUARTA (ADMINISTRACIÓN):</b> Que [REGLAS DE ADMINISTRACIÓN DE LOS BIENES].',
      FIN2(INS('el Registro competente')),
    ] },

    // ---------- Sociedades ----------
    { id: 'sociedad-anonima', cat: 'Sociedades', title: 'Constitución de sociedad anónima y estatutos', tags: 'empresa S.A. pacto social', note: 'Código de Comercio, Art. 121 (reformado por la Ley 1113): escritura pública y declaración del Beneficiario Final.', body: [
      `${ENC('CONSTITUCIÓN DE SOCIEDAD ANÓNIMA Y APROBACIÓN DE ESTATUTOS', `comparecen los señores ${GEN('DEL PRIMER SOCIO')}; y ${GEN('DEL SEGUNDO SOCIO')}.`)} ${FE2} Hablan los comparecientes y dicen:`,
      '<b>PRIMERA (CONSTITUCIÓN):</b> Que por medio de este instrumento constituyen una sociedad anónima que se regirá por el Código de Comercio, las demás leyes de la República y los estatutos que se aprueban en esta escritura.',
      '<b>SEGUNDA (DENOMINACIÓN):</b> Que la sociedad se denominará <b>[DENOMINACIÓN SOCIAL], SOCIEDAD ANÓNIMA</b>, y podrá abreviarse <b>[ABREVIATURA], S.A.</b>',
      '<b>TERCERA (DOMICILIO):</b> Que su domicilio será la ciudad de [CIUDAD], pudiendo establecer sucursales y agencias en cualquier lugar de la República o del extranjero.',
      '<b>CUARTA (OBJETO):</b> Que su objeto será [OBJETO SOCIAL DETALLADO], y en general la realización de cualquier acto lícito de comercio relacionado con dicho objeto.',
      '<b>QUINTA (DURACIÓN):</b> Que su duración será de [NOVENTA Y NUEVE] años contados a partir de su inscripción en el Registro Público Mercantil.',
      '<b>SEXTA (CAPITAL Y ACCIONES):</b> Que el capital social es de [CAPITAL EN LETRAS] córdobas (C$ [CAPITAL EN CIFRAS]), dividido en [NÚMERO EN LETRAS] acciones nominativas de [VALOR EN LETRAS] córdobas cada una, suscritas y pagadas así: [SOCIO]: [NÚMERO] acciones; [SOCIO]: [NÚMERO] acciones; pagadas [EN EFECTIVO / EN ESPECIE: ...].',
      '<b>SÉPTIMA (ADMINISTRACIÓN Y REPRESENTACIÓN):</b> Que la administración estará a cargo de una Junta Directiva de [NÚMERO] miembros: Presidente, Secretario y Tesorero, electos por la Junta General de Accionistas para períodos de [NÚMERO] años. El Presidente será el representante legal de la sociedad con facultades de [APODERADO GENERALÍSIMO / ...].',
      '<b>OCTAVA (VIGILANCIA):</b> Que la vigilancia estará a cargo de un Vigilante electo por la Junta General de Accionistas.',
      '<b>NOVENA (EJERCICIO, UTILIDADES Y RESERVA):</b> Que el ejercicio económico será del [PRIMERO DE ENERO AL TREINTA Y UNO DE DICIEMBRE] de cada año; de las utilidades netas se separará [PORCENTAJE] para el fondo de reserva legal y el resto se distribuirá según acuerde la Junta General.',
      '<b>DÉCIMA (DISOLUCIÓN Y LIQUIDACIÓN):</b> Que la sociedad se disolverá por las causas que establece el Código de Comercio, y su liquidación se hará por [UNO O MÁS LIQUIDADORES] nombrados por la Junta General.',
      '<b>UNDÉCIMA (PRIMERA JUNTA DIRECTIVA):</b> Que para el primer período eligen: Presidente: [NOMBRE]; Secretario: [NOMBRE]; Tesorero: [NOMBRE]; y Vigilante: [NOMBRE].',
      '<b>DUODÉCIMA (ESTATUTOS):</b> Que constituidos en Junta General de Accionistas aprueban por unanimidad los siguientes estatutos: <b>ARTÍCULO PRIMERO (JUNTA GENERAL):</b> La Junta General de Accionistas es la máxima autoridad de la sociedad; se reunirá en sesión ordinaria una vez al año, dentro de los [NÚMERO] meses siguientes al cierre del ejercicio, y en sesión extraordinaria cuando la convoque la Junta Directiva o la soliciten accionistas que representen al menos [PORCENTAJE] del capital. <b>ARTÍCULO SEGUNDO (CONVOCATORIA Y QUÓRUM):</b> La convocatoria se hará con [NÚMERO] días de anticipación por [MEDIO]; habrá quórum con la presencia de [PORCENTAJE] de las acciones, y las resoluciones se tomarán por mayoría de votos presentes, salvo las que requieran mayoría calificada. No será necesaria convocatoria si están presentes o representadas todas las acciones. <b>ARTÍCULO TERCERO (JUNTA DIRECTIVA):</b> La Junta Directiva sesionará [PERIODICIDAD]; habrá quórum con la mayoría de sus miembros y sus resoluciones se tomarán por mayoría. <b>ARTÍCULO CUARTO (LIBROS):</b> La sociedad llevará los libros de actas, de registro de acciones y de contabilidad que exige la ley. <b>ARTÍCULO QUINTO (CASOS NO PREVISTOS):</b> Lo no previsto en estos estatutos se regirá por el Código de Comercio.',
      '<b>DECIMOTERCERA (BENEFICIARIO FINAL):</b> Que el beneficiario final de la sociedad es [NOMBRE Y GENERALES DEL BENEFICIARIO FINAL].',
      FIN2(INS('el Registro Público Mercantil competente'), 'la obligación de la sociedad de declarar y actualizar la información de su Beneficiario Final ante el registro correspondiente, conforme al artículo ciento veintiuno del Código de Comercio'),
    ] },
    { id: 'acta-junta', cat: 'Sociedades', title: 'Acta de junta general extraordinaria de accionistas', tags: 'asamblea accionistas libro de actas', body: [
      '^<b>ACTA NÚMERO [NÚMERO EN LETRAS] ([NÚMERO EN CIFRAS])</b>',
      '<b>JUNTA GENERAL EXTRAORDINARIA DE ACCIONISTAS DE [DENOMINACIÓN SOCIAL], SOCIEDAD ANÓNIMA.</b> En la ciudad de {CIUDAD}, {HORA_FECHA}, reunidos en [LUGAR], los accionistas: [NOMBRE], dueño de [NÚMERO] acciones; y [NOMBRE], dueño de [NÚMERO] acciones; que representan [LA TOTALIDAD / EL ... POR CIENTO] del capital social suscrito y pagado, [SIN NECESIDAD DE CONVOCATORIA PREVIA POR ESTAR PRESENTES TODAS LAS ACCIONES / PREVIA CONVOCATORIA HECHA EL ... POR ...]. Preside [NOMBRE], Presidente de la Junta Directiva, y actúa como secretario [NOMBRE]. Comprobado el quórum, el Presidente abre la sesión y somete a consideración la siguiente agenda: uno) [PUNTO DE AGENDA]; y dos) [PUNTO DE AGENDA].',
      '<b>PRIMERO:</b> [DESARROLLO Y RESOLUCIÓN DEL PRIMER PUNTO]. Sometido a votación, se aprueba por [UNANIMIDAD DE VOTOS].',
      '<b>SEGUNDO:</b> Se autoriza al [SECRETARIO / NOTARIO ...] para librar certificación de la presente acta, la que será documento suficiente para acreditar lo resuelto.',
      'No habiendo otro asunto que tratar, se levanta la sesión, y leída que fue la presente acta, se aprueba, ratifica y firma por todos los presentes.',
    ] },
    { id: 'certificacion-acta', cat: 'Sociedades', title: 'Certificación notarial de acta', tags: 'libro de actas junta', body: [
      `<b>CERTIFICACIÓN.</b> Yo, ${NOT}, <b>CERTIFICO</b>: que he tenido a la vista el Libro de Actas de la sociedad <b>[DENOMINACIÓN SOCIAL], SOCIEDAD ANÓNIMA</b>, [DATOS DE REGISTRO DEL LIBRO], y que de la página [NÚMERO EN LETRAS] a la página [NÚMERO EN LETRAS] se encuentra el Acta número [NÚMERO EN LETRAS], que íntegra y literalmente dice: «[INSERTE EL ACTA ÍNTEGRA]».`,
      'Es conforme con su original, con el cual fue debidamente cotejada, y a solicitud de [NOMBRE DEL SOLICITANTE] libro la presente certificación en la ciudad de {CIUDAD}, {HORA_FECHA}.',
    ] },

    // ---------- Declaraciones y actas ----------
    { id: 'declaracion-notarial', cat: 'Declaraciones y actas', title: 'Declaración notarial', body: [
      `${ENC('DECLARACIÓN NOTARIAL', UNO('DEL DECLARANTE'))} ${FE1} Habla el compareciente y dice:`,
      '<b>PRIMERA:</b> Que [EXPONGA LOS HECHOS QUE DECLARA, EN PRIMERA PERSONA, CON CLARIDAD Y PRECISIÓN].',
      '<b>SEGUNDA:</b> Que hace esta declaración para [FINALIDAD: PRESENTARLA ANTE ...].',
      FIN1(),
    ] },
    { id: 'declaracion-jurada', cat: 'Declaraciones y actas', title: 'Declaración jurada', tags: 'soltería ingresos dependencia bienes', body: [
      `${ENC('DECLARACIÓN JURADA', UNO('DEL DECLARANTE'))} ${FE1} Habla el compareciente y dice:`,
      '<b>PRIMERA:</b> Que bajo promesa de ley declara: [HECHOS DECLARADOS: SOLTERÍA, INGRESOS, DEPENDENCIA ECONÓMICA, BIENES, ...].',
      '<b>SEGUNDA:</b> Que hace esta declaración para [FINALIDAD].',
      FIN1('las responsabilidades legales en que incurre quien declara con falsedad'),
    ] },
    { id: 'acta-notoriedad', cat: 'Declaraciones y actas', title: 'Acta notarial de notoriedad', note: 'Para la identificación de persona que usa un nombre distinto al de su partida, vea la Ley 139, Arto. 3 (y el Arto. 8: diez años de incorporado).', body: [
      `<b>NÚMERO {NUMERO}.- ACTA NOTARIAL DE NOTORIEDAD.-</b> En la ciudad de {CIUDAD}, {HORA_FECHA}.- ANTE MÍ: ${NOT}, comparece el señor ${GEN('DEL REQUIRENTE')}, quien me solicita levantar acta de notoriedad para acreditar que [HECHO QUE SE QUIERE HACER NOTORIO]. ${FE1}`,
      `Para tal fin presenta como testigos idóneos a los señores ${GEN('DEL PRIMER TESTIGO')}; y ${GEN('DEL SEGUNDO TESTIGO')}; a quienes advertí de las responsabilidades legales en que incurre quien declara con falsedad, y quienes declaran: [DECLARACIÓN DE LOS TESTIGOS].`,
      'Con vista de lo declarado y de [DOCUMENTOS PRESENTADOS], que doy fe de haber tenido a la vista, yo, {EL_NOTARIO}, declaro notorio que [HECHO NOTORIO].',
      'Leída que fue por mí, {EL_NOTARIO}, íntegramente esta acta al requirente y a los testigos, la encuentran conforme, la aprueban, ratifican y firman junto conmigo, {EL_NOTARIO}, que doy fe de todo lo relacionado.',
    ] },
    { id: 'acta-presencia', cat: 'Declaraciones y actas', title: 'Acta notarial de presencia', tags: 'hechos constatación', body: [
      `<b>NÚMERO {NUMERO}.- ACTA NOTARIAL DE PRESENCIA.-</b> En [LUGAR EXACTO], municipio de {CIUDAD}, {HORA_FECHA}, constituido yo, ${NOT}, a solicitud del señor ${GEN('DEL REQUIRENTE')}, [QUIEN ACTÚA EN SU PROPIO NOMBRE / EN REPRESENTACIÓN DE ...], con el objeto de hacer constar [OBJETO DEL REQUERIMIENTO]. ${FE1}`,
      'Acto seguido hago constar lo siguiente: [RELACIÓN CLARA Y CRONOLÓGICA DE LOS HECHOS QUE PRESENCIA EL NOTARIO].',
      'Con lo cual se da por concluida la presente acta a las [HORA EN LETRAS] del mismo día, la que leída que fue íntegramente al requirente, la encuentra conforme, la aprueba, ratifica y firma junto conmigo, {EL_NOTARIO}, que doy fe de todo lo relacionado.',
    ] },
    { id: 'razon-cotejo', cat: 'Declaraciones y actas', title: 'Certificación de fotocopia (razón de cotejo)', tags: 'copia conforme original', body: [
      `<b>RAZÓN DE COTEJO.</b> Yo, ${NOT}, doy fe de que la presente fotocopia, compuesta de [NÚMERO EN LETRAS] hojas útiles, es conforme con su original, [DESCRIPCIÓN DEL DOCUMENTO], con el cual fue debidamente cotejada. A solicitud de [NOMBRE DEL SOLICITANTE] libro la presente en la ciudad de {CIUDAD}, {HORA_FECHA}.`,
    ] },
    { id: 'autenticacion-firma', cat: 'Declaraciones y actas', title: 'Autenticación de firma', tags: 'documento privado', note: 'Ley del Notariado, Art. 41.', body: [
      AUTENTICA('la firma que antecede, puesta al pie de [DESCRIPCIÓN DEL DOCUMENTO], es auténtica', `el señor ${GEN('DEL FIRMANTE')}`),
    ] },

    // ---------- Sucesiones ----------
    { id: 'testamento-abierto', cat: 'Sucesiones', title: 'Testamento abierto', note: 'Código Civil, Arts. 1029 y 1035 a 1040: notario y tres testigos idóneos que vean, oigan y entiendan al testador (al menos dos saben leer y escribir), en un solo acto. Revise las inhabilidades de los testigos.', body: [
      `<b>ESCRITURA PÚBLICA NÚMERO {NUMERO}.- TESTAMENTO ABIERTO.-</b> En la ciudad de {CIUDAD}, {HORA_FECHA}.- ANTE MÍ: ${NOT}, y de los testigos instrumentales idóneos señores ${GEN('DEL PRIMER TESTIGO')}; ${GEN('DEL SEGUNDO TESTIGO')}; y ${GEN('DEL TERCER TESTIGO')}; quienes ven, oyen y entienden al testador, comparece el señor ${GEN('DEL TESTADOR')}. Doy fe de haber identificado conforme a la ley al testador y a los testigos instrumentales por medio de sus documentos de identidad relacionados, y de que el testador se halla, a mi juicio, en su sano juicio y con la capacidad necesaria para otorgar testamento. El testador expresa su última voluntad en presencia de los testigos y de mí, {EL_NOTARIO}, en los términos siguientes:`,
      '<b>PRIMERA (GENERALES Y FAMILIA):</b> Que es hijo de [NOMBRES DE LOS PADRES]; que es de estado civil [ESTADO CIVIL Y NOMBRE DEL CÓNYUGE O CONVIVIENTE, SI LO HAY]; y que ha procreado a [NOMBRES DE LOS HIJOS].',
      '<b>SEGUNDA (BIENES):</b> Que sus bienes son: [RELACIÓN DE BIENES].',
      '<b>TERCERA (INSTITUCIÓN DE HEREDEROS):</b> Que instituye como [ÚNICO Y UNIVERSAL HEREDERO / HEREDEROS EN LAS PROPORCIONES SIGUIENTES] de todos sus bienes, derechos y acciones, presentes y futuros, a [NOMBRES].',
      '<b>CUARTA (LEGADOS):</b> Que [LEGA A ... / NO HACE LEGADOS].',
      '<b>QUINTA (ALBACEA):</b> Que nombra albacea a [NOMBRE].',
      '<b>SEXTA (REVOCACIÓN):</b> Que revoca cualquier testamento o disposición de última voluntad anterior, y quiere que este se cumpla como su última voluntad.',
      'Yo, {EL_NOTARIO}, redacté las cláusulas anteriores conforme a la voluntad expresada por el testador y las leí en alta voz a este en presencia de los testigos, manifestando el testador que está conforme con ellas y que son su última voluntad. Todas las formalidades se practicaron en un solo acto, sin interrupción alguna. Instruí al testador acerca del objeto, valor, alcance y trascendencias legales de este acto. Leída que fue íntegramente esta escritura, el testador y los testigos la encuentran conforme, la aprueban, ratifican y firman junto conmigo, {EL_NOTARIO}, que doy fe de todo lo relacionado, del cumplimiento de las formalidades de ley y de haber identificado conforme a la ley al testador y a los testigos instrumentales.',
    ] },
    { id: 'aceptacion-herencia', cat: 'Sucesiones', title: 'Aceptación de herencia', tags: 'heredero sucesión', body: [
      `${ENC('ACEPTACIÓN DE HERENCIA', UNO('DEL HEREDERO'))} ${FE1} Habla el compareciente y dice:`,
      '<b>PRIMERA (FALLECIMIENTO):</b> Que el día [FECHA EN LETRAS] falleció en [LUGAR] el señor <b>[NOMBRE DEL CAUSANTE]</b>, según certificado de defunción [DATOS DE LA INSCRIPCIÓN], que doy fe de haber tenido a la vista.',
      '<b>SEGUNDA (TÍTULO DE HEREDERO):</b> Que es heredero del causante según [TESTAMENTO OTORGADO ... / DECLARATORIA DE HEREDEROS DE ...], documento que doy fe de haber tenido a la vista y del cual inserto lo conducente: «[INSERCIÓN]».',
      '<b>TERCERA (ACEPTACIÓN):</b> Que por medio de este instrumento acepta [PURA Y SIMPLEMENTE / CON BENEFICIO DE INVENTARIO] la herencia dejada por el causante, que comprende: [RELACIÓN DE BIENES CON SUS DATOS REGISTRALES].',
      FIN1(INS(RPI)),
    ] },
    { id: 'cesion-derechos-hereditarios', cat: 'Sucesiones', title: 'Cesión de derechos hereditarios', note: 'Código Civil, Art. 2735.', body: [
      `${ENC('CESIÓN DE DERECHOS HEREDITARIOS', DOS('DEL CEDENTE', 'el Cedente', 'DEL CESIONARIO', 'el Cesionario'))} ${FE2} Hablan los comparecientes y dicen:`,
      '<b>PRIMERA (DERECHOS):</b> Habla el Cedente y dice: Que es heredero del señor [NOMBRE DEL CAUSANTE], fallecido el día [FECHA EN LETRAS], según [TÍTULO HEREDITARIO], y que en dicha sucesión le corresponden [DERECHOS: PORCENTAJE O BIENES].',
      `<b>SEGUNDA (CESIÓN):</b> Que por ${PRECIO}, que declara recibidos a su entera satisfacción, cede y traspasa al Cesionario [LA TOTALIDAD / EL ... POR CIENTO] de los derechos hereditarios relacionados.`,
      '<b>TERCERA (ACEPTACIÓN):</b> Habla el Cesionario y dice: Que acepta la cesión que se le hace en los términos relacionados.',
      FIN2(INS(RPI) + ', pues conforme al artículo dos mil setecientos treinta y cinco del Código Civil la cesión de derechos hereditarios debe hacerse por escritura pública inscrita en el competente Registro'),
    ] },

    // ---------- Testimonio ----------
    { id: 'cierre-testimonio', cat: 'Testimonio', title: 'Cierre de testimonio', tags: 'pasó ante mí libro', note: 'Ley del Notariado, Art. 38. Agregue su firma con «Firmas» (opción «Agregar mi firma de notario»).', body: [
      '<b>PASÓ ANTE MÍ:</b> del [FRENTE] del folio número [NÚMERO EN LETRAS] al [REVERSO] del folio número [NÚMERO EN LETRAS] de mi Protocolo número {PROTOCOLO} que llevo durante el año {PROTOCOLO_ANIO}, y a solicitud de [NOMBRE DEL SOLICITANTE], libro este <b>[PRIMER]</b> testimonio en [NÚMERO EN LETRAS] hojas útiles de papel sellado de ley, las que firmo, rubrico y sello en la ciudad de {CIUDAD}, {HORA_FECHA}. [TESTADO: «...» NO VALE. ENTRELÍNEAS: «...» VALE.]',
    ] },

    // ---------- Cláusulas comunes ----------
    { id: 'representacion-sociedad', cat: 'Cláusulas comunes', title: 'Comparecencia en representación de sociedad', tags: 'representante legal persona jurídica beneficiario final', note: 'Ley del Notariado, Arts. 23 Nº 3 y 24; Art. 15 Nº 18 (Ley 1113).', body: [
      'quien comparece en nombre y representación de <b>[DENOMINACIÓN SOCIAL], SOCIEDAD ANÓNIMA</b>, sociedad constituida y existente conforme a las leyes de la República de Nicaragua, del domicilio de [DOMICILIO], [DATOS DE INSCRIPCIÓN EN EL REGISTRO PÚBLICO MERCANTIL], en su calidad de [CARGO], lo que acredita con: a) testimonio de la escritura pública número [NÚMERO EN LETRAS] de constitución de la sociedad y aprobación de sus estatutos, autorizada en [CIUDAD] a las [HORA EN LETRAS] del día [FECHA EN LETRAS], ante el Notario [NOMBRE DEL NOTARIO]; y b) [CERTIFICACIÓN DEL ACTA O PODER], que en lo conducente dice: «[INSERCIÓN LITERAL]». Doy fe de haber tenido a la vista los documentos relacionados, que confieren al compareciente facultades suficientes para el otorgamiento de este acto, y agrego a mi protocolo copia razonada del certificado vigente de declaración del Beneficiario Final de la sociedad representada.',
    ] },
    { id: 'comparecencia-apoderado', cat: 'Cláusulas comunes', title: 'Comparecencia por apoderado (inserción de poder)', note: 'Ley del Notariado, Arts. 23 Nº 3 y 24.', body: [
      'quien comparece en nombre y representación del señor [NOMBRE Y GENERALES DEL PODERDANTE], en su calidad de apoderado [GENERALÍSIMO / ESPECIAL], lo que acredita con testimonio de la escritura pública número [NÚMERO EN LETRAS] de [CLASE DE PODER], autorizada en la ciudad de [CIUDAD] a las [HORA EN LETRAS] del día [FECHA EN LETRAS], ante los oficios del Notario [NOMBRE DEL NOTARIO], [DATOS DE INSCRIPCIÓN], documento que doy fe de haber tenido a la vista y que confiere al compareciente facultades suficientes para el otorgamiento de este acto, del cual inserto lo conducente: «[INSERCIÓN LITERAL DE LAS FACULTADES]».',
    ] },
    { id: 'firma-ruego', cat: 'Cláusulas comunes', title: 'Firma a ruego', tags: 'no sabe firmar huella', note: 'Ley del Notariado, Art. 31.', body: [
      `El compareciente [NOMBRE] manifiesta no saber [O NO PODER] firmar, por lo que a su ruego firma por él el señor ${GEN('DE QUIEN FIRMA A RUEGO')}, [Y EL COMPARECIENTE IMPRIME SU HUELLA DIGITAL], de todo lo cual doy fe.`,
    ] },
    { id: 'interprete', cat: 'Cláusulas comunes', title: 'Intervención de intérprete', tags: 'idioma traducción', note: 'Ley del Notariado, Arts. 23 Nº 4 y 33.', body: [
      `Por no hablar el idioma español el compareciente [NOMBRE], interviene en este acto como intérprete, nombrado por él, el señor ${GEN('DEL INTÉRPRETE')}, quien conoce los idiomas español y [IDIOMA], y promete traducir fielmente lo que se exprese en este acto. Doy fe de haber identificado al intérprete por medio del documento relacionado.`,
    ] },
    { id: 'cierre-escritura', cat: 'Cláusulas comunes', title: 'Advertencias y cierre de escritura', tags: 'lectura doy fe conclusión', note: 'Ley del Notariado, Arts. 15 Nº 10, 28 y 29.', body: [
      FIN2(INS('[REGISTRO COMPETENTE]')),
    ] },
  ];
})();
