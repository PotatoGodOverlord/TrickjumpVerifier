const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

//settings menu
const settingsMenu = document.getElementById('settingsMenu');
const settingsButton = document.getElementById('settings');
const closeSettingsButton = document.getElementById('closeSettings');

const buttonsDiv = document.getElementById('shortcutButtons');

const autoOpenCheckbox = document.getElementById("autoOpen");

settingsButton.addEventListener('click', () => {
    const isOpen = settingsMenu.style.display === 'block';
    settingsMenu.style.display = isOpen ? 'none' : 'block';

    if (!isOpen) {
        const conflicts = getAllConflicts();
        updateShortcutButtons(conflicts);
    }
    settingsButton.blur();
    if (recordingFor) {
        recordingFor = null;
    }
});

closeSettingsButton.addEventListener('click', () => {
    settingsMenu.style.display = 'none';
    if (recordingFor) {
        recordingFor = null;
        updateShortcutButtons();
    }
});

//keyboard shortcuts
const defaultShortcuts = {
    accept: { key: 'a', ctrl: false, shift: false, alt: false, meta: false, label: 'Accept', action: acceptJump },
    decline: { key: 'd', ctrl: false, shift: false, alt: false, meta: false, label: 'Decline', action: declineJump },
    skip: { key: 's', ctrl: false, shift: false, alt: false, meta: false, label: 'Skip', action: skipJump },
    back: { key: 'w', ctrl: false, shift: false, alt: false, meta: false, label: 'Back', action: backJump },
    search: { key: 'f', ctrl: false, shift: false, alt: false, meta:false , label:'Search', action: focusSearch},
};
// Application state
let recordingFor = null;
let shortcuts = JSON.parse(localStorage.getItem('keyboardShortcuts')) || defaultShortcuts;
if (shortcuts !== defaultShortcuts) {
    //go through each shortcut and make sure it has its action
    Object.keys(defaultShortcuts).forEach(action => {
        if (shortcuts[action]) {
            shortcuts[action].action = defaultShortcuts[action].action;
        } else {
            shortcuts[action] = defaultShortcuts[action];
        }
    });
}


function acceptJump() {
    if (!viewState.activeItemId) return;
    const item = items.find(i => i.id === viewState.activeItemId);
    if (item) {
        if (item.declined) declinedCount--;
        item.accepted = true;
        item.declined = false;
        acceptedCount++;
        remainingCount--;
        counters.textContent = `Accepted: ${acceptedCount} | Declined: ${declinedCount} | Remaining: ${remainingCount}`;
        move_to_next_item();
    }
}
function declineJump() {
    if (!viewState.activeItemId) return;
    const item = items.find(i => i.id === viewState.activeItemId);
    if (item) {
        if (item.accepted) acceptedCount--;
        item.accepted = false;
        item.declined = true;
        declinedCount++;
        remainingCount--;
        counters.textContent = `Accepted: ${acceptedCount} | Declined: ${declinedCount} | Remaining: ${remainingCount}`;
        move_to_next_item();
    }
}
function skipJump() {
    move_to_next_item();
}
function backJump() {
    move_to_previous_item();
}
function focusSearch() {
    document.getElementById('searchBox').focus();
}

document.addEventListener('keydown', (e) => {
    //escape from search box
    if (e.target.tagName === 'INPUT' && e.target.id === 'searchBox' && e.key === 'Escape') {
        e.target.blur();
        e.preventDefault();
        return;
    }
// Ignore typing in inputs/textareas/before looking at jumps
    if (appArea.style.display === 'none' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || recordingFor) {
        return;
    }

    //if settings menu open, close menu
    if (e.key === 'Escape' && settingsMenu.style.display === 'block') {
        settingsMenu.style.display = 'none';
        e.preventDefault();
        return;
    }

    Object.values(shortcuts).forEach(shortcut => {
        if (
            e.key.toLowerCase() === shortcut.key.toLowerCase() &&
            e.ctrlKey === shortcut.ctrl &&
            e.shiftKey === shortcut.shift &&
            e.altKey === shortcut.alt &&
            e.metaKey === shortcut.meta
        ) {
            e.preventDefault();
            console.log('Executing shortcut for', shortcut.label);
            shortcut.action();
        }
    });
});

function shortcutToLabel(s) {
    if (!s) return '';

    const modifiers = [
        s.ctrl ? 'Ctrl' : '',
        s.shift ? 'Shift' : '',
        s.alt ? 'Alt' : '',
        s.meta ? (isMac ? 'Cmd' : 'Meta') : ''
    ].filter(Boolean);

    let mainKey = s.key;

    // Ignore modifiers themselves
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(mainKey)) {
        mainKey = '';
    } 
    // If single character, normalize it
    else if (mainKey.length === 1) {
        mainKey = normalizeKeyForLabel(mainKey);
    }

    return [...modifiers, mainKey].filter(Boolean).join(' + ');
}


function normalizeKeyForLabel(key) {
    // Only normalize single letters
    if (key.length === 1) {
        // Convert to base letter and uppercase
        return key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    }
    return key; // keep other keys as-is
}

function checkConflicts(shortcut, excludeAction = null) {
    const conflicts = [];
    Object.entries(shortcuts).forEach(([action, s]) => {
        if (action === excludeAction) return;
        if (!s) return;
        if (
            s.key === shortcut.key &&
            s.ctrl === shortcut.ctrl &&
            s.shift === shortcut.shift &&
            s.alt === shortcut.alt &&
            s.meta === shortcut.meta
        ) {
            conflicts.push(action);
        }
    });
    return conflicts;
}

function updateShortcutButtons(conflictActions = []) {
    document.querySelectorAll('.shortcut-btn').forEach(btn => {
        const action = btn.dataset.action;
        btn.value = shortcutToLabel(shortcuts[action]);
        btn.classList.toggle('conflict', conflictActions.includes(action));
        btn.style.color = '';
    });
}

document.addEventListener('keydown', (e) => {
    if (!recordingFor) return;

    e.preventDefault();

    const btn = document.querySelector(`.shortcut-btn[data-action="${recordingFor}"]`);

    if (e.key === 'Escape') {
        // Restore saved shortcut label
        btn.value = shortcutToLabel(shortcuts[recordingFor]);

        // Recalculate conflicts for saved state
        const conflictActions = checkConflicts(shortcuts[recordingFor], recordingFor);
        updateShortcutButtons(conflictActions);

        recordingFor = null;
        return;
    }

    const previewShortcut = {
        key: e.key,
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey
    };

    const isModifierKeyOnly = ['Shift', 'Control', 'Alt', 'Meta'].includes(e.key);

    // Live preview on button
    btn.value = shortcutToLabel(previewShortcut);
    btn.style.color = isModifierKeyOnly ? 'red' : '';

    // Only finalize shortcut on main key press
    if (!isModifierKeyOnly) {
        shortcuts[recordingFor] = {
            ...shortcuts[recordingFor],
            key: previewShortcut.key,
            ctrl: previewShortcut.ctrl,
            shift: previewShortcut.shift,
            alt: previewShortcut.alt,
            meta: previewShortcut.meta
        };


        const conflictActions = checkConflicts();

        updateShortcutButtons(conflictActions);

        localStorage.setItem('keyboardShortcuts', JSON.stringify(shortcuts));

        recordingFor = null;
        console.log('Shortcut updated:', shortcuts);
    }
});

//for each shortcut button, add event listener for click to start recording for it
buttonsDiv.querySelectorAll('.shortcut-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const conflicts = getAllConflicts();
        updateShortcutButtons(conflicts);
        console.log('Recording shortcut for', btn.dataset.action);
        recordingFor = btn.dataset.action;
        btn.blur();
    });
});

loadDataBtn.addEventListener('click', () => {
    updateShortcutButtons();
});

// Calculate conflicts for all shortcuts
function getAllConflicts() {
    const conflictActions = new Set();
    const entries = Object.entries(shortcuts);

    for (let i = 0; i < entries.length; i++) {
        const [actionA, sA] = entries[i];
        if (!sA) continue;

        for (let j = i + 1; j < entries.length; j++) {
            const [actionB, sB] = entries[j];
            if (!sB) continue;

            if (
                sA.key === sB.key &&
                sA.ctrl === sB.ctrl &&
                sA.shift === sB.shift &&
                sA.alt === sB.alt &&
                sA.meta === sB.meta
            ) {
                conflictActions.add(actionA);
                conflictActions.add(actionB);
            }
        }
    }

    return Array.from(conflictActions);
}

function resetShortcutsToDefault() {
    shortcuts = { ...defaultShortcuts };
    localStorage.setItem('keyboardShortcuts', JSON.stringify(shortcuts));
    updateShortcutButtons();
}

const resetShortcutsBtn = document.getElementById('resetShortcuts');
resetShortcutsBtn.addEventListener('click', () => {
    resetShortcutsToDefault();
    resetShortcutsBtn.blur();
});

function checkConflicts(updatedShortcut = null, excludeAction = null) {
    const conflicts = [];

    Object.entries(shortcuts).forEach(([action, s]) => {
        if (!s) return;

        Object.entries(shortcuts).forEach(([otherAction, other]) => {
            if (!other || action >= otherAction) return; // avoid double-check
            if (
                s.key === other.key &&
                s.ctrl === other.ctrl &&
                s.shift === other.shift &&
                s.alt === other.alt &&
                s.meta === other.meta
            ) {
                conflicts.push(action, otherAction);
            }
        });
    });

    return Array.from(new Set(conflicts)); // remove duplicates
}

autoOpenCheckbox.addEventListener("change", function() { 
    localStorage.setItem("autoOpen", this.checked);
    viewState.autoOpen = this.checked;
    autoOpenCheckbox.blur();
});

//upon load, set autoOpen checkbox to saved value
document.addEventListener('DOMContentLoaded', () => {
    const autoOpen = localStorage.getItem("autoOpen");
    if (autoOpen === null) {
        viewState.autoOpen = false;
        localStorage.setItem("autoOpen", false);
    }
    else {
        viewState.autoOpen = (autoOpen === 'true');
    }
    autoOpenCheckbox.checked = viewState.autoOpen;
});