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
var terrorism_event = d3.map();

// Defer our actual code until we have both the map and county data loaded
d3.queue()
  .defer(d3.json, 'world-110m.json')
  .defer(d3.csv, 'global_terrorism_data.csv', function(d) {
    // TODO: Extract relevant data from .csv file
    terrorism_event.set("country_name", d.country_txt);
    terrorism_event.set("event_year", d.iyear);
    terrorism_event.set("num_killed", d.nkill);
    terrorism_event.set("num_wounded", d.nwound);



  })
  .await(function(error, world) {
    // This code runs when both data files are loaded

    // Decode the topojson file
    var land = topojson.feature(world, world.objects.land);
    var countries = topojson.mesh(world, world.objects.countries);

    // Fit our projection so it fills the window
    projection.fitSize([svg_width, svg_height-80], land);

    // Create land area
    svg.append('path')
      .datum(land)
      .attr('class', 'land')
      .attr('d', path);

    // Create state boundaries
    svg.append('path')
      .datum(countries)
      .attr('class', 'state-boundary')
      .attr('d', path);
});
