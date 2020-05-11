document.addEventListener("DOMContentLoaded", function () {
  let searchResults = [];
  const searchWrapper = document.querySelector("aside.search");
  const searchResultElement = searchWrapper.querySelector(".search-results");
    const searchInput = searchWrapper.querySelector("input");
    const searchButton = document.querySelector("a.show-search");
  const closeButton = document.querySelector("a.close-search");

  function toggleSearch(searchWrapper, searchInput) {
    if (searchWrapper.classList.contains("active")) {
      searchWrapper.classList.add("visible");
      setTimeout(function () {
        searchWrapper.classList.remove("visible");
      }, 300);
      searchWrapper.classList.remove("active");
      searchButton.classList.add("visible");
      closeButton.classList.remove("visible");
    } else {
      searchWrapper.classList.add("active");
      searchButton.classList.remove("visible");
      closeButton.classList.add("visible");
      searchInput.focus();
    }
  }

  document.querySelectorAll(".toggle-search").forEach(function (el) {
    el.addEventListener("click", function (e) {
      toggleSearch(searchWrapper, searchInput);
    });
  });

  window.addEventListener("keydown", function (e) {
    // dismiss search on  ESC
    if (e.keyCode == 27 && searchWrapper.classList.contains("active")) {
      e.preventDefault();
      toggleSearch(searchWrapper, searchInput);
    }

    // open search on CTRL+F
    if (e.ctrlKey && e.shiftKey && e.keyCode == 70 && !searchWrapper.classList.contains("active")) {
      e.preventDefault();
      toggleSearch(searchWrapper, searchInput);
    }
  });

  function tags(tags, searchString) {
    let tagHTML = (tags.split(" ; ") || [])
      .filter(function (i) {
        return i && i.length > 0;
      })
      .map(function (i) {
        return  "<a class=\"ba b--moon-gray bg-light-gray br2 color-inherit dib f7 hover-bg-moon-gray link mt2 ph2 pv1 ml1\" href='/tags/" + i.split(" ").join("-").toLowerCase() + "'>" + "#" + mark(i, searchString) +"</a>";
      })


    return tagHTML.join("");
  }

  function mark(content, search) {
    if (search) {
      let pattern = /^[a-zA-Z0-9]*:/i;
      search.split(" ").forEach(function (s) {
        if (pattern.test(s)) {
          s = s.replace(pattern, "");
        }
        if (s && s.startsWith("+")) {
          s = s.substring(1);
        }
        if (s && s.indexOf("~") > 0 && s.length > s.indexOf("~") && parseInt(s.substring(s.indexOf("~") + 1)) == s.substring(s.indexOf("~") + 1)) {
          s = s.substring(0, s.indexOf("~"));
        }
        if (!s || s.startsWith("-")) {
          return;
        }
        let re = new RegExp(s, "i");
        content = content.replace(re, function (m) {
          return "<mark>"+m+"</mark>";
        });
      });
    }

    return content;
  }

  axios.get("/search")
    .then(function (result) {
      const searchContent = result.data;
      const searchIndex = lunr(function () {
        this.ref("id")
        this.field("content");
        this.field("tag");
        this.field("title");
        this.field("url");
        this.field("type");

        Array.from(result.data).forEach(function (doc) {
          this.add(doc)
        }, this)
      })
      searchInput.removeAttribute("disabled");
      searchInput.addEventListener("keyup", function (e) {
        let searchString = e.target.value;
        if (searchString && searchString.length > 1) {
          try {
            searchResults = searchIndex.search(searchString);
          } catch (err) {
            if (err instanceof lunr.QueryParseError) {
              return;
            }
          }
        } else {
          searchResults = [];
        }

        if (searchResults.length > 0) {
          searchResultElement.innerHTML = searchResults.map(function (match) {
            let item = searchContent.find(function(e) {
              return e.id == parseInt(match.ref);
            });
            return "<li>" +
              "<div class=\"relative w-100 mb4 bg-white nested-copy-line-height\">\n" +
              "  <div class=\"bg-white mb3 pa4 gray overflow-hidden\">\n" +
              "    <span class=\"f6 db\" style='text-transform: capitalize'>"+item.type+ "</span>\n" +
              "    <h1 class=\"f3 near-black\">\n" +
              "      <a href='"+ item.url + "' class=\"link black dim\">\n" + mark(item.title, searchString) +
              "      </a>\n" +
              "    </h1>\n" +
              "    <div class=\"nested-links f5 lh-copy nested-copy-line-height\">\n" +
              mark((item.content.length > 400 ? (item.content.substring(0, 400) + "...") : item.content), searchString)+
              "    </div>\n" + tags(item.tag, searchString)+
              "  </div>\n" +
              "</div>\n"
            "</li>";
          }).join("");
        } else {
          searchResultElement.innerHTML = "<li><p class='no-result'>No results found</p></li>";
        }
      });
    })
    .catch(function (error) {
      console.error(error);
    });
});
