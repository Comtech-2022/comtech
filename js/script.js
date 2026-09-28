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
  const notesToolbar = document.getElementById('notesToolbar');
  if (notesToolbar) {
    const chips = notesToolbar.querySelectorAll('.filter-chip');
    const rows = document.querySelectorAll('.note-row');
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
      const chip = notesToolbar.querySelector(`.filter-chip[data-filter="${wanted}"]`);
      if (chip) chip.click();
    }
  }

  // Pre-fill course enquiry field if ?course=xxx is passed in URL
  const courseInput = document.getElementById('fcourse');
  if (courseInput) {
    const params = new URLSearchParams(window.location.search);
    const prefillCourse = params.get('course') || params.get('interest');
    if (prefillCourse) {
      courseInput.value = decodeURIComponent(prefillCourse);
    }
  }

  // Contact form submission to comtechponda@gmail.com
  const enquireForm = document.querySelector('form.enquire');
  if (enquireForm) {
    enquireForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phoneInput = document.getElementById('fphone');
      if (phoneInput && phoneInput.value && !/^\d{10}$/.test(phoneInput.value.replace(/\s+/g, ''))) {
        showToast('Please enter a valid 10-digit phone number.', 'fa-solid fa-circle-exclamation');
        phoneInput.focus();
        return;
      }

      const submitBtn = document.getElementById('submitBtn') || enquireForm.querySelector('button[type="submit"]');
      const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Send enquiry <i class="fa-solid fa-paper-plane"></i>';

      // Check if browsing directly via file:// protocol
      if (window.location.protocol === 'file:') {
        showToast('Form submission requires a web server (http://localhost or live hosted site).', 'fa-solid fa-circle-exclamation');
        alert('Local File Notice:\n\nYou are viewing this page as a local file (file:///). Online form services (FormSubmit) block direct local file paths for browser security.\n\nTo test live email sending on your computer:\n1. Run: python -m http.server 8000\n2. Open: http://localhost:8000/contact.html\n\n(Once hosted on your live website domain or Google hosting, it will work automatically!)');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending enquiry... <i class="fa-solid fa-circle-notch fa-spin"></i>';
      }

      const formData = new FormData(enquireForm);
      const data = {};
      formData.forEach((value, key) => { data[key] = value; });

      // Get target action email dynamically from form action
      const formAction = enquireForm.getAttribute('action') || 'https://formsubmit.co/ajax/comtechponda@gmail.com';
      const ajaxEndpoint = formAction.includes('/ajax/') ? formAction : formAction.replace('formsubmit.co/', 'formsubmit.co/ajax/');

      try {
        const response = await fetch(ajaxEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && (result.success === 'true' || result.success === true)) {
          showToast('Enquiry sent! We received your request and will contact you soon.', 'fa-solid fa-circle-check');
          enquireForm.reset();
        } else {
          enquireForm.submit();
        }
      } catch (err) {
        console.warn('AJAX submit failed, submitting standard form fallback:', err);
        enquireForm.submit();
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
        }
      }
    });
  }

  initScrollReveal();
  initStatCounters();
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

// ---------- Courses page: category accordion + search + filter chips ----------
function initCourseCategories() {
  const grid = document.getElementById('coursesGrid');
  if (!grid) return;

  const cards = grid.querySelectorAll('.category-card');
  const emptyState = document.getElementById('coursesEmpty');
  const filterChips = document.querySelectorAll('.course-filter-chips .filter-chip');
  const search = document.getElementById('courseSearch');

  let activeCategory = 'all';

  // Toggle card accordion
  cards.forEach(card => {
    const head = card.querySelector('.cat-head');
    if (!head) return;
    head.addEventListener('click', () => {
      const isOpen = card.classList.toggle('open');
      head.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });

  // Open a category automatically if reached via #cat-xxx link
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target && target.classList.contains('category-card')) {
      target.classList.add('open');
      const head = target.querySelector('.cat-head');
      if (head) head.setAttribute('aria-expanded', 'true');
      setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }
  }

  function filterCourses() {
    const query = search ? search.value.trim().toLowerCase() : '';
    let anyVisible = false;

    cards.forEach(card => {
      const cardCategory = card.dataset.category || '';
      const matchesCategory = activeCategory === 'all' || cardCategory.includes(activeCategory);

      if (!matchesCategory && query === '') {
        card.style.display = 'none';
        return;
      }

      const title = card.querySelector('h3').textContent.toLowerCase();
      const items = card.querySelectorAll('.cat-panel li');
      let itemMatchCount = 0;

      items.forEach(li => {
        const text = li.textContent.toLowerCase();
        const matchesQuery = query === '' || text.includes(query);
        li.style.display = matchesQuery ? '' : 'none';
        if (matchesQuery) itemMatchCount++;
      });

      const categoryTitleMatches = query === '' || title.includes(query);
      const hasQueryMatch = query === '' ? matchesCategory : (categoryTitleMatches || itemMatchCount > 0);

      const isVisible = query !== '' ? hasQueryMatch : matchesCategory;
      card.style.display = isVisible ? '' : 'none';
      if (isVisible) anyVisible = true;

      const head = card.querySelector('.cat-head');
      if (query !== '' && isVisible) {
        card.classList.add('open');
        if (head) head.setAttribute('aria-expanded', 'true');
      }
    });

    if (emptyState) emptyState.style.display = anyVisible ? 'none' : 'block';
  }

  // Category filter chips
  if (filterChips.length) {
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeCategory = chip.dataset.filter || 'all';
        if (search) search.value = '';
        filterCourses();
      });
    });
  }

  // Search input
  if (search) {
    search.addEventListener('input', () => {
      if (search.value.trim() !== '') {
        filterChips.forEach(c => c.classList.remove('active'));
        const allChip = document.querySelector('.course-filter-chips .filter-chip[data-filter="all"]');
        if (allChip) allChip.classList.add('active');
        activeCategory = 'all';
      }
      filterCourses();
    });
  }
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
  }, { threshold: 0.01, rootMargin: '0px 0px 40px 0px' });

  targets.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('in-view');
    } else {
      observer.observe(el);
    }
  });
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



// ---------- Open Google Drive notes folder ----------
function downloadNote(title) {
  const driveUrl = 'https://drive.google.com/drive/folders/1W15raF4e-r8LFuF8MI6aiowHl0REnuEO?usp=sharing';
  window.open(driveUrl, '_blank', 'noopener,noreferrer');
  showToast('Opening Google Drive Notes Library...', 'fa-brands fa-google-drive');
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
