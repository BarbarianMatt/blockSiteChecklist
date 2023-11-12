//document.title = browser.i18n.getMessage('tasksPageTitle');
//i18nParse();

let taskCounter = 1;

function addTask() {
    const tasksForm = document.getElementById('tasksForm');

    const label = document.createElement('label');
    label.textContent = `Task ${taskCounter}:`;

    const input = document.createElement('input');
    input.type = 'text';
    input.id = `task${taskCounter}`;
    input.name = `task${taskCounter}`;
    input.required = true;

    tasksForm.insertBefore(label, tasksForm.lastChild);
    tasksForm.insertBefore(input, tasksForm.lastChild);

    taskCounter++;
}

function deleteTask() {
    const tasksForm = document.getElementById('tasksForm');
    if (taskCounter > 1) {
        taskCounter--;

        const taskId = `task${taskCounter}`;
        const taskInput = document.getElementById(taskId);
        const taskLabel = taskInput.previousElementSibling;

        tasksForm.removeChild(taskInput);
        tasksForm.removeChild(taskLabel);
    }
}


function saveTasks() {
    const tasksForm = document.getElementById('tasksForm');
    const taskInputs = tasksForm.querySelectorAll('input[type="text"]');
    
    const tasks = Array.from(taskInputs).map(input => {
        return {
            task: input.value.trim(),
            completed: false // Set the initial completion state to false
        };
    });

    browser.storage.sync.set({
        tasks: tasks
    });

    // Close the tasks page
    browser.runtime.sendMessage({ command: 'CLOSE_TASKS_PAGE' });
}

document.getElementById('addTaskButton').addEventListener('click', addTask);
document.getElementById('deleteTaskButton').addEventListener('click', deleteTask);
document.getElementById('saveTasksButton').addEventListener('click', saveTasks);

// Add initial task fields
addTask();
addTask();
