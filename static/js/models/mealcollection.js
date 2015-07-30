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
        
        self.mealSelectorArgs = {
            ajax: {
                url: '/api/v1/meal',
                dataType: 'json',
                delay: 250,
                data: function(params) {
                    console.log(params);
                    return {
                        'title': params.term
                    };
                },
                processResults: function(data, pg) {
                    return {
                        results: $.map(data.hits, function(hit, i) {
                            return {'text': hit.title, 'id': hit.id};
                        })
                    };
                }
            },
            minimumInputLength: 0
        };
        
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
            if (data.hasOwnProperty('meals')) {
                $.each(data.meals, function(i, mealData) {
                    var meal = new Meal();
                    meal.initialize(mealData);
                    self.meals.push(meal);
                });
            }
            if (data.hasOwnProperty('total')) {
                self.total(data.total);
            }
        };

        
        self.removeMeal = function(m) {
            self.meals.remove(m);
        };
        
        self.createMealSelector = function(sel, onAddCB) {
            sel.select2(self.mealSelectorArgs);
            sel.on('select2:select', function(e) {
                self.addById(e.params.data.id, function(fetched, jqXHR) {
                    if (onAddCB) {
                        onAddCB(fetched, jqXHR);
                    }
                    sel.val(null).trigger('change');
                });                    
            }); 
        };
        
        self.addById = function(id, cb) {
            var meal = new Meal();
            meal.id(id);
            meal.fetch(function(fetched, jqXHR) {
                if (jqXHR) {
                    cb(fetched, jqXHR);
                } else {
                    // fetched.order(1);
                    self.push(fetched);
                    if (cb) { cb(fetched) };
                }
            });
        };

        self.push = function(meal) {
            var match = ko.utils.arrayFirst(self.meals(), function(m) {
                return meal.id() === m.id();
            });
            
            if (!match) {
                self.meals.push(meal);
            }
        };
        
        self.fetch = function(cb) {
            $.getJSON(self.apiPath(), function (data) {                
                if (data) {
                    data.meals = data.hits;
                    self.initialize(data);
                }
                if (cb) { cb(self); }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                if (cb) { cb(self, jqXHR); }
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
            
            self.fetch(function(fetched, jqXHR) {                
                if (jqXHR) {
                    cb({}, jqXHR);
                } else {
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
                }
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
