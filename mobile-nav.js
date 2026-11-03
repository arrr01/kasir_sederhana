// Mobile navigation toggle for sidebar (aside) on small screens
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.querySelector('aside');
  if (!toggleBtn || !sidebar) return;

  toggleBtn.addEventListener('click', () => {
    // On mobile, sidebar is hidden (class 'hidden') and becomes flex when shown
    sidebar.classList.toggle('hidden');
    sidebar.classList.toggle('flex');
  });
});
