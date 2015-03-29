function AsterPlot (container) {
  if (container == null) {
    container = "body"
  }

  this.width = 600;
  this.height = 600;
  this.radius = Math.min(this.width, this.height) / 2;
  this.innerRadius = 0.3 * this.radius;

  // Shit for the hour labels.
  this.radians = 0.0174532925;
  this.margin = 50;
  this.hourLabelRadius = this.radius - 10;
  this.hourLabelYOffset = 10;

  this.hourScale = d3.scale.linear()
    .range([0,165])
    .domain([0,11]);

  // d3 piechart object.
  this.pie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return 1; });

  this.clockPie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return 10; });

  // Tooltips are awesome.
  this.tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([0, 0])
    .html(function (d) {
      return d.data.name + ": <span style='color:green'>" + d.data.days[self.selectedDay] + "</span>";
    });

  // d3 arc objects.
  this.arc = d3.svg.arc()
    .innerRadius(this.innerRadius)
    .outerRadius(function(d) {
      if (!this.relative) {
        return (((self.radius - self.innerRadius) / self.largest) * d.data.days[self.selectedDay]) + self.innerRadius;
      } else {
        return (((self.radius - self.innerRadius) / self.relLargest[d.data.maxIndex]) * d.data.days[self.selectedDay]) + self.innerRadius;
      }
    });

  this.outlineArc = d3.svg.arc()
    .innerRadius(this.innerRadius)
    .outerRadius(this.radius);

  // The svg where the magic happens.
  this.svg = d3.select(container).append("svg")
    .attr("width", this.width)
    .attr("height", this.height)
    .append("g")
    .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")");

  this.svg.call(this.tip);

  // Empty array to limit chart to 24 areas.
  this.hours = [];
  for (var i = 0; i < 24; i++) {
    this.hours.push(i);
  };

  this.week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Reads json data from file and stores it.
  var self = this
  this.rawData;

  d3.json('dataTest.json', function(error, temp) {
    self.rawData = temp
    console.log("Joepie")
  })

  this.selectedData = [];
  this.selectedDay = 0;

  this.largest = 0;
  this.relLargest = [];

  this.relative = false;
}

/* * * * *
 * Selects relative or absolute view.
 */
AsterPlot.prototype.toggleView = function(view) {
  if (view == "relative") {
    this.relative = true;
  } else if (view == "absolute") {
    this.relative = false;
  }

  this.change();
}

/* * * * *
 * Selects day that should be displayed based on a string passed and redraws.
 */
AsterPlot.prototype.selectDay = function(day) {
  this.selectedDay = this.week.indexOf(day);
  this.changeDay();
}

/* * * * *
 * Updates the graph with the newly selected day.
 */
AsterPlot.prototype.changeDay = function() {
  var self = this;

  var path = this.svg.selectAll(".solidArc")
      .data(this.pie(this.selectedData));
  path.transition().duration(750).attrTween("d", function (a) {

    var i = d3.interpolate(this._current, a);
    this._current = i(0);
    return function(t) {
      return self.arc(i(t));
    };
  });

  // Centre text
  this.svg.selectAll(".aster-score")
      .text(this.week[this.selectedDay]);
}

/* * * * *
 * Updates the graph with the newly selected data.
 */
AsterPlot.prototype.change = function () {
  var self = this;

  var path = this.svg.selectAll(".solidArc")
    .data(this.pie([]));

  path.exit().remove();

  var path = this.svg.selectAll(".solidArc")
    .data(this.pie(this.selectedData));

  path.enter().append("path")
    .attr("fill", function (d) { return d.data.colour; })
    .attr("class", "solidArc")
    .attr("d", this.arc)
    .each(function(d) { this._current = {
        data : d.data,
        value : d.value,
        startAngle : d.startAngle,
        endAngle : d.endAngle
      };
    })
    .on('mouseover', this.tip.show)
    .on('mouseout', this.tip.hide);

  path.transition().duration(750).attrTween("d", function (a) {

    var i = d3.interpolate(this._current, a);
    this._current = i(0);
    return function(t) {
      return self.arc(i(t));
    };
  });

  // Add clockface last to it is on top. :D
  var face = this.svg.append('g')
      .attr('id','clock-face')
      .attr('transform','translate(0,0))');

  face.selectAll('.hour-label')
    .data(d3.range(0,24,1))
      .enter()
      .append('text')
      .attr('class', 'hour-label')
      .attr('text-anchor','middle')
      .attr('x',function(d){
        return self.hourLabelRadius * Math.sin(self.hourScale(d) * self.radians);
      })
      .attr('y',function(d){
        return -self.hourLabelRadius * Math.cos(self.hourScale(d) * self.radians) + self.hourLabelYOffset;
      })
      .text(function(d){
        return d;
      });
}

/* * * * *
 * Selects data needed for vis based on selection. Takes 1 object as a paramater
 * which should be formatted {cities: [], languages: []} where the arrays contain
 * strings with the names of the selection. Stores it in selectedData.
 */
AsterPlot.prototype.selectData = function(selection) {
  this.selectedData = [];

  for (var hour = 0; hour < 24; hour++) {
    for (city in selection.cities) {
      var hourCommits = [0, 0, 0, 0, 0, 0, 0]
      for (lang in selection.languages) {
        for (day in this.rawData[selection.cities[city].name][hour][selection.languages[lang]]) {
          hourCommits[this.week.indexOf(day)] += this.rawData[selection.cities[city].name][hour][selection.languages[lang]][day];
        }
      }
      this.selectedData.push(
        {"name" : selection.cities[city].name,
         "maxIndex" : city,
         "colour" : selection.cities[city].color,
         "days" : hourCommits.slice(0)
      });
    }
  }

  // Find the largest data point in the selection.
  this.largest = 0;
  for (var i = this.selectedData.length - 1; i >= 0; i--) {
    for (var j = 0; j < 7; j++) {
      if (this.selectedData[i].days[j] > this.largest) {
        this.largest = this.selectedData[i].days[j]
      }
    }
  };
  for (var i = selection.cities.length - 1; i >= 0; i--) {
    var temp = 0;
    for (var j = this.selectedData.length - 1; j >= 0; j--) {
      if (this.selectedData[j].name != selection.cities[i].name) {
        continue;
      };
      for (var k = 0; k < 7; k++) {
        if (this.selectedData[j].days[k] > temp) {
          temp = this.selectedData[j].days[k]
        }
      }
    };
  this.relLargest.unshift(temp)
  };
};

/* * * * *
 * Draws the graph. Takes 1 array as a paramater which should be formatted
 * [{hour1, city1, commits}, {hour1, city2, commits}, ...] i.e. all entries
 * for the first hour should come first, and the order of the cities should
 * be the same for all subsequent hours.
 */
AsterPlot.prototype.drawGraph = function () {
  var self = this;

  // Create the graph, duhr.
  var path = this.svg.selectAll(".solidArc")
      .data(this.pie(this.selectedData))
    .enter().append("path")
      .attr("fill", function (d) { return d.data.colour; })
      .attr("class", "solidArc")
      .attr("d", this.arc)
      .each(function(d) { this._current = {
          data : d.data,
          value : d.value,
          startAngle : d.startAngle,
          endAngle : d.endAngle
        };
      })
      .on('mouseover', this.tip.show)
      .on('mouseout', this.tip.hide);

  // Create a thick white outline to give the impression hours are seperated.
  var outerPath = this.svg.selectAll(".outlineArc")
      .data(this.clockPie(this.hours))
    .enter().append("path")
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("class", "outlineArc")
      .attr("stroke-width", 5)
      .attr("d", this.outlineArc);

  // Create a thin outline around the graph
  // var outerOuterPath = this.svg.selectAll(".outlineOutlineArc")
  //     .data(this.clockPie(this.hours))
  //   .enter().append("path")
  //     .attr("fill", "none")
  //     .attr("stroke", "lightgray")
  //     .attr("class", "outlineArc")
  //     .attr("stroke-width", 1)
  //     .attr("d", this.outlineArc);

  // Centre text
  this.svg.append("svg:text")
      .attr("class", "aster-score")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle") // text-align: right
      .text(this.week[this.selectedDay]);

  // Add clockface last to it is on top. :D
  var face = this.svg.append('g')
      .attr('id','clock-face')
      .attr('transform','translate(0,0))');

  face.selectAll('.hour-label')
    .data(d3.range(0,24,1))
      .enter()
      .append('text')
      .attr('class', 'hour-label')
      .attr('text-anchor','middle')
      .attr('x',function(d){
        return self.hourLabelRadius * Math.sin(self.hourScale(d) * self.radians);
      })
      .attr('y',function(d){
        return -self.hourLabelRadius * Math.cos(self.hourScale(d) * self.radians) + self.hourLabelYOffset;
      })
      .text(function(d){
        return d;
      });
}
