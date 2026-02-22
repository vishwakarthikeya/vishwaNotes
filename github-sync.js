// ========== github-sync.js ==========
// CONFIGURATION – USER MUST FILL THESE (see step‑by‑step guide)
const GITHUB_CONFIG = {
  owner: "vishwakarthikeya",    // <-- replace with your GitHub username
  repo: 'notes-library-data',       // <-- replace with your repo name
  branch: 'main',                   // usually main or master
  token: "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",       // <-- replace with your personal access token (classic)
  filePath: 'books.json'            // file that stores all data
};

// Global state (books array)
let booksData = [];
let currentBookId = null;
let currentChapter = null;

const GitHubSync = {
  async fetchBooks() {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}?ref=${GITHUB_CONFIG.branch}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `token ${GITHUB_CONFIG.token}` }
    });
    if (!response.ok) throw new Error('GitHub fetch failed');
    const data = await response.json();
    const content = atob(data.content); // base64 decode
    return { books: JSON.parse(content), sha: data.sha };
  },
  async saveBooks(books, existingSha) {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}`;
    const content = btoa(JSON.stringify(books, null, 2));
    const body = {
      message: 'Update books from Calm Notes',
      content,
      branch: GITHUB_CONFIG.branch,
      sha: existingSha
    };
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_CONFIG.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    return response.ok;
  }
};
window.GitHubSync = GitHubSync;
window.booksData = booksData; // shared reference (app.js will hydrate)