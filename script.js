// =================================================================================
// 1. GLOBAL VARIABLES
// =================================================================================

// This variable will store the master list of all available companies from the backend.
let allCompanies = [];

// This 'selected' array holds the company OBJECTS that the user has chosen.
let selected = [];

const MAX_ITEMS = 20; // The maximum number of companies a user can select.

// =================================================================================
// 2. HTML ELEMENT REFERENCES
// =================================================================================

const container = document.getElementById("company-container");
const addBtn = document.getElementById("add-btn");
const menu = document.getElementById("menu");
const companyList = document.getElementById("company-list");
const searchInput = document.getElementById("search");
const emptyMsg = document.getElementById("empty-msg");

// =================================================================================
// 3. EVENT LISTENERS
// =================================================================================

addBtn.addEventListener("click", function() {
  menu.classList.toggle("hidden");
  searchInput.value = "";
  renderMenu(allCompanies); // Show all companies when the menu is opened.
});

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = allCompanies.filter(c => (c.name || c).toLowerCase().includes(query));
  renderMenu(filtered);
});

// =================================================================================
// 4. CORE FUNCTIONS (DOM Manipulation)
// =================================================================================

/**
 * Generates a consistent, somewhat unique color based on a string.
 * This ensures a company's fallback logo always has the same color.
 * @param {string} str - The input string (e.g., company name).
 * @returns {string} - A hex color code.
 */
function generateColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
}


/**
 * Creates a logo element for a company, with a fallback if the image fails to load.
 * @param {object} company - The company object.
 * @param {string} className - The CSS class to apply to the logo element.
 * @returns {HTMLElement} - The logo element (either an <img> or a fallback <div>).
 */
function createLogo(company, className) {
    const logo = document.createElement("img");
    logo.src = company.logo;
    logo.alt = company.name + " Logo";
    logo.className = className;

    // If the image fails to load, this function runs.
    logo.onerror = function() {
        // Create a fallback div.
        const fallback = document.createElement("div");
        fallback.className = className + " logo-fallback"; // e.g., "company-logo logo-fallback"
        
        // Use the first letter of the company name.
        fallback.textContent = company.name.charAt(0).toUpperCase();
        
        // Give it a background color based on the name.
        fallback.style.backgroundColor = generateColor(company.name);

        // Replace the broken image <img> with the new fallback <div>.
        if (this.parentNode) {
            this.parentNode.replaceChild(fallback, this);
        }
    };

    return logo;
}


/**
 * Renders the list of companies in the popup menu.
 * @param {object[]} list - An array of company objects to display.
 */
function renderMenu(list) {
  companyList.innerHTML = "";

  list.forEach(function(company) {
    const li = document.createElement("li");

    // Create logo element with fallback
    const logo = createLogo(company, "company-logo-small");

    // Create span for name
    const nameSpan = document.createElement("span");
    nameSpan.textContent = company.name;

    li.appendChild(logo);
    li.appendChild(nameSpan);

    // Pass the entire company object to the addCompany function on double-click.
    li.ondblclick = function() {
      addCompany(company);
    };

    companyList.appendChild(li);
  });
}

/**
 * Adds a company to the selected list.
 * @param {object} company - The company object to add (e.g., {id: 1, name: "Google"}).
 */
function addCompany(company) {
  // Check if the company is already selected by comparing IDs.
  const isAlreadySelected = selected.some(selectedCompany => selectedCompany.id === company.id);

  if (selected.length >= MAX_ITEMS || isAlreadySelected) {
    return; // Stop if the list is full or the company is a duplicate.
  }

  selected.push(company);
  saveSelectionsToBackend(); // Save the new list to the server.
  updateContainer();

  if (selected.length >= MAX_ITEMS) {
    addBtn.disabled = true;
    menu.classList.add("hidden");
  }
}

/**
 * Redraws the main container with the selected companies.
 */
function updateContainer() {
  container.innerHTML = ""; // Clear the container first.

  if (selected.length === 0) {
    // If no companies are selected, show the "No companies" message.
    if (emptyMsg) {
        container.appendChild(emptyMsg);
    }
  } else {
    // If there are selected companies, loop through them.
    if (emptyMsg) {
        emptyMsg.remove(); // Hide the empty message.
    }
    selected.forEach(function(company) {
      const div = document.createElement("div");
      div.className = "company-item";

      // Create logo element with fallback
      const logo = createLogo(company, "company-logo");

      const span = document.createElement("span");
      span.textContent = company.name; // CORRECT: Display the company's name.

      const btn = document.createElement("button");
      btn.innerHTML = "&#128465;"; // Trash can icon
      btn.className = "delete-btn";
      btn.onclick = function() {
        removeCompany(company.id); // CORRECT: Remove by the company's unique ID.
      };

      div.appendChild(logo);
      div.appendChild(span);
      div.appendChild(btn);
      container.appendChild(div);
    });
  }

  // Disable the '+' button if the max number of companies is reached.
  addBtn.disabled = selected.length >= MAX_ITEMS;
}

/**
 * Removes a company from the selected list by its ID.
 * @param {number} companyId - The ID of the company to remove.
 */
function removeCompany(companyId) {
  // Create a new array that excludes the company with the matching ID.
  selected = selected.filter(function(company) {
    return company.id !== companyId;
  });

  saveSelectionsToBackend(); // Save the changes to the server.
  updateContainer();
}

// =================================================================================
// 5. BACKEND COMMUNICATION
// =================================================================================

/**
 * Fetches the master list of all companies from the backend.
 */
function fetchAllCompanies() {
  fetch("http://localhost:5000/companies")
    .then(response => response.json())
    .then(data => {
      allCompanies = data;
    })
    .catch(error => console.error("Error fetching all companies:", error));
}

/**
 * Fetches the user's previously saved selections from the backend.
 */
function fetchSelectedCompanies() {
  fetch("http://localhost:5000/selected-companies")
    .then(response => response.json())
    .then(data => {
      selected = data;
      updateContainer(); // Update the display with the loaded selections.
    })
    .catch(error => console.error("Error fetching selected companies:", error));
}

/**
 * Sends the current 'selected' array to the backend to be saved.
 */
function saveSelectionsToBackend() {
  fetch("http://localhost:5000/selected-companies", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(selected), // Convert the array to a JSON string for sending.
  }).catch(error => console.error("Error saving selections:", error));
}

// =================================================================================
// 6. INITIALIZATION
// =================================================================================

/**
 * This function kicks everything off when the page first loads.
 */
function initializeApp() {
  fetchAllCompanies(); // Get the list of all possible companies.
  fetchSelectedCompanies(); // Get the user's saved list to display.
}

// Run the initialization function to start the application.
initializeApp();