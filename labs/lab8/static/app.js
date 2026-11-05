const filterInput = document.getElementById('filter-input');
const projectCount = document.getElementById('project-count');
const createInput = document.getElementById('new-title');
const addProjectButton = document.getElementById('add-project-btn');

function getCards() {
  return Array.from(document.querySelectorAll('.card'));
}

function updateProjectCount() {
  const cards = getCards();
  const visibleCards = cards.filter((card) => !card.classList.contains('hidden'));
  const totalProjects = cards.length;
  const visibleProjects = visibleCards.length;

  if (projectCount) {
    projectCount.textContent = `Showing ${visibleProjects} of ${totalProjects} projects`;
  }

  const visibleTitles = visibleCards.map((card) => {
    const titleElement = card.querySelector('.card-title');
    return titleElement ? titleElement.textContent.trim() : card.textContent.trim();
  });

  console.log(visibleTitles);
}

function updateTrendingBadge(card, likes) {
  const badge = card.querySelector('.trending-badge');

  if (badge) {
    badge.classList.toggle('hidden', likes <= 10);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function handleFilter() {
  const cards = getCards();
  const query = filterInput ? filterInput.value.trim().toLowerCase() : '';

  cards.forEach((card) => {
    const cardText = card.textContent.toLowerCase();
    const matches = !query || cardText.includes(query);
    card.classList.toggle('hidden', !matches);
  });

  updateProjectCount();
}

if (filterInput) {
  filterInput.addEventListener('input', handleFilter);
}

updateProjectCount();

if (addProjectButton) {
  addProjectButton.addEventListener('click', async () => {
    const title = createInput ? createInput.value : '';

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      return;
    }

    const project = await response.json();
    const cardList = document.querySelector('.card-list');

    if (!cardList) {
      return;
    }

    const article = document.createElement('article');
    article.className = 'card';
    article.dataset.projectId = String(project.id);
    article.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">${escapeHtml(project.title)}</h3>
        <span class="trending-badge hidden">Trending</span>
      </div>
      <p>${escapeHtml(project.description)}</p>
      <div class="card-actions">
        <button class="upvote-btn" type="button">Upvote</button>
        <span class="like-count">${project.likes}</span>
      </div>
    `;

    cardList.appendChild(article);

    if (createInput) {
      createInput.value = '';
    }

    handleFilter();
  });
}

document.addEventListener('click', async (event) => {
  const button = event.target.closest('.upvote-btn');

  if (!button) {
    return;
  }

  const card = button.closest('.card');

  if (!card) {
    return;
  }

  const projectId = card.dataset.projectId;
  const likeCount = card.querySelector('.like-count');

  if (!likeCount || !projectId) {
    return;
  }

  const response = await fetch(`/api/projects/${projectId}/upvote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return;
  }

  const data = await response.json();
  likeCount.textContent = data.likes;
  updateTrendingBadge(card, Number(data.likes));
});
