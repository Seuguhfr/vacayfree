export type Language = 'fr' | 'en';

export interface TranslationDictionary {
  // Common / Brand
  appName: string;
  appTagline: string;
  vacationPoll: string;

  // Header
  home: string;
  share: string;
  organizer: string;
  organizerUnlocked: string;
  newPoll: string;
  tryLiveDemo: string;
  demoBannerText: string;
  demoBannerCreate: string;
  demoBannerHome: string;

  // Landing
  heroTitle: string;
  heroSubtitle: string;
  createPollBtn: string;
  tryDemoBtn: string;
  recentPollsTitle: string;
  savedInBrowser: string;
  openPollBtn: string;
  removeRecentTooltip: string;
  friendsCount: (count: number) => string;
  featureZeroAccountsTitle: string;
  featureZeroAccountsDesc: string;
  featurePainterTitle: string;
  featurePainterDesc: string;
  featureFinderTitle: string;
  featureFinderDesc: string;

  // Participant Bar / Poll Overview
  editingMode: string;
  switchFriendTooltip: string;
  addYourDates: string;
  groupOverview: (count: number) => string;
  noResponsesYet: string;
  daysFree: (count: number) => string;
  tripFinalizedBanner: string;
  tripFinalizedDates: (range: string) => string;
  votingClosedDesc: string;
  unlockPollBtn: string;

  // Calendar
  myDatesTab: string;
  groupHeatmapTab: string;
  brushLabel: string;
  brushFree: string;
  brushMaybe: string;
  brushClear: string;
  allFree: string;
  allBusy: string;
  resetChanges: string;
  saveChanges: string;
  saving: string;
  savedToast: string;
  heatmapLegend: string;
  legendNone: string;
  legendAll: string;
  clickOrDragHint: string;
  tapToEditHint: string;
  lockedBannerDateWarning: string;
  chatNoteTooltip: string;
  addNoteAction: string;
  dayDetailsModalTitle: string;

  // Best Windows / Podium
  bestWindowsTitle: string;
  allFreeBadge: (count: number) => string;
  optionsCount: (count: number) => string;
  windowsSubtitle: string;
  durationWeekend: string;
  duration1Week: string;
  duration2Weeks: string;
  durationCustom: string;
  customLengthLabel: string;
  daysUnit: string;
  noWindowsFoundTitle: (days: number) => string;
  noWindowsFoundDesc: string;
  daysCount: (count: number) => string;
  allFriendsFreeMatch: (count: number) => string;
  avgFreeMatch: (avg: number, total: number) => string;
  minFreeMatch: (min: number) => string;
  unavailableDaysBadge: (name: string, days: number) => string;
  maybeDaysBadge: (name: string, days: number) => string;
  viewingBtn: string;
  highlightBtn: string;
  lockDateBtn: string;
  showAllBtn: (total: number) => string;
  showTopOnlyBtn: string;
  tripDatesFinalizedTitle: string;
  tripDatesFinalizedDesc: string;

  // Create Modal
  createModalTitle: string;
  tripTitleLabel: string;
  tripTitlePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  calendarWindowLabel: string;
  quickPresetsLabel: string;
  presetSummer: string;
  presetNextMonth: string;
  presetAutumn: string;
  earliestStartLabel: string;
  latestReturnLabel: string;
  targetDurationLabel: string;
  yourInfoLabel: string;
  yourNamePlaceholder: string;
  pinPlaceholder: string;
  pinHelpText: string;
  cancelBtn: string;
  creatingBtn: string;
  createTripSubmitBtn: string;
  errorTitleRequired: string;
  errorDatesRequired: string;
  errorDateOrder: string;
  errorDurationMin: string;
  errorGeneric: string;

  // Share Modal
  shareModalTitle: string;
  shareableLinkChat: string;
  copyBtn: string;
  copiedBtn: string;
  safeLinkNotice: string;
  quickGroupMessageTitle: string;
  copyMessageBtn: string;
  copiedMessageToast: string;
  whatsappBtn: string;
  inviteMessageText: (title: string, url: string) => string;

  // Pin Modal
  pinModalTitleNew: string;
  pinModalTitleUnlock: string;
  tabNewFriend: string;
  tabReturningFriend: string;
  nameLabel: string;
  namePlaceholder: string;
  choose4DigitPinLabel: string;
  enterYourPinLabel: string;
  pinSubtext: string;
  continueBtn: string;
  errorPinDigits: string;
  errorNameRequired: string;
  errorNameCollision: (name: string) => string;
  errorParticipantNotFound: string;
  errorIncorrectPin: string;

  // Admin Modal
  adminModalTitle: string;
  adminKeyRequiredTitle: string;
  enterAdminKeyLabel: string;
  adminKeyPlaceholder: string;
  verifyAndUnlockBtn: string;
  verifyingBtn: string;
  invalidAdminKeyError: string;
  adminAccessGranted: string;
  adminLinkSaveWarning: string;
  copyAdminLinkBtn: string;
  copiedAdminLinkBtn: string;
  pollStatusTitle: string;
  pollLockedStatus: string;
  pollOpenStatus: string;
  lockPollBtn: string;
  unlockPollAdminBtn: string;
  editTripDetailsTitle: string;
  saveChangesBtn: string;
  savedSuccessToast: string;
  manageParticipantsTitle: string;
  resetPinBtn: string;
  removeFriendBtn: string;
  tempPinGenerated: (name: string, pin: string) => string;
  dangerZoneTitle: string;
  deletePollBtn: string;
  deletePollConfirm: string;

  // Day Details Modal
  groupAttendanceTitle: string;
  friendsFreeText: (free: number, total: number) => string;
  maybeCountText: (count: number) => string;
  matchScoreText: (pct: number) => string;
  availableSectionTitle: (count: number) => string;
  nobodyAvailableYet: string;
  maybeSectionTitle: (count: number) => string;
  unavailableSectionTitle: (count: number) => string;
  statusAvailable: string;
  statusMaybe: string;
  statusBusy: string;

  // Day Note Modal
  yourStatusForDay: string;
  addNoteOptional: string;
  notePlaceholder: string;
  saveNoteBtn: string;

  // Cloud Quota Notice
  cloudQuotaTitle: string;
  cloudQuotaDesc: string;
  savedLocallyQuota: string;
}
