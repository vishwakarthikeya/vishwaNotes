// ========== app.js ==========
// Global variables
let activeBooks = [];
let currentSha = null;

// DOM elements
const splash = document.getElementById('splash-screen');
const lockScreen = document.getElementById('lock-screen');
const dashboard = document.getElementById('dashboard');
const bookGrid = document.getElementById('book-grid');
const searchInput = document.getElementById('search-books');
const bookCounter = document.getElementById('book-counter');
const createFab = document.getElementById('create-book-fab');
const createModal = document.getElementById('create-book-modal');
const addChapterModal = document.getElementById('add-chapter-modal');
const closeModals = document.querySelectorAll('.close-modal');
const createForm = document.getElementById('create-book-form');
const addChapterForm = document.getElementById('add-chapter-form');
const bookDetailView = document.getElementById('book-detail-view');
const chapterReaderView = document.getElementById('chapter-reader-view');
const backToDashboard = document.getElementById('back-to-dashboard');
const backToBook = document.getElementById('back-to-book');
const detailCover = document.getElementById('detail-cover');
const detailTitle = document.getElementById('detail-title');
const detailDesc = document.getElementById('detail-desc');
const chapterList = document.getElementById('chapter-list');
const chapterCounter = document.getElementById('chapter-counter');
const addChapterBtn = document.getElementById('add-chapter-btn');
const pdfIframe = document.getElementById('pdf-iframe');
const readerChapterTitle = document.getElementById('reader-chapter-title');

// init after splash
setTimeout(() => {
  splash.classList.add('hidden');
  lockScreen.classList.remove('hidden');
  PINAuth.init();
}, 2400);

// load data from GitHub on unlock success (override PINAuth.onSuccess)
const originalSuccess = PINAuth.onSuccess;
PINAuth.onSuccess = function() {
  originalSuccess.call(this); // hide lock, show dashboard
  loadFromGitHub();
};
function loadFromGitHub() {
  GitHubSync.fetchBooks().then(res => {
    activeBooks = res.books || [];
    currentSha = res.sha;
    window.booksData = activeBooks; // sync
    renderBookGrid(activeBooks);
  }).catch(err => {
    console.warn('GitHub load failed, start empty', err);
    activeBooks = [];
    renderBookGrid([]);
  });
}

function renderBookGrid(books) {
  bookGrid.innerHTML = '';
  books.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.dataset.id = book.id;
    card.innerHTML = `
      <img src="${book.cover || 'assets/default-cover.jpg'}" alt="cover" class="book-cover" loading="lazy">
      <div class="book-info">
        <div class="book-title">${escapeHtml(book.title)}</div>
        <div class="book-desc">${escapeHtml(book.desc || '')}</div>
      </div>
    `;
    card.addEventListener('click', () => openBookDetail(book.id));
    bookGrid.appendChild(card);
  });
  bookCounter.textContent = `${books.length} book${books.length!==1?'s':''}`;
}
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[&<>"']/g, function(m) {
    if(m === '&') return '&amp;'; if(m === '<') return '&lt;'; if(m === '>') return '&gt;';
    if(m === '"') return '&quot;'; return '&#039;';
  });
}

// search
searchInput.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = activeBooks.filter(b => b.title.toLowerCase().includes(term));
  renderBookGrid(filtered);
});

// create book modal
createFab.addEventListener('click', () => createModal.classList.remove('hidden'));
closeModals.forEach(x => x.addEventListener('click', (e) => {
  createModal.classList.add('hidden');
  addChapterModal.classList.add('hidden');
}));

// cover preview
document.getElementById('cover-upload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => document.getElementById('cover-preview').src = e.target.result;
    reader.readAsDataURL(file);
  }
});

createForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('book-title').value;
  const desc = document.getElementById('book-desc').value;
  const coverInput = document.getElementById('cover-upload');
  let coverData = '';
  if (coverInput.files[0]) {
    coverData = await toBase64(coverInput.files[0]);
  } else {
    coverData = 'assets/default-cover.jpg';
  }
  const newBook = {
    id: Date.now().toString() + Math.random().toString(36).substring(2),
    title, desc, cover: coverData, chapters: []
  };
  activeBooks.push(newBook);
  await pushToGitHub();
  renderBookGrid(activeBooks);
  createModal.classList.add('hidden');
  createForm.reset();
  document.getElementById('cover-preview').src = '#';
});

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader(); r.readAsDataURL(file);
    r.onload = () => res(r.result); r.onerror = rej;
  });
}

async function pushToGitHub() {
  const ok = await GitHubSync.saveBooks(activeBooks, currentSha);
  if (ok) {
    const refreshed = await GitHubSync.fetchBooks();
    activeBooks = refreshed.books;
    currentSha = refreshed.sha;
  }
}

// open book detail
function openBookDetail(bookId) {
  const book = activeBooks.find(b => b.id === bookId);
  if (!book) return;
  currentBookId = bookId;
  detailCover.src = book.cover || 'assets/default-cover.jpg';
  detailTitle.textContent = book.title;
  detailDesc.textContent = book.desc || 'no description';
  renderChapters(book.chapters || []);
  dashboard.classList.add('hidden');
  bookDetailView.classList.remove('hidden');
}

function renderChapters(chapters) {
  chapterList.innerHTML = '';
  chapters.forEach((ch, index) => {
    const card = document.createElement('div');
    card.className = 'chapter-card';
    card.innerHTML = `<h4>${escapeHtml(ch.title)}</h4><p>${escapeHtml(ch.desc || '')}</p>`;
    card.addEventListener('click', () => openChapterReader(ch, index));
    chapterList.appendChild(card);
  });
  chapterCounter.textContent = `${chapters.length} chapters`;
}

// add chapter
addChapterBtn.addEventListener('click', () => {
  if (!currentBookId) return;
  addChapterModal.classList.remove('hidden');
});
addChapterForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('chapter-title').value;
  const desc = document.getElementById('chapter-desc').value;
  const pdfLink = document.getElementById('pdf-link').value;
  const book = activeBooks.find(b => b.id === currentBookId);
  if (book) {
    if (!book.chapters) book.chapters = [];
    book.chapters.push({ title, desc, pdfLink });
    await pushToGitHub();
    renderChapters(book.chapters);
  }
  addChapterModal.classList.add('hidden');
  addChapterForm.reset();
});

function openChapterReader(chapter) {
  pdfIframe.src = chapter.pdfLink;
  readerChapterTitle.textContent = chapter.title;
  bookDetailView.classList.add('hidden');
  chapterReaderView.classList.remove('hidden');
}

backToDashboard.addEventListener('click', () => {
  bookDetailView.classList.add('hidden');
  dashboard.classList.remove('hidden');
  currentBookId = null;
});
backToBook.addEventListener('click', () => {
  chapterReaderView.classList.add('hidden');
  bookDetailView.classList.remove('hidden');
  pdfIframe.src = '';
});

// close modals when click outside
window.addEventListener('click', (e) => {
  if (e.target === createModal) createModal.classList.add('hidden');
  if (e.target === addChapterModal) addChapterModal.classList.add('hidden');
});