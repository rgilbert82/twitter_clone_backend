var randomNumString = require('./randomNumString.js');

module.exports = function slugify(username) {
  var numStr = randomNumString(5);
  var slug = username.toLowerCase()
    .replace(/\s*[^A-Za-z0-9]\s*/gi, '-')
    .replace(/-+/g, '-');

  if (slug[slug.length - 1] !== '-') { slug += '-'; }
  slug += numStr;
  return slug;
};
