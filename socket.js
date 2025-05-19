import { WS_URL } from './config.js';
import { showToast } from './ui.js';
import { renderProjectPage, renderProject } from './project.js';
import { renderCalendar } from './calendar.js';
import { renderDashboard, updateDashboardIfVisible } from './dashboard.js';
import { renderNotifications, addNotificationToRecentActivity } from './notification.js';
import { renderEachTask } from './task.js';
import { userProfile } from './auth.js';
import { renderComments } from './comment.js';
import { updateCommentsInDOM } from './utils.js';
// Initialize Socket.IO connections
const projectsSocket = io(`${WS_URL}/projects`);
const tasksSocket = io(`${WS_URL}/tasks`);
const usersSocket = io(`${WS_URL}/users`);
const commentsSocket = io(`${WS_URL}/comments`);
const notificationsSocket = io(`${WS_URL}/notifications`);

// Projects socket events
projectsSocket.on('connect', () => {
    console.log('🟢 Connected to projects namespace');
});

projectsSocket.on('disconnect', () => {
    console.log('🔴 Disconnected from projects namespace');
});

projectsSocket.on('project_updated', (data) => {
    console.log('📣 Project update received:', data);
});

projectsSocket.on('task_updated', (data) => {
    console.log('📣 Task update received from projects namespace:', data); 
});

// Tasks socket events
tasksSocket.on('connect', () => {
    console.log('🟢 Connected to tasks namespace');
});

tasksSocket.on('disconnect', () => {
    console.log('🔴 Disconnected from tasks namespace');
});

tasksSocket.on('task_updated', (data) => {
    console.log('📣 Task update received:', data);
    
});

// Comments socket events
commentsSocket.on('connect', () => {
    console.log('🟢 Connected to comments namespace');
});

commentsSocket.on('disconnect', () => {
    console.log('🔴 Disconnected from comments namespace');
});

commentsSocket.on('comment_updated', (data) => {
    console.log('📣 Comment update received:', data);
    
});

commentsSocket.on('comment_deleted', async (data) => {
    console.log('Received comment_deleted event:', data);
    
    // Update the UI to reflect the deleted comment
    renderComments(data.projectId, data.taskId);
    const result = await renderComments(data.projectId, data.taskId);
    updateCommentsInDOM(data.projectId, data.taskId, result.html);
});

// Users socket events
usersSocket.on('connect', () => {
    console.log('🟢 Connected to users namespace');
});

usersSocket.on('disconnect', () => {
    console.log('🔴 Disconnected from users namespace');
});

usersSocket.on('user_updated', (data) => {
    console.log('📣 User update received:', data);
    
    // If current user was updated, refresh profile
    if (data.userId === sessionStorage.getItem("userId")) {
        userProfile();
    }
    
});

// Notifications socket events
notificationsSocket.on('connect', () => {
    console.log('🟢 Connected to notifications namespace');
});

notificationsSocket.on('disconnect', () => {
    console.log('🔴 Disconnected from notifications namespace');
});

notificationsSocket.on('notification', (data) => {
    console.log('📣 Notification received:', data);
    
    // Refresh notifications immediately
    renderNotifications();
    
    // Add notification at the top of recent activity
    addNotificationToRecentActivity(data);
});

// Add a connection status indicator to the header
function initializeStatusIndicator() {
    const headerElement = document.querySelector('header') || document.body;
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'wsStatus';
    statusIndicator.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-full text-xs flex items-center opacity-75 hover:opacity-100 transition-opacity cursor-pointer';
    statusIndicator.innerHTML = '<span class="h-2 w-2 bg-gray-500 rounded-full mr-2"></span> Connecting...';
    statusIndicator.addEventListener('click', () => {
        // Manual reconnection when status indicator is clicked
        checkSocketConnections();
        showToast('info', 'Checking connection status...');
    });
    headerElement.appendChild(statusIndicator);
}

// Update status indicator based on WebSocket state
function updateConnectionStatus() {
    const indicator = document.getElementById('wsStatus');
    if (!indicator) return;
    
    // Check if any socket is connected
    const anyConnected = projectsSocket.connected || 
                        tasksSocket.connected || 
                        usersSocket.connected || 
                        commentsSocket.connected || 
                        notificationsSocket.connected;
    
    if (!anyConnected) {
        indicator.innerHTML = '<span class="h-2 w-2 bg-red-500 rounded-full mr-2"></span> Disconnected (Click to reconnect)';
        indicator.classList.remove('opacity-0');
    } else if (projectsSocket.connected && 
               tasksSocket.connected && 
               usersSocket.connected && 
               commentsSocket.connected && 
               notificationsSocket.connected) {
        indicator.innerHTML = '<span class="h-2 w-2 bg-green-500 rounded-full mr-2"></span> Connected';
        // Hide indicator after 3 seconds if all connected
        setTimeout(() => {
            indicator.classList.add('opacity-0');
        }, 3000);
    } else {
        // Some connected, some not
        indicator.innerHTML = '<span class="h-2 w-2 bg-yellow-500 rounded-full mr-2"></span> Partially Connected';
        indicator.classList.remove('opacity-0');
    }
}

// Function to check socket connections and reconnect if needed
function checkSocketConnections() {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;
    
    let disconnectedSockets = [];
    
    // Check each socket
    if (projectsSocket.disconnected) disconnectedSockets.push('projects');
    if (tasksSocket.disconnected) disconnectedSockets.push('tasks');
    if (usersSocket.disconnected) disconnectedSockets.push('users');
    if (commentsSocket.disconnected) disconnectedSockets.push('comments');
    if (notificationsSocket.disconnected) disconnectedSockets.push('notifications');
    
    // If any sockets are disconnected, reinitialize
    if (disconnectedSockets.length > 0) {
        console.warn('🔄 Some sockets disconnected, reconnecting:', disconnectedSockets.join(', '));
        showToast('info', 'Reconnecting to real-time service...');
        initializeSocketIO();
    }
}

// Initialize Socket.IO connections
function initializeSocketIO() {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
        console.error('Cannot initialize Socket.IO without user ID');
        return;
    }
    
    console.log('🚀 Initializing Socket.IO connections for user:', userId);
    
    // Ensure all sockets are connected
    function connectSocket(socket, namespace) {
        if (socket.disconnected) {
            console.log(`🔌 Connecting to ${namespace} namespace...`);
            socket.connect();
            
            // Add connection verification
            setTimeout(() => {
                if (socket.connected) {
                    console.log(`✅ Connected to ${namespace} namespace successfully`);
                } else {
                    console.error(`❌ Failed to connect to ${namespace} namespace`);
                    // Try to reconnect
                    socket.connect();
                }
            }, 1000);
        } else {
            console.log(`✅ Already connected to ${namespace} namespace`);
        }
    }
    
    // Connect all sockets
    connectSocket(projectsSocket, 'projects');
    connectSocket(tasksSocket, 'tasks');
    connectSocket(usersSocket, 'users');
    connectSocket(commentsSocket, 'comments');
    connectSocket(notificationsSocket, 'notifications');
    
    // Authenticate with user ID to all namespaces
    const auth = { userId };
    
    projectsSocket.emit('authenticate', auth);
    tasksSocket.emit('authenticate', auth);
    usersSocket.emit('authenticate', auth);
    commentsSocket.emit('authenticate', auth);
    notificationsSocket.emit('authenticate', auth);
    
    console.log('🔐 Authentication sent to all namespaces');
    
    // Subscribe to user-specific notifications
    notificationsSocket.emit('subscribe_user', userId);
    console.log('📩 Subscribed to notifications for user:', userId);
    
    // Log socket connection states
    console.log('Socket connection states:');
    console.log('- Projects:', projectsSocket.connected ? 'Connected ✅' : 'Disconnected ❌');
    console.log('- Tasks:', tasksSocket.connected ? 'Connected ✅' : 'Disconnected ❌');
    console.log('- Users:', usersSocket.connected ? 'Connected ✅' : 'Disconnected ❌');
    console.log('- Comments:', commentsSocket.connected ? 'Connected ✅' : 'Disconnected ❌');
    console.log('- Notifications:', notificationsSocket.connected ? 'Connected ✅' : 'Disconnected ❌');
    
    // Display connection status to user
    showToast('info', 'Real-time connection established');
}

export {
    projectsSocket,
    tasksSocket,
    usersSocket,
    commentsSocket,
    notificationsSocket,
    initializeSocketIO,
    initializeStatusIndicator,
    checkSocketConnections,
    updateConnectionStatus
}; 