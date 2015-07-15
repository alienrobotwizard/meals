define([
    'jquery',
    'knockout'
], function ($, ko) {
    
    function Quantity() {
        var self = this;
        self.validUnits = [
            'cup', 'quart', 'pint', 'gallon',
            'tsp', 'tbsp', 'oz', 'lb',
            'clove', 'bulb', 'bunch', 'whole'         
        ];
        
        self.unitFractions = {
            'cup': 0.25,
            'pint': 1.0,
            'quart': 1.0,
            'gallon': 1.0,
            'oz': 1.0,
            'lb': 0.25,
            'tsp': 0.25,
            'tbsp': 1.0,
            'clove': 1.0,
            'bulb': 1.0,
            'bunch': 1.0,
            'whole': 1.0
        };
        
        self.numericPart = ko.observable();
        self.unitsPart = ko.observable();
        self.repr = ko.computed(function() {
            var result = self.numericPart();
            var units = self.unitsPart();
            if (units) {
                if (self.numericPart() > 1 && !units.endsWith('s')) {
                    units += 's';
                } else if (self.numericPart() <= 1 && units.endsWith('s')) {
                    units = units.substring(0, units.length-1);
                };
                result += ' '+units;
            }
            return result;
        });

        self.parse = function(raw) {
            var splits = raw.split(' ');
            var numeric = splits[0];
            var units = splits[1];
            if (numeric.includes('/')) {
                var numden = numeric.split('/');
                numeric = parseFloat(numden[0])/parseFloat(numden[1]);
            };
            return {
                numeric: numeric,
                units: units
            };                
        };
        
        self.initialize = function(data) {
            self.numericPart(data.numeric);
            self.unitsPart(data.units);
        };

        self.unitSelectorArgs = {
            data: $.map(self.validUnits, function(unit, i) {
                return {'text': unit, 'id': i};
            })
        };

        self.createUnitSelector = function(sel) {
            sel.select2(self.unitSelectorArgs);
            if (self.unitsPart()) {
                sel.val(self.validUnits.indexOf(self.unitsPart())).trigger('change');
            } else {
                sel.val(null);
            }
            sel.on('select2:select', function(e) {
                self.unitsPart(e.params.data.text);
            }); 
        };
    };

    return Quantity;
});
