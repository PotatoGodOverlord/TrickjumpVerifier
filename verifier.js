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
  const lines = text.trim().split("\n");
  const headers = lines[0].split(">").map(h => h.trim());
// headers = ["NAME", "PROOF", "TIME GIVEN", "LOCATION", "DIFF", "TIER", ...]

  const nameIdx = headers.indexOf("NAME");
  const proofIdx = headers.indexOf("PROOF");
  const locationIdx = headers.indexOf("LOCATION");
  const diffIdx = headers.indexOf("DIFF");
  const tierIdx = headers.indexOf("TIER");


  if (nameIdx === -1 || proofIdx === -1) {
    alert("Missing required columns NAME or PROOF.");
    return;
  }

  items = lines.slice(1).filter(line => line.includes("|")).map(line => {
    const cols = line.split("|").map(c => c.trim());
    return {
      name: cols[nameIdx],
      proof: cols[proofIdx],
      accepted: false,
      declined: false
    };
  }).sort((a,b) => a.name.localeCompare(b.name));
  console.log("Headers:", headers);
  console.log("Parsed items:", items);

  renderChecklist();

  // Show app, hide input
  inputArea.style.display = "none";
  appArea.style.display = "flex";
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
  proofLink.textContent = item.name + " → Proof";
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
