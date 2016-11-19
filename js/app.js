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
    this.title = ko.observable(data.title);
    this.coord = ko.observable(data.coordinates);
    this.info = ko.observable(data.info);
}


var ViewModel = function() {
    var self = this;
    this.mapFilter = ko.observable("");
    this.dynamicLocationsList = ko.observableArray([]);

    function makeMapList(inputText) {
        initialLocations.forEach(function(mapItem){
            if (typeof inputText !== 'undefined') {
                // filter map based on input
                if (mapItem.title.toLowerCase().includes(inputText.toLowerCase())) {
                    self.dynamicLocationsList.push( new Location(mapItem) );
                }
            }
            else {
                // no letters input, return all items
                self.dynamicLocationsList.push( new Location(mapItem) );
            }
        });
    };

    makeMapList();

    // http://stackoverflow.com/questions/12229751/knockout-js-triggers-based-on-changes-in-an-observable
    // check mapFilter for inputText and update makeMapList with inputText
    this.mapFilter.subscribe(function (inputText) {
        self.dynamicLocationsList.removeAll()
        makeMapList(inputText);
    });
}

ko.bindingHandlers.addOpenInfoWindowToLink = {
    init: function(element, valueAccessor) {
        var value = ko.unwrap(valueAccessor());

        // match link text to the initialLocations.Title and return index
        function matchtitles(elementTitle) {
            for (var i = 0; i < initialLocations.length; i++) {
                if (elementTitle == initialLocations[i].title) {
                    return i;
                }
            }
        }

        $(element).click( function() {
            var infowindow = new google.maps.InfoWindow({});
            var itemindex = matchtitles(element.innerHTML);
            infowindow.setContent("<strong>" +
                initialLocations[itemindex].title + "</strong><br>");
            infowindow.open(map, markersArray[itemindex]);
        });
    }
}
ko.applyBindings(new ViewModel());
