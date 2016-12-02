var initialLocations = [
    {
        "title": "Orchard Lake (Sunset Photos)",
        "coordinates": [44.695938, -93.307176],
        "info": "One of the better places I've found to take sunset photos."
    },
    {
        "title": "Lebanon Hills Bike Trail (Mountain Biking)",
        "coordinates": [44.78, -93.1897],
        "info": "The beginner loop is enough for me..."
    },
    {
        "title": "Spring Lake Park (Bike Trailhead)",
        "coordinates": [44.768866, -92.928309],
        "info": "One of the few trails I've found that I enjoy."
    },
    {
        "title": "Buck Hill (Skiing)",
        "coordinates": [44.723454, -93.286449],
        "info": "I really should go here."
    },
    {
        "title": "Valley Lake Park (Quick Drone Flights)",
        "coordinates": [44.716920, -93.209812],
        "info": "Emergency launch site for taking sunset photos."
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

    // open InfoWindow for links in overlay
    self.openInfoWindow = function(data, event) {
        element = event.target;
        elementTitle = event.target.text;

        function matchtitles(elementTitle) {
            for (var i = 0; i < initialLocations.length; i++) {
                if (elementTitle == initialLocations[i].title) {
                    return i;
                }
            }
        }

        var infowindow =  new google.maps.InfoWindow({});
        var itemindex = matchtitles(element.innerHTML);
        infowindow.setContent("<strong>" +
            initialLocations[itemindex].title + "</strong><br>");
        infowindow.open(map, markersArray[itemindex]);
    }

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
  // replace spaces with %20, and append %20Minnesota for better results
  var flickrAPISearchQuery = query.split("(")[0].replace(/ /g, "%20") + "%20Minnesota";
  var flickrAPIsearch = "&method=flickr.photos.search&text=" + flickrAPISearchQuery;

  var fullFlickrAPIsearch = flickrAPIbase + flickrAPIsearch;

  var request = $.ajax(fullFlickrAPIsearch);
  request.fail(function(){
    infowindowContent.push("<span class='error text-center'>there was an error<br> connecting to flickr</span>");
    callback(infowindowContent);
  });
  request.done(function( data ){
    newData = JSON.parse(data.replace("jsonFlickrApi(", "").slice(0, -1));
    if (newData.photos.total === '0') {
      infowindowContent.push("<span class='error text-center'>no photos found on flickr</span>");
    }
    else {
      for (var i = 0; i < 5; i++) {
        var farm = newData.photos.photo[i].farm;
        var server_id = newData.photos.photo[i].server;
        var id = newData.photos.photo[i].id;
        var secret = newData.photos.photo[i].secret;

        var image = "<img src='https://farm" + farm + ".staticflickr.com/" + server_id + "/" + id + "_" + secret + "_s.jpg'>";
        infowindowContent.push(image);
      }
    infowindowContent.push("<a href='https://www.flickr.com/search/?text=" +
      flickrAPISearchQuery + "' target='_new' class='text-right'>Search for more photos on Flickr</a>");
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

ko.applyBindings(new ViewModel());
