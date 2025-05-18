import { 
    fetchProjects, 
    fetchProject,
    fetchTasksFromProject, 
    fetchUserById, 
    deleteProject, 
    fetchUpdateProject 
} from './api.js';
import { formatDateUTC, toTitleCase } from './utils.js';
import { renderTasksFromProject, renderEachTask } from './task.js';

// Function to render a single project's team members
async function renderProjectTeam(team) {
    return (await Promise.all(
        team.map(async member => renderEachProject(member.userId, member.role))
    )).join('');
}

// Function to render a single team member card
async function renderEachProject(memberId, role) {
    const name = toTitleCase(await fetchUserById(memberId));
    return `
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm flex items-center p-3 hover:shadow-md transition-shadow">
            <div class="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mr-3">
                ${name.charAt(0)}
            </div>
            <div>
                <div class="font-medium text-gray-800">${name}</div>
                <div class="text-xs text-gray-500">${role}</div>
            </div>
        </div>
    `;
}

// Function to render a single project
async function renderProject(projectId) {
    // Fetch the specific project
    const project = await fetchProject(projectId);
    
    if (!project) {
        console.error(`Failed to fetch project with ID ${projectId}`);
        return null;
    }
    
    // Render team members
    const teamHTML = await renderProjectTeam(project.team);
    
    // Get tasks (but don't use the pre-rendered HTML)
    const { tasks } = await renderTasksFromProject(project.projectId);
    
    // Calculate project progress
    const completedTasks = tasks.filter(task => task.status === 'Done').length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    
    // Return processed project data
    return {
        project,
        teamHTML,
        tasks,
        progress
    };
}

// Main function to render all projects and tasks
async function renderProjectsAndTasks() {
    const container = document.getElementById('projects-container');
    container.innerHTML = '';

    const projects = await fetchProjects();

    if (!projects || projects.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center p-12 text-center">
                <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
                </svg>
                <p class="text-xl font-medium text-gray-600">No projects found</p>
                <p class="text-gray-500 mt-1">Create your first project to get started</p>
            </div>`;
        return;
    }

    // Render each project
    for (const project of projects) {
        const projectData = await renderProject(project.projectId);
        if (!projectData) continue;
        
        // Create project element
        const projectElement = document.createElement('details');
        projectElement.classList.add('mb-6', 'bg-white', 'rounded-lg', 'shadow', 'overflow-hidden', 'border', 'border-gray-200');
        projectElement.innerHTML = `
            <summary class="cursor-pointer p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <h3 class="text-lg font-bold text-gray-900">${projectData.project.name}</h3>
                        <span class="text-sm font-medium ${projectData.progress === 100 ? 'text-green-600' : 'text-blue-600'}">
                            ${projectData.progress}% Complete
                        </span>
                    </div>
                    <p class="text-gray-600 text-sm">${projectData.project.description || 'No description'}</p>
                    
                    <!-- Progress bar -->
                    <div class="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                        <div class="bg-indigo-600 h-1.5 rounded-full" style="width: ${projectData.progress}%"></div>
                    </div>
                </div>
                <button onclick="deleteProject('${projectData.project.projectId}'); event.stopPropagation();" 
                    class="ml-4 text-gray-400 hover:text-red-500 transition-colors">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v.01a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v.01a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </summary>
            <div class="p-5 space-y-6 bg-gray-50 border-t border-gray-200">
                <!-- Tasks Section -->
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="font-medium text-gray-900 flex items-center">
                            <svg class="w-5 h-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path>
                            </svg>
                            Tasks (${projectData.tasks.length})
                        </h4>
                        <button onclick="showAddTaskModal('${projectData.project.projectId}')" 
                            class="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            Add Task
                        </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Tasks will be rendered here -->
                    </div>
                </div>

                <!-- Team Members Section -->
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="font-medium text-gray-900 flex items-center">
                            <svg class="w-5 h-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                            </svg>
                            Team Members (${projectData.project.team.length})
                        </h4>
                        <button onclick="showAddMemberModal('${projectData.project.projectId}')" 
                            class="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                            </svg>
                            Add Member
                        </button>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        ${projectData.teamHTML.length > 0 ? projectData.teamHTML : 
                          `<div class="col-span-3 bg-white p-6 rounded-lg border border-gray-200 text-center">
                              <p class="text-gray-500">No team members yet. Add your first team member to collaborate.</p>
                           </div>`}
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(projectElement);

        // Now render the tasks inside the tasks container
        const tasksContainer = projectElement.querySelector(`#tasks-container-${projectId}`);
        
        if (projectData.tasks.length > 0) {
            // Render each task separately and add to tasks container
            for (const task of projectData.tasks) {
                if (!task.id) {
                    console.error('Task missing ID:', task);
                    continue;
                }
                
                try {
                    const taskHTML = await renderEachTask(task.id, projectId);
                    
                    if (taskHTML) {
                        const taskElement = document.createElement('div');
                        taskElement.innerHTML = taskHTML;
                        tasksContainer.appendChild(taskElement.firstChild);
                    }
                } catch (error) {
                    console.error(`Error rendering task ${task.id}:`, error);
                }
            }
        } else {
            tasksContainer.innerHTML = `
                <div class="col-span-2 bg-white p-6 rounded-lg border border-gray-200 text-center">
                    <p class="text-gray-500">No tasks yet. Add your first task to get started.</p>
                </div>`;
        }
    }
}

export {
    renderProject,
    renderProjectsAndTasks,
    renderProjectTeam,
    renderEachProject
}; 