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

ko.applyBindings(new ViewModel());
