const filterInput = document.getElementById('filter-input');
const projectCount = document.getElementById('project-count');
const cards = Array.from(document.querySelectorAll('.card'));

function updateProjectCount() {
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

if (filterInput && projectCount && cards.length) {
  const handleFilter = () => {
    const query = filterInput.value.trim().toLowerCase();

    cards.forEach((card) => {
      const cardText = card.textContent.toLowerCase();
      const matches = !query || cardText.includes(query);
      card.classList.toggle('hidden', !matches);
    });

    updateProjectCount();
  };

  filterInput.addEventListener('input', handleFilter);
  updateProjectCount();
}

const upvoteButtons = document.querySelectorAll('.upvote-btn');

upvoteButtons.forEach((button) => {
  button.addEventListener('click', async () => {
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
});
