// DOM update utility functions

/**
 * Updates the comments container in the DOM with new HTML
 * @param {string} projectId - The project ID
 * @param {string} taskId - The task ID
 * @param {string} commentsHTML - The HTML content to update
 */
export function updateCommentsInDOM(projectId, taskId, commentsHTML) {
    const commentsContainer = document.getElementById(`comments-container-${taskId}`);
    
    if (commentsContainer) {
        commentsContainer.innerHTML = commentsHTML;
    } else {
        console.error(`Comments container for task ${taskId} not found in DOM`);
    }
}

/**
 * Updates a specific task in the DOM
 * @param {string} projectId - The project ID
 * @param {string} taskId - The task ID
 * @param {Object} taskData - The task data to update
 */
export function updateTaskInDOM(projectId, taskId, taskData) {
    // Find the task element in the DOM
    const taskElement = document.getElementById(`task-${taskId}`);
    
    if (taskElement && taskData) {
        // Update task details
        const titleElement = taskElement.querySelector('.task-title');
        if (titleElement) titleElement.textContent = taskData.title;
        
        const statusElement = taskElement.querySelector('.task-status');
        if (statusElement) {
            statusElement.textContent = taskData.status;
            // Update status color/class if needed
            updateStatusClass(statusElement, taskData.status);
        }
        
        // Update other task properties as needed
    } else {
        console.error(`Task element for task ${taskId} not found in DOM`);
    }
}

/**
 * Removes a task from the DOM
 * @param {string} projectId - The project ID
 * @param {string} taskId - The task ID
 */
export function removeTaskFromDOM(projectId, taskId) {
    const taskElement = document.getElementById(`task-${taskId}`);
    if (taskElement) {
        taskElement.remove();
    } else {
        console.error(`Task element for task ${taskId} not found in DOM`);
    }
}

/**
 * Updates the status class of a task element
 * @param {HTMLElement} element - The status element
 * @param {string} status - The new status
 */
function updateStatusClass(element, status) {
    // Remove all status classes
    element.classList.remove('status-not-started', 'status-in-progress', 'status-completed', 'status-blocked');
    
    // Add the appropriate class based on status
    switch (status.toLowerCase()) {
        case 'not started':
            element.classList.add('status-not-started');
            break;
        case 'in progress':
            element.classList.add('status-in-progress');
            break;
        case 'completed':
            element.classList.add('status-completed');
            break;
        case 'blocked':
            element.classList.add('status-blocked');
            break;
    }
} 