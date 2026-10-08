// Wait until the page is ready before connecting the form and checklist.
document.addEventListener("DOMContentLoaded", function () {
  const storageKey = "slp_prototype_week";
  const formCard = document.getElementById("form-card");
  const checklistCard = document.getElementById("checklist-card");
  const weekForm = document.getElementById("week-form");
  const goalHeading = document.getElementById("saved-goal-heading");
  const taskList = document.getElementById("task-list");
  const newWeekButton = document.getElementById("new-week-button");
  let currentWeek = null;

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
    } catch (error) {
      console.error("Unable to clear the saved week:", error);
      alert("The saved week could not be cleared. Please check browser storage and try again.");
    }
  }

  weekForm.addEventListener("submit", saveWeek);
  taskList.addEventListener("change", updateTask);
  newWeekButton.addEventListener("click", startNewWeek);
  loadSavedWeek();
});
