import { formatDateUTC } from './utils.js';
import { fetchUserById, fetchCommentsFromTasks, fetchCommentFromComments } from './api.js';
import { toTitleCase } from './utils.js';

// Function to render a single comment card
async function renderEachComment(projectId, taskId, commentId) {
    const comment = await fetchCommentFromComments(projectId, taskId, commentId);
    const name = toTitleCase(await fetchUserById(comment.userId));
    return `
        <div class="bg-white rounded-lg border border-gray-100 p-3 mb-2 hover:shadow-sm transition-shadow">
            <div class="flex items-center justify-between">
                <div class="font-medium text-sm text-gray-900">${name}</div>
                <button onclick="deleteComment('${projectId}', '${taskId}', '${comment.commentId}'); event.stopPropagation();" 
                    class="text-gray-400 hover:text-red-500 transition-colors">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
            <div class="text-sm mt-1">${comment.message}</div>
            <div class="text-xs text-gray-400 mt-1">${formatDateUTC(comment.timestamp)}</div>
        </div>
    `;
}

async function renderComments(projectId, taskId) {
    const comments = await fetchCommentsFromTasks(projectId, taskId) || [];
    
    return {
        comments,
        html: (await Promise.all(comments.map(comment => 
            renderEachComment(projectId, taskId, comment.commentId)
        ))).join('')
    };
}

// Function to update comments container for a specific task
async function updateTaskComments(projectId, taskId) {
    const commentContainer = document.querySelector(`#task-${taskId} .comments-container`);
    if (commentContainer) {
        const { html } = await fetchComments(projectId, taskId);
        commentContainer.innerHTML = html;
    }
}

export {
    renderEachComment,
    renderComments,
    updateTaskComments
}; 