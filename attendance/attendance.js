/**
 * Attendance Estimator
 * Calculates the estimated attendance for an event based on RSVP responses
 */

// Default probabilities for each response type
const DEFAULT_PROBABILITIES = {
  pY: 0.8,  // Yes: 80% probability of attendance
  pM: 0.4,  // Maybe: 40% probability of attendance
  pN: 0.05, // No: 5% probability of attendance
  pU: 0.15  // Unknown: 15% probability of attendance
};

/**
 * Estimates the attendance based on responses and probabilities
 * @param {number} T - Total number of people
 * @param {number} Y - Number of "Yes" responses
 * @param {number} M - Number of "Maybe" responses
 * @param {number} N - Number of "No" responses
 * @param {object} probs - Custom probabilities (optional)
 * @returns {object} Estimation results
 */
function estimateAttendance(T, Y, M, N, probs = {}) {
  // Merge custom probabilities with defaults
  const pY = probs.pY ?? DEFAULT_PROBABILITIES.pY;
  const pM = probs.pM ?? DEFAULT_PROBABILITIES.pM;
  const pN = probs.pN ?? DEFAULT_PROBABILITIES.pN;
  const pU = probs.pU ?? DEFAULT_PROBABILITIES.pU;

  // Calculate number of people who didn't respond
  const U = Math.max(T - (Y + M + N), 0);

  // Calculate expected attendance
  const E = (pY * Y) + (pM * M) + (pN * N) + (pU * U);
  const rate = E / T;

  // Calculate variance and standard deviation
  const variance =
    (Y * pY * (1 - pY)) +
    (M * pM * (1 - pM)) +
    (N * pN * (1 - pN)) +
    (U * pU * (1 - pU));
  const stdDev = Math.sqrt(variance);

  return { 
    estimate: E, 
    rate, 
    stdDev, 
    U,
    Y,
    M,
    N
  };
}

/**
 * Validates the form inputs
 * @param {number} T - Total number of people
 * @param {number} Y - Number of "Yes" responses
 * @param {number} M - Number of "Maybe" responses
 * @param {number} N - Number of "No" responses
 * @returns {object} Validation result
 */
function validateInputs(T, Y, M, N) {
  if (T <= 0) {
    return {
      valid: false,
      message: 'Please enter a valid total number (greater than 0)'
    };
  }

  if (Y < 0 || M < 0 || N < 0) {
    return {
      valid: false,
      message: 'Values cannot be negative'
    };
  }

  if (Y + M + N > T) {
    return {
      valid: false,
      message: 'The sum of responses cannot be greater than the total'
    };
  }

  return { valid: true };
}

/**
 * Displays the calculation results
 * @param {object} result - Calculation result object
 */
function displayResults(result) {
  const resultsSection = document.getElementById('results');
  const outputElement = document.getElementById('output');
  const percentageElement = document.getElementById('percentage');
  const stdDevElement = document.getElementById('stdDev');
  const noResponseElement = document.getElementById('noResponse');

  // Format the results
  const estimate = result.estimate.toFixed(1);
  const percentage = (result.rate * 100).toFixed(1);
  const stdDev = result.stdDev.toFixed(1);

  // Update the DOM
  outputElement.textContent = `${estimate} people`;
  percentageElement.textContent = `${percentage}% of total`;
  stdDevElement.textContent = `±${stdDev}`;
  noResponseElement.textContent = result.U;

  // Show results with animation
  resultsSection.classList.remove('hidden');

  // Smooth scroll to results
  setTimeout(() => {
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

/**
 * Displays an error message
 * @param {string} message - Error message to display
 */
function displayError(message) {
  const outputElement = document.getElementById('output');
  const resultsSection = document.getElementById('results');
  
  outputElement.textContent = message;
  outputElement.style.color = '#ef4444';
  
  resultsSection.classList.remove('hidden');
}

/**
 * Handles form submission
 * @param {Event} event - Form submit event
 */
function handleFormSubmit(event) {
  event.preventDefault();

  // Get input values
  const T = parseFloat(document.getElementById('T').value) || 0;
  const Y = parseFloat(document.getElementById('Y').value) || 0;
  const M = parseFloat(document.getElementById('M').value) || 0;
  const N = parseFloat(document.getElementById('N').value) || 0;

  // Validate inputs
  const validation = validateInputs(T, Y, M, N);
  if (!validation.valid) {
    displayError(validation.message);
    return;
  }

  // Calculate and display results
  const result = estimateAttendance(T, Y, M, N);
  displayResults(result);
}

/**
 * Adds real-time input validation
 */
function addInputValidation() {
  const inputs = document.querySelectorAll('input[type="number"]');
  
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      // Remove error state on input
      input.closest('.input-group')?.classList.remove('error');
      
      // Ensure non-negative values
      if (parseFloat(input.value) < 0) {
        input.value = 0;
      }
    });
  });
}

/**
 * Initialize the application
 */
function init() {
  // Add form submit handler
  const form = document.getElementById('attendanceForm');
  form.addEventListener('submit', handleFormSubmit);

  // Add input validation
  addInputValidation();

  // Focus on first input
  document.getElementById('T')?.focus();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    estimateAttendance,
    validateInputs,
    DEFAULT_PROBABILITIES
  };
}

