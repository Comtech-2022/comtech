// ---------- Mobile nav toggle ----------
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navLinks.classList.remove('open');
    }));
  }

  // Mark active nav link based on current page
  const current = (window.location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('nav.links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Navbar shadow once the page scrolls
  const header = document.querySelector('header');
  if (header) {
    const toggleScrolled = () => header.classList.toggle('scrolled', window.scrollY > 12);
    toggleScrolled();
    window.addEventListener('scroll', toggleScrolled, { passive: true });
  }

  // Notes filter (only present on notes.html)
  const chips = document.querySelectorAll('.filter-chip');
  const rows = document.querySelectorAll('.note-row');
  if (chips.length) {
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const filter = chip.dataset.filter;
        rows.forEach(row => {
          row.style.display = (filter === 'all' || row.dataset.course === filter) ? 'flex' : 'none';
        });
      });
    });

    // Apply a filter passed via ?course=xxx (e.g. links from courses.html)
    const params = new URLSearchParams(window.location.search);
    const wanted = params.get('course');
    if (wanted) {
      const chip = document.querySelector(`.filter-chip[data-filter="${wanted}"]`);
      if (chip) chip.click();
    }
  }

  // Contact form
  const enquireForm = document.querySelector('form.enquire');
  if (enquireForm) {
    enquireForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Thanks! Your enquiry has been noted. We will call you back soon.', 'fa-solid fa-circle-check');
      enquireForm.reset();
    });
  }

  initScrollReveal();
  initStatCounters();
  initFaqAccordion();
  initHeroCarousel();
  initCourseCategories();
});

// ---------- Home hero carousel ----------
function initHeroCarousel() {
  const root = document.getElementById('heroCarousel');
  if (!root) return;

  const slides = root.querySelectorAll('.hero-slide');
  const dots = root.querySelectorAll('.hero-dot');
  const prevBtn = root.querySelector('.hero-arrow.prev');
  const nextBtn = root.querySelector('.hero-arrow.next');
  if (!slides.length) return;

  let index = 0;
  let timer = null;
  const AUTOPLAY_MS = 6000;

  function goTo(newIndex) {
    slides[index].classList.remove('active');
    if (dots[index]) dots[index].classList.remove('active');
    index = (newIndex + slides.length) % slides.length;
    slides[index].classList.add('active');
    if (dots[index]) dots[index].classList.add('active');
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  function startAuto() {
    stopAuto();
    timer = setInterval(next, AUTOPLAY_MS);
  }
  function stopAuto() {
    if (timer) clearInterval(timer);
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); startAuto(); }));
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); startAuto(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); startAuto(); });

  root.addEventListener('mouseenter', stopAuto);
  root.addEventListener('mouseleave', startAuto);

  startAuto();
}

// ---------- Courses page: category accordion + search ----------
function initCourseCategories() {
  const grid = document.getElementById('coursesGrid');
  if (!grid) return;

  const cards = grid.querySelectorAll('.category-card');
  const emptyState = document.getElementById('coursesEmpty');

  cards.forEach(card => {
    const head = card.querySelector('.cat-head');
    if (!head) return;
    head.addEventListener('click', () => {
      const isOpen = card.classList.toggle('open');
      head.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });

  // Open a category automatically if the page was reached via a #cat-xxx link
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target && target.classList.contains('category-card')) {
      target.classList.add('open');
      const head = target.querySelector('.cat-head');
      if (head) head.setAttribute('aria-expanded', 'true');
      setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }
  }

  const search = document.getElementById('courseSearch');
  if (!search) return;

  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    let anyVisible = false;

    cards.forEach(card => {
      const title = card.querySelector('h3').textContent.toLowerCase();
      const items = card.querySelectorAll('.cat-panel li');
      let categoryMatches = query === '' || title.includes(query);

      items.forEach(li => {
        const text = li.textContent.toLowerCase();
        const itemMatches = query === '' || text.includes(query);
        li.style.display = itemMatches ? '' : 'none';
        if (itemMatches) categoryMatches = true;
      });

      card.style.display = categoryMatches ? '' : 'none';
      if (categoryMatches) anyVisible = true;

      const head = card.querySelector('.cat-head');
      if (query !== '' && categoryMatches) {
        card.classList.add('open');
        if (head) head.setAttribute('aria-expanded', 'true');
      } else if (query === '') {
        card.classList.remove('open');
        if (head) head.setAttribute('aria-expanded', 'false');
      }
    });

    if (emptyState) emptyState.style.display = anyVisible ? 'none' : 'block';
  });
}

// ---------- Scroll-triggered reveal animations ----------
function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));
}

// ---------- Animated stat counters (stats banner) ----------
function initStatCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };

  if (!('IntersectionObserver' in window)) {
    counters.forEach(animate);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(el => observer.observe(el));
}



// ---------- Download a sample note (demo content until real PDFs are uploaded) ----------
function downloadNote(title) {
  const content =
`COMTECH COMPUTER ACADEMY
-------------------------
${title}

These are sample notes generated for demonstration.
Replace this file with the actual class PDF notes for students to download.

Thank you for learning with Comtech Computer Academy.`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = title.replace(/\s+/g, '_') + '.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Downloaded: ' + title, 'fa-solid fa-download');
}

// ---------- Toast ----------
function showToast(msg, iconClass) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  const icon = iconClass || 'fa-solid fa-circle-check';
  toast.innerHTML = `<i class="${icon}"></i><span>${msg}</span>`;
  toast.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

//Courses
document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", function () {

        const card = this.closest(".category-card");

        card.classList.toggle("open");

        this.textContent =
            card.classList.contains("open")
            ? "Hide Courses"
            : "View Courses";

    });
});