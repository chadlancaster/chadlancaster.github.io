// Emits /media.json - an index of every image on the site so the portal's
// Media Library can browse them. (Uploading is Phase 2.)
const fs = require("fs");
const path = require("path");

module.exports = class {
  data() {
    return { permalink: "/media.json", eleventyExcludeFromCollections: true };
  }

  render() {
    var dirs = ["uploads", "brand", "logos", "case-studies", "roster", "team", "archive"];
    var exts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"];
    var out = [];
    dirs.forEach(function (d) {
      var full = path.join(process.cwd(), d);
      try {
        fs.readdirSync(full).forEach(function (f) {
          if (exts.indexOf(path.extname(f).toLowerCase()) >= 0) {
            out.push({ path: "/" + d + "/" + f, dir: d, name: f });
          }
        });
      } catch (e) {}
    });
    return JSON.stringify({ images: out });
  }
};
