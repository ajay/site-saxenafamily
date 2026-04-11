document.addEventListener('DOMContentLoaded', function () {
  // -- Sticky nav shadow on scroll --
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  // -- Active nav link via IntersectionObserver --
  var sections = document.querySelectorAll('.section');
  var navLinks = document.querySelectorAll('.nav-link');

  if (sections.length && navLinks.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          navLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });

    sections.forEach(function (section) { observer.observe(section); });
  }

  // -- Bhajan expand / collapse --
  var chapterCache = {};

  document.querySelectorAll('.bhajan-header').forEach(function (header) {
    header.addEventListener('click', function () {
      var card = header.closest('.bhajan-card');
      var expanded = card.classList.toggle('expanded');
      header.setAttribute('aria-expanded', expanded);

      // Lazy load Garuda Purana chapters
      var chapter = card.getAttribute('data-chapter');
      if (chapter && expanded && !chapterCache[chapter]) {
        var placeholder = card.querySelector('.lazy-load-placeholder');
        if (placeholder) {
          placeholder.textContent = 'Loading...';
          fetch('data/garuda-purana/chapter-' + chapter + '.json')
            .then(function (r) { return r.json(); })
            .then(function (data) {
              chapterCache[chapter] = true;
              var content = card.querySelector('.bhajan-content');
              content.innerHTML = renderChapter(data);
            })
            .catch(function () {
              placeholder.textContent = 'Failed to load chapter.';
            });
        }
      }
    });

    header.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });
  });

  function renderChapter(data) {
    var html = '';
    if (data.context) {
      html += '<div class="bhajan-context">' + data.context + '</div>';
    }
    html += '<div class="bhajan-columns">';
    html += '<div class="columns-header"><h4>Sanskrit</h4><h4>Transliteration</h4><h4>Translation</h4></div>';
    data.verses.forEach(function (v) {
      html += '<div class="verse-pair">';
      html += '<div class="verse-hindi" lang="hi">' + v.hindi.replace(/\n/g, '<br>') + '</div>';
      html += '<div class="verse-transliteration">' + v.transliteration.replace(/\n/g, '<br>') + '</div>';
      html += '<div class="verse-translation">' + v.translation.replace(/\n/g, '<br>') + '</div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  // -- Photo lightbox --
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');

  document.querySelectorAll('.photo-card img').forEach(function (img) {
    img.addEventListener('click', function () {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  window.closeLightbox = function () {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  };

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) {
      closeLightbox();
    }
  });
});
