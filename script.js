/* =====================================
   Chengji Song Portfolio
   Interactive Engine v5
===================================== */

/* ---------- Scroll Reveal ---------- */

const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealElements.forEach(el => revealObserver.observe(el));

/* ---------- Score Counter Animation ---------- */

const scoreElements = document.querySelectorAll(".score");

const scoreObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.animated) {
      entry.target.dataset.animated = "true";
      runScoreAnimation(entry.target);
    }
  });
}, { threshold: 0.7 });

scoreElements.forEach(score => scoreObserver.observe(score));

function runScoreAnimation(element) {
  const target = parseInt(element.dataset.target || element.innerText, 10);
  const suffix = element.dataset.suffix || "";
  let current = 0;

  const duration = 1400;
  const interval = 20;
  const increment = target / (duration / interval);

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.innerText = target + suffix;
      clearInterval(timer);
    } else {
      element.innerText = Math.floor(current) + suffix;
    }
  }, interval);
}

/* ---------- Scroll Progress Bar ---------- */

const progressFill = document.getElementById("progressFill");

function updateProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (progressFill) progressFill.style.width = percent + "%";
}

/* ---------- Nav Scrolled State + Active Link + Back to top ---------- */

const navEl = document.querySelector("nav");
const toTopBtn = document.getElementById("toTop");
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll("nav a");

function updateNavState() {
  const scrolled = window.scrollY > 40;
  if (navEl) navEl.classList.toggle("scrolled", scrolled);
  if (toTopBtn) toTopBtn.classList.toggle("show", window.scrollY > 600);

  let current = "";
  sections.forEach(section => {
    const position = section.offsetTop - 180;
    if (window.scrollY >= position) current = section.id;
  });

  navLinks.forEach(link => {
    link.classList.toggle("active", link.getAttribute("href") === "#" + current);
  });
}

window.addEventListener("scroll", () => {
  updateProgress();
  updateNavState();
}, { passive: true });

updateProgress();
updateNavState();

if (toTopBtn) {
  toTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ---------- Mobile Nav Toggle ---------- */

const navToggle = document.getElementById("navToggle");
const navLinksWrap = document.getElementById("navLinks");

if (navToggle && navLinksWrap) {
  navToggle.addEventListener("click", () => {
    const open = navLinksWrap.classList.toggle("open");
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  navLinksWrap.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinksWrap.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---------- Background Parallax ---------- */

const circles = document.querySelectorAll(".floating-circle");
const hero = document.querySelector(".hero");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isFinePointer = window.matchMedia("(pointer: fine)").matches;

if (hero && isFinePointer && !prefersReducedMotion) {
  hero.addEventListener("mousemove", (event) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;

    circles.forEach((circle, index) => {
      const speed = (index + 1) * 35;
      circle.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
  });
}

/* ---------- Project Card 3D Effect ---------- */

const projectCards = document.querySelectorAll(".project-card");

if (isFinePointer && !prefersReducedMotion) {
  projectCards.forEach(card => {
    card.addEventListener("mousemove", (event) => {
      const box = card.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      const rotateX = -(y - box.height / 2) / 22;
      const rotateY = (x - box.width / 2) / 22;

      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

/* ---------- Cursor Glow ---------- */

if (isFinePointer && !prefersReducedMotion) {
  const cursor = document.createElement("div");
  cursor.className = "cursor-glow";
  document.body.appendChild(cursor);

  document.addEventListener("mousemove", (event) => {
    cursor.style.opacity = "1";
    cursor.style.left = event.clientX + "px";
    cursor.style.top = event.clientY + "px";
  });

  document.addEventListener("mouseleave", () => {
    cursor.style.opacity = "0";
  });
}

/* ---------- Button Interaction ---------- */

const buttons = document.querySelectorAll(".button");

buttons.forEach(button => {
  button.addEventListener("mousedown", () => {
    button.style.transform = "scale(.95)";
  });

  button.addEventListener("mouseup", () => {
    button.style.transform = "";
  });
});
