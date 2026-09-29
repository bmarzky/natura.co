const supabaseUrl = CONFIG.SUPABASE_URL;
const supabaseKey = CONFIG.SUPABASE_ANON_KEY;
const supabaseClient = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;

document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.page-section');
  const navLinks = document.querySelectorAll('.nav-links a');

  // Smooth scroll for all [data-scroll] links (no hash in URL)
  document.querySelectorAll('[data-scroll]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-scroll');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        const header = document.querySelector('.site-header');
        const headerOffset = header ? header.offsetHeight : 0;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Active nav highlight on scroll
  window.addEventListener('scroll', () => {
    let current = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      // 200px threshold to trigger the active state slightly before reaching the top
      if (window.pageYOffset >= (sectionTop - 200)) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-scroll') === current) {
        link.classList.add('active');
      }
    });
  });

  // Store Status Logic (Open 09:00 - 21:00)
  const storeStatus = document.getElementById('storeStatus');
  if (storeStatus) {
    const text = storeStatus.querySelector('.status-text');

    function updateStoreStatus() {
      const now = new Date();
      const hour = now.getHours();
      const isOpen = hour >= 9 && hour < 21;

      if (isOpen) {
        storeStatus.classList.add('is-open');
        storeStatus.classList.remove('is-closed');
        text.textContent = 'Buka';
      } else {
        storeStatus.classList.add('is-closed');
        storeStatus.classList.remove('is-open');
        text.textContent = 'Tutup';
      }
    }

    updateStoreStatus();
    setInterval(updateStoreStatus, 60000); // Perbarui setiap menit
  }

  // --- DYNAMIC TIME-OF-DAY SYSTEM ---
  const body = document.body;
  if (body) {
    const timeLabel = document.querySelector('.time-label');
    const timeClock = document.querySelector('.time-clock');
    const timeIcon = document.querySelector('.time-icon');

    const TIME_CONFIG = {
      morning: { class: 'time-morning', label: 'Semoga pagi ini terasa ringan', icon: '☼', particleColor: '124, 146, 120', particleCount: 25 },
      day: { class: 'time-day', label: 'Tak ada salahnya berhenti sejenak', icon: '☀', particleColor: '24, 60, 44', particleCount: 15 },
      goldenHour: { class: 'time-golden-hour', label: 'Senja selalu punya cara untuk menenangkan', icon: '✧', particleColor: '212, 175, 55', particleCount: 30 },
      night: { class: 'time-night', label: 'Istirahatlah, hari ini sudah cukup panjang', icon: '☾', particleColor: '243, 235, 221', particleCount: 40 }
    };

    let currentState = null;

    function updateTimeOfDay() {
      const now = new Date();
      const hour = now.getHours();
      const min = now.getMinutes();

      if (timeClock) {
        timeClock.textContent = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      }

      let stateKey = 'night';
      if (hour >= 5 && hour < 11) stateKey = 'morning';
      else if (hour >= 11 && hour < 16) stateKey = 'day';
      else if (hour === 16 || hour === 17 || (hour === 18 && min < 30)) stateKey = 'goldenHour';

      if (currentState !== stateKey) {
        Object.values(TIME_CONFIG).forEach(c => body.classList.remove(c.class));
        body.classList.add(TIME_CONFIG[stateKey].class);

        if (timeLabel) timeLabel.textContent = TIME_CONFIG[stateKey].label;
        if (timeIcon) timeIcon.innerHTML = TIME_CONFIG[stateKey].icon;

        currentState = stateKey;
        setParticleConfig(TIME_CONFIG[stateKey]);
      }
    }

    // Canvas Particles
    const canvas = document.getElementById('ambient-canvas');
    let ctx, particles = [], particleConfig = { color: '255,255,255', count: 0 };
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (canvas && !prefersReducedMotion) {
      ctx = canvas.getContext('2d');

      function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      window.addEventListener('resize', resize);
      resize();

      function renderParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
          p.y -= p.speedY; // float up slowly
          p.x += Math.sin(p.y * 0.01) * p.speedX; // gentle sway
          p.opacity += p.opacitySpeed;

          if (p.opacity > 0.6) p.opacitySpeed *= -1;
          if (p.opacity < 0.1) p.opacitySpeed *= -1;

          if (p.y < -10) p.y = canvas.height + 10;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${particleConfig.color}, ${Math.max(0, p.opacity)})`;
          ctx.fill();
        });
        requestAnimationFrame(renderParticles);
      }
      renderParticles();
    }

    function setParticleConfig(config) {
      if (prefersReducedMotion || !canvas) return;
      particleConfig.color = config.particleColor;
      const targetCount = window.innerWidth < 768 ? Math.floor(config.particleCount / 2) : config.particleCount;

      if (particles.length < targetCount) {
        for (let i = particles.length; i < targetCount; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speedY: Math.random() * 0.2 + 0.1,
            speedX: Math.random() * 0.5,
            opacity: Math.random() * 0.5,
            opacitySpeed: (Math.random() - 0.5) * 0.01
          });
        }
      } else {
        particles.splice(targetCount);
      }
    }

    updateTimeOfDay();
    setInterval(updateTimeOfDay, 10000); // Check every 10s
  }

  // --- SCROLL REVEAL ANIMATIONS ---
  const revealElements = document.querySelectorAll('.fade-in, .fade-in-up, .fade-in-left, .fade-in-right, .scale-up');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      } else {
        entry.target.classList.remove('in-view');
      }
    });
  }, {
    root: null,
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // --- PARALLAX EFFECT FOR ELEGANT DEPTH ---
  const heroText = document.querySelector('.home-text');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    // Hero Text Parallax (moves slightly downward on scroll)
    if (heroText && scrollY <= window.innerHeight) {
      heroText.style.transform = `translateY(${scrollY * 0.25}px)`;
      // Subtle fade out on scroll down
      heroText.style.opacity = 1 - (scrollY / 700);
    }
  });

  // --- SUPABASE REVIEWS LOGIC ---
  const reviewGrid = document.querySelector('.review-grid');
  window.loadedReviews = [];

  function updateReviewStats() {
    const data = window.loadedReviews;
    const ratingNumEl = document.querySelector('.rating-number');
    const starsEl = document.querySelector('.review-stats .stars');
    const countEl = document.querySelector('.review-count');

    if (!data || data.length === 0) {
      if (ratingNumEl) ratingNumEl.innerHTML = `0.0`;
      if (starsEl) starsEl.textContent = '☆☆☆☆☆';
      if (countEl) countEl.textContent = 'Dari 0 Momen Keluarga';
      return;
    }

    const totalRating = data.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = (totalRating / data.length).toFixed(1);

    if (ratingNumEl) ratingNumEl.innerHTML = `${avgRating}`;

    if (starsEl) {
      const roundedRating = Math.round(avgRating);
      let starsHtml = '';
      for (let i = 0; i < 5; i++) {
        starsHtml += i < roundedRating ? '★' : '☆';
      }
      starsEl.textContent = starsHtml;
    }

    if (countEl) countEl.textContent = `Dari ${data.length} Momen Keluarga`;
  }

  async function loadReviews() {
    if (!supabaseClient || !reviewGrid) return;

    try {
      const { data, error } = await supabaseClient
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        window.loadedReviews = data;
        updateReviewStats();

        if (data.length === 0) {
          reviewGrid.innerHTML = `
            <div class="empty-reviews fade-in-up in-view" style="flex: 0 0 100%; min-width: 100%; text-align: center; padding: 60px 20px; border: 1px dashed color-mix(in srgb, var(--time-text) 30%, transparent); border-radius: 12px; margin: 20px 0;">
              <h3 style="color: var(--time-text); margin-bottom: 8px; font-family: var(--font-serif); transition: color 4s ease;">Belum Ada Cerita</h3>
              <p style="color: color-mix(in srgb, var(--time-text) 70%, transparent); font-size: 0.95rem; transition: color 4s ease;">Jadilah yang pertama membagikan kenangan manis Anda bersama natura house</p>
            </div>
          `;
        } else {
          data.forEach((review, index) => {
            appendReviewToGrid(review, index);
          });

          // Initialize automatic slider
          setTimeout(initCarousel, 100);
        }
      }
    } catch (err) {
      console.error("Gagal memuat ulasan:", err);
    }
  }

  function getLikedReviews() {
    const liked = localStorage.getItem('natura_liked_reviews');
    return liked ? JSON.parse(liked) : [];
  }

  function toggleLikeStatusLocal(id) {
    let liked = getLikedReviews();
    if (liked.includes(id)) {
      liked = liked.filter(item => item !== id);
    } else {
      liked.push(id);
    }
    localStorage.setItem('natura_liked_reviews', JSON.stringify(liked));
  }

  function isReviewLiked(id) {
    return getLikedReviews().includes(id);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function appendReviewToGrid(review, index = 0, prepend = false) {
    if (!reviewGrid) return;

    // Remove empty state if it exists
    const emptyState = reviewGrid.querySelector('.empty-reviews');
    if (emptyState) emptyState.remove();

    const newReviewWrapper = document.createElement('div');
    newReviewWrapper.className = `fade-in-up delay-${(index % 3) + 1} in-view`;

    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
      starsHtml += i < review.rating ? '★' : '☆';
    }

    const isAlreadyLiked = isReviewLiked(review.id);
    const likeIcon = isAlreadyLiked ? '♥' : '♡';
    const likeClass = isAlreadyLiked ? 'card-like-btn liked' : 'card-like-btn';

    let dateStr = "Baru saja";
    if (review.created_at) {
      const dateObj = new Date(review.created_at);
      const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
      dateStr = dateObj.toLocaleDateString('id-ID', options).replace(/\./g, ':');
    }

    const safeText = escapeHTML(review.text);
    const safeName = escapeHTML(review.name);

    newReviewWrapper.innerHTML = `
      <article class="review-card">
        <div class="card-stars">${starsHtml}</div>
        <blockquote class="card-quote">"${safeText}"</blockquote>
        <div class="card-footer">
          <div class="card-author-info" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span class="card-author">&mdash; ${safeName}</span>
            <span class="card-date" style="font-size: 0.75rem; color: color-mix(in srgb, var(--time-text) 60%, transparent); padding-top: 2px; transition: color 4s ease;">• ${dateStr}</span>
          </div>
          <button class="${likeClass}" data-id="${review.id}" data-count="${review.likes || 0}">
            <span class="like-icon">${likeIcon}</span>
            <span class="like-count">${review.likes || 0}</span>
          </button>
        </div>
      </article>
    `;

    if (prepend) {
      reviewGrid.insertBefore(newReviewWrapper, reviewGrid.firstChild);
    } else {
      reviewGrid.appendChild(newReviewWrapper);
    }

    // Attach event to new like button
    const newLikeBtn = newReviewWrapper.querySelector('.card-like-btn');
    newLikeBtn.addEventListener('click', async () => {
      const isLiked = newLikeBtn.classList.contains('liked');
      const countSpan = newLikeBtn.querySelector('.like-count');
      const iconSpan = newLikeBtn.querySelector('.like-icon');
      let count = parseInt(newLikeBtn.getAttribute('data-count'));

      let newCount = count;
      if (isLiked) {
        newLikeBtn.classList.remove('liked');
        newCount = count - 1;
        countSpan.textContent = newCount;
        iconSpan.textContent = '♡';
      } else {
        newLikeBtn.classList.add('liked');
        newCount = count + 1;
        countSpan.textContent = newCount;
        iconSpan.textContent = '♥';
      }
      newLikeBtn.setAttribute('data-count', newCount);
      toggleLikeStatusLocal(review.id);

      // Update in Supabase
      if (supabaseClient) {
        await supabaseClient.from('reviews').update({ likes: newCount }).eq('id', review.id);
      }
    });
  }


  // --- CAROUSEL LOGIC ---
  let slideInterval = null;
  let isTransitioning = false;

  function initCarousel() {
    if (slideInterval) clearInterval(slideInterval);
    const track = document.querySelector('.review-grid');
    if (!track) return;

    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';

    const totalReviews = track.children.length;
    if (totalReviews === 0) return;

    slideInterval = setInterval(() => {
      if (isTransitioning) return;

      const isMobile = window.innerWidth <= 768;
      const cardsPerView = isMobile ? 1 : 2;

      if (totalReviews <= cardsPerView) return; // No need to slide

      isTransitioning = true;
      const card = track.children[0];
      const cardWidth = card.offsetWidth;
      const gap = isMobile ? 20 : 40;
      const moveDistance = (cardWidth + gap) * cardsPerView;

      // Animate slide
      track.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
      track.style.transform = `translateX(-${moveDistance}px)`;

      // Wait for animation to finish, then shift DOM
      setTimeout(() => {
        for (let i = 0; i < cardsPerView; i++) {
          track.appendChild(track.children[0]);
        }
        track.style.transition = 'none';
        track.style.transform = 'translateX(0)';

        setTimeout(() => {
          isTransitioning = false;
        }, 50);
      }, 800);
    }, 5000);
  }

  window.addEventListener('resize', () => {
    if (window.loadedReviews && window.loadedReviews.length > 0) {
      initCarousel();
    }
  });

  // Load reviews on init
  loadReviews();


  // --- REVIEW MODAL LOGIC ---
  function showToast(message) {
    let toast = document.getElementById('toastNotification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastNotification';
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  const btnShareStory = document.getElementById('btnShareStory');
  const reviewModal = document.getElementById('reviewModal');
  const closeModal = document.getElementById('closeModal');
  const reviewForm = document.getElementById('reviewForm');
  const modalFormContainer = document.getElementById('modalFormContainer');
  const modalSuccess = document.getElementById('modalSuccess');
  const reviewText = document.getElementById('reviewText');
  const wordCounter = document.getElementById('wordCounter');
  const MAX_WORDS = 25;

  if (btnShareStory && reviewModal) {
    btnShareStory.addEventListener('click', () => {
      reviewModal.classList.add('active');
      modalFormContainer.style.display = 'block';
      modalSuccess.style.display = 'none';
      reviewForm.reset();

      // Reset Word Counter
      if (wordCounter) {
        wordCounter.textContent = `0/${MAX_WORDS}`;
        wordCounter.style.color = 'var(--modal-muted)';
      }
    });

    if (reviewText && wordCounter) {
      reviewText.addEventListener('input', () => {
        const text = reviewText.value.trim();
        const words = text ? text.split(/\s+/) : [];
        let wordCount = words.length;

        if (wordCount > MAX_WORDS) {
          // Truncate to MAX_WORDS
          const truncated = words.slice(0, MAX_WORDS).join(' ');
          // Append a space so user doesn't get stuck if they press space
          reviewText.value = truncated + ' ';
          wordCount = MAX_WORDS;
        }

        wordCounter.textContent = `${wordCount}/${MAX_WORDS}`;

        if (wordCount === MAX_WORDS) {
          wordCounter.style.color = '#d84b4b'; // red warning color
        } else {
          wordCounter.style.color = 'var(--modal-muted)';
        }
      });
    }

    closeModal.addEventListener('click', () => {
      reviewModal.classList.remove('active');
    });

    reviewModal.addEventListener('click', (e) => {
      if (e.target === reviewModal) {
        reviewModal.classList.remove('active');
      }
    });

    // Star Rating Logic
    const stars = document.querySelectorAll('#ratingInput span');
    const ratingInput = document.getElementById('reviewRating');

    stars.forEach(star => {
      // Hover preview
      star.addEventListener('mouseenter', () => {
        const val = parseInt(star.getAttribute('data-value'));
        stars.forEach(s => {
          if (parseInt(s.getAttribute('data-value')) <= val) {
            s.textContent = '★';
            s.style.color = 'var(--time-accent)';
          } else {
            s.textContent = '☆';
            s.style.color = '';
          }
        });
      });

      // Reset hover on leave
      star.addEventListener('mouseleave', () => {
        const currentVal = parseInt(ratingInput.value) || 0;
        stars.forEach(s => {
          if (parseInt(s.getAttribute('data-value')) <= currentVal) {
            s.textContent = '★';
            s.style.color = 'var(--time-accent)';
            s.classList.add('active');
          } else {
            s.textContent = '☆';
            s.style.color = '';
            s.classList.remove('active');
          }
        });
      });

      // Click to set
      star.addEventListener('click', () => {
        const val = parseInt(star.getAttribute('data-value'));
        ratingInput.value = val;
        stars.forEach(s => {
          if (parseInt(s.getAttribute('data-value')) <= val) {
            s.classList.add('active');
            s.textContent = '★';
            s.style.color = 'var(--time-accent)';
          } else {
            s.classList.remove('active');
            s.textContent = '☆';
            s.style.color = '';
          }
        });
      });
    });

    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Rate limiting: max 1 review per 5 minutes per device
      const lastReviewTime = localStorage.getItem('natura_last_review_time');
      if (lastReviewTime) {
        const timeSinceLast = Date.now() - parseInt(lastReviewTime);
        if (timeSinceLast < 5 * 60 * 1000) {
          showToast("Tunggu sebentar sebelum membagikan cerita lagi.");
          return;
        }
      }

      const rating = parseInt(ratingInput.value);
      if (!rating || rating === 0) {
        showToast("Silakan berikan rating bintang terlebih dahulu.");
        return;
      }

      const name = document.getElementById('reviewName').value.trim();
      const text = document.getElementById('reviewText').value.trim();

      if (!name || name.length > 25) {
        showToast("Nama maksimal 25 karakter.");
        return;
      }

      if (!text || text.length > 500) {
        showToast("Cerita tidak valid atau terlalu panjang.");
        return;
      }

      // Supabase Insert
      const btnSubmit = reviewForm.querySelector('button[type="submit"]');
      const originalText = btnSubmit.textContent;
      btnSubmit.textContent = "Mengirim...";
      btnSubmit.disabled = true;

      try {
        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('reviews')
            .insert([{ name, text, rating, likes: 0 }])
            .select();

          if (error) throw error;

          if (data && data.length > 0) {
            window.loadedReviews.unshift(data[0]);
            updateReviewStats();
            appendReviewToGrid(data[0], 0, true);
            setTimeout(initCarousel, 100);
          }
        } else {
          // Fallback mockup
          const mock = { id: 'mock', name, text, rating, likes: 0 };
          window.loadedReviews.unshift(mock);
          updateReviewStats();
          appendReviewToGrid(mock, 0, true);
          setTimeout(initCarousel, 100);
        }

        // Record successful submission time for rate limiting
        localStorage.setItem('natura_last_review_time', Date.now().toString());

        modalFormContainer.style.display = 'none';
        modalSuccess.style.display = 'block';

      } catch (err) {
        console.error("Gagal mengirim ulasan:", err);
        showToast("Terjadi kesalahan. Silakan coba lagi.");
      } finally {
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
      }
    });
  }

  // --- MAP LOGIC ---
  const mapEl = document.getElementById('map');
  if (mapEl && window.L) {
    const storeLat = 5.2036;
    const storeLng = 96.7029;
    
    const map = L.map('map', {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([storeLat, storeLng], 13);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri'
    }).addTo(map);

    const storeIcon = L.divIcon({
      className: 'custom-store-marker',
      html: `<div style="background-color: var(--time-accent); width: 20px; height: 20px; border-radius: 50%; border: 3px solid var(--time-bg); box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    L.marker([storeLat, storeLng], {icon: storeIcon}).addTo(map)
      .bindPopup('<b style="font-family: var(--font-serif); font-size: 1.1rem; color: #183C2C;">natura house</b><br><span style="font-family: var(--font-sans); font-size: 0.8rem;">Dusun Teratai</span>');

    // Delivery Area Polygon (Kota Juang Boundary)
    if (typeof kotaJuangBoundary !== 'undefined') {
      const boundaryLayer = L.geoJSON(kotaJuangBoundary, {
        style: {
          color: '#C8A97E', // gold line
          weight: 3,
          fillColor: '#C8A97E',
          fillOpacity: 0.05,
          dashArray: '4, 8' // dashed elegant line
        }
      }).addTo(map);

      // Fit map to show the whole area elegantly
      map.fitBounds(boundaryLayer.getBounds(), { padding: [40, 40] });
    }
  }
});
