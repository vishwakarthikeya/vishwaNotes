// App State
let notes = [];
let editingId = null;
let currentViewerNote = null;
let viewerMode = 'fit-screen'; // fit-screen, full-width, focus
let zoomLevel = 1;
let scrollPosition = 0;

// DOM Elements
const notesGrid = document.getElementById('notesGrid');
const emptyState = document.getElementById('emptyState');
const addNoteBtn = document.getElementById('addNoteBtn');
const noteModal = document.getElementById('noteModal');
const modalTitle = document.getElementById('modalTitle');
const noteForm = document.getElementById('noteForm');
const imageUrlInput = document.getElementById('imageUrl');
const noteTitleInput = document.getElementById('noteTitle');
const noteLinkInput = document.getElementById('noteLink');
const noteIdInput = document.getElementById('noteId');
const closeModal = document.getElementById('closeModal');
const cancelModal = document.getElementById('cancelModal');

// Full-Screen Viewer Elements
const fullscreenViewer = document.getElementById('fullscreenViewer');
const viewerTitle = document.getElementById('viewerTitle');
const viewerContent = document.getElementById('viewerContent');
const viewerWrapper = document.getElementById('viewerWrapper');
const viewerBack = document.getElementById('viewerBack');
const viewerClose = document.getElementById('viewerClose');
const fitToScreenBtn = document.getElementById('fitToScreenBtn');
const fullWidthBtn = document.getElementById('fullWidthBtn');
const focusModeBtn = document.getElementById('focusModeBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomLevelSpan = document.getElementById('zoomLevel');
const fileTypeBadge = document.getElementById('fileTypeBadge');
const scrollPositionSpan = document.getElementById('scrollPosition');
const originalSizeBtn = document.getElementById('originalSizeBtn');
const toggleControlsBtn = document.getElementById('toggleControlsBtn');
const viewerFooter = document.getElementById('viewerFooter');

// Load notes from localStorage
function loadNotes() {
  const saved = localStorage.getItem('folio_notes');
  if (saved) {
    try {
      notes = JSON.parse(saved);
    } catch (e) {
      notes = [];
    }
  } else {
    // Sample notes with Unsplash images
    notes = [
      {
        id: '1',
        imageUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400',
        title: 'Mountain Inspiration',
        link: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200',
        type: 'image'
      },
      {
        id: '2',
        imageUrl: 'https://images.unsplash.com/photo-1519638399535-1b036603ac77?w=400',
        title: 'Design Reference',
        link: 'https://images.unsplash.com/photo-1519638399535-1b036603ac77?w=1200',
        type: 'image'
      },
      {
        id: '3',
        imageUrl: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=400',
        title: 'Abstract Art',
        link: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1200',
        type: 'image'
      }
    ];
  }
  renderNotes();
  
  // Restore viewer state if it was open
  const lastView = sessionStorage.getItem('lastViewerNote');
  if (lastView) {
    try {
      const noteId = lastView;
      const note = notes.find(n => n.id === noteId);
      if (note) {
        setTimeout(() => openFullscreenViewer(noteId), 100);
      }
    } catch (e) {}
  }
}

// Save notes to localStorage
function saveNotes() {
  localStorage.setItem('folio_notes', JSON.stringify(notes));
  renderNotes();
}

// Render notes grid
function renderNotes() {
  if (notes.length === 0) {
    emptyState.style.display = 'block';
    notesGrid.innerHTML = '';
  } else {
    emptyState.style.display = 'none';
    
    let html = '';
    notes.forEach(note => {
      const fileType = getFileType(note.link);
      const typeIcon = fileType === 'pdf' ? '📄' : (fileType === 'image' ? '🖼️' : '🔗');
      const typeColor = fileType === 'pdf' ? '#FF6B6B' : (fileType === 'image' ? '#3A86FF' : '#8338EC');
      
      html += `
        <div class="note-card" data-id="${note.id}" style="border-color: ${typeColor}20;">
          <img class="note-thumbnail" src="${note.imageUrl}" alt="${note.title || 'Note'}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%231A3A5A%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%22115%22%20font-size%3D%2250%22%20fill%3D%22%233A86FF%22%3E📷%3C%2Ftext%3E%3C%2Fsvg%3E'">
          <div class="note-title">${note.title || 'Untitled'}</div>
          <div class="note-meta">
            <span class="note-type" style="background: ${typeColor}15; color: ${typeColor};">${typeIcon} ${fileType}</span>
            <button class="delete-note" onclick="deleteNote('${note.id}')" title="Delete note">✕</button>
          </div>
        </div>
      `;
    });
    notesGrid.innerHTML = html;
    
    // Add click listeners to cards
    document.querySelectorAll('.note-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-note')) return;
        const id = card.dataset.id;
        openFullscreenViewer(id);
      });
    });
  }
}

// Get file type from URL
function getFileType(url) {
  if (!url) return 'link';
  const ext = url.split('.').pop().toLowerCase().split('?')[0];
  if (['pdf'].includes(ext)) return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext)) return 'image';
  return 'link';
}

// Delete note
window.deleteNote = function(id) {
  if (confirm('Delete this note?')) {
    notes = notes.filter(n => n.id !== id);
    saveNotes();
    
    // Close viewer if open
    if (currentViewerNote && currentViewerNote.id === id) {
      closeFullscreenViewer();
    }
  }
};

// Open Full-Screen Viewer
function openFullscreenViewer(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  
  currentViewerNote = note;
  viewerTitle.textContent = note.title || 'Untitled';
  
  const type = getFileType(note.link);
  fileTypeBadge.textContent = type.toUpperCase();
  
  // Store in session for refresh recovery
  sessionStorage.setItem('lastViewerNote', id);
  
  // Load content
  loadViewerContent(note, type);
  
  // Reset zoom and mode
  zoomLevel = 1;
  updateZoomDisplay();
  setViewerMode('fit-screen');
  
  // Show viewer
  fullscreenViewer.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Restore scroll position if available
  setTimeout(() => {
    if (scrollPosition) {
      viewerWrapper.scrollTop = scrollPosition;
    }
  }, 50);
}

// Load content into viewer
function loadViewerContent(note, type) {
  let content = '';
  
  if (type === 'image') {
    content = `<img src="${note.link}" alt="${note.title}" class="viewer-image" style="transform: scale(${zoomLevel}); transition: transform 0.2s;">`;
  } else if (type === 'pdf') {
    content = `<iframe src="${note.link}" frameborder="0" class="viewer-pdf"></iframe>`;
  } else {
    // Try to embed
    content = `<iframe src="${note.link}" frameborder="0" class="viewer-link" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>`;
  }
  
  viewerContent.innerHTML = content;
  
  // Add zoom listeners for images
  if (type === 'image') {
    const img = viewerContent.querySelector('img');
    img.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          zoomIn();
        } else {
          zoomOut();
        }
      }
    });
    
    // Double-click to reset zoom
    img.addEventListener('dblclick', () => {
      zoomLevel = 1;
      applyZoom();
    });
  }
}

// Set viewer mode
function setViewerMode(mode) {
  viewerMode = mode;
  
  // Remove all mode classes
  viewerContent.classList.remove('fit-screen', 'full-width', 'focus-mode');
  fullscreenViewer.classList.remove('focus-mode');
  
  // Update buttons
  [fitToScreenBtn, fullWidthBtn, focusModeBtn].forEach(btn => btn.classList.remove('active'));
  
  switch(mode) {
    case 'fit-screen':
      viewerContent.classList.add('fit-screen');
      fitToScreenBtn.classList.add('active');
      break;
    case 'full-width':
      viewerContent.classList.add('full-width');
      fullWidthBtn.classList.add('active');
      break;
    case 'focus':
      viewerContent.classList.add('focus-mode');
      fullscreenViewer.classList.add('focus-mode');
      focusModeBtn.classList.add('active');
      break;
  }
}

// Zoom functions
function zoomIn() {
  zoomLevel = Math.min(zoomLevel + 0.25, 3);
  applyZoom();
}

function zoomOut() {
  zoomLevel = Math.max(zoomLevel - 0.25, 0.5);
  applyZoom();
}

function applyZoom() {
  const img = viewerContent.querySelector('img');
  if (img) {
    img.style.transform = `scale(${zoomLevel})`;
    updateZoomDisplay();
  }
}

function updateZoomDisplay() {
  zoomLevelSpan.textContent = Math.round(zoomLevel * 100) + '%';
}

// Close viewer
function closeFullscreenViewer() {
  fullscreenViewer.classList.remove('active');
  document.body.style.overflow = '';
  currentViewerNote = null;
  sessionStorage.removeItem('lastViewerNote');
  
  // Save scroll position
  scrollPosition = viewerWrapper.scrollTop;
  
  // Clear content
  setTimeout(() => {
    viewerContent.innerHTML = '';
  }, 300);
}

// Track scroll position
viewerWrapper.addEventListener('scroll', () => {
  const scroll = viewerWrapper.scrollTop;
  const maxScroll = viewerWrapper.scrollHeight - viewerWrapper.clientHeight;
  
  if (scroll < 10) {
    scrollPositionSpan.textContent = 'Top';
  } else if (scroll > maxScroll - 10) {
    scrollPositionSpan.textContent = 'Bottom';
  } else {
    const percent = Math.round((scroll / maxScroll) * 100);
    scrollPositionSpan.textContent = `${percent}%`;
  }
});

// Viewer event listeners
viewerBack.addEventListener('click', closeFullscreenViewer);
viewerClose.addEventListener('click', closeFullscreenViewer);

fitToScreenBtn.addEventListener('click', () => setViewerMode('fit-screen'));
fullWidthBtn.addEventListener('click', () => setViewerMode('full-width'));
focusModeBtn.addEventListener('click', () => setViewerMode('focus'));

zoomInBtn.addEventListener('click', zoomIn);
zoomOutBtn.addEventListener('click', zoomOut);

originalSizeBtn.addEventListener('click', () => {
  zoomLevel = 1;
  applyZoom();
  setViewerMode('fit-screen');
});

toggleControlsBtn.addEventListener('click', () => {
  const isHidden = viewerFooter.style.display === 'none';
  viewerFooter.style.display = isHidden ? 'flex' : 'none';
  toggleControlsBtn.textContent = isHidden ? 'Hide controls' : 'Show controls';
});

// Close on escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (fullscreenViewer.classList.contains('active')) {
      closeFullscreenViewer();
    }
    if (noteModal.classList.contains('active')) {
      closeModalFunc();
    }
  }
});

// Open add/edit modal
function openModal(note = null) {
  if (note) {
    modalTitle.textContent = 'Edit note';
    imageUrlInput.value = note.imageUrl;
    noteTitleInput.value = note.title || '';
    noteLinkInput.value = note.link;
    noteIdInput.value = note.id;
    editingId = note.id;
  } else {
    modalTitle.textContent = 'Add new note';
    noteForm.reset();
    noteIdInput.value = '';
    editingId = null;
  }
  noteModal.classList.add('active');
}

// Close modal
function closeModalFunc() {
  noteModal.classList.remove('active');
  noteForm.reset();
  editingId = null;
}

// Save note from form
noteForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const imageUrl = imageUrlInput.value.trim();
  const title = noteTitleInput.value.trim();
  const link = noteLinkInput.value.trim();
  
  if (!imageUrl || !link) return;
  
  const now = Date.now();
  const id = editingId || now.toString();
  
  const noteData = {
    id,
    imageUrl,
    title: title || 'Untitled',
    link,
    type: getFileType(link),
    updated: now
  };
  
  if (editingId) {
    const index = notes.findIndex(n => n.id === editingId);
    if (index !== -1) notes[index] = noteData;
  } else {
    notes.push(noteData);
  }
  
  saveNotes();
  closeModalFunc();
});

// Event listeners
addNoteBtn.addEventListener('click', () => openModal());
closeModal.addEventListener('click', closeModalFunc);
cancelModal.addEventListener('click', closeModalFunc);

// Close modal on outside click
noteModal.addEventListener('click', (e) => {
  if (e.target === noteModal) closeModalFunc();
});

// Initialize
loadNotes();

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.log('SW registration failed:', err);
    });
  });
}

// Export/Import functions (optional bonus)
window.exportNotes = function() {
  const dataStr = JSON.stringify(notes, null, 2);
  const blob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'folio-notes-backup.json';
  a.click();
  URL.revokeObjectURL(url);
};

window.importNotes = function(jsonStr) {
  try {
    const imported = JSON.parse(jsonStr);
    if (Array.isArray(imported)) {
      notes = imported;
      saveNotes();
      alert('Notes imported successfully!');
    }
  } catch (e) {
    alert('Invalid backup file');
  }
};