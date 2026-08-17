// Every Markdown file in src/the-wire/ is a Wire article: it uses the article
// layout, joins the "article" collection, and publishes to /the-wire/<slug>/.
module.exports = {
  layout: "article.njk",
  tags: ["article"],
  eleventyComputed: {
    permalink: (data) => `/the-wire/${data.page.fileSlug}/`,
  },
};
