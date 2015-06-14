define(
    ['backbone', 'fullcalendar', 'models/day'],
    function(Backbone, fullcalendar, Day) {
        var DayCollection = Backbone.Collection.extend({
            model: Day,
            url: '../api/v1/day',
            parse: function(response) {                
                return response.hits;
            },
            toEvents: function() {
                return this.map(function(day) {
                    return {
                        'title': day.get('date'),
                        'start': fullcalendar.moment(day.get('date'))
                    };
                });
            }
        });
        return DayCollection;
    }
);
