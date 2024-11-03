let currentFilter = 'all';
let currentCategory = 'all';
let currentSort = 'deadline';
let editingTaskId = null;
let currentTaskId = null;

// Add these motivational messages
const motivationalMessages = [
    "You're doing great! Keep going! 🌟",
    "One task at a time leads to success! 💪",
    "Stay organized, stay awesome! ✨",
    "You're making progress! 🎯",
    "Keep up the great work! 🌈",
    "You've got this! 💫",
    "Small steps, big achievements! 🚀",
    "Productivity champion! 🏆",
    "Making things happen! ⭐",
    "Organization leads to success! 📈"
];

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    
    // Add enter key support for input
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const tasks = document.querySelectorAll('.task-item');
        
        tasks.forEach(task => {
            const taskText = task.querySelector('.task-text').textContent.toLowerCase();
            task.style.display = taskText.includes(searchTerm) ? '' : 'none';
        });
    });
    
    // Close modal when clicking outside
    window.onclick = (event) => {
        const modal = document.getElementById('editModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    // Close modal with × button
    document.querySelector('.close-modal').onclick = () => {
        document.getElementById('editModal').style.display = 'none';
    };
});

function addTask() {
    const input = document.getElementById('taskInput');
    const deadlineInput = document.getElementById('deadlineInput');
    const priorityInput = document.getElementById('priorityInput');
    const categoryInput = document.getElementById('categoryInput');
    
    const task = input.value.trim();
    
    if (task) {
        const taskObj = {
            id: Date.now(),
            text: task,
            completed: false,
            createdAt: new Date().toISOString(),
            deadline: deadlineInput.value || null,
            priority: priorityInput.value,
            category: categoryInput.value,
            notes: ''
        };
        
        const tasks = getTasks();
        tasks.push(taskObj);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        // Clear inputs
        input.value = '';
        deadlineInput.value = '';
        priorityInput.value = 'low';
        categoryInput.value = 'personal';
        
        loadTasks();
        updateStats();
    }
}

function getTasks() {
    return JSON.parse(localStorage.getItem('tasks') || '[]');
}

function loadTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    
    let tasks = getTasks();
    
    // Apply filters
    tasks = tasks.filter(task => {
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
    });
    
    if (currentCategory !== 'all') {
        tasks = tasks.filter(task => task.category === currentCategory);
    }
    
    // Apply sorting
    tasks.sort((a, b) => {
        switch (currentSort) {
            case 'deadline':
                return new Date(a.deadline || '9999') - new Date(b.deadline || '9999');
            case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            case 'category':
                return a.category.localeCompare(b.category);
            case 'added':
                return new Date(b.createdAt) - new Date(a.createdAt);
            default:
                return 0;
        }
    });
    
    tasks.forEach(task => {
        const li = createTaskElement(task);
        taskList.appendChild(li);
    });
    
    updateStats();
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    
    const deadline = task.deadline ? formatDeadline(task.deadline) : null;
    const deadlineHTML = deadline ? 
        `<div class="task-deadline ${deadline.isOverdue ? 'overdue' : ''}">${deadline.text}</div>` : '';
    
    const priorityLabels = {
        urgent: 'Urgent',
        important: 'Important',
        normal: 'Normal'
    };
    
    li.innerHTML = `
        <div class="task-content">
            <div class="task-main">
                <div class="checkbox" onclick="toggleTask(${task.id})"></div>
                <span class="task-text">${task.text}</span>
                <span class="priority-badge priority-${task.priority}">
                    ${priorityLabels[task.priority]}
                </span>
            </div>
            ${deadlineHTML}
            <div class="category-badge">${task.category}</div>
            ${task.notes ? `<div class="task-notes">${task.notes}</div>` : ''}
        </div>
        <div class="task-actions">
            <button class="edit-btn" onclick="openEditModal(${task.id})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="notes-btn" onclick="openNotesModal(${task.id})">
                <i class="fas fa-sticky-note"></i>
            </button>
            <button class="delete-btn" onclick="deleteTask(${task.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return li;
}

function openEditModal(taskId) {
    currentEditTaskId = taskId;
    const modal = document.getElementById('editModal');
    
    // Get task details
    const tasks = getTasks();
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
        // Fill in the edit form
        document.getElementById('editTaskInput').value = task.text;
        document.getElementById('editDeadlineInput').value = task.deadline || '';
        document.getElementById('editPriorityInput').value = task.priority;
        document.getElementById('editCategoryInput').value = task.category;
        
        // Show modal
        modal.style.display = 'block';
    }
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.style.display = 'none';
    currentEditTaskId = null;
}

function saveEditTask() {
    if (!currentEditTaskId) return;
    
    const taskInput = document.getElementById('editTaskInput');
    const deadlineInput = document.getElementById('editDeadlineInput');
    const priorityInput = document.getElementById('editPriorityInput');
    const categoryInput = document.getElementById('editCategoryInput');
    
    const taskText = taskInput.value.trim();
    
    if (taskText) {
        const tasks = getTasks();
        const taskIndex = tasks.findIndex(t => t.id === currentEditTaskId);
        
        if (taskIndex !== -1) {
            // Update task
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                text: taskText,
                deadline: deadlineInput.value || null,
                priority: priorityInput.value,
                category: categoryInput.value,
                updatedAt: new Date().toISOString()
            };
            
            // Save to localStorage
            localStorage.setItem('tasks', JSON.stringify(tasks));
            
            // Refresh task list
            loadTasks();
            
            // Show motivation
            showMotivation();
        }
    }
    
    // Close modal
    closeEditModal();
}

function updateStats() {
    const tasks = getTasks();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    
    document.getElementById('totalTasks').textContent = `${totalTasks} Total Tasks`;
    document.getElementById('completedTasks').textContent = `${completedTasks} Completed`;
    document.getElementById('pendingTasks').textContent = `${pendingTasks} Pending`;
}

function sortTasks(sortBy) {
    currentSort = sortBy;
    loadTasks();
}

function filterByCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.classList.toggle('active', chip.textContent.toLowerCase() === category);
    });
    loadTasks();
}

function formatDeadline(deadline) {
    if (!deadline) return '';
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const isOverdue = deadlineDate < now && !this.completed;
    
    const formattedDate = deadlineDate.toLocaleDateString();
    const formattedTime = deadlineDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    return {
        text: `Due: ${formattedDate} at ${formattedTime}`,
        isOverdue
    };
}

function filterTasks(filterType) {
    currentFilter = filterType;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadTasks();
}

function toggleTask(id) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        loadTasks();
    }
}

function deleteTask(id) {
    const tasks = getTasks();
    const filteredTasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('tasks', JSON.stringify(filteredTasks));
    loadTasks();
}

function openNotesModal(taskId) {
    currentTaskId = taskId;
    const modal = document.getElementById('notesModal');
    const textarea = document.getElementById('taskNotesInput');
    
    // Get existing notes for this task
    const tasks = getTasks();
    const task = tasks.find(t => t.id === taskId);
    
    // Set existing notes in textarea
    textarea.value = task.notes || '';
    
    // Show modal
    modal.style.display = 'block';
}

function closeNotesModal() {
    const modal = document.getElementById('notesModal');
    modal.style.display = 'none';
    currentTaskId = null;
}

function saveNotes() {
    if (!currentTaskId) return;
    
    const textarea = document.getElementById('taskNotesInput');
    const notes = textarea.value.trim();
    
    // Save notes to task
    const tasks = getTasks();
    const taskIndex = tasks.findIndex(t => t.id === currentTaskId);
    
    if (taskIndex !== -1) {
        tasks[taskIndex].notes = notes;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        // Refresh task list
        loadTasks();
    }
    
    // Close modal
    closeNotesModal();
}

// Add event listener for clicking outside modal
window.onclick = function(event) {
    const editModal = document.getElementById('editModal');
    const notesModal = document.getElementById('notesModal');
    
    if (event.target === editModal) {
        closeEditModal();
    }
    if (event.target === notesModal) {
        closeNotesModal();
    }
}

// Function to show random motivation
function showMotivation() {
    const speechBubble = document.querySelector('.speech-bubble');
    const motivationText = document.querySelector('.motivation-text');
    
    // Get random message
    const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    
    // Update text
    motivationText.textContent = message;
    
    // Show bubble
    speechBubble.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        speechBubble.classList.remove('show');
    }, 3000);
}

// Show motivation on various events
function setupMotivationalCharacter() {
    // Show motivation when tasks are completed
    const originalToggleTask = window.toggleTask;
    window.toggleTask = function(id) {
        originalToggleTask(id);
        showMotivation();
    };
    
    // Show motivation when tasks are added
    const originalAddTask = window.addTask;
    window.addTask = function() {
        const result = originalAddTask();
        if (result !== false) {
            showMotivation();
        }
        return result;
    };
    
    // Show random motivation periodically
    setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance to show motivation
            showMotivation();
        }
    }, 60000); // Check every minute
}

// Initialize character when page loads
document.addEventListener('DOMContentLoaded', setupMotivationalCharacter);