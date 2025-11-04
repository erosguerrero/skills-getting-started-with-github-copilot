// Global variables for DOM elements
let activitiesList;
let activitySelect;
let signupForm;
let messageDiv;

// Global function to handle participant deletion
async function deleteParticipant(activity, email) {
  console.log('Attempting to delete:', { activity, email });
  messageDiv = document.getElementById("message"); // Ensure we have the message div
  
  try {
    const url = `/activities/${encodeURIComponent(activity)}/participants/remove?email=${encodeURIComponent(email)}`;
    console.log('Request URL:', url);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        'Accept': 'application/json'
      }
    });
    
    let result;
    const textResponse = await response.text();
    console.log('Raw server response:', textResponse);
    
    try {
      result = JSON.parse(textResponse);
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      throw new Error('Invalid server response');
    }
    
    if (response.ok) {
      console.log('Participant removed successfully:', result);
      await fetchActivities(); // Refresh the activities list
      messageDiv.textContent = "Participant removed successfully";
      messageDiv.className = "message success";
    } else {
      console.error('Server error:', result);
      throw new Error(result.detail || "Server returned an error");
    }
  } catch (error) {
    console.error("Error removing participant:", error);
    messageDiv.textContent = error.message || "Failed to remove participant. Please try again.";
    messageDiv.className = "message error";
  } finally {
    messageDiv.classList.remove("hidden");
    setTimeout(() => messageDiv.classList.add("hidden"), 3000);
  }
}

// Function to fetch activities from API
let fetchActivities;

document.addEventListener("DOMContentLoaded", () => {
  // Initialize DOM element references
  activitiesList = document.getElementById("activities-list");
  activitySelect = document.getElementById("activity");
  signupForm = document.getElementById("signup-form");
  messageDiv = document.getElementById("message");
fetchActivities = async function() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Current Participants</h5>
            ${details.participants.length > 0 
              ? `<ul class="participants-list">
                  ${details.participants.map(email => `
                    <li>
                      ${email}
                      <span class="delete-participant" onclick="deleteParticipant('${name.replace("'", "\\'")}', '${email.replace("'", "\\'")}')">✕</span>
                    </li>
                  `).join('')}
                </ul>`
              : `<p class="no-participants">No participants yet</p>`
            }
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list to show the new participant
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
