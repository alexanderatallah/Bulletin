jQuery.expr[':'].Contains = function(a,i,m){
  return jQuery.trim(a.textContent || a.innerText || "")
          .toUpperCase().indexOf(jQuery.trim(m[3]).toUpperCase())>=0;
};

function Searcher()
{
  var $search;
  var $input;
  var $data;
  var $results;
  var $selectedElem = null;
  var timeXHR = null; // timeout
  var currXHR = null; // AJAX object
  
  // Keys "enum"
  var KEY = {
      BACKSPACE: 8,
      TAB: 9,
      ENTER: 13,
      CONTROL: 17,
      ESCAPE: 27,
      SPACE: 32,
      PAGE_UP: 33,
      PAGE_DOWN: 34,
      END: 35,
      HOME: 36,
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
      NUMPAD_ENTER: 108,
      COLON: 186,
      COMMA: 188
  };
  
  // =====================
  // = Public functions ==
  // =====================
  
  this.search = function(value) { searchInput(value); };
  
  this.setupInterface = function() {
    $search = $("#search-wrapper");
    
    $input = $search.children("#search-input");
    $results = $search.children("#results");
    $data = $(".event");
    
    $blind = $("<div id='blind' />").appendTo(document.body)
                .css({
                  'position': 'fixed',
                  'left' : 0,
                  'top' : 0,
                  'right' : 0,
                  'bottom' : 0,
                  'z-index': -1,
                  'background-color' : 'black',
                  'opacity' : 0.6
                })
                .hide();
    
    // pull logo, bar, input and cells up in front of search
      $("#logo-img").css({
        'z-index': 105
      });
      $data.css({
        'position': 'relative',
        'z-index': 101
      });
      $input.css({
        position: 'relative',
        'z-index': 102
      });
    
    // ================
    // = Binding init =
    // ================
    
    $input.bind('focus', function() {
      $blind.fadeIn().css("z-index", 100);
      $(this).animate({
        'width': 240,
        'margin-left': '-=30'
      }, 200);
    }).bind('blur', function() {
      $blind.fadeOut().css("z-index", -1);
      $(this).animate({
        'width': 180,
        'margin-left': '+=30'
      }, 200);
    });
    
    // Search results binding
    $input.bind('search', function() { searchInput($input.val()); });
    $input.bind('change', function() { searchInput($input.val()); });
    
    // Results
    $results.delegate('a', 'mouseenter.Searcher', function() {
      if ($selectedElem && $selectedElem.get(0) === $(this).get(0)) return;
      if ($selectedElem) $selectedElem.removeClass("hover");
      $selectedElem = $(this);
      $selectedElem.addClass("hover");
    });
    
    // keyboard nav
    $input.keydown(function(e) {
      keyboardNav(e);
    });
  };
  
  // ========
  // = Init =
  // ========
  
  this.setupInterface();
  
  // =====================
  // = Private functions =
  // =====================
  
  function searchInput(value)
  {
    $results.empty();
    $selectedElem = null;

    // if (timeXHR) clearTimeout(timeXHR);
    // timeXHR = setTimeout(function() {
    //   AJAXSearch(value);
    // });
    
    $data.hide();
    if(value) {
      $data.filter(":Contains('" + value + "')").show();
    } else {
      $data.show();
    }
  }
  
  function keyboardNav(e)
  {
    var code = (e.keyCode ? e.keyCode : e.which);
    if (code == KEY.ESCAPE) {
      $input.blur();
      return;
    }
    if ($results.children().length === 0) return;

    switch(code) {
    case KEY.DOWN:
      if ($selectedElem) {
        $selectedElem.removeClass("hover");
        if ($selectedElem.next('a').length !== 0) $selectedElem = $selectedElem.next();
      }
      else $selectedElem = $results.children("a:first");
      $selectedElem.addClass("hover");
      break;
    case KEY.UP: // Go to previous element, but only hit the first token
      if ($selectedElem) {
        $selectedElem.removeClass("hover");
        if ($selectedElem.prev('a').length !== 0) $selectedElem = $selectedElem.prev();
      }
      else $selectedElem = $results.children("a:first");
      $selectedElem.addClass("hover");
      break;
    case KEY.ENTER: // Either use a selected token, or visit a selected result
      if (!$selectedElem) break;
      window.location = $selectedElem.attr('href');
      break;
    default:
      break;
    }
  }
  
  function AJAXSearch(value)
  {
    if (currXHR) currXHR.abort();
    // $('#spot-spinner').show();

    if (!$input.val()) {
      // $('#spot-spinner').hide();
      return;
    }
    // Store the ajax id in currXHR so we can abort it later
    currXHR = $.ajax({
      url: '/search',
      dataType: 'json',
      type: 'get',
      cache: true,
      data: {query: value},
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(["Error:", jqXHR, textStatus, errorThrown]);
        // $('#spot-spinner').hide();
        if (textStatus != "abort") {
          $results.children('.none-found').remove();
          var errorText = "Server error";
          if ($.trim(errorThrown)) errorText += ": " + errorThrown;
          $results.append("<li class='error'>" + errorText + "</li>");
        }
      },
      success: function(data, textStatus, jqXHR) {
        console.log(["AJAX Data: "], data);
        $results.empty();
        // $('#spot-spinner').hide();
        
        $.each(data, function(index, hash) {
          $results.append(getLink(hash));
        });
        
        // Append 'none found' if there are no results
        if (!data.length) {
          $results.append("<li class='none-found'>No results found.</li>");
        }
      }
    });
  }
  
  function getLink(hash)
  {
    var content = hash.visible_name;
    var url = hash.id;
    return "<a href='" + url + "' class='a-result'>" + content + "</a>";
  }
}