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

// Credits to : http://bl.ocks.org/micahstubbs/8e15870eb432a21f0bc4d3d527b2d14f
var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
              return "<span class='details'>" + d.name + "<br></span>";
            });

svg.call(tip);

// Defer our actual code until we have both the map and county data loaded
d3.queue()
  .defer(d3.json, 'world-110m.json')
  .defer(d3.csv, 'global_terrorism_data.csv')
  .defer(d3.tsv, 'world-country-names.tsv')
  .await(function(error, world, terrorism_data, country_names) {
    // Decode the topojson file
    var land = topojson.feature(world, world.objects.land);
    var countries = topojson.feature(world, world.objects.countries).features

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

    countries = countries.filter(function(d) {
      return country_names.some(function(n) {
        if (d.id == n.id) return d.name = n.name
      });
    });

// Credits to http://bl.ocks.org/khoomeister/230e1eff08ee8d6eaf35 on how to get the centroid and bottom values
    svg.selectAll('country')
      .data(countries)
      .enter()
      .append('path')
        .attr('class', 'country')
        .attr('d', path)
        .attr('data-name', (d) => {return d.name;})
        .attr('data-x-centroid', (d) => {return path.centroid(d)[0];})
        .attr('data-y-bottom', (d) => {return path.bounds(d)[1][1];})
        .on('mouseover', function(d) {
          tip.show(d)

          d3.select(this)
            .style("opacity", 1)
            .style("stroke","white")
            .style("stroke-width",3);
        }).on('mouseout', function(d) {
          tip.hide(d)

          d3.select(this)
            .style("stroke","white")
            .style("stroke-width",0.3);
        });

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
//    console.log(eventsByYear.top(Infinity));
});

// Credit for base implementation of slider to: https://bl.ocks.org/mbostock/6499018
var margin = {right: 50, left: 50}
var slider_width = svg_width - margin.left - margin.right

var x = d3.scaleLinear()
    .domain([1990, 2015])
    .range([0, slider_width])
    .clamp(true);

var slider = svg.append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + margin.left + "," + (svg_height - 50) + ")");

slider.append("line")
    .attr("class", "track")
    .attr("x1", x.range()[0])
    .attr("x2", x.range()[1])
  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-inset")
  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-overlay")
    .call(d3.drag()
        .on("start.interrupt", function() { slider.interrupt(); })
        .on("start drag", function() { hue(x.invert(d3.event.x)); }));

slider.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(0," + 18 + ")")
  .selectAll("text")
  .data(x.ticks(20))
  .enter().append("text")
    .attr("x", x)
    .attr("text-anchor", "middle")
    .text(function(d) { return d; });

var handle = slider.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 9);



function hue(h) {
  handle.attr("cx", x(h));
};
