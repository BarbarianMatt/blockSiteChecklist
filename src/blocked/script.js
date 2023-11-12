// Fetch tasks from storage and create a checklist
browser.storage.sync.get('tasks').then((result) => {
    let tasks = (result.tasks || []).filter(task => task.task.trim() !== "");
    // Check if tasks array is empty
    if (tasks.length === 0) {
        // Create a default task
        const defaultTask = {
            task: 'No Tasks Saved',
            completed: false
        };

        // Add the default task to the tasks array
        tasks = [defaultTask];

        // Save the default task to storage
        browser.storage.sync.set({
            tasks: tasks
        });
    }
    const tasksChecklist = document.getElementById('tasksChecklist');

    tasks.forEach((task, index) => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" id="taskCheckbox${index}" value="${task.task}">
            <i></i>
            <span>${task.task}</span>
        `;
        label.addEventListener('change', handleCheckboxChange);

        // Load the checked state from storage
        const checkbox = label.querySelector('input[type="checkbox"]');
        checkbox.checked = task.completed;

        tasksChecklist.appendChild(label);
    });
});

function handleCheckboxChange() {
    const checkboxes = document.querySelectorAll('#tasksChecklist input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);

    // Save the checked state to storage for each task
    const tasksKey = 'tasks';
    browser.storage.sync.get(tasksKey).then((result) => {
        const tasks = result[tasksKey] || [];
        checkboxes.forEach((checkbox, index) => {
            tasks[index].completed = checkbox.checked;
        });
        browser.storage.sync.set({
            tasks: tasks
        });
    });

    // Send a message to background.js to handle temporary allowance only when all tasks are checked
    browser.runtime.sendMessage({ command: 'ALLOW_TEMPORARILY', allowTemporarily: allChecked });
}
