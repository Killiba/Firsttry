const form = document.querySelector("#weight-form");
const dateInput = document.querySelector("#entry-date");
const weightInput = document.querySelector("#entry-weight");
const noteInput = document.querySelector("#entry-note");
const entriesTable = document.querySelector("#entries");
const emptyState = document.querySelector("#empty-state");
const statsContainer = document.querySelector("#stats");
const clearButton = document.querySelector("#clear-btn");
const exportButton = document.querySelector("#export-btn");

const STORAGE_KEY = "weight-tracker-entries";

const today = new Date().toISOString().slice(0, 10);
if (dateInput) {
  dateInput.value = today;
}

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatWeight = (value) => `${Number(value).toFixed(1)} kg`;

const loadEntries = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveEntries = (entries) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

const calculateStats = (entries) => {
  if (!entries.length) return [];
  const weights = entries.map((entry) => entry.weight);
  const latest = entries[0];
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const average = weights.reduce((sum, value) => sum + value, 0) / weights.length;

  return [
    { label: "Laatste meting", value: formatWeight(latest.weight) },
    { label: "Gemiddeld", value: formatWeight(average) },
    { label: "Laagste", value: formatWeight(min) },
    { label: "Hoogste", value: formatWeight(max) },
  ];
};

const renderStats = (entries) => {
  const stats = calculateStats(entries);
  statsContainer.innerHTML = "";
  if (!stats.length) return;

  stats.forEach((stat) => {
    const card = document.createElement("div");
    card.className = "stat";
    card.innerHTML = `<span>${stat.label}</span><strong>${stat.value}</strong>`;
    statsContainer.appendChild(card);
  });
};

const renderEntries = (entries) => {
  entriesTable.innerHTML = "";
  if (!entries.length) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
  }

  entries.forEach((entry) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatDate(entry.date)}</td>
      <td>${formatWeight(entry.weight)}</td>
      <td>${entry.note ? entry.note : "-"}</td>
      <td>
        <button class="action-btn" data-id="${entry.id}">Verwijder</button>
      </td>
    `;
    entriesTable.appendChild(row);
  });

  renderStats(entries);
};

const addEntry = (entry) => {
  const entries = loadEntries();
  const updated = [entry, ...entries].sort((a, b) => b.date.localeCompare(a.date));
  saveEntries(updated);
  renderEntries(updated);
};

const removeEntry = (id) => {
  const entries = loadEntries().filter((entry) => entry.id !== id);
  saveEntries(entries);
  renderEntries(entries);
};

const exportEntries = () => {
  const entries = loadEntries();
  if (!entries.length) return;

  const header = "datum,gewicht,notitie";
  const rows = entries
    .map((entry) =>
      [entry.date, entry.weight.toFixed(1), entry.note ? entry.note.replace(/,/g, " ") : ""]
        .map((value) => `"${value}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([`${header}\n${rows}`], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "gewicht-tracker.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const date = dateInput.value;
  const weight = parseFloat(weightInput.value);
  const note = noteInput.value.trim();

  if (!date || Number.isNaN(weight)) return;

  addEntry({
    id: crypto.randomUUID(),
    date,
    weight,
    note,
  });

  weightInput.value = "";
  noteInput.value = "";
  dateInput.value = date;
});

entriesTable.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  removeEntry(button.dataset.id);
});

clearButton.addEventListener("click", () => {
  if (!loadEntries().length) return;
  const confirmed = window.confirm("Weet je zeker dat je alles wilt wissen?");
  if (!confirmed) return;
  saveEntries([]);
  renderEntries([]);
});

exportButton.addEventListener("click", exportEntries);

renderEntries(loadEntries());
