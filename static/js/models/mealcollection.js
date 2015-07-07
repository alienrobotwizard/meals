define([
    'jquery',
    'knockout',
    'models/meal'
], function ($, ko, Meal) {
    function MealCollection() {
        var self = this;
        self.meals = ko.observableArray([]);
        self.total = ko.observable();

        // Params for fetching
        self.paramTitle = ko.observable();
        self.paramOffset = ko.observable(0);
        self.paramLimit = ko.observable(10);
        
        self.apiPath = ko.computed(function() {
            var path = '/api/v1/meal';
            var params = [];
            if (self.paramTitle()) { params.push('title='+self.paramTitle()); }
            if (self.paramOffset()) { params.push('offset='+self.paramOffset()); }
            if (self.paramLimit()) { params.push('limit='+self.paramLimit()); }
            if (params.length > 0) {
                path += '?' + params.join('&');
            }
            return path;
        });
        
        self.initialize = function(data) {
            self.meals.removeAll();
            $.each(data.meals, function(i, mealData) {
                var meal = new Meal();
                meal.initialize(mealData);
                self.meals.push(meal);
            });
            if (data.hasOwnProperty('total')) {
                self.total(data.total);
            }
        };

        self.fetch = function(cb) {
            $.getJSON(self.apiPath(), function (data) {                
                if (data) {
                    data.meals = data.hits;
                    self.initialize(data);
                }
                if (cb) { cb(self); }
            });
        };

        self.repeaterSource = function(options, cb) {            
            var offset = (options.pageIndex)*options.pageSize;
       
            self.paramLimit(options.pageSize);
            self.paramOffset(offset);
            if (options.search) {
                self.paramTitle(options.search);
            } else {
                self.paramTitle('');
            }
            
            self.fetch(function(fetched) {
                cb({                
                    count: fetched.total(),
                    items: $.map(fetched.meals(), function(meal, i) {
                        return {
                            title: '<a href="#meal/'+meal.id()+'">'+meal.title()+'</a>',
                            description: meal.description(),
                            created_at: meal.createdAt()
                        }
                    }),
                    start: offset + 1,
                    end: offset + fetched.meals().length,
                    page: options.pageIndex,
                    pages: Math.ceil(fetched.total() / options.pageSize),
                    columns: [
                        {
                            label: 'Title',
                            property: 'title',
                            sortable: true
                        },
                        {
                            label: 'Description',
                            property: 'description',
                            sortable: true
                        },
                        {
                            label: 'Created At',
                            property: 'created_at',
                            sortable: true
                        }
                    ]
                });
            });                        
        };
        
        self.each = function(cb) {
            $.each(self.meals(), function(i, meal) {
                cb(meal);
            });
        };
    }
    
    return MealCollection;
});
