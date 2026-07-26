// Date-range parsing and formatting helpers used by the analytics/sales
// reporting tools (revenue, order-count, product-sales). Not needed by
// the plain CRUD/search modules -- kept separate from shared.js.

const {
  format, parseISO, isValid, subDays,
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfYear
} = require('date-fns');

// Helper function to get the end of a year
function endOfYear(date) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

// Date parsing utilities
function parseDateExpression(dateExpression) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const normalizedExpression = dateExpression.toLowerCase().trim();

  switch (normalizedExpression) {
    case 'today':
      return { startDate: startOfDay(now), endDate: endOfDay(now), description: 'Today' };
    case 'yesterday': {
      const yesterday = subDays(now, 1);
      return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday), description: 'Yesterday' };
    }
    case 'this week':
      return { startDate: startOfWeek(now, { weekStartsOn: 1 }), endDate: endOfDay(now), description: 'This week' };
    case 'last week': {
      const lastWeekStart = subDays(startOfWeek(now, { weekStartsOn: 1 }), 7);
      const lastWeekEnd = subDays(endOfWeek(now, { weekStartsOn: 1 }), 7);
      return { startDate: lastWeekStart, endDate: lastWeekEnd, description: 'Last week' };
    }
    case 'this month':
      return { startDate: startOfMonth(now), endDate: endOfDay(now), description: 'This month' };
    case 'last month': {
      const lastMonth = new Date(currentYear, currentMonth - 1, 1);
      return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth), description: 'Last month' };
    }
    case 'ytd':
    case 'this ytd':
    case 'this year to date':
    case 'year to date':
      return { startDate: startOfYear(now), endDate: endOfDay(now), description: 'Year to date' };
    case 'last year': {
      const lastYear = new Date(currentYear - 1, 0, 1);
      return { startDate: startOfYear(lastYear), endDate: endOfYear(lastYear), description: 'Last year' };
    }
    default:
      try {
        const parsedDate = parseISO(normalizedExpression);
        if (isValid(parsedDate)) {
          return {
            startDate: startOfDay(parsedDate),
            endDate: endOfDay(parsedDate),
            description: format(parsedDate, 'yyyy-MM-dd')
          };
        }

        const rangeParts = normalizedExpression.split(' to ');
        if (rangeParts.length === 2) {
          const startDate = parseISO(rangeParts[0]);
          const endDate = parseISO(rangeParts[1]);

          if (isValid(startDate) && isValid(endDate)) {
            return {
              startDate: startOfDay(startDate),
              endDate: endOfDay(endDate),
              description: `${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`
            };
          }
        }

        throw new Error(`Unable to parse date expression: ${dateExpression}`);
      } catch (error) {
        throw new Error(`Invalid date expression: ${dateExpression}. ${error.message}`);
      }
  }
}

// Helper function to format a date for Magento API
function formatDateForMagento(date) {
  return format(date, "yyyy-MM-dd HH:mm:ss");
}

// Helper function to build date range filter for Magento API
function buildDateRangeFilter(field, startDate, endDate) {
  const formattedStartDate = formatDateForMagento(startDate);
  const formattedEndDate = formatDateForMagento(endDate);

  return [
    `searchCriteria[filter_groups][0][filters][0][field]=${field}`,
    `searchCriteria[filter_groups][0][filters][0][value]=${encodeURIComponent(formattedStartDate)}`,
    `searchCriteria[filter_groups][0][filters][0][condition_type]=gteq`,
    `searchCriteria[filter_groups][1][filters][0][field]=${field}`,
    `searchCriteria[filter_groups][1][filters][0][value]=${encodeURIComponent(formattedEndDate)}`,
    `searchCriteria[filter_groups][1][filters][0][condition_type]=lteq`
  ].join('&');
}

// Helper function to normalize country input
function normalizeCountry(country) {
  const countryInput = country.trim().toLowerCase();

  const countryMap = {
    'netherlands': 'NL', 'the netherlands': 'NL', 'holland': 'NL', 'nl': 'NL',
    'united states': 'US', 'usa': 'US', 'us': 'US', 'america': 'US',
    'united kingdom': 'GB', 'uk': 'GB', 'great britain': 'GB', 'gb': 'GB', 'england': 'GB',
    'canada': 'CA', 'ca': 'CA',
    'australia': 'AU', 'au': 'AU',
    'germany': 'DE', 'de': 'DE',
    'france': 'FR', 'fr': 'FR',
    'italy': 'IT', 'it': 'IT',
    'spain': 'ES', 'es': 'ES',
    'belgium': 'BE', 'be': 'BE',
    'sweden': 'SE', 'se': 'SE',
    'norway': 'NO', 'no': 'NO',
    'denmark': 'DK', 'dk': 'DK',
    'finland': 'FI', 'fi': 'FI',
    'ireland': 'IE', 'ie': 'IE',
    'switzerland': 'CH', 'ch': 'CH',
    'austria': 'AT', 'at': 'AT',
    'portugal': 'PT', 'pt': 'PT',
    'greece': 'GR', 'gr': 'GR',
    'poland': 'PL', 'pl': 'PL',
    'japan': 'JP', 'jp': 'JP',
    'china': 'CN', 'cn': 'CN',
    'india': 'IN', 'in': 'IN',
    'brazil': 'BR', 'br': 'BR',
    'mexico': 'MX', 'mx': 'MX',
    'south africa': 'ZA', 'za': 'ZA'
  };

  if (countryMap[countryInput]) {
    return [countryMap[countryInput]];
  }

  return [countryInput.toUpperCase()];
}

module.exports = {
  parseDateExpression,
  formatDateForMagento,
  buildDateRangeFilter,
  normalizeCountry,
  format
};
