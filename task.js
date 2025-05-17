import { formatDateUTC, getTaskColor } from './utils.js';
import { fetchTaskComments, markTaskAsDone, deleteTask } from './api.js';

// Function to render a single task
async function renderTask(task, projectId) {
    // Get comments for the task
    const { comments, html: commentsHTML } = await renderTaskComments(projectId, task.taskId);
    
    // Get task color
    const taskColor = getTaskColor(task.status);
    
    return `
        <div class="bg-white rounded-lg border-gray-200 shadow-sm hover:shadow-md transition-all p-4 group relative">
            <div class="flex justify-between items-start mb-2">
                <span class="font-medium text-gray-900">${task.name}</span>
                <span class="px-2 py-1 rounded text-white text-xs" 
                  style="background-color: ${taskColor}">${task.status}</span>
            </div>
            <div class="text-sm text-gray-600 mb-3">${task.deliverable}</div>
            <div class="flex items-center text-xs text-gray-500 mb-3">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                </svg>
                    ${formatDateUTC(task.startDate)} - ${formatDateUTC(task.endDate)}
            </div>
            
            <div class="opacity-0 group-hover:opacity-100 flex justify-end space-x-2 mb-3 transition-opacity">
                <button onclick="markTaskAsDone('${projectId}', '${task.taskId}')" 
                    class="bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-md transition-colors flex items-center">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Complete
                </button>
                <button onclick="deleteTask('${projectId}', '${task.taskId}')" 
                    class="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-md transition-colors flex items-center">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Delete
                </button>
            </div>

            <!-- Comments section -->
            <div class="pt-3 border-t border-gray-100">
                <div class="flex items-center text-xs font-medium text-gray-700 mb-2">
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clip-rule="evenodd"></path>
                    </svg>
                    Comments (${comments.length})
                </div>
                <div class="comments-container max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-1">
                    ${commentsHTML}
                </div>
                <div class="flex mt-2">
                    <input type="text" id="comment-input-${task.taskId}" 
                        class="flex-grow border border-gray-200 rounded-l-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" 
                        placeholder="Add a comment...">
                    <button onclick="addComment('${projectId}', '${task.taskId}')" 
                        class="bg-indigo-600 text-white px-3 py-1 rounded-r-md text-sm hover:bg-indigo-700 transition-colors">
                        Send
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Function to render tasks for a project
async function renderProjectTasks(projectId) {
    const tasks = await fetchProjectTasks(projectId) || [];
    
    // Generate HTML for all tasks
    const tasksHTMLArray = await Promise.all(tasks.map(task => 
        renderTask(task, projectId)
    ));
    
    return {
        tasks,
        html: tasksHTMLArray.join('')
    };
}

// Function to automatically update task statuses based on dates
async function updateTaskStatuses() {
    console.log('Checking for task status updates...');
    const token = sessionStorage.getItem("sessionToken");
    if (!token) return;
    
    try {
        const projects = await fetchUserProjects();
        if (!projects) return;
        
        let updatedCount = 0;
        
        for (const project of projects) {
            const tasks = await fetchProjectTasks(project.projectId);
            if (!tasks) continue;
            
            for (const task of tasks) {
                // Skip tasks that are already marked as Done
                if (task.status === 'Done') continue;
                
                // Get the auto-calculated status based on dates
                const autoStatus = getAutoStatus(task.startDate, task.endDate);
                
                // If the status has changed, update it
                if (task.status !== autoStatus) {
                    console.log(`Updating task ${task.name} status from ${task.status} to ${autoStatus}`);
                    
                    // Use our Socket.io integrated function instead of direct fetch
                    const result = await fetchUpdateTask(project.projectId, task.taskId, { status: autoStatus });
                    
                    if (result) {
                        updatedCount++;
                        
                        // Send notification about status change
                        const userId = sessionStorage.getItem("userId");
                        await fetchSendNotification(
                            userId,
                            'Task Status Updated',
                            `Task "${task.name}" status changed from ${task.status} to ${autoStatus}`
                        );
                    }
                }
            }
        }
        
        if (updatedCount > 0) {
            console.log(`Updated ${updatedCount} task statuses`);
            // Optionally show a toast notification
            showToast('info', `Updated ${updatedCount} task statuses`);
        }
    } catch (error) {
        console.error('Error updating task statuses:', error);
    }
}

export {
    renderTask,
    renderProjectTasks,
    updateTaskStatuses
}; 