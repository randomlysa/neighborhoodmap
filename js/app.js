var mapLocations = [
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
    mapFilter = ko.observable("");
    this.mapLocationsList = ko.observableArray([]);

    function makeMapList(inputText) {
        mapLocations.forEach(function(mapItem){
            if (typeof inputText !== 'undefined') {
                // filter map based on input
                if (mapItem.title.includes(inputText)) {
                    self.mapLocationsList.push( new Location(mapItem) );
                }
            }
            else {
                // no letters input, return all items
                self.mapLocationsList.push( new Location(mapItem) );
            }
        });
    };

    makeMapList();

    // http://stackoverflow.com/questions/12229751/knockout-js-triggers-based-on-changes-in-an-observable
    // check mapFilter for inputText and update makeMapList with inputText
    mapFilter.subscribe(function (inputText) {
        self.mapLocationsList.removeAll()
        makeMapList(inputText);
    });
}

ko.applyBindings(new ViewModel());
