from datetime import datetime
from datetime import timedelta
from sqlalchemy.sql.expression import func
from sqlalchemy.orm import relationship, backref, load_only
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import ForeignKey, ForeignKeyConstraint, Table
from sqlalchemy import asc, desc, or_, and_, not_, CHAR, TIMESTAMP, Text, DateTime, Column, BigInteger, Integer, String

Base = declarative_base()


class Day(Base):
    """
    Will only contain days that actually have meals
    """
    __tablename__ = "days"

    id = Column(String(7), primary_key=True)
    date = Column(DateTime, index=True, nullable=False)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    meals = relationship("Meal", secondary="meal_days", backref="days")
    
    @staticmethod
    def get(session, day_id):
        return session.query(Day).get(day_id)

    @staticmethod
    def list_query(session, max_days_ago=7):
        q = session.query(Day)
        if max_days_ago:
            oldest = datetime.now() - timedelta(max_days_ago)
            q = q.filter(Day.date >= oldest)
        return q

    @staticmethod
    def count(session, **kwargs):
        q = Day.list_query(session, **kwargs)
        return q.count()

    @staticmethod
    def list(session, order='asc', limit=100, offset=0, **kwargs):
        q = Day.list_query(session, **kwargs)
        if order == 'asc':
            q = q.order_by(asc(Day.date))
        else:
            q = q.order_by(desc(Day.date))

        q = q.limit(limit).offset(offset)
        return q.all()        

    @staticmethod
    def delete(session, day_id):
        day = Day.get(session, day_id)
        if day:
            session.delete(day)
            return True
        return False

    @staticmethod
    def update_with_data(session, day, data):
        if 'meals' in data:
            day.meals = []
            for id in data['meals']:
                meal = Meal.get(session, id)
                if meal:
                    day.meals.append(meal)
                    
        day.updated_at = datetime.now()
        
    @staticmethod
    def create(session, data):
        day_id = data['id']
        day_date = datetime.strptime(day_id, '%Y%m%d')
        day = Day(id=day_id, date=day_date, created_at=datetime.now())
        Day.update_with_data(session, day, data)
        session.add(day)
        return day

    @staticmethod
    def update(session, day_id, data):
        day = Day.get(session, day_id)
        if day:
            Day.update_with_data(session, day, data)
            return True
        return False
        
class Meal(Base):

    __tablename__ = "meals"
    id = Column(Integer, autoincrement=True, primary_key=True)
    title = Column(String(200), index=True, unique=True, nullable=False)
    description = Column(Text)
    recipe = Column(Text)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    ingredients = relationship("Ingredient", secondary="meal_ingredients", backref="meals")
    
    @staticmethod
    def get(session, meal_id):
        return session.query(Meal).get(meal_id)

    @staticmethod
    def list_query(session, title=None):
        q = session.query(Meal)
        if title:
            q = q.filter(Meal.title.like('%'+title+'%'))
        return q

    @staticmethod
    def count(session, **kwargs):
        q = Meal.list_query(session, **kwargs)
        return q.count()

    @staticmethod
    def list(session, order='asc', limit=100, offset=0, **kwargs):
        q = Meal.list_query(session, **kwargs)
        if order == 'asc':
            q = q.order_by(asc(Meal.title))
        else:
            q = q.order_by(desc(Meal.title))

        q = q.limit(limit).offset(offset)
        return q.all()        

    @staticmethod
    def delete(session, meal_id):
        meal = Meal.get(session, meal_id)
        if meal:
            session.delete(meal)
            return True
        return False

    @staticmethod
    def update_with_data(session, meal, data):
        if 'description' in data:
            meal.description = data['description']
        if 'recipe' in data:
            meal.recipe = data['recipe']
        if 'ingredients' in data:
            meal.ingredients = []
            for id in data['ingredients']:
                ingredient = Ingredient.get(session, id)
                if ingredient:
                    meal.ingredients.append(ingredient)
                    
        meal.updated_at = datetime.now()
        
    @staticmethod
    def create(session, data):
        title = data['title']
        meal = Meal(title=data['title'], created_at=datetime.now())
        Meal.update_with_data(session, meal, data)
        session.add(meal)
        return meal

    @staticmethod
    def update(session, meal_id, data):
        meal = Meal.get(session, meal_id)
        if meal:
            Meal.update_with_data(session, meal, data)
            return True
        return False
        
class Ingredient(Base):
    
    __tablename__ = "ingredients"
    id = Column(Integer, autoincrement=True, primary_key=True)
    name = Column(String(200), index=True, unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    @staticmethod
    def get(session, ingredient_id):
        return session.query(Ingredient).get(ingredient)        

    @staticmethod
    def list_query(session, name=None):
        q = session.query(Ingredient)
        if name:
            q = q.filter(Ingredient.name.like('%'+name+'%'))
        return q

    @staticmethod
    def count(session, **kwargs):
        q = Ingredient.list_query(session, **kwargs)
        return q.count()

    @staticmethod
    def list(session, order='asc', limit=100, offset=0, **kwargs):
        q = Ingredient.list_query(session, **kwargs)
        if order == 'asc':
            q = q.order_by(asc(Ingredient.name))
        else:
            q = q.order_by(desc(Ingredient.name))

        q = q.limit(limit).offset(offset)
        return q.all()        

    @staticmethod
    def delete(session, ingredient_id):
        ingredient = Ingredient.get(session, ingredient_id)
        if ingredient:
            session.delete(ingredient)
            return True
        return False

    @staticmethod
    def update_with_data(session, ingredient, data):
        if 'description' in data:
            ingredient.description = data['description']
                    
        ingredient.updated_at = datetime.now()
        
    @staticmethod
    def create(session, data):
        ingredient = Ingredient(name=data['name'], created_at=datetime.now())
        Ingredient.update_with_data(session, ingredient, data)
        session.add(ingredient)
        return ingredient

    @staticmethod
    def update(session, ingredient_id, data):
        ingredient = Ingredient.get(session, ingredient_id)
        if ingredient:
            Ingredient.update_with_data(session, ingredient, data)
            return True
        return False
        
class MealIngredient(Base):
    __tablename__ = "meal_ingredients"
    meal_id = Column(Integer, ForeignKey('meals.id'), primary_key=True)
    ingredient_id = Column(Integer, ForeignKey('ingredients.id'), primary_key=True)

    quantity = Column(String(100))

class MealDay(Base):
    __tablename__ = "meal_days"
    meal_id = Column(Integer, ForeignKey('meals.id'), primary_key=True)
    day_id = Column(String(7), ForeignKey('days.id'), primary_key=True)
    
    order = Column(Integer)
