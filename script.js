let currentSection = '';
let workoutQueue = [];
let currentExerciseIndex = 0;
let timerInterval = null;
let isPaused = false;
let currentSeconds = 0;
let isResting = false;
const REST_TIME = 120; // 2 minutes rest in seconds
const WORKOUT_STORAGE_KEY = 'calisthenics_pro_workout';

// Initial exercises based on the PDF
const initialExercises = {
    warmup: [
        { name: 'Jumping Jacks', reps: 20, sets: 2, time: '', unit: 'reps' },
        { name: 'Squats', reps: '', sets: '', time: '', unit: 'reps' }
    ],
    push: [
        { name: 'Pushup', reps: 12, sets: 3, time: '', unit: 'reps' }
    ],
    pull: [
        { name: 'Australian Rows', reps: 10, sets: 2, time: '', unit: 'reps' },
        { name: 'Pull ups', reps: 8, sets: 3, time: '', unit: 'reps' }
    ],
    legs: [
        { name: 'Squats', reps: 20, sets: 3, time: '', unit: 'reps' }
    ],
    core: [
        { name: 'Plank', reps: '', sets: '', time: 1, unit: 'reps' },
        { name: 'Pull ups', reps: 8, sets: 3, time: '', unit: 'reps' }
    ],
    cooldown: [
        { name: 'Hamstring Stretches', reps: '', sets: '', time: '', unit: 'reps' }
    ]
};

// Initialize the workout
function initWorkout() {
    // Try to load saved workout first
    const savedWorkout = loadWorkoutPreset();
    
    if (savedWorkout && savedWorkout.length > 0) {
        // Clear existing exercises
        const sections = ['warmup', 'push', 'pull', 'legs', 'core', 'cooldown'];
        sections.forEach(section => {
            const container = document.getElementById(`${section}-exercises`);
            container.innerHTML = '';
        });
        
        // Load saved exercises
        savedWorkout.forEach(exercise => {
            renderExercise(exercise.section, exercise);
        });
        
        showPopup('✅ Previous workout loaded successfully!');
    } else {
        // Load default exercises
        for (let section in initialExercises) {
            initialExercises[section].forEach(exercise => {
                renderExercise(section, exercise);
            });
        }
    }
}

// Function to play a beep sound
function playBeep() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Show popup notification
function showPopup(message, isError = false) {
    // Remove any existing popup
    const existingPopup = document.getElementById('notificationPopup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    const popup = document.createElement('div');
    popup.id = 'notificationPopup';
    popup.className = 'notification-popup';
    if (isError) popup.classList.add('error');
    
    popup.innerHTML = `
        <div class="popup-content">
            <p>${message}</p>
            <button class="popup-close" onclick="closePopup()">Close</button>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Auto-close after 5 seconds if not an error
    if (!isError) {
        setTimeout(() => {
            closePopup();
        }, 5000);
    }
}

function closePopup() {
    const popup = document.getElementById('notificationPopup');
    if (popup) {
        popup.remove();
    }
}

// Check if online
function isOnline() {
    return navigator.onLine;
}

// Save workout preset to localStorage
function saveWorkoutPreset() {
    const workout = [];
    const sections = ['warmup', 'push', 'pull', 'legs', 'core', 'cooldown'];
    
    sections.forEach(section => {
        const container = document.getElementById(`${section}-exercises`);
        const exercises = container.querySelectorAll('.exercise-item');
        
        exercises.forEach(ex => {
            const name = ex.querySelector('.exercise-name').textContent;
            const inputs = ex.querySelectorAll('input');
            workout.push({
                name: name,
                reps: inputs[0].value || '',
                sets: inputs[1].value || '',
                time: inputs[2].value || '',
                section: section,
                unit: 'reps'
            });
        });
    });
    
    try {
        localStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(workout));
        return true;
    } catch (e) {
        console.error('Failed to save workout:', e);
        return false;
    }
}

// Load workout preset from localStorage
function loadWorkoutPreset() {
    try {
        const saved = localStorage.getItem(WORKOUT_STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        console.error('Failed to load workout:', e);
        return null;
    }
}

// Open YouTube search
function searchYouTube() {
    const searchInput = document.getElementById('youtubeSearchInput');
    const query = searchInput.value.trim();
    
    if (!query) {
        showPopup('Please enter a workout to search for', true);
        return;
    }
    
    if (!isOnline()) {
        showPopup('❌ Need internet connection to search YouTube', true);
        return;
    }
    
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' workout')}`;
    window.open(youtubeUrl, '_blank');
    searchInput.value = '';
}

// Toggle search bar visibility
function toggleSearchBar() {
    const searchBar = document.getElementById('youtubeSearchBar');
    searchBar.classList.toggle('active');
    if (searchBar.classList.contains('active')) {
        document.getElementById('youtubeSearchInput').focus();
    }
}

function renderExercise(section, exercise) {
    const container = document.getElementById(`${section}-exercises`);
    const exerciseDiv = document.createElement('div');
    exerciseDiv.className = 'exercise-item';
    
    exerciseDiv.innerHTML = `
        <div class="exercise-name">${exercise.name}</div>
        <div class="exercise-input">
            <label>Reps</label>
            <input type="number" value="${exercise.reps}" placeholder="0">
            <span class="unit">${exercise.unit}</span>
        </div>
        <div class="exercise-input">
            <label>Sets</label>
            <input type="number" value="${exercise.sets}" placeholder="0">
            <span class="unit">sets</span>
        </div>
        <div class="exercise-input">
            <label>Time</label>
            <input type="number" value="${exercise.time}" placeholder="0">
            <span class="unit">mins</span>
        </div>
        <button class="remove-button" onclick="removeExercise(this)">Remove</button>
    `;
    
    container.appendChild(exerciseDiv);
}

function addExercise(section) {
    currentSection = section;
    document.getElementById('exerciseModal').classList.add('active');
    document.getElementById('exerciseName').focus();
}

function closeModal() {
    document.getElementById('exerciseModal').classList.remove('active');
    document.getElementById('exerciseName').value = '';
}

function confirmAddExercise() {
    const name = document.getElementById('exerciseName').value.trim();
    if (name) {
        const exercise = {
            name: name,
            reps: '',
            sets: '',
            time: '',
            unit: 'reps'
        };
        renderExercise(currentSection, exercise);
        closeModal();
    }
}

function removeExercise(button) {
    button.closest('.exercise-item').remove();
}

function beginWorkout() {
    // Build workout queue from all sections
    workoutQueue = [];
    const sections = ['warmup', 'push', 'pull', 'legs', 'core', 'cooldown'];
    const remainingSets = []; // To store additional sets to add at the end
    
    sections.forEach(section => {
        const container = document.getElementById(`${section}-exercises`);
        const exercises = container.querySelectorAll('.exercise-item');
        
        exercises.forEach(ex => {
            const name = ex.querySelector('.exercise-name').textContent;
            const inputs = ex.querySelectorAll('input');
            const reps = inputs[0].value || '';
            const sets = parseInt(inputs[1].value) || 0;
            const time = inputs[2].value || '';
            
            // Only add exercises that have at least one value filled
            if (reps || sets || time) {
                if (sets > 1) {
                    // Add first set to main queue
                    workoutQueue.push({
                        name: name,
                        reps: reps,
                        sets: sets,
                        currentSet: 1,
                        totalSets: sets,
                        time: time,
                        section: section
                    });
                    
                    // Add remaining sets to the end
                    for (let i = 2; i <= sets; i++) {
                        remainingSets.push({
                            name: name,
                            reps: reps,
                            sets: sets,
                            currentSet: i,
                            totalSets: sets,
                            time: time,
                            section: section
                        });
                    }
                } else {
                    // Single set or no sets specified
                    workoutQueue.push({
                        name: name,
                        reps: reps,
                        sets: sets || 1,
                        currentSet: 1,
                        totalSets: sets || 1,
                        time: time,
                        section: section
                    });
                }
            }
        });
    });
    
    // Add remaining sets at the end
    workoutQueue = workoutQueue.concat(remainingSets);
    
    if (workoutQueue.length === 0) {
        showPopup('Please add some exercises to your workout first!', true);
        return;
    }
    
    // Save workout preset
    saveWorkoutPreset();
    
    // Start the workout
    currentExerciseIndex = 0;
    document.getElementById('workoutPlayer').classList.add('active');
    loadExercise(currentExerciseIndex);
}

function loadExercise(index) {
    if (index >= workoutQueue.length) {
        completeWorkout();
        return;
    }
    
    const exercise = workoutQueue[index];
    
    // Update exercise info with set number
    let exerciseName = exercise.name;
    if (exercise.totalSets > 1) {
        exerciseName += ` (Set ${exercise.currentSet} of ${exercise.totalSets})`;
    }
    
    document.getElementById('playerExerciseName').textContent = exerciseName;
    document.getElementById('playerReps').textContent = exercise.reps || '--';
    document.getElementById('playerSets').textContent = exercise.totalSets || '--';
    document.getElementById('playerTime').textContent = exercise.time ? `${exercise.time} min` : '--';
    
    // Check if this is a time-based exercise
    const isTimeBased = exercise.time && parseInt(exercise.time) > 0;
    
    if (isTimeBased) {
        // Show timer display (Slide B)
        document.getElementById('timerDisplay').classList.add('active');
        document.querySelector('.exercise-stats').style.display = 'none';
        
        // Convert minutes to seconds for countdown timer
        currentSeconds = parseInt(exercise.time) * 60;
        updateTimerDisplay();
        startTimer();
    } else {
        // Show stats display (Slide A)
        document.getElementById('timerDisplay').classList.remove('active');
        document.querySelector('.exercise-stats').style.display = 'grid';
        
        // Stop any running timer
        stopTimer();
    }
    
    // Re-enable Next button (will be disabled during rest)
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.disabled = false;
    nextBtn.style.opacity = '1';
    nextBtn.style.cursor = 'pointer';
    
    // Reset pause state and resting flag
    isPaused = false;
    isResting = false;
    updatePauseButton();
}

function startRestPeriod() {
    isResting = true;
    
    // Update display for rest period
    document.getElementById('playerExerciseName').textContent = '💤 Rest Period';
    document.getElementById('playerReps').textContent = '--';
    document.getElementById('playerSets').textContent = '--';
    document.getElementById('playerTime').textContent = '2 min';
    
    // Show timer display
    document.getElementById('timerDisplay').classList.add('active');
    document.querySelector('.exercise-stats').style.display = 'none';
    
    // Disable Next button during rest
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.disabled = true;
    nextBtn.style.opacity = '0.5';
    nextBtn.style.cursor = 'not-allowed';
    
    // Set 2-minute rest
    currentSeconds = REST_TIME;
    updateTimerDisplay();
    startTimer();
    
    // Reset pause state
    isPaused = false;
    updatePauseButton();
}

function startTimer() {
    stopTimer(); // Clear any existing timer
    
    timerInterval = setInterval(() => {
        if (!isPaused && currentSeconds > 0) {
            currentSeconds--;
            updateTimerDisplay();
            
            if (currentSeconds === 0) {
                stopTimer();
                playBeep(); // Play beep sound when timer ends
                
                if (isResting) {
                    // Rest is over, move to next exercise
                    setTimeout(() => {
                        currentExerciseIndex++;
                        loadExercise(currentExerciseIndex);
                    }, 1000);
                } else {
                    // Exercise is over, check if we need rest before next exercise
                    if (currentExerciseIndex < workoutQueue.length - 1) {
                        // Not the last exercise, start rest period
                        setTimeout(() => {
                            startRestPeriod();
                        }, 1000);
                    } else {
                        // Last exercise, complete workout
                        setTimeout(() => {
                            completeWorkout();
                        }, 1000);
                    }
                }
            }
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    const hours = Math.floor(currentSeconds / 3600);
    const minutes = Math.floor((currentSeconds % 3600) / 60);
    const seconds = currentSeconds % 60;
    
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('timerClock').textContent = timeString;
}

function togglePause() {
    isPaused = !isPaused;
    updatePauseButton();
}

function updatePauseButton() {
    const pauseBtn = document.getElementById('pauseBtn');
    const svg = pauseBtn.querySelector('svg');
    const label = pauseBtn.querySelector('.control-label');
    
    if (isPaused) {
        // Show play icon
        svg.innerHTML = '<polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>';
        label.textContent = 'Resume';
    } else {
        // Show pause icon
        svg.innerHTML = '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>';
        label.textContent = 'Pause';
    }
}

function restartExercise() {
    if (isResting) {
        startRestPeriod();
    } else {
        loadExercise(currentExerciseIndex);
    }
}

function nextExercise() {
    if (isResting) {
        // Prevent skipping rest period
        showPopup('⏸️ You must complete the rest period! Take your rest seriously.', true);
        return;
    }
    
    // If in an exercise, check if we should rest
    if (currentExerciseIndex < workoutQueue.length - 1) {
        // Not the last exercise, start rest period
        startRestPeriod();
    } else {
        // Last exercise, complete workout
        completeWorkout();
    }
}

function exitWorkout() {
    // Show confirmation popup
    showExitConfirmation();
}

function showExitConfirmation() {
    const popup = document.createElement('div');
    popup.id = 'exitConfirmPopup';
    popup.className = 'notification-popup';
    
    popup.innerHTML = `
        <div class="popup-content">
            <p>Are you sure you want to exit the workout?</p>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="popup-close" onclick="closeExitPopup()">Cancel</button>
                <button class="popup-close" style="background: #e74c3c;" onclick="confirmExit()">Exit</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
}

function closeExitPopup() {
    const popup = document.getElementById('exitConfirmPopup');
    if (popup) {
        popup.remove();
    }
}

function confirmExit() {
    stopTimer();
    document.getElementById('workoutPlayer').classList.remove('active');
    currentExerciseIndex = 0;
    workoutQueue = [];
    closeExitPopup();
}

function completeWorkout() {
    stopTimer();
    showPopup('🎉 Congratulations! You completed your workout! 💪');
    setTimeout(() => {
        document.getElementById('workoutPlayer').classList.remove('active');
        currentExerciseIndex = 0;
        workoutQueue = [];
    }, 3000);
}

// Handle Enter key in modal
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('exerciseName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmAddExercise();
        }
    });
    
    // Handle Enter key in YouTube search
    document.getElementById('youtubeSearchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchYouTube();
        }
    });
    
    // Initialize on page load
    initWorkout();
});
