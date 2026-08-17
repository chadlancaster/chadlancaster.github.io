// Standalone pages (Privacy, Terms, etc.) managed in the CMS → /<slug>/.
module.exports = {
  layout: "page.njk",
  tags: ["page"],
  eleventyComputed: { permalink: (data) => `/${data.page.fileSlug}/` },
};
