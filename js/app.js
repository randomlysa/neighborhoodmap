'use strict';

// Get API info.
var getConfig = $.getJSON("js/config_secret.json");

// Generate random ID for a location.
var randomID = function() {
  var id = '';
  while (id.length < 10) {
    id = id + (Math.floor(Math.random() * 10));
  }
  return id;
}

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
  var self = this;
  self.id = randomID();
  self.title = data.title;
  self.coordinates = data.coordinates;
  self.type = data.type;
  self.favorite = ko.observable(data.favorite);
  // Determine if the item is a favorite and return the correct icon.
  self.favoriteText = ko.pureComputed( function() {
    return self.favorite() === true ? "bookmark" : "bookmark_border";
  }, self);
  // Default the beenhere icon to false.
  if (data.beenhere === undefined) { data.beenhere = false; }
  self.beenhere = ko.observable(data.beenhere);
  self.beenhereCSS = ko.computed( function() {
    return self.beenhere() ? '' : 'md-dark md-inactive';
  });
};

var ViewModel = function(data) {
  var self = this;

  // init stuff.
  var initHasRun = false;
  self.init = function() {
    self.groupLocations();
    self.loadMapMarkers();
    self.addListenerToMarker(this);
    self.addRemoveLocationsAndMapMarkers();
    self.checkOrientation();
    // Prevents duplication of favorites.
    if (!self.settingAlwaysShowFavorites) {
      self.setupLocationLists();
    }
  };

  // Settings functions: getSetting, saveToStorage, toggleAndSaveSetting,
  // getAllSettings (IIFE).

  // Gets a setting from local storage.
  // If settings is undefined, return true. This might have to be changed later.
  self.getSetting = function(setting) {
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
      if (setting === 'enableEditMode') { return false; }
      else { return true; }
    }
  };

  // Save settings and locations infomation.
  self.saveToStorage = function() {
    window.setTimeout(function(){
      // Save locations and settings.
      // Delayed 400 ms to allow observables to update.
      localStorage.setItem('map-knockoutjs', ko.toJSON({
          locations: self.dynamicLocationsList,
          settings: settings
        })
      );
    }, 400);
  };

  self.toggleAndSaveSetting = function(vm, data) {
    var self = this;
    var option = data.currentTarget.id;
    var setting = data.currentTarget.checked;
    var redrawMapMarkers = true;

    settings[option] = setting;
    self.saveToStorage();

    if (option === 'displayCustomMapMarkers') {
      self.updateMarkerIcons();
    }

    // Send currently input text to addRemoveLocationsAndMapMarkers.
    self.addRemoveLocationsAndMapMarkers(self.mapSearchInputText(), redrawMapMarkers);

    // to toggle the checkbox: http://stackoverflow.com/a/11296375
    return true;
  }.bind(this);

  // Is an IIFE, otherwise self.settingDisplayErrorMessage() doesn't exist
  // when it needs to.
  self.getAllSettings = (function() {
    // List all settings.
    var allSettings = [
      'alwaysShowFavorites',
      'displayBeenhereColumn',
      'displayErrorMessage',
      'displayCustomMapMarkers',
      'disablePOIClickEvent',
      'enableEditMode'
    ];

    // Get gettings from storage.
    allSettings.forEach( function(setting) {
      // convert setting into settingSettingName
      var settingName = 'setting' + setting[0].toUpperCase() + setting.slice(1);
      self[settingName] = ko.observable(
        self.getSetting(setting)
      );
    });
  })();

  // Helper functions: set up key bindings, check for mobile browser,
  // matchTitle, sortList, panMap, checkOrientation, collapseLocationDiv,
  // setFavorites, toggleProperty, clearAllFavorites, autocomplete using
  // awesomplete, fadeVisible, some variables for errors, function for esc key
  // binding, custom left click and right click options, helpMoreInfo.

  // Set up key bindings. Taken from todomvc knockoutjs code:
  // https://github.com/tastejs/todomvc/blob/master/examples/knockoutjs/js/app.js
  var RIGHTARROW_KEY = 39;
  var LEFTARROW_KEY = 37;
  var ESCAPE_KEY = 27;

  // A factory function we can use to create binding handlers for specific
  // keycodes.
  function keyhandlerBindingFactory(keyCode) {
    return {
      init: function(element, valueAccessor, allBindingsAccessor, data, bindingContext) {
        var wrappedHandler, newValueAccessor;

        // wrap the handler with a check for the enter key
        wrappedHandler = function(data, event) {
          // console.log(data, event)
          if (event.keyCode === keyCode) {
            valueAccessor().call(this, data, event);
          }
        };

        // create a valueAccessor with the options that we would want to pass to the event binding
        newValueAccessor = function() {
          return {
            keyup: wrappedHandler
          };
        };

        // call the real event binding's init function
        ko.bindingHandlers.event.init(element, newValueAccessor, allBindingsAccessor, data, bindingContext);
      }
    };
  }

  // Custom bindings for keys.
  ko.bindingHandlers.rightArrowKey = keyhandlerBindingFactory(RIGHTARROW_KEY);
  ko.bindingHandlers.leftArrowKey = keyhandlerBindingFactory(LEFTARROW_KEY);
  ko.bindingHandlers.escapeKey = keyhandlerBindingFactory(ESCAPE_KEY);


  // Check for mobile browser.
  // jQuery.browser.mobile (http://detectmobilebrowser.com/)
  // jQuery.browser.mobile will be true if the browser is a mobile device
  (function(a){(jQuery.browser=jQuery.browser||{}).mobile=/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))})(navigator.userAgent||navigator.vendor||window.opera);

  // Find title in specified array and return the index.
  self.matchTitle = function(title, array) {
    return _.findIndex(array, function(o) { return o.title === title})
  };

  // Sort a list.
  self.sortList = function(list) {
    list.sort(function(left, right) {
      var sortByA = left.title;
      var sortByB = right.title;
      return sortByA == sortByB ? 0 : (sortByA < sortByB ? -1 : 1);
    });
  };


  // Pans the map, with some changes to x, y in certain cases.
  self.panMap = function(newLatLng, x, y) {
    window.setTimeout( function() {
      map.setCenter(newLatLng);
      map.panBy(x, y);
    }, 15);
  }.bind(this);

  // Checks the page orientation and adjusts the user interface, mainly setting
  // which flickr div opens (bottom or right), that the flickr div does not
  // overlap with the filter/header div, and re-pan the map to the marker.
  var pushFlickrImagesToObservable, pushFlickrImagesToDiv, orientation,
      availableWidth, availableHeight;
  self.flickrResults = ko.observable('');
  self.flickrResultsRight = ko.observable('');
  self.flickrResultsBottom = ko.observable('');
  self.checkOrientation = function() {
    var self = this;
    availableWidth = $(document).width();
    availableHeight = $(window).height();

    if (availableHeight > availableWidth) {
      orientation = 'tall';
    } else {
      orientation = 'wide';
    }

    // Check and save to a variable the current Flickr images.
    if (pushFlickrImagesToObservable) {
      var previousFlickrImages = pushFlickrImagesToObservable();
    }

    $( "#" + pushFlickrImagesToDiv ).fadeOut();

    // By default, show flickr images on right.
    pushFlickrImagesToDiv = 'flickr-container-right';
    pushFlickrImagesToObservable = self.flickrResultsRight;

    // Set container right to be mobile (75px) or desktop (150px) wide.
    if (jQuery.browser.mobile) {
      $("#flickr-container-right").addClass('flickr-container-right-mobile');
    } else {
      $("#flickr-container-right").addClass('flickr-container-right-desktop');
    }

    $("#flickr-container-right").css('display', 'inline').fadeOut();
    $("#flickr-container-bottom").css('display', 'none');

    // Only exception, mobile tall orientation.
    if (jQuery.browser.mobile && orientation === 'tall') {
      $("#flickr-container-right").css('display', 'none');
      $("#flickr-container-bottom").css('display', 'inline');
      pushFlickrImagesToDiv = 'flickr-container-bottom';
      pushFlickrImagesToObservable = self.flickrResultsBottom;
    }

    // If previousFlickrImages exist, open the new flickr div and add the
    // previous images to it.
    if(previousFlickrImages) {
      pushFlickrImagesToObservable(previousFlickrImages);
    }

    // Add padding to $flickrResultsRight to keep from overlapping
    // with #floating-panel.
    if (availableWidth < 768) {
      $( "#flickr-results-right" ).addClass('add-padding');
    } else {
      $( "#flickr-results-right" ).removeClass('add-padding');
    }

    // Set options and pan map after rotation.
    var panByX = 0, panByY = 0, newLatLng;
    var lat = self.currentMarkerLocation[0];
    var lng = self.currentMarkerLocation[1];
    // Center map on new marker and pan.
    if (lat && lng) {
      newLatLng = {lat: lat, lng: lng};
      panByY = -135;
    // No markers open, recenter map on default position.
    } else {
      newLatLng = defaultMapCenter;
    }

    self.panMap(newLatLng, panByX , panByY);

  }.bind(this);

  $( window ).resize(self.checkOrientation);

  // Toggle location list. Used by #collapse-locations.
  self.collapseLocationDiv = function() {
      $( "#collapse-locations" ).slideToggle();
      if (jQuery.browser.mobile) {
        $( "#more-info-right").removeClass('open');
      }
  }.bind(this);

  // Observable arrays for different item types.
  [
    'favoriteAndBeenhereLocationsList',
    'favoriteLocationsList',
    'beenhereLocationsList',
    'otherLocationsList',
  ].forEach( function(list) {
    self[list] = ko.observableArray();
  });

  // Set up the different lists from initialLocations.
  self.setupLocationLists = function() {
    self.favoriteAndBeenhereLocationsList.removeAll();
    self.favoriteLocationsList.removeAll();
    self.beenhereLocationsList.removeAll();
    self.otherLocationsList.removeAll();
    initialLocations.forEach( function(mapItem) {
      if (mapItem.favorite === true && mapItem.beenhere === true) {
        self.favoriteAndBeenhereLocationsList.push( new Location(mapItem) );
      }
      else if (mapItem.favorite === true) {
        self.favoriteLocationsList.push( new Location(mapItem) );
      }
      else if (mapItem.beenhere === true) {
        self.beenhereLocationsList.push( new Location(mapItem) );
      }
      else {
        self.otherLocationsList.push( new Location(mapItem) );
      }
    });
  };

  self.setupLocationLists();

  // Save and get sortable lists.
  self.getSortable = function(sortable) {
    // Set name of sortable.
    var sortableName = 'topSortableList';

    // Default items for the list.
    var sortableListDefaultItems  = {
      'topSortableList' :
        ['Favorite', 'Visited', 'Everything Else', 'Favorite and Visited']
    };

    // Object to look up list name and convert it to observable name.
    var convertNameToList = {
      'Favorite and Visited': 'favoriteAndBeenhereLocationsList',
      'Favorite': 'favoriteLocationsList',
      'Visited': 'beenhereLocationsList',
      'Everything Else': 'otherLocationsList'
    };

    var order = localStorage.getItem(sortableName);


    // If order is null, the list hasn't been saved to storage.
    // Set to the default list.
    if (order == null) {
      var orderAsArray = sortableListDefaultItems[sortableName];
      self[sortableName]( orderAsArray );
    }
    // Order has been set in storage. Get the order for the UI Observable.
    else {
      var orderAsArray = order.split(',');
      self[sortableName].removeAll();
      self[sortableName]( orderAsArray );
    }

    // Always update the observable
    self.sortOrderOfLocationsObservable.removeAll();
    orderAsArray.forEach( function(list) {
      self.sortOrderOfLocationsObservable.push(convertNameToList[list]);
    });
  };

  self.saveSortable = function(sortable) {
    var sortableName = sortable.sourceParentNode.id;
    var sortOrder = self[sortableName]();
    localStorage.setItem(sortableName, sortOrder);
    // To update the observable.
    self.getSortable();
  };

  // Update this observable when the list is sorted.
  self.sortOrderOfLocationsObservable = ko.observableArray('');

  // This is what make the list in the UI.
  self.topSortableList = ko.observableArray();
  // Create topSortableList from storage or use defaults if storage is empty.
  self.getSortable();


  // Toggle property (currently favorite or beenhere) on a Location.
  Location.prototype.toggleProperty = function(mapItem, event, property) {
    var self = this;

    // For clearAllFavorites, there is no event.target.innerText
    if (event) {
      var innerText = event.target.innerText.trim();

      // Which property to toggle.
      if (innerText === 'bookmark_border' || innerText === 'bookmark') {
        var propertyToUpdate = 'favorite';
      }
      if (innerText === 'beenhere') {
        var propertyToUpdate = 'beenhere';
      }
    }

    // For clearAllFavorites.
    if (property) {
      var propertyToUpdate = property;
    }

    // Used by whichList to lookup what LocationsList the item is is.
    var itemToListLookup = {
      'truetrue' : 'favoriteAndBeenhereLocationsList',
      'truefalse' : 'favoriteLocationsList',
      'falsetrue' : 'beenhereLocationsList',
      'falsefalse' : 'otherLocationsList',
    };

    // Check what list the item currently belongs to based on favorite/beenhere.
    var whichList = function() {
      return itemToListLookup[
        Boolean(mapItem.favorite()) + "" + Boolean(mapItem.beenhere())
      ];
    };

    // Remove item from the list it is in.
    self[whichList()].remove(mapItem);

    // Find item in initialLocations, because initialLocations is what
    // is saved to local storage.
    var initialLocationsMapItemToUpdate = initialLocations.find(
      function(tempMapItem) {
        return tempMapItem.title === mapItem.title;
    });

    // Toggle property to false.
    if (Boolean(mapItem[propertyToUpdate]()) === true) {
      // Update the object so dynamicLocationList (the user interface)
      // gets updated.
      mapItem[propertyToUpdate](false);
      // Update initialLocations because it get saved to local storage.
      initialLocationsMapItemToUpdate[propertyToUpdate] = false;
    }
    // Toggle property to true.
    else if (Boolean(mapItem[propertyToUpdate]()) === false) {
      // Update the object so dynamicLocationList (the user interface)
      // gets updated.
      mapItem[propertyToUpdate](true);
      // Update initialLocations because it get saved to local storage.
      initialLocationsMapItemToUpdate[propertyToUpdate] = true;
    }

    // Add item to the list it now belongs to.
    self[whichList()].push(mapItem);

    self.saveToStorage();
  }.bind(this);

  // Delete a location.
  Location.prototype.deleteLocation = function(mapItem) {
    alertify.confirm("Delete location: " + mapItem.title + "?",
      // Delete
      function() {
        [
          'favoriteAndBeenhereLocationsList',
          'favoriteLocationsList',
          'beenhereLocationsList',
          'otherLocationsList',
        ].forEach(function(list){
          // Check for item in the array.
          var mapItemLocationInArray = self[list]().indexOf(mapItem);
          if (mapItemLocationInArray !== -1) {
            self[list].remove(mapItem);
            self.saveToStorage();
          }
        });
        alertify.notify('Location <b>' + mapItem.title + '</b> deleted.');
      },
      // Don't delete
      function() {
        alertify.notify('Location <b>' + mapItem.title + '</b> not deleted.');
      });
  }

  // Clear all favorites.
  self.clearAllFavorites = function() {
    var self = this;
    alertify.confirm("Clear all favorites?", function() {
      // Loop through all locations, pass favorites to toggleFavorite.
      self.dynamicLocationsList().forEach( function(mapItem) {
        if (mapItem.favorite() === true) {
          Location.prototype.toggleProperty(mapItem, '', 'favorite');
        }
      });
    });
  }.bind(this);

  // Make an array of all titles from initialLocations for autocomplete to work.
  var allTitlesForAutoComplete = [];
  initialLocations.forEach( function(Location) {
    allTitlesForAutoComplete.push(Location.title);
  });
  var inputMapLocation = document.getElementById("main-search-input");
  var awesomplete = new Awesomplete(inputMapLocation, {
    list: allTitlesForAutoComplete
  });

  inputMapLocation.addEventListener("awesomplete-selectcomplete",
    function(item) { self.openInfoWindow(item.target.value); }.bind(this)
  );

  // Run a check to close awesomplete if no text input for three seconds.
  self.lastKeyupTimeWas = ko.observable('');
  self.setTimeForLastKeyup = function() {
    var d = new Date();
    self.lastKeyupTimeWas(d.getTime())
  }

  var checkToCloseAwesompleteDropdown = setInterval(function() {
    var now = new Date();
    var timeDifference = now.getTime() - self.lastKeyupTimeWas();
    if (timeDifference > 3000) {
      awesomplete.close()
    }
  }, 1000)

  // http://knockoutjs.com/examples/animatedTransitions.html
  // Here's a custom Knockout binding that makes elements shown/hidden via
  // jQuery's fadeIn()/fadeOut() methods.
  ko.bindingHandlers.fadeVisible = {
    init: function(element, valueAccessor) {
        // Initially set the element to be instantly visible/hidden
        // depending on the value.
        var value = valueAccessor();
        // Use "unwrapObservable" so we can handle values that may or may
        // not be observable.
        $(element).toggle(ko.unwrap(value));

    },
    update: function(element, valueAccessor) {
        // Whenever the value subsequently changes, slowly fade the element
        // in or out.
        var value = valueAccessor();
        ko.unwrap(value) ? $(element).fadeIn() : $(element).fadeOut();
    }
  };

  // Runs when esc key is pressed.
  self.escapeKeyBinding = function() {
    self.addNewLocation('cancel');
    $("#main-search-input").focus();
    self.mapSearchInputText('')
  };

  // Set up click, right click, edit mode options / handling.

  // Default click action: close infoWindow, close addNewLocation menu, and
  // optionally stop other POI windows from opening.
  var defaultClickAction = function() {
    google.maps.event.addDomListener(map, 'click', function(event) {
      // Close an infoWindow by clicking on an empty area on the map.
      self.closeInfoWindow();
      self.addNewLocation('cancel');

      // Setting: prevent other locations (non-markers) from opening info
      // windows.
      // https://developers.google.com/maps/documentation/javascript/examples/event-poi
      if (event.placeId && self.settingDisablePOIClickEvent()) {
        event.stop();
      }
    });
  };

  var clickToOpenAddNewLocationMenu = function(bindRightClickTo){
    google.maps.event.addDomListener(map, bindRightClickTo,
      function(e) { self.openAddNewLocationMenu(e); }.bind(this)
    );
  }

  var removeClickToOpenAddNewLocationMenu = function(bindRightClickTo) {
    google.maps.event.clearListeners(map, bindRightClickTo);
  }

  // Default click for mobile and desktop.
  defaultClickAction();

  // Check state of edit mode (right click)  on desktop.
  if (!jQuery.browser.mobile && self.settingEnableEditMode()) {
      clickToOpenAddNewLocationMenu('rightclick');
  }

  // Check state of edit mode on mobile (override default click.)
  if (jQuery.browser.mobile && self.settingEnableEditMode()) {
      clickToOpenAddNewLocationMenu('click');
  }

  // Watch for changes for edit mode.
  self.settingEnableEditMode.subscribe(function(){
    // Enable on mobile
    if (jQuery.browser.mobile && self.settingEnableEditMode()){
      clickToOpenAddNewLocationMenu('click');
    }
    // Disable on mobile.
    if (jQuery.browser.mobile && !self.settingEnableEditMode()){
      google.maps.event.clearListeners(map, 'click');
      defaultClickAction();
    }
    // Enable on desktop.
    if (!jQuery.browser.mobile && self.settingEnableEditMode()){
      clickToOpenAddNewLocationMenu('rightclick');
    }
    // Disable on desktop.
    if (!jQuery.browser.mobile && !self.settingEnableEditMode()){
      google.maps.event.clearListeners(map, 'rightclick');
    }
  });

  // Show help / more info
  self.helpMoreInfo = function() {
    var helpText = $("#helpMoreInfoText").html();
    alertify.alert(helpText).set('label', 'Got it!');
  }

  // Main functions: loadMapMarkers, updateMarkerIcons, addListenerToMarker,
  // addRemoveLocationsAndMapMarkers, closeInfoWindow, openInfoWindow,
  // cycleThroughLocations, openAddNewLocationMenu, addNewLocation.

  // Keep track of markers.
  var markersArray = [];
  // Set up custom map location icons.
  var iconToImage = {
    'Hotel': 'ic_hotel_black_24dp_1x',
    'Bar': 'ic_local_bar_black_24dp_1x',
    'Attraction': 'ic_local_see_black_24dp_1x',
    'Car Rental': 'ic_directions_car_black_24dp_1x',
    'Default': 'ic_place_black_24dp_1x'
  };
  // Loop through the initialLocations object and place a marker for each
  // set of coordinates.
  self.loadMapMarkers = function() {
    for (var i = 0; i < initialLocations.length; i++) {
      var location = initialLocations[i];
      var coords = location.coordinates;
      var title = location.title;
      var type = location.type;

      var latLng = new google.maps.LatLng(coords[0],coords[1]);

      if (self.settingDisplayCustomMapMarkers() === true) {
        var imageIcon = 'images/mapicons/' + iconToImage[type] + '.png';
      }
      if (self.settingDisplayCustomMapMarkers() === false) {
       var imageIcon = 'images/mapicons/' + iconToImage['Default'] + '.png';
      }

      var marker = new google.maps.Marker({
        title: title,
        position: latLng,
        map: map,
        icon: imageIcon
      });

      markersArray.push(marker);
    } // close for loop
  };

  self.updateMarkerIcons = function() {
    for (var i = 0; i < initialLocations.length; i++) {
      var location = initialLocations[i];
      var type = location.type;

      if (self.settingDisplayCustomMapMarkers() === true) {
        var imageIcon = 'images/mapicons/' + iconToImage[type] + '.png';
      }
      if (self.settingDisplayCustomMapMarkers() === false) {
       var imageIcon = 'images/mapicons/' + iconToImage['Default'] + '.png';
      }

      markersArray[i].setOptions({ icon: imageIcon});
    }
  };

  self.mapSearchInputText = ko.observable("");

  // For the user interface, a list that can be filtered when text is typed.
  self.filteredLocationsList = ko.observableArray();

  // Return all the lists in the order specified in the UI.
  self.groupLocations = ko.computed( function() {
    // Don't concat the arrays until all four arrays are created.
    if (self.sortOrderOfLocationsObservable().length === 4) {
      var selfSOOLO = self.sortOrderOfLocationsObservable();
      // TODO: There has to be a better way to do this...
      return self[selfSOOLO[0]]().concat(
          self[selfSOOLO[1]](),
            self[selfSOOLO[2]](),
              self[selfSOOLO[3]]()
      );
    } else {
      return null;
    }
  }).extend({ rateLimit: 150 });

  // Return a filtered list if text has been entered into the textbox or a
  // list of locations grouped according to the order in the UI.
  self.dynamicLocationsList = ko.computed( function() {
    if (self.mapSearchInputText()) {
      return self.filteredLocationsList();
    } else {
      return self.groupLocations();
    }
  }, self).extend({ rateLimit: 200 });

  // Add listener to all markers, or to a single new marker that is added by
  // the user.
  self.addListenerToMarker = function(x, marker) {
    // If marker doesn't exist, run the function on markersArray.
    marker = marker || markersArray;
    markersArray.forEach( function(marker, position ) {
      var title = markersArray[position].title;
      marker.addListener('click', function() {
        self.openInfoWindow(title, 'map');
      });
    });
  };

  self.addRemoveLocationsAndMapMarkers = function(inputText, updateMarkers) {
    var self = this;

    // Remove items from filteredLocationsList.
    self.filteredLocationsList.removeAll();

    // If input text, add items that match the text orfavorites if always show
    // favorites = true.
    if (inputText) {
      initialLocations.forEach(function(mapItem){
        if(mapItem.title.toLowerCase().includes(inputText.toLowerCase()) ||
          self.settingAlwaysShowFavorites() == true &&
            mapItem.favorite === true)
        {
            self.filteredLocationsList().push( new Location(mapItem) );
        }
      });
    }

    // Sort list alphabetically.
    self.sortList(self.filteredLocationsList);

    // Add/remove markers from the map.
    // First check if markersArray has been created.
    if (typeof markersArray !== 'undefined') {
      // Make an array of self.dynamicLocationsList titles.
      var dynamicLocationsListTitles = [];
      self.dynamicLocationsList().forEach( function(Location) {
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
  }.bind(this);

  // http://stackoverflow.com/questions/12229751/knockout-js-triggers-based-on-changes-in-an-observable
  // Check mapSearchInputText for inputText and update makeMapList
  // (after 300 ms delay) based on inputText.
  self.mapSearchInputText.extend({ rateLimit: 300 });
  self.mapSearchInputText.subscribe(function(inputText) {
    self.addRemoveLocationsAndMapMarkers(inputText);
  }, this);

  // Keep track of open infoWindow(s). Used to close the previous infoWindow.
  var openInfoWindows = [];
  self.closeInfoWindow = function(callingFunction) {
    // Check if there's at least one openInfoWindows.
    if (openInfoWindows.length > 0) {
      openInfoWindows[openInfoWindows.length - 1].infoWindow.close();

      window.location.hash = '';
      $( "#" + pushFlickrImagesToDiv ).fadeOut();
    };
  }.bind(this);

  self.currentMarkerLocation = '';
  self.infowindow =  new google.maps.InfoWindow({disableAutoPan: true});
  self.openInfoWindow = function(title) {
    var self = this;
    // The 'list view' sends the title as an object.
    // In this case, the title is actually title.title.
    // The map marker sends the title as a string.
    if (typeof title === 'object' ) {
      title = title.title;
    }

    // Close any open infoWindows or addNewLocation menus.
    self.addNewLocation('cancel');
    self.closeInfoWindow('openInfoWindow');

    // This is which marker number to attach the info window to.
    // Gets the index of the marker in markersArray.
    // Ie, markersArray[itemindex] === marker that was clicked.
    var itemindex = self.matchTitle(title, initialLocations);

    // itemindex might not be found if random text is entered into the url hash.
    // Without this check, if random text is entered for the url hash,
    // the list of locations disappears and the app is unuseable.
    if (itemindex === undefined) {
      alertify.error('Location "' + title + '" Not Found!', 3);
      return;
    }

    window.location.hash = title.replace(/ /g, '%20');
    self.currentMarkerLocation = initialLocations[itemindex].coordinates;

    // Center map on new marker and adjust pan in a few situations.
    var lat = self.currentMarkerLocation[0];
    var lng = self.currentMarkerLocation[1];
    var newLatLng = {lat: lat, lng: lng};
    var panByX, panByY;

    // For mobile landscape, panByX to center infoWindow in the open space left
    // by the flickr div on the right.
    if (orientation === 'wide' && jQuery.browser.mobile) {
      panByX = 37;
    } else {
      panByX = 0;
    }
    // Keeps the top of the infoWindow from overlapping with the bottom of the
    // floating-panel-header, especially on iPhone 5 size screens.
    panByY = -135;

    self.panMap(newLatLng, panByX , panByY);

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
    self.infowindow.addListener('closeclick', self.closeInfoWindow);

    // Add title, infoWindow to the array that keeps track of which infoWindow
    // to close.
    openInfoWindows.push({'title': title, 'infoWindow': self.infowindow});

    // searchAPIsAndDisplayResults does two things:
    // 1. Search flickr for images and update pushFlickrImagesToDiv.
    // 2. Search yelp for business info and update yelpInfoWindowContent.
    self.searchAPIsAndDisplayResults(title);
    if (jQuery.browser.mobile || availableWidth < 992) {
      $("#collapse-locations").slideUp();
    }
  }.bind(this);


  // Opens next/previous location using keyboard shortcuts.
  this.cycleThroughLocations = function(data, event ) {
    var whichKey = event.originalEvent.key;

    // Check if any open infoWindows exist.
    if (!!openInfoWindows.length) {
      // Get title of open infoWindow.
      var title = openInfoWindows[openInfoWindows.length - 1].title;
    } else {
      // Otherwise get the title from the locations list.
      title = self.dynamicLocationsList()[0].title
    }

    // Find title in dynamicLocationsList and get the index.
    var index = self.matchTitle(title, self.dynamicLocationsList());
    // Subtract one from length since arrays are zero based.
    var indexLength = self.dynamicLocationsList().length - 1;

    if (whichKey === 'ArrowLeft') {
      // Loop around.
      if (index === 0) {
        nextIndex = indexLength;
      } else {
        var nextIndex = index - 1;
      }
    }

    if (whichKey === 'ArrowRight') {
      // Loop around.
      if (index === indexLength) {
        var nextIndex = 0;
      } else {
        var nextIndex = index + 1;
      }
    }

    // Open the next item in dynamicLocationsList.
    self.openInfoWindow(self.dynamicLocationsList()[nextIndex].title);
  }

  // Must be declared outside the function or the binding will fail when the
  // page is loaded.
  self.availableTypes = ko.observableArray();
  self.newLocationTitle = ko.observable();
  self.selectedType = ko.observable();
  self.newLocationLatLng = ko.observable();
  var openAddNewLocationMenuStatus = 'closed';
  // Opens a menu that lets the user add a custom location anywhere on the map
  // by right clicking.
  self.openAddNewLocationMenu = function(e) {
    var self = this;
    if (jQuery.browser.mobile) {
      $("#collapse-locations").slideUp();
    }


    // Before opening a new menu, check if any marker.notSubmitted = true.
    // This means the menu was opened, but not submitted or cancelled.
    // Without this check, right clicking all over the map would keep adding new
    // location markers without any information associated/saved with them.
    markersArray.forEach(function(marker) {
      if(marker.notSubmitted) { marker.setMap(null); }
    });

    self.closeInfoWindow();

    // Default to the traditional location icon.
    self.imageIconObservable = ko.observable(
      'images/mapicons/ic_place_black_24dp_1x.png'
    );
    self.newLocationLatLng(e.latLng);

    // Populate self.availableTypes
    initialLocations.forEach(function(location) {
      // If type doesn't exist in the availableTypes array, add it.
      if(self.availableTypes().indexOf(location.type) === -1) {
        self.availableTypes.push(location.type);
      }
    })
    // A custom location type that will not try to lookup info on Yelp.
    // Temporarily disabled.
    // self.availableTypes.push('Custom / Ignore Yelp');

    // Only show the 'location not added' notification when the menu was open
    // and is being closed. To do this, keep track of when the menu is open.
    openAddNewLocationMenuStatus = 'open';

    var positionInPixels = e.pixel;
    // Add some padding between the marker and menu.
    positionInPixels.y += 20;

    // Keep new location menu from opening off the page.
    // Left side
    if (positionInPixels.x < 150) {
      positionInPixels.x += 20;
    }
    // Right side
    if (positionInPixels.x + 300 > availableWidth) {
      positionInPixels.x = availableWidth - 350;
    }
    // Bottom
    if (positionInPixels.y + 150 > availableHeight) {
      positionInPixels.y -= 200;
    }

    // Fade in the menu under right click location.
    // https://stackoverflow.com/a/4666381
    $('#add-location-menu').css(
      {'top': positionInPixels.y, 'left': positionInPixels.x}
    ).fadeIn('slow');
    $("#new-location-input").focus();

    // Put the marker on the map.
    var marker = new google.maps.Marker({
      title: title,
      position: self.newLocationLatLng(),
      map: map,
      icon: self.imageIconObservable(),
      notSubmitted: true
    });

    markersArray.push(marker);

    // Update the map icon when a new option is selected.
    self.selectedType.subscribe(function(icon) {
      // Set the marker icon.
      if (self.settingDisplayCustomMapMarkers() === true) {
        self.imageIconObservable(
          'images/mapicons/' + iconToImage[self.selectedType()] + '.png'
        );
      }
      if (self.settingDisplayCustomMapMarkers() === false) {
        self.imageIconObservable(
        'images/mapicons/' + iconToImage['Default'] + '.png'
        );
      }

      var lastMarker = markersArray[markersArray.length - 1];
      lastMarker.icon = self.imageIconObservable();
      // Remove/readd the map marker to draw the new icon.
      lastMarker.setMap(null);
      lastMarker.setMap(map);
    });
  }

  self.addNewLocation = function(data) {
    var addLocationDiv = $('#add-location-menu');

    if (data === 'cancel') {
      var lastMarker = markersArray[markersArray.length - 1];
      if (lastMarker.notSubmitted === true) {
        // Remove marker from array.
        markersArray.pop();
        // Remove marker from the map.
        lastMarker.setMap(null);
      }
      // Remove menu from the map.
      addLocationDiv.fadeOut('slow');
      if (openAddNewLocationMenuStatus === 'open') {
        alertify.warning('Location Not Added', 3);
      }
      openAddNewLocationMenuStatus = 'closed';
    } else if(!self.newLocationTitle()) {
      alertify.warning('Please enter a name for the location.')
    } else {
      // Object to add to initialLocations
      var newLocationToAdd = {
        'title': self.newLocationTitle(),
        'coordinates': [
          self.newLocationLatLng().lat(), self.newLocationLatLng().lng()
        ],
        'type': self.selectedType()
      };
      initialLocations.push(newLocationToAdd);
      self.otherLocationsList.push(new Location(newLocationToAdd));

      // Get and update the marker that was just made.
      var lastMarker = markersArray[markersArray.length - 1];
      lastMarker.title = self.newLocationTitle();
      lastMarker.notSubmitted = false;
      self.addListenerToMarker(lastMarker);

      // Confirmation message and fade out the div after one second.
      alertify.success('Location Added!', 3);
      addLocationDiv.fadeOut('slow');
      openAddNewLocationMenuStatus = 'closed';

      // Clear observables.
      self.newLocationTitle('');
      self.selectedType('');
      self.newLocationLatLng('');

      self.saveToStorage();
    }
  }

  // API functions: searchFlickr, searchYelp, searchAPIsAndDisplayResults.

  /*
    Search Flickr via Flickr API for images.
    * Link to documentation for photos.search:
        https://www.flickr.com/services/api/flickr.photos.search.html
    * Flickr photo source urls, or, working with results of photo.search:
        https://www.flickr.com/services/api/misc.urls.html
  */
  self.flickrSearchURL = ko.observable();
  self.searchFlickr = function(query) {
    // Set to '' otherwise later, += will cause undefined to be added to the
    // string.
    var flickrResultsString = '';
    var self = this;

    // Clear previous image results.
    pushFlickrImagesToObservable('');
    // Set the return format (json) and api_key for all API requests.
    var flickrAPIbase = "https://api.flickr.com/services/rest/?format=json&api_key=f4dbf30dea5b300071f0d6c721b8a3b5&sort=relevance";
    // Replace spaces in title with %20, and append %20Boston for better results.
    var flickrAPISearchQuery = query.replace(/ /g, "%20") + "%20Boston";
    var flickrAPIsearch = "&method=flickr.photos.search&text=" +
      flickrAPISearchQuery;
    var fullFlickrAPIsearch = flickrAPIbase + flickrAPIsearch;

    var request = $.ajax(fullFlickrAPIsearch);
    request.fail(function(){
      if (self.settingDisplayErrorMessage()) {
        alertify.error('There was an error connecting to Flickr.', 6);
      }
    });
    request.done(function(data){
      var newData = JSON.parse(data.replace("jsonFlickrApi(", "").slice(0, -1));
      var numberOfPhotoResults = newData.photos.photo.length;

      if (jQuery.browser.mobile) {
        // Size suffix info: https://www.flickr.com/services/api/misc.urls.html
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

      if (newData.photos.total === '0') {
        var showPhotosDiv = false;
        alertify.error('No photos found on Flickr.', 6);
      } else {
        showPhotosDiv = true;
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
              server_id + '/' + id + '_' + secret + '_' +
              flickrImageSizeSuffix + '.jpg" ' +
              'class="flickr-thumb" ' +
          '</a>';
          flickrResultsString += (flickrThumbnailWithLink);
        }
      }

      // After all the images from Flickr are loaded, add a link to go to
      // Flickr to see more images.
      flickrResultsString += '' +
        '<div class="flickr-more-images">' +
        '<a href="https://www.flickr.com/search/?text=' +
        flickrAPISearchQuery + '" target="_new">' +
        '<span class="glyphicon glyphicon-new-window" aria-hidden="true">' +
        '</span>' +
        '</a>' +
        '</div>';

      self.flickrSearchURL('https://www.flickr.com/search/?text=' +
        flickrAPISearchQuery);



      // Show the area that will display flickr images.
      if (showPhotosDiv) {
        // add images to the observable.
        pushFlickrImagesToObservable(flickrResultsString);

        var imagesLoaded = 0;
        // https://stackoverflow.com/a/20614371
        $(".flickr-thumb").on('load', function(image, item) {
          imagesLoaded++;
          if (imagesLoaded === numberOfPhotosToShow) {
            // fade in after all images have loaded...
            $( "#" + pushFlickrImagesToDiv ).fadeIn();
          }
        })
      }
    });
  }.bind(this); // End of searchFlickr().

  /**
   * Generates a random number and returns it as a string for OAuthentication
   * @return {string}
   */
  function nonce_generate() {
    return (Math.floor(Math.random() * 1e12).toString());
  }

  /*
    Search yelp via yelp api
    https://discussions.udacity.com/t/how-to-make-ajax-request-to-yelp-api/13699/24
    https://discussions.udacity.com/t/yelp-api-not-working/163965/4
  */
  self.yelpInfoWindowContent = ko.observable();
  self.searchYelp = function(query) {
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

      var encodedSignature = oauthSignature.generate('GET',
        yelp_url,
        parameters,
        configBase.YELP_KEY_SECRET,
        configBase.YELP_TOKEN_SECRET
      );
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

      // Used when the ajax call fails or when all the necessary info isn't
      // available from Yelp.
      function failedYelpQuery(errorMessage) {
        if (self.settingDisplayErrorMessage()) {
          alertify.error(errorMessage, 6);
        }
        self.infowindow.setContent(
          '<div class="infowindow-title">' + query + '</div>' +
          '<div><br><em>Information from Yelp not available.</em></div>'
        );
      }

      yelpQuery.done(function(results) {
        var businessInfo = results.businesses[0];
        var businessIsClosedText = '';
        if (businessInfo) {

          if (businessInfo.is_closed === true) {
            businessIsClosedText = '' +
              '<strong>Yelp reports this business is closed.</strong><br>';
          }

          self.infowindow.setContent(
            '<div class="infowindow-title">' +
              '<a href="' + businessInfo.url + '">' +
                businessInfo.name +
              '</a>' +

              '<a href="' + businessInfo.url + ' " target="_new">' +
                '<span class="glyphicon glyphicon-new-window" ' +
                'aria-hidden="true"></span>' +
              '</a>' +
            '</div>' +

            businessIsClosedText +
            businessInfo.categories[0][0] + '<br>' +

            '<span class="glyphicon glyphicon-earphone" ' +
            'aria-hidden="true"></span>' +
            businessInfo.display_phone +
            '<br><img src="' + businessInfo.rating_img_url +'">' +
            '<br>Rating based on ' + businessInfo.review_count + ' reviews.');
        } else {
          // businessInfo was undefined.
          failedYelpQuery('No information found on Yelp about this business.');
        }
      }),
      yelpQuery.fail(function(){
        failedYelpQuery('There was an error connecting to Yelp.');
      });
    })
  }.bind(this);

  // Search Flickr, Yelp, and display results in the user interface.
  self.searchAPIsAndDisplayResults = function(title) {
    self.searchFlickr(title);
    self.searchYelp(title);
  }.bind(this);

  // urlHash, init
  var urlHash = window.location.hash;
  if (urlHash) {
    var title = urlHash.replace(/%20/g, ' ').slice(1);
    // If openInfoWindow is run here without init, pushFlickrImagesToDiv
    // is not defined.
    self.init();
    initHasRun = true;
    self.openInfoWindow(title);
  }

  if (initHasRun !== true) {
    self.init();
  }

  // Misc UI observables
  self.displayOptionsStatus = ko.observable(false);
  self.displayOptions = function() {
    return self.displayOptionsStatus(!self.displayOptionsStatus());
  };

  self.disableClearAllFavoritesButton = ko.computed(function() {
    if (self.favoriteLocationsList().length > 0) { return false; }
    else {return true;}
  });
};
