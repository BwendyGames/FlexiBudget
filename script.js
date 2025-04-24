// Enhanced FlexiBudget script.js with smooth sliders and percentage display
const form = document.getElementById('budget-form');
const budgetList = document.getElementById('budget-list');
const exportButton = document.getElementById('export-json');
const importInput = document.getElementById('import-json');
const categoryList = document.getElementById('category-list');
const categorySliders = document.getElementById('category-sliders');
const displayedRange = document.getElementById('displayed-range');

let daysData = [];
let categories = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Miscellaneous'];
let categoryTotals = {};

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const totalBudget = parseFloat(document.getElementById('total-budget').value);
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = (end - start) / (1000 * 60 * 60 * 24) + 1;

  displayedRange.textContent = `${start.toDateString()} - ${end.toDateString()}`;

  const defaultSplit = 1 / categories.length;
  categoryTotals = {};
  categories.forEach(cat => categoryTotals[cat] = totalBudget * defaultSplit);

  document.getElementById('displayed-budget').textContent = totalBudget.toFixed(2);
  document.getElementById('budget-summary').classList.remove('hidden');

  daysData = [];
  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const dayLabel = `${currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} (${currentDate.toLocaleDateString(undefined, { weekday: 'long' })})`;

    const dailySplit = {};
    categories.forEach(cat => dailySplit[cat] = categoryTotals[cat] / totalDays);

    daysData.push({
      label: dayLabel,
      date: currentDate.toISOString().split('T')[0],
      categories: dailySplit,
      total: totalBudget / totalDays,
      locked: false,
      editing: false
    });
  }

  createCategoryDisplay();
  createDisplay();
});

function createCategoryDisplay() {
  categoryList.innerHTML = '';
  categorySliders.innerHTML = '';
  const totalBudget = parseFloat(document.getElementById('total-budget').value);

  categories.forEach((cat) => {
    const div = document.createElement('div');
    const percent = (categoryTotals[cat] / totalBudget) * 100;
    div.textContent = `${cat}: $${categoryTotals[cat].toFixed(2)} (${percent.toFixed(1)}%)`;
    categoryList.appendChild(div);

    const row = document.createElement('div');
    row.className = 'slider-row';

    const label = document.createElement('label');
    label.textContent = `${cat}: `;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = 0;
    input.max = 100;
    input.step = 0.1;
    input.value = percent;
    input.style.width = '200px';

    const output = document.createElement('span');
    output.textContent = `${percent.toFixed(1)}%`;

    input.addEventListener('input', () => {
      const newPercent = parseFloat(input.value) / 100;
      output.textContent = `${(newPercent * 100).toFixed(1)}%`;
      adjustCategoryTotals(cat, newPercent, totalBudget);
      updateLiveCategoryDisplay();
    });

    row.appendChild(label);
    row.appendChild(input);
    row.appendChild(output);
    categorySliders.appendChild(row);
  });

  updateCategoryChart();
  document.getElementById('category-section').classList.remove('hidden');
}

function updateLiveCategoryDisplay() {
  const totalBudget = parseFloat(document.getElementById('total-budget').value);
  const divs = categoryList.querySelectorAll('div');
  categories.forEach((cat, i) => {
    const percent = (categoryTotals[cat] / totalBudget) * 100;
    if (divs[i]) {
      divs[i].textContent = `${cat}: $${categoryTotals[cat].toFixed(2)} (${percent.toFixed(1)}%)`;
    }
  });
  updateCategoryChart();
}

function adjustCategoryTotals(changedCat, newPercent, totalBudget) {
  const oldPercent = categoryTotals[changedCat] / totalBudget;
  const delta = newPercent - oldPercent;
  categoryTotals[changedCat] = newPercent * totalBudget;

  const others = categories.filter(c => c !== changedCat);
  const totalOther = others.reduce((sum, c) => sum + categoryTotals[c], 0);

  others.forEach(c => {
    categoryTotals[c] = categoryTotals[c] * (1 - delta / totalOther);
  });

  normalizeCategoryTotals(totalBudget);
}

function normalizeCategoryTotals(totalBudget) {
  const total = categories.reduce((sum, c) => sum + categoryTotals[c], 0);
  categories.forEach(c => {
    categoryTotals[c] = (categoryTotals[c] / total) * totalBudget;
  });
}

function updateCategoryChart() {
  const ctx = document.getElementById('category-chart').getContext('2d');
  const data = {
    labels: categories,
    datasets: [{
      data: categories.map(cat => categoryTotals[cat]),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#8BC34A', '#9C27B0']
    }]
  };
  if (window.categoryChart) {
    window.categoryChart.data = data;
    window.categoryChart.update();
  } else {
    window.categoryChart = new Chart(ctx, {
      type: 'pie',
      data
    });
  }
}

function createDisplay() {
  budgetList.innerHTML = '';

  daysData.forEach((day, index) => {
    const div = document.createElement('div');
    div.className = 'budget-item';
    const title = document.createElement('h4');
    title.textContent = day.label;
    div.appendChild(title);

    if (!day.editing) {
      const totalText = document.createElement('p');
      totalText.textContent = `Total: $${day.total.toFixed(2)}`;
      div.appendChild(totalText);
      
      const canvas = document.createElement('canvas');
      canvas.id = `day-chart-${index}`;
      canvas.width = 300;
      canvas.height = 300;
      div.appendChild(canvas);
      
      const chart = new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
          labels: categories,
          datasets: [{
            data: categories.map(cat => day.categories[cat]),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#8BC34A', '#9C27B0']
          }]
        },
        options: {
          plugins: {
            legend: {
              display: true,
              position: 'right',
              labels: {
                boxWidth: 12,
                padding: 8
              }
            }
            
          }
        }
      });
    } else {
      // --- Total Day Budget Editor ---
      const totalContainer = document.createElement('div');
      totalContainer.style.display = 'flex';
      totalContainer.style.alignItems = 'center';
      totalContainer.style.gap = '0.5rem';
      totalContainer.style.marginBottom = '1rem';
    
      const totalLabel = document.createTextNode('Day Budget: ');
    
      const totalSlider = document.createElement('input');
      totalSlider.type = 'range';
      totalSlider.min = 0;
      totalSlider.max = 1000;
      totalSlider.step = 0.1;
      totalSlider.value = day.total;
      totalSlider.style.width = '150px';
    
      const totalInput = document.createElement('input');
      totalInput.type = 'number';
      totalInput.min = 0;
      totalInput.step = 0.1;
      totalInput.value = day.total.toFixed(2);
      totalInput.style.width = '60px';
      totalInput.style.padding = '4px';
    
      const updateTotal = (newVal) => {
        const newTotal = parseFloat(newVal);
        const ratio = newTotal / day.total;
        day.total = newTotal;
    
        // Scale categories proportionally
        categories.forEach(cat => {
          day.categories[cat] *= ratio;
        });
    
        totalSlider.value = newTotal;
        totalInput.value = newTotal.toFixed(2);
        createDisplay(); // Re-render to update category sliders
      };
    
      totalSlider.addEventListener('input', () => {
        updateTotal(totalSlider.value);
      });
    
      totalInput.addEventListener('change', () => {
        updateTotal(totalInput.value);
      });
    
      totalContainer.appendChild(totalLabel);
      totalContainer.appendChild(totalSlider);
      totalContainer.appendChild(totalInput);
      div.appendChild(totalContainer);
    
      // --- Category Sliders + Manual Inputs ---
      categories.forEach(cat => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '0.5rem';
        row.style.marginBottom = '0.5rem';
    
        const label = document.createElement('label');
        label.textContent = `${cat}: `;
        label.style.width = '100px';
    
        const input = document.createElement('input');
        input.type = 'range';
        input.min = 0;
        input.max = day.total;
        input.step = 0.1;
        input.value = day.categories[cat];
        input.style.width = '150px';
    
        const numberInput = document.createElement('input');
        numberInput.type = 'number';
        numberInput.min = 0;
        numberInput.step = 0.1;
        numberInput.value = day.categories[cat].toFixed(2);
        numberInput.style.width = '60px';
        numberInput.style.padding = '4px';
    
        const updateCategory = (value) => {
          const floatVal = parseFloat(value);
          day.categories[cat] = floatVal;
          input.value = floatVal;
          numberInput.value = floatVal.toFixed(2);
          updateLiveDayDisplay(index, day);
        };
    
        input.addEventListener('input', () => {
          updateCategory(input.value);
        });
    
        numberInput.addEventListener('change', () => {
          updateCategory(numberInput.value);
        });
    
        row.appendChild(label);
        row.appendChild(input);
        row.appendChild(numberInput);
        div.appendChild(row);
      });
    }
    

    const editBtn = document.createElement('button');
    editBtn.textContent = day.editing ? 'Done' : 'Edit';
    editBtn.addEventListener('click', () => {
      day.editing = !day.editing;
      createDisplay();
    });
    div.appendChild(editBtn);

    const lockBtn = document.createElement('button');
    lockBtn.textContent = day.locked ? 'Unlock' : 'Lock';
    lockBtn.addEventListener('click', () => {
      day.locked = !day.locked;
      createDisplay();
    });
    div.appendChild(lockBtn);

    budgetList.appendChild(div);
  });
}

function updateLiveDayDisplay(index, day) {
  // In future we could update just the numeric parts live if needed
  // but for now this placeholder supports future expansion
}

function updateDayCategories(day) {
  const perCat = day.total / categories.length;
  categories.forEach(cat => {
    day.categories[cat] = perCat;
  });
}
exportButton.addEventListener('click', () => {
  const totalBudget = parseFloat(document.getElementById('total-budget').value);
  const exportData = {
    totalBudget,
    days: daysData,
    categoryTotals
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

      // Extract core values
      const totalBudget = importedData.totalBudget;
      daysData = importedData.days;
      categoryTotals = importedData.categoryTotals || {};

      // Update input field for visual consistency
      document.getElementById('total-budget').value = totalBudget;

      // Set total budget display
      document.getElementById('displayed-budget').textContent = totalBudget.toFixed(2);

      // Set date range display
      const firstDate = new Date(daysData[0].date);
      const lastDate = new Date(daysData[daysData.length - 1].date);
      document.getElementById('displayed-range').textContent = `${firstDate.toDateString()} - ${lastDate.toDateString()}`;

      // Show hidden UI elements
      document.getElementById('budget-summary').classList.remove('hidden');
      document.getElementById('category-section').classList.remove('hidden');
      document.getElementById('budget-list').classList.remove('hidden');

      // Render everything
      createCategoryDisplay();
      createDisplay();
    } catch (err) {
      alert('Invalid JSON file.');
    }
  };

  reader.readAsText(file);
});
