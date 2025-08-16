// Snow generator
(function makeSnow(){
  const snow = document.getElementById('snow');
  if (!snow) return;
  const COUNT = 100;
  for (let i = 0; i < COUNT; i++) {
    const f = document.createElement('div');
    f.className = 'snowflake';
    const size = (Math.random() * 4 + 2).toFixed(1);      // 2–6px
    const left = (Math.random() * 100).toFixed(2) + 'vw';
    const delay = (Math.random() * 10).toFixed(2) + 's';
    const dur = (Math.random() * 10 + 10).toFixed(2) + 's'; // 10–20s
    const drift = ((Math.random() * 60 - 30).toFixed(1)) + 'px'; // -30..30
    const op = (Math.random() * 0.5 + 0.45).toFixed(2);   // 0.45–0.95
    f.style.left = left;
    f.style.setProperty('--size', size + 'px');
    f.style.setProperty('--delay', delay);
    f.style.setProperty('--dur', dur);
    f.style.setProperty('--drift', drift);
    f.style.setProperty('--op', op);
    snow.appendChild(f);
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  // Helpers to read CSS vars for consistent chart colors
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // Build unique keys and restore from localStorage
  const STORAGE_KEY = 'chapterStatusV1';
  const checkboxes = Array.from(document.querySelectorAll('.chapter-checkbox'));

  // Compute a unique data-key if not preset
  checkboxes.forEach(cb => {
    if (!cb.dataset.key) {
      const subj = cb.dataset.subject || 'Unknown';
      const chapter = (cb.parentElement?.textContent || '').replace(/\s+/g,' ').trim();
      cb.dataset.key = `${subj}::${chapter}`;
    }
  });

  // Restore saved state
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const set = new Set(saved);
    checkboxes.forEach(cb => {
      if (set.has(cb.dataset.key)) cb.checked = true;
    });
  } catch(e){ /* ignore */ }

  // Charts
  const ctx1 = document.getElementById('progressChart').getContext('2d');
  const ctx2 = document.getElementById('overallChart').getContext('2d');

  const subjectChart = new Chart(ctx1, {
    type: 'pie',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          cssVar('--c1'), cssVar('--c2'), cssVar('--c3'), cssVar('--c4'),
          cssVar('--c5'), cssVar('--c6'), cssVar('--c7'), cssVar('--c8')
        ],
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { color: cssVar('--text') } } }
    }
  });

  const overallChart = new Chart(ctx2, {
    type: 'pie',
    data: {
      labels: ['Done', 'Remaining'],
      datasets: [{
        data: [0, 100],
        backgroundColor: [cssVar('--green'), cssVar('--red')],
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { color: cssVar('--text') } } }
    }
  });

  function updateCharts() {
    const subjects = {};
    let doneTotal = 0, totalChapters = 0;

    checkboxes.forEach(cb => {
      const subj = cb.dataset.subject || 'Unknown';
      subjects[subj] = subjects[subj] || { done: 0, total: 0 };
      subjects[subj].total++;
      totalChapters++;
      if (cb.checked) {
        subjects[subj].done++;
        doneTotal++;
      }
    });
// Update counters
document.querySelectorAll('.counter').forEach(span => {
  const subj = span.dataset.subject;
  if (subjects[subj]) {
    span.textContent = `(${subjects[subj].done} / ${subjects[subj].total})`;
  }
});

    // Subject-wise percentages
    const labels = [];
    const data1 = [];
    Object.keys(subjects).forEach(subj => {
      const { done, total } = subjects[subj];
      const pct = total ? Math.round((done / total) * 100) : 0;
      labels.push(`${subj} (${pct}%)`);
      data1.push(pct);
    });

    subjectChart.data.labels = labels;
    subjectChart.data.datasets[0].data = data1;
    subjectChart.update();

    // Overall done vs remaining
    overallChart.data.datasets[0].data = [doneTotal, totalChapters - doneTotal];
    overallChart.update();
  }

  // Save on change + update charts
  function handleChange() {
    const checkedKeys = checkboxes.filter(cb => cb.checked).map(cb => cb.dataset.key);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedKeys));
    updateCharts();
  }

  checkboxes.forEach(cb => cb.addEventListener('change', handleChange));

  // Initial draw
  updateCharts();

  // Toggle charts
  const btn = document.getElementById('toggleChart');
  const subjDiv = document.getElementById('chart-container');
  const overallDiv = document.getElementById('overall-chart-container');

  btn.addEventListener('click', () => {
    const showingSubj = subjDiv.style.display !== 'none';
    subjDiv.style.display = showingSubj ? 'none' : 'block';
    overallDiv.style.display = showingSubj ? 'block' : 'none';
    btn.textContent = showingSubj ? 'Show Subject Breakdown' : 'Show Overall Progress';
  });
});
// Chapter search
document.getElementById('searchBox').addEventListener('input', e => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll('ul li').forEach(li => {
    const text = li.textContent.toLowerCase();
    li.style.display = text.includes(term) ? '' : 'none';
  });
});