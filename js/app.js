var initialLocations = [
    {
        "title": "New England Aquarium",
        "coordinates": [42.359151,-71.049576]
    },
    {
        "title": "Frost Ice Loft",
        "coordinates": [42.360325,-71.053310]
    },
    {
        "title": "Central Wharf Company",
        "coordinates": [42.358668, -71.052720]
    },
    {
        "title": "Alamo Rent a Car",
        "coordinates": [42.358328, -71.051116]
    },
    {
        "title": "Boston Harbor Hotel",
        "coordinates": [42.356551, -71.050188]
    }
];

var Location = function(data) {
    this.title = data.title;
    this.coord = data.coordinates;
    this.info = data.info;
}


var ViewModel = function() {
    var self = this;
    this.mapFilter = ko.observable("");
    this.dynamicLocationsList = ko.observableArray([]);


    function addRemoveLocations(inputText) {
        // remove items from dynamicLocationsList
        self.dynamicLocationsList.removeAll();

        // loop through initialLocations (all locations) and push them
        // back to dynamicLocationsList if they equal the input text
        initialLocations.forEach(function(mapItem){
            if (typeof inputText !== 'undefined' && inputText !== '') {
                if (mapItem.title.toLowerCase().includes(inputText.toLowerCase())) {
                    self.dynamicLocationsList.push( new Location(mapItem) );
                }
            }
            if (typeof inputText === 'undefined' || inputText === '') {
                // no letters input, return all items
                self.dynamicLocationsList.push( new Location(mapItem) );
            }
        });

        // add/remove markers from the map.
        // first check if markersArray has been created
        if (typeof markersArray !== 'undefined') {
            // make an array of self.dynamicLocationsList TITLES
            var dllTitles = [];
            for (var i = 0; i < self.dynamicLocationsList().length; i++) {
                dllTitles.push(self.dynamicLocationsList()[i].title);
            }

            // loop through markers array (array length shouldn't change)
            // and check if the marker title is in the dLLtitles array
            for (var i = 0; i < markersArray.length; i++) {
                var title = markersArray[i].title;
                var result = dllTitles.indexOf(title)
                if (result === -1) {
                    markersArray[i].setMap(null);
                }
                else {
                    markersArray[i].setMap(map);
                }
            }
        }
    };

    addRemoveLocations();

    // http://stackoverflow.com/questions/12229751/knockout-js-triggers-based-on-changes-in-an-observable
    // check mapFilter for inputText and update makeMapList with inputText
    this.mapFilter.subscribe(function (inputText) {
        addRemoveLocations(inputText);
    });
}

// keep track of open infoWindows to close the previous one
var openIW = [];
function closeIW(clickLocation) {
    // check if there's at least one openIW defined. if there is, close the last one.
    if (openIW[0] !== undefined) {
        openIW[openIW.length-1].close();
    }
    if (clickLocation !== 'map') {
        $("#collapse-locations").slideDown();
    }
}

function openInfoWindow (title, clickLocation) {
    console.log(clickLocation);
    // the 'list view' sends the title as an object.
    // in this case, the title is actually title.title
    // the map marker sends the title as a string
    if (typeof title === 'object' ) {
        title = title.title;
    }

    closeIW(clickLocation);

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

    // bounce the marker for 2800 ms
    markersArray[itemindex].setAnimation(google.maps.Animation.BOUNCE);
    window.setTimeout(function() {
      markersArray[itemindex].setAnimation(null);
    }, 2800);

    // make the id of the div the same as the title, but with underscores instead of spaces
    divID = title.replace(/ /g, "_");
    infowindow.setContent("<strong>" +
        title + "</strong><br>" +
        "<div id='" + divID + "' class='flickr'></div><br>");
    infowindow.open(map, markersArray[itemindex]);
    infowindow.addListener('closeclick', function() {
        updateCollapseLocationsIcon();
        $("#collapse-locations").slideDown();
    });
    // add the infoWindow to the array that keeps track of which IWs to close
    openIW.push(infowindow);
    // search flickr for images that are named 'title' and update the infoWindow id
    updateDiv(divID, title);
    updateCollapseLocationsIcon();
    $("#collapse-locations").slideUp();
}

/* search flickr via flickr api for images for InfoWindow
   photos.search docs:
      https://www.flickr.com/services/api/flickr.photos.search.html
   flickr photo source urls, or, working with results of photo.search :
      https://www.flickr.com/services/api/misc.urls.html
*/
function searchFlickr(query, callback) {
  console.log('searching flickr for ' + query)
  // set the return format (json) and api_key for all api requests
  var flickrAPIbase = "https://api.flickr.com/services/rest/?format=json&api_key=f4dbf30dea5b300071f0d6c721b8a3b5";
  infowindowContent = [];
  // take the first part of the title (before first parenthesis),
  // replace spaces with %20, and append %20Boston for better results
  var flickrAPISearchQuery = query.replace(/ /g, "%20") + "%20Boston";
  console.log(flickrAPISearchQuery);
  var flickrAPIsearch = "&method=flickr.photos.search&text=" + flickrAPISearchQuery;

  var fullFlickrAPIsearch = flickrAPIbase + flickrAPIsearch;

  var request = $.ajax(fullFlickrAPIsearch);
  request.fail(function(){
    infowindowContent.push("<span class='error text-center'>there was an error<br> connecting to flickr</span>");
    callback(infowindowContent);
  });
  request.done(function( data ){
    newData = JSON.parse(data.replace("jsonFlickrApi(", "").slice(0, -1));
    if (newData.photos.total < 5) {
      infowindowContent.push("<span class='error text-center'>no photos found on flickr</span>");
    }
    else {
      for (var i = 0; i < 4; i++) {
        var farm = newData.photos.photo[i].farm;
        var server_id = newData.photos.photo[i].server;
        var id = newData.photos.photo[i].id;
        var secret = newData.photos.photo[i].secret;

        // photo source url info, including size
        // https://www.flickr.com/services/api/misc.urls.html
        var image = "<img src='https://farm" + farm + ".staticflickr.com/" + server_id + "/" + id + "_" + secret + "_s.jpg'>";
        infowindowContent.push(image);
      }
    infowindowContent.push("<br><a href='https://www.flickr.com/search/?text=" +
      flickrAPISearchQuery + "' target='_new'>Search for more photos on Flickr</a>");
    }

    callback(infowindowContent);
  });
} // end of searchFlickr()

// update InfoWindow after opening it
function updateDiv(divID, title) {
  searchFlickr(title, function(result) {
    $( "#" + divID ).append( result );
  });
}

function updateCollapseLocationsIcon() {
  window.setTimeout(function() {
    var clDisplay = $( "#collapse-locations" ).css('display');
    if (clDisplay === 'block') {
      $( '#toggle-button').removeClass('glyphicon-expand')
      $( '#toggle-button').addClass('glyphicon-collapse-up')
    }
    if (clDisplay === 'none') {
      $( '#toggle-button').removeClass('glyphicon-collapse-up')
      $( '#toggle-button').addClass('glyphicon-expand')
    }
  }, 450);
}

// toggle location list. this is needed for the button near the div
$( "#toggle-location-list" ).click(function() {
  updateCollapseLocationsIcon();
  $( "#collapse-locations" ).slideToggle();
});
