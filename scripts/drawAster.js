var width = 600,
    height = 600,
    radius = Math.min(width, height) / 2,
    innerRadius = 0.3 * radius;

var radians = 0.0174532925,
    margin = 50,
    hourLabelRadius = radius - 40,
    hourLabelYOffset = 7;

var hourScale = d3.scale.linear()
  .range([0,165])
  .domain([0,11]);


var pie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return 10; });

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([0, 0])
  .html(function(d) {
    return d.data.name + ": <span style='color:orangered'>" + d.data.commits + "</span>";
  });

var city;

var arc = d3.svg.arc()
  .innerRadius(innerRadius)
  .outerRadius(function (d) {
    return (radius - innerRadius) * (d.data.commits / 100.0) + innerRadius;
  });

var outlineArc = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(radius);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

svg.call(tip);

var totalData;
var data = [];

d3.json('dataTest.json', function(error, totalData) {
    console.log(totalData);
  totalData = totalData.amsterdam;
  data = compareData([totalData.Mon, totalData.Tue]);
  drawGraph();

  var face = svg.append('g')
      .attr('id','clock-face')
      .attr('transform','translate(0,0))');

  face.selectAll('.hour-label')
    .data(d3.range(0,24,1))
      .enter()
      .append('text')
      .attr('class', 'hour-label')
      .attr('text-anchor','middle')
      .attr('x',function(d){
        return hourLabelRadius * Math.sin(hourScale(d) * radians);
      })
      .attr('y',function(d){
        return -hourLabelRadius * Math.cos(hourScale(d) * radians) + hourLabelYOffset;
      })
      .text(function(d){
        return d;
      });
});


function filterData (langs) {
  for (var i = 0; i < 24; i++) {
    data.push({"name" : i, "commits" : 0})
  }

  for(var i = 0; i < langs.length; i++){
      for (var j = 0; j < 24; j++) {
        data.commits += totalData.Mon[langs[i]].hours[j].commits;
      };
  }

  return data;
}

function compareData (cities) {
  for (var i = 0; i < 24; i++) {
    for (var city in cities) {
      cities[city].JavaScript.hours[i].city = city
      data.push(cities[city].JavaScript.hours[i]);
    }
  }

  return data;
}

// Deprecated. Produces overlay graph brain aids.
function sortData () {
  for (var i = 0; i < 24; i++) {

    var temp = [];
    for (var index in data) {
      data[index].JavaScript.hours[i].z = index
      temp.push(data[index].JavaScript.hours[i]);
    };

    temp.sort(function (a,b) {
      if (a.commits < b.commits) {
        return 1;
      } else if (b.commits < a.commits) {
        return -1;
      }

      return 0;
    })

    for (var index in data) {
      data[index].JavaScript.hours[i] = temp[index]
    }
  }
}

var colour = ["red", "blue"]
var hours = [];
for (var i = 0; i < 24; i++) {
  hours.push(i)
};

function drawGraph() {

    var path = svg.selectAll(".solidArc")
          .data(pie(data))
        .enter();

      path.append("path")
        .attr("fill", function (d) { return colour[d.data.city]; })
        .attr("class", "solidArc")
        .attr("d", arc)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    var outerPath = svg.selectAll(".outlineArc")
          .data(pie(hours))
        .enter().append("path")
          .attr("fill", "none")
          .attr("stroke", "white")
          .attr("class", "outlineArc")
          .attr("stroke-width", 5)
          .attr("d", outlineArc);

    var outerOuterPath = svg.selectAll(".outlineOutlineArc")
          .data(pie(hours))
        .enter().append("path")
          .attr("fill", "none")
          .attr("stroke", "lightgray")
          .attr("class", "outlineArc")
          .attr("stroke-width", 1)
          .attr("d", outlineArc);

    svg.append("svg:text")
        .attr("class", "aster-score")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle") // text-align: right
        .text("FUCK");
}
