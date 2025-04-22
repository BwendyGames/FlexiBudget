const form = document.getElementById('budget-form');
const budgetList = document.getElementById('budget-list');
const exportButton = document.getElementById('export-json');
const importInput = document.getElementById('import-json');

let daysData = [];

// In the form submit event listener, pass both totalBudget and totalDays
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const totalBudget = parseFloat(document.getElementById('total-budget').value);
    const totalDays = parseInt(document.getElementById('total-days').value);
    
    const defaultPercent = 1 / totalDays;
    daysData = Array.from({ length: totalDays }, (_, i) => ({
      day: i + 1,
      percent: defaultPercent,
      days: totalDays,
      amount: (totalBudget * defaultPercent)
    }));
  
    createDisplay(totalBudget, totalDays); // Pass both parameters here
  });
  
  function createDisplay(totalBudget, totalDays) {
    // Update displayed total budget
    document.getElementById('displayed-budget').textContent = totalBudget.toFixed(2);
    document.getElementById('displayed-days').textContent = totalDays.toFixed(2);
  
    budgetList.innerHTML = '';
    
    daysData.forEach((day, index) => {
      const div = document.createElement('div');
      div.className = 'budget-item';
  
      const label = document.createElement('label');
      label.dataset.index = index;
      label.innerText = formatDayLabel(day, totalBudget, totalDays);

      // Create lock button
      const lockButton = document.createElement('button');
      lockButton.textContent = day.locked ? 'Unlock' : 'Lock';
      lockButton.dataset.index = index;
      lockButton.className = day.locked ? 'locked' : 'unlocked';
      lockButton.addEventListener('click', () => toggleLock(index));

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = 0;
      slider.max = 100;
      slider.step = 1;
      slider.value = (day.percent * 100).toFixed(0);
      slider.dataset.index = index;
  
      slider.addEventListener('input', (e) => {
        if (!day.locked) {  // Only allow adjusting if not locked
          const newPercent = parseFloat(slider.value) / 100;
          adjustPercent(index, newPercent, totalBudget);
          updateLabels(totalBudget, totalDays);
        }
      });
  
      div.appendChild(label);
      div.appendChild(slider);
      div.appendChild(lockButton);  // Add lock button next to each day
      budgetList.appendChild(div);
    });
}

function toggleLock(index) {
    // Toggle the locked state of the selected day
    daysData[index].locked = !daysData[index].locked;
    createDisplay(parseFloat(document.getElementById('total-budget').value), parseInt(document.getElementById('total-days').value));
}
  function formatDayLabel(day, totalBudget) {
    const amount = day.amount || (day.percent * totalBudget);
    return `Day ${day.day}: $${amount.toFixed(2)} (${(day.percent * 100).toFixed(1)}%)`;
  }

function updateLabels(totalBudget) {
    const labels = budgetList.querySelectorAll('label');
    const sliders = budgetList.querySelectorAll('input[type="range"]');
    
    daysData.forEach((day, index) => {
      labels[index].innerText = formatDayLabel(day, totalBudget);
      sliders[index].value = (day.percent * 100).toFixed(0);
    });
  }

  function adjustPercent(changedIndex, newValue, totalBudget) {
    const oldPercent = daysData[changedIndex].percent;
    const delta = newValue - oldPercent;
    
    // First, set the new value for the changed day
    daysData[changedIndex].percent = newValue;
    
    // Distribute the difference proportionally among other days that are not locked
    const otherDays = daysData.filter((_, i) => i !== changedIndex && !daysData[i].locked);
    const totalOtherPercent = otherDays.reduce((sum, d) => sum + d.percent, 0);
    
    if (totalOtherPercent > 0) {
      daysData.forEach((day, i) => {
        if (i !== changedIndex && !day.locked) {  // Skip locked days
          const adjustmentRatio = day.percent / totalOtherPercent;
          day.percent = Math.max(0, day.percent - (delta * adjustmentRatio));
        }
      });
    }
  
    // Normalize to ensure the sum of the percentages is exactly 1
    const total = daysData.reduce((sum, d) => sum + d.percent, 0);
    daysData.forEach(day => {
      day.percent = day.percent / total;
      // Recalculate and round amount correctly
      day.amount = parseFloat((totalBudget * day.percent).toFixed(2));
    });
}
  exportButton.addEventListener('click', () => {
    const totalBudget = parseFloat(document.getElementById('total-budget').value);
    const totalDays = parseInt(document.getElementById('total-days').value);
    const exportData = {
        totalDays: totalDays,
        days: daysData.map(day => ({
            day: day.day,
            percent: parseFloat(day.percent.toFixed(2)), // force 2 decimal places
            amount: parseFloat((totalBudget * day.percent).toFixed(2)) // also 2 decimal places
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
            const totalBudget = parseFloat(document.getElementById('total-budget').value) || 1;
            
            // Set the totalDays input value
            document.getElementById('total-days').value = importedData.totalDays;
            
            // Normalize the imported data
            const total = importedData.days.reduce((sum, d) => sum + d.percent, 0);
            const isNormalized = Math.abs(total - 1) < 0.00001;
            
            daysData = importedData.days.map(day => ({
                ...day
            }));
            
            createDisplay(totalBudget, importedData.totalDays);
        } catch (err) {
            alert('Invalid JSON file.');
        }
    };
    reader.readAsText(file);
});