document.addEventListener("DOMContentLoaded", function () {
  // -- Sticky nav shadow on scroll --
  var navbar = document.querySelector(".navbar");
  if (navbar) {
    window.addEventListener(
      "scroll",
      function () {
        navbar.classList.toggle("scrolled", window.scrollY > 10);
      },
      { passive: true },
    );
  }

  // -- Active nav link via IntersectionObserver --
  var sections = document.querySelectorAll(".section");
  var navLinks = document.querySelectorAll(".nav-link");

  if (sections.length && navLinks.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id;
            navLinks.forEach(function (link) {
              link.classList.toggle(
                "active",
                link.getAttribute("href") === "#" + id,
              );
            });
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  // -- Expand / collapse with lazy loading --
  var contentCache = {};

  document.querySelectorAll(".bhajan-header").forEach(function (header) {
    header.addEventListener("click", function () {
      var card = header.closest(".bhajan-card");
      var expanded = card.classList.toggle("expanded");
      header.setAttribute("aria-expanded", expanded);

      // Lazy load Garuda Purana chapters
      var chapter = card.getAttribute("data-chapter");
      if (chapter && expanded && !contentCache["ch-" + chapter]) {
        var placeholder = card.querySelector(".lazy-load-placeholder");
        if (placeholder) {
          placeholder.textContent = "Loading...";
          fetch(
            "data/garuda-purana/chapter-" + chapter.padStart(2, "0") + ".json",
          )
            .then(function (r) {
              return r.json();
            })
            .then(function (data) {
              contentCache["ch-" + chapter] = true;
              card.querySelector(".bhajan-content").innerHTML =
                renderVerses(data);
            })
            .catch(function () {
              placeholder.textContent = "Failed to load.";
            });
        }
      }

      // Lazy load bhajans
      var bhajan = card.getAttribute("data-bhajan");
      if (bhajan && expanded && !contentCache["bh-" + bhajan]) {
        var placeholder = card.querySelector(".lazy-load-placeholder");
        if (placeholder) {
          placeholder.textContent = "Loading...";
          fetch("data/bhajans/" + bhajan + ".json")
            .then(function (r) {
              return r.json();
            })
            .then(function (data) {
              contentCache["bh-" + bhajan] = true;
              card.querySelector(".bhajan-content").innerHTML =
                renderBhajan(data);
            })
            .catch(function () {
              placeholder.textContent = "Failed to load.";
            });
        }
      }
    });

    header.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        header.click();
      }
    });
  });

  function renderVersePairs(verses, colLabel) {
    var html = '<div class="bhajan-columns">';
    html +=
      '<div class="columns-header"><h4>' +
      colLabel +
      "</h4><h4>Transliteration</h4><h4>Translation</h4></div>";
    verses.forEach(function (v) {
      html += '<div class="verse-pair">';
      html +=
        '<div class="verse-hindi" lang="hi">' +
        v.hindi.replace(/\n/g, "<br>") +
        "</div>";
      html +=
        '<div class="verse-transliteration">' +
        v.transliteration.replace(/\n/g, "<br>") +
        "</div>";
      html +=
        '<div class="verse-translation">' +
        v.translation.replace(/\n/g, "<br>") +
        "</div>";
      html += "</div>";
    });
    html += "</div>";
    return html;
  }

  function renderVerses(data) {
    var html = "";
    if (data.context)
      html += '<div class="bhajan-context">' + data.context + "</div>";
    html += renderVersePairs(
      data.verses,
      data.first_column_label || "Sanskrit",
    );
    return html;
  }

  function renderBhajan(data) {
    var html = "";
    if (data.context)
      html += '<div class="bhajan-context">' + data.context + "</div>";
    var colLabel = data.first_column_label || "Hindi";
    if (data.sections) {
      data.sections.forEach(function (sec) {
        html += renderVersePairs(sec.verses, sec.label || colLabel);
      });
    } else {
      html += renderVersePairs(data.verses, colLabel);
    }
    if (data.sources && data.sources.length) {
      html += '<div class="bhajan-sources">References: ';
      html += data.sources
        .map(function (s) {
          return (
            '<a href="' +
            s.url +
            '" target="_blank" rel="noopener">' +
            s.label +
            "</a>"
          );
        })
        .join(" | ");
      html += "</div>";
    }
    return html;
  }

  // -- Load posters from JSON --
  var posterGrid = document.getElementById("poster-grid");
  if (posterGrid) {
    fetch("data/posters.json")
      .then(function (r) {
        return r.json();
      })
      .then(function (posters) {
        posters.forEach(function (poster) {
          var div = document.createElement("div");
          div.className = "photo-card";
          var img = document.createElement("img");
          img.src = poster.src;
          img.alt = poster.alt;
          img.loading = "lazy";
          div.appendChild(img);
          posterGrid.appendChild(div);
        });
        bindLightbox();
      });
  }

  // -- Load family tree from JSON --
  var treeContainer = document.getElementById("family-tree-container");
  if (treeContainer) {
    fetch("data/family-tree.json")
      .then(function (r) {
        return r.json();
      })
      .then(function (images) {
        images.forEach(function (item) {
          var img = document.createElement("img");
          img.src = item.src;
          img.alt = item.alt;
          img.className = "family-tree-img";
          treeContainer.appendChild(img);
        });
      });
  }

  // -- Load photo albums from JSON --
  var albumGrid = document.getElementById("album-grid");
  if (albumGrid) {
    fetch("data/albums-resolved.json")
      .then(function (r) {
        return r.json();
      })
      .then(function (albums) {
        albums.sort(function (a, b) {
          var aNum = /^\d/.test(a.title);
          var bNum = /^\d/.test(b.title);
          if (aNum !== bNum) return aNum ? 1 : -1;
          return a.title.localeCompare(b.title);
        });
        albums.forEach(function (album) {
          var a = document.createElement("a");
          a.className = "album-card";
          a.href = album.url;
          a.target = "_blank";
          a.rel = "noopener";
          var html = "";
          if (album.cover) {
            html +=
              '<img class="album-cover" src="' +
              album.cover +
              '" alt="' +
              album.title +
              '">';
          }
          html += '<div class="album-info"><h3>' + album.title + "</h3></div>";
          a.innerHTML = html;
          albumGrid.appendChild(a);
        });
      });
  }

  // -- Photo lightbox --
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");

  function bindLightbox() {
    document.querySelectorAll(".photo-card img").forEach(function (img) {
      if (img._lightboxBound) return;
      img._lightboxBound = true;
      img.addEventListener("click", function () {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add("open");
        document.body.style.overflow = "hidden";
      });
    });
  }

  window.closeLightbox = function () {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
  };

  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lightbox.classList.contains("open")) {
      closeLightbox();
    }
  });
});
