const subscriptions = {
  Basic: 5,
  Standard: 15,
  Premium: 30,
  Custom: 0,
};


let usdToRwfRate = 0;
let selectedCurrency = "RWF";
let selectedCurrencySymbol = "RWF";


const currencySymbols = {
  RWF: "RWF",
  EUR: "€",
  GBP: "£",
  KES: "KSh",
  UGX: "USh",
  TZS: "TSh",
  NGN: "₦",
  ZAR: "R",
  USD: "$",
  CAD: "CA$",
  AUD: "A$",
  INR: "₹",
  JPY: "¥",
  CNY: "¥",
  BRL: "R$",
  CZK: "Kč",
  PLN: "zł",
  DKK: "kr",
};


const userCountInput = document.getElementById("userCount");
const customPriceInput = document.getElementById("customPrice");
const currencySelect = document.getElementById("currencySelect");
const resultsBody = document.getElementById("resultsBody");
const saveBtn = document.getElementById("saveBtn");
const savedTablesContainer = document.getElementById("savedTables");
const filterInput = document.getElementById("filterInput");
const clearFilterBtn = document.getElementById("clearFilterBtn");
const refreshRateBtn = document.getElementById("refreshRateBtn");


async function fetchExchangeRate() {
  const exchangeInfoEl = document.querySelector(".exchange-info");
  exchangeInfoEl.textContent = `Fetching latest exchange rate...`;

  try {
    
    selectedCurrency = currencySelect.value;
    selectedCurrencySymbol =
      currencySymbols[selectedCurrency] || selectedCurrency;

    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/USD`
    );
    const data = await response.json();

    if (data && data.rates && data.rates[selectedCurrency]) {
      usdToRwfRate = data.rates[selectedCurrency]; 

      if (exchangeInfoEl) {
        const date = new Date().toLocaleDateString();
        exchangeInfoEl.textContent = `Current exchange rate: 1 USD = ${usdToRwfRate.toFixed(
          2
        )} ${selectedCurrency} (as of ${date})`;
      }

      renderTable();
      showNotification("Exchange rate updated!", "#3498db");
    }
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    exchangeInfoEl.textContent = `Current exchange rate: 1 USD = ${usdToRwfRate.toFixed(
      2
    )} ${selectedCurrency} (could not update)`;
    showNotification(
      "Could not update exchange rate. Using default rate.",
      "#e74c3c"
    );
  }
}

function showNotification(message, bgColor) {
  const notification = document.createElement("div");
  notification.style.position = "fixed";
  notification.style.bottom = "20px";
  notification.style.right = "20px";
  notification.style.backgroundColor = bgColor;
  notification.style.color = "white";
  notification.style.padding = "15px 20px";
  notification.style.borderRadius = "5px";
  notification.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
  notification.style.zIndex = "1000";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transition = "opacity 0.5s";
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

function loadData() {
  const savedUsers = localStorage.getItem("userCount");
  const savedCustom = localStorage.getItem("customPrice");
  const savedCurrency = localStorage.getItem("selectedCurrency");

  if (savedUsers) userCountInput.value = savedUsers;
  if (savedCustom) customPriceInput.value = savedCustom;
  if (
    savedCurrency &&
    document.querySelector(`#currencySelect option[value="${savedCurrency}"]`)
  ) {
    currencySelect.value = savedCurrency;
    selectedCurrency = savedCurrency;
    selectedCurrencySymbol =
      currencySymbols[selectedCurrency] || selectedCurrency;
  }

  fetchExchangeRate();
}

function saveData() {
  localStorage.setItem("userCount", userCountInput.value);
  localStorage.setItem("customPrice", customPriceInput.value);
  localStorage.setItem("selectedCurrency", selectedCurrency);
}

function calculateFees(amount) {
  const flutterwaveFee = amount * 0.015;
  const vat = amount * 0.18;
  const youKeep = amount - flutterwaveFee - vat;
  const youKeepRwf = youKeep * usdToRwfRate;
  return {
    flutterwaveFee,
    vat,
    youKeep,
    youKeepRwf, 
  };
}

function getCurrentTableData() {
  const users = parseInt(userCountInput.value) || 0;
  subscriptions.Custom = parseFloat(customPriceInput.value) || 0;

  const rows = [];

  for (const [key, price] of Object.entries(subscriptions)) {
    const totalRevenue = users * price;
    if (totalRevenue === 0) continue;
    const fees = calculateFees(totalRevenue);

    rows.push({
      subscriptionType: key,
      pricePerUser: price,
      users: users,
      totalRevenue: totalRevenue,
      flutterwaveFee: fees.flutterwaveFee,
      vat: fees.vat,
      youKeep: fees.youKeep,
      youKeepRwf: fees.youKeepRwf,
    });
  }
  return rows;
}

function formatCompactNumber(number) {
  const isMobile = window.innerWidth <= 480;

  if (!isMobile) {
    return Math.round(number).toLocaleString();
  }

  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + "M";
  } else if (number >= 1000) {
    return (number / 1000).toFixed(1) + "K";
  } else {
    return Math.round(number);
  }
}

function updateTableHeaders() {
  const tableHeaders = document.querySelectorAll("th");
  const isMobile = window.innerWidth <= 768;

  const originalHeaders = [
    "Type",
    "Sub",
    "Users",
    "Revenue",
    "Gateway",
    "VAT",
    "Keep ($)",
    `Keep (${selectedCurrency})`,
  ];

  const mobileHeaders = [
    "Type",
    "Sub",
    "Users",
    "Rev",
    "GW",
    "VAT",
    "Keep($)",
    selectedCurrency,
  ];

  tableHeaders.forEach((header, i) => {
    if (i < originalHeaders.length) {
      header.textContent = isMobile ? mobileHeaders[i] : originalHeaders[i];
    }
  });
}

function renderTable() {
  saveData();

  const users = parseInt(userCountInput.value) || 0;
  subscriptions.Custom = parseFloat(customPriceInput.value) || 0;

  resultsBody.innerHTML = "";

  
  updateTableHeaders();

  for (const [key, price] of Object.entries(subscriptions)) {
    const totalRevenue = users * price;
    if (totalRevenue === 0) {
      resultsBody.innerHTML += `
            <tr>
                <td>${key}</td>
                <td>$${price.toFixed(2)}</td>
                <td>${users}</td>
                <td colspan="5" style="color:#999;">No users or price</td>
            </tr>
            `;
      continue;
    }

    const fees = calculateFees(totalRevenue);
    const rwfFormatted = formatCompactNumber(fees.youKeepRwf);

    resultsBody.innerHTML += `
        <tr>
            <td><strong>${key}</strong></td>
            <td>$${price.toFixed(2)}</td>
            <td>${users}</td>
            <td>$${totalRevenue.toFixed(2)}</td>
            <td class="fee-highlight">$${fees.flutterwaveFee.toFixed(2)}</td>
            <td class="fee-highlight">$${fees.vat.toFixed(2)}</td>
            <td class="price-highlight">$${fees.youKeep.toFixed(2)}</td>
            <td class="rwf-value">${selectedCurrencySymbol} ${rwfFormatted}</td>
        </tr>
        `;
  }

  updateResponsiveHeaders();
}

function saveCurrentTable() {
  const currentData = getCurrentTableData();
  if (currentData.length === 0) {
    alert("No valid data to save (users or prices missing)");
    return;
  }
  const savedData = JSON.parse(localStorage.getItem("savedTables") || "[]");
  savedData.push({
    id: Date.now(),
    data: currentData,
    exchangeRate: usdToRwfRate,
    currency: selectedCurrency,
    currencySymbol: selectedCurrencySymbol,
  });
  localStorage.setItem("savedTables", JSON.stringify(savedData));
  renderSavedTables();

  showNotification("Data saved successfully!", "#27ae60");
}

function deleteTable(tableId) {
  const savedData = JSON.parse(localStorage.getItem("savedTables") || "[]");
  const updatedData = savedData.filter((table) => table.id !== tableId);
  localStorage.setItem("savedTables", JSON.stringify(updatedData));
  renderSavedTables();

  showNotification("Table removed!", "#e74c3c");
}

function renderSavedTables() {
  const savedData = JSON.parse(localStorage.getItem("savedTables") || "[]");

  savedData.sort((a, b) => b.id - a.id);
  const filterValue = filterInput.value.trim();
  let filteredData = savedData;

  if (filterValue !== "") {
    const filterNum = parseInt(filterValue);
    if (!isNaN(filterNum)) {
      filteredData = savedData.filter((tableSet) => {
        return tableSet.data.some((row) => row.users === filterNum);
      });
    }
  }

  if (filteredData.length === 0) {
    savedTablesContainer.innerHTML = "<p>No saved data to display.</p>";
    return;
  }

  savedTablesContainer.innerHTML = "";
  for (const tableSet of filteredData) {
    const div = document.createElement("div");
    div.classList.add("saved-section");

    const usersCount =
      tableSet.data.length > 0 ? tableSet.data[0].users : "N/A";

    const headerDiv = document.createElement("div");
    headerDiv.className = "saved-header";

    const headerTitle = document.createElement("h3");
    headerTitle.textContent = `When subscribers are: ${usersCount}`;

    headerDiv.appendChild(headerTitle);
    div.appendChild(headerDiv);

    const tableCurrency = tableSet.currency || selectedCurrency;
    const tableCurrencySymbol =
      tableSet.currencySymbol || selectedCurrencySymbol;
    const tableExchangeRate = tableSet.exchangeRate || usdToRwfRate;

    const tableContainer = document.createElement("div");
    tableContainer.className = "table-container";
    tableContainer.style.position = "relative";
    div.appendChild(tableContainer);

    const tableElement = document.createElement("table");
    tableElement.innerHTML = `
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Sub</th>
                    <th>Users</th>
                    <th>Revenue</th>
                    <th>Gateway</th>
                    <th>VAT</th>
                    <th>Keep ($)</th>
                    <th>Keep (${tableCurrency})</th>
                </tr>
            </thead>
            <tbody>
                ${tableSet.data
                  .map((row) => {
                    const rwfValue = tableExchangeRate
                      ? row.youKeep * tableExchangeRate
                      : row.youKeepRwf || row.youKeep * usdToRwfRate;

                    const rwfFormatted = formatCompactNumber(rwfValue);

                    return `<tr>
                            <td><strong>${row.subscriptionType}</strong></td>
                            <td>$${row.pricePerUser.toFixed(2)}</td>
                            <td>${row.users}</td>
                            <td>$${row.totalRevenue.toFixed(2)}</td>
                            <td class="fee-highlight">$${row.flutterwaveFee.toFixed(
                              2
                            )}</td>
                            <td class="fee-highlight">$${row.vat.toFixed(
                              2
                            )}</td>
                            <td class="price-highlight">$${row.youKeep.toFixed(
                              2
                            )}</td>
                            <td class="rwf-value">${tableCurrencySymbol} ${rwfFormatted}</td>
                        </tr>`;
                  })
                  .join("")}
            </tbody>
        `;
    tableContainer.appendChild(tableElement);

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-table-btn";
    removeBtn.textContent = "X";
    removeBtn.dataset.id = tableSet.id;
    removeBtn.addEventListener("click", function () {
      deleteTable(parseInt(this.dataset.id));
    });
    tableContainer.appendChild(removeBtn);

    if (tableExchangeRate) {
      const rateInfo = document.createElement("div");
      rateInfo.className = "exchange-info";
      rateInfo.style.marginTop = "10px";
      rateInfo.style.fontSize = "0.85rem";
      rateInfo.textContent = `Exchange rate at time of saving: 1 USD = ${tableExchangeRate.toFixed(
        2
      )} ${tableCurrency}`;
      div.appendChild(rateInfo);
    }

    savedTablesContainer.appendChild(div);
  }

  updateResponsiveHeaders();
}

function updateResponsiveHeaders() {
  const tableHeaders = document.querySelectorAll("th");
  const isMobile = window.innerWidth <= 768;

  document.querySelectorAll("table").forEach((table) => {
    const headers = table.querySelectorAll("th");
    if (headers.length === 0) return;

    let tableCurrency = selectedCurrency;
    const lastHeader = headers[headers.length - 1].textContent;
    if (lastHeader.includes("(") && lastHeader.includes(")")) {
      tableCurrency = lastHeader.split("(")[1].split(")")[0];
    }

    const originalHeaders = [
      "Type",
      "Sub",
      "Users",
      "Revenue",
      "Gateway",
      "VAT",
      "Keep ($)",
      `Keep (${tableCurrency})`,
    ];

    const mobileHeaders = [
      "Type",
      "Sub",
      "Users",
      "Rev",
      "GW",
      "VAT",
      "Keep($)",
      tableCurrency,
    ];

    headers.forEach((header, i) => {
      if (i < originalHeaders.length) {
        header.textContent = isMobile ? mobileHeaders[i] : originalHeaders[i];
      }
    });
  });
}

userCountInput.addEventListener("input", renderTable);
customPriceInput.addEventListener("input", renderTable);
currencySelect.addEventListener("change", fetchExchangeRate);
saveBtn.addEventListener("click", saveCurrentTable);
filterInput.addEventListener("input", renderSavedTables);
clearFilterBtn.addEventListener("click", () => {
  filterInput.value = "";
  renderSavedTables();
});
refreshRateBtn.addEventListener("click", fetchExchangeRate);
window.addEventListener("resize", updateResponsiveHeaders);

loadData();
renderTable();
renderSavedTables();
