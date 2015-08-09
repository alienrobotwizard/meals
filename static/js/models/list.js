define([
    'jquery',
    'knockout',
    'pager',
    'moment',
    'models/meal',
    'models/quantity',
    'models/ingredientcollection'
], function ($, ko, pager, moment, Meal, Quantity, IngredientCollection) {
    
    function List() {
        var self = this;
        self.path = '/api/v1/list';
        self.id = ko.observable();
        self.startDate = ko.observable();
        self.endDate = ko.observable();
        self.createdAt = ko.observable();
        self.updatedAt = ko.observable();
        self.ingredients = ko.observable(new IngredientCollection());
        
        self.apiPath = ko.computed(function() {return self.path+'/'+self.id();});
        
        self.editingIngredients = ko.observable(false);
        self.editIngredients = function() {self.editingIngredients(!self.editingIngredients());};

        self.title = ko.computed(function() {
            var s = moment(self.startDate()).format('ddd, MMMM Do');
            var e = moment(self.endDate()).format('ddd, MMMM Do');
            return "List for "+s+" - "+e;
        });

        self.totalDays = ko.computed(function() {
            var s = moment(self.startDate());
            var e = moment(self.endDate());
            return e.diff(s, 'days');
        });

        self.count = ko.computed(function() {
            return self.ingredients().ingredients().length;
        });

        self.combineIngredientsByID = ko.computed(function() {
            var groups = {};
            self.ingredients().each(function(ingredient) {
                if (groups.hasOwnProperty(ingredient.id())) {
                    groups[ingredient.id()].ingredients.push(ingredient);
                } else {
                    var newGroup = {
                        id: ingredient.id(),
                        name: ingredient.name(),                        
                        ingredients: [ingredient],
                        netQuantity: function() {
                            var q = new Quantity();
                            $.each(this.ingredients, function(i, ing) {
                                if (i === 0) {
                                    q.numericPart(ing.quantity().numericPart());
                                    q.unitsPart(ing.quantity().unitsPart());
                                } else {
                                    q.add(ing.quantity());
                                }
                            });
                            return q;
                        },
                        done: function() {
                            var yes = true;
                            $.each(this.ingredients, function(i, ing) {
                                yes = yes && ing.checked();
                            });
                            return yes;
                        },
                        checkAll: function(t, e) {                            
                            $.each(this.ingredients, function(i, ing) {
                                ing.checked(!ing.checked());
                            });
                            self.save(function(jqXHR) {
                                if (jqXHR && jqXHR.status == 403) {
                                    pager.navigate('login');
                                }
                            });
                            return true;
                        }
                    };                    
                    groups[ingredient.id()] = newGroup;
                }
            });

            var result = [];
            for (var ingID in groups) {
                result.push(groups[ingID]);
            }
            return result;
        });
        
        self.combineIngredientsByMeal = function() {
            var grps = {};
            self.ingredients().each(function(ingredient) {
                if (grps.hasOwnProperty(ingredient.mealID())) {
                    var mealIngredients = grps[ingredient.mealID()];
                    if (mealIngredients.hasOwnProperty(ingredient.id())) {
                        mealIngredients[ingredient.id()].quantity().add(ingredient.quantity());
                    } else {
                        mealIngredients[ingredient.id()] = ingredient;
                    }
                } else {
                    var ingID = ingredient.id();
                    grps[ingredient.mealID()] = {};
                    grps[ingredient.mealID()][ingID] = ingredient;
                }
            });

            var r = [];
            for (var mealID in grps) {
                var mealIngredients = grps[mealID];
                for (var ingredientID in mealIngredients) {
                    var ingredient = mealIngredients[ingredientID];
                    r.push({
                        'name': ingredient.name(),
                        'quantity': ingredient.quantity().repr(),
                        'meal': mealID,
                        'checked': ingredient.checked(),
                        'id': ingredientID
                    });
                }
            }
            return r;
        };
        
        self.initialize = function(data) {
            self.id(data.id);
            self.startDate(data.start_date);
            self.endDate(data.end_date);
            self.createdAt(data.created_at);
            self.updatedAt(data.updated_at);
            if (data.hasOwnProperty('ingredients')) {
                self.ingredients().initialize(data);
            }
        };

        self.saveChanges = function(vm) {
            self.save(function(jqXHR) {
                if (jqXHR && jqXHR.status == 403) {
                    pager.navigate('login');
                }
            });
        };
        
        self.fetch = function(cb) {
            $.getJSON(self.apiPath(), function (data) {
                if (data) { self.initialize(data); }
                if (cb) { cb(self); }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                if (cb) { cb(self, jqXHR); }
            });
        };

        self.serialize = function() {
            var data = {
                'list': ko.toJS(self)
            };            
            
            if (data.list.hasOwnProperty('startDate')) {
                data.list.start_date = data.list.startDate;
            }

            if (data.list.hasOwnProperty('endDate')) {
                data.list.end_date = data.list.endDate;
            }
            
            if (data.list.hasOwnProperty('ingredients')) {                
                data.list.ingredients = self.combineIngredientsByMeal();
            }
            return data;
        };

        self.remove = function(data, event) {
            $.ajax({
                type: 'DELETE',
                url: self.apiPath()
            }).done(function(json) {
                pager.navigate('#lists');
            }).fail(function(jqXHR, textStatus, errorThrown) {
                if (jqXHR && jqXHR.status == 403) {
                    pager.navigate('login');
                }
            });
        };
        
        self.save = function(cb) {
            var data = self.serialize();
            $.ajax({
                type: 'PUT',
                data: ko.toJSON(data),
                url: self.apiPath(),
                contentType: 'application/json'
            }).done(function(json) {
                if (cb) {cb()}
            }).fail(function(jqXHR, textStatus, errorThrown) {
                if (cb) {cb(jqXHR);}
            });
        };

        self.create = function(cb) {            
            var data = self.serialize();
            $.ajax({
                type: 'POST',
                data: ko.toJSON(data),
                url: self.path,
                contentType: 'application/json'
            }).done(function(json) {
                self.id(json.id);
                if (cb) {cb()}
            }).fail(function(jqXHR, textStatus, errorThrown) {
                if (cb) {cb(jqXHR);}
            });
        };
    }
    
    return List;
});
