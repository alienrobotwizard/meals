define([
    'jquery',
    'knockout'
], function ($, ko) {
    
    function Quantity() {
        var self = this;

        // Order here defines precedence
        self.validUnits = [
            'tsp', 'tbsp', 'cup', 'oz', 'lb',
            'pint', 'quart', 'gallon',             
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

        self.unitConversions = {
            'cup': {'pint': 0.5, 'quart': 0.25, 'gallon': 0.0625, 'oz': 8, 'tsp': 48, 'tbsp': 16},
            'pint': {'cup': 2, 'quart': 0.5, 'gallon': 0.125, 'oz': 16, 'tsp': 96, 'tbsp': 32},
            'quart': {'cup': 4, 'pint': 2, 'gallon': 0.25, 'oz': 32, 'tsp': 192, 'tbsp': 64},
            'gallon': {'cup': 16, 'pint': 8, 'quart': 4, 'oz': 128, 'tsp': 768, 'tbsp': 256},
            'oz': {'cup': 0.125, 'pint': 0.0625, 'quart': 0.03125, 'gallon': 0.0078125, 'lb': 0.0625, 'tsp': 6, 'tbsp': 2},
            'lb': {'oz': 16},
            'tsp': {'cup': 0.0208333, 'pint': 0.0104167, 'quart': 0.00520833, 'gallon': 0.00130208, 'oz': 0.166667, 'tbsp': 0.333333},
            'tbsp': {'cup': 0.0625, 'pint': 0.03125, 'quart': 0.015625, 'gallon': 0.00390625, 'oz': 0.5, 'tsp': 3},
            'clove': {'bulb': 8}, // arbitrary
            'bulb': {'clove': 0.125}
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
            } else {
                numeric = parseFloat(numeric);
            }
            return {
                numeric: numeric,
                units: units
            };                
        };
        
        self.initialize = function(data) {
            self.numericPart(data.numeric);
            self.unitsPart(data.units);
        };

        self.numericPart.subscribe(function(newNum) {
            if (newNum && self.unitsPart()) {
                var units = self.normalizeUnitsPart(self.unitsPart());
                var unitFraction = self.unitFractions[units];
                var integerPart = Math.floor(newNum);
                var fractionalPart = parseFloat(newNum) % 1;
                var rounded = Math.ceil(fractionalPart/unitFraction) * unitFraction;
                self.numericPart(integerPart+rounded);
            }
        });

        self.normalizeUnitsPart = function(s) {
            return s.endsWith('s') ? s.substring(0, s.length-1) : s;
        };
        
        self.unitPrecedence = function(otherQuantity) {
            var otherUnits = otherQuantity.unitsPart();
            return self.validUnits.indexOf(self.unitsPart()) > self.validUnits.indexOf(otherUnits);
        };
        
        self.add = function(otherQuantity) {
            var thisUnits = self.unitsPart();
            var otherUnits = otherQuantity.unitsPart();

            if (thisUnits === otherUnits) {
                self.numericPart(self.numericPart()+otherQuantity.numericPart());
            } else if (self.unitPrecedence(otherQuantity)) {
                // convert other quantity to these units                
                if (self.unitConversions.hasOwnProperty(otherUnits)) {
                    var conversions = self.unitConversions[otherUnits];
                    if (conversions.hasOwnProperty(thisUnits)) {
                        // valid conversion
                        var factor = conversions[thisUnits];
                        var converted = otherQuantity.numericPart()*factor;
                        self.numericPart(self.numericPart() + converted);
                    } else {
                        console.log('cannot aggregate');
                    }
                }
            } else {
                // convert this quantity to other units
                if (self.unitConversions.hasOwnProperty(thisUnits)) {
                    var conversions = self.unitConversions[thisUnits];
                    if (conversions.hasOwnProperty(otherUnits)) {
                        // valid conversion
                        var factor = conversions[otherUnits];
                        var converted = self.numericPart()*factor;
                        self.numericPart(converted+otherQuantity.numericPart());
                        self.unitsPart(otherUnits);
                    } else {
                        console.log('cannot aggregate');
                    }
                }
            }
        };
        
        self.unitSelectorArgs = {
            data: $.map(self.validUnits, function(unit, i) {
                return {'text': unit, 'id': i};
            })
        };

        self.createUnitSelector = function(sel) {
            sel.select2(self.unitSelectorArgs);
            if (self.unitsPart()) {
                sel.val(self.validUnits.indexOf(self.normalizeUnitsPart(self.unitsPart()))).trigger('change');
            } else {
                sel.val(null).trigger('change');
            }
            sel.on('select2:select', function(e) {
                self.unitsPart(e.params.data.text);
            }); 
        };
    };

    return Quantity;
});
