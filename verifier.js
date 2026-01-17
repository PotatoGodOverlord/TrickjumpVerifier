const fileInput = document.getElementById("fileInput");
const pasteInput = document.getElementById("pasteInput");
const loadDataBtn = document.getElementById("loadData");

const inputArea = document.getElementById("inputArea");
const appArea = document.getElementById("appArea");

const checklistContainer = document.getElementById("checklistContainer");
const proofLink = document.getElementById("proofLink");
const counters = document.getElementById("counters");
const downloadBtn = document.getElementById("downloadAccepted");

let items = [];
let acceptedCount = 0;
let declinedCount = 0;

// Load data from file or textarea
loadDataBtn.addEventListener("click", () => {
  let content = pasteInput.value;
  if (fileInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = (e) => processData(e.target.result);
    reader.readAsText(fileInput.files[0]);
  } else if (content.trim() !== "") {
    processData(content);
  } else {
    alert("Please upload a file or paste content.");
  }
});

function processData(text) {
    // --- 1️⃣ Split text into lines ---
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    // --- 2️⃣ Parse header to get column index map ---
    const headerCols = lines[0].split(">").map(h => h.trim()).filter(Boolean);
    const colIndex = Object.fromEntries(headerCols.map((name, i) => [name, i]));

    const totalCols = headerCols.length;

    // --- 3️⃣ Helper function to split a row into columns ---
    const splitCols = row => row.split("|").map(c => c.trim());

    // --- 4️⃣ Reconstruct logical rows ---
    const logicalRows = [];
    let buffer = "";

    for (const line of lines.slice(1)) {
    buffer += (buffer ? "\n" : "") + line;

    const cols = splitCols(buffer);

    // If we have enough columns, commit the row
    if (cols.length >= totalCols) {
        logicalRows.push(cols);
        buffer = "";
    }
    }

    // --- 5️⃣ Convert logical rows into items ---
    items = logicalRows.map(cols => ({
    name: cols[colIndex.NAME],
    proof: cols[colIndex.PROOF],
    ...(colIndex.LOCATION !== undefined && { location: normalizeLocation(cols[colIndex.LOCATION])}),
    ...(colIndex.DIFF !== undefined && { diff: normalizeDiff(cols[colIndex.DIFF])}),
    ...(colIndex.TIER !== undefined && { tier: normalizeTier(cols[colIndex.TIER])}),
    accepted: false,
    declined: false
    }));

    // --- 6️⃣ Sort alphabetically by name if desired ---
    items.sort((a, b) => a.name.localeCompare(b.name));

    // --- ✅ Result: `items` contains all parsed entries ---
    console.log(items);

    renderChecklist();

  // Show app, hide input
  inputArea.style.display = "none";
  appArea.style.display = "flex";
}
// -------------------------
// 1️⃣ Diff normalization
// -------------------------
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


// -------------------------
// 2️⃣ Tier normalization
// -------------------------
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


// -------------------------
// 3️⃣ Location normalization
// -------------------------
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


function renderChecklist() {
  checklistContainer.innerHTML = "";
  items.forEach((item, idx) => {
    const div = document.createElement("div");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "item_" + idx;
    checkbox.addEventListener("change", () => {
      updateDetails(idx);
    });
    const label = document.createElement("label");
    label.htmlFor = "item_" + idx;
    label.textContent = item.name;
    div.appendChild(checkbox);
    div.appendChild(label);
    checklistContainer.appendChild(div);
  });
}

function updateDetails(idx) {
  const item = items[idx];
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
/*
document.addEventListener('DOMContentLoaded', function() {
  const wrapper = document.getElementById('checklistWrapper');
  const checklist = document.getElementById('checklistContainer');
  const fadeTop = document.querySelector('.fadeTop');
  const fadeBottom = document.querySelector('.fadeBottom');
  
  // Make fade areas taller for smoother transitions
  fadeTop.style.height = '60px';
  fadeBottom.style.height = '60px';
  
  // Update checklist padding to match new fade heights
  checklist.style.padding = '60px 10px';
  checklist.style.margin = '-60px 0';
  
  // Easing function for smoother opacity transition
  // This creates a curve where more area is near full opacity
  function easeOutOpacity(progress) {
    // Cubic ease-out: starts fast, ends slow
    return 1 - Math.pow(1 - progress, 3);
  }
  
  function easeInOpacity(progress) {
    // Cubic ease-in: starts slow, ends fast
    return Math.pow(progress, 3);
  }
  
  // Create gradient canvas with correct orientation
  function createGradientCanvas() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );
    
    canvas.width = 1;
    canvas.height = documentHeight;
    
    // Create vertical gradient from TOP to BOTTOM
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    
    // Your body gradient colors in correct order (top to bottom):
    // 356deg means almost vertical upward direction
    // So rgba(240, 252, 255, 1) is at the TOP
    // rgba(255, 248, 237, 1) is at the BOTTOM
    gradient.addColorStop(0, 'rgba(240, 252, 255, 1)');      // Top (light blue)
    gradient.addColorStop(0.4, 'rgba(247, 255, 242, 1)');    // 40% (light green)
    gradient.addColorStop(1, 'rgba(255, 248, 237, 1)');      // Bottom (light peach)
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1, canvas.height);
    
    return { canvas, ctx };
  }
  
  // Get color at Y position (with alpha channel)
  function getColorAtYPosition(yPos, ctx) {
    const pixel = ctx.getImageData(0, Math.max(0, Math.min(yPos, ctx.canvas.height - 1)), 1, 1).data;
    return {
      r: pixel[0],
      g: pixel[1],
      b: pixel[2],
      a: pixel[3] / 255
    };
  }
  
  // Create a gradient with multiple stops for smoother transition
  function createSmoothGradient(color, direction, fadeHeight) {
    const stops = [];
    const numStops = 8; // More stops for smoother gradient
    
    if (direction === 'bottom') {
      // For top fade: goes from solid at top to transparent at bottom
      for (let i = 0; i <= numStops; i++) {
        const progress = i / numStops;
        const position = progress * 100;
        // Use ease-out: more area stays near full opacity
        const opacity = 1 - easeOutOpacity(progress);
        stops.push(`rgba(${color.r}, ${color.g}, ${color.b}, ${opacity.toFixed(3)}) ${position.toFixed(1)}%`);
      }
    } else {
      // For bottom fade: goes from solid at bottom to transparent at top
      for (let i = 0; i <= numStops; i++) {
        const progress = i / numStops;
        const position = progress * 100;
        // Use ease-in: more area stays near full opacity at the edge
        const opacity = 1 - easeInOpacity(progress);
        stops.push(`rgba(${color.r}, ${color.g}, ${color.b}, ${opacity.toFixed(3)}) ${position.toFixed(1)}%`);
      }
    }
    
    return `linear-gradient(to ${direction === 'bottom' ? 'bottom' : 'top'}, ${stops.join(', ')})`;
  }
  
  // Optimized update function
  let gradientCache = null;
  let lastDocumentHeight = 0;
  
  function updateFadeGradients() {
  if (!wrapper || !fadeTop || !fadeBottom) return;
  
  // Check if we need to recreate the gradient cache
  const currentDocHeight = document.documentElement.scrollHeight;
  if (!gradientCache || currentDocHeight !== lastDocumentHeight) {
    gradientCache = createGradientCanvas();
    lastDocumentHeight = currentDocHeight;
  }
  
  const { ctx } = gradientCache;
  
  // Get wrapper position relative to document
  const wrapperRect = wrapper.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  // Calculate absolute Y positions
  const topFadeTopY = wrapperRect.top + scrollTop;
  const bottomFadeBottomY = wrapperRect.bottom + scrollTop;
  
  // FIXED: Hardcoded colors
  const topColor = {
    r: 246,  // rgba(243, 253, 251, 1)
    g: 255,
    b: 245,
    a: 1
  };
  
  // bottomColor from sampled position (or hardcode if you prefer)
  const bottomColor = getColorAtYPosition(bottomFadeBottomY, ctx);
  
  // Use your swapped version
  fadeBottom.style.background = createSmoothGradient(topColor, 'top', fadeBottom.offsetHeight);
  fadeTop.style.background = createSmoothGradient(bottomColor, 'bottom', fadeTop.offsetHeight);
}
  
  // Initial update
  updateFadeGradients();
  
  // Use IntersectionObserver for more efficient scroll handling
  let isUpdating = false;
  let rafId = null;
  
  function scheduleUpdate() {
    if (isUpdating) return;
    
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    
    rafId = requestAnimationFrame(() => {
      updateFadeGradients();
      isUpdating = false;
      rafId = null;
    });
    
    isUpdating = true;
  }
  
  // Event listeners with throttling
  let scrollTimeout;
  function handleScroll() {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(scheduleUpdate, 16); // ~60fps
  }
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  
  checklist.addEventListener('scroll', handleScroll, { passive: true });
  
  // Observe DOM changes
  const observer = new MutationObserver(() => {
    gradientCache = null;
    scheduleUpdate();
  });
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
});
*/