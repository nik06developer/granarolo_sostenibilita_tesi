/* Nav mobile, scrollspy, filtro archivio, dialog di anteprima.
   Ogni blocco controlla prima se gli elementi che gli servono esistono:
   se questo file non gira, la pagina resta comunque usabile. */

(function () {
  "use strict";

  /* ---- 1. Nav mobile ---- */
  var navToggle = document.getElementById("nav-toggle");
  var siteNav = document.getElementById("site-nav");

  if (navToggle && siteNav) {
    // Classe CSS e non l'attributo hidden: hidden vale come
    // aria-hidden="true" per certi screen reader anche quando poi il CSS
    // rimette display:block su desktop.
    siteNav.classList.add("site-nav--collapsed");

    navToggle.addEventListener("click", function () {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!isOpen));
      siteNav.classList.toggle("site-nav--collapsed", isOpen);
    });

    // Altrimenti dopo il salto all'ancora il menu resta aperto sul contenuto
    siteNav.addEventListener("click", function (event) {
      if (event.target.tagName === "A" && window.matchMedia("(max-width: 59.99em)").matches) {
        navToggle.setAttribute("aria-expanded", "false");
        siteNav.classList.add("site-nav--collapsed");
      }
    });
  }

  /* ---- 2. Scrollspy: evidenzia la voce di nav della sezione visibile ----
     IntersectionObserver e non un listener su scroll, che ricalcolerebbe
     a ogni pixel. */
  var sections = document.querySelectorAll("main .section, main .hero");
  var navLinks = siteNav ? siteNav.querySelectorAll("a[href^='#']") : [];

  if (sections.length && navLinks.length && "IntersectionObserver" in window) {
    var linkById = {};
    navLinks.forEach(function (link) {
      linkById[link.getAttribute("href").slice(1)] = link;
    });
    // L'hero (#top, dove puntano il logo e "Torna all'inizio") non ha una
    // voce di menu sua: la faccio contare come "Il contesto", altrimenti in
    // cima alla pagina non risulta selezionato niente.
    linkById["top"] = linkById["contesto"];

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var link = linkById[entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach(function (l) { l.classList.remove("is-current"); });
            link.classList.add("is-current");
          }
        });
      },
      // Attiva solo la sezione nella fascia centrale dello schermo, così due
      // sezioni contigue non se la contendono
      { rootMargin: "-40% 0px -50% 0px" }
    );

    sections.forEach(function (section) {
      if (section.id) observer.observe(section);
    });
  }

  /* ---- 3. Filtro archivio ----
     Nasconde con [hidden] card già nel DOM, non le crea e non le rimuove:
     senza JS devono restare tutte visibili. */
  var filterForm = document.getElementById("archive-filter");
  var reportGrid = document.getElementById("report-grid");
  var archiveCount = document.getElementById("archive-count");

  if (filterForm && reportGrid && archiveCount) {
    var cards = Array.prototype.slice.call(reportGrid.querySelectorAll(".report-card"));

    function applyFilter() {
      var anno = filterForm.elements.anno.value;
      var tipo = filterForm.elements.tipo.value;
      var lingua = filterForm.elements.lingua.value;
      var visible = 0;

      cards.forEach(function (card) {
        var matches =
          (!anno || card.dataset.anno === anno) &&
          (!tipo || card.dataset.tipo === tipo) &&
          (!lingua || card.dataset.lingua === lingua);
        card.hidden = !matches;
        if (matches) visible += 1;
      });

      // Il contenitore ha aria-live="polite" nell'HTML: il conteggio viene
      // annunciato senza spostare il focus
      archiveCount.textContent =
        visible === cards.length
          ? cards.length + " documenti disponibili"
          : visible + " di " + cards.length + " documenti corrispondono ai filtri";
    }

    filterForm.addEventListener("change", applyFilter);
  }

  /* ---- 4. Dialog di anteprima PDF ----
     I pulsanti "Sfoglia" sono link veri: senza JS aprono il PDF in una
     scheda nuova. Con JS intercetto il click e lo apro qui dentro. */
  var dialog = document.getElementById("preview-dialog");
  var dialogObject = document.getElementById("preview-dialog-object");
  var dialogFallbackLink = document.getElementById("preview-dialog-fallback-link");
  var dialogCloseBtn = document.getElementById("preview-dialog-close");
  var previewLinks = document.querySelectorAll(".report-card__preview");

  if (dialog && dialogObject && dialogCloseBtn && previewLinks.length && typeof dialog.showModal === "function") {
    var lastTrigger = null;

    previewLinks.forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        lastTrigger = link;

        var pdfUrl = link.getAttribute("href");
        var title = link.closest(".report-card").querySelector("h3").textContent;

        dialogObject.setAttribute("data", pdfUrl);
        dialogFallbackLink.setAttribute("href", pdfUrl);
        dialog.querySelector("#preview-dialog-title").textContent = "Anteprima — " + title;

        dialog.showModal();
      });
    });

    function closeDialog() {
      dialog.close();
    }

    // La ✕ non è dentro un <form method="dialog">, quindi da sola non
    // chiuderebbe niente
    dialogCloseBtn.addEventListener("click", closeDialog);

    dialog.addEventListener("close", function () {
      // removeAttribute e non data="": un data vuoto non è valido, e senza
      // toglierlo il plugin PDF resta caricato in background
      dialogObject.removeAttribute("data");
      if (lastTrigger) {
        // Non tutti i browser riportano il focus da soli sul bottone di
        // partenza, quindi lo faccio a mano
        lastTrigger.focus();
      }
    });

    // Click sul bordo esterno = chiudi, come in qualsiasi modale
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
  }
})();
