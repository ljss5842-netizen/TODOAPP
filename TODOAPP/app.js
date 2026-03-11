// ========================================
// State Management
// ========================================
let tasks = [];
let currentFilter = 'all';
let searchQuery = '';

// ========================================
// DOM Elements
// ========================================
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const totalCount = document.getElementById('totalCount');
const activeCount = document.getElementById('activeCount');
const completedCount = document.getElementById('completedCount');
const prioritySelect = document.getElementById('prioritySelect');
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');
const filterBtns = document.querySelectorAll('.filter-btn');

// ========================================
// Initialize App
// ========================================
function init() {
    loadTasks();
    loadTheme();
    renderTasks();
    updateStats();
    attachEventListeners();
}

// ========================================
// Event Listeners
// ========================================
function attachEventListeners() {
    addBtn.addEventListener('click', handleAddTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddTask();
        }
    });

    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderTasks();
    });

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
}

// ========================================
// Theme Management
// ========================================
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    themeToggle.querySelector('.theme-icon').textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeToggle.querySelector('.theme-icon').textContent = '☀️';
    }
}

// ========================================
// Task Management Functions
// ========================================
function handleAddTask() {
    const taskText = taskInput.value.trim();

    if (taskText === '') {
        taskInput.classList.add('shake');
        setTimeout(() => taskInput.classList.remove('shake'), 500);
        return;
    }

    addTask(taskText, prioritySelect.value);
    taskInput.value = '';
    taskInput.focus();
}

function addTask(text, priority = 'medium') {
    const task = {
        id: Date.now(),
        text: text,
        completed: false,
        priority: priority,
        order: tasks.length,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(task);
    saveTasks();
    renderTasks();
    updateStats();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
}

function editTask(id, newText) {
    const task = tasks.find(t => t.id === id);
    if (task && newText.trim() !== '') {
        task.text = newText.trim();
        saveTasks();
        renderTasks();
    }
}

function updateTaskPriority(id, newPriority) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.priority = newPriority;
        saveTasks();
        renderTasks();
    }
}

// ========================================
// Rendering Functions
// ========================================
function renderTasks() {
    taskList.innerHTML = '';

    // Filter and search tasks
    let filteredTasks = tasks.filter(task => {
        // Apply filter
        if (currentFilter === 'active' && task.completed) return false;
        if (currentFilter === 'completed' && !task.completed) return false;

        // Apply search
        if (searchQuery && !task.text.toLowerCase().includes(searchQuery)) {
            return false;
        }

        return true;
    });

    // Sort by priority (high -> medium -> low) then by order
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    filteredTasks.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.order - b.order;
    });

    if (filteredTasks.length === 0) {
        emptyState.classList.add('visible');
        return;
    }

    emptyState.classList.remove('visible');

    filteredTasks.forEach(task => {
        const taskItem = createTaskElement(task);
        taskList.appendChild(taskItem);
    });
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.setAttribute('data-id', task.id);
    li.setAttribute('draggable', 'true');

    // Drag and drop events
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragend', handleDragEnd);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);

    // Priority badge
    const priorityBadge = document.createElement('span');
    priorityBadge.className = `priority-badge ${task.priority}`;
    priorityBadge.textContent = task.priority;
    priorityBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        cyclePriority(task.id);
    });

    // Checkbox
    const checkbox = document.createElement('div');
    checkbox.className = 'task-checkbox';
    checkbox.addEventListener('click', () => toggleTask(task.id));

    // Task text
    const taskText = document.createElement('span');
    taskText.className = 'task-text';

    // Highlight search matches
    if (searchQuery) {
        const regex = new RegExp(`(${searchQuery})`, 'gi');
        taskText.innerHTML = task.text.replace(regex, '<span class=\"search-highlight\">$1</span>');
    } else {
        taskText.textContent = task.text;
    }

    // Double-click to edit
    taskText.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        enterEditMode(li, task);
    });

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(task.id);
    });

    li.appendChild(priorityBadge);
    li.appendChild(checkbox);
    li.appendChild(taskText);
    li.appendChild(deleteBtn);

    return li;
}

function enterEditMode(taskItem, task) {
    const taskText = taskItem.querySelector('.task-text');
    const originalText = task.text;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = originalText;

    taskText.replaceWith(input);
    input.focus();
    input.select();

    const saveEdit = () => {
        const newText = input.value.trim();
        if (newText && newText !== originalText) {
            editTask(task.id, newText);
        } else {
            renderTasks();
        }
    };

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            renderTasks();
        }
    });
}

function cyclePriority(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const priorities = ['low', 'medium', 'high'];
    const currentIndex = priorities.indexOf(task.priority);
    const nextIndex = (currentIndex + 1) % priorities.length;

    updateTaskPriority(id, priorities[nextIndex]);
}

// ========================================
// Drag and Drop Functions
// ========================================
let draggedElement = null;

function handleDragStart(e) {
    draggedElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedElement = null;
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (draggedElement !== e.currentTarget) {
        const allItems = [...taskList.querySelectorAll('.task-item')];
        const draggedIndex = allItems.indexOf(draggedElement);
        const targetIndex = allItems.indexOf(e.currentTarget);

        if (draggedIndex < targetIndex) {
            e.currentTarget.after(draggedElement);
        } else {
            e.currentTarget.before(draggedElement);
        }

        // Update order in tasks array
        updateTaskOrder();
    }

    return false;
}

function updateTaskOrder() {
    const taskItems = [...taskList.querySelectorAll('.task-item')];
    taskItems.forEach((item, index) => {
        const taskId = parseInt(item.dataset.id);
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.order = index;
        }
    });
    saveTasks();
}

// ========================================
// Stats Update
// ========================================
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;

    totalCount.textContent = total;
    activeCount.textContent = active;
    completedCount.textContent = completed;
}

// ========================================
// Local Storage Functions
// ========================================
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
        try {
            tasks = JSON.parse(storedTasks);
            // Migrate old tasks without priority or order
            tasks = tasks.map((task, index) => ({
                ...task,
                priority: task.priority || 'medium',
                order: task.order !== undefined ? task.order : index
            }));
        } catch (error) {
            console.error('Error loading tasks:', error);
            tasks = [];
        }
    }
}

// ========================================
// Initialize on DOM Load
// ========================================
document.addEventListener('DOMContentLoaded', init);
