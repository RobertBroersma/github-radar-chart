$(function(){
    var width = 1000,
    height = 900;

    var nodeScale = 1/600,
    linkDistancePerUser = 2;
    var color = d3.scale.category20();

    d3.json("data.json", function(error, graph) {
        var maxCommitsPerUser = d3.max(graph.links, function(d){return d.commitsPerUser});

        var force = d3.layout.force()
        .charge(function(d) { return -d.users/1; })
        .chargeDistance(800)
        .linkDistance(function(l) { return linkDistancePerUser / (l.commitsPerUser/maxCommitsPerUser)})
        .linkStrength(1)
        .alpha(0)
        .gravity(1)
        .size([width, height]);

        var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

        var treshold = 2000;

        force
        .nodes(graph.nodes)
        .links(graph.links)
        .start();

        var link = svg.selectAll(".link")
        .data(graph.links)
        .enter().append("line")
        .filter(function(l){ return l.source.users > treshold && l.target.users > treshold })
        .attr("class", "link")
        .style("stroke-width", function(d) { return Math.sqrt(d.value); });

        var elem = svg.selectAll(".node")
        .data(graph.nodes);

        var elemEnter = elem.enter()
        .append("g")
        .filter(function(d){ return d.users > treshold })
        .attr("class", "node")
        .call(force.drag);

        var circle = elemEnter.append("circle")
        .attr("r", function(d) { return d.users * nodeScale })
        .style("fill", function(d) { return color(d.ID); });

        elemEnter.append("text")
        .attr("text-anchor", "middle")
        .attr("class", "graph-label")
        .attr("fill", function(d) { return color(d.ID); })
        .attr("stroke", "none")
        .attr("y", function(d){
            return -d.users * nodeScale - 5;
        })
        .text(function(d) {
            return d.name;
        });

        elemEnter.on("click", function(node) {
            //open the lateral panel
            $('.cd-panel-header').css('backgroundColor', color(node.ID));
            $('.cd-panel .title').html(node.name);
            $('.cd-panel').addClass('is-visible');

            $(".bar-chart").html("");

            var barchart = d3.select(".bar-chart")
            .selectAll("div")
                .data(graph.links);

            var enter = barchart.enter();

            var el = enter.append("div")
                .filter(function(d, i) { return d.source == node || d.target == node })
                .sort(function(d) { return color((d.source == node) ? d.target.ID : d.source.ID); })
                .attr("class", "bar-element");

            el.append("div")
                .attr("class", "label")
                .text(function(d) { return (d.source == node) ? d.target.name : d.source.name; });

            var container = el.append("div").attr("class", "bar-container");
            container.append("div")
                .style("width", function(d) { return Math.round(d.users * 0.1) + "px"; })
                .style("background-color", function(d) { return color((d.source == node) ? d.target.ID : d.source.ID); })
                .attr("class", "bar");

            barchart.exit().remove();

        });

        force.on("tick", function() {
            link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

            elemEnter.attr("transform", function(d) { return 'translate('+d.x+','+d.y+')'; });
        });
    });

});
