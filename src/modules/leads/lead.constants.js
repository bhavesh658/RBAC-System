const LEAD_SOURCES = ['Website', 'Referral', 'Social Media', 'Cold Call', 'Email Campaign', 'Other'];


const LEAD_STATUSES = [
  'New',         // Nayi lead aayi hai
  'Contacted',   // Call/Email kar diya hai
  'Qualified',   // Client interested hai (In Progress)
  'Converted',   // Deal close ho gayi (Success - Closed)
  'Lost',        // Client ne mana kar diya (Fail - Closed)
  'Junk'         // Fake/Spam data (Invalid - Closed)
];

const LEAD_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

module.exports = {
  LEAD_SOURCES,
  LEAD_STATUSES,
  LEAD_PRIORITIES,
};