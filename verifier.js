const fileInput = document.getElementById("fileInput");
const pasteInput = document.getElementById("pasteInput");
const loadDataBtn = document.getElementById("loadData");

const inputArea = document.getElementById("inputArea");
const appArea = document.getElementById("appArea");

const searchContainer = document.getElementById("searchContainer");
const sortBoxes = document.getElementById("sortBoxes");
const checklistContainer = document.getElementById("checklistContainer");
const proofLink = document.getElementById("proofLink");
const counters = document.getElementById("counters");
const downloadBtn = document.getElementById("downloadAccepted");

let items = [];
let acceptedCount = 0;
let declinedCount = 0;
let viewState = {
    searchQuery: "",
    sortPriority: {
        sameLink: false,
        location: false,
        tier: false,
        diff: false
    },
    activeItemId: null
};
// Load data from file or textarea
loadDataBtn.addEventListener("click", () => {
  let content = pasteInput.value;
  if (fileInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = (e) => processData(e.target.result);
    reader.readAsText(fileInput.files[0]);
  } else if (content.trim() !== "" && content.includes("|")) {
    processData(content);
  } else {
    alert("Please upload a file or paste valid content.");
  }
});

function processData(text) {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    const headerCols = lines[0].split(">").map(h => h.trim()).filter(Boolean);
    const colIndex = Object.fromEntries(headerCols.map((name, i) => [name, i]));

    const totalCols = headerCols.length;

    //helper function to split a row into columns
    const splitCols = row => row.split("|").map(c => c.trim());

    //reconstruct logical rows
    const logicalRows = [];
    let buffer = "";

    for (const line of lines.slice(1)) {
    buffer += (buffer ? "\n" : "") + line;

    const cols = splitCols(buffer);

    //enough columns -> complete row
    if (cols.length >= totalCols) {
        //store row only if proof is present in row
        if (cols[colIndex.PROOF] && cols[colIndex.PROOF].trim() !== "") {
            logicalRows.push(cols);
        }
        buffer = "";
    }
    }

    //convert to items
    items = logicalRows.map(cols => ({
    name: cols[colIndex.NAME],
    proof: cols[colIndex.PROOF],
    ...(colIndex.LOCATION !== undefined && { location: normalizeLocation(cols[colIndex.LOCATION])}),
    ...(colIndex.DIFF !== undefined && { diff: normalizeDiff(cols[colIndex.DIFF])}),
    ...(colIndex.TIER !== undefined && { tier: normalizeTier(cols[colIndex.TIER])}),
    accepted: false,
    declined: false,
    id: Math.random().toString(36).substring(2, 15)
    }));

    //default sort
    items.sort((a, b) => a.name.localeCompare(b.name));
    //add sort boxes
    if (items[0].location !== undefined) {
        sortBoxes.innerHTML += `<input type="checkbox" id="sort_k"><label for="sort_k">By Kingdom</label> <br> <br>`;
    }
    if (colIndex.TIER !== undefined) {
        sortBoxes.innerHTML += `<input type="checkbox" id="sort_t"><label for="sort_t">By Tier</label>`;
    }
    if (colIndex.DIFF !== undefined) {
        sortBoxes.innerHTML += `<input type="checkbox" id="sort_d"><label for="sort_d">By Diff</label>`;
    }

    updateView();

  // Show app, hide input
  inputArea.style.display = "none";
  appArea.style.display = "grid";
}
// -------------------------
//diff mapping
const diffMap = {
  "Low Elite": 11,
  "Mid Elite": 12,
  "High Elite": 13,
  "Insanity Elite": 14,
  "God Tier": 15,
  "Hell Tier": 16
};

function normalizeDiff(raw) {
  if (!raw) return undefined;
  
  raw = raw.trim();

  // Numeric format like 0/10, 0.5/10, 8/10
  const match = raw.match(/^(\d+)(?:\.\d+)?\/10$/);
  if (match) {
    return parseInt(match[1], 10);
  }

  // Textual mapping
  if (diffMap[raw] !== undefined) return diffMap[raw];

  // Unknown value
  return undefined;
}

//tier mapping
const tierMap = {
  "Beginner": 1,
  "Intermediate": 2,
  "Advanced": 3,
  "Expert": 4,
  "Master": 5,
  "Low Elite": 6,
  "Mid Elite": 7,
  "High Elite": 8,
  "Insanity Elite": 9,
  "God Tier": 10,
  "Hell Tier": 11
};

function normalizeTier(raw) {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return tierMap[trimmed] ?? undefined;
}

//kingdom mapping
const locationMap = {
  "Mushroom Kingdom": 1,
  "Cap Kingdom": 2,
  "Cascade Kingdom": 3,
  "Sand Kingdom": 4,
  "Lake Kingdom": 5,
  "Wooded Kingdom": 6,
  "Cloud Kingdom": 7,
  "Lost Kingdom": 8,
  "Metro Kingdom": 9,
  "Snow Kingdom": 10,
  "Seaside Kingdom": 11,
  "Luncheon Kingdom": 12,
  "Ruined Kingdom": 13,
  "Bowser’s Kingdom": 14,
  "Moon Kingdom": 15,
  "Dark Side": 16,
  "Darker Side": 17,
  "Odyssey": 18
};

function normalizeLocation(raw) {
  if (!raw) return undefined;

  // If multiple kingdoms appear separated by " - ", take only the first
  const firstPart = raw.split(" - ")[0].trim();

  return locationMap[firstPart] ?? undefined;
}


function renderChecklist(visibleItems) {
  checklistContainer.innerHTML = "";
  visibleItems.forEach((item, idx) => {
    const div = document.createElement("div");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "item_" + idx;
    checkbox.addEventListener("change", () => {
      updateDetails(item.id);
    });
    const label = document.createElement("label");
    label.htmlFor = "item_" + idx;
    label.textContent = item.name;
    div.appendChild(checkbox);
    div.appendChild(label);
    checklistContainer.appendChild(div);
  });
}

function updateDetails(id) {
  const item = items.find(i => i.id === id);
  proofLink.href = item.proof;
    proofLink.textContent = item.name + "";
}

// Download accepted items
downloadBtn.addEventListener("click", () => {
  const accepted = items.filter(i => i.accepted).map(i => i.name).join("\n");
  const blob = new Blob([accepted], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "accepted.txt";
  a.click();
  URL.revokeObjectURL(url);
});

//sort listeners
document.getElementById("searchContainer").addEventListener("change", e => {
    if (e.target.id === "sort_l") viewState.sortPriority.sameLink = e.target.checked;
    else if (e.target.id === "sort_k") viewState.sortPriority.location = e.target.checked;
    else if (e.target.id === "sort_t") viewState.sortPriority.tier = e.target.checked;
    else if (e.target.id === "sort_d") viewState.sortPriority.diff = e.target.checked;

    updateView();
});


//search listener
document.getElementById("searchBox").addEventListener("input", (e) => {
    if (!viewState.sortPriority.sameLink) {
        console.log("Currently false in search");
    }
    viewState.searchQuery = e.target.value;
    if (viewState.sortPriority.sameLink) {
        console.log("Now true in search");
    }
    updateView();
});

function updateView() {
    // Implement sorting logic based on viewState.sortPriority

    visibleItems = items.filter(searchMatch).slice().sort(comparator);

    renderChecklist(visibleItems);
}

function comparator(a, b) {
    //link
    if (viewState.sortPriority.sameLink) {
        const aLink = a.proof || "";
        const bLink = b.proof || "";
        if (aLink !== bLink) return aLink.localeCompare(bLink);
    }

    //location
    if (viewState.sortPriority.location) {
        if (a.location != null && b.location != null && a.location !== b.location) {
            return a.location - b.location;
        }
    }

    //tier
    if (viewState.sortPriority.tier) {
        if (a.tier != null && b.tier != null && a.tier !== b.tier) {
            return a.tier - b.tier;
        }
    }

    //diff
    if (viewState.sortPriority.diff) {
        if (a.diff != null && b.diff != null && a.diff !== b.diff) {
            return a.diff - b.diff;
        }
    }

    //fallback: always sort by name
    return a.name.localeCompare(b.name);
}


function searchMatch(item) {
    const query = viewState.searchQuery.toLowerCase().trim();
    if (!query) return true;  // no search → everything matches

    return item.name.toLowerCase().includes(query);
}