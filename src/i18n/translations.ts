import { TranslationDictionary } from './types';

export const fr: TranslationDictionary = {
  // Common / Brand
  appName: 'VacayFree',
  appTagline: 'Sondage Vacances',
  vacationPoll: 'Sondage Vacances',

  // Header
  home: 'Accueil',
  share: 'Partager',
  organizer: 'Organisateur',
  organizerUnlocked: 'Organisateur (déverrouillé)',
  newPoll: 'Nouveau sondage',
  tryLiveDemo: 'Essayer la démo →',
  demoBannerText: '✨ Mode Démo avec des réponses d’exemple.',
  demoBannerCreate: 'Créer votre propre voyage',
  demoBannerHome: 'Retour à l’accueil',

  // Landing
  heroTitle: 'Planifiez vos vacances entre amis sans prise de tête.',
  heroSubtitle:
    'Créez un sondage en 10 secondes, partagez le lien dans votre groupe, cochez vos jours de congé et découvrez instantanément les meilleures dates pour partir ensemble.',
  createPollBtn: 'Créer un sondage vacances',
  tryDemoBtn: 'Essayer la démo en direct',
  recentPollsTitle: 'Vos sondages récents sur cet appareil',
  savedInBrowser: 'Sauvegardé dans le navigateur',
  openPollBtn: 'Ouvrir →',
  removeRecentTooltip: 'Retirer de la liste récente sur cet appareil',
  friendsCount: (count: number) =>
    count === 1 ? '1 ami a répondu' : `${count} amis ont répondu`,
  featureZeroAccountsTitle: 'Zéro compte requis',
  featureZeroAccountsDesc:
    'Vos amis rejoignent avec un simple code PIN à 4 chiffres. Pas d’e-mail ni de mot de passe à retenir.',
  featurePainterTitle: 'Pinceau tactile intuitif',
  featurePainterDesc:
    'Touchez ou glissez sur les jours pour peindre vos dates libres en quelques secondes sur mobile ou ordi.',
  featureFinderTitle: 'Calculateur intelligent',
  featureFinderDesc:
    'Classe automatiquement les périodes de 3, 7 ou 14 jours continus selon le taux de présence du groupe.',

  // Participant Bar / Poll Overview
  editingMode: 'Mode modification',
  switchFriendTooltip: 'Changer d’ami / Quitter le mode édition',
  addYourDates: '+ Ajouter mes dates',
  groupOverview: (count: number) =>
    count === 1
      ? 'Aperçu du groupe (1 ami a répondu) :'
      : `Aperçu du groupe (${count} amis ont répondu) :`,
  noResponsesYet: 'Aucune réponse pour le moment — soyez le premier !',
  daysFree: (count: number) => `${count}j dispo`,
  tripFinalizedBanner: 'Voyage finalisé et dates verrouillées !',
  tripFinalizedDates: (range: string) => `Dates choisies : ${range} !`,
  votingClosedDesc: 'Les votes et modifications sont désormais clos.',
  unlockPollBtn: 'Déverrouiller le sondage',

  // Calendar
  myDatesTab: 'Mes dates (Pinceau)',
  groupHeatmapTab: 'Vue d’ensemble (Groupe)',
  brushLabel: 'Pinceau :',
  brushFree: 'Dispo',
  brushMaybe: 'Peut-être',
  brushClear: 'Effacer',
  allFree: 'Tout dispo',
  allBusy: 'Tout indispo',
  resetChanges: 'Réinitialiser',
  saveChanges: 'Enregistrer mes dates',
  saving: 'Enregistrement...',
  savedToast: 'Enregistré avec succès !',
  heatmapLegend: 'Disponibilité :',
  legendNone: 'Aucun',
  legendAll: 'Tous',
  clickOrDragHint: 'Cliquez ou glissez sur les dates pour peindre vos disponibilités',
  tapToEditHint: 'Cliquez sur l’icône bulle pour ajouter une note sur un jour particulier',
  lockedBannerDateWarning: 'Ce sondage a été verrouillé par l’organisateur.',
  chatNoteTooltip: 'Ajouter ou modifier une note pour cette journée',
  addNoteAction: 'Ajouter une note',
  dayDetailsModalTitle: 'Détails de la journée',

  // Best Windows / Podium
  bestWindowsTitle: 'Meilleures périodes de vacances',
  allFreeBadge: (count: number) => `${count} à 100% disponibles`,
  optionsCount: (count: number) => `${count} périodes possibles`,
  windowsSubtitle:
    'Périodes continues classées selon le nombre d’amis disponibles',
  durationWeekend: 'Week-end (3j)',
  duration1Week: '1 Semaine (7j)',
  duration2Weeks: '2 Semaines (14j)',
  durationCustom: 'Personnalisé',
  customLengthLabel: 'Durée personnalisée :',
  daysUnit: 'jours',
  noWindowsFoundTitle: (days: number) =>
    `Aucune période continue trouvée pour ${days} jours.`,
  noWindowsFoundDesc:
    'Essayez de réduire la durée ou d’élargir la plage de dates.',
  daysCount: (count: number) => `${count} jours`,
  allFriendsFreeMatch: (count: number) =>
    `100% disponibles (${count}/${count} amis)`,
  avgFreeMatch: (avg: number, total: number) =>
    `Moy. ${avg}/${total} dispo`,
  minFreeMatch: (min: number) => `Pire jour : ${min} dispo`,
  unavailableDaysBadge: (name: string, days: number) =>
    `${name} indispo (${days}j)`,
  maybeDaysBadge: (name: string, days: number) =>
    `${name} peut-être (${days}j)`,
  viewingBtn: 'Affiché',
  highlightBtn: 'Mettre en surbrillance',
  lockDateBtn: 'Choisir ces dates',
  showAllBtn: (total: number) => `Afficher toutes les ${total} périodes`,
  showTopOnlyBtn: 'Afficher le top 3 uniquement',
  tripDatesFinalizedTitle: 'Dates du voyage finalisées ! 🎉',
  tripDatesFinalizedDesc:
    'L’organisateur a verrouillé ce sondage. Le choix final est validé.',

  // Create Modal
  createModalTitle: 'Créer un sondage vacances',
  tripTitleLabel: 'Titre du voyage *',
  tripTitlePlaceholder: 'Ex. Roadtrip au Portugal 🏖️, Vacances d’été...',
  descriptionLabel: 'Description ou idées de destination (Facultatif)',
  descriptionPlaceholder: 'Ex. Villa avec piscine ou chalet, flexible sur le lieu',
  calendarWindowLabel: 'Plage de dates du calendrier *',
  quickPresetsLabel: 'Raccourcis :',
  presetSummer: '☀️ Été (Juil. & Août)',
  presetNextMonth: 'Mois prochain',
  presetAutumn: 'Automne',
  earliestStartLabel: 'Départ au plus tôt',
  latestReturnLabel: 'Retour au plus tard',
  targetDurationLabel: 'Durée souhaitée du séjour',
  yourInfoLabel: 'Vos informations (Organisateur)',
  yourNamePlaceholder: 'Votre prénom (ex. Alex)',
  pinPlaceholder: 'Code PIN à 4 chiffres (ex. 1234)',
  pinHelpText:
    'Choisissez un code PIN à 4 chiffres pour pouvoir modifier vos dates plus tard depuis n’importe quel appareil.',
  cancelBtn: 'Annuler',
  creatingBtn: 'Création en cours...',
  createTripSubmitBtn: 'Créer le sondage',
  errorTitleRequired: 'Veuillez saisir un titre pour le voyage.',
  errorDatesRequired: 'Veuillez sélectionner les dates de début et de fin.',
  errorDateOrder: 'La date de retour doit être postérieure à la date de départ.',
  errorDurationMin: 'La durée doit être d’au moins 1 jour.',
  errorGeneric: 'Erreur lors de la création du sondage. Veuillez réessayer.',

  // Share Modal
  shareModalTitle: 'Partager le sondage',
  shareableLinkChat: 'Lien à envoyer dans votre groupe de discussion',
  copyBtn: 'Copier',
  copiedBtn: 'Copié !',
  safeLinkNotice:
    'Lien sécurisé pour vos amis (ne donne pas accès aux contrôles administrateur).',
  quickGroupMessageTitle: 'Message rapide pour votre groupe WhatsApp / SMS',
  copyMessageBtn: 'Copier le message',
  copiedMessageToast: 'Message copié !',
  whatsappBtn: 'Envoyer sur WhatsApp',
  inviteMessageText: (title: string, url: string) =>
    `Salut tout le monde ! Trouvons les meilleures dates pour notre voyage "${title}". Remplissez vos dispos ici : ${url}`,

  // Pin Modal
  pinModalTitleNew: 'Rejoindre le sondage',
  pinModalTitleUnlock: 'Déverrouiller mes dates',
  tabNewFriend: 'Nouvel ami',
  tabReturningFriend: 'Déjà inscrit',
  nameLabel: 'Votre prénom *',
  namePlaceholder: 'Ex. Camille, Thomas...',
  choose4DigitPinLabel: 'Créez votre code PIN (4 chiffres) *',
  enterYourPinLabel: 'Entrez votre code PIN (4 chiffres) *',
  pinSubtext:
    'Ce code protège vos réponses pour que personne d’autre ne puisse modifier vos dates.',
  continueBtn: 'Continuer →',
  errorPinDigits: 'Veuillez entrer un code PIN à 4 chiffres.',
  errorNameRequired: 'Veuillez entrer votre prénom.',
  errorNameCollision: (name: string) =>
    `"${name}" participe déjà à ce sondage ! Entrez votre code PIN pour déverrouiller vos dates.`,
  errorParticipantNotFound: 'Participant introuvable.',
  errorIncorrectPin: 'Code PIN incorrect. Veuillez réessayer.',

  // Admin Modal
  adminModalTitle: 'Paramètres Organisateur',
  adminKeyRequiredTitle: 'Accès réservé à l’organisateur',
  enterAdminKeyLabel: 'Clé secrète d’administration',
  adminKeyPlaceholder: 'Collez votre clé organisateur...',
  verifyAndUnlockBtn: 'Déverrouiller l’accès',
  verifyingBtn: 'Vérification...',
  invalidAdminKeyError: 'Clé organisateur invalide.',
  adminAccessGranted: 'Accès Organisateur Déverrouillé',
  adminLinkSaveWarning:
    'Conservez ce lien spécial dans vos favoris pour gérer ce sondage plus tard sans ressaisir la clé :',
  copyAdminLinkBtn: 'Copier mon lien d’accès complet',
  copiedAdminLinkBtn: 'Lien administrateur copié !',
  pollStatusTitle: 'État du sondage',
  pollLockedStatus: 'Sondage verrouillé (votes clos)',
  pollOpenStatus: 'Sondage ouvert aux votes',
  lockPollBtn: 'Verrouiller le sondage',
  unlockPollAdminBtn: 'Rouvrir le sondage',
  editTripDetailsTitle: 'Modifier les informations du voyage',
  saveChangesBtn: 'Enregistrer les modifications',
  savedSuccessToast: 'Modifications enregistrées !',
  manageParticipantsTitle: 'Gestion des participants',
  resetPinBtn: 'Réinitialiser le code PIN',
  removeFriendBtn: 'Supprimer',
  tempPinGenerated: (name: string, pin: string) =>
    `Nouveau code PIN temporaire pour ${name} : ${pin}`,
  dangerZoneTitle: 'Zone de danger',
  deletePollBtn: 'Supprimer définitivement ce sondage',
  deletePollConfirm:
    'Êtes-vous sûr de vouloir supprimer définitivement ce sondage et toutes ses données ? Cette action est irréversible.',

  // Day Details Modal
  groupAttendanceTitle: 'Disponibilité du groupe',
  friendsFreeText: (free: number, total: number) =>
    `${free} ami${free > 1 ? 's' : ''} sur ${total} disponible${free > 1 ? 's' : ''}`,
  maybeCountText: (count: number) => `(+${count} peut-être)`,
  matchScoreText: (pct: number) => `${pct}% de concordance`,
  availableSectionTitle: (count: number) => `Disponibles (${count})`,
  nobodyAvailableYet: 'Personne n’a encore indiqué être libre ce jour-là.',
  maybeSectionTitle: (count: number) => `Peut-être / Si nécessaire (${count})`,
  unavailableSectionTitle: (count: number) => `Indisponibles (${count})`,
  statusAvailable: 'Disponible',
  statusMaybe: 'Peut-être',
  statusBusy: 'Indisponible',

  // Day Note Modal
  yourStatusForDay: 'Votre statut pour ce jour',
  addNoteOptional: 'Ajouter une note (Facultatif)',
  notePlaceholder: 'Ex. Train le soir, dispo l’après-midi uniquement...',
  saveNoteBtn: 'Enregistrer la note',

  // Cloud Quota Notice
  cloudQuotaTitle: 'Synchronisation Cloud temporairement en pause',
  cloudQuotaDesc:
    'Le quota gratuit Cloudflare est temporairement atteint. Vos données sont bien conservées sur cet appareil, et la synchronisation avec vos amis reprendra automatiquement cette nuit à 02h00 (00:00 UTC).',
  savedLocallyQuota: 'Sauvegardé localement (quota cloud atteint)',
};

export const en: TranslationDictionary = {
  // Common / Brand
  appName: 'VacayFree',
  appTagline: 'Vacation Poll',
  vacationPoll: 'Vacation Poll',

  // Header
  home: 'Home',
  share: 'Share',
  organizer: 'Organizer',
  organizerUnlocked: 'Organizer (Unlocked)',
  newPoll: 'New Poll',
  tryLiveDemo: 'Try Live Demo →',
  demoBannerText: '✨ Viewing Live Demo with sample responses.',
  demoBannerCreate: 'Create your own trip',
  demoBannerHome: 'Back to Home',

  // Landing
  heroTitle: 'Plan holidays together without the headache.',
  heroSubtitle:
    'Create a trip poll in seconds, share the link with friends, paint your free vacation days, and instantly discover the best continuous dates for everyone.',
  createPollBtn: 'Create a Vacation Poll',
  tryDemoBtn: 'Try Live Demo',
  recentPollsTitle: 'Your Recent Polls on this Device',
  savedInBrowser: 'Saved in browser',
  openPollBtn: 'Open Poll →',
  removeRecentTooltip: 'Remove from recent polls on this device',
  friendsCount: (count: number) =>
    count === 1 ? '1 friend responded' : `${count} friends responded`,
  featureZeroAccountsTitle: 'Zero Accounts',
  featureZeroAccountsDesc:
    'Friends join via link with a simple 4-digit PIN. No email or passwords required.',
  featurePainterTitle: 'Touch Calendar Painter',
  featurePainterDesc:
    'Tap or drag across days to quickly paint free vs busy dates on mobile or desktop.',
  featureFinderTitle: 'Smart Window Finder',
  featureFinderDesc:
    'Automatically ranks continuous 3-day, 7-day, or 14-day stretches by highest friend overlap.',

  // Participant Bar / Poll Overview
  editingMode: 'Editing Mode',
  switchFriendTooltip: 'Switch friend / Exit edit mode',
  addYourDates: '+ Add Your Dates',
  groupOverview: (count: number) =>
    count === 1
      ? 'Group Overview (1 friend responded):'
      : `Group Overview (${count} friends responded):`,
  noResponsesYet: 'No responses yet — be the first!',
  daysFree: (count: number) => `${count}d free`,
  tripFinalizedBanner: 'Trip Dates Finalized & Locked!',
  tripFinalizedDates: (range: string) => `Final Dates: ${range}!`,
  votingClosedDesc: 'Voting and date edits are now closed.',
  unlockPollBtn: 'Unlock Poll',

  // Calendar
  myDatesTab: 'My Dates (Painter)',
  groupHeatmapTab: 'Group Heatmap',
  brushLabel: 'Brush:',
  brushFree: 'Free',
  brushMaybe: 'Maybe',
  brushClear: 'Clear',
  allFree: 'All Free',
  allBusy: 'All Busy',
  resetChanges: 'Reset',
  saveChanges: 'Save Changes',
  saving: 'Saving...',
  savedToast: 'Saved successfully!',
  heatmapLegend: 'Heatmap:',
  legendNone: 'None',
  legendAll: 'All',
  clickOrDragHint: 'Click or drag across days to paint your availability',
  tapToEditHint: 'Click the chat bubble icon to add a note to a specific date',
  lockedBannerDateWarning: 'This poll has been locked by the organizer.',
  chatNoteTooltip: 'Add or edit a note for this day',
  addNoteAction: 'Add a note',
  dayDetailsModalTitle: 'Day Details',

  // Best Windows / Podium
  bestWindowsTitle: 'Best Vacation Windows',
  allFreeBadge: (count: number) => `${count} 100% Free`,
  optionsCount: (count: number) => `${count} options`,
  windowsSubtitle: 'Continuous date stretches ranked by friend attendance',
  durationWeekend: 'Weekend (3d)',
  duration1Week: '1 Week (7d)',
  duration2Weeks: '2 Weeks (14d)',
  durationCustom: 'Custom',
  customLengthLabel: 'Set custom length:',
  daysUnit: 'days',
  noWindowsFoundTitle: (days: number) =>
    `No windows found for ${days} days.`,
  noWindowsFoundDesc: 'Try reducing the trip duration.',
  daysCount: (count: number) => `${count} days`,
  allFriendsFreeMatch: (count: number) =>
    `100% Free (${count}/${count} friends)`,
  avgFreeMatch: (avg: number, total: number) =>
    `Avg ${avg}/${total} free`,
  minFreeMatch: (min: number) => `Min ${min} free`,
  unavailableDaysBadge: (name: string, days: number) =>
    `${name} (${days}d)`,
  maybeDaysBadge: (name: string, days: number) =>
    `${name} (${days}d)`,
  viewingBtn: 'Viewing',
  highlightBtn: 'Highlight',
  lockDateBtn: 'Lock Date',
  showAllBtn: (total: number) => `Show all ${total} windows`,
  showTopOnlyBtn: 'Show top 3 only',
  tripDatesFinalizedTitle: 'Trip Dates Finalized! 🎉',
  tripDatesFinalizedDesc:
    'The organizer has locked this trip poll. Availability voting and edits are now closed.',

  // Create Modal
  createModalTitle: 'Create a Vacation Poll',
  tripTitleLabel: 'Trip Title *',
  tripTitlePlaceholder: 'e.g., Summer Trip in Portugal 🏖️',
  descriptionLabel: 'Description or Destination Ideas (Optional)',
  descriptionPlaceholder: 'e.g., Beach villa or mountain retreat, flexible on location',
  calendarWindowLabel: 'Calendar Window *',
  quickPresetsLabel: 'Quick presets:',
  presetSummer: '☀️ Summer (Jul & Aug)',
  presetNextMonth: 'Next Month',
  presetAutumn: 'Autumn',
  earliestStartLabel: 'Earliest start',
  latestReturnLabel: 'Latest return',
  targetDurationLabel: 'Target Trip Duration',
  yourInfoLabel: 'Your Info (Organizer)',
  yourNamePlaceholder: 'Your Name (e.g. Alex)',
  pinPlaceholder: '4-digit PIN (e.g. 1234)',
  pinHelpText:
    'Choose a 4-digit PIN so you can edit your dates later from any device.',
  cancelBtn: 'Cancel',
  creatingBtn: 'Creating...',
  createTripSubmitBtn: 'Create Trip Poll',
  errorTitleRequired: 'Please provide a trip title.',
  errorDatesRequired: 'Please select start and end dates.',
  errorDateOrder: 'End date must be after start date.',
  errorDurationMin: 'Duration must be at least 1 day.',
  errorGeneric: 'Failed to create trip. Please try again.',

  // Share Modal
  shareModalTitle: 'Share Trip Poll',
  shareableLinkChat: 'Shareable Link for Group Chat',
  copyBtn: 'Copy',
  copiedBtn: 'Copied',
  safeLinkNotice: 'Safe for friends. Does not include organizer admin controls.',
  quickGroupMessageTitle: 'Quick Group Message',
  copyMessageBtn: 'Copy message',
  copiedMessageToast: 'Copied!',
  whatsappBtn: 'Share on WhatsApp',
  inviteMessageText: (title: string, url: string) =>
    `Hey everyone! Let's find the best dates for "${title}". Pick your free days here: ${url}`,

  // Pin Modal
  pinModalTitleNew: 'Join Trip Poll',
  pinModalTitleUnlock: 'Unlock Your Dates',
  tabNewFriend: 'New Friend',
  tabReturningFriend: 'Returning Friend',
  nameLabel: 'Your Name *',
  namePlaceholder: 'e.g., Alex, Sam...',
  choose4DigitPinLabel: 'Choose a 4-digit PIN *',
  enterYourPinLabel: 'Enter your 4-digit PIN *',
  pinSubtext:
    'This protects your dates so only you can edit your availability.',
  continueBtn: 'Continue →',
  errorPinDigits: 'Please enter your 4-digit PIN.',
  errorNameRequired: 'Please enter your name.',
  errorNameCollision: (name: string) =>
    `"${name}" is already on this trip! Enter your 4-digit PIN below to unlock your dates.`,
  errorParticipantNotFound: 'Participant not found.',
  errorIncorrectPin: 'Incorrect PIN. Please try again.',

  // Admin Modal
  adminModalTitle: 'Organizer Settings',
  adminKeyRequiredTitle: 'Organizer Key Required',
  enterAdminKeyLabel: 'Admin Secret Key',
  adminKeyPlaceholder: 'Paste organizer key...',
  verifyAndUnlockBtn: 'Unlock Controls',
  verifyingBtn: 'Verifying...',
  invalidAdminKeyError: 'Invalid organizer key.',
  adminAccessGranted: 'Organizer Admin Unlocked',
  adminLinkSaveWarning:
    'Bookmark this secret admin link on your private device to reopen organizer controls at any time:',
  copyAdminLinkBtn: 'Copy Secret Admin Link',
  copiedAdminLinkBtn: 'Admin Link Copied!',
  pollStatusTitle: 'Poll Voting Status',
  pollLockedStatus: 'Poll is Locked (Voting Closed)',
  pollOpenStatus: 'Poll is Open for Responses',
  lockPollBtn: 'Lock Poll Now',
  unlockPollAdminBtn: 'Re-open Poll for Voting',
  editTripDetailsTitle: 'Edit Trip Details',
  saveChangesBtn: 'Save Changes',
  savedSuccessToast: 'Settings saved!',
  manageParticipantsTitle: 'Manage Participants',
  resetPinBtn: 'Reset PIN',
  removeFriendBtn: 'Remove',
  tempPinGenerated: (name: string, pin: string) =>
    `New temporary PIN for ${name}: ${pin}`,
  dangerZoneTitle: 'Danger Zone',
  deletePollBtn: 'Permanently Delete Trip Poll',
  deletePollConfirm:
    'Are you sure you want to permanently delete this poll and all friend responses? This cannot be undone.',

  // Day Details Modal
  groupAttendanceTitle: 'Group Attendance',
  friendsFreeText: (free: number, total: number) =>
    `${free} of ${total} friends free`,
  maybeCountText: (count: number) => `(+${count} maybe)`,
  matchScoreText: (pct: number) => `${pct}% match`,
  availableSectionTitle: (count: number) => `Available (${count})`,
  nobodyAvailableYet: 'Nobody marked free yet',
  maybeSectionTitle: (count: number) => `Maybe / If Needed (${count})`,
  unavailableSectionTitle: (count: number) => `Unavailable (${count})`,
  statusAvailable: 'Available',
  statusMaybe: 'Maybe',
  statusBusy: 'Busy',

  // Day Note Modal
  yourStatusForDay: 'Your Status for this day',
  addNoteOptional: 'Add a Note (Optional)',
  notePlaceholder: 'e.g., Evening flight, only free afternoon...',
  saveNoteBtn: 'Save Note',

  // Cloud Quota Notice
  cloudQuotaTitle: 'Cloud Sync Temporarily Paused',
  cloudQuotaDesc:
    'The free daily Cloudflare sync quota has been reached. Your dates are safely saved on this device, and group sync will automatically resume tonight at 02:00 CET (00:00 UTC).',
  savedLocallyQuota: 'Saved locally (cloud quota reached)',
};
