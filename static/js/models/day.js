define([
    'jquery',
    'knockout',
    'models/mealcollection'
], function ($, ko, MealCollection) {
    function Day() {
        var self = this;
        self.id = ko.observable();
        self.date = ko.observable();
        self.createdAt = ko.observable();
        self.updatedAt = ko.observable();
        self.meals = ko.observable(new MealCollection());
       
        self.apiPath = ko.computed(function() {return '/api/v1/day/'+self.id();});
        self.initialize = function(data) {
            self.id(data.id);
            self.date(data.date);
            self.createdAt(data.created_at);
            self.updatedAt(data.updated_at);
            self.meals().initialize(data);            
        };

        self.serialize = function() {
            var data = {
                'day': ko.toJS(self)
            };
            if (data.day.hasOwnProperty('meals')) {
                data.day.meals = $.map(data.day.meals.meals, function(meal, i) {
                    return meal.id;
                });
            }
            return data;
        };
        
        self.save = function(vm) {
            var data = self.serialize();

            $.ajax({
                type: 'PUT',
                data: ko.toJSON(data),
                url: self.apiPath(),
                contentType: 'application/json'
            }).done(function(json) {
                vm.dayModal().modal('hide');
                vm.refresh();
            }).fail(function(json) {
                console.log("Failed updating day");
            });           
        }

        self.fetch = function(cb) {
            $.getJSON(self.apiPath(), function (data) {
                if (data) { self.initialize(data); }
                if (cb) { cb(self) };
            }).fail(function(){
                self.meals().initialize({});
                if (cb) { cb(self); }
            });
        };
    }

    return Day;
});
