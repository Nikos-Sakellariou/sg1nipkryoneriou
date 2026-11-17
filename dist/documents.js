const menuButton = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('#site-nav');
const list = document.querySelector('#documents-list');
const count = document.querySelector('#documents-count');

const formatGreekDate = (value) => {
  if (!value) return '';
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('el-GR', {
    day: '2-digit', month: 'long', year: 'numeric'
  }).format(parsed);
};

const normalizeAssetPath = (path) => String(path || '').replace(/^\//, '');

const getFileType = (path) => {
  const extension = String(path || '').split('.').pop().toUpperCase();
  return extension && extension.length <= 5 ? extension : 'ΑΡΧΕΙΟ';
};

const createDocumentRow = (item) => {
  const article = document.createElement('article');
  article.className = 'document-row';

  const icon = document.createElement('span');
  icon.className = 'document-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = '<svg viewBox="0 0 36 42"><path d="M4 2h18l10 10v28H4z"/><path d="M22 2v10h10M10 21h16M10 28h16M10 35h10"/></svg>';

  const content = document.createElement('div');
  content.className = 'document-copy';

  const meta = document.createElement('div');
  meta.className = 'document-meta';

  const type = document.createElement('span');
  type.className = 'document-type';
  type.textContent = getFileType(item.file);
  meta.append(type);

  if (item.category) {
    const category = document.createElement('span');
    category.textContent = item.category;
    meta.append(category);
  }

  if (item.date) {
    const time = document.createElement('time');
    time.dateTime = item.date;
    time.textContent = formatGreekDate(item.date);
    meta.append(time);
  }

  const title = document.createElement('h2');
  title.textContent = item.title || 'Έγγραφο';
  content.append(meta, title);

  if (item.description) {
    const description = document.createElement('p');
    description.textContent = item.description;
    content.append(description);
  }

  const link = document.createElement('a');
  link.className = 'document-action';
  link.href = normalizeAssetPath(item.file);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `Άνοιγμα εγγράφου: ${item.title || 'Έγγραφο'}`);
  const linkText = document.createElement('span');
  linkText.textContent = 'Άνοιγμα εγγράφου';
  const linkIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  linkIcon.setAttribute('viewBox', '0 0 24 24');
  linkIcon.setAttribute('aria-hidden', 'true');
  linkIcon.innerHTML = '<path d="M7 17 17 7M9 7h8v8"/>';
  link.append(linkText, linkIcon);

  article.append(icon, content, link);
  return article;
};

const showEmptyState = (
  titleText = 'Η βιβλιοθήκη ετοιμάζεται',
  message = 'Δεν υπάρχουν ακόμη διαθέσιμα έγγραφα.',
  countText = '0 διαθέσιμα έγγραφα'
) => {
  const empty = document.createElement('div');
  empty.className = 'documents-empty';
  const title = document.createElement('h2');
  title.textContent = titleText;
  const text = document.createElement('p');
  text.textContent = message;
  empty.append(title, text);
  list.replaceChildren(empty);
  count.textContent = countText;
};

const loadDocuments = () => {
  list.setAttribute('aria-busy', 'true');
  count.textContent = 'Φόρτωση εγγράφων…';

  fetch('content/documents.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error('Unable to load documents');
      return response.json();
    })
    .then((items) => {
      const published = (Array.isArray(items) ? items : [])
        .filter((item) => item && item.published !== false && item.file)
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

      if (!published.length) {
        showEmptyState();
        return;
      }

      list.replaceChildren(...published.map(createDocumentRow));
      count.textContent = published.length === 1 ? '1 διαθέσιμο έγγραφο' : `${published.length} διαθέσιμα έγγραφα`;
    })
    .catch(() => {
      showEmptyState(
        'Δεν μπορέσαμε να φορτώσουμε τα έγγραφα',
        'Ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.',
        'Προσωρινό πρόβλημα φόρτωσης'
      );
      const retry = document.createElement('button');
      retry.className = 'documents-retry';
      retry.type = 'button';
      retry.textContent = 'Δοκιμή ξανά';
      retry.addEventListener('click', loadDocuments, { once: true });
      list.querySelector('.documents-empty')?.append(retry);
    })
    .finally(() => list.setAttribute('aria-busy', 'false'));
};

loadDocuments();

menuButton?.addEventListener('click', () => {
  const open = siteNav.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(open));
});

siteNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  siteNav.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));
