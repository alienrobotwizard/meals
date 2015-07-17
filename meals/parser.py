import os
import nltk
import requests
from nltk.corpus import wordnet
from nltk.stem.wordnet import WordNetLemmatizer
from bs4 import BeautifulSoup
import pyparsing
from pyparsing import ParseException
from pyparsing import Token, Or, Literal, OneOrMore, nums, alphas, Regex
from pyparsing import Word, SkipTo, LineEnd, originalTextFor, Optional, ZeroOrMore, Keyword

from meals.model import Meal, Ingredient

LEMMATIZER = WordNetLemmatizer()
HERE = os.path.dirname(os.path.abspath(__file__))

class LemmatizedWord(Token):
    """
    Copied more or less verbatim from:
    https://github.com/JoshRosen/cmps140_creative_cooking_assistant/blob/d005049d29bde3669e20a3e5601e39cd3b90c978/nlu/ingredients.py
    """
    def __init__(self, matchLemma):
        super(LemmatizedWord, self).__init__()
        self.matchLemma = matchLemma
        self.name = '"LemmatizedWord: %s"' % self.matchLemma
        self.errmsg = "Expected something that lemmatizes to '%s'" % matchLemma

    def parseImpl(self, instring, loc, doActions=True):
        # Optimization: If the first character of the input string and the
        # lemmatized word don't match, then fail immediately:
        if instring[loc] != self.matchLemma[0]:
            raise ParseException("instring: {}, matchLemma: {}".format(instring, self.matchLemma))
        # Search until the end of the token / word boundary.
        word_boundary_tokens = "., "
        matchLen = 1
        while (loc+matchLen < len(instring) and
            instring[loc+matchLen] not in word_boundary_tokens):
            matchLen += 1
        stringToMatch = instring[loc:loc+matchLen]
        if LEMMATIZER.lemmatize(stringToMatch) == self.matchLemma:
            return loc+matchLen, stringToMatch

        raise ParseException("instring: {}, matchLemma: {}".format(instring, self.matchLemma))

class IngredientParser(object):
    """
    Copied more or less verbatim from:
    https://github.com/JoshRosen/cmps140_creative_cooking_assistant/blob/d005049d29bde3669e20a3e5601e39cd3b90c978/nlu/ingredients.py
    """

    loc = HERE+'/../conf/sagebear.cfg'
    food_adjectives = set([l.strip() for l in open(HERE+'/wordlists/food_adjectives.txt').readlines()])
    units_of_measure = set([l.strip() for l in open(HERE+'/wordlists/units_of_measure.txt').readlines()])
    
    #
    # Ingredient Name
    #    
    in_parens = Regex(r'\([^)]+\)')

    modifier = Or(LemmatizedWord(w) for w in food_adjectives if w) | in_parens | Keyword("to taste")

    base_ingredient = Regex(r"[^-(),][^ (),]+") + SkipTo(Keyword("to taste") | Literal(',') | Word('-') | in_parens | LineEnd())

    ingredient_name = (
        originalTextFor(ZeroOrMore(modifier + Optional(','))).setResultsName('pre_modifiers') +
        originalTextFor(base_ingredient).setResultsName('base_ingredient') +
        Optional(',') + Optional('-') +
        originalTextFor(SkipTo(LineEnd(), True)).setResultsName('post_modifiers')
    )

    def convert_quantity(tokens):
        r = 0.0
        for token in tokens:
            if '/' in token:
                (num, den) = token.split('/')
                r += float(num)/float(den)
            else:
                r += float(token)
        return str(r)
        
    def convert_units(tokens):
        units = tokens[0]
        if units:
            units = units.replace('ounce', 'oz')
            units = units.replace('tablespoon', 'tbsp')
            units = units.replace('teaspoon', 'tsp')
            units = units.replace('pound', 'lb')
        if units and len(tokens) > 1:
            units += ' '+' '.join([LEMMATIZER.lemmatize(w) for w in tokens[1:len(tokens)]])
        return units
        
    #
    # Ingredient Quantity
    #
    unit = Optional(in_parens.setResultsName('inside')) + Or(LemmatizedWord(w) for w in units_of_measure if w)
    quantity = OneOrMore(Word(nums + '-/'))
    ingredient_quantity = (
        Optional(quantity).setResultsName('quantity') +
        Optional(unit).setResultsName('unit') +
        originalTextFor(SkipTo(LineEnd(), True))
    )
    unit.setParseAction(convert_units)
    quantity.setParseAction(convert_quantity)
    
    @staticmethod
    def parse_quantity(s):
        try:
            parsed = IngredientParser.ingredient_quantity.parseString(s)
            return parsed
        except pyparsing.ParseException:
            return None
            
    @staticmethod
    def parse_name(s):
        try:
            parsed = IngredientParser.ingredient_name.parseString(s)
            return parsed
        except pyparsing.ParseException:
            return None

class Parser(object):
    """
    Currently only works for allrecipes.com
    """
    
    def _fetch_html(self, url):        
        r = requests.get(url)
        if r.ok:
            return r.text

    def _extract_title(self, soup):
        title = soup.select('#itemTitle')
        if title and len(title) > 0:
            return title[0].get_text()

    def _extract_description(self, soup):
        desc = soup.select('.author-container #lblDescription')
        if desc and len(desc) > 0:
            text = desc[0].get_text()
            text = text[1:len(text)-1]
            return text

    def _extract_directions(self, soup):
        dirs = soup.select('.directions ol li span')
        text = ''
        if dirs and len(dirs) > 0:
            for i in xrange(0, len(dirs)):
                text += "{}. {}\n".format(i+1,dirs[i].get_text())
        return text

    def _extract_ingredients(self, soup):
        ings = soup.select('ul.ingredient-wrap p.fl-ing')
        results = []
        if ings and len(ings) > 0:
            for ing in ings:
                amt_sel = ing.select('.ingredient-amount')
                name_sel = ing.select('.ingredient-name')
                ingredient = {}
                if name_sel and len(name_sel) > 0:
                    ingredient['parsed_name'] = IngredientParser.parse_name(name_sel[0].get_text())
                if amt_sel and len(amt_sel) > 0:
                    ingredient['parsed_quantity'] = IngredientParser.parse_quantity(amt_sel[0].get_text())
                results.append(ingredient)
        return results

    def _extract_ingredient(self, raw_ingredient):        
        parsed_name = raw_ingredient['parsed_name']
        
        words = parsed_name['base_ingredient'].lower().strip(' *').split()
        name = ' '.join(LEMMATIZER.lemmatize(w) for w in words)

        quantity = '1'
        if 'parsed_quantity' in raw_ingredient:
            parsed_quantity = raw_ingredient['parsed_quantity']
            quantity = parsed_quantity.get('quantity')
            if quantity:
                if 'unit' in parsed_quantity:
                    quantity += ' '+LEMMATIZER.lemmatize(parsed_quantity.get('unit')[0])
                else:
                    quantity += ' whole'
        
        
        modifiers = None
        if 'pre_modifiers' in parsed_name or 'post_modifiers' in parsed_name:
            modifiers = ''
            if 'pre_modifiers' in parsed_name:
                modifiers = parsed_name['pre_modifiers'].strip()
            if 'post_modifiers' in parsed_name:
                if 'pre_modifiers' in parsed_name:
                    modifiers += ', ' + parsed_name['post_modifiers'].strip()
                else:
                    modifiers = parsed_name['post_modifiers'].strip()
                
        return {
            'quantity': quantity,
            'name': name,
            'modifiers': modifiers
        }

    def _prepend_directions(self, directions, with_modifiers):
        pre = "Prepare Ingredients: \n"
        for ingredient in with_modifiers:
            pre += "  Ingredient: "+ingredient['name']+"; Process: "+ingredient['modifiers']+'\n'
        pre += "\n\n"
        return pre+directions
        
    def url_to_recipe(self, url):
        html = self._fetch_html(url)
        if html:
            soup = BeautifulSoup(html, 'lxml')
            title = self._extract_title(soup)
            desc = self._extract_description(soup)
            dirs = self._extract_directions(soup)
            
            raw_ingredients = self._extract_ingredients(soup)
            ingredients = map(self._extract_ingredient, raw_ingredients)

            with_modifiers = [ingredient for ingredient in ingredients if ingredient['modifiers']]
            if len(with_modifiers) > 0:
                dirs = self._prepend_directions(dirs, with_modifiers)
                
            return {
                'title': title,
                'description': desc,
                'recipe': dirs,
                'ingredients': ingredients
            }

class RecipeAdapter(object):

    @staticmethod
    def save(db, data):
        ingredients = set()
        meal = {
            'title': data.get('title'),
            'description': data.get('description'),
            'recipe': data.get('recipe'),
            'ingredients': []
        }
        for ing in data['ingredients']:
            existing = Ingredient.list(db, name=ing['name'])
            if len(existing) > 0:
                # FIXME: multiple ingredients with very similar name
                ingredient = existing[0].encode()
            else:
                ingredient = Ingredient.create(db, ing)
                ingredient = ingredient.encode()
            ingredient.update({'quantity': ing['quantity']})
            if ingredient['id'] not in ingredients:
                meal['ingredients'].append(ingredient)
                ingredients.add(ingredient['id'])
            
        return Meal.create(db, meal)
