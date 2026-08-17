// Directory data for everything in src/.
// Keep the existing hand-coded pages at their flat ".html" URLs so none of the
// current internal links change. Templated CMS content (which sets its own
// `permalink` in front matter) is left alone and can use pretty URLs.
module.exports = {
  eleventyComputed: {
    permalink: (data) => {
      if (data.permalink) return data.permalink; // respect explicit front matter
      if (data.page.inputPath.endsWith(".html")) {
        return data.page.filePathStem.replace(/^\//, "") + ".html";
      }
      return undefined; // default (pretty URL) for anything else
    },
  },
};
