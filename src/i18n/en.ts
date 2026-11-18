/**
 * Every word the player can read, in English. To add a language, copy this
 * file (for example to th.ts), translate the values, and register it in index.ts.
 * Text in {curly braces} is filled in by the game; keep those words as they are.
 */
export const en = {
  title: 'Kumo Café',
  tagline: 'A cozy café in the clouds',
  madeBy: 'Made by KumoPlay',
  loading: 'Warming up the kitchen…',
  /** Joins the last two names in a list: "Tea, Toast and Cocoa". */
  and: 'and',
  close: 'Close',
  back: 'Back',

  cafes: {
    'morning-cloud': 'Morning Cloud',
  } as Record<string, string>,

  /** Ingredients, cooked things and dishes. */
  items: {
    batter: 'Pancake Batter',
    egg: 'Eggs',
    'tea-leaves': 'Tea Leaves',
    cocoa: 'Cocoa',
    bread: 'Bread',
    strawberries: 'Strawberries',
    cream: 'Whipped Cream',
    'fluffy-pancake': 'Fluffy Pancake',
    'sunny-egg': 'Sunny Egg',
    'sky-tea': 'Sky Tea',
    'hot-cocoa': 'Hot Cocoa',
    toast: 'Toast',
    'berry-pancake': 'Berry Pancake',
    'cloud-cocoa': 'Cloud Cocoa',
    'berry-toast': 'Berry Toast',
    'sunny-toast': 'Sunny Toast',
  } as Record<string, string>,

  stations: {
    griddle: 'Cloud Griddle',
    kettle: 'Sky Kettle',
    toaster: 'Sunbeam Toaster',
    board: 'Plating Board',
  } as Record<string, string>,

  guests: {
    mochi: 'Mochi',
    pip: 'Pip',
    fluff: 'Fluff',
    sora: 'Sora',
    luma: 'Luma',
    bao: 'Bao',
  } as Record<string, string>,

  /** One short line about each guest, for when they first visit. */
  guestAbout: {
    mochi: 'A round, squishy cloud puff. Loves Sky Tea.',
    pip: 'A tiny songbird, always in a flutter.',
    fluff: 'A curly cloud lamb, happy to wait.',
    sora: 'A baby sky whale who floats in for cocoa.',
    luma: 'A sleepy moth with star-dust wings.',
    bao: 'A flying squirrel, always on the go.',
  } as Record<string, string>,

  upgrades: {
    'griddle-spot': 'Bigger Griddle',
    'griddle-heat': 'Warm Griddle',
    'kettle-spout': 'Extra Spout',
    'kettle-boil': 'Quick Kettle',
    'toaster-slot': 'Double Toaster',
    'toaster-warm': 'Sunny Toaster',
    'board-plate': 'Extra Plate',
  } as Record<string, string>,

  decor: {
    'flower-pots': 'Flower Pots',
    'cloud-lamps': 'Cloud Lamps',
    'music-box': 'Music Box',
    'rainbow-bunting': 'Rainbow Bunting',
    'hanging-plants': 'Hanging Plants',
  } as Record<string, string>,

  home: {
    play: 'Play',
    shift: 'Shift {n}',
    shifts: 'Shifts',
    allDay: 'All-Day Café',
    allDayLocked: 'Opens after shift {n}',
    allDayBest: 'Best day: {n} guests',
    shop: 'Shop',
    settings: 'Settings',
    stars: '{n} of {total} stars',
    prevCafe: 'Previous café',
    nextCafe: 'Next café',
    cafeLocked: 'Opens when every shift at {name} is done',
  },

  map: {
    title: 'Shifts',
    shift: 'Shift {n}',
    locked: 'Finish shift {n} first',
    stars: '{n} stars',
  },

  intro: {
    title: 'Shift {n}',
    allDayTitle: 'All-Day Café',
    allDayText: 'Guests keep coming, a little quicker each time. Close the café whenever you like. The day also ends when {n} guests are waiting outside.',
    guests: '{n} guests',
    menu: 'On the menu',
    isNew: 'New',
    newGuest: 'New guest',
    start: 'Start',
    open: 'Open the café',
    howTo: 'Tap a jar to start cooking. Tap food when it is ready, and it goes to the guest who wants it.',
    relaxed: 'Relaxed mode is on: guests wait as long as you need.',
  },

  hud: {
    pause: 'Pause',
    served: '{served} of {total} guests served',
    servedDay: '{n} guests served',
    coins: '{n} coins',
    stars: 'Star goals: {two} and {three} coins',
    line: '{n} of {max} guests waiting outside',
  },

  kitchen: {
    jar: 'Add {name}',
    slotEmpty: '{station}: free spot',
    slotCooking: '{name}, cooking',
    slotReady: '{name}, ready: tap to hand it over',
    throwAway: 'Throw away the {name}',
    plateEmpty: 'Empty plate',
    plate: 'Plate with {names}: tap to serve',
    clearPlate: 'Clear this plate',
    guest: '{name} would like {order}. Tap to hand over what is ready.',
    queued: '{n} waiting',
    streak: 'Happy streak ×{n}!',
    /** Short tips in the first shift, for whatever would help next. */
    help: {
      jar: 'Tap a jar to start cooking',
      slot: 'It is ready! Tap it to serve',
      plate: 'Tap the plate to serve it',
      clear: 'Nobody needs this. Tap the bin to make room',
    } as Record<string, string>,
  },

  pause: {
    title: 'Paused',
    resume: 'Keep cooking',
    restart: 'Start again',
    leave: 'Leave the shift',
    closeCafe: 'Close the café for today',
    note: 'Leaving is fine. You can play this shift again any time.',
  },

  results: {
    cheers: ['Nice work!', 'Lovely shift!', 'Amazing shift!'] as string[],
    starsLabel: '{n} of 3 stars',
    dayTitle: 'What a day!',
    food: 'Food',
    tips: 'Tips',
    streak: 'Happy streak bonus',
    total: 'Coins earned',
    bestStreak: 'Best happy streak: {n}',
    served: '{n} guests served',
    bestDay: 'Your best day: {n} guests',
    newBest: 'New best!',
    again: 'Play again',
    next: 'Next shift',
    shifts: 'Shifts',
    home: 'Home',
    allDayOpen: 'The All-Day Café is open! Find it on the home screen.',
    allDone: 'You finished every shift! The café is the talk of the sky.',
  },

  shop: {
    title: 'Shop',
    kitchen: 'Kitchen',
    decor: 'Décor',
    slot: 'One more spot',
    plate: 'One more plate',
    speed: 'Cooks faster',
    patience: 'Guests stay patient longer',
    steps: '{n} of {total}',
    done: 'Done',
    lockedShift: 'After shift {n}',
    lockedStation: 'In a later shift',
    notEnough: 'Not enough coins yet',
    bought: 'Yay! Ready for your next shift.',
  },

  settings: {
    title: 'Settings',
    soundTitle: 'Sound',
    soundOn: 'Sounds are on',
    soundOff: 'Sounds are off',
    relaxedTitle: 'Relaxed mode',
    relaxedHelp: 'Guests wait as long as you need, and always leave a tip. Good for little chefs, or for just cooking.',
    relaxedOn: 'Relaxed mode is on',
    relaxedOff: 'Relaxed mode is off',
    motion: 'Moving things follow your device’s “reduce motion” setting.',
    installTitle: 'Home screen',
    backupTitle: 'Backup',
    backupHelp: 'Your café is saved on this device. A backup lets you keep it safe or move it to another device.',
    copyCode: 'Copy backup code',
    copied: 'Copied!',
    copyFailed: 'Select the code below and copy it',
    saveFile: 'Save backup file',
    loadTitle: 'Load a backup',
    loadHelp: 'Paste a backup code here, or pick a backup file.',
    codePlaceholder: 'KUMO1…',
    chooseFile: 'Pick a file',
    load: 'Load backup',
    loadConfirmTitle: 'Load this backup?',
    loadConfirmText: 'It will replace the café on this device.',
    loadYes: 'Load it',
    badCode: 'That is not a Kumo Café backup code.',
    otherGame: 'That backup code is from another KumoPlay game. Load it in that game instead.',
    brokenCode: 'This code looks cut off or changed. Try copying it again.',
    newerCode: 'This backup is from a newer Kumo Café. Reload the game to update, then try again.',
    storageSafe: 'This browser will keep your café.',
    storageMaybe: 'Some browsers clear saved games after a few weeks without a visit. A backup keeps your café safe.',
    storageBroken: 'This browser is not saving right now. Make a backup before you leave!',
    resetTitle: 'Reset progress',
    resetButton: 'Reset progress…',
    resetConfirmTitle: 'Start over?',
    resetConfirmText: 'Your stars, coins, upgrades and decorations will be deleted. This cannot be undone.',
    resetYes: 'Delete and start over',
    keep: 'Keep my café',
    cancel: 'Cancel',
    version: 'Kumo Café {v}',
    madeBy: 'A KumoPlay game',
  },

  install: {
    why: 'Add Kumo Café to your home screen. It opens like an app, works without internet, and your café is kept safer there.',
    ios: 'Tap the Share button in your browser, then “Add to Home Screen”.',
    other: 'Open your browser menu, then pick “Install” or “Add to Home screen”.',
    add: 'Add to home screen',
    later: 'Not now',
    ok: 'OK',
    installed: 'Kumo Café is on your home screen.',
  },

  update: {
    ready: 'A new version is ready',
    reload: 'Update',
  },

  recover: {
    title: 'Hmm, the saved café will not open',
    corrupt: 'The save on this device looks damaged. If you have a backup code, you can load it.',
    tooNew: 'The save on this device is from a newer Kumo Café. Reload to get the update.',
    reload: 'Reload',
    startNew: 'Start a new café',
  },

  tabs: {
    title: 'Kumo Café is open in another tab',
    text: 'Your café is safe. Play in one tab at a time.',
    here: 'Play here',
  },

  rotate: {
    title: 'Turn your phone upright',
    text: 'Kumo Café is made to be held upright. Your shift is paused.',
  },
};

export type Strings = typeof en;
