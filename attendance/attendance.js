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

// Store custom probabilities calculated from historical data
let customProbabilities = null;

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
 * Calculates probabilities from historical data
 * @param {number} total - Total responses of this type
 * @param {number} attended - Number who actually attended
 * @returns {number|null} Calculated probability or null if invalid
 */
function calculateProbability(total, attended) {
  if (total <= 0) return null;
  if (attended < 0 || attended > total) return null;
  return attended / total;
}

/**
 * Updates the custom probabilities from historical data
 */
function updateCustomProbabilities() {
  const hist_Y_total = parseFloat(document.getElementById('hist_Y_total').value) || 0;
  const hist_Y_attended = parseFloat(document.getElementById('hist_Y_attended').value) || 0;
  const hist_M_total = parseFloat(document.getElementById('hist_M_total').value) || 0;
  const hist_M_attended = parseFloat(document.getElementById('hist_M_attended').value) || 0;
  const hist_N_total = parseFloat(document.getElementById('hist_N_total').value) || 0;
  const hist_N_attended = parseFloat(document.getElementById('hist_N_attended').value) || 0;
  const hist_U_total = parseFloat(document.getElementById('hist_U_total').value) || 0;
  const hist_U_attended = parseFloat(document.getElementById('hist_U_attended').value) || 0;

  // Calculate probabilities
  const pY = calculateProbability(hist_Y_total, hist_Y_attended);
  const pM = calculateProbability(hist_M_total, hist_M_attended);
  const pN = calculateProbability(hist_N_total, hist_N_attended);
  const pU = calculateProbability(hist_U_total, hist_U_attended);

  // Update display for each probability
  document.getElementById('prob_Y_display').textContent = 
    pY !== null ? `p = ${(pY * 100).toFixed(1)}%` : '';
  document.getElementById('prob_M_display').textContent = 
    pM !== null ? `p = ${(pM * 100).toFixed(1)}%` : '';
  document.getElementById('prob_N_display').textContent = 
    pN !== null ? `p = ${(pN * 100).toFixed(1)}%` : '';
  document.getElementById('prob_U_display').textContent = 
    pU !== null ? `p = ${(pU * 100).toFixed(1)}%` : '';

  // Store custom probabilities (use defaults for missing values)
  customProbabilities = {
    pY: pY !== null ? pY : DEFAULT_PROBABILITIES.pY,
    pM: pM !== null ? pM : DEFAULT_PROBABILITIES.pM,
    pN: pN !== null ? pN : DEFAULT_PROBABILITIES.pN,
    pU: pU !== null ? pU : DEFAULT_PROBABILITIES.pU
  };

  // Update summary
  updateCustomProbsSummary();
}

/**
 * Updates the custom probabilities summary display
 */
function updateCustomProbsSummary() {
  const summaryElement = document.getElementById('customProbsSummary');
  
  if (!customProbabilities) {
    summaryElement.innerHTML = '';
    summaryElement.classList.add('hidden');
    return;
  }

  summaryElement.classList.remove('hidden');
  summaryElement.innerHTML = `
    <h4>📈 Calculated Probabilities</h4>
    <ul>
      <li><span>Yes (p<sub>Y</sub>):</span> <span class="prob-value">${(customProbabilities.pY * 100).toFixed(1)}%</span></li>
      <li><span>Maybe (p<sub>M</sub>):</span> <span class="prob-value">${(customProbabilities.pM * 100).toFixed(1)}%</span></li>
      <li><span>No (p<sub>N</sub>):</span> <span class="prob-value">${(customProbabilities.pN * 100).toFixed(1)}%</span></li>
      <li><span>Unknown (p<sub>U</sub>):</span> <span class="prob-value">${(customProbabilities.pU * 100).toFixed(1)}%</span></li>
    </ul>
  `;
}

/**
 * Gets the active probabilities based on toggle state
 * @returns {object} Active probabilities
 */
function getActiveProbabilities() {
  const useCustom = document.getElementById('useCustomProbs').checked;
  return useCustom && customProbabilities ? customProbabilities : DEFAULT_PROBABILITIES;
}

/**
 * Updates the displayed probabilities in results
 * @param {object} probs - Probabilities used in calculation
 * @param {boolean} isCustom - Whether custom probabilities were used
 */
function updateDisplayedProbabilities(probs, isCustom) {
  document.getElementById('usedProb_Y').textContent = `${(probs.pY * 100).toFixed(1)}%`;
  document.getElementById('usedProb_M').textContent = `${(probs.pM * 100).toFixed(1)}%`;
  document.getElementById('usedProb_N').textContent = `${(probs.pN * 100).toFixed(1)}%`;
  document.getElementById('usedProb_U').textContent = `${(probs.pU * 100).toFixed(1)}%`;
  
  const sourceElement = document.getElementById('probSource');
  sourceElement.textContent = isCustom 
    ? 'Using custom probabilities from historical data' 
    : 'Using default probabilities';
  sourceElement.style.background = isCustom 
    ? 'rgba(245, 124, 0, 0.1)' 
    : 'rgba(102, 126, 234, 0.1)';
  sourceElement.style.color = isCustom ? '#f57c00' : '#667eea';
}

/**
 * Displays the calculation results
 * @param {object} result - Calculation result object
 * @param {object} probsUsed - Probabilities used in calculation
 */
function displayResults(result, probsUsed) {
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

  // Update displayed probabilities
  const isCustom = document.getElementById('useCustomProbs').checked && customProbabilities !== null;
  updateDisplayedProbabilities(probsUsed, isCustom);

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

  // Get active probabilities
  const probs = getActiveProbabilities();

  // Calculate and display results
  const result = estimateAttendance(T, Y, M, N, probs);
  displayResults(result, probs);
}

/**
 * Toggles the historical data section
 */
function toggleHistoricalSection() {
  const checkbox = document.getElementById('useCustomProbs');
  const section = document.getElementById('historicalDataSection');
  
  if (checkbox.checked) {
    section.classList.remove('hidden');
  } else {
    section.classList.add('hidden');
  }
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
 * Adds listeners for historical data inputs
 */
function addHistoricalDataListeners() {
  const historicalInputs = [
    'hist_Y_total', 'hist_Y_attended',
    'hist_M_total', 'hist_M_attended',
    'hist_N_total', 'hist_N_attended',
    'hist_U_total', 'hist_U_attended'
  ];

  historicalInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', () => {
        // Ensure non-negative values
        if (parseFloat(input.value) < 0) {
          input.value = 0;
        }
        // Update custom probabilities
        updateCustomProbabilities();
      });
    }
  });
}

/**
 * Initialize the application
 */
function init() {
  // Add form submit handler
  const form = document.getElementById('attendanceForm');
  form.addEventListener('submit', handleFormSubmit);

  // Add toggle listener
  const toggleCheckbox = document.getElementById('useCustomProbs');
  toggleCheckbox.addEventListener('change', toggleHistoricalSection);

  // Add input validation
  addInputValidation();

  // Add historical data listeners
  addHistoricalDataListeners();

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

