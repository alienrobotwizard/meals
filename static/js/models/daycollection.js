define([
    'jquery',
    'knockout',
    'fullcalendar',
    'models/day'
], function ($, ko, fullcalendar, Day) {
    function DayCollection() {
        var self = this;
        self.days = ko.observableArray([]);
        self.start = ko.observable();
        self.end = ko.observable();
        
        self.apiPath = ko.computed(function() {
            // TODO: convert start and end into max_days_ago
            return '/api/v1/day?max_days_ago=100&limit=100';
        });

        self.initialize = function(data) {
            self.days.removeAll();
            $.each(data.hits, function(i, dayData) {
                var day = new Day();
                day.initialize(dayData);
                self.days.push(day);
            });
        };
        
        self.each = function(cb) {
            $.each(self.days(), function(i, day) {
                cb(day);
            });
        };
        
        self.events = ko.computed(function() {
            var results = [];
            self.each(function(day) {
                day.meals().each(function(meal) {                
                    results.push({
                        'id': meal.id(),
                        'allDay': true,
                        'url': '#meal/'+meal.id(),
                        'title': meal.title(),
                        'start': fullcalendar.moment(day.date())
                    });
                });
            });                    
            return results;
        });

        // Gets called each time user views page of days
        self.fetch = function(start, end, timezone, cb) {
            $.getJSON(self.apiPath(), function (data) {
                if (data) { self.initialize(data); }
                if (cb) { cb(self.events()) };
            });
        };
    }
    
    return DayCollection;
});
