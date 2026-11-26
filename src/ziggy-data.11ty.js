// Machine-readable index of the real case studies, built from the same content
// that powers /work/<slug>/. Ziggy (csa-chat.js) fetches /ziggy-data.json at
// runtime so it can answer about any campaign and surface its results in chat.
// Nothing here is hand-maintained: it regenerates on every build.
const fs = require("fs");

// Plain words from an article's Markdown body, so Ziggy can search inside reads, not just titles.
function bodyText(path) {
  try {
    const raw = fs.readFileSync(path, "utf8").replace(/^---[\s\S]*?---/, "");
    return raw
      .replace(/<[^>]+>/g, " ")
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[#>*_`|\\-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2500);
  } catch (e) {
    return "";
  }
}

module.exports = class {
  data() {
    return {
      permalink: "/ziggy-data.json",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const list = (data.collections.caseStudies || []).slice();
    // Newest first, so "a recent highlight" is actually recent.
    list.sort((a, b) => b.date - a.date);

    const items = list.map((p) => {
      const d = p.data;
      return {
        title: d.title || "",
        client: d.client || "",
        url: p.url,
        area: d.serviceArea || d.discipline || "",
        year: d.year || "",
        image: d.image || "",
        summary: d.standfirst || d.bigIdea || "",
        challenge: d.challenge || "",
        idea: d.bigIdea || "",
        execution: d.execution || "",
        stats: (d.stats || []).map((s) => ({ value: s.value, label: s.label })),
      };
    });

    // The Wire: every article, newest first, so Ziggy can search and suggest reads.
    const articles = (data.collections.articles || []).map((p) => {
      const d = p.data;
      const dt = p.date instanceof Date ? p.date.toISOString().slice(0, 10) : "";
      return {
        title: d.title || "",
        url: p.url,
        date: dt,
        category: d.category || "",
        author: d.author || "",
        summary: d.standfirst || d.description || "",
        tags: d.tags ? d.tags.filter((t) => t !== "article") : [],
        image: d.image || "",
        text: bodyText(p.inputPath),
      };
    });

    // Talent roster entries from the CMS (the Talent page adds its own cards at runtime).
    const talent = (data.collections.talent || [])
      .map((p) => ({
        name: p.data.name || "",
        discipline: p.data.discipline || "",
        country: p.data.country || "",
        image: p.data.image || "",
      }))
      .filter((t) => t.name);

    return JSON.stringify({ caseStudies: items, articles, talent });
  }
};
