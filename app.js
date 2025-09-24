// Select form and table body
const machineForm = document.getElementById("machineForm");
const machineTableBody = document.getElementById("machineTableBody");

let editMode = false;
let editId = null;

// Machine data array
let machines = [];
let sortAsc = true;

// Load existing machines from localStorage when page loads
document.addEventListener("DOMContentLoaded", loadMachines);

// Handle form submit
machineForm.addEventListener("submit", function (e) {
  e.preventDefault(); // stop page reload

  // Capture form data
  const name = document.getElementById("machineName").value;
  const type = document.getElementById("machineType").value;
  const lastServiced = document.getElementById("lastServiced").value;
  const interval = document.getElementById("serviceInterval").value;

  if (!name || !type || !lastServiced || !interval) {
    alert("Please fill all fields");
    return;
  }

  if (editMode) {
    // Update existing machine
    updateMachine(editId, { name, type, lastServiced, interval: parseInt(interval) });
    editMode = false;
    editId = null;
  } else {
    // Create new machine
    const machine = {
      id: Date.now(), // unique ID
      name,
      type,
      lastServiced,
      interval: parseInt(interval),
    };
    saveMachine(machine);
  }


  // Reload table
  machineTableBody.innerHTML = "";
  loadMachines();

  // Reset form
  machineForm.reset();
});

// Save machine to localStorage
function saveMachine(machine) {
  let machines = JSON.parse(localStorage.getItem("machines")) || [];
  machines.push(machine);
  localStorage.setItem("machines", JSON.stringify(machines));
}

// Update machine in localStorage
function updateMachine(id, updatedData) {
  let machines = JSON.parse(localStorage.getItem("machines")) || [];
  machines = machines.map((m) =>
    m.id === id ? { ...m, ...updatedData } : m
  );
  localStorage.setItem("machines", JSON.stringify(machines));
}

// Load all machines from localStorage
function loadMachines() {
  let machines = JSON.parse(localStorage.getItem("machines")) || [];
  machines.forEach((machine) => addMachineToTable(machine));
}

// Delete machine by ID
function deleteMachine(id) {
  let machines = JSON.parse(localStorage.getItem("machines")) || [];
  machines = machines.filter((m) => m.id !== id);
  localStorage.setItem("machines", JSON.stringify(machines));

  // Reload table
  machineTableBody.innerHTML = "";
  loadMachines();
}

// Add machine row to table (with next service date + status + edit/delete)
function addMachineToTable(machine) {
  const row = document.createElement("tr");

  // Calculate next service date
  const lastDate = new Date(machine.lastServiced);
  const nextServiceDate = new Date(lastDate);
  nextServiceDate.setDate(lastDate.getDate() + machine.interval);
  const nextDateStr = nextServiceDate.toISOString().split("T")[0];

  // Determine status
  const today = new Date();
  let status = "OK";
  let statusClass = "text-success fw-bold";

  if (today > nextServiceDate) {
    status = "Overdue";
    statusClass = "text-danger fw-bold";
  } else {
    const diffTime = nextServiceDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      status = "Due Soon";
      statusClass = "text-warning fw-bold";
    }
  }

  row.innerHTML = `
    <td>${machine.id}</td>
    <td>${machine.name}</td>
    <td>${machine.type}</td>
    <td>${machine.lastServiced}</td>
    <td>${machine.interval}</td>
    <td>${nextDateStr}</td>
    <td class="${statusClass}">${status}</td>
    <td>
      <button class="btn btn-sm btn-primary edit-btn" data-id="${machine.id}">Edit</button>
      <button class="btn btn-sm btn-danger delete-btn" data-id="${machine.id}">Delete</button>
    </td>
  `;

  machineTableBody.appendChild(row);

  // Attach delete event
  row.querySelector(".delete-btn").addEventListener("click", function () {
    const id = parseInt(this.getAttribute("data-id"));
    deleteMachine(id);
  });

  // Attach edit event
  row.querySelector(".edit-btn").addEventListener("click", function () {
    const id = parseInt(this.getAttribute("data-id"));
    startEdit(id);
  });
}

// Start edit mode
function startEdit(id) {
  let machines = JSON.parse(localStorage.getItem("machines")) || [];
  const machine = machines.find((m) => m.id === id);
  if (!machine) return;

  // Pre-fill form
  document.getElementById("machineName").value = machine.name;
  document.getElementById("machineType").value = machine.type;
  document.getElementById("lastServiced").value = machine.lastServiced;
  document.getElementById("serviceInterval").value = machine.interval;

  editMode = true;
  editId = id;
}

// Search filter
document.getElementById("searchInput").addEventListener("keyup", function () {
  const filter = this.value.toLowerCase();
  const rows = machineTableBody.getElementsByTagName("tr");

  Array.from(rows).forEach(row => {
    const type = row.cells[2].textContent.toLowerCase(); // Machine Type
    const status = row.cells[6].textContent.toLowerCase(); // Status
    if (type.includes(filter) || status.includes(filter)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
});

// Sort by next service date
document.getElementById("sortBtn").addEventListener("click", function () {
  let machines = JSON.parse(localStorage.getItem("machines")) || [];

  machines.sort((a, b) => {
    const dateA = new Date(a.lastServiced);
    dateA.setDate(dateA.getDate() + a.interval);
    const dateB = new Date(b.lastServiced);
    dateB.setDate(dateB.getDate() + b.interval);
    return dateA - dateB; // earliest first
  });

  localStorage.setItem("machines", JSON.stringify(machines));

  // Reload table
  machineTableBody.innerHTML = "";
  loadMachines();
});

// Function to render table
function renderTable(data) {
  const tbody = document.getElementById('machineTableBody');
  tbody.innerHTML = '';
  data.forEach((machine, idx) => {
    const nextService = getNextServiceDate(machine.lastServiced, machine.serviceInterval);
    const status = getStatus(nextService);
    tbody.innerHTML += `
      <tr>
        <td>${idx + 1}</td>
        <td>${machine.machineName}</td>
        <td>${machine.machineType}</td>
        <td>${machine.lastServiced}</td>
        <td>${machine.serviceInterval}</td>
        <td>${nextService}</td>
        <td>${status}</td>
        <td><!-- Actions here if needed --></td>
      </tr>
    `;
  });
}

// Helper to calculate next service date
function getNextServiceDate(last, interval) {
  const date = new Date(last);
  date.setDate(date.getDate() + parseInt(interval));
  return date.toISOString().split('T')[0];
}

// Helper to get status
function getStatus(nextService) {
  const today = new Date().toISOString().split('T')[0];
  if (nextService <= today) return 'Due';
  return 'OK';
}

// Initial render
renderTable(machines);

// Theme toggle
window.addEventListener('DOMContentLoaded', () => {
  // Theme toggle logic
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const navbar = document.querySelector('.navbar');
  const footer = document.querySelector('footer');
  const tableHead = document.querySelector('thead');

  function setTheme(mode) {
    if (mode === 'light') {
      document.body.classList.remove('darkmode');
      themeIcon.classList.remove('bi-sun');
      themeIcon.classList.add('bi-moon');
      navbar.classList.remove('bg-dark', 'navbar-dark');
      navbar.classList.add('bg-light', 'navbar-light');
      footer.classList.remove('bg-dark');
      footer.classList.add('bg-light', 'text-dark');
      if (tableHead) tableHead.classList.remove('table-dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.add('darkmode');
      themeIcon.classList.remove('bi-moon');
      themeIcon.classList.add('bi-sun');
      navbar.classList.remove('bg-light', 'navbar-light');
      navbar.classList.add('bg-dark', 'navbar-dark');
      footer.classList.remove('bg-light', 'text-dark');
      footer.classList.add('bg-dark');
      if (tableHead) tableHead.classList.add('table-dark');
      localStorage.setItem('theme', 'dark');
    }
  }

  // Set initial theme from localStorage
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    setTheme('dark');
  } else {
    setTheme('light');
  }

  themeToggle.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('darkmode');
    setTheme(isDark ? 'dark' : 'light');
  });
});
