import { BASE_URL } from './config.js';
import { showToast } from './ui.js';
import { initializeSocketIO } from './socket.js';

let selectedUser = null;

async function login() {
    const action = "login";
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    
    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/auth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, email, password })
        });
        const data = await response.json();
        if (response.ok) {
            // Store all auth data in sessionStorage with consistent keys
            sessionStorage.setItem("sessionToken", data.token);
            sessionStorage.setItem("userId", data.userId);
            sessionStorage.setItem("userFullName", `${data.firstName} ${data.lastName}`);
            sessionStorage.setItem("userEmail", data.email || email);

            // Update header text to show user's name
            document.querySelector('h1.text-xl.font-semibold.text-gray-800').textContent = `${data.firstName} ${data.lastName}`;

            showToast('success', "Login successful");
            showMainSection();
            initializeSocketIO(); // Initialize Socket.IO connections

        } else {
            showToast('error', data.error || "Login failed");
        }
    } catch (error) {
        console.error("Login failed:", error);
        showToast('error', "Login failed. Please check your connection and try again.");
    }
}

async function signUp() {
    const action = "signup";
    const firstName = document.getElementById("signupFirstName").value;
    const lastName = document.getElementById("signupLastName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    if (!firstName || !lastName || !email || !password) {
        alert("Please fill in all required fields");
        return;
    }
    
    if (password.length < 8) {
        alert("Password must be at least 8 characters long");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/auth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, firstName, lastName, email, password })
        });
        const data = await response.json();
        if (response.ok) {
            sessionStorage.setItem("userId", data.uid);
            sessionStorage.setItem("sessionToken", data.sessionToken);
            sessionStorage.setItem("userEmail", email);
            
            showMainSection();
        } else {
            alert(data.error  || "Signup failed");
        }
    } catch (error) {
        console.error("Signup failed:", error);
    }
}

function logout() {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("sessionToken");
    sessionStorage.removeItem("userEmail");

    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('mainSection').classList.add('hidden');
}

function handleSessionExpired() {
    alert("Your session has expired. Please log in again.");
    logout();
}

function showMainSection() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('mainSection').classList.remove('hidden');

    // Update header with user's full name
    const userFullName = sessionStorage.getItem("userFullName");
    if (userFullName) {
        document.querySelector('h1.text-xl.font-semibold.text-gray-800').textContent = userFullName;
    }
}

function toggleAuth() {
    document.getElementById('loginForm').classList.toggle('hidden');
    document.getElementById('signupForm').classList.toggle('hidden');
}

// Fetch function for user updates
async function fetchUpdateUserProfile(userData) {
    const token = sessionStorage.getItem("sessionToken");
    const userId = sessionStorage.getItem("userId");
    if (!token || !userId || !userData) return;
    
    try {
        const response = await fetch(`${BASE_URL}/api/users?userId=${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            // Call Socket.io function after successful API call
            usersSocket.emit('user_updated', { userId, ...userData });
            console.log(`API and Socket: Updated user profile for ${userId}`);
            
            // Immediately update UI for the client that made the change
            showToast('success', 'Profile updated successfully');
            userProfile(); // Update user profile display
            
            return await response.json();
        } else {
            throw new Error('Failed to update user profile');
        }
    } catch (error) {
        console.error('Error updating user profile:', error);
        showToast('error', 'Failed to update profile');
        return null;
    }
}

export { 
    login, 
    signUp, 
    logout, 
    handleSessionExpired, 
    showMainSection, 
    toggleAuth,
    fetchUpdateUserProfile,
    selectedUser
}; 