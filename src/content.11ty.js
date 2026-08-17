// Emits /content.json - the index the portal reads for its list/edit views,
// plus global settings, menu and redirects.
module.exports = class {
  data() {
    return { permalink: "/content.json", eleventyExcludeFromCollections: true };
  }

  render(data) {
    var collections = data.collections;
    var FIELDS = [
      "title", "titleEm", "category", "standfirst", "author", "authorRole", "date", "draft",
      "image", "imageAlt", "imageCaption", "imageCredit", "description", "tags",
      "client", "serviceArea", "discipline", "market", "year", "challenge", "bigIdea", "execution",
      "videoYouTube", "media", "stats", "name", "role", "country", "featured", "order", "instagram",
      "kicker", "lede", "focusKeyphrase", "seoTitle", "logo", "url", "relatedTalent", "relatedCaseStudy",
    ];
    var pick = function (arr) {
      return (arr || []).map(function (i) {
        var d = i.data || {};
        var o = { slug: i.fileSlug, url: i.url || null };
        FIELDS.forEach(function (k) {
          if (d[k] !== undefined) o[k] = d[k] instanceof Date ? d[k].toISOString().slice(0, 10) : d[k];
        });
        return o;
      });
    };
    // Newest first (articles / case studies); manual "order" first (rosters, logos).
    var byDate = function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); };
    var byOrder = function (a, b) {
      var oa = a.order == null ? 9999 : a.order, ob = b.order == null ? 9999 : b.order;
      return oa - ob || String(a.name || a.title || "").localeCompare(String(b.name || b.title || ""));
    };
    var sortBy = function (arr, fn) { return pick(arr).sort(fn); };

    return JSON.stringify({
      generated: true,
      collections: {
        articles: sortBy(collections.articles, byDate),
        caseStudies: sortBy(collections.caseStudies, byOrder),
        talent: sortBy(collections.talent, byOrder),
        board: sortBy(collections.board, byOrder),
        clients: sortBy(collections.client, byOrder),
        awards: sortBy(collections.award, byOrder),
        pages: pick(collections.page),
      },
      settings: data.settings || {},
      menu: data.menu || {},
      redirects: data.redirects || {},
      users: data.users || {},
    });
  }
};
