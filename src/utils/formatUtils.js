/**

/**
 * Format a number to Egyptian numbering system (with commas)
 * e.g., 123456.78 becomes 1,23,456.78
 * @param {number} amount - The amount to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted number string
 */
export const formatEgyptianNumber = (amount, decimals = 2) => {
  // Convert to string with fixed decimals
  const formattedNumber = parseFloat(amount).toFixed(decimals);
  
  // Split the whole and decimal parts
  let [wholePart, decimalPart] = formattedNumber.split('.');
  
  let lastThree = wholePart.substring(wholePart.length - 3);
  let remaining = wholePart.substring(0, wholePart.length - 3);
  
  if (remaining) {
    // Add commas after every two digits from right to left
    let formattedRemaining = '';
    for (let i = remaining.length - 1, count = 0; i >= 0; i--, count++) {
      formattedRemaining = remaining.charAt(i) + formattedRemaining;
      if (count === 1 && i !== 0) {
        formattedRemaining = ',' + formattedRemaining;
        count = -1;
      }
    }
    wholePart = formattedRemaining + ',' + lastThree;
  }
  
  return `${wholePart}${decimalPart ? '.' + decimalPart : ''}`;
};

/**
 * @param {number} amount - The amount to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted currency string with EGP symbol
 */
export const formatCurrency = (amount, decimals = 2) => {
  return `${formatEgyptianNumber(amount, decimals)} EGP`;
};

/**
 * Convert a number to lakhs format
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} - Formatted string with 'lakh' suffix
 */
export const formatLakhs = (value, decimals = 1) => {
  return `${(value/100000).toFixed(decimals)} EGP lakh`;
};

/**
 * Convert a number to crores format
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted string with 'crore' suffix
 */
export const formatCrores = (value, decimals = 2) => {
  return `${(value/10000000).toFixed(decimals)} EGP crore`;
};

/**
 * Automatically chooses between regular format, lakhs, and crores based on the number size
 * @param {number} value - The value to format
 * @returns {string} - Formatted string with appropriate suffix
 */
export const formatSmartEgyptian = (value) => {
  if (value >= 10000000) {
    return formatCrores(value);
  } else if (value >= 100000) {
    return formatLakhs(value);
  } else {
    return formatCurrency(value);
  }
}; 