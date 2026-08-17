// Every Markdown file in src/work/ is a Case Study: it uses the case-study
// layout, joins the "caseStudy" collection, and publishes to /work/<slug>/.
module.exports = {
  layout: "case-study.njk",
  tags: ["caseStudy"],
  eleventyComputed: {
    permalink: (data) => `/work/${data.page.fileSlug}/`,
  },
};
