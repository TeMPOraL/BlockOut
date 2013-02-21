//Public interface

var SCORE_CHART = 0;
var TIME_CHART = 0;

function init_charts() {
    SCORE_CHART = new Highcharts.Chart({
            chart: {
                renderTo: 'chart-score',
                type: 'column'
            },
            title: {
                text: 'Punkty'
            },

            legend: {
                enabled: false
            },

            xAxis: {
                type: 'linear',
                minRange: 10,
                min: 0,
                allowDecimals: false,
                title: {
                    text: 'Runda'
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Zdobyte punkty'
                }
            },
            tooltip: {
                formatter: function() {
                    return ''+
                        this.x +': '+ this.y +' mm';
                }
            },
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                }
            },
                series: [{
                    data: []
    
                }]
        });

    TIME_CHART = new Highcharts.Chart({
            chart: {
                renderTo: 'chart-time',
                type: 'column'
            },
            title: {
                text: 'Czas gry'
            },

            legend: {
                enabled: false
            },

            xAxis: {
                type: 'linear',
                minRange: 10,
                min: 0,
                allowDecimals: false,
                title: {
                    text: 'Runda'
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Czas trwania rundy (s)'
                }
            },
            tooltip: {
                formatter: function() {
                    return ''+
                        this.x +': '+ this.y +' mm';
                }
            },
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                }
            },
                series: [{
                    data: []
    
                }]
        });
}

function reset_charts() {

    if(SCORE_CHART) {
        SCORE_CHART.destroy();
    }

    if(TIME_CHART) {
        TIME_CHART.destroy();
    }

    init_charts();
}

function add_score_item(howmuch) {
    SCORE_CHART.series[0].addPoint(howmuch);
}

function add_time_item(howmuch) {
    TIME_CHART.series[0].addPoint(howmuch);
}

//Private parts ;)
