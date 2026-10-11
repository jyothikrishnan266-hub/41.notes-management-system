const STORAGE_KEY = "myNotesManagementData";

function loadNotes() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? [] : JSON.parse(saved);
  } catch {
    return [];
  }
}

let notes = loadNotes();
let editingId = null;

const $ = id => document.getElementById(id);

function saveNotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch {
    alert("Unable to save notes. Browser storage may be full.");
    return false;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function openEditor(note = null) {
  editingId = note ? note.id : null;

  $("editorHeading").textContent = note ? "Edit Note" : "Create Note";
  $("title").value = note ? note.title : "";
  $("category").value = note ? note.category : "Personal";
  $("content").value = note ? note.content : "";
  $("noteColor").value = note ? note.color : "yellow";

  $("editor").classList.remove("hidden");
  $("editor").scrollIntoView({ behavior: "smooth" });
  $("title").focus();
}

function closeEditor() {
  $("editor").classList.add("hidden");
  $("noteForm").reset();
  editingId = null;
}

function renderNotes() {
  const query = $("search").value.trim().toLowerCase();

  const filtered = notes
    .filter(note =>
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.category.toLowerCase().includes(query)
    )
    .sort((a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      b.updatedAt - a.updatedAt
    );

  $("noteCount").textContent =
    `${filtered.length} ${filtered.length === 1 ? "note" : "notes"}`;

  const container = $("notesList");

  if (!filtered.length) {
    container.innerHTML =
      '<div class="empty">No notes found. Create your first note!</div>';
    return;
  }

  container.innerHTML = filtered.map(note => `
    <article class="note-card note-${escapeHTML(note.color)}">
      <h3>${escapeHTML(note.pinned ? "📌 " : "")}${escapeHTML(note.title)}</h3>

      <span class="note-meta">
        ${escapeHTML(note.category)} · Updated
        ${escapeHTML(new Date(note.updatedAt).toLocaleDateString())}
      </span>

      <p>${escapeHTML(note.content)}</p>

      <div class="note-actions">
        <button data-action="edit" data-id="${note.id}">Edit</button>
        <button class="pin-btn" data-action="pin" data-id="${note.id}">
          ${note.pinned ? "Unpin" : "Pin"}
        </button>
        <button class="delete-btn" data-action="delete" data-id="${note.id}">
          Delete
        </button>
      </div>
    </article>
  `).join("");
}

$("newNoteBtn").addEventListener("click", () => openEditor());

$("cancelBtn").addEventListener("click", closeEditor);

$("search").addEventListener("input", renderNotes);

$("noteForm").addEventListener("submit", event => {
  event.preventDefault();

  const title = $("title").value.trim();
  const category = $("category").value;
  const content = $("content").value.trim();
  const color = $("noteColor").value;

  if (!title || !content) {
    alert("Please enter a title and note content.");
    return;
  }

  const previousNotes = notes;

  if (editingId !== null) {
    notes = notes.map(note =>
      note.id === editingId
        ? { ...note, title, category, content, color, updatedAt: Date.now() }
        : note
    );
  } else {
    notes.push({
      id: Date.now(),
      title,
      category,
      content,
      color,
      pinned: false,
      updatedAt: Date.now()
    });
  }

  if (!saveNotes()) {
    notes = previousNotes;
    return;
  }

  closeEditor();
  renderNotes();
});

$("notesList").addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const note = notes.find(item => item.id === id);
  if (!note) return;

  const action = button.dataset.action;

  if (action === "edit") {
    openEditor(note);
  }

  if (action === "pin") {
    const oldPinned = note.pinned;
    const oldUpdatedAt = note.updatedAt;

    note.pinned = !note.pinned;
    note.updatedAt = Date.now();

    if (!saveNotes()) {
      note.pinned = oldPinned;
      note.updatedAt = oldUpdatedAt;
      return;
    }

    renderNotes();
  }

  if (action === "delete") {
    if (!confirm(`Delete "${note.title}"?`)) return;

    const oldNotes = notes;
    notes = notes.filter(item => item.id !== id);

    if (!saveNotes()) {
      notes = oldNotes;
      return;
    }

    renderNotes();
  }
});

renderNotes();