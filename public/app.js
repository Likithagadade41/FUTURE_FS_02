const leadModal = document.getElementById("leadModal");
const addLeadBtn = document.getElementById("addLeadBtn");
const addLeadNav = document.getElementById("addLeadNav");
const closeModal = document.getElementById("closeModal");
const leadForm = document.getElementById("leadForm");

const leadsTable = document.getElementById("leadsTable");
const totalLeads = document.getElementById("totalLeads");
const newLeads = document.getElementById("newLeads");
const contactedLeads = document.getElementById("contactedLeads");
const convertedLeads = document.getElementById("convertedLeads");
const leadCount = document.getElementById("leadCount");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

let allLeads = [];

// ================= LOAD LEADS =================

async function loadLeads() {
  try {
    const response = await fetch("/api/leads");
    allLeads = await response.json();

    displayLeads(allLeads);
    updateStats(allLeads);
    updateLeadIntelligence(allLeads);
    updateSourceAnalytics(allLeads);
    updateLeadsChart(allLeads);
    displayFollowUps(allLeads);
    updateAnalytics(allLeads);
    renderCalendar();
  } catch (error) {
    console.error("Error loading leads:", error);
    leadsTable.innerHTML = `
      <tr>
        <td colspan="6">Unable to load leads.</td>
      </tr>
    `;
  }
}

// ================= DISPLAY LEADS =================

function displayLeads(leads) {
  leadsTable.innerHTML = "";

  if (leads.length === 0) {
    leadsTable.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:30px;">
          No leads yet. Click "Add Lead" to create your first lead.
        </td>
      </tr>
    `;

    leadCount.textContent = "0 leads";
    return;
  }

  leads.forEach((lead) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td><strong>${lead.name}</strong></td>
      <td>${lead.email}</td>
      <td>${lead.source}</td>

      <td>
        <select class="status-select" data-id="${lead._id}">
          <option value="New" ${lead.status === "New" ? "selected" : ""}>New</option>
          <option value="Contacted" ${lead.status === "Contacted" ? "selected" : ""}>Contacted</option>
          <option value="Converted" ${lead.status === "Converted" ? "selected" : ""}>Converted</option>
        </select>
      </td>

      <td>
       ${lead.followUpDate
       ? new Date(lead.followUpDate).toLocaleDateString()
      : "—"}
         </td>

      <td>
        <button class="delete-btn" data-id="${lead._id}">
          Delete
        </button>
      </td>
    `;

    leadsTable.appendChild(row);
  });

  leadCount.textContent = `${leads.length} lead${leads.length !== 1 ? "s" : ""}`;

  addStatusListeners();
  addDeleteListeners();
}

// ================= ADD LEAD =================

leadForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const leadData = {
  name: document.getElementById("name").value,
  email: document.getElementById("email").value,
  source: document.getElementById("source").value,
  status: document.getElementById("status").value,
  notes: document.getElementById("notes").value,
  followUpDate: document.getElementById("followUpDate").value,
};

  try {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(leadData),
    });

    if (!response.ok) {
      throw new Error("Failed to add lead");
    }

    leadForm.reset();
    closeLeadModal();

    await loadLeads();
  } catch (error) {
    alert("Unable to add lead. Please try again.");
    console.error(error);
  }
});

// ================= UPDATE STATUS =================

function addStatusListeners() {
  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", async () => {
      const id = select.dataset.id;

      try {
        await fetch(`/api/leads/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: select.value,
          }),
        });

        await loadLeads();
      } catch (error) {
        console.error("Error updating status:", error);
      }
    });
  });
}

// ================= DELETE LEAD =================

function addDeleteListeners() {
  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;

      const confirmed = confirm("Are you sure you want to delete this lead?");

      if (!confirmed) return;

      try {
        await fetch(`/api/leads/${id}`, {
          method: "DELETE",
        });

        await loadLeads();
      } catch (error) {
        console.error("Error deleting lead:", error);
      }
    });
  });
}

// ================= STATISTICS =================

function updateStats(leads) {
  totalLeads.textContent = leads.length;

  newLeads.textContent = leads.filter(
    (lead) => lead.status === "New"
  ).length;

  contactedLeads.textContent = leads.filter(
    (lead) => lead.status === "Contacted"
  ).length;

  convertedLeads.textContent = leads.filter(
    (lead) => lead.status === "Converted"
  ).length;
}

// ================= SEARCH =================

function filterLeads() {
  const searchText = searchInput.value.toLowerCase();
  const selectedStatus = statusFilter.value;

  const filteredLeads = allLeads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchText) ||
      lead.email.toLowerCase().includes(searchText);

    const matchesStatus =
      selectedStatus === "" || lead.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  displayLeads(filteredLeads);
}

searchInput.addEventListener("input", filterLeads);
statusFilter.addEventListener("change", filterLeads);

// ================= MODAL =================

function openLeadModal() {
  leadModal.classList.add("show");
}

function closeLeadModal() {
  leadModal.classList.remove("show");
}

addLeadBtn.addEventListener("click", openLeadModal);

addLeadNav.addEventListener("click", (event) => {
  event.preventDefault();
  openLeadModal();
});

closeModal.addEventListener("click", closeLeadModal);

leadModal.addEventListener("click", (event) => {
  if (event.target === leadModal) {
    closeLeadModal();
  }
});

// ================= START APP =================
// ================= LEADS BY SOURCE =================

function updateSourceAnalytics(leads) {
  const sourceList = document.getElementById("sourceList");
  const sourceDonut = document.getElementById("sourceDonut");
  const sourceTotal = document.getElementById("sourceTotal");

  const total = leads.length;

  sourceTotal.textContent = total;

  // No leads
  if (total === 0) {
    sourceList.innerHTML =
      `<p class="empty-source">No source data yet</p>`;

    sourceDonut.style.background =
      "conic-gradient(#303634 0deg 360deg)";

    return;
  }

  // Count leads by source
  const sourceCounts = {};

  leads.forEach((lead) => {
    const source = lead.source || "Other";

    sourceCounts[source] =
      (sourceCounts[source] || 0) + 1;
  });

  // Professional color palette
  const colors = {
    Website: "#eee2cc",
    Referral: "#7fa18f",
    "Social Media": "#dc8746",
    Other: "#87849c",
  };

  const fallbackColors = [
    "#c7c2dc",
    "#9fb7c9",
    "#d8b4a0",
    "#b9d5c6",
  ];

  // Create donut gradient
  let currentDegree = 0;
  const gradientParts = [];

  Object.entries(sourceCounts).forEach(
    ([source, count], index) => {
      const percentage = (count / total) * 100;
      const degree = (percentage / 100) * 360;

      const color =
        colors[source] ||
        fallbackColors[index % fallbackColors.length];

      gradientParts.push(
        `${color} ${currentDegree}deg ${
          currentDegree + degree
        }deg`
      );

      currentDegree += degree;
    }
  );

  sourceDonut.style.background =
    `conic-gradient(${gradientParts.join(", ")})`;

  // Create source list
  sourceList.innerHTML = "";

  Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count], index) => {
      const percentage = Math.round(
        (count / total) * 100
      );

      const color =
        colors[source] ||
        fallbackColors[index % fallbackColors.length];

      const item = document.createElement("p");

      item.innerHTML = `
        <span
          class="dot"
          style="background:${color}"
        ></span>

        ${source}

        <b>${percentage}%</b>
      `;

      sourceList.appendChild(item);
    });
}
// ================= LEADS OVERVIEW CHART =================

function updateLeadsChart(leads) {
  const chartBars = document.getElementById("chartBars");

  if (!chartBars) return;

  chartBars.innerHTML = "";

  const days = [];

  // Get the last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const dateKey = date.toISOString().split("T")[0];

    days.push({
      label: date.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      dateKey,
      count: 0,
    });
  }

  // Count leads created each day
  leads.forEach((lead) => {
    if (!lead.createdAt) return;

    const leadDate = new Date(lead.createdAt)
      .toISOString()
      .split("T")[0];

    const day = days.find(
      (item) => item.dateKey === leadDate
    );

    if (day) {
      day.count++;
    }
  });

  const maxCount = Math.max(
    ...days.map((day) => day.count),
    1
  );

  // Create bars
  days.forEach((day) => {
    const height =
      (day.count / maxCount) * 150;

    const barItem = document.createElement("div");

    barItem.className = "bar-item";

    barItem.innerHTML = `
      <div class="bar-value">${day.count}</div>

      <div
        class="chart-bar"
        style="height: ${height}px"
      ></div>

      <span>${day.label}</span>
    `;

    chartBars.appendChild(barItem);
  });
}

loadLeads();
// ================= LEAD INTELLIGENCE =================

function updateLeadIntelligence(leads) {
  const total = leads.length;

  // No leads yet
  if (total === 0) {
    document.getElementById("healthScore").textContent = "0";
    document.getElementById("hotLeadCount").textContent = "0 Hot Leads";
    document.getElementById("bestSource").textContent = "No data yet";
    document.getElementById("conversionRate").textContent = "0%";
    document.getElementById("smartInsight").textContent =
      "Add leads to receive intelligent business insights.";
    return;
  }

  // Status counts
  const newCount = leads.filter(
    (lead) => lead.status === "New"
  ).length;

  const contactedCount = leads.filter(
    (lead) => lead.status === "Contacted"
  ).length;

  const convertedCount = leads.filter(
    (lead) => lead.status === "Converted"
  ).length;

  // Hot Leads:
  // New and Contacted leads are potential active opportunities
  const hotLeads = newCount + contactedCount;

  // Conversion Rate
  const conversionRate = Math.round(
    (convertedCount / total) * 100
  );

  // Find Best Source
  const sourceCount = {};

  leads.forEach((lead) => {
    sourceCount[lead.source] =
      (sourceCount[lead.source] || 0) + 1;
  });

  const bestSource = Object.keys(sourceCount).reduce(
    (best, source) =>
      sourceCount[source] > sourceCount[best]
        ? source
        : best
  );

  // Lead Health Score
  const healthScore = Math.round(
    ((convertedCount * 100) +
      (contactedCount * 70) +
      (newCount * 40)) /
      total
  );

  // Update Dashboard
  document.getElementById("healthScore").textContent =
    healthScore;

  document.getElementById("hotLeadCount").textContent =
    `${hotLeads} Hot Lead${hotLeads !== 1 ? "s" : ""}`;

  document.getElementById("bestSource").textContent =
    bestSource;

  document.getElementById("conversionRate").textContent =
    `${conversionRate}%`;

  // Smart Insight
  let insight = "";

  if (newCount > 0) {
    insight =
      `⚡ ${newCount} new lead${newCount !== 1 ? "s are" : " is"} waiting for your attention. Contact them quickly to improve conversion chances.`;
  } else if (convertedCount > 0) {
    insight =
      `🎉 Great work! You have successfully converted ${convertedCount} lead${convertedCount !== 1 ? "s" : ""}.`;
  } else if (contactedCount > 0) {
    insight =
      `📞 You have ${contactedCount} active contacted lead${contactedCount !== 1 ? "s" : ""}. Follow up to move them toward conversion.`;
  } else {
    insight =
      "Keep adding and managing leads to generate smarter insights.";
  }

  document.getElementById("smartInsight").textContent =
    insight;
}
function displayFollowUps(leads) {
  const overdueContainer = document.getElementById("overdueFollowups");
  const todayContainer = document.getElementById("todayFollowups");
  const upcomingContainer = document.getElementById("upcomingFollowups");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = [];
  const todayFollowUps = [];
  const upcoming = [];

  leads.forEach((lead) => {
    if (!lead.followUpDate || lead.followUpCompleted) return;

    const followUpDate = new Date(lead.followUpDate);
    followUpDate.setHours(0, 0, 0, 0);

    if (followUpDate < today) {
      overdue.push(lead);
    } else if (followUpDate.getTime() === today.getTime()) {
      todayFollowUps.push(lead);
    } else {
      upcoming.push(lead);
    }
  });

  function createFollowUpHTML(leads, emptyMessage) {
    if (leads.length === 0) {
      return `<p class="empty-followup">${emptyMessage}</p>`;
    }

    return leads.map((lead) => `
  <div class="followup-item">
    <strong>${lead.name}</strong>
    <span>${lead.email}</span>
    <small>📅 ${new Date(lead.followUpDate).toLocaleDateString()}</small>

    <button class="complete-followup-btn" data-id="${lead._id}">
      ✓ Mark Complete
    </button>
  </div>
`).join("");
  }

  overdueContainer.innerHTML = createFollowUpHTML(
    overdue,
    "No overdue follow-ups 🎉"
  );

  todayContainer.innerHTML = createFollowUpHTML(
    todayFollowUps,
    "No follow-ups for today"
  );

  upcomingContainer.innerHTML = createFollowUpHTML(
    upcoming,
    "No upcoming follow-ups"
  );
}
document.addEventListener("click", async (event) => {
  if (!event.target.classList.contains("complete-followup-btn")) return;

  const leadId = event.target.dataset.id;

  try {
    const response = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        followUpCompleted: true,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to complete follow-up");
    }

    await loadLeads();

  } catch (error) {
    console.error("Error completing follow-up:", error);
    alert("Could not complete the follow-up.");
  }
});
function updateAnalytics(leads) {
  const totalLeads = leads.length;

  // Total Leads
  document.getElementById("analyticsTotalLeads").textContent = totalLeads;


  // Conversion Rate
  const convertedLeads = leads.filter(
    (lead) => lead.status === "Converted"
  ).length;

  const conversionRate =
    totalLeads === 0
      ? 0
      : Math.round((convertedLeads / totalLeads) * 100);

  document.getElementById(
    "analyticsConversionRate"
  ).textContent = `${conversionRate}%`;


  // Best Source
  const sourceCounts = {};

  leads.forEach((lead) => {
    sourceCounts[lead.source] =
      (sourceCounts[lead.source] || 0) + 1;
  });

  let bestSource = "No data";
  let highestCount = 0;

  Object.keys(sourceCounts).forEach((source) => {
    if (sourceCounts[source] > highestCount) {
      highestCount = sourceCounts[source];
      bestSource = source;
    }
  });

  document.getElementById(
    "analyticsBestSource"
  ).textContent = bestSource;


  // Pending Follow-ups
  const pendingFollowUps = leads.filter(
    (lead) =>
      lead.followUpDate &&
      !lead.followUpCompleted
  ).length;

  document.getElementById(
    "analyticsPendingFollowups"
  ).textContent = pendingFollowUps;
}
// ================= CALENDAR =================

let currentCalendarDate = new Date();

function renderCalendar() {
  const calendarDays = document.getElementById("calendarDays");
  const calendarMonth = document.getElementById("calendarMonth");

  if (!calendarDays || !calendarMonth) return;

  calendarDays.innerHTML = "";

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  // Month title
  calendarMonth.textContent = new Date(
    year,
    month
  ).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // First day and total days
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Empty spaces before the first day
  for (let i = 0; i < firstDay; i++) {
    const emptyDay = document.createElement("div");
    emptyDay.classList.add("calendar-empty");
    calendarDays.appendChild(emptyDay);
  }

  // Create calendar dates
  for (let day = 1; day <= totalDays; day++) {
    const dayElement = document.createElement("button");

    dayElement.classList.add("calendar-day");
    dayElement.textContent = day;

    const dateKey = new Date(
      year,
      month,
      day
    ).toDateString();

    // Check if any lead has a follow-up on this date
    const hasFollowUp = allLeads.some((lead) => {
      if (!lead.followUpDate || lead.followUpCompleted) {
        return false;
      }

      return new Date(lead.followUpDate).toDateString() === dateKey;
    });

    if (hasFollowUp) {
      dayElement.classList.add("has-followup");
    }

    // Click a date
    dayElement.addEventListener("click", () => {
      showCalendarFollowUps(year, month, day);
    });

    calendarDays.appendChild(dayElement);
  }
}


// Show follow-ups for selected date
function showCalendarFollowUps(year, month, day) {
  const selectedDateTitle = document.getElementById(
    "selectedDateTitle"
  );

  const calendarFollowups = document.getElementById(
    "calendarFollowups"
  );

  const selectedDate = new Date(year, month, day);

  selectedDateTitle.textContent =
    selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const selectedLeads = allLeads.filter((lead) => {
    if (!lead.followUpDate || lead.followUpCompleted) {
      return false;
    }

    return (
      new Date(lead.followUpDate).toDateString() ===
      selectedDate.toDateString()
    );
  });

  if (selectedLeads.length === 0) {
    calendarFollowups.innerHTML = `
      <p class="empty-followup">
        No follow-ups scheduled for this date.
      </p>
    `;
    return;
  }

  calendarFollowups.innerHTML = selectedLeads
    .map(
      (lead) => `
        <div class="followup-item">
          <strong>${lead.name}</strong>
          <span>${lead.email}</span>
          <small>📅 ${new Date(
            lead.followUpDate
          ).toLocaleDateString()}</small>
        </div>
      `
    )
    .join("");
}


// Previous month
document.getElementById("prevMonth")?.addEventListener(
  "click",
  () => {
    currentCalendarDate.setMonth(
      currentCalendarDate.getMonth() - 1
    );

    renderCalendar();
  }
);


// Next month
document.getElementById("nextMonth")?.addEventListener(
  "click",
  () => {
    currentCalendarDate.setMonth(
      currentCalendarDate.getMonth() + 1
    );

    renderCalendar();
  }
);


// Render calendar when page loads
document.addEventListener("DOMContentLoaded", () => {
  renderCalendar();
});
// ================= SETTINGS =================

const adminNameInput = document.getElementById("adminName");
const workspaceNameInput = document.getElementById("workspaceName");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const settingsMessage = document.getElementById("settingsMessage");

const sidebarAdminName = document.getElementById("sidebarAdminName");
const sidebarWorkspaceName = document.getElementById("sidebarWorkspaceName");
const greetingName = document.getElementById("greetingName");


// Load saved settings
function loadSettings() {
  const savedAdminName = localStorage.getItem("adminName");
  const savedWorkspaceName = localStorage.getItem("workspaceName");

  if (savedAdminName) {
    adminNameInput.value = savedAdminName;
    sidebarAdminName.textContent = savedAdminName;
    greetingName.textContent = savedAdminName;

  }

  if (savedWorkspaceName) {
    workspaceNameInput.value = savedWorkspaceName;
    sidebarWorkspaceName.textContent = savedWorkspaceName;
  }
}


// Save settings
saveSettingsBtn.addEventListener("click", () => {

  const adminName = adminNameInput.value.trim();
  const workspaceName = workspaceNameInput.value.trim();

  if (!adminName || !workspaceName) {
    settingsMessage.textContent =
      "Please fill in both fields.";
    return;
  }

  // Save in browser
  localStorage.setItem("adminName", adminName);
  localStorage.setItem("workspaceName", workspaceName);

  // Update sidebar immediately
  sidebarAdminName.textContent = adminName;
  sidebarWorkspaceName.textContent = workspaceName;
  greetingName.textContent = adminName;

  settingsMessage.textContent =
    "✓ Settings saved successfully!";
});


// Load settings when page opens
loadSettings();
// ================= CURRENT DATE =================

function updateCurrentDate() {
  const currentDate = document.getElementById("currentDate");

  if (!currentDate) return;

  const today = new Date();

  currentDate.textContent =
    "📅 " +
    today.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
}

updateCurrentDate();
// ================= SCROLL REVEAL =================

function setupScrollReveal() {
  const revealElements = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    },
    {
      threshold: 0.12,
    }
  );

  revealElements.forEach((element) => {
    observer.observe(element);
  });
}

setupScrollReveal();