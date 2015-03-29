var RadarChart = {
    defaultConfig: {
        containerClass: 'radar-chart',
        w: 600,
        h: 600,
        factor: 0.95,
        factorLegend: 1,
        levels: 3,
        levelTick: false,
        TickLength: 10,
        maxValue: 0,
        radians: 2 * Math.PI,
        color: d3.scale.category10(),
        formatCommas: d3.format("0,000"),
        axisLine: true,
        axisText: true,
        circles: true,
        radius: 5,
        backgroundTooltipColor: "#111111",
        backgroundTooltipOpacity: "0.7",
        tooltipColor: "white",
        axisJoin: function(d, i) {
            return d.name || i;
        },
        transitionDuration: 300
    },
    chart: function() {
        // default config
        var cfg = Object.create(RadarChart.defaultConfig);
        var tooltip;
        function setTooltip(msg, cont){
            if(msg == false){
                tooltip.classed("visible", 0);
                //tooltip.select("rect").classed("visible", 0);
            }else{
                tooltip.classed("visible", 1);
                var x = d3.mouse(cont)[0] + 20;
                y = d3.mouse(cont)[1];

                tooltip.select("text").classed('visible', 1).style("fill", cfg.tooltipColor);
                var padding=5;
                var bbox = tooltip.select("text").text(msg).node().getBBox();

                tooltip.select("rect")
                .classed('visible', 1).attr("x", 0)
                .attr("x", bbox.x - padding)
                .attr("y", bbox.y - padding)
                .attr("width", bbox.width + (padding*2))
                .attr("height", bbox.height + (padding*2))
                .attr("rx","5").attr("ry","5")
                .style("fill", cfg.backgroundTooltipColor).style("opacity", cfg.backgroundTooltipOpacity);
                tooltip.attr("transform", "translate(" + x + "," + y + ")")
            }
        }
        function radar(selection) {
            selection.each(function(data) {
                var container = d3.select(this);
                tooltip = container.append("g").classed("tooltip", 1);
                tooltip.append('rect');
                tooltip.append('text');

                // allow simple notation
                data = data.map(function(datum) {
                    if(datum instanceof Array) {
                        datum = {axes: datum};
                    }
                    return datum;
                });

                var isRelative = ($("input:radio[name=rel-abs]:checked").val() == "relative");

                var maxValue = Math.max(cfg.maxValue, d3.max(data, function(d) {
                    return d3.max(d.filteredLangs, function(o){ return isRelative ? o.commits / d.commits : o.commits; });
                }));

                var allAxis = data[0].filteredLangs.map(function(i, j){ return {name: i.name, xOffset: (i.xOffset)?i.xOffset:0, yOffset: (i.yOffset)?i.yOffset:0}; });
                var total = allAxis.length;
                var radius = cfg.factor * Math.min(cfg.w / 2, cfg.h / 2);

                container.classed(cfg.containerClass, 1);

                function getPosition(i, range, factor, func){
                    factor = typeof factor !== 'undefined' ? factor : 1;
                    return range * (1 - factor * func(i * cfg.radians / total));
                }
                function getHorizontalPosition(i, range, factor){
                    return getPosition(i, range, factor, Math.sin);
                }
                function getVerticalPosition(i, range, factor){
                    return getPosition(i, range, factor, Math.cos);
                }

                // levels && axises
                var levelFactors = d3.range(0, cfg.levels).map(function(level) {
                    return radius * ((level + 1) / cfg.levels);
                });

                var levelGroups = container.selectAll('g.level-group').data(levelFactors);

                levelGroups.enter().append('g');
                levelGroups.exit().remove();

                levelGroups.attr('class', function(d, i) {
                    return 'level-group level-group-' + i;
                });

                var Format = isRelative ? d3.format('%') : cfg.formatCommas;
                var suffix = isRelative ? "" : " commits";
                //Text indicating at what % each level is
                for(var j=0; j<cfg.levels; j++){
                    var levelFactor = cfg.factor*radius*((j+1)/cfg.levels);
                    container.selectAll(".levels")
                    .data([1]) //dummy data
                    .enter()
                    .append("svg:text")
                    .attr("x", function(d){return levelFactor*(1-cfg.factor*Math.sin(0));})
                    .attr("y", function(d){return levelFactor*(1-cfg.factor*Math.cos(0));})
                    .attr("class", "legend")
                    .style("font-family", "sans-serif")
                    .style("font-size", "10px")
                    .attr("transform", "translate(" + (cfg.w/2-levelFactor + 5) + ", " + (cfg.h/2-levelFactor-15) + ")")
                    .attr("fill", "#737373")
                    .text((isRelative ? Format((j+1)*maxValue/cfg.levels) : Format(Math.round((j+1)*maxValue/cfg.levels))) + suffix);
                }

                var levelLine = levelGroups.selectAll('.level').data(function(levelFactor) {
                    return d3.range(0, total).map(function() { return levelFactor; });
                });

                levelLine.enter().append('line');
                levelLine.exit().remove();

                if (cfg.levelTick){
                    levelLine
                    .attr('class', 'level')
                    .attr('x1', function(levelFactor, i){
                        if (radius == levelFactor) {
                            return getHorizontalPosition(i, levelFactor);
                        } else {
                            return getHorizontalPosition(i, levelFactor) + (cfg.TickLength / 2) * Math.cos(i * cfg.radians / total);
                        }
                    })
                    .attr('y1', function(levelFactor, i){
                        if (radius == levelFactor) {
                            return getVerticalPosition(i, levelFactor);
                        } else {
                            return getVerticalPosition(i, levelFactor) - (cfg.TickLength / 2) * Math.sin(i * cfg.radians / total);
                        }
                    })
                    .attr('x2', function(levelFactor, i){
                        if (radius == levelFactor) {
                            return getHorizontalPosition(i+1, levelFactor);
                        } else {
                            return getHorizontalPosition(i, levelFactor) - (cfg.TickLength / 2) * Math.cos(i * cfg.radians / total);
                        }
                    })
                    .attr('y2', function(levelFactor, i){
                        if (radius == levelFactor) {
                            return getVerticalPosition(i+1, levelFactor);
                        } else {
                            return getVerticalPosition(i, levelFactor) + (cfg.TickLength / 2) * Math.sin(i * cfg.radians / total);
                        }
                    })
                    .attr('transform', function(levelFactor) {
                        return 'translate(' + (cfg.w/2-levelFactor) + ', ' + (cfg.h/2-levelFactor) + ')';
                    });
                }
                else{
                    levelLine
                    .attr('class', 'level')
                    .attr('x1', function(levelFactor, i){ return getHorizontalPosition(i, levelFactor); })
                    .attr('y1', function(levelFactor, i){ return getVerticalPosition(i, levelFactor); })
                    .attr('x2', function(levelFactor, i){ return getHorizontalPosition(i+1, levelFactor); })
                    .attr('y2', function(levelFactor, i){ return getVerticalPosition(i+1, levelFactor); })
                    .attr('transform', function(levelFactor) {
                        return 'translate(' + (cfg.w/2-levelFactor) + ', ' + (cfg.h/2-levelFactor) + ')';
                    });
                }
                if(cfg.axisLine || cfg.axisText) {
                    var axis = container.selectAll('.axis').data(allAxis);

                    var newAxis = axis.enter().append('g');
                    if(cfg.axisLine) {
                        newAxis.append('line');
                    }
                    if(cfg.axisText) {
                        newAxis.append('text');
                    }

                    axis.exit().remove();

                    axis.attr('class', 'axis');

                    if(cfg.axisLine) {
                        axis.select('line')
                        .attr('x1', cfg.w/2)
                        .attr('y1', cfg.h/2)
                        .attr('x2', function(d, i) { return getHorizontalPosition(i, cfg.w / 2, cfg.factor); })
                        .attr('y2', function(d, i) { return getVerticalPosition(i, cfg.h / 2, cfg.factor); });
                    }

                    if(cfg.axisText) {
                        axis.select('text')
                        .attr('class', function(d, i){
                            var p = getHorizontalPosition(i, 0.5);

                            return 'legend ' +
                            ((p < 0.4) ? 'left' : ((p > 0.6) ? 'right' : 'middle'));
                        })
                        .attr('dy', function(d, i) {
                            var p = getVerticalPosition(i, 0.5);
                            return ((p < 0.1) ? '1em' : ((p > 0.9) ? '0' : '0.5em'));
                        })
                        .text(function(d) { return d.name; })
                        .attr('x', function(d, i){ return d.xOffset+ getHorizontalPosition(i, cfg.w/2, cfg.factorLegend); })
                        .attr('y', function(d, i){ return d.yOffset+ getVerticalPosition(i, cfg.h/2, cfg.factorLegend); });
                    }
                }

                // content
                data.forEach(function(d){
                    d.filteredLangs.forEach(function(axis, i) {
                        axis.x = getHorizontalPosition(i, cfg.w/2, (parseFloat(Math.max(isRelative ? axis.commits / d.commits : axis.commits, 0))/maxValue)*cfg.factor);
                        axis.y = getVerticalPosition(i, cfg.h/2, (parseFloat(Math.max(isRelative ? axis.commits / d.commits : axis.commits, 0))/maxValue)*cfg.factor);
                    });
                });
                var polygon = container.selectAll(".area").data(data, cfg.axisJoin);

                polygon.enter().append('polygon')
                .classed({area: 1, 'd3-enter': 1})
                .on('mouseover', function (dd){
                    d3.event.stopPropagation();
                    container.classed('focus', 1);
                    d3.select(this).classed('focused', 1);
                    var totalFilteredCommits = d3.sum(dd.filteredLangs, function(l){return l.commits});
                    if (isRelative) {
                        setTooltip(Math.round(100 * totalFilteredCommits/dd.commits) + "% of " + dd.name + "'s total commits", this);
                    } else {
                        setTooltip(dd.name + ": " + cfg.formatCommas(totalFilteredCommits) + " commits", this);
                    }
                })
                .on('mouseout', function(){
                    d3.event.stopPropagation();
                    container.classed('focus', 0);
                    d3.select(this).classed('focused', 0);
                    setTooltip(false, this);
                });

                polygon.exit()
                .classed('d3-exit', 1) // trigger css transition
                .transition().duration(cfg.transitionDuration)
                .remove();

                polygon
                .each(function(d, i) {
                    var classed = {'d3-exit': 0}; // if exiting element is being reused
                    classed['radar-chart-serie' + i] = 1;
                    if(d.name) {
                        classed[d.name] = 1;
                    }
                    d3.select(this).classed(classed);
                })
                // styles should only be transitioned with css
                .style('stroke', function(d, i) { $("[data-id='"+d.name+"'] .bar").css("background-color", cfg.color(d.ID)); return d.color; })
                .style('fill', function(d, i) { return d.color; })
                .transition().duration(cfg.transitionDuration)
                // svg attrs with js
                .attr('points',function(d) {
                    return d.filteredLangs.map(function(p) {
                        return [p.x, p.y].join(',');
                    }).join(' ');
                })
                .each('start', function() {
                    d3.select(this).classed('d3-enter', 0); // trigger css transition
                });

                if(cfg.circles && cfg.radius) {

                    var circleGroups = container.selectAll('g.circle-group').data(data, cfg.axisJoin);

                    circleGroups.enter().append('g').classed({'circle-group': 1, 'd3-enter': 1});
                    circleGroups.exit()
                    .classed('d3-exit', 1) // trigger css transition
                    .transition().duration(cfg.transitionDuration).remove();

                    circleGroups
                    .each(function(d) {
                        var classed = {'d3-exit': 0}; // if exiting element is being reused
                        if(d.name) {
                            classed[d.name] = 1;
                        }
                        d3.select(this).classed(classed);
                    })
                    .transition().duration(cfg.transitionDuration)
                    .each('start', function() {
                        d3.select(this).classed('d3-enter', 0); // trigger css transition
                    });

                    var circle = circleGroups.selectAll('.circle').data(function(datum, i) {
                        return datum.filteredLangs.map(function(d) { return [d, i, datum]; });
                    });

                    circle.enter().append('circle')
                    .classed({circle: 1, 'd3-enter': 1})
                    .style('fill', function(d) { return d[2].color; })
                    .on('mouseover', function(dd){
                        d3.event.stopPropagation();
                        if (isRelative) {
                            setTooltip(Math.round(100 * dd[0].commits/dd[2].commits) + "% of " + dd[2].name + "'s commits are in " + dd[0].name, this);
                        } else {
                            setTooltip(dd[2].name + ": " + cfg.formatCommas(dd[0].commits) + " commits in " + dd[0].name, this);
                        }
                        //container.classed('focus', 1);
                        //container.select('.area.radar-chart-serie'+dd[1]).classed('focused', 1);
                    })
                    .on('mouseout', function(dd){
                        d3.event.stopPropagation();
                        setTooltip(false, circle);
                        container.classed('focus', 0);
                        //container.select('.area.radar-chart-serie'+dd[1]).classed('focused', 0);
                        //No idea why previous line breaks tooltip hovering area after hoverin point.
                    });

                    circle.exit()
                    .classed('d3-exit', 1) // trigger css transition
                    .transition().duration(cfg.transitionDuration).remove();

                    circle
                    .each(function(d) {
                        var classed = {'d3-exit': 0}; // if exit element reused
                        classed['radar-chart-serie'+d[1]] = 1;
                    })
                    // styles should only be transitioned with css
                    .transition().duration(cfg.transitionDuration)
                    // svg attrs with js
                    .attr('r', cfg.radius)
                    .attr('cx', function(d) {
                        return d[0].x;
                    })
                    .attr('cy', function(d) {
                        return d[0].y;
                    })
                    .each('start', function() {
                        d3.select(this).classed('d3-enter', 0); // trigger css transition
                    });

                    // ensure tooltip is upmost layer
                    var tooltipEl = tooltip.node();
                    tooltipEl.parentNode.appendChild(tooltipEl);
                }
            });
        }

        radar.config = function(value) {
            if(!arguments.length) {
                return cfg;
            }
            if(arguments.length > 1) {
                cfg[arguments[0]] = arguments[1];
            }
            else {
                d3.entries(value || {}).forEach(function(option) {
                    cfg[option.key] = option.commits;
                });
            }
            return radar;
        };

        return radar;
    },
    draw: function(id, d, options) {
        var chart = RadarChart.chart().config(options);
        var cfg = chart.config();

        d3.select(id).select('svg').remove();
        d3.select(id)
        .append("svg")
        .attr("width", cfg.w)
        .attr("height", cfg.h)
        .datum(d)
        .call(chart);
    }
};
