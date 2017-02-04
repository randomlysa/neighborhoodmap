'use strict';

// get api info
var getConfig = $.getJSON("js/config_secret.json");

var initialLocations = [
  {
    'title': 'New England Aquarium',
    'coordinates': [42.359151,-71.049576]
  },
  {
    'title': 'Frost Ice Loft',
    'coordinates': [42.360325,-71.053310]
  },
  {
    'title': 'Central Wharf Company',
    'coordinates': [42.358668, -71.052720]
  },
  {
    'title': 'Alamo Rent a Car',
    'coordinates': [42.358328, -71.051116]
  },
  {
    'title': 'Boston Harbor Hotel',
    'coordinates': [42.356551, -71.050188]
  },
  {
    'title': 'Boston Harbor Cruises',
    'coordinates': [42.359714, -71.050660]
  },
  {
    'title': 'Boston Sail Loft',
    'coordinates': [42.362504, -71.050546]
  },
  {
    'title': 'The Paul Revere House',
    'coordinates': [42.363640, -71.053743]
  },
  {
    'title': 'Orpheum Theatre',
    'coordinates': [42.356503, -71.060023]
  },
  {
    'title': 'Old North Church',
    'coordinates': [42.366320, -71.054439]
  },
  {
    'title': 'Hyatt Regency Boston',
    'coordinates': [42.353707, -71.060811]
  },
  {
    'title': 'Omni Parker House',
    'coordinates': [42.357553, -71.060174]
  }
];

var Location = function(data) {
  this.title = data.title;
  this.coord = data.coordinates;
  this.info = data.info;
};


var ViewModel = function(data) {
  var self = this;
  this.mapSearchInputText = ko.observable("");
  this.dynamicLocationsList = ko.observableArray();

  // check for mobile browser
  /**
   * jQuery.browser.mobile (http://detectmobilebrowser.com/)
   *
   * jQuery.browser.mobile will be true if the browser is a mobile device
   *
   **/
  (function(a){(jQuery.browser=jQuery.browser||{}).mobile=/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))})(navigator.userAgent||navigator.vendor||window.opera);

  var moreInfoDiv;
  var flickrDiv;
  this.checkOrientation = function() {
    var currentMoreInfoDiv = moreInfoDiv;
    var availableWidth = $(document).width();
    var availableHeight = $(window).height();

    if (availableHeight > availableWidth) {
      var orientation = 'tall'
    } else {
      var orientation = 'wide'
    }

    // by default, show flickr images on right.
    moreInfoDiv = 'more-info-right';
    flickrDiv = 'flickr-right';
    // only exception, mobile tall orientation
    if (jQuery.browser.mobile && orientation === 'tall') {
      moreInfoDiv = 'more-info-bottom';
      flickrDiv = 'flickr-bottom';
    }

    /* for some reason, rotating a mobile device in Google Chrome
    causes two window.width resizes. in this case, the currentMoreInfoDiv is the same
    as moreInfoDiv, and this section should be skipped, othewise the new divs are added twice */
    if (moreInfoDiv !== currentMoreInfoDiv) {
      // remove the previous div if it exists
      if (currentMoreInfoDiv) {
        var divRemoved = true;
        var currentMoreInfoDivElement = document.getElementById(currentMoreInfoDiv);
        currentMoreInfoDivElement.parentNode.removeChild(currentMoreInfoDivElement);
      }
      // add new divs
      $("#floating-panel").append('<div id="' + moreInfoDiv + '"></div>');
      $("#" + moreInfoDiv).append('<div id="' + flickrDiv + '" data-bind="html: flickrResults"></div>');
      // if flickrResults isn't empty, keep moreInfoDiv open (class = open)
      if(this.flickrResults().length > 0) { $('#' + moreInfoDiv).addClass('open'); }

      // the initial div has bindings applied by ko.applyBindings(new ViewModel()); in the
      // html file. however, if a div was removed, the new div needs to have bindings re-applied
      if (divRemoved) {
        // http://stackoverflow.com/a/10826516
        ko.applyBindings(this, $( '#' + flickrDiv)[0]);
      }
    }

    // add padding to moreInfoDiv to keep from overlapping with #floating-panel
    if (availableWidth < 768) {
      $( "#" + moreInfoDiv ).addClass('add-padding');
    } else {
      $( "#" + moreInfoDiv ).removeClass('add-padding');
    }

    if (moreInfoDiv !== currentMoreInfoDiv && currentMoreInfoDiv) {
      var lat = this.currentMarkerLocation[0];
      var lng = this.currentMarkerLocation[1];
      // if no marker has been clicked
      if (!lat || !lng) {
        var newLatLng = defaultMapCenter;
        // no InfoWindow has been opened so no need to pan to make room for it.
        var panByY = 0;
      } else {
        var newLatLng = {lat: lat, lng: lng};
        var panByY = -120;
      }

      window.setTimeout( function() {
        map.setCenter(newLatLng);
        if (orientation === 'wide') {
          map.panBy(0, panByY);
        }
      }, 5);

    }
  }.bind(this);

  $( window ).resize(this.checkOrientation);

  this.addListenerToMarker = function() {
    markersArray.forEach( function( marker, position ) {
      var title = markersArray[position].title;
      marker.addListener('click', function() {
        self.openInfoWindow(title, 'map');
      });
    }, this);

  }.bind(this);

  this.addRemoveLocations = function (inputText) {
    // remove items from dynamicLocationsList
    self.dynamicLocationsList.removeAll();

    // loop through initialLocations (all locations) and push them
    // back to dynamicLocationsList if they equal the input text
    initialLocations.forEach(function(mapItem){
      if (inputText) {
        $( '#collapse-locations').css('display', 'inline');
        if (mapItem.title.toLowerCase().includes(inputText.toLowerCase())) {
          self.dynamicLocationsList.push( new Location(mapItem) );
        }
      }
      if (!inputText) {
        // no letters input, return all items
        if (jQuery.browser.mobile) {
          $( '#collapse-locations').css('display', 'none');
        }
        self.dynamicLocationsList.push( new Location(mapItem) );
      }
    });

    if(inputText && self.dynamicLocationsList().length === 0) {
      $( '#no-locations-found' ).css('display', 'inline');
    } else {
      $( '#no-locations-found' ).css('display', 'none');
    }

    // add/remove markers from the map.
    // first check if markersArray has been created
    if (typeof markersArray !== 'undefined') {
      // make an array of self.dynamicLocationsList titles
      var dynamicLocationsListTitles = [];
      self.dynamicLocationsList().forEach(function (Location) {
        dynamicLocationsListTitles.push(Location.title);
      });

      // loop through markers array (array length shouldn't change)
      // and check if the marker title is in the dLLtitles array
      // for (var i = 0; i < markersArray.length; i++) {
        markersArray.forEach( function(item, position) {
        var title = markersArray[position].title;
        var result = dynamicLocationsListTitles.indexOf(item.title);
        if (result === -1) {
          markersArray[position].setMap(null);
        } else {
          markersArray[position].setMap(map);
        }
      });
    }
  }.bind(this);

  // http://stackoverflow.com/questions/12229751/knockout-js-triggers-based-on-changes-in-an-observable
  // check mapSearchInputText for inputText and update makeMapList with inputText
  this.mapSearchInputText.subscribe(function (inputText) {
    this.addRemoveLocations(inputText);
  }, this);

  // keep track of open infoWindows to close the previous one
  this.openIW = [];

  this.closeIW = function (clickLocation) {
    // check if there's at least one openIW defined. if there is, close the last one.
    if (this.openIW[0] !== undefined) {
      this.flickrResults('');
      this.openIW[this.openIW.length-1].close();
      window.location.hash = '';
    };
    // this keeps the collapse-locations div from sliding down
    // when clicking from one map marker directly on another one
    if (clickLocation !== 'map') {
      $( "#" + moreInfoDiv ).removeClass( 'open' );
      if (!jQuery.browser.mobile) {
        this.updateCollapseLocationsIcon();
        $("#collapse-locations").slideDown();
      }
    }
  }.bind(this);

  this.currentMarkerLocation = '';
  this.openInfoWindow = function (title, clickLocation) {
    // the 'list view' sends the title as an object.
    // in this case, the title is actually title.title
    // the map marker sends the title as a string
    if (typeof title === 'object' ) {
      title = title.title;
    }

    this.closeIW(clickLocation);

    // slide up the more info div
    $( "#" + moreInfoDiv ).addClass( 'open' );

    // find the title in initialLocations and return the 'id' (i)
    // this is which marker # to attach the info window to
    // (markers are stored in an array)
    function matchtitles(title) {
      for (var i = 0; i < initialLocations.length; i++) {
        if (title == initialLocations[i].title) {
          return i;
        }
      }
    }

    var infowindow =  new google.maps.InfoWindow({});
    // gets the index of the marker in markersArray
    // ie, markersArray[itemindex] == marker that was clicked
    var itemindex = matchtitles(title);
    window.location.hash = title.replace(/ /g, '%20');
    this.currentMarkerLocation = initialLocations[itemindex].coordinates;

    // bounce the marker for 2800 ms
    markersArray[itemindex].setAnimation(google.maps.Animation.BOUNCE);
    window.setTimeout(function() {
      markersArray[itemindex].setAnimation(null);
    }, 2800);

    infowindow.setContent('' +
      '<div class="infoWindowTitle">' + title + '</div>' +
      '<div id="yelp" class="yelp"></div>'
    );
    infowindow.open(map, markersArray[itemindex]);
    infowindow.addListener('closeclick', function() {
      window.location.hash = '';
      this.updateCollapseLocationsIcon();
      $("#collapse-locations").slideDown();
      $( "#" + moreInfoDiv ).removeClass( 'open' );
    }.bind(this));
    // add the infoWindow to the array that keeps track of which IWs to close
    this.openIW.push(infowindow);
    // search flickr for images and update the moreInfo/moreInfoMobile div
    // search yelp for business review/info and update #yelp (located in the infoWindow)
    this.updateDiv(title);
    if (jQuery.browser.mobile) {
      this.updateCollapseLocationsIcon();
      $("#collapse-locations").slideUp();
    }
  }.bind(this);

  /* search flickr via flickr api for images for more-info-div.
    photos.search docs:
      https://www.flickr.com/services/api/flickr.photos.search.html
    flickr photo source urls, or, working with results of photo.search :
      https://www.flickr.com/services/api/misc.urls.html
  */
  this.flickrResults = ko.observable('');
  this.flickrSearchURL = ko.observable();
  this.searchFlickr = function (query) {
    // set to '' otherwise later, += will cause undefined to be added to the string
    var flickrResultsString = '';
    var self = this;

    // clear previous image results
    self.flickrResults('');
    // set the return format (json) and api_key for all api requests
    var flickrAPIbase = "https://api.flickr.com/services/rest/?format=json&api_key=f4dbf30dea5b300071f0d6c721b8a3b5&sort=relevance";
    // take the first part of the title (before first parenthesis),
    // replace spaces with %20, and append %20Boston for better results
    var flickrAPISearchQuery = query.replace(/ /g, "%20") + "%20Boston";
    var flickrAPIsearch = "&method=flickr.photos.search&text=" + flickrAPISearchQuery;
    var fullFlickrAPIsearch = flickrAPIbase + flickrAPIsearch;

    var request = $.ajax(fullFlickrAPIsearch);
    request.fail(function(){
      self.flickrResults("<span class='error text-center'>there was an error<br> connecting to flickr</span>");
    });
    request.done(function( data ){
    var newData = JSON.parse(data.replace("jsonFlickrApi(", "").slice(0, -1));
    var numberOfPhotoResults = newData.photos.photo.length;

    if (jQuery.browser.mobile) {
      // size suffixes info: https://www.flickr.com/services/api/misc.urls.html
      var flickrImageSizeSuffix = 's'; // small square, 75x75
    } else {
      var flickrImageSizeSuffix = 'q'; // large square, 150x150
    }

    // determine numberOfPhotosToShow
    if (numberOfPhotoResults < 10) {
      var numberOfPhotosToShow = numberOfPhotoResults;
    } else {
      var numberOfPhotosToShow = 10
    }

    if (newData.photos.total < 0) {
      self.flickrResults("<span class='error text-center'>no photos found on flickr</span>");
    } else {
      for (var i = 0; i < numberOfPhotosToShow; i++) {
        var farm = newData.photos.photo[i].farm;
        var server_id = newData.photos.photo[i].server;
        var id = newData.photos.photo[i].id;
        var secret = newData.photos.photo[i].secret;

        // photo source url info, including size
        // https://www.flickr.com/services/api/misc.urls.html
        var flickrThumbnailWithLink = '' +
        '<a href="https://farm' + farm + '.staticflickr.com/' +
          server_id + '/' + id + '_' + secret + '_b' + '.jpg" ' +
          'data-lightbox="flickr">' +

        '<img src="https://farm' + farm + '.staticflickr.com/' +
          server_id + '/' + id + '_' + secret + '_' + flickrImageSizeSuffix + '.jpg" ' +

          '</a>';
        flickrResultsString += (flickrThumbnailWithLink);
      }
    }

    flickrResultsString += '' +
      '<div class="flickr-more">' +
      // '<a href="https://www.flickr.com/search/?text=' +
      // flickrAPISearchQuery + '">More photos on Flickr</a>&nbsp;&nbsp;' +
      '<a href="https://www.flickr.com/search/?text=' +
      flickrAPISearchQuery + '" target="_new">' +
      '<span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>' +
      '</a>' +
      '</div>';

    self.flickrSearchURL('https://www.flickr.com/search/?text=' + flickrAPISearchQuery);
    self.flickrResults(flickrResultsString);

    });
  }.bind(this); // end of searchFlickr()

  /**
   * Generates a random number and returns it as a string for OAuthentication
   * @return {string}
   */
  function nonce_generate() {
    return (Math.floor(Math.random() * 1e12).toString());
  }

  /* search yelp via yelp api
    https://discussions.udacity.com/t/how-to-make-ajax-request-to-yelp-api/13699/24
    https://discussions.udacity.com/t/yelp-api-not-working/163965/4
  */
  this.searchYelp = function (query, callback) {
    $(document).ready(function() {
      var configBase = getConfig.responseJSON.config;
      var yelp_url = 'https://api.yelp.com/v2/search';
      var infowindowContent;

      var parameters = {
        oauth_consumer_key: configBase.YELP_KEY,
        oauth_token: configBase.YELP_TOKEN,
        oauth_nonce: nonce_generate(),
        oauth_timestamp: Math.floor(Date.now()/1000),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_version : '1.0',
        callback: 'cb', // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
        term: query,
        location: 'Boston'
      };

      var encodedSignature = oauthSignature.generate('GET',yelp_url, parameters, configBase.YELP_KEY_SECRET, configBase.YELP_TOKEN_SECRET);
      parameters.oauth_signature = encodedSignature;

      var settings = {
        url: yelp_url,
        data: parameters,
        cache: true,  // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
        dataType: 'jsonp'
      };

      // Send AJAX query via jQuery library.
      var yelpQuery = $.ajax(settings);
      yelpQuery.done(function(results) {
        // Do stuff with results
        var businessInfo = results.businesses[0];
        infowindowContent = '' +
          businessInfo.categories[0][0] +
          '&nbsp;&nbsp;<span class="glyphicon glyphicon-earphone" aria-hidden="true"></span>' +
          businessInfo.display_phone +
          '<br><img src="' + businessInfo.rating_img_url +'">' +
          '<br>Rating based on ' + businessInfo.review_count + ' reviews.<br>' +
          '<a href="' + businessInfo.url + '">More info on Yelp</a>&nbsp;&nbsp;' +
          '<a href="' + businessInfo.url + ' " target="_new">' +
          '<span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>' +
          '</a>' ;

        callback(infowindowContent);
      }),
      yelpQuery.fail( function() {
        // Do stuff on fail
        infowindowContent = "<span class='error text-center'>there was an error<br> connecting to yelp</span>";
        callback(infowindowContent);
      });
    });
  }

  // update the moreInfoDiv div with flickr info and infoWindow with yelp info
  this.updateDiv = function (title) {
    this.searchFlickr(title);

    this.searchYelp(title, function(result) {
      $( "#yelp" ).append( result );
    });
  }.bind(this);

  this.updateCollapseLocationsIcon = function() {
    window.setTimeout(function() {
      var clDisplay = $( "#collapse-locations" ).css('display');
      if (clDisplay === 'block') {
          $( '#toggle-button').removeClass('glyphicon-expand');
          $( '#toggle-button').addClass('glyphicon-collapse-up');
          // $( "#collapse-locations" ).slideUp();
        }
      if (clDisplay === 'none') {
        $( '#toggle-button').removeClass('glyphicon-collapse-up');
        $( '#toggle-button').addClass('glyphicon-expand');
        // $( "#collapse-locations" ).slideDown();
      }
    }, 450);
  }.bind(this);

  // toggle location list. this is needed for the button near the div
  this.collapseLocationDiv = function () {
      $( "#collapse-locations" ).slideToggle();
      if (jQuery.browser.mobile) {
        $( "#more-info-right").removeClass('open');
      }
  }.bind(this);

  var urlHash = window.location.hash;
  if (urlHash) {
    var title = urlHash.replace(/%20/g, ' ').slice(1);
    this.openInfoWindow(title);
  }

// init stuff
  this.init = function() {
    this.addListenerToMarker(this);
    this.addRemoveLocations();
    this.checkOrientation();
    google.maps.event.addDomListener(map, 'click', function() { this.closeIW(); }.bind(this));
  }
  this.init();
};
