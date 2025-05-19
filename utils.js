// Format a date to a readable string
function formatDateUTC(dateStr) {
    if (!dateStr) return '-';

    const date = new Date(dateStr);
    if (isNaN(date)) return '-';

    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short'
    });
}

// Convert string to title case
function toTitleCase(str) {
    if (!str) return '';
    return str.replace(/\w\S*/g, txt =>
        txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
    );
}

// Get color for task status
function getTaskColor(status) {
    switch(status.toLowerCase()) {
        case 'done':
            return '#10B981'; // green-500
        case 'ongoing':
            return '#3B82F6'; // blue-500
        case 'overdue':
            return '#EF4444'; // red-500
        case 'not started':
        default:
            return '#6B7280'; // gray-500
    }
}

// Calculate duration between dates
function calculateDuration(start, end) {
    if (!start || !end) return '';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
            const diffMinutes = Math.floor(diffTime / (1000 * 60));
            return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
        }
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
        const diffWeeks = Math.floor(diffDays / 7);
        return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''}`;
    } else {
        const diffMonths = Math.floor(diffDays / 30);
        return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
    }
}

// Get contrast color for background
function getContrastColor(hexColor) {
    // Remove # if present
    if (hexColor.startsWith('#')) {
        hexColor = hexColor.slice(1);
    }
    
    // Convert to RGB
    let r = parseInt(hexColor.substr(0, 2), 16);
    let g = parseInt(hexColor.substr(2, 2), 16);
    let b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calculate luminance
    let luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for bright colors, white for dark colors
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// Lighten a color by percentage
function lightenColor(hex, percent) {
    // Remove # if present
    if (hex.startsWith('#')) {
        hex = hex.slice(1);
    }
    
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);
    
    r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
    g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
    b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));
    
    const rr = r.toString(16).padStart(2, '0');
    const gg = g.toString(16).padStart(2, '0');
    const bb = b.toString(16).padStart(2, '0');
    
    return `#${rr}${gg}${bb}`;
}

// Auto-determine task status based on dates
function getAutoStatus(startDate, endDate) {
    const now = new Date();

    let start, end;
    
    // Handle Firestore Timestamp objects
    if (startDate && typeof startDate.toDate === 'function') {
        start = startDate.toDate();
    } else {
        start = startDate instanceof Date ? startDate : new Date(startDate);
    }
    
    if (endDate && typeof endDate.toDate === 'function') {
        end = endDate.toDate();
    } else {
        end = endDate instanceof Date ? endDate : new Date(endDate);
    }
    
    // Verify dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Invalid date objects in getAutoStatus:', { start, end });
        // Return a safe default if dates are invalid
        return 'Not Started';
    }
    
    if (now < start) return 'Not Started';
    if (now >= start && now <= end) return 'Ongoing';
    if (now > end) return 'Overdue';
}

function updateCommentsInDOM(projectId, taskId, commentsHTML) {
    // Select the container where comments are displayed
    const commentsContainer = document.getElementById('comments-container');
    
    // If the container exists, update its content
    if (commentsContainer) {
        commentsContainer.innerHTML = commentsHTML;
    } else {
        console.error('Comments container not found in DOM');
    }
}

export {
    updateCommentsInDOM,
    formatDateUTC,
    toTitleCase,
    getTaskColor,
    calculateDuration,
    getContrastColor,
    lightenColor,
    getAutoStatus
}; 