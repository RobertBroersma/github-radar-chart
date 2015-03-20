$(function(){
    var data = [
    {
        className: 'Amsterdam', // optional can be used for styling
        axes: [
        {axis: "JavaScript", value: 13, yOffset: 10},
        {axis: "C#", value: 6},
        {axis: "C", value: 5},
        {axis: "Shell", value: 9},
        {axis: "PHP", value: 2, xOffset: -20}
        ]
    },
    {
        className: 'San Francisco',
        axes: [
        {axis: "JavaScript", value: 6},
        {axis: "C#", value: 7},
        {axis: "C", value: 10},
        {axis: "Shell", value: 13},
        {axis: "PHP", value: 9}
        ]
    }
    ];

    d3.json("dataRadar.json", function(error, data) {
        RadarChart.draw(".radar-container", data.cities);
    });

});
