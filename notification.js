import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from './api.js';
import { formatDateUTC } from './utils.js';

// Function to update/refresh notifications
async function renderNotifications() {
    const container = document.getElementById('notifications-container');
    if (!container) return;
    
    // Show loading indicator
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center p-6 text-center text-gray-500">
            <svg class="w-6 h-6 animate-spin mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading notifications...
        </div>
    `;
    
    // Fetch notifications
    const notifications = await fetchNotifications();
    const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;
    
    // Update notification badge
    const badge = document.getElementById('notification-badge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
    
    // If no notifications
    if (!notifications || notifications.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center p-6 text-center text-gray-500">
                <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                No notifications
            </div>
        `;
        return;
    }
    
    // Sort notifications by timestamp (newest first)
    notifications.sort((a, b) => {
        return new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt);
    });
    
    // Generate notifications HTML
    let html = `
        <div class="border-b border-gray-200 flex justify-between items-center p-3">
            <h3 class="font-medium text-gray-800">Notifications</h3>
            <button onclick="markAllNotificationsAsRead()" class="text-xs text-indigo-600 hover:text-indigo-800">
                Mark all as read
            </button>
        </div>
        <div class="max-h-80 overflow-y-auto">
    `;
    
    // Add notifications
    notifications.forEach(notification => {
        const isRead = notification.read;
        const timestamp = formatDateUTC(notification.timestamp || notification.createdAt);
        const link = notification.link || '#';
        
        html += `
            <div class="border-b border-gray-100 hover:bg-gray-50">
                <a href="${link}" class="block p-3" onclick="markNotificationAsRead('${notification.notificationId}')">
                    <div class="flex justify-between items-start">
                        <div class="flex-grow pr-3">
                            <h4 class="text-sm font-medium ${isRead ? 'text-gray-700' : 'text-indigo-700'}">${notification.title}</h4>
                            <p class="text-xs text-gray-500 mt-1">${notification.body}</p>
                            <span class="text-xs text-gray-400 block mt-1">${timestamp}</span>
                        </div>
                        ${!isRead ? '<span class="h-2 w-2 bg-indigo-500 rounded-full flex-shrink-0"></span>' : ''}
                    </div>
                </a>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}

// Function to add a new notification to the recent activity section
function addNotificationToRecentActivity(notification) {
    const recentActivity = document.getElementById('recentActivity');
    if (!recentActivity) return;
    
    const activityItem = document.createElement('li');
    activityItem.classList.add('bg-white', 'rounded-lg', 'border', 'border-gray-200', 'shadow-sm', 'p-3', 'flex', 'items-start');
    
    let icon = '';
    if (notification.title.includes('Task')) {
        icon = '<svg class="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v.01a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v.01a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';
    } else if (notification.title.includes('Project')) {
        icon = '<svg class="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path></svg>';
    } else {
        icon = '<svg class="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>';
    }
    
    activityItem.innerHTML = `
        ${icon}
        <div>
            <div class="text-sm font-medium text-gray-900">${notification.title}</div>
            <p class="text-xs text-gray-500 mt-1">${notification.body}</p>
            <p class="text-xs text-gray-400 mt-1">${formatDateUTC(notification.timestamp || notification.createdAt)}</p>
        </div>
    `;
    
    // Add to the beginning of the list
    if (recentActivity.firstChild) {
        recentActivity.insertBefore(activityItem, recentActivity.firstChild);
    } else {
        recentActivity.appendChild(activityItem);
    }
    
    // Limit to 5 most recent activities
    const children = recentActivity.children;
    if (children.length > 5) {
        for (let i = 5; i < children.length; i++) {
            recentActivity.removeChild(children[i]);
        }
    }
}

// Make functions available to window for inline event handlers
window.markNotificationAsRead = markNotificationAsRead;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;

export { 
    renderNotifications,
    addNotificationToRecentActivity
}; 