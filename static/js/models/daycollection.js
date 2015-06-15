define(
    ['jquery', 'backbone', 'fullcalendar', 'models/day'],
    function($, Backbone, fullcalendar, Day) {
        var DayCollection = Backbone.Collection.extend({                            
            model: Day,
            url: '../api/v1/day',
            parse: function(response) {                
                return response.hits;
            },
            mealEvents: function(start, end, callback) {
                this.fetch({
                    data: $.param({
                        max_days_ago: 100,
                        limit: 100
                    }),
                    success: function(model) {
                        callback(model.map(function(day) {
                            return {
                                'title': day.get('date'),
                                'start': fullcalendar.moment(day.get('date'))
                            }
                        }));
                    }
                });
            }            
        });
        return DayCollection;
    }
);
