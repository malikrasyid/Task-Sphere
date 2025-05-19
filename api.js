import { BASE_URL } from './config.js';
import { showToast } from './ui.js';
import { 
    projectsSocket, 
    tasksSocket, 
    usersSocket, 
    commentsSocket, 
    notificationsSocket 
} from './socket.js';
import { handleSessionExpired } from './auth.js';
import { renderProjectPage, renderProject } from './project.js';
import { renderEachTask } from './task.js';
import { renderCalendar } from './calendar.js';
import { updateDashboardIfVisible } from './dashboard.js';
import { renderComments } from './comment.js';

// Fetch projects for a user
async function fetchProjects() {
    const token = sessionStorage.getItem("sessionToken");
    
    try {
        const response = await fetch(`${BASE_URL}/api/projects`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            handleSessionExpired();
            return;
        }

        if (!response.ok) {
            const text = await response.text();
            console.error('Server responded with error:', response.status, text);
            return;
        }

        const data = await response.json();
        const projects = data.projects;
        
        // Join Socket.io channels for each project
        if (projects && projects.length > 0) {
            projects.forEach(project => {
                projectsSocket.emit('join_project', project.projectId);
                console.log(`Socket: Joined project channel: ${project.projectId}`);
            });
        }
        
        return projects;
    } catch (error) {
        console.error('Error fetching projects:', error);
    }
}

// Fetch a specific project by ID
async function fetchProject(projectId) {
    const token = sessionStorage.getItem("sessionToken");
    
    try {
        const response = await fetch(`${BASE_URL}/api/projects?projectId=${projectId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            handleSessionExpired();
            return null;
        }

        if (!response.ok) {
            const text = await response.text();
            console.error('Server responded with error:', response.status, text);
            return null;
        }

        const data = await response.json();
        const project = data.project;
        
        // Join Socket.io channel for this project if we have a project
        if (project) {
            projectsSocket.emit('join_project', project.projectId);
            console.log(`Socket: Joined project channel: ${project.projectId}`);
        }
        
        return project;
    } catch (error) {
        console.error('Error fetching project:', error);
        showToast('error', 'Failed to load project');
        return null;
    }
}

// Fetch tasks for a project
async function fetchTasksFromProject(projectId) {
    const token = sessionStorage.getItem("sessionToken");

    try {
        const response = await fetch(`${BASE_URL}/api/projects/tasks?projectId=${projectId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            handleSessionExpired();
            return;
        }

        const data = await response.json();

        const tasksWithStringDates = data.tasks.map(task => ({
            ...task,
            startDate: task.startDate ? new Date(task.startDate._seconds * 1000).toISOString() : null,
            endDate: task.endDate ? new Date(task.endDate._seconds * 1000).toISOString() : null
        }));
        
        // Join Socket.io channels for each task
        if (tasksWithStringDates && tasksWithStringDates.length > 0) {
            tasksWithStringDates.forEach(task => {
                tasksSocket.emit('join_task', task.taskId);
                commentsSocket.emit('join_comment_thread', task.taskId);
                console.log(`Socket: Joined task and comment channels for task: ${task.taskId}`);
            });
        }
        
        return tasksWithStringDates;
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

// Fetch a specific task by projectId and taskId
async function fetchTaskFromTasks(projectId, taskId) {
    const token = sessionStorage.getItem("sessionToken");

    try {
        const response = await fetch(`${BASE_URL}/api/projects/tasks?projectId=${projectId}&&taskId=${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            handleSessionExpired();
            return;
        }

        if (!response.ok) {
            const text = await response.text();
            console.error('Server responded with error:', response.status, text);
            return;
        }

        const data = await response.json();
        const task = data.task;
        
        // Join Socket.io channel for this task
        if (task) {
            tasksSocket.emit('join_task', task.taskId);
            commentsSocket.emit('join_comment_thread', task.taskId);
            console.log(`Socket: Joined task and comment channels for task: ${task.taskId}`);
            
            // Format dates if they exist
            if (task.startDate) {
                task.startDate = task.startDate._seconds ? 
                    new Date(task.startDate._seconds * 1000).toISOString() : 
                    new Date(task.startDate).toISOString();
            }
            
            if (task.endDate) {
                task.endDate = task.endDate._seconds ? 
                    new Date(task.endDate._seconds * 1000).toISOString() : 
                    new Date(task.endDate).toISOString();
            }
        }
        
        return task;
    } catch (error) {
        console.error('Error fetching task:', error);
        showToast('error', 'Failed to load task');
        return null;
    }
}

// Fetch a user by ID
async function fetchUserById(userId) {
    const token = sessionStorage.getItem("sessionToken");

    try {
        const res = await fetch(`${BASE_URL}/api/users?action=name&userId=${encodeURIComponent(userId)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error('User not found');
        const data = await res.json();
        return data.name || userId;
    } catch (err) {
        console.error('Failed to fetch user by ID:', err);
        return userId;
    }
}

// Fetch comments for a task
async function fetchCommentsFromTask(projectId, taskId) {
    const token = sessionStorage.getItem("sessionToken");

    try {
        // Join comment thread channel for this task
        commentsSocket.emit('join_comment_thread', taskId);
        console.log(`Socket: Joined comment thread for task ${taskId}`);
        
        const response = await fetch(`${BASE_URL}/api/projects/tasks/comments?projectId=${projectId}&&taskId=${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch comments');
        }
        
        const data = await response.json();
        return data.comments;
    } catch (error) {
        console.error('Error fetching comments:', error);
        showToast('error', 'Failed to load comments');
        return [];
    }
}

// Fetch a single comment by ID
async function fetchCommentFromComments(projectId, taskId, commentId) {
    const token = sessionStorage.getItem("sessionToken");

    try {
        // Join comment thread channel for this task if needed
        commentsSocket.emit('join_comment_thread', taskId);
        
        const response = await fetch(`${BASE_URL}/api/projects/tasks/comments?projectId=${projectId}&taskId=${taskId}&commentId=${commentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch comment');
        }
        
        const data = await response.json();
        return data.comment;
    } catch (error) {
        console.error(`Error fetching comment ${commentId}:`, error);
        showToast('error', 'Failed to load comment');
        return null;
    }
}

// Fetch notifications for current user
async function fetchNotifications() {
    const token = sessionStorage.getItem("sessionToken");

    try {      
        const response = await fetch(`${BASE_URL}/api/notifications`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch notifications');
        }
        
        const data = await response.json();
        return data.notifications;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        showToast('error', 'Failed to load notifications');
        return [];
    }
}

// Search for users
async function searchUsers(query) {
    if (query.length < 2) {
        return [];
    }

    try {
        const response = await fetch(`${BASE_URL}/api/users?action=search&query=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem("sessionToken")}`
            }
        });
        
        // Check if session expired
        if (response.status === 401) {
            handleSessionExpired();
            return [];
        }
        
        if (!response.ok) throw new Error('Search failed');
                
        const data = await response.json();
        return data.users;
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
}

// Add a comment to a task
async function addComment(projectId, taskId, message) {
    const token = sessionStorage.getItem("sessionToken");
    
    if (!message) {
        showToast('error', 'Comment cannot be empty');
        return null;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/api/projects/tasks/comments?projectId=${projectId}&&taskId=${taskId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) {
            throw new Error('Failed to add comment');
        }
        
        const result = await response.json();
        
        // Emit to Socket.io about the new comment
        commentsSocket.emit('comment_updated', {
            projectId,
            taskId,
            commentId: result.commentId,
            message,
            userId: sessionStorage.getItem("userId"),
            action: 'add'
        });
        console.log(`Socket: Comment added to task ${taskId}`);
        await renderComments(projectId, taskId);
        await renderCommentFromComments(projectId, taskId, result.commentId);

        // Show toast notification
        showToast('success', 'Comment added successfully');
        return result;
    } catch (error) {
        console.error('Error adding comment:', error);
        showToast('error', 'Failed to add comment');
        return null;
    }
}

// Delete a comment
async function deleteComment(projectId, taskId, commentId) {
    const token = sessionStorage.getItem("sessionToken");

    if (!confirm('Are you sure you want to delete this comment?')) {
        return false;
    }

    commentsSocket.emit('join_task', { projectId, taskId });
    
    try {
        const response = await fetch(`${BASE_URL}/api/projects/tasks/comments?projectId=${projectId}&&taskId=${taskId}&&commentId=${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete comment');
        }
        
        // Emit to Socket.io about the deleted comment
        commentsSocket.emit('comment_updated', {
            projectId,
            taskId,
            commentId,
            userId: sessionStorage.getItem("userId"),
            action: 'delete'
        });
        console.log(`Socket: Comment deleted from task ${taskId}`);
        await renderComments(projectId, taskId);
        
        // Show toast notification
        showToast('success', 'Comment deleted successfully');
        return true;
    } catch (error) {
        console.error('Error deleting comment:', error);
        showToast('error', 'Failed to delete comment');
        return false;
    }
}

// Mark notification as read
async function markNotificationAsRead(notificationId) {
    const token = sessionStorage.getItem("sessionToken");

    try {
        const response = await fetch(`${BASE_URL}/api/notifications?notificationId=${notificationId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to mark notification as read');
        }
        
        // Emit to Socket.io about the read notification
        notificationsSocket.emit('notification_updated', {
            notificationId,
            userId: sessionStorage.getItem("userId"),
            action: 'read'
        });
        
        return true;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        showToast('error', 'Failed to update notification');
        return false;
    }
}

// Mark all notifications as read
async function markAllNotificationsAsRead() {
    const token = sessionStorage.getItem("sessionToken");
    
    try {
        const response = await fetch(`${BASE_URL}/api/notifications`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to mark all notifications as read');
        }
        
        const data = await response.json();
        showToast('success', `Marked ${data.count} notifications as read`);
        
        // Emit to Socket.io about all notifications being read
        notificationsSocket.emit('notifications_all_read', {
            userId: sessionStorage.getItem("userId")
        });
        
        return true;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        showToast('error', 'Failed to update notifications');
        return false;
    }
}

// Send a notification
async function fetchSendNotification(userId, title, body, link = null) {
    const token = sessionStorage.getItem("sessionToken");
    const senderUserId = sessionStorage.getItem("userId");
    if (!token || !senderUserId || !userId || !title || !body) return;
    
    try {
        const response = await fetch(`${BASE_URL}/api/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId, title, body, link })
        });
        
        if (response.ok) {
            const result = await response.json();
            // Call Socket.io function after successful API call
            notificationsSocket.emit('notification', { 
                userId, 
                title, 
                body, 
                link,
                notificationId: result.notificationId,
                senderId: senderUserId,
                timestamp: new Date().toISOString()
            });
            console.log(`API and Socket: Sent notification to user ${userId}`);
            return result;
        } else {
            throw new Error('Failed to send notification');
        }
    } catch (error) {
        console.error('Error sending notification:', error);
        return null;
    }
}

// Create a project
async function createProject(projectData) {
    try {
        const response = await fetch(`${BASE_URL}/api/projects`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem("sessionToken")}`
            },
            body: JSON.stringify(projectData)
        });

        // Check if session expired
        if (response.status === 401) {
            handleSessionExpired();
            return null;
        }
        
        if (!response.ok) {
            throw new Error('Failed to create project');
        }
        
        const result = await response.json();
        
        // Emit to Socket.io about the new project
        projectsSocket.emit('project_updated', { 
            projectId: projectData.projectId, 
            action: 'add',
            project: projectData
        });
        console.log(`Socket: Created new project ${projectData.projectId}`);
        
        showToast('success', 'Project created successfully');
        return result;
    } catch (error) {
        console.error('Error creating project:', error);
        showToast('error', 'Failed to create project');
        return null;
    }
}

// Delete a project
async function deleteProject(projectId) {
    const token = sessionStorage.getItem("sessionToken");
    if (!confirm('Are you sure you want to delete this project?')) return false;

    try {
        const response = await fetch(`${BASE_URL}/api/projects?projectId=${projectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Deleting project:', projectId);

        if (response.ok) {
            projectsSocket.emit('project_updated', { 
                projectId, 
                action: 'delete'
            });
            console.log(`Socket: Deleted project ${projectId}`);
            
            showToast('success', 'Project deleted successfully');
            return true;
        } else {
            const data = await response.json();
            showToast('error', 'Error deleting project: ' + data.error);
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Failed to delete project.');
        return false;
    }
}

// Update a project
async function fetchUpdateProject(projectId, updateData) {
    const token = sessionStorage.getItem("sessionToken");
    if (!token || !projectId || !updateData) return;
    
    try {
        const response = await fetch(`${BASE_URL}/api/projects?projectId=${projectId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            // Call Socket.io function after successful API call
            projectsSocket.emit('project_updated', { projectId, ...updateData });
            console.log(`API and Socket: Updated project ${projectId}`);
            
            // Immediately update UI for the client that made the change
            showToast('success', 'Project updated successfully');
            renderProjectPage();
            updateDashboardIfVisible();
            
            return await response.json();
        } else {
            throw new Error('Failed to update project');
        }
    } catch (error) {
        console.error('Error updating project:', error);
        showToast('error', 'Failed to update project');
        return null;
    }
}

// Add a task
async function addTask(projectId, taskData) {
    try {
        const response = await fetch(`${BASE_URL}/api/projects/tasks?projectId=${projectId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem("sessionToken")}`
            },
            body: JSON.stringify(taskData)
        });

        // Check if session expired
        if (response.status === 401) {
            handleSessionExpired();
            return null;
        }

        if (response.ok) {
            const result = await response.json();
            
            // Emit to Socket.io about the new task
            tasksSocket.emit('task_updated', { 
                projectId, 
                taskId: taskData.taskId, 
                action: 'add',
                task: taskData
            });
            console.log(`Socket: New task added to project ${projectId}`);
            
            // Also join task channel for real-time updates
            tasksSocket.emit('join_task', taskData.taskId);
            commentsSocket.emit('join_comment_thread', taskData.taskId);
            
            // Show toast notification
            showToast('success', 'Task added successfully');
            
            return result;
        } else {
            const data = await response.json();
            showToast('error', data.error || 'Error adding task');
            return null;
        }
    } catch (error) {
        console.error('Error adding task:', error);
        showToast('error', 'Error adding task');
        return null;
    }
}

// Delete a task
async function deleteTask(projectId, taskId) {
    const token = sessionStorage.getItem("sessionToken");
    if (!confirm('Are you sure you want to delete this task?')) return false;

    try {
        const response = await fetch(`${BASE_URL}/api/projects/tasks?projectId=${projectId}&&taskId=${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Deleting task from project:', projectId, taskId);

        if (response.ok) {
            tasksSocket.emit('task_updated', { 
                projectId, 
                taskId, 
                action: 'delete'
            });
            console.log(`Socket: Deleted task ${taskId} from project ${projectId}`);
            
            showToast('success', 'Task deleted successfully');
            return true;
        } else {
            const data = await response.json();
            showToast('error', 'Error deleting task: ' + data.error);
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Failed to delete task.');
        return false;
    }
}

// Update a task
async function fetchUpdateTask(projectId, taskId, updateData) {
    const token = sessionStorage.getItem("sessionToken");
    if (!token || !projectId || !taskId || !updateData) return;
    
    try {
        const response = await fetch(`${BASE_URL}/api/projects/tasks?projectId=${projectId}&&taskId=${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            // Call Socket.io function after successful API call
            tasksSocket.emit('task_updated', { projectId, taskId, ...updateData });
            console.log(`API and Socket: Updated task ${taskId} in project ${projectId}`);
            
            // Immediately update UI for the client that made the change
            showToast('success', 'Task updated successfully');
            renderEachTask(taskId, projectId);
            
            // Update calendar if visible
            if (document.getElementById('calendarSection') && !document.getElementById('calendarSection').classList.contains('hidden')) {
                renderCalendar();
            }
            
            updateDashboardIfVisible();
            
            return await response.json();
        } else {
            throw new Error('Failed to update task');
        }
    } catch (error) {
        console.error('Error updating task:', error);
        showToast('error', 'Failed to update task');
        return null;
    }
}

// Add member to project
async function addMemberToProject(projectId, userId, role) {
    try {
        const response = await fetch(`${BASE_URL}/api/projects/member.js?projectId=${projectId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem("sessionToken")}`
            },
            body: JSON.stringify({
                action: "add",
                userId: userId,
                role: role
            })
        });

        // Check if session expired
        if (response.status === 401) {
            handleSessionExpired();
            return false;
        }
        
        if (!response.ok) throw new Error('Failed to add member');

        // Emit Socket.io event to notify other users about the new team member
        projectsSocket.emit('project_updated', { 
            projectId, 
            action: 'add_member',
            memberId: userId,
            memberRole: role
        });
        console.log(`Socket: Added member ${userId} to project ${projectId}`);

        showToast('success', `Added member to project`);
        return true;
    } catch (error) {
        console.error('Error adding member:', error);
        showToast('error', 'Failed to add member to project');
        return false;
    }
}

export {
    fetchProjects,
    fetchProject,
    fetchTasksFromProject,
    fetchTaskFromTasks,
    fetchUserById,
    fetchCommentsFromTask,
    fetchCommentFromComments,
    fetchNotifications,
    searchUsers,
    addComment,
    deleteComment,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    fetchSendNotification,
    createProject,
    deleteProject,
    fetchUpdateProject,
    addTask,
    deleteTask,
    fetchUpdateTask,
    addMemberToProject
}; 