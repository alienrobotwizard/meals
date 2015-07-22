from datetime import datetime
from datetime import timedelta
from passlib.hash import pbkdf2_sha256
from sqlalchemy.sql.expression import func
from sqlalchemy.orm import relationship, backref, load_only
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy import ForeignKey, ForeignKeyConstraint, Table
from sqlalchemy import asc, desc, or_, and_, not_, CHAR, TIMESTAMP, Text, DateTime, Column, BigInteger, Integer, String

Base = declarative_base()

def pw_hash(pw):
    return pbkdf2_sha256.encrypt(pw, rounds=200000, salt_size=16)
    
class User(Base):
    __tablename__ = "user"
    email = Column(String(254), primary_key=True)
    pw = Column(String(88), nullable=False)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    required_fields = ['email', 'password']
    
    @staticmethod
    def create(session, email, password):
        if not User.exists(session, email):
            u = User(
                email=email,
                pw=pw_hash(password),
                created_at=datetime.now())
            u.updated_at = u.created_at
            session.add(u)        
            return u

    @staticmethod
    def update(session, email, password):
        u = User.get(session, email)
        u.pw = pw_hash(password)
        u.updated_at = datetime.now()
        return u

    @staticmethod
    def exists(session, email):
        user = session.query(User).get(email)
        return True if user else False
                             
    @staticmethod
    def get(session, email):
        return session.query(User).get(email)

    @staticmethod
    def authenticate(session, email, password):
        u = User.get(session, email)
        return True if u and pbkdf2_sha256.verify(password, u.pw) else False        
        
class Day(Base):
    """
    Will only contain days that actually have meals
    """
    __tablename__ = "days"

    id = Column(String(8), primary_key=True)
    date = Column(DateTime, index=True, nullable=False)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    day_meals = relationship("DayMeal", cascade="all, delete-orphan", backref="day")    
    meals = association_proxy("day_meals", "meal")
    
    def encode(self):
        r = {
            'id': self.id,
            'date': self.date.strftime('%Y-%m-%d %H:%M:%S'),
            'meals': []
        }

        if self.created_at:
            r['created_at'] = self.created_at.strftime('%Y-%m-%d %H:%M:%S')
            
        if self.updated_at:
            r['updated_at'] = self.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        
        for dm in self.day_meals:
            e = dm.meal.encode()
            e['order'] = dm.order
            r['meals'].append(e)
            
        return r
        
    @staticmethod
    def get(session, day_id):
        return session.query(Day).get(day_id)

    @staticmethod
    def list_query(session, start_day=None, end_day=None):
        q = session.query(Day)
        if start_day:
            oldest = datetime.strptime(start_day, '%Y%m%d')
            q = q.filter(Day.date >= oldest)
        if end_day:
            newest = datetime.strptime(end_day, '%Y%m%d')
            q = q.filter(Day.date < newest)
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
            for i in range(0, len(data['meals'])):
                id = data['meals'][i]
                meal = Meal.get(session, id)
                if meal:
                    day.day_meals.append(DayMeal(order=i, meal=meal))
                    
        day.updated_at = datetime.now()
        
    @staticmethod
    def create(session, data):
        day_id = data['id']
        day_date = datetime.strptime(day_id, '%Y%m%d')
        day = Day(id=day_id, date=day_date, created_at=datetime.now())
        Day.update_with_data(session, day, data)
        session.add(day)
        session.commit()
        return day

    @staticmethod
    def update(session, day_id, data):
        day = Day.get(session, day_id)
        if day:
            Day.update_with_data(session, day, data)            
        else:
            day = Day.create(session, data)
        return day
        
class Meal(Base):

    __tablename__ = "meals"
    id = Column(Integer, autoincrement=True, primary_key=True)
    title = Column(String(200), index=True, unique=True, nullable=False)
    description = Column(Text)
    recipe = Column(Text)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    meal_ingredients = relationship("MealIngredient", cascade="all, delete-orphan", backref="meal")
    ingredients = association_proxy("meal_ingredients", "ingredient")

    required_fields = ['title', 'ingredients']
    
    def encode(self):
        r = {
            'id': self.id,
            'title': self.title,            
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
            'ingredients': []
        }
        for ming in self.meal_ingredients:
            e = ming.ingredient.encode()
            e['quantity'] = ming.quantity
            r['ingredients'].append(e)
        
        if self.description:            
            r['description'] = self.description
            
        if self.recipe:
            r['recipe'] = self.recipe
            
        return r
        
    @staticmethod
    def get(session, meal_id):
        return session.query(Meal).get(meal_id)

    @staticmethod
    def get_by_title(session, title):
        q = session.query(Meal).filter(Meal.title == title)
        if q.count() > 0:
            return q.limit(1).one()
            
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
            for day_meal in DayMeal.all_by_meal(session, meal_id):
                session.delete(day_meal)                
            session.delete(meal)
            return True
        return False

    @staticmethod
    def update_with_data(session, meal, data):
        if 'title' in data:
            meal.title = data['title']
        if 'description' in data:
            meal.description = data['description']
        if 'recipe' in data:
            meal.recipe = data['recipe']
        if 'ingredients' in data:
            meal.ingredients = []
            for ing in data['ingredients']:
                quantity = ing['quantity']
                ingredient = Ingredient.get(session, ing['id'])
                if ingredient:
                    meal.meal_ingredients.append(MealIngredient(quantity=quantity, ingredient=ingredient))
        meal.updated_at = datetime.now()
        
    @staticmethod
    def create(session, data):
        title = data['title']
        meal = Meal(title=data['title'], created_at=datetime.now())
        Meal.update_with_data(session, meal, data)
        session.add(meal)
        session.commit()
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

    required_fields = ['name']
    
    def encode(self):
        r = {
            'name': self.name,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }
        if self.id:
            r['id'] = self.id
            
        if self.description:
            r['description'] = self.description
        return r
        
    @staticmethod
    def get(session, ingredient_id):
        return session.query(Ingredient).get(ingredient_id)

    @staticmethod
    def get_by_name(session, name):
        q = session.query(Ingredient).filter(Ingredient.name == name)
        if q.count() > 0:
            return q.limit(1).one()

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
            for meal_ingredient in MealIngredient.all_by_ingredient(session, ingredient_id):
                session.delete(meal_ingredient)                
            session.delete(ingredient)
            return True
        return False

    @staticmethod
    def update_with_data(session, ingredient, data):
        if 'name' in data:
            ingredient.name = data['name']
        if 'description' in data:
            ingredient.description = data['description']
                    
        ingredient.updated_at = datetime.now()
        
    @staticmethod
    def create(session, data):
        ingredient = Ingredient(name=data['name'], created_at=datetime.now())
        Ingredient.update_with_data(session, ingredient, data)        
        session.add(ingredient)
        session.commit()
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
    ingredient = relationship(Ingredient, lazy="joined")

    @staticmethod
    def all_by_ingredient(session, ingredient_id):
        return session.query(MealIngredient).filter(MealIngredient.ingredient_id == ingredient_id).all()
        
class DayMeal(Base):
    __tablename__ = "day_meals"
    meal_id = Column(Integer, ForeignKey('meals.id'), primary_key=True)
    day_id = Column(String(8), ForeignKey('days.id'), primary_key=True)
    
    order = Column(Integer)

    meal = relationship(Meal, lazy="joined")

    @staticmethod
    def all_by_meal(session, meal_id):
        return session.query(DayMeal).filter(DayMeal.meal_id == meal_id).all()
