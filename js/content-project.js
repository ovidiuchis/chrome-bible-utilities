const showProject = true;
const projected = "projected";
let projectTab;
let selectedVersesNr = [];
let selectParallel = true;
let focusChapter = "primary";

addBodyStyles();
cleaunUp();
initEvents();

// = = = utilities = = =

function cleaunUp() {
  // remove all notes
  document.querySelectorAll(".note").forEach(n => {
    n.innerHTML = "";
    n.className = "";
  });

  // add spaces after label
  document.querySelectorAll(".verse .label").forEach(l => {
    l.innerHTML = l.innerHTML.trim() + " ";
  });
}

function addBodyStyles() {
  if (document.querySelector("#bible-projector")) {
    return;
  }
  const styles = `
    .row,
    body.c_pages.a_privacy .privacy_content {
      max-width: 90rem;
    }
    .bible-reader-arrows-container {
      max-width: 100%;
    }
    .verse .label {
      cursor: pointer;
      padding: 5px 5px 5px 8px;
      border-radius: 4px;
    }
    .verse.projected .label {
      background: #000;
      color: #fff;
    }
    
    body .chapter-picker-modal .chapter-container .chapter-list li {
      height: 40px;
    }
    body .bible-reader .verse {
      display: block;
    }
    body .bible-reader.primary-chapter .label,
    body .bible-reader.parallel-chapter .label {
      display: inline;
    }
    
    #react-app-Footer {
      display: none;
    }
    
    body .verse-action-footer.open {
      display: none;
    }
    @media only screen and (min-width: 37.5em) {
      body .verse-action-footer {
        padding: 5px;
      }
    }
    @media screen and (min-width: 992px) {
      body .yv-footer {
        padding: 30px;
      }
    }
    
    /* primary only */
    @media only screen and (min-width: 64em) {
      .large-6 {
        width: 80%;
      }
    }
    
  `;
  const styleSheet = document.createElement("style");
  styleSheet.id = "bible-projector";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

function adjustBodySize(tab) {
  let fontSize = 100;
  const body = tab.document.body;
  do {
    body.style.fontSize = fontSize + "px";
    fontSize--;
  } while (fontSize > 10 && body.offsetHeight > tab.window.innerHeight);
}

function getDisplayText(verses) {
  const chapters = [...document.querySelectorAll(".reader h1")].map(h => h.innerHTML.trim()).join(" / ");
  const selectedVerses = [...verses];
  const showParallel = !!document.querySelector(".parallel-chapter");
  let separator = " separator";
  return (
    `<h1>${chapters}</h1>` +
    selectedVerses
      .map(v => {
        const label = v.querySelector(":scope > .label");
        const verseNr = label ? label.innerText : "";
        const nr = label ? `<sup>${verseNr}</sup>` : "";
        let cls = "";
        if (showParallel) {
          if (v.closest(".parallel-chapter")) {
            cls = `parallel${separator}`;
            separator = ""; // only first well be separator
          }
        }
        return `<p class="${cls}">${nr}${v.innerText.substring(verseNr.length)}</p>`;
      })
      .join("\n")
  );
}

function printSelectedVerses(tab, verses) {
  cleaunUp();

  tab.document.body.innerHTML = verses.length ? getDisplayText(verses) : "";

  if (verses.length) {
    setTimeout(() => {
      adjustBodySize(tab);
    }, 10);
  }
}

function createProjectTab() {
  const tab = window.open("", "_blank", "toolbar=no,location=no,directories=no,status=no,menubar=no,fullscreen=yes,width=300,height=240,top=200,left=300");
  const styles = `
    html {
      height: 100%;
      overflow: hidden;
    }
    body {
      font-family: Calibri, Arial, sans-serif;
      font-weight: bold;
      min-height: 100%;
      background: #000;
      color: #fff;
      margin: 0;
	    padding: 0;
    }
    h1 {
      color: gray;
      font-size: 0.7em;
      margin: 0.2em 0.4em 0 0.4em;
    }
    p.parallel.separator {
      border-top: 2px solid gray;
    }
    p {
      margin: 0;
      padding: 0.2em;
    }
    p > sup {
      color: gray;
      font-size: 0.7em;
    }
    `;
  const styleSheet = tab.document.createElement("style");
  styleSheet.id = "bible-projector";
  styleSheet.innerText = styles;
  tab.document.head.appendChild(styleSheet);
  tab.document.body.innerHTML = "";

  return tab;
}

function getProjectTab() {
  if (!projectTab) {
    projectTab = createProjectTab();
    window.onbeforeunload = function () {
      projectTab.close();
    };
    projectTab.window.addEventListener("resize", () => {
      adjustBodySize(projectTab);
    });
  }
  return projectTab;
}

function deselectAll() {
  document.querySelectorAll(`.verse.${projected}`).forEach(v => {
    v.classList.remove(projected);
  });
}

function selectVerses(verses, deselect) {
  if (deselect === true) {
    deselectAll();
  }
  return [...verses]
    .map(v => {
      v.classList.toggle(projected);

      const label = v.querySelector(":scope > .label");
      return label ? parseInt(label.innerText) : 0;
    })
    .filter(Boolean);
}

function selectVersesToProject(e) {
  const target = e.target;
  if (target.matches(".verse .label")) {
    e.stopPropagation();
    e.preventDefault();
    const multiSelect = e.ctrlKey;
    const verse = target.closest(".verse");
    const cls = ".row ." + verse.className.split(/\s+/).join(".");
    const verses = document.querySelectorAll(cls);

    const projectedVerses = verse.classList.contains(projected);

    focusChapter = target.closest(".parallel-chapter") ? "parallel" : "primary";

    if (!multiSelect) {
      deselectAll();
    }

    if (!projectedVerses || multiSelect) {
      selectedVersesNr = selectVerses(verses);
    }

    displayVerses(document.querySelectorAll(`.verse.${projected}`));
  }
}

function displayVerses(verses) {
  if (showProject) {
    const tab = getProjectTab();
    printSelectedVerses(tab, verses);
  }
}

function selectByKeys(e) {
  let dir = 0;
  switch (e.keyCode) {
    case 27: {
      // ESC
      deselectAll();
      displayVerses([]);
      break;
    }
    case 38: {
      // up
      dir = -1;
      break;
    }
    case 40: {
      //down
      dir = 1;
      break;
    }
  }

  if (dir) {
    let next = selectedVersesNr.map(v => v + dir);
    const [primary, parallel] = next;
    const verses = document.querySelectorAll(`.row .primary-chapter .verse.v${primary}, .row .parallel-chapter .verse.v${parallel}`);
    if (verses.length) {
      selectedVersesNr = next;
    } else {
      return;
    }
    selectVerses(verses, true);
    displayVerses(verses);
    const focusEl = focusChapter === "primary" ? verses[0] : verses[1] || verses[0];
    if (focusEl) {
      setTimeout(() => {
        // focusEl.scrollIntoView();
        focusEl.scrollIntoViewIfNeeded(false);
      }, 500);
    }
  }
}

function initEvents() {
  const app = document.querySelector("#react-app-Bible");
  app.addEventListener("click", selectVersesToProject);
  document.addEventListener("keydown", selectByKeys);
}
