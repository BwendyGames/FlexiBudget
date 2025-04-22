const form = document.getElementById('budget-form');
const budgetList = document.getElementById('budget-list');
const exportButton = document.getElementById('export-json');
const importInput = document.getElementById('import-json');

let daysData = [];

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const totalBudget = parseFloat(document.getElementById('total-budget').value);
  const totalDays = parseInt(document.getElementById('total-days').value);

  const defaultPercent = 1 / totalDays;
  daysData = Array.from({ length: totalDays }, (_, i) => ({
    day: i + 1,
    percent: defaultPercent,
    days: totalDays,
    amount: (totalBudget * defaultPercent),
    locked: false,
    editing: false,
  }));

  createDisplay(totalBudget, totalDays);
});

function createDisplay(totalBudget, totalDays) {
  document.getElementById('displayed-budget').textContent = totalBudget.toFixed(2);
  document.getElementById('displayed-days').textContent = totalDays;

  budgetList.innerHTML = '';

  daysData.forEach((day, index) => {
    const div = document.createElement('div');
    div.className = 'budget-item';

    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '8px';
    label.style.flexWrap = 'wrap';

    if (day.editing) {
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = day.name || `Day ${day.day}`;
      nameInput.style.width = '120px';

      nameInput.addEventListener('input', () => {
        day.name = nameInput.value;
      });

      const dollarSign = document.createElement('span');
      dollarSign.innerText = '$';

      const amountInput = document.createElement('input');
      amountInput.type = 'number';
      amountInput.step = '0.01';
      amountInput.value = day.amount.toFixed(2);
      amountInput.style.width = '70px';

      const percentInput = document.createElement('input');
      percentInput.type = 'number';
      percentInput.step = '0.1';
      percentInput.value = (day.percent * 100).toFixed(1);
      percentInput.style.width = '60px';

      const percentLabel = document.createElement('span');
      percentLabel.innerText = '%';

      amountInput.addEventListener('change', () => {
        const newAmount = parseFloat(amountInput.value);
        const newPercent = newAmount / totalBudget;
        if (!day.locked) {
          adjustPercent(index, newPercent, totalBudget);
          updateLabels(totalBudget);
        }
      });

      percentInput.addEventListener('change', () => {
        const newPercent = parseFloat(percentInput.value) / 100;
        if (!day.locked) {
          adjustPercent(index, newPercent, totalBudget);
          updateLabels(totalBudget);
        }
      });

      label.append(nameInput, dollarSign, amountInput, percentInput, percentLabel);
    } else {
      label.textContent = formatDayLabel(day, totalBudget);
    }

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = 100;
    slider.step = 0.1;
    slider.value = day.percent * 100;
    slider.dataset.index = index;

    slider.addEventListener('input', () => {
      if (!day.locked) {
        const newPercent = parseFloat(slider.value) / 100;
        adjustPercent(index, newPercent, totalBudget);
        updateLabels(totalBudget, totalDays);
      }
    });

    const lockButton = document.createElement('button');
    lockButton.textContent = day.locked ? 'Unlock' : 'Lock';
    lockButton.className = day.locked ? 'locked' : 'unlocked';
    lockButton.addEventListener('click', () => toggleLock(index));

    const editButton = document.createElement('button');
    editButton.textContent = day.editing ? 'Done' : 'Edit';
    editButton.addEventListener('click', () => {
      daysData[index].editing = !daysData[index].editing;
      createDisplay(totalBudget, totalDays);
    });

    div.appendChild(label);
    div.appendChild(slider);
    div.appendChild(lockButton);
    div.appendChild(editButton);
    budgetList.appendChild(div);
  });
}

function toggleLock(index) {
  daysData[index].locked = !daysData[index].locked;
  const totalBudget = parseFloat(document.getElementById('total-budget').value);
  const totalDays = parseInt(document.getElementById('total-days').value);
  createDisplay(totalBudget, totalDays);
}

function formatDayLabel(day, totalBudget) {
  const amount = day.amount || (day.percent * totalBudget);
  return `${day.name || `Day ${day.day}`}: $${amount.toFixed(2)} (${(day.percent * 100).toFixed(1)}%)`;
}

function updateLabels(totalBudget) {
  const labels = budgetList.querySelectorAll('label');
  const sliders = budgetList.querySelectorAll('input[type="range"]');

  daysData.forEach((day, index) => {
    if (!day.editing) {
      labels[index].textContent = formatDayLabel(day, totalBudget);
    }
    sliders[index].value = day.percent * 100;
  });
}

function adjustPercent(changedIndex, newValue, totalBudget) {
  const oldPercent = daysData[changedIndex].percent;
  const delta = newValue - oldPercent;

  daysData[changedIndex].percent = newValue;

  const otherDays = daysData.filter((_, i) => i !== changedIndex && !daysData[i].locked);
  const totalOtherPercent = otherDays.reduce((sum, d) => sum + d.percent, 0);

  if (totalOtherPercent > 0) {
    daysData.forEach((day, i) => {
      if (i !== changedIndex && !day.locked) {
        const adjustmentRatio = day.percent / totalOtherPercent;
        day.percent = Math.max(0, day.percent - (delta * adjustmentRatio));
      }
    });
  }

  const total = daysData.reduce((sum, d) => sum + d.percent, 0);
  daysData.forEach(day => {
    day.percent = day.percent / total;
    day.amount = parseFloat((totalBudget * day.percent).toFixed(2));
  });
}

exportButton.addEventListener('click', () => {
  const totalBudget = parseFloat(document.getElementById('total-budget').value);
  const totalDays = parseInt(document.getElementById('total-days').value);
  const exportData = {
    totalBudget: totalBudget,
    totalDays: totalDays,
    days: daysData.map(day => ({
      day: day.day,
      name: day.name || `Day ${day.day}`,
      percent: parseFloat(day.percent.toFixed(2)),
      amount: parseFloat((totalBudget * day.percent).toFixed(2)),
    }))    
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'budget_data.json';
  a.click();
});

importInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedData = JSON.parse(event.target.result);
      const totalBudget = parseFloat(importedData.totalBudget) || 1;
      const totalDays = parseInt(importedData.totalDays);

      document.getElementById('total-budget').value = totalBudget;
      document.getElementById('total-days').value = totalDays;

      const importedDays = importedData.days;
      daysData = importedDays.map((day, i) => ({
        day: i + 1,
        name: day.name || `Day ${i + 1}`,
        percent: day.percent,
        amount: day.amount,
        locked: day.locked || false,
        editing: false,
        days: totalDays
      }));

      createDisplay(totalBudget, totalDays);
    } catch (err) {
      alert('Invalid JSON file.');
    }
  };
  reader.readAsText(file);
});

document.getElementById('source-code-button').addEventListener('click', () => {
  window.open('https://github.com/BwendyGames/FlexiBudget', '_blank');
});

const button = document.getElementById('toggle-ads-button');
  const adContainer = document.getElementById('ad-container');
  const toast = document.getElementById('ads-toast');

  // Load saved state or default to true (ads enabled)
  let adsEnabled = localStorage.getItem('adsEnabled');
  adsEnabled = adsEnabled === null ? true : JSON.parse(adsEnabled);

  // Initial render
  adContainer.style.display = adsEnabled ? 'block' : 'none';
  button.textContent = adsEnabled ? 'Disable Ads' : 'Enable Ads';

  button.addEventListener('click', () => {
    adsEnabled = !adsEnabled;

    // Save state
    localStorage.setItem('adsEnabled', JSON.stringify(adsEnabled));

    // Update UI
    adContainer.style.display = adsEnabled ? 'block' : 'none';
    button.textContent = adsEnabled ? 'Disable Ads' : 'Enable Ads';
    toast.textContent = adsEnabled ? 'Ads are now enabled, thank you for your support.' : 'Ads are now disabled. Thankyou for using my site, on all of my sites, ads are optional where present. Its not required but appreciated.';

    // Show popup
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  });