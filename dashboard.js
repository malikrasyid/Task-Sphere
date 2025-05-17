import { fetchProjects, fetchTasksFromProject } from './api.js';
import { formatDateUTC, getTaskColor } from './utils.js';

// Function to initialize or refresh the dashboard
async function initializeDashboard() {
    console.log('Initializing dashboard...');
    renderDashboard();
}

// Update dashboard if it's currently visible
function updateDashboardIfVisible() {
    const dashboardSection = document.getElementById('dashboardSection');
    if (dashboardSection && !dashboardSection.classList.contains('hidden')) {
        renderDashboard();
    }
}

// Main dashboard rendering function
async function renderDashboard() {
    console.log('Rendering dashboard...');
    
    // Fetch all projects
    const projects = await fetchProjects();
    if (!projects) return;
    
    // Fetch all tasks for all projects
    const tasksPromises = projects.map(project => fetchTasksFromProject(project.projectId));
    const tasksResults = await Promise.all(tasksPromises);
    
    // Flatten tasks and filter out nulls
    const allTasks = tasksResults
        .filter(tasks => tasks)
        .flat();
    
    // Render dashboard components
    renderDashboardSummary(projects, allTasks);
    renderUpcomingDeadlines(allTasks, projects);
    renderTasksByStatus(allTasks);
    renderRecentProjects(projects);
    renderRecentTasks(allTasks, projects);
}

// Render dashboard summary cards
function renderDashboardSummary(projects, tasks) {
    const container = document.getElementById('dashboardSummary');
    if (!container) return;
    
    // Count tasks by status
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'Done').length;
    const overdueCount = tasks.filter(task => task.status === 'Overdue').length;
    const upcomingCount = tasks.filter(task => 
        task.status !== 'Done' && 
        task.status !== 'Overdue' && 
        new Date(task.endDate) > new Date() && 
        new Date(task.endDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Total Projects -->
            <div class="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-sm font-medium text-gray-500">Total Projects</p>
                        <h3 class="text-2xl font-bold text-gray-900 mt-1">${projects.length}</h3>
                    </div>
                    <div class="rounded-full p-2 bg-indigo-50">
                        <svg class="w-6 h-6 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path>
                        </svg>
                    </div>
                </div>
            </div>
            
            <!-- Total Tasks -->
            <div class="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-sm font-medium text-gray-500">Total Tasks</p>
                        <h3 class="text-2xl font-bold text-gray-900 mt-1">${totalTasks}</h3>
                    </div>
                    <div class="rounded-full p-2 bg-blue-50">
                        <svg class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                </div>
                <div class="mt-2">
                    <p class="text-sm text-gray-500">${completedTasks} completed</p>
                    <div class="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div class="bg-blue-500 h-1.5 rounded-full" style="width: ${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%"></div>
                    </div>
                </div>
            </div>
            
            <!-- Overdue Tasks -->
            <div class="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-sm font-medium text-gray-500">Overdue Tasks</p>
                        <h3 class="text-2xl font-bold text-red-600 mt-1">${overdueCount}</h3>
                    </div>
                    <div class="rounded-full p-2 bg-red-50">
                        <svg class="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                </div>
            </div>
            
            <!-- Upcoming Deadlines -->
            <div class="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-sm font-medium text-gray-500">Upcoming (7 days)</p>
                        <h3 class="text-2xl font-bold text-amber-600 mt-1">${upcomingCount}</h3>
                    </div>
                    <div class="rounded-full p-2 bg-amber-50">
                        <svg class="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render upcoming deadlines section
function renderUpcomingDeadlines(tasks, projects) {
    const container = document.getElementById('upcomingDeadlines');
    if (!container) return;
    
    // Filter tasks due in the next 7 days
    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingTasks = tasks
        .filter(task => 
            task.status !== 'Done' && 
            new Date(task.endDate) >= now && 
            new Date(task.endDate) <= oneWeekLater
        )
        .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
    
    if (upcomingTasks.length === 0) {
        container.innerHTML = `
            <div class="text-center py-6 text-gray-500">
                <p>No upcoming deadlines in the next 7 days</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
    `;
    
    upcomingTasks.forEach(task => {
        const project = projects.find(p => p.projectId === task.projectId);
        const projectName = project ? project.name : 'Unknown Project';
        const statusColor = getTaskColor(task.status);
        
        html += `
            <tr>
                <td class="px-4 py-3 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${task.name}</div>
                    <div class="text-xs text-gray-500">${task.deliverable || '-'}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${projectName}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${formatDateUTC(task.endDate)}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white" style="background-color: ${statusColor}">
                        ${task.status}
                    </span>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// Render tasks by status chart
function renderTasksByStatus(tasks) {
    const container = document.getElementById('tasksByStatus');
    if (!container) return;
    
    // Count tasks by status
    const statusCounts = {
        'Not Started': 0,
        'Ongoing': 0,
        'Overdue': 0,
        'Done': 0
    };
    
    tasks.forEach(task => {
        if (statusCounts.hasOwnProperty(task.status)) {
            statusCounts[task.status]++;
        } else {
            // Handle any other status
            statusCounts[task.status] = 1;
        }
    });
    
    // Create chart HTML using bars
    let html = '<div class="space-y-4">';
    
    Object.entries(statusCounts).forEach(([status, count]) => {
        const percentage = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
        const color = getTaskColor(status);
        
        html += `
            <div>
                <div class="flex justify-between items-center mb-1">
                    <div class="text-sm font-medium text-gray-700">${status}</div>
                    <div class="text-sm text-gray-500">${count} (${percentage}%)</div>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div class="h-2.5 rounded-full" style="width: ${percentage}%; background-color: ${color}"></div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Render recent projects
function renderRecentProjects(projects) {
    const container = document.getElementById('projectList');
    if (!container) return;
    
    // Sort projects by most recently created/updated
    const recentProjects = [...projects]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5); // Get top 5
    
    if (recentProjects.length === 0) {
        container.innerHTML = `
            <li class="text-center py-4 text-gray-500">
                <p>No projects found</p>
            </li>
        `;
        return;
    }
    
    container.innerHTML = recentProjects.map(project => `
        <li class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow p-3">
            <div class="font-medium text-gray-900">${project.name}</div>
            <p class="text-sm text-gray-500 mt-1 truncate">${project.description || 'No description'}</p>
            <div class="flex items-center text-xs text-gray-400 mt-2">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                </svg>
                ${project.team.length} member${project.team.length !== 1 ? 's' : ''}
            </div>
        </li>
    `).join('');
}

// Render recent tasks
function renderRecentTasks(tasks, projects) {
    const container = document.getElementById('taskList');
    if (!container) return;
    
    // Sort tasks by most recently created/updated
    const recentTasks = [...tasks]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5); // Get top 5
    
    if (recentTasks.length === 0) {
        container.innerHTML = `
            <li class="text-center py-4 text-gray-500">
                <p>No tasks found</p>
            </li>
        `;
        return;
    }
    
    container.innerHTML = recentTasks.map(task => {
        const project = projects.find(p => p.projectId === task.projectId);
        const projectName = project ? project.name : 'Unknown Project';
        const statusColor = getTaskColor(task.status);
        
        return `
            <li class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow p-3">
                <div class="flex justify-between items-start">
                    <div class="font-medium text-gray-900">${task.name}</div>
                    <span class="px-2 py-1 text-white text-xs rounded" style="background-color: ${statusColor}">${task.status}</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">${projectName}</p>
                <div class="flex items-center text-xs text-gray-400 mt-2">
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                    </svg>
                    Due: ${formatDateUTC(task.endDate)}
                </div>
            </li>
        `;
    }).join('');
}

export {
    initializeDashboard,
    renderDashboard,
    updateDashboardIfVisible
}; 