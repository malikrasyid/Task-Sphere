import { 
    initializeSocketIO, 
    initializeStatusIndicator, 
    checkSocketConnections, 
    updateConnectionStatus 
} from './socket.js';
import { renderProjectPage, renderProject } from './project.js';
import { renderCalendar } from './calendar.js';
import { renderNotifications } from './notification.js';
import { updateTaskStatuses } from './task.js';
import { initializeDashboard } from './dashboard.js';
import { login, signUp, logout, handleSessionExpired, showMainSection, toggleAuth } from './auth.js';
import {
    showAddTaskModal,
    closeAddTaskModal,
    showCreateProjectModal,
    closeCreateProjectModal,
    showAddMemberModal,
    closeAddMemberModal,
    debounceSearch,
    selectUser,
    addMemberToProjectFromModal
} from './modals.js';
import { 
    addTask, 
    createProject, 
    deleteProject, 
    deleteTask, 
    addComment, 
    deleteComment
} from './api.js';
import { showSection, showToast } from './ui.js';

// Initialize global event listeners
function initializeEventListeners() {
    // Login form submit
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        login();
    });

    // Signup form submit
    document.getElementById('signupForm').addEventListener('submit', (e) => {
        e.preventDefault();
        signUp();
    });

    // Toggle between login and signup forms
    document.getElementById('toggleAuth').addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuth();
    });

    // Add task form
    document.getElementById('addTaskForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const projectId = document.getElementById('taskProjectId').value;
        const taskData = {
            taskId: Date.now().toString(), // Simple unique ID generation
            name: document.getElementById('taskName').value,
            deliverable: document.getElementById('taskDeliverable').value,
            startDate: new Date(document.getElementById('taskStartDate').value),
            endDate: new Date(document.getElementById('taskEndDate').value),
            status: 'Not Started'
        };

        try {
            await addTask(projectId, taskData);
            closeAddTaskModal();
            renderProject(projectId);
        } catch (error) {
            console.error('Error adding task:', error);
        }
    });

    // Create project form
    document.getElementById('projectForm').addEventListener('submit', async (e) => {
        e.preventDefault();
                
        const projectData = {
            projectId: 'proj_' + Date.now(), // Generate a unique project ID
            name: document.getElementById('projectName').value,
            description: document.getElementById('projectDesc').value,
            ownerId: sessionStorage.getItem('userId'), // Get the current user's ID
            team: [{ userId: sessionStorage.getItem('userId'), role: 'Owner' }] // Add current user as owner
        };

        try {
            await createProject(projectData);
            closeCreateProjectModal();
            renderProjectPage();
        } catch (error) {
            console.error('Error creating project:', error);
        }
    });

    // Sidebar navigation
    document.getElementById('navDashboard').addEventListener('click', function (event) {
        event.preventDefault();
        showSection('dashboardSection');
        initializeDashboard();
    });

    document.getElementById('navProjects').addEventListener('click', async function (event) {
        event.preventDefault();
        showSection('projectsSection');
        renderProjectPage();
    });

    document.getElementById('navCalendar').addEventListener('click', function (event) {
        event.preventDefault();
        showSection('calendarSection');
        
        // Short timeout to ensure the calendar element is visible
        setTimeout(() => {
            if (document.getElementById('calendar')) {
                renderCalendar();
            }
        }, 100);
    });

    // Toggle sidebar
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 1024) { // lg breakpoint
                if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                    sidebar.classList.add('-translate-x-full');
                }
            }
        });
    }

    // Dropdown Profile
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', function () {
            profileDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', function (event) {
            if (!profileBtn.contains(event.target) && !profileDropdown.contains(event.target)) {
                profileDropdown.classList.add('hidden');
            }
        });
    }

    // Notifications toggle
    const notificationToggle = document.getElementById('notification-toggle');
    const notificationsDropdown = document.getElementById('notifications-dropdown');
    
    if (notificationToggle && notificationsDropdown) {
        notificationToggle.addEventListener('click', () => {
            const isHidden = notificationsDropdown.classList.contains('hidden');
            
            if (isHidden) {
                // Show dropdown and refresh notifications
                notificationsDropdown.classList.remove('hidden');
                renderNotifications();
            } else {
                // Hide dropdown
                notificationsDropdown.classList.add('hidden');
            }
        });
        
        // Close notifications when clicking outside
        document.addEventListener('click', (event) => {
            if (!notificationToggle.contains(event.target) && 
                !notificationsDropdown.contains(event.target)) {
                notificationsDropdown.classList.add('hidden');
            }
        });
    }

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
}

// Initialize application when DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize event listeners
    initializeEventListeners();
    
    // Check if user is already logged in
    const token = sessionStorage.getItem("sessionToken");
    const userId = sessionStorage.getItem('userId');
    
    if (token && userId) {
        // User is logged in, show main section
        showMainSection();
        
        // Set user's name initial in the profile button
        const profileName = document.getElementById('profileName');
        const userFullName = sessionStorage.getItem('userFullName') || '';
        if (profileName && userFullName) {
            profileName.textContent = userFullName.charAt(0).toUpperCase();
        }
        
        // Initialize Socket.IO connections with a slight delay to ensure DOM is fully loaded
        setTimeout(() => {
            initializeSocketIO(); // Initialize Socket.IO connections
            
            // Set up periodic socket connection check (every 30 seconds)
            setInterval(checkSocketConnections, 30 * 1000);
        }, 500);
        
        // Run task status update when application loads
        updateTaskStatuses();
        
        // Set up periodic task status updates (every 15 minutes)
        setInterval(updateTaskStatuses, 15 * 60 * 1000);
        
        // Show dashboard by default
        showSection('dashboardSection');
        initializeDashboard();
    } else {
        // User is not logged in, show auth section
        document.getElementById('authSection').classList.remove('hidden');
        document.getElementById('mainSection').classList.add('hidden');
    }

    // Initialize notifications
    renderNotifications();
    
    // Set up periodic refresh for notifications (every 60 seconds)
    setInterval(renderNotifications, 60000);
    
    // Initialize status indicator
    initializeStatusIndicator();
    
    // Set interval to check WebSocket status
    setInterval(updateConnectionStatus, 1000);
});

// Global functions that need to be exposed to the window object for inline event handlers
window.showSection = showSection;
window.markTaskAsDone = function(projectId, taskId) {
    // Implement marking task as done
    console.log('Marking task as done:', projectId, taskId);
};
window.deleteTask = deleteTask;
window.deleteProject = deleteProject;
window.addComment = function(projectId, taskId) {
    const inputElement = document.getElementById(`comment-input-${taskId}`);
    if (inputElement && inputElement.value) {
        const message = inputElement.value;
        inputElement.value = ''; // Clear the input
        
        // Call the API function
        addComment(projectId, taskId, message);
    }
};
window.deleteComment = deleteComment;
window.showAddTaskModal = showAddTaskModal;
window.closeAddTaskModal = closeAddTaskModal;
window.showAddMemberModal = showAddMemberModal;
window.closeAddMemberModal = closeAddMemberModal;
window.showCreateProjectModal = showCreateProjectModal;
window.closeCreateProjectModal = closeCreateProjectModal;
window.selectUser = selectUser;
window.debounceSearch = debounceSearch;
window.addMemberToProject = addMemberToProjectFromModal; 