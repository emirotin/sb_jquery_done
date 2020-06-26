(() => {
  const API_PREFIX = "https://marveldb.now.sh/api/v1/public";
  const PAGE_SIZE = 10;

  const queryApi = (url, data, onSuccess, onError) =>
    $.ajax({
      url: API_PREFIX + url,
      data,
      method: "GET",
      success: onSuccess,
      error: onError,
    });

  const searchCharacters = (search, page, onSuccess, onError) => {
    page = page == null || page < 1 ? 1 : page;
    const params = {
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    };

    if (search) {
      params.nameStartsWith = search;
    }

    return queryApi("/characters", params, onSuccess, onError);
  };

  const getImage = (thumbnail) =>
    `${thumbnail.path}.${thumbnail.extension}`.replace(/^http:/, "https:");

  const $searchForm = $("#search-form");
  const $error = $("#error");
  const $results = $("#results");
  const $loading = $("#loading");
  const $notFound = $("#not-found");
  const $loadMore = $("#load-more");
  const $searchInput = $searchForm.find(".input");
  const $searchButton = $searchForm.find(".button");
  const $tmplCharacter = $("#tmpl-character");
  const $characterPopup = $("#character-popup");

  const fetchOneCharacter = (id) => {
    queryApi(`/characters/${id}`, null, (data) => {
      const character = data.data.results[0];
      $characterPopup.find(".name").text(character.name);
      $characterPopup.find(".image").attr({
        alt: character.name,
        src: getImage(character.thumbnail),
      });
      $characterPopup.find(".details").text(character.description);
      $.fancybox.open({
        src: $characterPopup,
        type: "inline",
      });
    });
  };

  $results.on("click", "li", function () {
    const id = $(this).data("id");
    fetchOneCharacter(id);
  });

  let page = 0;
  let search = null;

  const fetchAndShowCharacters = () => {
    page++;

    $loading.show();
    $error.hide();
    $notFound.hide();
    $loadMore.hide();
    $searchButton.attr("disabled", true);

    searchCharacters(
      search,
      page,
      (data) => {
        $searchButton.attr("disabled", false);
        $loading.hide();
        $results.show();

        data.data.results.forEach((character) => {
          const $tmpl = $tmplCharacter.clone();
          $tmpl.attr("id", null);

          $tmpl.data("id", character.id);

          $tmpl.find(".avatar").attr({
            alt: character.name,
            src: getImage(character.thumbnail),
          });
          $tmpl.find(".name").text(character.name);
          // $tmpl.find(".link").on("click", () => {
          //   fetchOneCharacter(character.id);
          // });
          $tmpl.appendTo($results).fadeIn();
        });

        if (page === 1 && !data.data.results.length) {
          $notFound.show();
        }

        if (data.data.offset + data.data.count < data.data.total) {
          $loadMore.show();
        }
      },
      (error) => {
        $loading.hide();
        $error.show().find("p").text(error.message);
      }
    );
  };

  fetchAndShowCharacters();

  $loadMore.click(fetchAndShowCharacters);

  $searchForm.on("submit", (e) => {
    e.preventDefault();
    search = $searchInput.val();
    if (!search) {
      return;
    }
    $results.empty();
    page = 0;
    fetchAndShowCharacters(search);
  });
})();
