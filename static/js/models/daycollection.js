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

        self.shoppingList = ko.observableArray([]);
        
        self.paramStartDay = ko.observable();
        self.paramEndDay = ko.observable();
        
        self.apiPath = ko.computed(function() {
            var path = '/api/v1/day';
            var params = [];
            if (self.paramStartDay()) { params.push('start_day='+self.paramStartDay()); }
            if (self.paramEndDay()) { params.push('end_day='+self.paramEndDay()); }
            if (params.length > 0) {
                path += '?' + params.join('&');
            }
            return path;
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

        self.fetchEvents = function(start, end, timezone, cb) {
            self.paramStartDay(start.format('YYYYMMDD'));
            self.paramEndDay(end.format('YYYYMMDD'));
            self.fetch(function(fetched) {
                self.paramStartDay('');
                self.paramEndDay('');
                cb(fetched.events());
            });
        };

        self.clearShoppingList = function(view, event) {
            self.shoppingList.removeAll();
        };
        
        self.updateShoppingList = function(start, end, event, view) {
            self.paramStartDay(start.format('YYYYMMDD'));
            self.paramEndDay(end.format('YYYYMMDD'));
            self.fetch(function(fetched) {
                self.shoppingList.removeAll();
                $.each(fetched.days(), function(i, day) {
                    day.meals().each(function(meal) {
                        meal.ingredients().each(function(ingredient) {
                            self.shoppingList.push({
                                id: ingredient.id(),
                                name: ingredient.name(),
                                quantity: ingredient.quantity(),
                                meal: meal.title(),
                                mealday: day.date().substring(0,11)
                            });
                        });
                    });
                });
            });
        };
        
        self.fetch = function(cb) {
            $.getJSON(self.apiPath(), function (data) {
                if (data) { self.initialize(data); }
                if (cb) { cb(self) };
            });
        };
    }
    
    return DayCollection;
});
