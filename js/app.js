'use strict';

// Get API info.
var getConfig = $.getJSON("js/config_secret.json");

// Check local storage for map-knockoutjs, which might hold
// locations and settings.
var getFromStorage = ko.utils.parseJson(localStorage.getItem('map-knockoutjs'));
if (getFromStorage) {
  var initialLocations = getFromStorage.locations;
  var settings = getFromStorage.settings;
}

if (!initialLocations) {
  var initialLocations = [
    {
      'title': 'New England Aquarium',
      'coordinates': [42.359151,-71.049576],
      'type': 'Attraction'
    },
    {
      'title': 'Frost Ice Loft',
      'coordinates': [42.360325,-71.053310],
      'type': 'Bar'
    },
    {
      'title': 'Central Wharf Company',
      'coordinates': [42.358668, -71.052720],
      'type': 'Bar'
    },
    {
      'title': 'Alamo Rent a Car',
      'coordinates': [42.358328, -71.051116],
      'type': 'Car Rental'
    },
    {
      'title': 'Boston Harbor Hotel',
      'coordinates': [42.356551, -71.050188],
      'type': 'Hotel'
    },
    {
      'title': 'Boston Harbor Cruises',
      'coordinates': [42.359714, -71.050660],
      'type': 'Attraction'
    },
    {
      'title': 'Boston Sail Loft',
      'coordinates': [42.362504, -71.050546],
      'type': 'Bar'
    },
    {
      'title': 'The Paul Revere House',
      'coordinates': [42.363640, -71.053743],
      'type': 'Attraction'
    },
    {
      'title': 'Orpheum Theatre',
      'coordinates': [42.356262, -71.061027],
      'type': 'Attraction'
    },
    {
      'title': 'Old North Church',
      'coordinates': [42.366320, -71.054439],
      'type': 'Attraction'
    },
    {
      'title': 'Hyatt Regency Boston',
      'coordinates': [42.353707, -71.060811],
      'type': 'Hotel'
    },
    {
      'title': 'Omni Parker House',
      'coordinates': [42.357553, -71.060174],
      'type': 'Hotel'
    }
  ];
}

var Location = function(data) {
  this.title = data.title;
  this.coordinates = data.coordinates;
  this.type = data.type;
  this.favorite = ko.observable(data.favorite);
};

var ViewModel = function(data) {
  var self = this;

  // init stuff.
  var initHasRun = false;
  this.init = function() {
    this.addListenerToMarker(this);
    this.addRemoveLocations();
    this.checkOrientation();
    // Prevents duplication of favorites.
    if (!this.alwaysShowFavorites) {
      this.setFavorites();
    }
    google.maps.event.addDomListener(map, 'click', function() { this.closeInfoWindow(); }.bind(this));
  }

  // Gets a setting from local storage.
  // If settings is undefined, return true. This might have to be changed later.
  this.getSetting = function( setting ) {
    // No settings have been saved at all.
    if (settings === undefined) {
      settings = {};
      settings[setting] = true;
      return true;
    // Settings exist and the setting exists.
    } else if (settings.hasOwnProperty(setting)) {
      return settings[setting];
    // Settings exist and setting does not exist.
    } else {
      return true;
    }
  }

  this.toggleAndUpdateSetting = function ( vm, data ) {
    var self = this;
    var option = data.currentTarget.id;
    var setting = data.currentTarget.checked;
    var redrawMapMarkers = true;

    settings[option] = setting;
    self.saveToStorage();

    // For moveFavoritesToTop checkbox, do not redraw map markers because
    // they should not change.
    if (option === 'moveFavoritesToTop') {
      var redrawMapMarkers = false;
    }

    // Send currently input text to addRemoveLocations.
    self.addRemoveLocations(self.mapSearchInputText(), redrawMapMarkers);

    // to toggle the checkbox: http://stackoverflow.com/a/11296375
    return true;
  }.bind(this);

  // Find the title the specified array and return the 'id' (i).
  self.matchTitle = function ( title, array ) {
    for (var i = 0; i < array.length; i++) {
      if (title === array[i].title) {
        return i;
      }
    }
  }

  // Sort a list.
  self.sortList = function( list ) {
    list.sort(function (left, right) {
      var sortByA = left.title;
      var sortByB = right.title;
      return sortByA == sortByB ? 0 : (sortByA < sortByB ? -1 : 1)
    });
  }

  this.mapSearchInputText = ko.observable("");
  // An observable array for favorites, to move favorite locations to the top
  // of the list.
  self.favoriteLocationsList = ko.observableArray();
  self.alwaysShowFavorites = ko.observable(self.getSetting('alwaysShowFavorites'));
  self.moveFavoritesToTop = ko.observable(self.getSetting('moveFavoritesToTop'));

  // Set up self.favoriteLocationsList from initialLocations,
  // which should have been loaded from local storage if it existed there.
  self.setFavorites = function() {
    initialLocations.forEach( function ( mapItem ) {
      if (mapItem.favorite === true) {
        self.favoriteLocationsList.push( new Location(mapItem) );
      }
    });
  }

  // For the user interface, a list that can be filtered when text is typed.
  self.filteredLocationsList = ko.observableArray();

  // Combine self.favoriteLocationsList and self.filteredLocationsList.
  this.dynamicLocationsList = ko.computed( function() {
    if (self.moveFavoritesToTop() === true ) {
      return self.favoriteLocationsList().concat(self.filteredLocationsList());
    }
    if (self.moveFavoritesToTop() === false) {
      return self.filteredLocationsList();
    }
  }, self);

  this.saveToStorage = function() {
    localStorage.setItem('map-knockoutjs', ko.toJSON({
        locations: initialLocations,
        settings: settings
      })
    );
  };


  // check for mobile browser
  /**
   * jQuery.browser.mobile (http://detectmobilebrowser.com/)
   *
   * jQuery.browser.mobile will be true if the browser is a mobile device
   *
   **/
  (function(a){(jQuery.browser=jQuery.browser||{}).mobile=/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))})(navigator.userAgent||navigator.vendor||window.opera);

  // Pans the map, with some changes to x, y in certain cases.
  this.panMap = function(newLatLng, x, y) {
    window.setTimeout( function() {
      map.setCenter(newLatLng);
      map.panBy(x, y);
    }, 15);
  }.bind(this);

  // Checks the page orientation and adjusts the user interface, mainly setting
  // where the flickr div goes, that the flickr div does not overlap with the
  // filter/header div, and re-pan the map to the marker.
  var moreInfoDiv, flickrDiv, orientation;
  this.checkOrientation = function() {
    var currentMoreInfoDiv = moreInfoDiv;
    var availableWidth = $(document).width();
    var availableHeight = $(window).height();

    if (availableHeight > availableWidth) {
      orientation = 'tall'
    } else {
      orientation = 'wide'
    }

    // By default, show flickr images on right.
    moreInfoDiv = 'more-info-right';
    flickrDiv = 'flickr-right';
    // Only exception, mobile tall orientation.
    if (jQuery.browser.mobile && orientation === 'tall') {
      moreInfoDiv = 'more-info-bottom';
      flickrDiv = 'flickr-bottom';
    }

    // For some reason, rotating a mobile device in Google Chrome
    // causes two window.width resizes. in this case, the currentMoreInfoDiv
    // is the same as moreInfoDiv, and this section should be skipped, othewise
    //  the new divs are added twice.

    // TODO I think this code could be better. Maybe make the divs in the HTML
    // file and instead of adding/removing divs, pick which one to load images
    // into.
    if (moreInfoDiv !== currentMoreInfoDiv) {
      // Remove the previous div if it exists.
      if (currentMoreInfoDiv) {
        var divRemoved = true;
        var currentMoreInfoDivElement = document.getElementById(currentMoreInfoDiv);
        currentMoreInfoDivElement.parentNode.removeChild(currentMoreInfoDivElement);
      }
      // Add new divs.
      $("#floating-panel").append('<div id="' + moreInfoDiv + '"></div>');
      $("#" + moreInfoDiv).append('<div id="' + flickrDiv + '" data-bind="html: flickrResults"></div>');
      // If flickrResults isn't empty, keep moreInfoDiv open (class = open).
      if(this.flickrResults().length > 0) { $('#' + moreInfoDiv).addClass('open'); }

      // The initial div has bindings applied by
      // ko.applyBindings(new ViewModel()); in the
      // html file. however, if a div was removed, the new div needs to have
      // bindings re-applied.
      if (divRemoved) {
        // http://stackoverflow.com/a/10826516
        ko.applyBindings(this, $( '#' + flickrDiv)[0]);
      }
    }

    // Add padding to moreInfoDiv to keep from overlapping with #floating-panel.
    if (availableWidth < 768) {
      $( "#" + moreInfoDiv ).addClass('add-padding');
    } else {
      $( "#" + moreInfoDiv ).removeClass('add-padding');
    }

    // Pan map after rotation.
    if (moreInfoDiv !== currentMoreInfoDiv && currentMoreInfoDiv) {
      var panByX = 0, panByY = 0, newLatLng;
      var lat = this.currentMarkerLocation[0];
      var lng = this.currentMarkerLocation[1];
      if (lat && lng) {
        // center map on new marker and pan
        newLatLng = {lat: lat, lng: lng};
        panByY = -135;
      } else {
        // no markers open, recenter map on default position
        newLatLng = defaultMapCenter;
      }

      this.panMap(newLatLng, panByX , panByY);

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

  // Determine what text is shown when no locations are found, based on whether
  // alwaysShowFavorites is checked or not.
  self.noLocationsFoundText = ko.observable();
  this.addRemoveLocations = function (inputText, updateMarkers) {
    var self = this;

    // So far, the only time to not update markers is when toggling
    // moveFavoritesToTop.
    if (updateMarkers === undefined) {
      updateMarkers = true;
    }

    // Remove items from filteredLocationsList.
    self.filteredLocationsList.removeAll();
    /*
      correctLocationsList is the list that determines when a message is shown
      that indicates that no locations have been found.

      If alwaysShowFavorites is false, then self.favoriteLocationsList can be
      filtered, and there should be a message when the entire list, ie
      self.dynamicLocationsList, is empty.

      If alwaysShowFavorites is true, then there should be a message when
      self.filteredLocationsList is empty, because self.favoriteLocationsList
      will not be changed.

      self.dynamicLocationsList contains both self.favoriteLocationsList
      and self.filteredLocationsList.
    */
    var correctLocationsList = self.filteredLocationsList;
    self.noLocationsFoundText('No Locations Found');

    // If alwaysShowFavorites was false and favorites have been filtered out,
    // re-add all favorites once alwaysShowFavorites is true.
    if (self.alwaysShowFavorites()) {
      self.favoriteLocationsList.removeAll();
      this.setFavorites();
    };

    // isFavorite sets whether this is a list of favorites (true) or
    // list of filtered items (false.)
    function filterLocationList( arrayToFilter, arrayToPushTo, isFavorite) {
      // By setting isFavorite to null, all mapItem(s) will be processed
      // by arrayToFilter.forEach(). Also, the ko.computed for
      // self.dynamicLocationsList will only be self.filteredLocationList, and
      // self.filteredLocationList will not be shown.
      if (self.moveFavoritesToTop() === false) {
        isFavorite = null;
      }
      arrayToFilter.forEach( function(mapItem){
        if (isFavorite === null || isFavorite === Boolean(mapItem.favorite)) {
          if (inputText) {
            $( '#collapse-locations').css('display', 'inline');
            // If alwaysShowFavorites === true and moveFavoritesToTop == false,
            // favorites need to be added regardless of the inputText because
            // self.favoriteLocationsList will not be shown.
            if (Boolean(self.alwaysShowFavorites()) === true &&
                  Boolean(self.moveFavoritesToTop()) === false &&
                  Boolean(mapItem.favorite) === true) {
              arrayToPushTo.push( new Location(mapItem) );
            }
            else if (mapItem.title.toLowerCase().includes(inputText.toLowerCase())) {
              arrayToPushTo.push( new Location(mapItem) );
            }
          }
          if (!inputText) {
            // No letters input, return all items.
            if (jQuery.browser.mobile) {
              $( '#collapse-locations').css('display', 'none');
            }
            arrayToPushTo.push( new Location(mapItem) );
          }
        }
      });
    }

    // If !alwaysShowFavorites; ie, filter favorites.
    if (!self.alwaysShowFavorites()) {
      var correctLocationsList = self.dynamicLocationsList;
      self.favoriteLocationsList.removeAll();

      // Push favorites in initialLocations to self.favoriteLocationsList
      filterLocationList (initialLocations, self.favoriteLocationsList, true);

    // If alwaysShowFavorites.length > 0 and there are favorites selected
    // by the user, update self.noLocationsFoundText ('the error message.')
    } else {
      if (self.favoriteLocationsList().length > 0) {
        self.noLocationsFoundText('No locations found. Displaying favorites.')
      }
    }

    // Filter non-favorites (runs always)
    // push items from initialLocations that match input text to
    // self.filteredLocationsList.
    filterLocationList (initialLocations, self.filteredLocationsList, false);

    // Sort list alphabetically.
    self.sortList(self.filteredLocationsList);

    // Handle error case:
    // alwaysShowFavorites === true and moveFavoritesToTop === false.
    // In this case, correctLocationsList().length is never 0 if there is a
    // favorite marked, because favorites are in the same list as the rest of
    // the locations.
    if (Boolean(self.moveFavoritesToTop()) === false &&
          correctLocationsList().length ===
          self.favoriteLocationsList().length) {
        var showError = true;
    }

    if(showError === true || inputText && correctLocationsList().length === 0) {
      $( '#no-locations-found' ).css('display', 'inline');
    } else {
      $( '#no-locations-found' ).css('display', 'none');
    }

    // So far, the only time to not update markers is when toggling
    // moveFavoritesToTop.
    if (updateMarkers === true) {
      // Add/remove markers from the map.
      // First check if markersArray has been created.
      if (typeof markersArray !== 'undefined') {
        // Make an array of self.dynamicLocationsList titles.
        var dynamicLocationsListTitles = [];
        self.dynamicLocationsList().forEach(function (Location) {
          dynamicLocationsListTitles.push(Location.title);
        });

        // Loop through markers array and check if the marker title is in
        // self.dynamicLocationsListTitles. If it is not, remove the marker
        // from the map. Otherwise, set the marker to this map.
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
    }
  }.bind(this);

  // http://stackoverflow.com/questions/12229751/knockout-js-triggers-based-on-changes-in-an-observable
  // Check mapSearchInputText for inputText and update makeMapList based on inputText.
  this.mapSearchInputText.subscribe(function (inputText) {
    this.addRemoveLocations(inputText);
  }, this);

  // Keep track of open infoWindow(s). Use to close the previous infoWindow.
  var openInfoWindows = [];
  this.closeInfoWindow = function () {
    // Check if there's at least one openInfoWindows defined. If there is,
    // close the last infoWindow, remove images from ko.observable
    // flickrResults, and clear the window hash.
    if (openInfoWindows[0]) {
      this.flickrResults('');
      openInfoWindows[openInfoWindows.length - 1].close();
      window.location.hash = '';
    };
  }.bind(this);

  this.currentMarkerLocation = '';
  this.infowindow =  new google.maps.InfoWindow({disableAutoPan: true});
  this.openInfoWindow = function (title) {
    var self = this;
    // The 'list view' sends the title as an object.
    // In this case, the title is actually title.title.
    // The map marker sends the title as a string.
    if (typeof title === 'object' ) {
      title = title.title;
    }

    self.closeInfoWindow();

    // Show the area that will display flickr images.
    // TODO: Rename moreInfoDiv to FlickrDiv?
    $( "#" + moreInfoDiv ).addClass( 'open' );

    // This is which marker number to attach the info window to.
    // Gets the index of the marker in markersArray.
    // Ie, markersArray[itemindex] === marker that was clicked.
    var itemindex = self.matchTitle(title, initialLocations);

    window.location.hash = title.replace(/ /g, '%20');
    this.currentMarkerLocation = initialLocations[itemindex].coordinates;

    // Center map on new marker and adjust pan in a few situations.
    var lat = this.currentMarkerLocation[0];
    var lng = this.currentMarkerLocation[1];
    var newLatLng = {lat: lat, lng: lng};
    var panByX, panByY;
    if (orientation === 'wide') {
      // Roughly centers the space around the infoWindow.
      // Adjusted for the size of 'small' flickr images on right (75 px / 2).
      panByX = 37;
    } else {
      panByX = 0;
    }
    // Keeps the top of the infoWindow from overlapping with the bottom of the
    // floating-panel-header, especially on iPhone 5 size screens.
    panByY = -135;

    this.panMap(newLatLng, panByX , panByY);

    // Bounce the marker for 2800 ms. This seems to be when it reaches the
    // down position.
    markersArray[itemindex].setAnimation(google.maps.Animation.BOUNCE);
    window.setTimeout(function() {
      markersArray[itemindex].setAnimation(null);
    }, 2800);

    // Set default content for infoWindow in case loading information takes
    // a long time.
    self.infowindow.setContent('Loading Infomation from Yelp');
    self.infowindow.open(map, markersArray[itemindex]);
    self.infowindow.addListener('closeclick', function() {
      window.location.hash = '';
      $("#collapse-locations").slideDown();
      $( "#" + moreInfoDiv ).removeClass( 'open' );
    }.bind(this));

    // Add the infoWindow to the array that keeps track of which infoWindow
    // to close.
    openInfoWindows.push(self.infowindow);

    // searchAPIsAndDisplayResults does two things:
    // 1. Search flickr for images and update the moreInfo div.
    // 2. Search yelp for business info and update yelpInfoWindowContent.
    this.searchAPIsAndDisplayResults(title);
    if (jQuery.browser.mobile) {
      $("#collapse-locations").slideUp();
    }
  }.bind(this);

  this.toggleFavorite = function( item ) {
    var self = this;

    // Find item in initialLocations, bcause initialLocations is what
    // is saved to local storage.
    var mapItemToUpdate = initialLocations.find( function( mapItem ) {
      return mapItem.title === item.title;
    })

    // Gets the index of the mapItem in each array
    var itemIndexInFavorites = self.matchTitle(item.title,
      self.favoriteLocationsList());
    var itemIndexInFiltered = self.matchTitle(item.title,
      self.filteredLocationsList());

    // TODO: make this code more concise.
    // Using !Boolean( item.favorite() ) to toggle the favorite causes the
    // favorite to not be saved.

    // Remove a favorite
    if (Boolean(item.favorite()) === true) {
      // Update the object so dynamicLocationList (the user interface)
      // gets updated.
      item.favorite(false);
      // Update initialLocations because it get saved to local storage.
      mapItemToUpdate.favorite = false;
      if (self.moveFavoritesToTop() === true) {
        self.favoriteLocationsList.splice(itemIndexInFavorites, 1);
        self.filteredLocationsList.push( item );
        self.sortList(self.filteredLocationsList);
      }
    }

    // Create a favorite. See above for comments.
    else if (Boolean(item.favorite()) === false) {
      item.favorite(true);
      mapItemToUpdate.favorite = true;
      if (self.moveFavoritesToTop() === true) {
        self.filteredLocationsList.splice(itemIndexInFiltered, 1);
        self.favoriteLocationsList.push( item );
      }
    }

    this.saveToStorage();
  }.bind(this);

  // TODO: Is this comment formatting ok?

  /**
    Search Flickr via Flickr API for images for moreInfoDiv.
    * Link to documentation for photos.search:
        https://www.flickr.com/services/api/flickr.photos.search.html
    * Flickr photo source urls, or, working with results of photo.search:
      https://www.flickr.com/services/api/misc.urls.html
  */
  this.flickrResults = ko.observable('');
  this.flickrSearchURL = ko.observable();
  this.searchFlickr = function (query) {
    // Set to '' otherwise later, += will cause undefined to be added to the string.
    var flickrResultsString = '';
    var self = this;

    // Clear previous image results.
    self.flickrResults('');
    // Set the return format (json) and api_key for all API requests.
    var flickrAPIbase = "https://api.flickr.com/services/rest/?format=json&api_key=f4dbf30dea5b300071f0d6c721b8a3b5&sort=relevance";
    // Replace spaces in title with %20, and append %20Boston for better results.
    var flickrAPISearchQuery = query.replace(/ /g, "%20") + "%20Boston";
    var flickrAPIsearch = "&method=flickr.photos.search&text=" + flickrAPISearchQuery;
    var fullFlickrAPIsearch = flickrAPIbase + flickrAPIsearch;

    var request = $.ajax(fullFlickrAPIsearch);
    request.fail(function(){
      // TODO This absolutely does not fit when the flickr div
      // is a thin column on the right.
      self.flickrResults(
        '<span class="error text-center">' +
        'there was an error<br> connecting to flickr' +
        '</span>'
      );
    });
    request.done(function( data ){
      var newData = JSON.parse(data.replace("jsonFlickrApi(", "").slice(0, -1));
      var numberOfPhotoResults = newData.photos.photo.length;

      if (jQuery.browser.mobile) {
        // Size suffixes info: https://www.flickr.com/services/api/misc.urls.html
        var flickrImageSizeSuffix = 's'; // small square, 75x75
      } else {
        var flickrImageSizeSuffix = 'q'; // large square, 150x150
      }

      // Determine numberOfPhotosToShow
      if (numberOfPhotoResults < 10) {
        var numberOfPhotosToShow = numberOfPhotoResults;
      } else {
        var numberOfPhotosToShow = 10;
      }

      if (newData.photos.total < 0) {
        self.flickrResults("<span class='error text-center'>no photos found on flickr</span>");
      } else {
        for (var i = 0; i < numberOfPhotosToShow; i++) {
          var farm = newData.photos.photo[i].farm;
          var server_id = newData.photos.photo[i].server;
          var id = newData.photos.photo[i].id;
          var secret = newData.photos.photo[i].secret;

          // Photo source url info, including size:
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
        '<a href="https://www.flickr.com/search/?text=' +
        flickrAPISearchQuery + '" target="_new">' +
        '<span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>' +
        '</a>' +
        '</div>';

      self.flickrSearchURL('https://www.flickr.com/search/?text=' + flickrAPISearchQuery);
      self.flickrResults(flickrResultsString);

    });
  }.bind(this); // End of searchFlickr().

  /**
   * Generates a random number and returns it as a string for OAuthentication
   * @return {string}
   */
  function nonce_generate() {
    return (Math.floor(Math.random() * 1e12).toString());
  }

  // TODO: Is this comment formatting ok?

  /**
   Search yelp via yelp api
    https://discussions.udacity.com/t/how-to-make-ajax-request-to-yelp-api/13699/24
    https://discussions.udacity.com/t/yelp-api-not-working/163965/4
  */
  this.yelpInfoWindowContent = ko.observable();
  this.searchYelp = function (query) {
    var self = this;
    // $(document).ready fixes Yelp not working on Firefox (and maybe others)
    // when loading the page with a location in the hash.
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
        callback: 'cb', // This is crucial to include for jsonp implementation
        // in AJAX or else the oauth-signature will be wrong.
        term: query,
        location: 'Boston'
      };

      var encodedSignature = oauthSignature.generate('GET',yelp_url, parameters, configBase.YELP_KEY_SECRET, configBase.YELP_TOKEN_SECRET);
      parameters.oauth_signature = encodedSignature;

      var settings = {
        url: yelp_url,
        data: parameters,
        cache: true,  // This is crucial to include as well to prevent jQuery
        // from adding on a cache-buster parameter "_=23489489749837",
        // invalidating our oauth-signature
        dataType: 'jsonp'
      };

      // Send AJAX query via jQuery library.
      var yelpQuery = $.ajax(settings);
      yelpQuery.done(function(results) {
        var businessInfo = results.businesses[0];
        var businessIsClosedText = '';

        if (businessInfo.is_closed === true) {
          businessIsClosedText = "<strong>Yelp reports this business is closed.</strong><br>"
        }

        self.infowindow.setContent(
          '<div class="infoWindowTitle">' +
            '<a href="' + businessInfo.url + '">' +
              businessInfo.name +
            '</a>' +

            '<a href="' + businessInfo.url + ' " target="_new">' +
              '<span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>' +
            '</a>' +
          '</div>' +

          businessIsClosedText +
          businessInfo.categories[0][0] + '<br>' +

          '<span class="glyphicon glyphicon-earphone" aria-hidden="true"></span>' +
          businessInfo.display_phone +
          '<br><img src="' + businessInfo.rating_img_url +'">' +
          '<br>Rating based on ' + businessInfo.review_count + ' reviews.');

      }),
      yelpQuery.fail( function() {
        self.infowindow.setContent(
          '<div class="infoWindowTitle">' + query + '</div>' +
          "<div class='error small-text text-center'>there was an error connecting to yelp</div>"
        );
      });
    })
  }.bind(this);

  // Search Flickr, Yelp, and display results in the user interface.
  this.searchAPIsAndDisplayResults = function (title) {
    this.searchFlickr(title);
    this.searchYelp(title);
  }.bind(this);

  // Toggle location list. This is needed for the button near the div.
  this.collapseLocationDiv = function () {
      $( "#collapse-locations" ).slideToggle();
      if (jQuery.browser.mobile) {
        $( "#more-info-right").removeClass('open');
      }
  }.bind(this);

  var urlHash = window.location.hash;
  if (urlHash) {
    var title = urlHash.replace(/%20/g, ' ').slice(1);
    // If openInfoWindow is run here without init, moreInfoDiv is not defined.
    this.init();
    initHasRun = true;
    this.openInfoWindow(title);
  }

  if (initHasRun !== true) {
    this.init();
  }
};
