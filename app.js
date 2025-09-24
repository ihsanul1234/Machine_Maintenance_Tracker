// ====== Select form and table body ======
const machineForm = document.getElementById("machineForm");
const machineTableBody = document.getElementById("machineTableBody");

let editMode = false;
let editId = null;

// ====== Load existing machines and setup listeners ======
document.addEventListener("DOMContentLoaded", () => {
  loadMachines();

  // 🔍 Search filter
  document.getElementById("searchInput").addEventListener("keyup", function () {
    const filter = this.value.toLowerCase();
    const rows = machineTableBody.getElementsByTagName("tr");

    Array.from(rows).forEach(row => {
      const type = row.cells[2].textContent.toLowerCase();   // Machine Type
      const status = row.cells[6].textContent.toLowerCase(); // Status
      if (type.includes(filter) || status.includes(filter)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  });

  // 🔄 Sort by next service date
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

  // 🌙 Theme toggle
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("darkmode");
    themeIcon.classList.replace("bi-moon", "bi-sun");
  }

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("darkmode");

    if (document.body.classList.contains("darkmode")) {
      themeIcon.classList.replace("bi-moon", "bi-sun");
      localStorage.setItem("theme", "dark");
    } else {
      themeIcon.classList.replace("bi-sun", "bi-moon");
      localStorage.setItem("theme", "light");
    }
  });
});

// ====== Handle form submit ======
machineForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("machineName").value;
  const type = document.getElementById("machineType").value;
  const lastServiced = document.getElementById("lastServiced").value;
  const interval = document.getElementById("serviceInterval").value;

  if (!name || !type || !lastServiced || !interval) {
    alert("Please fill all fields");
    return;
  }

  if (editMode) {
    updateMachine(editId, { name, type, lastServiced, interval: parseInt(interval) });
    editMode = false;
    editId = null;
  } else {
    const machine = {
      id: Date.now(),
      name,
      type,
      lastServiced,
      interval: parseInt(interval),
    };
    saveMachine(machine);
  }

  machineTableBody.innerHTML = "";
  loadMachines();
  machineForm.reset();
});

// ====== Save machine ======
function saveMachine(machine) {
  let machines = JSON.parse(localStorage.getItem("machines")) || [];
  machines.push(machine);
  localStorage.setItem("machines", JSON.stringify(machines));
}

// ====== Update machine ======
function updateMachine(id, updatedData) {
  let machines = JSON.parse(localStorage.getItem("machines")) || [];
  machines = machines.map(m => (m.id === id ? { ...m, ...updatedData } : m));
  localStorage.setItem("machines", JSON.stringify(machines));
}

// ====== Load machines ======
function loadMachines() {
  let machines = JSON.parse(localStorage.getItem("machines")) || [];
  machines.forEach(machine => addMachineToTable(machine));
}

// ====== Delete machine ======
function deleteMachine(id) {
  let machines = JSON.parse(localStorage.getItem("machines")) || [];
  machines = machines.filter(m => m.id !== id);
  localStorage.setItem("machines", JSON.stringify(machines));

  machineTableBody.innerHTML = "";
  loadMachines();
}

// ====== Add machine row ======
function addMachineToTable(machine) {
  const row = document.createElement("tr");

  const lastDate = new Date(machine.lastServiced);
  const nextServiceDate = new Date(lastDate);
  nextServiceDate.setDate(lastDate.getDate() + machine.interval);
  const nextDateStr = nextServiceDate.toISOString().split("T")[0];

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

  row.querySelector(".delete-btn").addEventListener("click", function () {
    const id = parseInt(this.getAttribute("data-id"));
    deleteMachine(id);
  });

  row.querySelector(".edit-btn").addEventListener("click", function () {
    const id = parseInt(this.getAttribute("data-id"));
    startEdit(id);
  });
}

// ====== Start edit mode ======
function startEdit(id) {
  let machines = JSON.parse(localStorage.getItem("machines")) || [];
  const machine = machines.find(m => m.id === id);
  if (!machine) return;

  document.getElementById("machineName").value = machine.name;
  document.getElementById("machineType").value = machine.type;
  document.getElementById("lastServiced").value = machine.lastServiced;
  document.getElementById("serviceInterval").value = machine.interval;

  editMode = true;
  editId = id;
}
