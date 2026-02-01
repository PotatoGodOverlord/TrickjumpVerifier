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
const downloadBtn = document.getElementById("downloadProgress");

const acceptBtn = document.getElementById("acceptButton");
const declineBtn = document.getElementById("declineButton");
const skipBtn = document.getElementById("skipButton");
const backBtn = document.getElementById("backButton");
const changeBtn = document.getElementById("changeButton");

let items = [];
let acceptedCount = 0;
let declinedCount = 0;
let remainingCount = 0;
let firstItem = true;
let viewState = {
    searchQuery: "",
    sortPriority: {
        sameLink: false,
        location: false,
        tier: false,
        diff: false
    },
    activeItemId: null,
    autoOpen: false
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
  } else if (content.trim() !== "" && content.includes("https://pastee")) {
    fetch(`https://trickjumpverifier.potatogodoverlord.workers.dev/?url=${encodeURIComponent(content.trim())}`)
      .then(res => res.text())
      .then(processData)
      .catch(console.error);
  } else if (content.trim() !== "" && content.includes("https://gist.github.com/Jumpedia")) {
    getGistContent(content.trim());
  }
   else {
    alert("Please upload a file or paste valid content.");
  }
});

function processData(text) {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length > 0 && lines[0].startsWith("CURRENT PROGRESS FOR REQUEST:")) {
        processProgressData(lines.slice(1));
        return;
    }
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
        sortBoxes.innerHTML += `<input type="checkbox" id="sort_k"><label for="sort_k">By Kingdom</label> <br>`;
    }
    if (colIndex.TIER !== undefined) {
        sortBoxes.innerHTML += `<input type="checkbox" id="sort_t"><label for="sort_t">By Tier</label>`;
    }
    if (colIndex.DIFF !== undefined) {
        sortBoxes.innerHTML += `<input type="checkbox" id="sort_d"><label for="sort_d">By Diff</label>`;
    }
    //set first item as active
    if (items.length > 0) {
        viewState.activeItemId = items[0].id;
        updateDetails(viewState.activeItemId);
    }
    remainingCount = items.length;
    counters.textContent = `Accepted: ${acceptedCount} | Declined: ${declinedCount} | Remaining: ${remainingCount}`;
    updateView();

  // Show app, hide input
  inputArea.style.display = "none";
  appArea.style.display = "grid";
}

function processProgressData(lines) {
    // Split rows into columns
    const splitCols = row => row.split("|").map(c => c.trim());

    const headerCols = lines[0].split("|").map(h => h.trim()).filter(Boolean);
    const colIndex = Object.fromEntries(headerCols.map((name, i) => [name, i]));
    const totalCols = headerCols.length;

    const rows = lines.map(splitCols).filter(cols =>
        cols.length > 0 && cols[1] && cols[1].trim() !== ""
    );

    if (rows.length === 0) return;

    // Convert rows into items
    items = rows.map(cols => {
        // Convert status back to accepted/declined flags
        let accepted = false;
        let declined = false;
        if (colIndex.status !== undefined) {
            const status = cols[colIndex.status].toLowerCase();
            if (status === "accepted") accepted = true;
            else if (status === "declined") declined = true;
        }

        return {
            name: cols[colIndex.name],
            proof: cols[colIndex.proof],
            ...(colIndex.location !== undefined && cols[colIndex.location] !== "" && {
                location: normalizeLocation(cols[colIndex.location])
            }),
            ...(colIndex.diff !== undefined && cols[colIndex.diff] !== "" && {
                diff: normalizeDiff(cols[colIndex.diff])
            }),
            ...(colIndex.tier !== undefined && cols[colIndex.tier] !== "" && {
                tier: normalizeTier(cols[colIndex.tier])
            }),
            accepted,
            declined,
            id: Math.random().toString(36).substring(2, 15)
        };
    });

    // Default sort
    items.sort((a, b) => a.name.localeCompare(b.name));

    // Initialize accepted/declined counts
    acceptedCount = items.filter(i => i.accepted).length;
    declinedCount = items.filter(i => i.declined).length;
    remainingCount = items.length - acceptedCount - declinedCount;
    counters.textContent = `Accepted: ${acceptedCount} | Declined: ${declinedCount} | Remaining: ${remainingCount}`;
    // Restore sort boxes

    if (items[0].location !== undefined) {
        sortBoxes.innerHTML += `<input type="checkbox" id="sort_k"><label for="sort_k">By Kingdom</label> <br>`;
    }
    if (colIndex.tier !== undefined) {
        sortBoxes.innerHTML += `<input type="checkbox" id="sort_t"><label for="sort_t">By Tier</label>`;
    }
    if (colIndex.diff !== undefined) {
        sortBoxes.innerHTML += `<input type="checkbox" id="sort_d"><label for="sort_d">By Diff</label>`;
    }

    // Set first item active
    if (items.length > 0) {
        viewState.activeItemId = items[0].id;
        updateDetails(viewState.activeItemId);
    }

    updateView();

    // Show app, hide input
    inputArea.style.display = "none";
    appArea.style.display = "grid";
}

function getGistContent(urls) {
    const urlList = urls.split(/\s+/).filter(u => u.trim() !== "");

    const gistIds = urlList
    .map(url => {
        const match = url.match(/(?:#\d+:\s*)?https:\/\/gist\.github\.com\/Jumpedia\/([a-f0-9]+)/);
        return match ? match[1] : null;
    })
    .filter(id => id !== null);


    if (gistIds.length === 0) {
        alert("No valid Jumpedia gist URLs found.");
        return;
    }
    fetchGistMarkdowns(gistIds).then(({ headerCols, content }) => {
        headerCols = headerCols.map(col => col.replace(/`/g, ""));
        let rows = content.map(line => line.split("|").map(c => c.trim().replace(/`/g, ""))).filter(cols => cols.length > 1 && cols[1] && cols[1].trim() !== "");
        if (rows.length === 0) {
            alert("No valid data found in the provided gists.");
            return;
        }
        processGistData(headerCols, rows);
    });
    //`4073`|`Water Tower Traversal`||`10/10`|`Vault`|`Metro Kingdom`||||`Database`|`https://youtu.be/dNdOJX12R5g`||`https://www.youtube.com/watch?v=S8tNmCBHgNI`
}

function processGistData(headerCols, rows) {
    console.log(headerCols, rows);
    const colIndex = Object.fromEntries(headerCols.map((name, i) => [name, i]));
    const totalCols = headerCols.length;
    console.log(colIndex, totalCols);
    //convert to items
    //log the colums for the first 5 entries in rows
    console.log("Sample rows:");
    for (let i = 0; i < Math.min(5, rows.length); i++) {
        console.log(rows[i]);
    }
    items = rows.map(cols => {
        // const diffVal = normalizeDiff(cols[colIndex.Difficulty]);
        // console.log(`Raw diff: "${cols[colIndex.Difficulty]}", Normalized diff: ${diffVal}`);

        return {
            name: cols[colIndex.Name],
            proof: cols[colIndex.Proof],
            ...(colIndex.Location !== undefined && { location: normalizeLocation(cols[colIndex.Location]) }),
            ...(colIndex.Difficulty !== undefined && { diff: normalizeDiff(cols[colIndex.Difficulty]) }),
            ...(colIndex.Tier !== undefined && { tier: normalizeTier(cols[colIndex.Tier]) }),
            accepted: false,
            declined: false,
            id: Math.random().toString(36).substring(2, 15)
        };
    });

    //default sort
    console.log(items);
    items.sort((a, b) => a.name.localeCompare(b.name));
    //add sort boxes
    if (items[0].location !== undefined) {
        sortBoxes.innerHTML += `<input type="checkbox" id="sort_k"><label for="sort_k">By Kingdom</label> <br>`;
    }
    if (colIndex.Tier !== undefined) {
        sortBoxes.innerHTML += `<input type="checkbox" id="sort_t"><label for="sort_t">By Tier</label>`;
    }
    if (colIndex.Difficulty !== undefined) {
        sortBoxes.innerHTML += `<input type="checkbox" id="sort_d"><label for="sort_d">By Diff</label>`;
    }
    //set first item as active
    if (items.length > 0) {
        viewState.activeItemId = items[0].id;
        updateDetails(viewState.activeItemId);
    }
    remainingCount = items.length;
    counters.textContent = `Accepted: ${acceptedCount} | Declined: ${declinedCount} | Remaining: ${remainingCount}`;
    updateView();

  // Show app, hide input
  inputArea.style.display = "none";
  appArea.style.display = "grid";
}

async function fetchGistMarkdowns(gistIds) {
    let headerCols = []; // first line of first file
    let content = [];    // content of each file, excluding first line

    try {
        const markdowns = await Promise.all(
            gistIds.map(async (id, index) => {
                const res = await fetch(`https://api.github.com/gists/${id}`);
                if (!res.ok) throw new Error(`Gist ${id} not found`);
                const data = await res.json();

                const fileKey = Object.keys(data.files).find(key => key.endsWith(".md"));
                if (!fileKey) throw new Error(`No markdown file found in gist ${id}`);

                const fileContent = data.files[fileKey].content;
                const lines = fileContent.split('\n');

                if (index === 0) {
                    // parse first line of first file as header columns
                    headerCols = lines[0]
                        .split('|')         // split by pipe
                        .map(col => col.trim()) // remove extra spaces
                        .filter(col => col.length > 0); // remove empty strings
                }

                // store the rest of the file (excluding first line)
                return lines.slice(2).map(line => line.startsWith('|') ? line.slice(1) : line);
            })
        );

        content = markdowns.flat(); // all other lines for each file
        return { headerCols, content };
    } catch (err) {
        console.error(err);
        return { headerCols, content }; // empty if error
    }
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
    //create listener
    div.addEventListener("click", () => {
        if (viewState.activeItemId !== null) {
             //reset old
            const oldActive = document.getElementById("item_" + viewState.activeItemId);
            if (oldActive) oldActive.style.backgroundColor = "";
        }
        //highlight new
        viewState.activeItemId = item.id;
        const newActive = document.getElementById("item_" + viewState.activeItemId);
        newActive.style.backgroundColor = "#7a94f5b0"; 
        updateDetails(item.id);
    });
    if (viewState.activeItemId === item.id) {
        div.style.backgroundColor = "#7a94f5b0"; //highlight active
    }
    else {
        div.style.backgroundColor = ""; //default
    }
    div.className = "checklistItem";
    const label = document.createElement("label");
    div.id = "item_" + item.id;
    label.htmlFor = "item_" + item.id;
    //add green checkmark to name if accepted, red X if declined
    label.textContent = item.name + (item.accepted ? " ✅" : "") + (item.declined ? " ❌" : "");
    div.appendChild(label);
    checklistContainer.appendChild(div);
  });
}

async function updateDetails(id) {
  const item = items.find(i => i.id === id);
  proofLink.href = item.proof;
  const sameLinkItems = items.filter(i => i.proof === item.proof);
    let link = "";

    const maxItems = 5;
    const total = sameLinkItems.length;
    const visibleItems = sameLinkItems.slice(0, maxItems);

    for (let i = 0; i < visibleItems.length; i++) {
        // Add "and" before the last item (only if more than one item)
        if (i === visibleItems.length - 1 && i !== 0) {
            link += "and ";
        }

        link += visibleItems[i].name;

        // Add comma if not the last visible item
        if (i !== visibleItems.length - 1) {
            link += ", ";
        }
    }

    // Append "+ X others" if there are more than maxItems
    if (total > maxItems) {
        link += ` + ${total - maxItems} others`;
    }

    proofLink.textContent = `${link}`;
  const embedSuccess = await window.tryEmbedMedia(item.proof);
  if (!embedSuccess) {
    if (!firstItem && viewState.autoOpen) {
        proofLink.click();
    }
    firstItem = false;
  }
}

// Download accepted items
downloadBtn.addEventListener("click", () => {
  const orderedItems = [
    ...items.filter(i => i.accepted),
    ...items.filter(i => i.declined),
    ...items.filter(i => !i.accepted && !i.declined)
  ];

  const existingColumns = Array.from(
    new Set(items.flatMap(item => Object.keys(item)))
  ).filter(col => !["id", "accepted", "declined"].includes(col)); // exclude old status columns

  const preferredOrder = [
    "name",
    "proof",
    "status", // new column
    "location",
    "diff",
    "tier"
  ];

  const columns = preferredOrder.filter(col =>
    col === "status" || existingColumns.includes(col)
  );

  const headerLine = "CURRENT PROGRESS FOR REQUEST:";
  const columnHeaders = columns.join(" | ");

  const textContent = [
    headerLine,
    columnHeaders,
    ...orderedItems.map(item => {
      return columns
        .map(col => {
          if (col === "status") {
            if (item.accepted) return "Accepted";
            if (item.declined) return "Declined";
            return "Unverified";
          }
          return item[col] ?? "";
        })
        .join(" | ");
    })
  ].join("\n");

  const blob = new Blob([textContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "current_progress.txt";
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
    viewState.searchQuery = e.target.value;
    updateView();
});

function updateView() {
    visibleItems = items.filter(searchMatch).filter(linkMatch).slice().sort(comparator);

    renderChecklist(visibleItems);
    scrollActiveIntoView();
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

function scrollActiveIntoView() {
    if (!viewState.activeItemId) return; // no active item
    const el = document.getElementById(`item_${viewState.activeItemId}`);
    if (el) {
        el.scrollIntoView({
            behavior: "auto",
            block: "center"
        });
    }
}


//button listeners
acceptBtn.addEventListener("click", () => {
    if (!viewState.activeItemId) return;
    const item = items.find(i => i.id === viewState.activeItemId);
    if (item) {
        if (item.declined) declinedCount--;
        if (!item.declined && !item.accepted) remainingCount--;
        item.accepted = true;
        item.declined = false;
        acceptedCount++;
        counters.textContent = `Accepted: ${acceptedCount} | Declined: ${declinedCount} | Remaining: ${remainingCount}`;
        move_to_next_item();
    }
});

declineBtn.addEventListener("click", () => {
    if (!viewState.activeItemId) return;
    const item = items.find(i => i.id === viewState.activeItemId);
    if (item) {
        if (item.accepted) acceptedCount--;
        if (!item.declined && !item.accepted) remainingCount--;
        item.accepted = false;
        item.declined = true;
        declinedCount++;
        counters.textContent = `Accepted: ${acceptedCount} | Declined: ${declinedCount} | Remaining: ${remainingCount}`;
        move_to_next_item();
    }
});

skipBtn.addEventListener("click", () => {
    move_to_next_item();
});

backBtn.addEventListener("click", () => {
    move_to_previous_item();
});

changeBtn.addEventListener("click", () => {
    // Show input, hide app
    inputArea.style.display = "flex";
    appArea.style.display = "none";
    // Reset state
    items = [];
    acceptedCount = 0;
    declinedCount = 0;
    remainingCount = 0;
    firstItem = true;
    viewState = {
        searchQuery: "",
        sortPriority: {
            sameLink: false,
            location: false,
            tier: false,
            diff: false
        },
        activeItemId: null,
        autoOpen: false
    };
    checklistContainer.innerHTML = "";
    sortBoxes.innerHTML = "";
    pasteInput.value = "";
    fileInput.value = "";
});

function move_to_next_item() {
    if (!viewState.activeItemId) return;
    const item = items.find(i => i.id === viewState.activeItemId);
    if (item) {
        //reset current
        const div = document.getElementById("item_" + viewState.activeItemId);
        if (div) div.style.backgroundColor = ""; 
        //find next item
        const currentIndex = visibleItems.findIndex(i => i.id === viewState.activeItemId);
        const nextIndex = (currentIndex + 1) % visibleItems.length;
        //replace with first item if next doesn't exist
        if (!document.getElementById("item_" + visibleItems[nextIndex].id)) {
            viewState.activeItemId = visibleItems[0].id;
            const newActive = document.getElementById("item_" + viewState.activeItemId);
            newActive.style.backgroundColor = "#7a94f5b0";
            updateDetails(viewState.activeItemId);
        }
        else {
            viewState.activeItemId = visibleItems[nextIndex].id;
            const newActive = document.getElementById("item_" + viewState.activeItemId);
            newActive.style.backgroundColor = "#7a94f5b0";
            updateDetails(viewState.activeItemId);
        }
        updateView();
    }
}

function move_to_previous_item() {
    if (!viewState.activeItemId) return;
    const item = items.find(i => i.id === viewState.activeItemId);
    if (item) {
        //reset current
        const div = document.getElementById("item_" + viewState.activeItemId);
        if (div) div.style.backgroundColor = "";
        //find previous item
        const currentIndex = visibleItems.findIndex(i => i.id === viewState.activeItemId);
        const prevIndex = Math.max(0, (currentIndex - 1 + visibleItems.length) % visibleItems.length);
        viewState.activeItemId = visibleItems[prevIndex].id;
        const newActive = document.getElementById("item_" + viewState.activeItemId);
        newActive.style.backgroundColor = "#7a94f5b0";
        updateDetails(viewState.activeItemId);
        updateView();
    }
}

function linkMatch(item) {
    if (!viewState.sortPriority.sameLink) return true; // no filter → everything matches
    
    const activeItem = items.find(i => i.id === viewState.activeItemId);
    if (!activeItem) return true; // no active item → everything matches
    return item.proof === activeItem.proof;
}

