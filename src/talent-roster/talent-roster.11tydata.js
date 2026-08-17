// Talent roster entries - managed in the CMS, rendered into the Talent page
// later. No individual pages (permalink false, via computed override).
module.exports = { tags: ["talent"], eleventyComputed: { permalink: () => false } };
