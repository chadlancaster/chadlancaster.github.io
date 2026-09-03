module.exports = function (eleventyConfig) {
  // Prototype/demo reference pages — kept in the repo but never published.
  eleventyConfig.ignores.add("src/article.html");
  eleventyConfig.ignores.add("src/case-study.html");

  // Static assets live in the project root and are copied straight through,
  // byte-for-byte unchanged — the hand-coded design is never touched.
  [
    "styles.css",
    "script.js",
    "brand",
    "logos",
    "archive",
    "case-studies",
    "roster",
    "team",
    "fonts",
    "uploads",
    "chart-pulse",
    "CNAME",  // csa.global custom domain (go-live)
  ].forEach((p) => eleventyConfig.addPassthroughCopy(p));

  // The CMS admin panel ships as static files.
  eleventyConfig.addPassthroughCopy("src/admin");

  // ---- Filters -------------------------------------------------------------
  // "6 June 2026" style publication date.
  eleventyConfig.addFilter("readableDate", (value) => {
    const d = value instanceof Date ? value : new Date(value);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  });
  // ISO date for <time datetime> + sitemap.
  eleventyConfig.addFilter("isoDate", (value) => {
    const d = value instanceof Date ? value : new Date(value);
    return d.toISOString().slice(0, 10);
  });
  // Estimated reading time from rendered content.
  eleventyConfig.addFilter("readingTime", (content) => {
    const words = String(content).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200)) + " min read";
  });
  // List helpers for related-content loops.
  eleventyConfig.addFilter("exclude", (arr, url) => (arr || []).filter((i) => i.url !== url));
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("abs", (n) => Math.abs(Number(n) || 0));
  // Thousands separator, e.g. 6540 -> "6,540".
  eleventyConfig.addFilter("thousands", (n) => Number(n).toLocaleString("en-US"));
  // Fallback avatar for Chart Pulse rows with no artist image yet.
  eleventyConfig.addFilter("initials", (name) =>
    String(name || "")
      .split(/\s+/)
      .map((w) => w[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase()
  );

  // ---- Collections ---------------------------------------------------------
  eleventyConfig.addCollection("articles", (api) =>
    api.getFilteredByTag("article").sort((a, b) => b.date - a.date)
  );
  eleventyConfig.addCollection("caseStudies", (api) =>
    api.getFilteredByTag("caseStudy").sort((a, b) => b.date - a.date)
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    // Existing .html pages pass through unchanged; templated content uses
    // Nunjucks (.njk) and Markdown (.md).
    htmlTemplateEngine: false,
    markdownTemplateEngine: "njk",
    templateFormats: ["html", "njk", "md", "11ty.js"],
  };
};
