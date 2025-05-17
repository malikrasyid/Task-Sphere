# Task Sphere

Task Sphere is a real-time task management application with Socket.IO integration for instant updates across clients.

## Features

- Project management with tasks and team members
- Real-time updates using Socket.IO
- Task status tracking (Not Started, Ongoing, Overdue, Done)
- Comment system for tasks
- Calendar view for deadlines
- Dashboard with analytics and summaries
- Notification system

## Technologies Used

- JavaScript (ES6+)
- Socket.IO for real-time communication
- TailwindCSS for styling
- FullCalendar for calendar integration
- Vite for development and building

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Structure

The application is organized into modular JavaScript files:

- `main.js` - Entry point and event listeners
- `api.js` - API fetch functions
- `auth.js` - Authentication functions
- `socket.js` - Socket.IO setup and event handlers
- `ui.js` - UI utility functions
- `utils.js` - General utility functions
- `project.js` - Project rendering and management
- `task.js` - Task rendering and management
- `comment.js` - Comment rendering and management
- `calendar.js` - Calendar functionality
- `dashboard.js` - Dashboard rendering
- `notification.js` - Notification system
- `modals.js` - Modal handling

## Backend Integration

This frontend connects to a backend server that should provide the following endpoints:

- Authentication: `/api/auth`
- Projects: `/api/projects`
- Tasks: `/api/projects/tasks`
- Comments: `/api/projects/tasks/comments`
- Users: `/api/users`
- Notifications: `/api/notifications`

The backend should also run Socket.IO with the following namespaces:
- `/projects`
- `/tasks`
- `/users`
- `/comments`
- `/notifications` 