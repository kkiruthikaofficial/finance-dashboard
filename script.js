// --- app state and persistence ---
let expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
let editingId = null;

// DOM refs
const titleEl = document.getElementById('title');
const amountEl = document.getElementById('amount');
const dateEl = document.getElementById('date');
const categoryEl = document.getElementById('category');
const listEl = document.getElementById('expense-list');
const filterCatEl = document.getElementById('filterCat');
const searchEl = document.getElementById('search');
const addBtn = document.getElementById('addBtn');
const cancelBtn = document.getElementById('cancelBtn');
const clearBtn = document.getElementById('clearAll');
const formTitle = document.getElementById('form-title');
const exportBtn = document.getElementById('exportBtn');

// save helper
function saveData() {
  localStorage.setItem('expenses', JSON.stringify(expenses));
}

// clear form
function clearForm() {
  titleEl.value = '';
  amountEl.value = '';
  dateEl.value = '';
  categoryEl.value = 'Food';
}

// add or update
function addOrUpdate() {
  const title = titleEl.value.trim();
  const amount = parseFloat(amountEl.value);
  const date = dateEl.value;
  const category = categoryEl.value;

  if (!title || !date || isNaN(amount) || amount <= 0) {
    alert('Enter valid Title, Amount (>0) and Date');
    return;
  }

  if (editingId) {
    // update
    expenses = expenses.map(e => e.id === editingId ? { ...e, title, amount, date, category } : e);
    editingId = null;
    addBtn.textContent = 'Add';
    cancelBtn.classList.add('hidden');
    formTitle.textContent = 'Add Expense';
  } else {
    expenses.push({ id: Date.now() + Math.floor(Math.random()*1000), title, amount, date, category });
  }

  saveData();
  clearForm();
  render();
}

// start edit
function startEdit(id) {
  const item = expenses.find(e => e.id === id);
  if (!item) return alert('Item not found');
  editingId = id;
  titleEl.value = item.title;
  amountEl.value = item.amount;
  dateEl.value = item.date;
  categoryEl.value = item.category;
  addBtn.textContent = 'Update';
  cancelBtn.classList.remove('hidden');
  formTitle.textContent = 'Edit Expense';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// cancel edit
function cancelEdit() {
  editingId = null;
  clearForm();
  addBtn.textContent = 'Add';
  cancelBtn.classList.add('hidden');
  formTitle.textContent = 'Add Expense';
}

// delete item
function deleteItem(id) {
  if (!confirm('Delete this expense?')) return;
  expenses = expenses.filter(e => e.id !== id);
  saveData();
  render();
}

// render categories
function populateCategories() {
  const base = ['Food','Bills','Shopping','Travel','Other'];
  const set = new Set([...base, ...expenses.map(e=>e.category)]);
  filterCatEl.innerHTML = '';
  const all = document.createElement('option'); all.value = 'All'; all.textContent='All categories'; filterCatEl.appendChild(all);
  Array.from(set).forEach(c => {
    const opt = document.createElement('option'); opt.value = c; opt.textContent = c; filterCatEl.appendChild(opt);
  });
}

// render list with filters
function render() {
  populateCategories();
  const q = (searchEl.value || '').trim().toLowerCase();
  const cat = filterCatEl.value || 'All';
  listEl.innerHTML = '';
  let visible = expenses.filter(e => {
    if (cat !== 'All' && e.category !== cat) return false;
    if (q) {
      const hay = `${e.title} ${e.category}`.toLowerCase();
      return hay.includes(q);
    }
    return true;
  });

  visible.sort((a,b) => new Date(b.date) - new Date(a.date));

  visible.forEach(e => {
    const tr = document.createElement('tr');

    const tdTitle = document.createElement('td'); tdTitle.textContent = e.title; tr.appendChild(tdTitle);
    const tdAmt = document.createElement('td'); tdAmt.textContent = `₹${e.amount.toFixed(2)}`; tr.appendChild(tdAmt);
    const tdDate = document.createElement('td'); tdDate.textContent = e.date; tr.appendChild(tdDate);
    const tdCat = document.createElement('td'); tdCat.textContent = e.category; tr.appendChild(tdCat);

    const tdActions = document.createElement('td');
    const btnEdit = document.createElement('button'); btnEdit.className='btn-edit'; btnEdit.textContent='Edit';
    btnEdit.onclick = () => startEdit(e.id);
    const btnDel = document.createElement('button'); btnDel.className='btn-delete'; btnDel.textContent='Delete';
    btnDel.onclick = () => deleteItem(e.id);
    tdActions.appendChild(btnEdit); tdActions.appendChild(btnDel);
    tr.appendChild(tdActions);

    listEl.appendChild(tr);
  });
}

// Export CSV (simple)
function exportCSV() {
  if (!expenses.length) return alert('No data');
  const headers = ['title','amount','date','category'];
  const rows = expenses.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g,'""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'expenses.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// wire events
addBtn.addEventListener('click', addOrUpdate);
cancelBtn.addEventListener('click', cancelEdit);
searchEl.addEventListener('input', render);
filterCatEl.addEventListener('change', render);
clearBtn.addEventListener('click', () => { if (confirm('Clear all?')) { expenses = []; saveData(); render(); }});
exportBtn.addEventListener('click', exportCSV);

// keep backward compatibility if inline onclick used somewhere: expose globals
window.startEdit = startEdit;
window.deleteItem = deleteItem;
window.addOrUpdateExpense = addOrUpdate; // safe alias for older HTML
window.cancelEdit = cancelEdit;

// initial render
render();
