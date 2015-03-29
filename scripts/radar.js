$(function(){
    var color = d3.scale.category10();
    var formatCommas = d3.format("0,000");

    var daysOfTheWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    var currentDay = 0;

    var aster = new AsterPlot(".aster-container");
    window.aster = aster;
    setTimeout(function(){
        aster.drawGraph();
    }, 1000);
    aster.toggleView("relative");

    d3.json("dataRadar.json", function(error, data) {
        drawBarCharts(data);
        updateLangsChart(data);

        drawRadar(data.cities);

        $(".nano").nanoScroller();

        $(document).on("click", ".bar-element:not(.disabled)", function() {
            $(this).toggleClass("selected");
            toggleLanguages();

            updateLangsChart(data);
            drawRadar(data.cities);
        });

        $("input:radio[name=rel-abs]").click(function() {
            drawRadar(data.cities);

            $(".unit").addClass("hidden");

            $(".unit" + "." + $(this).val()).removeClass("hidden");

            aster.toggleView($(this).val());
        });

        $("input:radio[name=total-temporal]").click(function() {
            if ($(this).val() == "temporal") {
                $(".aster-container").addClass("active");
            } else {
                $(".aster-container").removeClass("active");
            }
        });

        $(".btn-next").click(function(){
            if (currentDay < 6) {
                currentDay++;
            } else {
                currentDay = 0;
            }

            aster.selectDay(daysOfTheWeek[currentDay]);
        });

        $(".btn-prev").click(function(){
            if (currentDay > 0) {
                currentDay--;
            } else {
                currentDay = 6;
            }

            aster.selectDay(daysOfTheWeek[currentDay]);
        });
    });

    function drawBarCharts (data) {
        $(".cities").html("");

        //cities bar chart
        var citiesChart = d3.select(".cities")
        .selectAll("div")
        .data(data.cities);

        var enter = citiesChart.enter();

        var el = enter.append("div")
        .sort(function(a, b) {return b.commits - a.commits })
        .attr("class", "bar-element")
        .attr("data-name", function(d){ return d.name})
        .attr("data-id", function(d) { return d.ID; })
        .attr("data-color", function(d) {
            if (d.name == "amsterdam") {
                return "#f1c40f";
            } else {
                return color(d.ID);
            }
        });

        el.append("div")
        .attr("class", "label")
        .text(function(d) { return d.name; });

        var container = el.append("div").attr("class", "bar-container");
        var maxCommits = d3.max(data.cities, function(d){return d.commits});
        var totalCommits = d3.sum(data.languages, function(d){return d.commits});
        var bar = container.append("div")
        .style("width", function(d) {return 100 * d.commits / maxCommits + "%"; })
        .style("background-color", function(d) {
            if (d.name == "amsterdam") {
                return "#f1c40f";
            } else {
                return color(d.ID);
            }
        })
        .attr("class", "bar")
        .append("span").attr("class", "perc");

        bar.append("span").attr("class", "unit relative")
        .text(function(d) { return "~" + Math.round(100 * d.commits / totalCommits) + "%";});

        bar.append("span").attr("class", "unit absolute hidden")
        .text(function(d) { return formatCommas(d.commits) + " commits";});

        citiesChart.exit().remove();

        //languages bar chart
        var langChart = d3.select(".languages")
        .selectAll("div")
        .data(data.languages);

        var enter = langChart.enter();

        var el = enter.append("div")
        .sort(function(a, b) {return b.commits - a.commits })
        .attr("class", "bar-element")
        .attr("data-name", function(d){return d.name});

        el.append("div")
        .attr("class", "label")
        .text(function(d) { return d.name; });

        var container = el.append("div").attr("class", "bar-container");
        var maxCommits = d3.max(data.languages, function(d){return d.commits});
        var totalCommits = d3.sum(data.languages, function(d){return d.commits});
        var bar = container.append("div")
        .style("width", function(d) {return 100 * d.commits / maxCommits + "%"; })
        .attr("class", "bar");

        bar.append("span").attr("class", "unit relative")
        .text(function(d) { return "~" + Math.round(10000 * d.commits / totalCommits)/100 + "%";});

        bar.append("span").attr("class", "unit absolute hidden")
        .text(function(d) { return formatCommas(d.commits) + " commits";});

        langChart.exit().remove();
    }

    function updateLangsChart (data) {
        $(".languages .bar-element").addClass("disabled");

        var citiesList = getSelectedCities();

        data.languages.forEach(function(l){
            var hasCommits = false;
            l.cities.forEach(function(c){
                if (citiesList.indexOf(c.name) != -1) {
                    if (c.commits > 0) {
                        $("[data-name='"+l.name+"']").removeClass("disabled");
                        hasCommits = true;
                    }
                }
            });
            if (!hasCommits) {
                $("[data-name='"+l.name+"']").removeClass("selected");
            }
        });
    }

    function getSelectedCities (){
        var cities = $(".cities .bar-element.selected");
        var citiesList = [];
        cities.each(function(i, c){
            citiesList.push($(c).attr("data-name"));
        });

        return citiesList;
    }

    function getSelectedCitiesWithID (){
        var cities = $(".cities .bar-element.selected");
        var citiesList = [];
        cities.each(function(i, c){
            citiesList.push({name: $(c).attr("data-name"), color: $(c).attr("data-color")});
        });

        return citiesList;
    }

    function getSelectedLanguages (){
        var languages = $(".languages .bar-element.selected");
        var langsList = [];
        languages.each(function(i, c){
            langsList.push($(c).attr("data-name"));
        });

        return langsList;
    }

    function toggleLanguages() {
        var cities = getSelectedCities();
    }

    function drawRadar (data) {
        var citiesList = getSelectedCities();
        var langsList = getSelectedLanguages();
        var citiesListWithID = getSelectedCitiesWithID();

        if (citiesList.length > 0 && langsList.length > 0) {
            $(".aster-container svg").show();
            $(".aster-container .info-message").hide();
            $(".aster-container .arrow").show();

            aster.selectData({
                languages: langsList,
                cities: citiesListWithID
            });
            aster.change();
        } else {
            $(".aster-container svg").hide();
            $(".aster-container .info-message").show();
            $(".aster-container .arrow").hide();
        }

        var dataCopy = jQuery.extend(true, [], data);

        var filtered = dataCopy.filter(function(d){
            return citiesList.indexOf(d.name) != -1;
        });

        filtered.forEach(function(d) {
            var x = citiesListWithID;
            for (var key in citiesListWithID) {
                if(x[key].name == d.name) {
                    if (d.name == "amsterdam") {
                        d.color = "#f1c40f";
                    } else {
                        d.color = x[key].color;
                    }
                }
            }
        });

        filtered.forEach(function(i) {
            i.filteredLangs = i.langs.filter(function(lang){
                return langsList.indexOf(lang.name) != -1;
            });
        });

        var axes = [];
        filtered.forEach(function(i){
            i.filteredLangs.forEach(function(j){
                axes[j.name] = 1;
            });
        });

        if (filtered.length >= 1 && filtered[0].filteredLangs.length >= 1) {
            $(".radar-container").html("");
            RadarChart.draw(".radar-container", filtered);
        } else {
            $(".radar-container").html("<p class='info-message'>Please select at least <span class='highlighted'>1 city</span> and <span class='highlighted'>1 language</span> to compare!</p>");
        }
    }

});
