// ─── 상태 ────────────────────────────────────────────────────
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentFilter = 'all';

// ─── 초기화 ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // 오늘 날짜를 기본값으로 설정
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;

  // 필터 버튼 이벤트
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderList();
    });
  });

  renderAll();
});

// ─── 내역 추가 ───────────────────────────────────────────────
function addTransaction() {
  const date        = document.getElementById('date').value.trim();
  const type        = document.getElementById('type').value;
  const category    = document.getElementById('category').value;
  const description = document.getElementById('description').value.trim();
  const amount      = parseFloat(document.getElementById('amount').value);
  const errorEl     = document.getElementById('error-msg');

  // 유효성 검사
  if (!date) {
    showError('날짜를 선택해 주세요.');
    return;
  }
  if (!description) {
    showError('항목명을 입력해 주세요.');
    return;
  }
  if (!amount || amount <= 0 || isNaN(amount)) {
    showError('올바른 금액을 입력해 주세요.');
    return;
  }

  errorEl.textContent = '';

  const transaction = {
    id: Date.now(),
    date,
    type,
    category,
    description,
    amount
  };

  transactions.push(transaction);
  saveToLocalStorage();
  renderAll();

  // 항목, 금액 필드 초기화
  document.getElementById('description').value = '';
  document.getElementById('amount').value = '';
}

// ─── 내역 삭제 ───────────────────────────────────────────────
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveToLocalStorage();
  renderAll();
}

// ─── 요약 업데이트 ───────────────────────────────────────────
function updateSummary() {
  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance      = totalIncome - totalExpense;

  document.getElementById('total-income').textContent  = formatCurrency(totalIncome);
  document.getElementById('total-expense').textContent = formatCurrency(totalExpense);

  const balanceEl = document.getElementById('balance');
  balanceEl.textContent = formatCurrency(Math.abs(balance));
  // 잔액이 음수면 빨간색으로 강조 (카드 색은 고정, 텍스트만 조정)
  balanceEl.style.color = balance < 0 ? '#fca5a5' : '#fff';
}

// ─── 목록 렌더링 ─────────────────────────────────────────────
function renderList() {
  const tbody   = document.getElementById('transaction-list');
  const emptyEl = document.getElementById('empty-msg');
  const table   = document.getElementById('transaction-table');

  const filtered = transactions
    .filter(t => currentFilter === 'all' || t.type === currentFilter)
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // 최신순 정렬

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    table.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }

  table.style.display = 'table';
  emptyEl.style.display = 'none';

  filtered.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(t.date)}</td>
      <td>${t.category}</td>
      <td>${escapeHtml(t.description)}</td>
      <td><span class="badge ${t.type}">${t.type === 'income' ? '수입' : '지출'}</span></td>
      <td class="amount-${t.type}">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</td>
      <td><button class="delete-btn" onclick="deleteTransaction(${t.id})">삭제</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── 전체 렌더 ───────────────────────────────────────────────
function renderAll() {
  updateSummary();
  renderList();
}

// ─── localStorage 저장 ───────────────────────────────────────
function saveToLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// ─── 유틸리티 ────────────────────────────────────────────────
function formatCurrency(amount) {
  return amount.toLocaleString('ko-KR') + '원';
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${y}.${m}.${d}`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showError(msg) {
  const errorEl = document.getElementById('error-msg');
  errorEl.textContent = msg;
  setTimeout(() => { errorEl.textContent = ''; }, 3000);
}
