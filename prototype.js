// Wait until the page is ready before connecting the form and checklist.
document.addEventListener("DOMContentLoaded", function () {
  const storageKey = "slp_prototype_week";
  const formCard = document.getElementById("form-card");
  const checklistCard = document.getElementById("checklist-card");
  const weekForm = document.getElementById("week-form");
  const goalHeading = document.getElementById("saved-goal-heading");
  const taskList = document.getElementById("task-list");
  const progressText = document.getElementById("progress-text");
  const progressTrack = document.querySelector(".progress-track");
  const progressBar = document.getElementById("progress-bar");
  const daysLeftText = document.getElementById("days-left");
  const newWeekButton = document.getElementById("new-week-button");
  const feedbackText = document.getElementById("feedback-text");
  const sendFeedbackButton = document.getElementById("send-feedback");
  const feedbackSuccess = document.getElementById("feedback-success");
  let currentWeek = null;

  // Send a custom event when Vercel Web Analytics is available.
  function trackEvent(name) {
    if (typeof window.va === "function") {
      try {
        window.va("event", { name: name });
      } catch (error) {
        console.error("Unable to send analytics event:", error);
      }
    }
  }

  // Check that stored data has the fields this prototype uses.
  function isValidWeek(week) {
    return Boolean(
      week &&
      typeof week.goal === "string" &&
      Array.isArray(week.tasks) &&
      week.tasks.every(function (task) {
        return (
          task &&
          typeof task.text === "string" &&
          typeof task.done === "boolean"
        );
      }) &&
      typeof week.savedAt === "string"
    );
  }

  // Show the saved week and hide the planning form.
  function showChecklist() {
    formCard.hidden = true;
    checklistCard.hidden = false;
  }

  // Show the planning form and hide the saved checklist.
  function showForm() {
    checklistCard.hidden = true;
    formCard.hidden = false;
  }

  // Count completed tasks and update the progress text and bar.
  function updateProgress() {
    const tasks = currentWeek ? currentWeek.tasks : [];
    const completedTasks = tasks.filter(function (task) {
      return task.done;
    }).length;
    const totalTasks = tasks.length;
    const percentage = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

    progressText.textContent = completedTasks + " of " + totalTasks + " tasks done";
    progressBar.style.width = percentage + "%";
    progressTrack.setAttribute("aria-valuenow", String(Math.round(percentage)));
  }

  // Show the number of days left after today, using Monday as day one.
  function updateDaysLeft() {
    const dayOfWeek = new Date().getDay();

    if (dayOfWeek === 0) {
      daysLeftText.textContent = "This week is over. Start a new one.";
      return;
    }

    const daysLeft = 7 - dayOfWeek;
    daysLeftText.textContent = "Days left this week: " + daysLeft;
  }

  // Build the goal heading and task rows from the saved week.
  function renderChecklist() {
    goalHeading.textContent = currentWeek.goal;
    taskList.replaceChildren();

    currentWeek.tasks.forEach(function (task, index) {
      const row = document.createElement("li");
      const checkbox = document.createElement("input");
      const label = document.createElement("label");
      const checkboxId = "saved-task-" + index;

      checkbox.type = "checkbox";
      checkbox.id = checkboxId;
      checkbox.checked = task.done;
      checkbox.dataset.taskIndex = index;

      label.htmlFor = checkboxId;
      label.textContent = task.text;

      row.append(checkbox, label);
      taskList.appendChild(row);
    });

    showChecklist();
    updateProgress();
    updateDaysLeft();
  }

  // Load and display a previously saved week, reporting invalid or inaccessible data.
  function loadSavedWeek() {
    try {
      const savedWeek = localStorage.getItem(storageKey);

      if (savedWeek === null) {
        return;
      }

      const parsedWeek = JSON.parse(savedWeek);

      if (!isValidWeek(parsedWeek)) {
        throw new Error("Saved week data has an unexpected format.");
      }

      currentWeek = parsedWeek;
      renderChecklist();
    } catch (error) {
      console.error("Unable to load the saved week:", error);
      alert("Saved week data could not be loaded. Please check browser storage.");
    }
  }

  // Read the form, validate the goal, then save the new week to localStorage.
  function saveWeek(event) {
    event.preventDefault();

    const goal = document.getElementById("week-goal").value.trim();

    if (goal === "") {
      alert("Please enter a goal.");
      return;
    }

    const tasks = [];
    const taskInputIds = ["task-1", "task-2", "task-3"];

    taskInputIds.forEach(function (inputId) {
      const taskText = document.getElementById(inputId).value.trim();

      if (taskText !== "") {
        tasks.push({ text: taskText, done: false });
      }
    });

    const week = {
      goal: goal,
      tasks: tasks,
      savedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(week));
      currentWeek = week;
      // Track the first save for this week's goal.
      trackEvent("goal_saved");
      renderChecklist();
    } catch (error) {
      console.error("Unable to save the week:", error);
      alert("Your week could not be saved. Please check browser storage and try again.");
    }
  }

  // Save a changed checkbox state and redraw the checklist.
  function updateTask(event) {
    const checkbox = event.target;

    if (checkbox.type !== "checkbox" || !checkbox.dataset.taskIndex) {
      return;
    }

    const taskIndex = Number(checkbox.dataset.taskIndex);

    if (!Number.isInteger(taskIndex) || !currentWeek.tasks[taskIndex]) {
      return;
    }

    const previousDoneState = currentWeek.tasks[taskIndex].done;
    currentWeek.tasks[taskIndex].done = checkbox.checked;

    try {
      localStorage.setItem(storageKey, JSON.stringify(currentWeek));
      if (checkbox.checked && !previousDoneState) {
        // Track a task when it is marked complete.
        trackEvent("task_completed");
      }
      renderChecklist();
    } catch (error) {
      currentWeek.tasks[taskIndex].done = previousDoneState;
      renderChecklist();
      console.error("Unable to update the saved task:", error);
      alert("Your task update could not be saved. Please check browser storage and try again.");
    }
  }

  // Confirm before clearing the saved week and returning to the empty form.
  function startNewWeek() {
    const shouldStartFresh = confirm("Clear this week and start fresh?");

    if (!shouldStartFresh) {
      return;
    }

    try {
      localStorage.removeItem(storageKey);
      currentWeek = null;
      weekForm.reset();
      showForm();
      // Track a confirmed reset of the current week.
      trackEvent("week_reset");
    } catch (error) {
      console.error("Unable to clear the saved week:", error);
      alert("The saved week could not be cleared. Please check browser storage and try again.");
    }
  }

  // Validate feedback, open a prefilled email, and show the confirmation.
  function sendFeedback() {
    const feedback = feedbackText.value.trim();

    if (feedback === "") {
      alert("Please write something first.");
      return;
    }

    // Track feedback after the tester submits non-empty feedback.
    trackEvent("feedback_sent");
    // Replace YOUR-EMAIL-HERE with your real email address.
    window.location.href = "mailto:YOUR-EMAIL-HERE?subject=Prototype feedback&body=" + encodeURIComponent(feedback);
    feedbackSuccess.hidden = false;
    feedbackText.value = "";
  }

  weekForm.addEventListener("submit", saveWeek);
  taskList.addEventListener("change", updateTask);
  newWeekButton.addEventListener("click", startNewWeek);
  sendFeedbackButton.addEventListener("click", sendFeedback);
  loadSavedWeek();
  updateProgress();
  updateDaysLeft();
});
