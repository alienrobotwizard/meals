define([
    'jquery',
    'knockout',
    'models/ingredient'
], function ($, ko, Ingredient) {
    function IngredientCollection() {
        var self = this;
        self.ingredients = ko.observableArray([]);
        self.total = ko.observable();

        // Params for fetching
        self.paramName = ko.observable();
        self.paramOffset = ko.observable(0);
        self.paramLimit = ko.observable(10);

        self.ingredientSelectorArgs = {
            ajax: {
                url: '/api/v1/ingredient',
                dataType: 'json',
                delay: 250,
                data: function(params) {
                    console.log(params);
                    return {
                        'name': params.term
                    };
                },
                processResults: function(data, pg) {
                    return {
                        results: $.map(data.hits, function(hit, i) {
                            return {'text': hit.name, 'id': hit.id};
                        })
                    };
                }
            },
            minimumInputLength: 0
        };
        
        self.apiPath = ko.computed(function() {
            var path = '/api/v1/ingredient';
            var params = [];
            if (self.paramName()) { params.push('name='+self.paramName()); }
            if (self.paramOffset()) { params.push('offset='+self.paramOffset()); }
            if (self.paramLimit()) { params.push('limit='+self.paramLimit()); }
            if (params.length > 0) {
                path += '?' + params.join('&');
            }
            return path;
        });
        
        self.initialize = function(data) {
            self.ingredients.removeAll();
            if (data.hasOwnProperty('ingredients')) {
                $.each(data.ingredients, function(i, ingredientData) {
                    var ingredient = new Ingredient();
                    ingredient.initialize(ingredientData);
                    self.ingredients.push(ingredient);
                });
            }
            if (data.hasOwnProperty('total')) {
                self.total(data.total);
            }
        };

        self.createIngredientSelector = function(sel) {
            sel.select2(self.ingredientSelectorArgs);
            sel.on('select2:select', function(e) {
                self.addById(e.params.data.id, function() {
                    sel.val(null).trigger('change');
                });                    
            }); 
        };
        
        self.addById = function(id, cb) {
            var ing = new Ingredient();
            ing.id(id);
            ing.fetch(function(fetched) {
                fetched.quantity(1);
                self.push(fetched);
                if (cb) { cb() };
            });
        };
        
        self.removeIngredient = function(ing) {
            self.ingredients.remove(ing);
        };
        
        self.push = function(ingredient) {
            var match = ko.utils.arrayFirst(self.ingredients(), function(ing) {
                return ingredient.id() === ing.id();
            });
            
            if (!match) {
                self.ingredients.push(ingredient);
            }
        };
        
        self.fetch = function(cb) {
            $.getJSON(self.apiPath(), function (data) {       
                if (data) {
                    data.ingredients = data.hits;
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
                self.paramName(options.search);
            } else {
                self.paramName('');
            }
            
            self.fetch(function(fetched) {
                cb({                
                    count: fetched.total(),
                    items: $.map(fetched.ingredients(), function(ing, i) {
                        return {
                            name: '<a href="#ingredient/'+ing.id()+'">'+ing.name()+'</a>',
                            description: ing.description(),
                            created_at: ing.createdAt()
                        }
                    }),
                    start: offset + 1,
                    end: offset + fetched.ingredients().length,
                    page: options.pageIndex,
                    pages: Math.ceil(fetched.total() / options.pageSize),
                    columns: [
                        {
                            label: 'Name',
                            property: 'name',
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
            $.each(self.ingredients(), function(i, ingredient) {
                cb(ingredient);
            });
        };
    }
    
    return IngredientCollection;
});
