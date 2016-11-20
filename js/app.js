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
        return infowindow;
    }

    // remove items from dynamicLocationsList based on text input
    function makeMapList(inputText) {
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
    };

    makeMapList();

    // http://stackoverflow.com/questions/12229751/knockout-js-triggers-based-on-changes-in-an-observable
    // check mapFilter for inputText and update makeMapList with inputText
    this.mapFilter.subscribe(function (inputText) {
        self.dynamicLocationsList.removeAll()
        makeMapList(inputText);
    });
}

ko.applyBindings(new ViewModel());
