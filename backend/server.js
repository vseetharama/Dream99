const express = require("express");
const cors = require("cors");
const fs = require("fs"); // Import the Node.js file system module

const app = express();
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

const COMPANIES_FILE = "./companies.json";
const USER_SELECTIONS_FILE = "./user.json";

// Welcome route
app.get("/", (req, res) => {
  res.send("Welcome to the Dream99 backend!");
});

// API endpoint: GET /companies
// Reads the master list of companies from the JSON file.
app.get("/companies", (req, res) => {
  fs.readFile(COMPANIES_FILE, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading companies file:", err);
      return res.status(500).send("Server error");
    }
    res.json(JSON.parse(data));
  });
});

// API endpoint: GET /selected-companies
// Reads the user's saved company selections.
app.get("/selected-companies", (req, res) => {
  fs.readFile(USER_SELECTIONS_FILE, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading user selections file:", err);
      return res.status(500).send("Server error");
    }
    res.json(JSON.parse(data));
  });
});

// API endpoint: POST /selected-companies
// Saves the user's company selections to the file.
app.post("/selected-companies", (req, res) => {
  const selectedCompanies = req.body; // Get the data from the request

  fs.writeFile(USER_SELECTIONS_FILE, JSON.stringify(selectedCompanies, null, 2), (err) => {
    if (err) {
      console.error("Error writing user selections file:", err);
      return res.status(500).send("Server error");
    }
    res.status(200).send("Selections saved successfully");
  });
});

// Ensure companies.json and user.json exist with default content
if (!fs.existsSync(COMPANIES_FILE)) {
  fs.writeFileSync(COMPANIES_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(USER_SELECTIONS_FILE)) {
  fs.writeFileSync(USER_SELECTIONS_FILE, JSON.stringify([], null, 2));
}

// Start server
app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
