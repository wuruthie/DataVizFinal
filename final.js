// Set up the SVG
var svg_width = window.innerWidth;
var svg_height = window.innerHeight;

// Generate an SVG element on the page
var svg = d3.select("body").append("svg")
    .attr("width", svg_width)
    .attr("height", svg_height);

// Initialize map projections
var projection = d3.geoEquirectangular();
var path = d3.geoPath().projection(projection);

// Keep track of terrorism observation
var events = [];
var terrorismEvents;
var eventsByYear;

// Range of years for event happenings
var minDate;
var maxDate;

// Defer our actual code until we have both the map and county data loaded
d3.queue()
  .defer(d3.json, 'world-110m.json')
  .defer(d3.csv, 'global_terrorism_data.csv')
  .await(function(error, world, terrorism_data) {
    // Decode the topojson file
    var land = topojson.feature(world, world.objects.land);

    // Fit our projection so it fills the window
    projection.fitSize([svg_width, svg_height - 80], land);

    // Create land area
    svg.append('path')
      .datum(land)
      .attr('class', 'land')
      .attr('d', path);

    // Create state boundaries
    svg.append('path')
      .datum(topojson.mesh(world, world.objects.countries))
      .attr('class', 'state-boundary')
      .attr('d', path);

    // Retrieve relevant fields that measure a unit of observation for an event
    for (var data of terrorism_data) {
      events.push({
        country_name : data.country_txt,
        latitude: data.latitude,
        longitude: data.longitude,
        year: parseInt(data.iyear),
        num_killed: parseInt(data.nkill),
        num_wounded: parseInt(data.nwound)
      });
    }

    // Retrieve recorded start and end dates
    minDate = d3.min(events, function(events) {return events.year;});
    maxDate = d3.max(events, function(events) {return events.year;});

    terrorismEvents = crossfilter(events);
    eventsByYear = terrorismEvents.dimension(function (d) {
      return d.year;
    });
    eventsByYear.filter([1990, 1991]); // Using some dummy years. Change the min and max date per the slider direction. If forward, add one; if backwards, subtract one

    // Prints out all the events that happened between 1990 and 1991
    console.log(eventsByYear.top(Infinity));
});
