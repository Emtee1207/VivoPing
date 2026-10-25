import { Language, SUPPORTED_LANGUAGES } from './i18n';

export type AlertTemplateId = 'standard' | 'medical' | 'discreet' | 'vault_legal' | 'outdoor_travel';

export interface AlertTemplateConfig {
  id: AlertTemplateId;
  name: Record<Language, string>;
  description: Record<Language, string>;
  category: Record<Language, string>;
  badge: Record<Language, string>;
  badgeColor: string;
  recommendedFor: Record<Language, string>;
  templates: Record<Language, string>;
}

export const ALERT_TEMPLATES: AlertTemplateConfig[] = [
  {
    id: 'standard',
    badgeColor: 'rose',
    name: {
      de: 'Vorlage 1: Standard Notfall-Alarm (Ausgewogen & Klar)',
      en: 'Template 1: Standard Emergency Alert (Balanced & Clear)',
      fr: 'Modèle 1 : Alerte d\'urgence standard (Équilibré & Clair)',
      es: 'Plantilla 1: Alerta de emergencia estándar (Equilibrada)',
      ru: 'Шаблон 1: Стандартная тревога (Сбалансированный)'
    },
    category: {
      de: 'Allgemein',
      en: 'General',
      fr: 'Général',
      es: 'General',
      ru: 'Общий'
    },
    badge: {
      de: 'Standard',
      en: 'Default',
      fr: 'Défaut',
      es: 'Predeterminado',
      ru: 'Основной'
    },
    description: {
      de: 'Ausgewogene Nachricht mit Fristablauf-Warnung, GPS-Standort und Freischaltung des digitalen Tresors.',
      en: 'Balanced message reporting expired check-in deadline, GPS location and emergency vault unlock.',
      fr: 'Message équilibré avec alerte d\'expiration, position GPS et accès au coffre-fort numérique.',
      es: 'Mensaje equilibrado con aviso de plazo vencido, posición GPS y acceso al baúl de emergencia.',
      ru: 'Сбалансированное сообщение об истечении таймера, координатах GPS и доступе к сейфу.'
    },
    recommendedFor: {
      de: 'Ideal für den täglichen Standard-Schutz für Familie und Partner.',
      en: 'Ideal for standard daily protection for family and partners.',
      fr: 'Idéal pour la protection quotidienne auprès de la famille et proches.',
      es: 'Ideal para la protección diaria con familiares y parejas.',
      ru: 'Идеально для ежедневной защиты семьи и близких.'
    },
    templates: {
      de: '[VivoPing NOTFALL-ALARM] Kein Lebenszeichen von {userName} nach Ablauf der Kontrollfrist! Letzter bekannter Aufenthaltsort ({time} Uhr): {mapsUrl} (GPS: {lat}, {lng}). Bitte nehmen Sie unverzüglich Kontakt auf oder verständigen Sie Angehörige/Notdienste. Der digitale Tresor ist nun für Sie zugänglich.',
      en: '[VivoPing EMERGENCY ALERT] No sign of life received from {userName} after deadline expiration! Last known location ({time}): {mapsUrl} (GPS: {lat}, {lng}). Please verify welfare immediately or alert emergency services. Emergency vault access is now unlocked.',
      fr: '[VivoPing ALERTE D\'URGENCE] Aucun signe de vie reçu de {userName} après expiration du délai ! Dernière position connue ({time}) : {mapsUrl} (GPS : {lat}, {lng}). Merci de vérifier son état immédiatement ou de contacter les secours. Le coffre-fort d\'urgence est déverrouillé.',
      es: '[VivoPing ALERTA DE EMERGENCIA] ¡Sin señales de vida de {userName} tras expirar el plazo! Última ubicación conocida ({time}): {mapsUrl} (GPS: {lat}, {lng}). Por favor compruebe su estado de inmediato o avise a emergencias. Acceso al baúl digital desbloqueado.',
      ru: '[VivoPing ЭКСТРЕННАЯ ТРЕВОГА] Нет подтверждения жизни от {userName} после истечения срока таймера! Последнее известное местоположение ({time}): {mapsUrl} (GPS: {lat}, {lng}). Срочно свяжитесь или оповестите экстренные службы. Доступ к цифровому сейфу открыт.'
    }
  },
  {
    id: 'medical',
    badgeColor: 'red',
    name: {
      de: 'Vorlage 2: Akuter Medizinischer Notfall (Rettungsdienst-Fokus)',
      en: 'Template 2: Acute Medical Emergency (Paramedic Focus)',
      fr: 'Modèle 2 : Urgence médicale aiguë (Alerte secours)',
      es: 'Plantilla 2: Emergencia médica aguda (Enfoque paramédico)',
      ru: 'Шаблон 2: Острый медицинский кризис (Скорая помощь)'
    },
    category: {
      de: 'Medizinisch',
      en: 'Medical',
      fr: 'Médical',
      es: 'Médico',
      ru: 'Медицинский'
    },
    badge: {
      de: 'Hohe Dringlichkeit',
      en: 'High Urgency',
      fr: 'Urgence maximale',
      es: 'Máxima urgencia',
      ru: 'Срочно'
    },
    description: {
      de: 'Fokus auf akute Hilflosigkeit oder plötzliche Erkrankung. Fordert Notfallkontakte zur Nachschau oder zum Anruf der 112 auf.',
      en: 'Focus on acute incapacitation or sudden health crisis. Prompts contacts for an immediate welfare check or 911/112 alert.',
      fr: 'Focalisé sur une incapacité subite ou détresse médicale. Incite à une visite sur place ou appel au 112.',
      es: 'Enfocado en incapacidad repentina o crisis de salud. Pide llamada inmediata a emergencias o visita urgente.',
      ru: 'Фокус на острой потере дееспособности или приступе. Призывает вызвать скорую или немедленно проверить.'
    },
    recommendedFor: {
      de: 'Für Alleinlebende mit Vorerkrankungen oder erhöhtem gesundheitlichen Risiko.',
      en: 'For people living alone with pre-existing conditions or elevated health risks.',
      fr: 'Pour personnes vivant seules avec antécédents médicaux ou risques accrus.',
      es: 'Para personas que viven solas con condiciones médicas o riesgo elevado.',
      ru: 'Для одиноко проживающих людей с хроническими заболеваниями.'
    },
    templates: {
      de: '[VivoPing MEDIZINISCHER NOTFALL] Dringender Verdacht auf akute Hilflosigkeit oder medizinischen Notfall bei {userName}! Seit Fristablauf kein Lebenszeichen. Bitte sofort Rettungsdienst (112) oder Nachbarn zur Nachschau verständigen! Letzte GPS-Position ({time} Uhr): {mapsUrl} (GPS: {lat}, {lng}).',
      en: '[VivoPing MEDICAL EMERGENCY] Urgent welfare check required for {userName}! Medical emergency or incapacitation suspected. No check-in recorded. Please contact emergency services (911/112) or arrange an immediate welfare check. Last location ({time}): {mapsUrl} (GPS: {lat}, {lng}).',
      fr: '[VivoPing URGENCE MÉDICALE] Contrôle urgent requis pour {userName} ! Suspicion de détresse médicale ou incapacité. Aucun signe de vie. Veuillez contacter d\'urgence les services de secours (112/15) ou un proche sur place. Dernière position ({time}) : {mapsUrl} (GPS : {lat}, {lng}).',
      es: '[VivoPing EMERGENCIA MÉDICA] ¡Revisión médica urgente requerida para {userName}! Se teme incapacidad o emergencia médica grave. Sin respuesta tras expirar el tiempo. Llame de inmediato a emergencias (112) o acuda al domicilio. Última posición ({time}): {mapsUrl} (GPS: {lat}, {lng}).',
      ru: '[VivoPing МЕДИЦИНСКАЯ ТРЕВОГА] Срочно требуется проверка состояния {userName}! Подозрение на несчастный случай или медицинский кризис. Нет реакции на сигнал таймера. Срочно вызовите скорую помощь (112) или проверьте лично! Координаты ({time}): {mapsUrl} (GPS: {lat}, {lng}).'
    }
  },
  {
    id: 'discreet',
    badgeColor: 'blue',
    name: {
      de: 'Vorlage 3: Diskrete Benachrichtigung (Zurückhaltend & Privat)',
      en: 'Template 3: Discreet Notification (Low-Key & Gentle)',
      fr: 'Modèle 3 : Notification discrète (Mesurée & Privée)',
      es: 'Plantilla 3: Notificación discreta (Prudente y Privada)',
      ru: 'Шаблон 3: Сдержанное уведомление (Мягкий тон)'
    },
    category: {
      de: 'Diskret',
      en: 'Discreet',
      fr: 'Discret',
      es: 'Discreto',
      ru: 'Сдержанный'
    },
    badge: {
      de: 'Sanfter Alarm',
      en: 'Gentle Notice',
      fr: 'Avis modéré',
      es: 'Aviso suave',
      ru: 'Деликатный'
    },
    description: {
      de: 'Ruhiger Tonfall, um Panik bei den Angehörigen zu vermeiden. Bittet zunächst um einen kurzen Telefonanruf.',
      en: 'Gentle tone designed to prevent panic. Asks contacts to try a phone call or quick check first.',
      fr: 'Ton mesuré évitant la panique inutile. Demande d\'abord un appel téléphonique de courtoisie.',
      es: 'Tono moderado para evitar alarmismo. Sugiere llamar por teléfono o verificar primero.',
      ru: 'Спокойный тон без паники. Предлагает сначала набрать по телефону или уточнить у знакомых.'
    },
    recommendedFor: {
      de: 'Für Nutzer, die häufig unterwegs sind oder deren Angehörige sich schnell übermäßige Sorgen machen.',
      en: 'For frequent travelers or when relatives might worry too quickly about a delay.',
      fr: 'Pour utilisateurs souvent occupés dont les proches s\'inquiètent facilement.',
      es: 'Para personas con agendas cambiantes o familiares propensos a alarmarse rápido.',
      ru: 'Для тех, кто часто занят или чьи близкие склонны к излишней тревожности.'
    },
    templates: {
      de: '[VivoPing Benachrichtigung] Hallo, dies ist eine automatische Information von {userName}. Der regelmäßige Sicherheits-Check-in wurde heute verpasst. Bitte versuchen Sie zunächst, {userName} telefonisch zu erreichen oder kurz nachzuschauen, bevor weitere Schritte unternommen werden. Standort: {mapsUrl} ({time} Uhr).',
      en: '[VivoPing Notice] Hello, this is an automated safety message from {userName}. The scheduled safety check-in was missed today. Please try reaching out by phone or dropping by before taking formal steps. Last known location: {mapsUrl} ({time}).',
      fr: '[VivoPing Notification] Bonjour, message automatique de sécurité de {userName}. Le contrôle périodique de sécurité n\'a pas été validé. Merci d\'essayer de joindre {userName} par téléphone ou de passer voir avant d\'engager d\'autres démarches. Position : {mapsUrl} ({time}).',
      es: '[VivoPing Aviso] Hola, este es un aviso automático de seguridad de {userName}. Se ha omitido el check-in programado de hoy. Por favor intenta llamarle por teléfono o pasar a verle antes de tomar otras medidas. Ubicación: {mapsUrl} ({time}).',
      ru: '[VivoPing Уведомление] Здравствуйте! Это автоматическое сообщение от {userName}. Плановая проверка безопасности сегодня была пропущена. Пожалуйста, сначала попробуйте позвонить по телефону или заглянуть лично. Местоположение: {mapsUrl} ({time}).'
    }
  },
  {
    id: 'vault_legal',
    badgeColor: 'amber',
    name: {
      de: 'Vorlage 4: Digitaler Nachlass & Vollmachten (Tresor-Fokus)',
      en: 'Template 4: Digital Legacy & Vault Access (Legal Focus)',
      fr: 'Modèle 4 : Succession numérique & Coffre-fort (Juridique)',
      es: 'Plantilla 4: Legado digital y Baúl de claves (Enfoque legal)',
      ru: 'Шаблон 4: Цифровое наследство и сейф (Юридический фокус)'
    },
    category: {
      de: 'Tresor & Vollmacht',
      en: 'Vault & Legal',
      fr: 'Coffre & Notarial',
      es: 'Baúl & Legal',
      ru: 'Сейф и полномочия'
    },
    badge: {
      de: 'Nachlass-Fokus',
      en: 'Legacy Focus',
      fr: 'Accès coffre',
      es: 'Acceso claves',
      ru: 'Доступ к сейфу'
    },
    description: {
      de: 'Weist ausdrücklich auf die Berechtigung zum Abruf hinterlegter Passwörter, Verträge und Vorsorgedokumente hin.',
      en: 'Emphasizes authorized access to stored passwords, contracts, financial records and legal directives.',
      fr: 'Met l\'accent sur l\'autorisation d\'accéder aux mots de passe, contrats et directives médicales.',
      es: 'Destaca la autorización para consultar contraseñas, documentos patrimoniales y directivas.',
      ru: 'Подчеркивает передачу доступа к паролям, документам, доверенностям и инструкциям.'
    },
    recommendedFor: {
      de: 'Für Notfallkontakte, die als bevollmächtigte Nachlass- oder Vermögensverwalter hinterlegt sind.',
      en: 'For designated trusted contacts acting as legal representatives, executors or trustees.',
      fr: 'Pour mandataires légaux, exécuteurs testamentaires ou proches gérant les démarches.',
      es: 'Para apoderados, albaceas o contactos designados para gestiones formales.',
      ru: 'Для доверенных лиц, распорядителей имущества или назначенных представителей.'
    },
    templates: {
      de: '[VivoPing TRESOR-FREIGABE] Lebenszeichen-Frist von {userName} überschritten. Als hinterlegte Vertrauensperson wurde Ihnen der Zugriff auf den digitalen Notfall-Tresor freigeschaltet (Zugangsdaten, Vollmachten, Vorsorgeverfügungen). Letzte Koordinaten ({time} Uhr): {mapsUrl}. Bitte prüfen Sie die hinterlegten Anweisungen.',
      en: '[VivoPing VAULT RELEASE] Lifeline deadline exceeded for {userName}. As an authorized emergency contact, you have now been granted access to the digital emergency vault (critical credentials, powers of attorney, healthcare directives). Last coordinates ({time}): {mapsUrl}. Please review the instructions.',
      fr: '[VivoPing COFFRE-FORT DÉVERROUILLÉ] Délai dépassé pour {userName}. En tant que contact de confiance désigné, vous avez désormais accès au coffre-fort d\'urgence (mots de passe essentiels, procurations, directives anticipées). Dernières coordonnées ({time}) : {mapsUrl}.',
      es: '[VivoPing BAÚL DIGITAL LIBERADO] Plazo de vida vencido para {userName}. Como persona de confianza, ahora tiene acceso al baúl digital de emergencia (credenciales importantes, poderes notariales, directivas anticipadas). Últimas coordenadas ({time}): {mapsUrl}.',
      ru: '[VivoPing ОТКРЫТИЕ СЕЙФА] Истек контрольный срок от {userName}. Вам, как доверенному лицу, предоставлен экстренный доступ к цифровому сейфу (важные пароли, доверенности, медицинские распоряжения). Координаты ({time}): {mapsUrl}.'
    }
  },
  {
    id: 'outdoor_travel',
    badgeColor: 'emerald',
    name: {
      de: 'Vorlage 5: Reise & Outdoor / Bergwacht (GPS & Suchfokus)',
      en: 'Template 5: Outdoor, Hike & Travel Alert (GPS & SAR Focus)',
      fr: 'Modèle 5 : Randonnée, Voyage & Plein air (Coordonnées GPS)',
      es: 'Plantilla 5: Aventura, Viajes y Montaña (Búsqueda GPS)',
      ru: 'Шаблон 5: Поход, путешествие и горы (GPS и спасение)'
    },
    category: {
      de: 'Outdoor & Reise',
      en: 'Outdoor & Travel',
      fr: 'Plein air & Voyage',
      es: 'Aventura y Viaje',
      ru: 'Поход и поездки'
    },
    badge: {
      de: 'GPS-Suchfokus',
      en: 'GPS / SAR Search',
      fr: 'Recherche GPS',
      es: 'Búsqueda GPS',
      ru: 'Поиск по GPS'
    },
    description: {
      de: 'Speziell formuliert für Wanderungen, Bergtouren, Solo-Reisen oder Expeditionen bei vermutetem Unfall im Gelände.',
      en: 'Tailored for hiking, solo travels, mountain tours or expeditions with focus on SAR rescue coordinates.',
      fr: 'Spécifiquement conçu pour randonnées, voyages en solitaire ou expéditions avec coordonnées pour secours.',
      es: 'Diseñado para senderismo, viajes en solitario o rutas donde se requiere rescate en el terreno.',
      ru: 'Специально для походов, гор, поездок в одиночку и возможного вызова спасателей в горы.'
    },
    recommendedFor: {
      de: 'Für Bergsteiger, Solo-Wanderer, Radreisende oder Vielreisende im Ausland.',
      en: 'For hikers, mountaineers, solo cyclists, backpackers or international travelers.',
      fr: 'Pour alpinistes, randonneurs solitaires, cyclotouristes ou voyageurs hors réseau.',
      es: 'Para montañeros, senderistas solitarios, ciclistas de ruta o viajeros aventureros.',
      ru: 'Для альпинистов, туристов-одиночек, велосипедистов и путешественников.'
    },
    templates: {
      de: '[VivoPing OUTDOOR / REISE-ALARM] {userName} ist von einer Reise oder Outdoor-Aktivität nicht wie geplant zurückgekehrt und hat den Sicherheits-Ping verpasst! Möglicher Unfall im Gelände. Dringend letzte GPS-Koordinaten ({lat}, {lng}, erfasst um {time} Uhr) prüfen: {mapsUrl} und Bergrettung/Suchmannschaften informieren!',
      en: '[VivoPing OUTDOOR & TRAVEL ALERT] {userName} has not checked in as expected during outdoor activity or travel! Possible accident off-grid. Please check the last recorded GPS coordinates immediately ({lat}, {lng} at {time}): {mapsUrl} and alert search & rescue if unreachable!',
      fr: '[VivoPing ALERTE EN VOYAGE / PLEIN AIR] {userName} n\'a pas validé son retour d\'excursion ou de voyage comme convenu ! Suspicion d\'accident ou disparition. Vérifiez d\'urgence les dernières coordonnées GPS ({lat}, {lng} à {time}) : {mapsUrl} et contactez les secours/secours en montagne si injoignable !',
      es: '[VivoPing ALERTA DE VIAJE / MONTAÑA] ¡{userName} no ha registrado su regreso de viaje o actividad al aire libre! Posible accidente en ruta o zona remota. Compruebe urgentemente las últimas coordenadas GPS ({lat}, {lng} a las {time}): {mapsUrl} y avise a rescate.',
      ru: '[VivoPing ТРЕВОГА: ПОЕЗДКА / ПОХОД] {userName} не вышел(ла) на связь после поездки или похода на природу! Возможно происшествие на маршруте. Срочно проверьте последние GPS-координаты ({lat}, {lng} в {time}): {mapsUrl} и при необходимости обратитесь в спасательную службу!'
    }
  }
];

export interface FormatAlertMessageParams {
  templateId?: AlertTemplateId;
  targetLang?: Language;
  userName?: string;
  location?: {
    latitude: number;
    longitude: number;
    timestamp?: number;
  } | null;
}

export function formatAlertMessage({
  templateId = 'standard',
  targetLang = 'de',
  userName = 'VivoPing-Nutzer',
  location,
}: FormatAlertMessageParams): string {
  const chosenConfig = ALERT_TEMPLATES.find(t => t.id === templateId) || ALERT_TEMPLATES[0];
  const templateRaw = chosenConfig.templates[targetLang] || chosenConfig.templates['de'];

  const lat = location?.latitude ?? 48.7901;
  const lng = location?.longitude ?? 9.1829;
  const mapsUrl = `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;
  const time = new Date(location?.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return templateRaw
    .replace(/{userName}/g, userName)
    .replace(/{lat}/g, lat.toFixed(5))
    .replace(/{lng}/g, lng.toFixed(5))
    .replace(/{mapsUrl}/g, mapsUrl)
    .replace(/{time}/g, time);
}
