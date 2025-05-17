import { searchUsers, addMemberToProject } from './api.js';
import { toTitleCase } from './utils.js';

// Show add task modal
function showAddTaskModal(projectId) {
    const modal = document.getElementById('addTaskModal');
    document.getElementById('taskProjectId').value = projectId;
    
    // Set default dates for start and end date fields
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const startDateFormatted = formatDateForInput(today);
    const endDateFormatted = formatDateForInput(nextWeek);
    
    document.getElementById('taskStartDate').value = startDateFormatted;
    document.getElementById('taskEndDate').value = endDateFormatted;
    
    // Clear other fields
    document.getElementById('taskName').value = '';
    document.getElementById('taskDeliverable').value = '';
    
    modal.classList.remove('hidden');
}

// Close add task modal
function closeAddTaskModal() {
    document.getElementById('addTaskModal').classList.add('hidden');
}

// Show create project modal
function showCreateProjectModal() {
    const modal = document.getElementById('createProjectModal');
    
    // Clear fields
    document.getElementById('projectName').value = '';
    document.getElementById('projectDesc').value = '';
    
    modal.classList.remove('hidden');
}

// Close create project modal
function closeCreateProjectModal() {
    document.getElementById('createProjectModal').classList.add('hidden');
}

// Show add member modal
function showAddMemberModal(projectId) {
    const modal = document.getElementById('addMemberModal');
    document.getElementById('memberProjectId').value = projectId;
    
    // Clear fields
    document.getElementById('userSearchInput').value = '';
    document.getElementById('searchResults').innerHTML = '<p class="text-gray-500 p-2">Type at least 2 characters to search</p>';
    document.getElementById('selectedUserInfo').classList.add('hidden');
    document.getElementById('roleSelection').classList.add('hidden');
    document.getElementById('addMemberBtn').classList.add('hidden');
    
    modal.classList.remove('hidden');
}

// Close add member modal
function closeAddMemberModal() {
    document.getElementById('addMemberModal').classList.add('hidden');
}

// Debounce function for search
let searchTimeout;
function debounceSearch(query) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        performUserSearch(query);
    }, 300);
}

// Perform user search for add member modal
async function performUserSearch(query) {
    const resultsContainer = document.getElementById('searchResults');
    
    if (query.length < 2) {
        resultsContainer.innerHTML = '<p class="text-gray-500 p-2">Type at least 2 characters to search</p>';
        return;
    }
    
    resultsContainer.innerHTML = '<p class="text-gray-500 p-2">Searching...</p>';
    
    try {
        const users = await searchUsers(query);
        
        if (!users || users.length === 0) {
            resultsContainer.innerHTML = '<p class="text-gray-500 p-2">No users found</p>';
            return;
        }
        
        const html = users.map(user => `
            <div class="p-2 hover:bg-gray-100 cursor-pointer" onclick="selectUser('${user.userId}', '${user.email}', '${user.firstName} ${user.lastName}')">
                <div class="font-medium text-gray-900">${user.firstName} ${user.lastName}</div>
                <div class="text-sm text-gray-500">${user.email}</div>
            </div>
        `).join('');
        
        resultsContainer.innerHTML = html;
    } catch (error) {
        console.error('Error searching users:', error);
        resultsContainer.innerHTML = '<p class="text-red-500 p-2">Error searching users</p>';
    }
}

// Select a user from search results
function selectUser(userId, email, name) {
    const selectedUserInfo = document.getElementById('selectedUserInfo');
    const roleSelection = document.getElementById('roleSelection');
    const addMemberBtn = document.getElementById('addMemberBtn');
    
    // Display selected user info
    selectedUserInfo.innerHTML = `
        <div class="font-medium text-gray-900">${toTitleCase(name)}</div>
        <div class="text-sm text-gray-500">${email}</div>
        <input type="hidden" id="selectedUserId" value="${userId}">
    `;
    
    // Show user info, role selection, and add button
    selectedUserInfo.classList.remove('hidden');
    roleSelection.classList.remove('hidden');
    addMemberBtn.classList.remove('hidden');
}

// Add member to project (called from the modal)
async function addMemberToProjectFromModal() {
    const projectId = document.getElementById('memberProjectId').value;
    const userId = document.getElementById('selectedUserId').value;
    const role = document.getElementById('memberRole').value;
    
    if (!projectId || !userId) {
        alert('Missing project or user information');
        return;
    }
    
    try {
        const success = await addMemberToProject(projectId, userId, role);
        if (success) {
            closeAddMemberModal();
            // Refresh the project view
            renderProject(projectId);
        }
    } catch (error) {
        console.error('Error adding member:', error);
        alert('Failed to add member to project');
    }
}

// Utility function to format date for datetime-local input
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Expose functions to window for inline handlers
window.showAddTaskModal = showAddTaskModal;
window.closeAddTaskModal = closeAddTaskModal;
window.showCreateProjectModal = showCreateProjectModal;
window.closeCreateProjectModal = closeCreateProjectModal;
window.showAddMemberModal = showAddMemberModal;
window.closeAddMemberModal = closeAddMemberModal;
window.debounceSearch = debounceSearch;
window.selectUser = selectUser;
window.addMemberToProjectFromModal = addMemberToProjectFromModal;

export {
    showAddTaskModal,
    closeAddTaskModal,
    showCreateProjectModal,
    closeCreateProjectModal,
    showAddMemberModal,
    closeAddMemberModal,
    debounceSearch,
    selectUser,
    addMemberToProjectFromModal
}; 