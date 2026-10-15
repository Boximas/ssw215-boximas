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
    const title = card.querySelector('.card-title');
    return title ? title.textContent.trim() : card.textContent.trim();
  });

  console.log(visibleTitles);
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
