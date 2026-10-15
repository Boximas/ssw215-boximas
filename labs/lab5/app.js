const filterInput = document.getElementById('filter-input');
const projectCount = document.getElementById('project-count');
const cards = Array.from(document.querySelectorAll('.card'));

function updateProjectCount() {
  const visibleCards = cards.filter((card) => !card.classList.contains('is-hidden')); // hand-edited by CA
  const totalProjects = cards.length;
  const visibleProjects = visibleCards.length;

  if (projectCount) {
    projectCount.textContent = `Showing ${visibleProjects} of ${totalProjects} projects`;
  }
}

if (filterInput && projectCount && cards.length) {
  const handleFilter = () => {
    const query = filterInput.value.trim().toLowerCase(); // hand-edited by CA
    cards.forEach((card) => {
      const cardText = card.textContent.toLowerCase();
      const matches = cardText.includes(query);
      card.classList.toggle('is-hidden', !matches); // hand-edited by CA
    });

    updateProjectCount();
  };

  filterInput.addEventListener('input', handleFilter);
  updateProjectCount();
}
