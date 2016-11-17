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
    this.mapLocationsList = ko.observableArray([]);
    mapLocations.forEach(function(mapItem){
        self.mapLocationsList.push( new Location(mapItem) );
    });
}



ko.applyBindings(new ViewModel());
