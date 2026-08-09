/* =====================================================
   LA NOTES
   PREMIUM APP + INDEXEDDB
===================================================== */


/* =====================================================
   DATABASE
===================================================== */

const DB_NAME = "LANotesDatabase";
const DB_VERSION = 1;

let db = null;


/* =====================================================
   APP STATE
===================================================== */

let notes = [];

let currentNoteId = null;

let currentFilter = "all";

let sortNewest = true;


/* =====================================================
   DOM
===================================================== */

const sidebar =
    document.getElementById("sidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const menuToggle =
    document.getElementById("menuToggle");

const mobileClose =
    document.getElementById("mobileClose");

const createNoteBtn =
    document.getElementById("createNoteBtn");

const headingCreateBtn =
    document.getElementById("headingCreateBtn");

const quickNote =
    document.getElementById("quickNote");

const quickBoard =
    document.getElementById("quickBoard");

const openWhiteboardBtn =
    document.getElementById("openWhiteboardBtn");

const searchInput =
    document.getElementById("searchInput");

const notesGrid =
    document.getElementById("notesGrid");

const noteModal =
    document.getElementById("noteModal");

const noteTitle =
    document.getElementById("noteTitle");

const noteContent =
    document.getElementById("noteContent");

const modalHeading =
    document.getElementById("modalHeading");

const saveNoteBtn =
    document.getElementById("saveNoteBtn");

const cancelNoteBtn =
    document.getElementById("cancelNoteBtn");

const closeNoteModalBtn =
    document.getElementById("closeNoteModal");

const saveStatus =
    document.getElementById("saveStatus");

const themeBtn =
    document.getElementById("themeBtn");

const whiteboard =
    document.getElementById("whiteboard");

const canvasArea =
    document.getElementById("canvasArea");

const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");

const boardHint =
    document.getElementById("boardHint");

const colorButton =
    document.getElementById("colorButton");

const colorPanel =
    document.getElementById("colorPanel");

const currentColor =
    document.getElementById("currentColor");

const colorPicker =
    document.getElementById("colorPicker");

const sizeRange =
    document.getElementById("sizeRange");

const sizeValue =
    document.getElementById("sizeValue");

const toast =
    document.getElementById("toast");


/* =====================================================
   INDEXEDDB
===================================================== */

function openDatabase() {

    return new Promise(
        (resolve, reject) => {

            const request =
                indexedDB.open(
                    DB_NAME,
                    DB_VERSION
                );


            request.onupgradeneeded =
                event => {

                    const database =
                        event.target.result;


                    if (
                        !database
                        .objectStoreNames
                        .contains("notes")
                    ) {

                        const store =
                            database
                            .createObjectStore(
                                "notes",
                                {
                                    keyPath: "id"
                                }
                            );


                        store.createIndex(
                            "updatedAt",
                            "updatedAt"
                        );

                        store.createIndex(
                            "pinned",
                            "pinned"
                        );

                        store.createIndex(
                            "favorite",
                            "favorite"
                        );

                        store.createIndex(
                            "trash",
                            "trash"
                        );

                    }


                    if (
                        !database
                        .objectStoreNames
                        .contains("drawings")
                    ) {

                        const store =
                            database
                            .createObjectStore(
                                "drawings",
                                {
                                    keyPath: "id"
                                }
                            );


                        store.createIndex(
                            "updatedAt",
                            "updatedAt"
                        );

                    }

                };


            request.onsuccess =
                event => {

                    db =
                        event.target.result;

                    resolve(db);

                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );

}


/* =====================================================
   DATABASE HELPERS
===================================================== */

function dbPut(
    storeName,
    data
) {

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    storeName,
                    "readwrite"
                );


            const store =
                transaction
                .objectStore(
                    storeName
                );


            const request =
                store.put(data);


            request.onsuccess =
                () =>
                    resolve(
                        request.result
                    );


            request.onerror =
                () =>
                    reject(
                        request.error
                    );

        }
    );

}


function dbGetAll(
    storeName
) {

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    storeName,
                    "readonly"
                );


            const store =
                transaction
                .objectStore(
                    storeName
                );


            const request =
                store.getAll();


            request.onsuccess =
                () =>
                    resolve(
                        request.result
                    );


            request.onerror =
                () =>
                    reject(
                        request.error
                    );

        }
    );

}


function dbDelete(
    storeName,
    id
) {

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    storeName,
                    "readwrite"
                );


            const store =
                transaction
                .objectStore(
                    storeName
                );


            const request =
                store.delete(id);


            request.onsuccess =
                () => resolve();


            request.onerror =
                () =>
                    reject(
                        request.error
                    );

        }
    );

}


/* =====================================================
   MIGRATE OLD LOCALSTORAGE
===================================================== */

async function migrateOldNotes() {

    const oldData =
        localStorage.getItem(
            "laNotes"
        );


    if (!oldData)
        return;


    let oldNotes;


    try {

        oldNotes =
            JSON.parse(oldData);

    } catch (error) {

        console.error(
            "Old data error:",
            error
        );

        return;

    }


    if (
        !Array.isArray(oldNotes)
    )
        return;


    const existing =
        await dbGetAll(
            "notes"
        );


    const existingIds =
        new Set(
            existing.map(
                note => note.id
            )
        );


    let migrated = 0;


    for (
        const oldNote
        of oldNotes
    ) {

        if (
            existingIds.has(
                oldNote.id
            )
        )
            continue;


        await dbPut(
            "notes",
            {

                id:
                    oldNote.id,

                title:
                    oldNote.title ||
                    "Untitled Note",

                content:
                    oldNote.content ||
                    "",

                pinned:
                    Boolean(
                        oldNote.pinned
                    ),

                favorite:
                    Boolean(
                        oldNote.favorite
                    ),

                trash:
                    Boolean(
                        oldNote.trash
                    ),

                createdAt:
                    oldNote.createdAt ||
                    Date.now(),

                updatedAt:
                    oldNote.updatedAt ||
                    Date.now()

            }
        );


        migrated++;

    }


    if (migrated > 0) {

        showToast(
            `${migrated} old note(s) safely migrated.`
        );

    }

}


/* =====================================================
   LOAD NOTES
===================================================== */

async function loadNotes() {

    notes =
        await dbGetAll(
            "notes"
        );


    notes.sort(
        (a, b) =>
            b.updatedAt -
            a.updatedAt
    );


    renderNotes();

    updateCounts();

}


/* =====================================================
   COUNTS
===================================================== */

function updateCounts() {

    const active =
        notes.filter(
            note => !note.trash
        );


    const pinned =
        active.filter(
            note => note.pinned
        );


    const favorite =
        active.filter(
            note => note.favorite
        );


    const trash =
        notes.filter(
            note => note.trash
        );


    document.getElementById(
        "allCount"
    ).textContent =
        active.length;


    document.getElementById(
        "pinnedCount"
    ).textContent =
        pinned.length;


    document.getElementById(
        "favoriteCount"
    ).textContent =
        favorite.length;


    document.getElementById(
        "trashCount"
    ).textContent =
        trash.length;

}


/* =====================================================
   NOTE MODAL
===================================================== */

function openNoteModal(
    id = null
) {

    currentNoteId =
        id;


    if (id !== null) {

        const note =
            notes.find(
                item =>
                    item.id === id
            );


        if (!note)
            return;


        noteTitle.value =
            note.title;


        noteContent.value =
            note.content;


        modalHeading.textContent =
            "Edit Note";


        saveStatus.textContent =
            "Editing note";

    } else {

        noteTitle.value =
            "";

        noteContent.value =
            "";

        modalHeading.textContent =
            "Create Note";


        saveStatus.textContent =
            "Not saved";

    }


    noteModal.classList.add(
        "show"
    );


    setTimeout(
        () =>
            noteTitle.focus(),
        100
    );

}


function closeNoteModal() {

    noteModal.classList.remove(
        "show"
    );

    currentNoteId =
        null;

}


async function saveCurrentNote() {

    const title =
        noteTitle.value.trim()
        ||
        "Untitled Note";


    const content =
        noteContent.value.trim();


    if (
        currentNoteId !== null
    ) {

        const note =
            notes.find(
                item =>
                    item.id ===
                    currentNoteId
            );


        if (!note)
            return;


        note.title =
            title;

        note.content =
            content;

        note.updatedAt =
            Date.now();


        await dbPut(
            "notes",
            note
        );


    } else {

        const note = {

            id:
                Date.now(),

            title,

            content,

            pinned:
                false,

            favorite:
                false,

            trash:
                false,

            createdAt:
                Date.now(),

            updatedAt:
                Date.now()

        };


        await dbPut(
            "notes",
            note
        );

    }


    closeNoteModal();

    await loadNotes();

    showToast(
        "Note saved successfully."
    );

}


saveNoteBtn.addEventListener(
    "click",
    saveCurrentNote
);


cancelNoteBtn.addEventListener(
    "click",
    closeNoteModal
);


closeNoteModalBtn.addEventListener(
    "click",
    closeNoteModal
);


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeNoteModal();

        }


        if (
            (event.ctrlKey ||
             event.metaKey) &&
            event.key.toLowerCase() ===
            "s"
        ) {

            if (
                noteModal.classList
                .contains("show")
            ) {

                event.preventDefault();

                saveCurrentNote();

            }

        }

    }
);


/* =====================================================
   DELETE
===================================================== */

async function deleteNote(
    id
) {

    const note =
        notes.find(
            item =>
                item.id === id
        );


    if (!note)
        return;


    if (note.trash) {

        const confirmed =
            confirm(
                "Delete this note permanently?"
            );


        if (!confirmed)
            return;


        await dbDelete(
            "notes",
            id
        );


        showToast(
            "Note permanently deleted."
        );

    } else {

        note.trash =
            true;

        note.updatedAt =
            Date.now();


        await dbPut(
            "notes",
            note
        );


        showToast(
            "Note moved to trash."
        );

    }


    await loadNotes();

}


/* =====================================================
   PIN
===================================================== */

async function togglePin(
    id
) {

    const note =
        notes.find(
            item =>
                item.id === id
        );


    if (!note)
        return;


    note.pinned =
        !note.pinned;


    note.updatedAt =
        Date.now();


    await dbPut(
        "notes",
        note
    );


    await loadNotes();

}


/* =====================================================
   FAVORITE
===================================================== */

async function toggleFavorite(
    id
) {

    const note =
        notes.find(
            item =>
                item.id === id
        );


    if (!note)
        return;


    note.favorite =
        !note.favorite;


    note.updatedAt =
        Date.now();


    await dbPut(
        "notes",
        note
    );


    await loadNotes();

}


/* =====================================================
   FILTER
===================================================== */

function setFilter(
    filter,
    button
) {

    currentFilter =
        filter;


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            item =>
                item.classList.remove(
                    "active"
                )
        );


    if (button) {

        button.classList.add(
            "active"
        );

    }


    const titles = {

        all:
            [
                "My Notes",
                "Capture ideas, organize thoughts and create freely.",
                "Recent Notes"
            ],

        pinned:
            [
                "Pinned Notes",
                "Your most important notes in one place.",
                "Pinned"
            ],

        favorite:
            [
                "Favorites",
                "Notes you've marked as special.",
                "Favorite Notes"
            ],

        trash:
            [
                "Trash",
                "Deleted notes are kept here until permanently removed.",
                "Trash"
            ]

    };


    const data =
        titles[filter];


    document.getElementById(
        "pageTitle"
    ).textContent =
        data[0];


    document.getElementById(
        "pageSubtitle"
    ).textContent =
        data[1];


    document.getElementById(
        "sectionTitle"
    ).textContent =
        data[2];


    renderNotes();

    closeMobileSidebar();

}


/* =====================================================
   RENDER NOTES
===================================================== */

function renderNotes() {

    let filtered =
        notes.filter(
            note => {

                if (
                    currentFilter ===
                    "pinned"
                ) {

                    return (
                        note.pinned &&
                        !note.trash
                    );

                }


                if (
                    currentFilter ===
                    "favorite"
                ) {

                    return (
                        note.favorite &&
                        !note.trash
                    );

                }


                if (
                    currentFilter ===
                    "trash"
                ) {

                    return note.trash;

                }


                return !note.trash;

            }
        );


    const search =
        searchInput.value
        .trim()
        .toLowerCase();


    if (search) {

        filtered =
            filtered.filter(
                note => {

                    return (

                        note.title
                            .toLowerCase()
                            .includes(
                                search
                            )

                        ||

                        note.content
                            .toLowerCase()
                            .includes(
                                search
                            )

                    );

                }
            );

    }


    filtered.sort(
        (a, b) =>
            sortNewest
            ? b.updatedAt - a.updatedAt
            : a.updatedAt - b.updatedAt
    );


    document.getElementById(
        "noteCountLabel"
    ).textContent =
        `${filtered.length} note${
            filtered.length === 1
            ? ""
            : "s"
        }`;


    notesGrid.innerHTML =
        "";


    if (
        filtered.length === 0
    ) {

        notesGrid.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ✦
                </div>

                <h2>
                    No notes here
                </h2>

                <p>
                    Create a note and start building your workspace.
                </p>

            </div>

        `;

        return;

    }


    filtered.forEach(
        note => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "note-card";


            const date =
                formatDate(
                    note.updatedAt
                );


            const preview =
                note.content ||
                "This note is empty. Click to start writing.";


            const badge =
                note.pinned
                ? "Pinned"
                : note.favorite
                ? "Favorite"
                : "Note";


            card.innerHTML = `

                <div class="note-top">

                    <div class="note-type">
                        ✦
                    </div>

                    <div class="note-actions">

                        <button
                            class="note-action ${
                                note.pinned
                                ? "active"
                                : ""
                            }"
                            data-action="pin"
                            title="Pin"
                        >
                            ${
                                note.pinned
                                ? "◆"
                                : "◇"
                            }
                        </button>


                        <button
                            class="note-action ${
                                note.favorite
                                ? "active"
                                : ""
                            }"
                            data-action="favorite"
                            title="Favorite"
                        >
                            ${
                                note.favorite
                                ? "★"
                                : "☆"
                            }
                        </button>


                        <button
                            class="note-action"
                            data-action="delete"
                            title="${
                                note.trash
                                ? "Delete permanently"
                                : "Move to trash"
                            }"
                        >
                            ×
                        </button>

                    </div>

                </div>


                <h3>
                    ${escapeHTML(
                        note.title
                    )}
                </h3>


                <p>
                    ${escapeHTML(
                        preview
                    )}
                </p>


                <div class="note-bottom">

                    <span class="note-date">
                        ${date}
                    </span>

                    <span class="note-badge">
                        ${badge}
                    </span>

                </div>

            `;


            card.addEventListener(
                "click",
                () =>
                    openNoteModal(
                        note.id
                    )
            );


            card.querySelector(
                '[data-action="pin"]'
            ).addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    togglePin(
                        note.id
                    );

                }
            );


            card.querySelector(
                '[data-action="favorite"]'
            ).addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    toggleFavorite(
                        note.id
                    );

                }
            );


            card.querySelector(
                '[data-action="delete"]'
            ).addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    deleteNote(
                        note.id
                    );

                }
            );


            notesGrid.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value;


    return div.innerHTML;

}


/* =====================================================
   DATE
===================================================== */

function formatDate(
    timestamp
) {

    const date =
        new Date(timestamp);


    const now =
        new Date();


    const diff =
        now - date;


    const minute =
        60 * 1000;

    const hour =
        60 * minute;

    const day =
        24 * hour;


    if (diff < minute)
        return "Just now";


    if (diff < hour)
        return `${Math.floor(
            diff / minute
        )}m ago`;


    if (diff < day)
        return `${Math.floor(
            diff / hour
        )}h ago`;


    if (diff < 7 * day)
        return `${Math.floor(
            diff / day
        )}d ago`;


    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


/* =====================================================
   SEARCH
===================================================== */

searchInput.addEventListener(
    "input",
    renderNotes
);


/* =====================================================
   SORT
===================================================== */

document
.getElementById("sortBtn")
.addEventListener(
    "click",
    () => {

        sortNewest =
            !sortNewest;


        document.getElementById(
            "sortBtn"
        ).innerHTML =
            sortNewest
            ? "Recent <span>⌄</span>"
            : "Oldest <span>⌃</span>";


        renderNotes();

    }
);


/* =====================================================
   SIDEBAR
===================================================== */

function openMobileSidebar() {

    sidebar.classList.add(
        "open"
    );

    sidebarOverlay.classList.add(
        "show"
    );

}


function closeMobileSidebar() {

    sidebar.classList.remove(
        "open"
    );

    sidebarOverlay.classList.remove(
        "show"
    );

}


menuToggle.addEventListener(
    "click",
    openMobileSidebar
);


mobileClose.addEventListener(
    "click",
    closeMobileSidebar
);


sidebarOverlay.addEventListener(
    "click",
    closeMobileSidebar
);


/* AUTO CLOSE MENU */

document
.querySelectorAll(
    ".nav-item"
)
.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const filter =
                    button.dataset.filter;


                if (filter) {

                    setFilter(
                        filter,
                        button
                    );

                }

            }
        );

    }
);


/* =====================================================
   CREATE NOTE
===================================================== */

createNoteBtn.addEventListener(
    "click",
    () => {

        closeMobileSidebar();

        openNoteModal();

    }
);


headingCreateBtn.addEventListener(
    "click",
    openNoteModal
);


quickNote.addEventListener(
    "click",
    openNoteModal
);


/* =====================================================
   WHITEBOARD OPEN
===================================================== */

openWhiteboardBtn.addEventListener(
    "click",
    () => {

        closeMobileSidebar();

        openWhiteboard();

    }
);


quickBoard.addEventListener(
    "click",
    openWhiteboard
);


/* =====================================================
   THEME
===================================================== */

function applyTheme() {

    const dark =
        document.body.classList
        .contains("dark");


    themeBtn.textContent =
        dark
        ? "☀"
        : "☾";


    localStorage.setItem(
        "laTheme",
        dark
        ? "dark"
        : "light"
    );

}


if (
    localStorage.getItem(
        "laTheme"
    ) === "dark"
) {

    document.body.classList.add(
        "dark"
    );

}


applyTheme();


themeBtn.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark"
        );

        applyTheme();

    }
);


/* =====================================================
   WHITEBOARD STATE
===================================================== */

let boardTool =
    "pencil";

let boardColor =
    "#111827";

let boardSize =
    4;

let drawing =
    false;

let startX =
    0;

let startY =
    0;

let history = [];

let redoHistory = [];

let currentDrawingId =
    null;

let hasDrawn =
    false;


/* =====================================================
   WHITEBOARD OPEN
===================================================== */

async function openWhiteboard() {

    whiteboard.classList.add(
        "show"
    );


    await new Promise(
        resolve =>
            requestAnimationFrame(
                resolve
            )
    );


    setupCanvas();

    history = [];

    redoHistory = [];

    currentDrawingId = null;

    hasDrawn = false;

    boardHint.classList.remove(
        "hidden"
    );


    saveCanvasState();

}


/* =====================================================
   CLOSE WHITEBOARD
===================================================== */

document
.getElementById("closeWhiteboard")
.addEventListener(
    "click",
    () => {

        closeWhiteboard();

    }
);


function closeWhiteboard() {

    whiteboard.classList.remove(
        "show"
    );

}


/* =====================================================
   CANVAS SETUP
===================================================== */

function setupCanvas() {

    const rect =
        canvasArea
        .getBoundingClientRect();


    const old =
        document.createElement(
            "canvas"
        );


    old.width =
        canvas.width;

    old.height =
        canvas.height;


    if (
        canvas.width &&
        canvas.height
    ) {

        old
            .getContext("2d")
            .drawImage(
                canvas,
                0,
                0
            );

    }


    canvas.width =
        Math.max(
            1,
            Math.floor(
                rect.width
            )
        );


    canvas.height =
        Math.max(
            1,
            Math.floor(
                rect.height
            )
        );


    ctx.fillStyle =
        "#ffffff";


    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    if (
        old.width &&
        old.height
    ) {

        ctx.drawImage(
            old,
            0,
            0,
            old.width,
            old.height,
            0,
            0,
            canvas.width,
            canvas.height
        );

    }

}


window.addEventListener(
    "resize",
    () => {

        if (
            whiteboard.classList
            .contains("show")
        ) {

            setupCanvas();

        }

    }
);


/* =====================================================
   TOOL SELECT
===================================================== */

document
.querySelectorAll(
    ".board-tool[data-tool]"
)
.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".board-tool[data-tool]"
                    )
                    .forEach(
                        item =>
                            item.classList
                            .remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                boardTool =
                    button.dataset.tool;


                boardHint.classList.add(
                    "hidden"
                );

            }
        );

    }
);


/* =====================================================
   COLOR PANEL
===================================================== */

colorButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        colorPanel.classList.toggle(
            "show"
        );

    }
);


colorPanel.addEventListener(
    "click",
    event =>
        event.stopPropagation()
);


document.addEventListener(
    "click",
    () => {

        colorPanel.classList.remove(
            "show"
        );

    }
);


/* PRESET COLORS */

document
.querySelectorAll(
    ".preset"
)
.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                setBoardColor(
                    button.dataset.color
                );

            }
        );

    }
);


/* CUSTOM COLOR */

colorPicker.addEventListener(
    "input",
    event => {

        setBoardColor(
            event.target.value
        );

    }
);


function setBoardColor(
    newColor
) {

    boardColor =
        newColor;


    colorPicker.value =
        newColor;


    currentColor.style.background =
        newColor;


    colorPanel.classList.remove(
        "show"
    );

}


/* =====================================================
   SIZE
===================================================== */

sizeRange.addEventListener(
    "input",
    event => {

        boardSize =
            Number(
                event.target.value
            );


        sizeValue.textContent =
            boardSize;

    }
);


/* =====================================================
   POINTER POSITION
===================================================== */

function getPointerPosition(
    event
) {

    const rect =
        canvas.getBoundingClientRect();


    return {

        x:
            event.clientX -
            rect.left,

        y:
            event.clientY -
            rect.top

    };

}


/* =====================================================
   BRUSH CONFIG
===================================================== */

function configureBrush() {

    ctx.lineCap =
        "round";

    ctx.lineJoin =
        "round";


    ctx.globalCompositeOperation =
        "source-over";


    switch (
        boardTool
    ) {

        case "pencil":

            ctx.strokeStyle =
                boardColor;

            ctx.globalAlpha =
                .72;

            ctx.lineWidth =
                boardSize;

            break;


        case "pen":

            ctx.strokeStyle =
                boardColor;

            ctx.globalAlpha =
                1;

            ctx.lineWidth =
                boardSize;

            break;


        case "brush":

            ctx.strokeStyle =
                boardColor;

            ctx.globalAlpha =
                .52;

            ctx.lineWidth =
                boardSize * 2.5;

            break;


        case "marker":

            ctx.strokeStyle =
                boardColor;

            ctx.globalAlpha =
                .28;

            ctx.lineWidth =
                boardSize * 4;

            break;


        case "eraser":

            ctx.strokeStyle =
                "#ffffff";

            ctx.globalAlpha =
                1;

            ctx.lineWidth =
                boardSize * 3;

            break;

    }

}


/* =====================================================
   START DRAWING
===================================================== */

function startDrawing(
    event
) {

    event.preventDefault();


    const point =
        getPointerPosition(
            event
        );


    startX =
        point.x;

    startY =
        point.y;


    boardHint.classList.add(
        "hidden"
    );


    /* TEXT */

    if (
        boardTool ===
        "text"
    ) {

        const text =
            prompt(
                "Enter text:"
            );


        if (
            text &&
            text.trim()
        ) {

            ctx.globalAlpha =
                1;

            ctx.fillStyle =
                boardColor;

            ctx.font =
                `${Math.max(
                    16,
                    boardSize * 4
                )}px Inter, Arial`;


            ctx.fillText(
                text,
                startX,
                startY
            );


            saveCanvasState();

        }


        return;

    }


    drawing =
        true;


    ctx.beginPath();


    ctx.moveTo(
        startX,
        startY
    );


    configureBrush();

}


/* =====================================================
   DRAW
===================================================== */

function draw(
    event
) {

    if (!drawing)
        return;


    event.preventDefault();


    const point =
        getPointerPosition(
            event
        );


    if (
        boardTool === "pencil" ||
        boardTool === "pen" ||
        boardTool === "brush" ||
        boardTool === "marker" ||
        boardTool === "eraser"
    ) {

        ctx.lineTo(
            point.x,
            point.y
        );


        ctx.stroke();

        hasDrawn =
            true;

    }

}


/* =====================================================
   STOP DRAWING
===================================================== */

function stopDrawing(
    event
) {

    if (!drawing)
        return;


    drawing =
        false;


    ctx.globalAlpha =
        1;


    if (
        boardTool === "line" ||
        boardTool === "rectangle" ||
        boardTool === "circle"
    ) {

        const point =
            getPointerPosition(
                event
            );


        drawShape(
            point.x,
            point.y
        );

    }


    ctx.closePath();


    if (
        hasDrawn ||
        boardTool === "line" ||
        boardTool === "rectangle" ||
        boardTool === "circle"
    ) {

        saveCanvasState();

    }

}


/* =====================================================
   SHAPES
===================================================== */

function drawShape(
    endX,
    endY
) {

    ctx.globalAlpha =
        1;

    ctx.strokeStyle =
        boardColor;

    ctx.lineWidth =
        boardSize;

    ctx.beginPath();


    if (
        boardTool === "line"
    ) {

        ctx.moveTo(
            startX,
            startY
        );

        ctx.lineTo(
            endX,
            endY
        );

    }


    if (
        boardTool ===
        "rectangle"
    ) {

        ctx.rect(
            startX,
            startY,
            endX - startX,
            endY - startY
        );

    }


    if (
        boardTool ===
        "circle"
    ) {

        const radius =
            Math.sqrt(
                Math.pow(
                    endX - startX,
                    2
                ) +
                Math.pow(
                    endY - startY,
                    2
                )
            );


        ctx.arc(
            startX,
            startY,
            radius,
            0,
            Math.PI * 2
        );

    }


    ctx.stroke();

}


/* =====================================================
   POINTER EVENTS
===================================================== */

canvas.addEventListener(
    "pointerdown",
    startDrawing
);


canvas.addEventListener(
    "pointermove",
    draw
);


canvas.addEventListener(
    "pointerup",
    stopDrawing
);


canvas.addEventListener(
    "pointercancel",
    stopDrawing
);


canvas.addEventListener(
    "pointerleave",
    event => {

        if (
            drawing
        ) {

            stopDrawing(
                event
            );

        }

    }
);


/* =====================================================
   HISTORY
===================================================== */

function saveCanvasState() {

    try {

        history.push(
            canvas.toDataURL(
                "image/png"
            )
        );


        if (
            history.length > 40
        ) {

            history.shift();

        }


        redoHistory =
            [];

    } catch (error) {

        console.error(
            "Canvas history error:",
            error
        );

    }

}


function restoreCanvas(
    data
) {

    const image =
        new Image();


    image.onload =
        () => {

            ctx.globalAlpha =
                1;

            ctx.globalCompositeOperation =
                "source-over";


            ctx.fillStyle =
                "#ffffff";


            ctx.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );


            ctx.drawImage(
                image,
                0,
                0,
                canvas.width,
                canvas.height
            );

        };


    image.src =
        data;

}


/* =====================================================
   UNDO
===================================================== */

document
.getElementById("undoBtn")
.addEventListener(
    "click",
    () => {

        if (
            history.length <= 1
        )
            return;


        const current =
            history.pop();


        redoHistory.push(
            current
        );


        const previous =
            history[
                history.length - 1
            ];


        restoreCanvas(
            previous
        );

    }
);


/* =====================================================
   REDO
===================================================== */

document
.getElementById("redoBtn")
.addEventListener(
    "click",
    () => {

        if (
            !redoHistory.length
        )
            return;


        const next =
            redoHistory.pop();


        history.push(
            next
        );


        restoreCanvas(
            next
        );

    }
);


/* =====================================================
   CLEAR BOARD
===================================================== */

document
.getElementById("boardClearBtn")
.addEventListener(
    "click",
    () => {

        const confirmed =
            confirm(
                "Clear the entire whiteboard?"
            );


        if (!confirmed)
            return;


        ctx.globalAlpha =
            1;

        ctx.globalCompositeOperation =
            "source-over";

        ctx.fillStyle =
            "#ffffff";


        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        saveCanvasState();


        showToast(
            "Whiteboard cleared."
        );

    }
);


/* =====================================================
   SAVE DRAWING
===================================================== */

document
.getElementById("boardSaveBtn")
.addEventListener(
    "click",
    saveDrawing
);


async function saveDrawing() {

    const defaultName =
        "Whiteboard " +
        new Date()
        .toLocaleDateString();


    const name =
        prompt(
            "Drawing name:",
            defaultName
        );


    if (!name)
        return;


    const image =
        canvas.toDataURL(
            "image/png"
        );


    const drawing = {

        id:
            currentDrawingId ||
            Date.now(),

        name,

        canvasData:
            image,

        createdAt:
            Date.now(),

        updatedAt:
            Date.now()

    };


    currentDrawingId =
        drawing.id;


    await dbPut(
        "drawings",
        drawing
    );


    showToast(
        "Whiteboard saved locally."
    );

}


/* =====================================================
   KEYBOARD SHORTCUTS
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            whiteboard.classList
            .contains("show")
        ) {

            if (
                event.ctrlKey &&
                event.key.toLowerCase()
                === "z"
            ) {

                event.preventDefault();

                document
                    .getElementById(
                        "undoBtn"
                    )
                    .click();

            }


            if (
                event.ctrlKey &&
                event.key.toLowerCase()
                === "y"
            ) {

                event.preventDefault();

                document
                    .getElementById(
                        "redoBtn"
                    )
                    .click();

            }

        }


        /* SEARCH */

        if (
            event.key === "/" &&
            document.activeElement.tagName !==
            "INPUT" &&
            document.activeElement.tagName !==
            "TEXTAREA"
        ) {

            event.preventDefault();

            searchInput.focus();

        }

    }
);


/* =====================================================
   TOAST
===================================================== */

let toastTimer;


function showToast(
    message
) {

    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2400
        );

}


/* =====================================================
   INITIALIZE
===================================================== */

async function initializeApp() {

    try {

        await openDatabase();

        /*
         * IMPORTANT:
         * Existing LocalStorage data is copied
         * into IndexedDB.
         *
         * LocalStorage is NOT deleted.
         */

        await migrateOldNotes();

        await loadNotes();

    } catch (error) {

        console.error(
            "LA Notes initialization error:",
            error
        );


        showToast(
            "Database open nahi ho saka."
        );

    }

}


initializeApp();
