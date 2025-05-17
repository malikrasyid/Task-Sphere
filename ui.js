// Function to show toast notifications
function showToast(type, message) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed bottom-4 left-4 z-50 flex flex-col gap-2';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    const toastId = 'toast-' + Date.now();
    toast.id = toastId;
    
    // Set background color based on type
    let bgColor = 'bg-gray-800';
    if (type === 'success') bgColor = 'bg-green-600';
    if (type === 'error') bgColor = 'bg-red-600';
    if (type === 'info') bgColor = 'bg-blue-600';
    if (type === 'warning') bgColor = 'bg-yellow-500';
    
    toast.className = `${bgColor} text-white p-3 rounded-lg shadow-lg flex items-start animate-fadeIn max-w-md transition-all duration-300`;
    
    // Add icon based on type
    let icon = '';
    if (type === 'success') {
        icon = '<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
    } else if (type === 'error') {
        icon = '<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
    } else if (type === 'info') {
        icon = '<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    } else if (type === 'warning') {
        icon = '<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
    }
    
    toast.innerHTML = `
        <div class="flex items-start">
            ${icon}
            <div class="ml-1">${message}</div>
        </div>
        <button class="ml-auto -mr-1 text-white hover:text-gray-200 focus:outline-none" onclick="document.getElementById('${toastId}').remove()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

// Function to toggle between pages/sections
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show the requested section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    // Close sidebar on mobile
    if (window.innerWidth < 1024) { // lg breakpoint
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.add('-translate-x-full');
        }
    }
    
    // Update active nav item
    document.querySelectorAll('nav a').forEach(navItem => {
        navItem.classList.remove('bg-indigo-700');
        if (
            (sectionId === 'dashboardSection' && navItem.id === 'navDashboard') ||
            (sectionId === 'projectsSection' && navItem.id === 'navProjects') ||
            (sectionId === 'calendarSection' && navItem.id === 'navCalendar')
        ) {
            navItem.classList.add('bg-indigo-700');
        }
    });
}

function getStatusClass(status) {
    switch(status) {
        case 'Done': return 'bg-green-100 text-green-800';
        case 'Ongoing': return 'bg-blue-100 text-blue-800';
        case 'Overdue': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Modal functions
function showAddTaskModal(projectId) {
    console.log('Showing add task modal for project:', projectId);
    const modal = document.getElementById('addTaskModal');
    if (!modal) {
        console.error('Add Task modal element not found');
        return;
    }
            
    // Reset form and set project ID
    const taskProjectId = document.getElementById('taskProjectId');
    const addTaskForm = document.getElementById('addTaskForm');
            
    if (taskProjectId) taskProjectId.value = projectId;
    if (addTaskForm) addTaskForm.reset();
            
    // Show modal
    modal.classList.remove('hidden');
    console.log('Modal should now be visible');
}

function closeAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function showAddMemberModal(projectId) {
    console.log('Showing add member modal for project:', projectId);
    const modal = document.getElementById('addMemberModal');
    if (!modal) {
        console.error('Add Member modal element not found');
        return;
    }
            
     // Reset modal state
    const memberProjectId = document.getElementById('memberProjectId');
    const userSearchInput = document.getElementById('userSearchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (memberProjectId) memberProjectId.value = projectId;
    if (userSearchInput) userSearchInput.value = '';
    if (searchResults) searchResults.innerHTML = '';
            
    const selectedUserInfo = document.getElementById('selectedUserInfo');
    const roleSelection = document.getElementById('roleSelection');
    const addMemberBtn = document.getElementById('addMemberBtn');
            
    if (selectedUserInfo) selectedUserInfo.classList.add('hidden');
    if (roleSelection) roleSelection.classList.add('hidden');
    if (addMemberBtn) addMemberBtn.classList.add('hidden');
            
    // Show modal
    modal.classList.remove('hidden');
    console.log('Modal should now be visible');
}

function closeAddMemberModal() {
    const modal = document.getElementById('addMemberModal');
    if (modal) {
        modal.classList.add('hidden');
    }        
}

function showCreateProjectModal() {
    document.getElementById('createProjectModal').classList.remove('hidden');
}

function closeCreateProjectModal() {
    document.getElementById('createProjectModal').classList.add('hidden');
    document.getElementById('projectForm').reset();
}

export {
    showToast,
    showSection,
    getStatusClass,
    showAddTaskModal,
    closeAddTaskModal,
    showAddMemberModal,
    closeAddMemberModal,
    showCreateProjectModal,
    closeCreateProjectModal
}; 