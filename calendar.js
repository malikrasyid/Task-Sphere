import { fetchProjects, fetchTasksFromProject } from './api.js';
import { getTaskColor } from './utils.js';

// Initialize and render FullCalendar
async function renderCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    
    // Clear existing calendar
    calendarEl.innerHTML = '';
    
    // Fetch all projects
    const projects = await fetchProjects();
    if (!projects || !projects.length) return;
    
    // Fetch all tasks from all projects
    const allTasksPromises = projects.map(project => fetchTasksFromProject(project.projectId));
    const allTasksResults = await Promise.all(allTasksPromises);
    
    // Flatten tasks array and remove nulls
    const allTasks = allTasksResults
        .filter(tasks => tasks)
        .flat()
        .filter(task => task && task.startDate && task.endDate);
    
    // Map tasks to calendar events
    const events = allTasks.map(task => {
        const color = getTaskColor(task.status);
        const project = projects.find(p => p.projectId === task.projectId);
        const projectName = project ? project.name : 'Unknown Project';
        
        return {
            id: task.taskId,
            title: task.name,
            start: task.startDate,
            end: task.endDate,
            backgroundColor: color,
            borderColor: color,
            textColor: '#FFFFFF',
            description: task.deliverable,
            extendedProps: {
                projectId: task.projectId,
                projectName: projectName,
                status: task.status
            }
        };
    });
    
    // Initialize calendar
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
        },
        events: events,
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        },
        eventClick: function(info) {
            showTaskDetails(info.event);
        },
        dayMaxEvents: true, // allow "more" link when too many events
        themeSystem: 'standard',
        height: 'auto'
    });
    
    calendar.render();
}

// Show task details in a popup when clicking on a calendar event
function showTaskDetails(event) {
    // Create a modal for task details
    const modalId = `task-modal-${event.id}`;
    
    // Check if modal already exists and remove it
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create new modal
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center';
    
    const formattedStart = new Date(event.start).toLocaleString();
    const formattedEnd = event.end ? new Date(event.end).toLocaleString() : 'N/A';
    
    modal.innerHTML = `
        <div class="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="flex justify-between items-center pb-3 border-b">
                <h3 class="text-lg font-medium text-gray-900">${event.title}</h3>
                <button class="text-gray-400 hover:text-gray-500 close-modal">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="mt-4 space-y-3">
                <p><span class="font-medium">Project:</span> ${event.extendedProps.projectName}</p>
                <p><span class="font-medium">Status:</span> 
                    <span class="px-2 py-1 rounded text-white text-xs" 
                        style="background-color: ${event.backgroundColor}">${event.extendedProps.status}</span>
                </p>
                <p><span class="font-medium">Description:</span> ${event.extendedProps.description || 'No description'}</p>
                <p><span class="font-medium">Start:</span> ${formattedStart}</p>
                <p><span class="font-medium">End:</span> ${formattedEnd}</p>
            </div>
            <div class="mt-5 flex justify-end">
                <button class="close-modal px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listener to close modal
    modal.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            modal.remove();
        });
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

export { renderCalendar }; 