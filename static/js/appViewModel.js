define([
    'jquery',
    'knockout',
    'pager',
    'fullcalendar',
    'select2',
    'models/day',
    'models/meal',
    'models/ingredient',
    'models/daycollection',
    'models/mealcollection',
    'models/ingredientcollection'
], function ($, ko, pager, fullcalendar, select2, Day, Meal, Ingredient, DayCollection, MealCollection, IngredientCollection) {
    $(function () {
        function User() {
            var self = this;
            
            self.email = ko.observable();
            self.password = ko.observable();

            self.isLoggedIn = function(page, route, callback) {
                // This will only succeed if the user has a valid jwt
                $.getJSON('/api/v1/day', function (data) {
                    callback();
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    window.location.href = '#login';
                });
            };
            
            self.serialize = ko.computed(function() {
                var data = {
                    'user': ko.toJS(self)
                };
                return data;
            });
            
            self.login = function() {
                var data = self.serialize();
                $.ajax({
                    type: 'POST',
                    data: ko.toJSON(data),
                    url: '/user/authenticate',
                    contentType: 'application/json'
                }).done(function(json) {
                    pager.navigate('plan/calendar');
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    console.log(textStatus);
                });           
            };            
        };
        
        function AppViewModel() {
            var self = this;
            
            self.calendar = ko.observable($('#calendar'));
            self.dayModal = ko.observable($('#addMealsToDay'));
            self.ingredientRepeater = ko.observable($(null));
            self.mealRepeater = ko.observable($(null));
            self.ingredientSelector = ko.observable($(null));

            self.shopperEmail = ko.observable();
            self.uploading = ko.observable(false);
            self.sendingEmail = ko.observable(false);

            self.user = ko.observable(new User());
            self.day = ko.observable(new Day());
            self.meal = ko.observable(new Meal());
            self.ingredient = ko.observable(new Ingredient());
            self.dayCollection = ko.observable(new DayCollection());
            self.mealCollection = ko.observable(new MealCollection());
            self.ingredientCollection = ko.observable(new IngredientCollection());            
            
            self.initialize = function() {
                self.calendar().fullCalendar({
                    selectable: true,
                    events: function(start, end, tz, cb) {
                        self.dayCollection().fetchEvents(start, end, tz, function(eventData, jqXHR) {
                            if (jqXHR && jqXHR.status == 403) {
                                pager.navigate('login');
                            } else if (!jqXHR) {
                                cb(eventData);
                            }
                        });
                    },                        
                    dayClick: self.dayClick,
                    select: self.dayCollection().updateShoppingList                    
                });
                self.day().meals().createMealSelector($('#inputDayMeals'));
            };
                        
            self.dayClick = function(date, event, view) {
                self.day().id(date.format('YYYYMMDD'));
                self.day().date(date);
                self.day().fetch(function(fetched, jqXHR) {
                    if (jqXHR && jqXHR.status == 403) {
                        pager.navigate('login');
                    } else if (!jqXHR) {
                        self.dayModal().modal('show');
                    }
                });
            };

            self.formatShoppingListTODO = function() {
                function capitalizeFirstLetter(string) {
                    return string.charAt(0).toUpperCase() + string.slice(1);
                };
                
                var content = "";
                $.each(self.dayCollection().shoppingList(), function(index, row) {
                    var mealContext = $.map(row.meals, function(meal, i) {
                        return '+'+$.map(meal.split(' '), function(word, j) {
                            return capitalizeFirstLetter(word);
                        }).join('');
                    }).join(' ');
                    content += row.quantity().repr()+'  '+row.name+' @shopping '+mealContext+'\n';
                });
                return content;
            };
            
            self.formatShoppingListICS = function() {
                var content = "BEGIN:VCALENDAR\n";
                content += "VERSION:2.0\n";
                content += "CALSCALE:GREGORIAN\n";
                $.each(self.dayCollection().shoppingList(), function(index, row) {
                    var rowString = "BEGIN:VTODO\n";
                    rowString += "STATUS:NEEDS-ACTION\n";
                    rowString += "SUMMARY:"+row.quantity().repr()+'  '+row.name+"\n";
                    rowString += "DESCRIPTION:"+row.meal+"\n";
                    rowString += "END:VTODO\n";
                    content += rowString;
                });
                content += "END:VCALENDAR";
                return content;
            };
            
            self.downloadShoppingList = function() {
                var content = "data:text/calendar;charset=utf-8,";
                content += self.formatShoppingListICS();
                var encodedUri = encodeURI(content);
                window.open(encodedUri);
            };

            self.uploadShoppingList = function() {
                self.uploading(true);
                var data = {
                    'body': self.formatShoppingListTODO() 
                };
                $.ajax({
                    type: 'PUT',
                    data: ko.toJSON(data),
                    url: '/api/v1/dropbox',
                    contentType: 'application/json'
                }).done(function(json) {
                    self.uploading(false);
                }).fail(function(json) {
                    self.uploading(false);
                });
            };
            
            self.sendShoppingList = function() {
                self.sendingEmail(true);
                var data = {
                    'email': self.shopperEmail(),
                    'body': self.formatShoppingListICS() 
                };
                $.ajax({
                    type: 'PUT',
                    data: ko.toJSON(data),
                    url: '/api/v1/email',
                    contentType: 'application/json'
                }).done(function(json) {
                    self.sendingEmail(false);
                }).fail(function(json) {
                    self.sendingEmail(false);
                });
            };
            
            self.refresh = function() {
                self.calendar().fullCalendar('refetchEvents');
            };

            self.refreshIngredients = function() {
                self.ingredientRepeater().repeater('render');
                self.ingredient().initialize({});
            };

            self.refreshMeals = function() {
                self.mealRepeater().repeater('render');
                self.meal().initialize({});
                self.meal().ingredients().initialize({});
            };

            self.fetchIngredient = function(page) {
                self.ingredient().id(page.page.id());
                self.ingredient().fetch(function(fetched, jqXHR) {
                    if (jqXHR && jqXHR.status == 403) {
                        pager.navigate('login');
                    }
                });                
            };

            self.fetchMeal = function(page) {
                self.meal().id(page.page.id());
                self.meal().fetch(function(fetched, jqXHR) {
                    if (jqXHR && jqXHR.status == 403) {
                        pager.navigate('login');
                    } else if (!jqXHR) {
                        fetched.ingredients().each(function(ingredient) {
                            ingredient.quantity().createUnitSelector($('#inputMealIngredientQuantity-'+ingredient.id()));
                        });
                    }
                });                
            };
            
            self.addIngredient = function(e) {
                self.ingredient().create(function(jqXHR) {
                    if (jqXHR && jqXHR.status == 403) {
                        pager.navigate('login');
                    } else if (!jqXHR) {
                        self.refreshIngredients();
                        e.reset();
                    }
                });                
            };

            self.addMeal = function(e) {
                self.meal().create(function(jqXHR) {
                    if (jqXHR && jqXHR.status == 403) {
                        pager.navigate('login');
                    } else if (!jqXHR) { 
                        self.refreshMeals();
                        e.reset();
                        self.meal().ingredients().initialize({});
                    }
                });
            };
            
            self.initIngredientRepeater = function() {
                self.ingredientRepeater($('#ingredientsRepeater'));
                self.ingredientRepeater().repeater({
                    staticHeight: false,
                    dataSource: function(options, cb) {
                        self.ingredientCollection().repeaterSource(options, function(data, jqXHR) {
                            if (jqXHR && jqXHR.status == 403) {
                                pager.navigate('login');
                            } else if (!jqXHR) {
                                cb(data);
                            }
                        });
                    }
                });
            };

            self.initMealPage = function() {
                self.meal().ingredients().createIngredientSelector($('#inputMealIngredients'), function(fetched, jqXHR) {
                    if (jqXHR && jqXHR.status == 403) {
                        pager.navigate('login');
                    } else if (!jqXHR) {
                        fetched.quantity().createUnitSelector($('#inputMealIngredientQuantity-'+fetched.id()));
                    }
                });
            };
            
            self.initMealsPage = function() {
                // Set up the repeater (list of all meals)
                self.mealRepeater($('#mealsRepeater'));
                self.mealRepeater().repeater({
                    staticHeight: false,
                    dataSource: function(options, cb) {
                        self.mealCollection().repeaterSource(options, function(data, jqXHR) {
                            if (jqXHR && jqXHR.status == 403) {
                                pager.navigate('login');
                            } else if (!jqXHR) {
                                cb(data)
                            }
                        });
                    }
                });

                // Set up the ingredient selector on the new_meal form
                self.ingredientSelector($('#ingredientSelector'));
                self.meal().ingredients().createIngredientSelector(self.ingredientSelector(), function(fetched, jqXHR) {
                    if (jqXHR && jqXHR.status == 403) {
                        pager.navigate('login');
                    } else if (!jqXHR) {
                        fetched.quantity().createUnitSelector($('#newMealIngredientQuantity-'+fetched.id()));
                    }
                });
            };
        }

        viewModel = new AppViewModel();
        viewModel.initialize();

        pager.extendWithPage(viewModel);
        ko.applyBindings(viewModel);
        pager.start();
    });
});
